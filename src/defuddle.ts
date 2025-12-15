import { MetadataExtractor } from './metadata';
import { DefuddleOptions, DefuddleResponse, MetaTagItem } from './types';
import { ExtractorRegistry } from './extractor-registry';
import {
	BLOCK_ELEMENTS,
	EXACT_SELECTORS,
	PARTIAL_SELECTORS,
	ENTRY_POINT_ELEMENTS,
	TEST_ATTRIBUTES
} from './constants';
import { standardizeContent } from './standardize';
import { ContentScorer, ContentScore } from './scoring';
import { createMarkdownContent } from './markdown';

export class Defuddle {
	private readonly doc: Document;
	private options: DefuddleOptions;
	private debug: boolean;

	/**
	 * Create a new Defuddle instance
	 * @param doc - The document to parse
	 * @param options - Options for parsing
	 */
	constructor(doc: Document, options: DefuddleOptions = {}) {
		this.doc = doc;
		this.options = options;
		this.debug = options.debug || false;
	}

	/**
	 * Parse the document and extract its main content
	 */
	parse(): DefuddleResponse {
		// Try first with default settings
		const result = this.parseInternal();

		// If result has very little content, try again without clutter removal
		if (result.wordCount < 200) {
			this._log('Initial parse returned very little content, trying again');
			const retryResult = this.parseInternal({ 
				removePartialSelectors: false 
			});
			
			// Return the result with more content
			if (retryResult.wordCount > result.wordCount) {
				this._log('Retry produced more content');
				return retryResult;
			}
		}

		return result;
	}

	/**
	 * Internal parse method that does the actual work
	 */
	private parseInternal(overrideOptions: Partial<DefuddleOptions> = {}): DefuddleResponse {
		const startTime = Date.now();
		const options = {
			removeExactSelectors: true,
			removePartialSelectors: true,
			...this.options,
			...overrideOptions
		};

		const toMarkdown = (html: string) => createMarkdownContent(html, this.doc);

		// Extract schema.org data
		const schemaOrgData = this._extractSchemaOrgData(this.doc);

		// Collect meta tags
		const pageMetaTags: MetaTagItem[] = [];
		this.doc.querySelectorAll('meta').forEach(meta => {
			const name = meta.getAttribute('name');
			const property = meta.getAttribute('property');
			let content = meta.getAttribute('content');
			if (content) { // Only include tags that have content
				pageMetaTags.push({ name, property, content: this._decodeHTMLEntities(content) });
			}
		});

		// Extract metadata
		const metadata = MetadataExtractor.extract(this.doc, schemaOrgData, pageMetaTags);

		if (options.removeImages) {
			this.removeImages(this.doc);
		}

		try {
			// Use site-specific extractor first, if there is one
			const url = options.url || this.doc.URL;
			const extractor = ExtractorRegistry.findExtractor(this.doc, url, schemaOrgData);
			if (extractor && extractor.canExtract()) {
				const extracted = extractor.extract();
				const endTime = Date.now();
				return {
					content: toMarkdown(extracted.contentHtml),
					title: extracted.variables?.title || metadata.title,
					description: metadata.description,
					domain: metadata.domain,
					favicon: metadata.favicon,
					image: metadata.image,
					published: extracted.variables?.published || metadata.published,
					author: extracted.variables?.author || metadata.author,
					site: metadata.site,
					schemaOrgData: metadata.schemaOrgData,
					wordCount: this.countWords(extracted.contentHtml),
					parseTime: Math.round(endTime - startTime),
					extractorType: extractor.constructor.name.replace('Extractor', '').toLowerCase(),
					metaTags: pageMetaTags
				};
			}

			// Continue if there is no extractor...

			// Clone document
			const clone = this.doc.cloneNode(true) as Document;

			// Find main content
			const mainContent = this.findMainContent(clone);
			if (!mainContent) {
				const endTime = Date.now();
				const html = this.doc.body.innerHTML;
				return {
					content: toMarkdown(html),
					...metadata,
					wordCount: this.countWords(html),
					parseTime: Math.round(endTime - startTime),
					metaTags: pageMetaTags
				};
			}	

			// Remove non-content blocks by scoring
			// Tries to find lists, navigation based on text content and link density
			ContentScorer.scoreAndRemove(clone, this.debug);

			// Remove clutter using selectors
			if (options.removeExactSelectors || options.removePartialSelectors) {
				this.removeBySelector(clone, options.removeExactSelectors, options.removePartialSelectors);
			}

			// Normalize the main content
			standardizeContent(mainContent, metadata, this.doc, this.debug);

			const html = mainContent.outerHTML;
			const endTime = Date.now();

			return {
				content: toMarkdown(html),
				...metadata,
				wordCount: this.countWords(html),
				parseTime: Math.round(endTime - startTime),
				metaTags: pageMetaTags
			};
		} catch (error) {
			console.error('Defuddle', 'Error processing document:', error);
			const endTime = Date.now();
			const html = this.doc.body.innerHTML;
			return {
				content: toMarkdown(html),
				...metadata,
				wordCount: this.countWords(html),
				parseTime: Math.round(endTime - startTime),
				metaTags: pageMetaTags
			};
		}
	}

	private countWords(content: string): number {
		// Create a temporary div to parse HTML content
		const tempDiv = this.doc.createElement('div');
		tempDiv.innerHTML = content;

		// Get text content, removing extra whitespace
		const text = tempDiv.textContent || '';
		const words = text
			.trim()
			.replace(/\s+/g, ' ') // Replace multiple spaces with single space
			.split(' ')
			.filter(word => word.length > 0); // Filter out empty strings

		return words.length;
	}

	// Make all other methods private by removing the static keyword and using private
	private _log(...args: any[]): void {
		if (this.debug) {
			console.log('Defuddle:', ...args);
		}
	}

	private removeImages(doc: Document) {
		// Remove pure media elements
		const mediaTags = ['img', 'picture', 'video', 'source'];
		mediaTags.forEach(tag => {
			const elements = doc.getElementsByTagName(tag);
			Array.from(elements).forEach(el => el.remove());
		});

		// For figures: remove empty ones, keep those with content (tables, code, captions)
		const figures = doc.getElementsByTagName('figure');
		Array.from(figures).forEach(figure => {
			// Check if figure has meaningful content after image removal
			const hasTable = figure.querySelector('table');
			const hasCode = figure.querySelector('pre, code');
			const hasMath = figure.querySelector('math, .MathJax, .katex');
			const caption = figure.querySelector('figcaption');
			const captionText = caption?.textContent?.trim() || '';

			// Keep figure if it has non-image content
			if (hasTable || hasCode || hasMath || captionText.length > 20) {
				return; // Keep this figure
			}

			// Remove empty or image-only figures
			figure.remove();
		});
	}

	private removeBySelector(doc: Document, removeExact: boolean = true, removePartial: boolean = true) {
		const startTime = Date.now();
		let exactSelectorCount = 0;
		let partialSelectorCount = 0;

		// Track all elements to be removed
		const elementsToRemove = new Set<Element>();

		// First collect elements matching exact selectors
		if (removeExact) {
			const exactElements = doc.querySelectorAll(EXACT_SELECTORS.join(','));
			exactElements.forEach(el => {
				if (el?.parentNode) {
					elementsToRemove.add(el);
					exactSelectorCount++;
				}
			});
		}

		if (removePartial) {
			// Pre-compile regexes and combine into a single regex for better performance
			const combinedPattern = PARTIAL_SELECTORS.join('|');
			const partialRegex = new RegExp(combinedPattern, 'i');

			// Create an efficient attribute selector for elements we care about
			const attributeSelector = TEST_ATTRIBUTES.map(attr => `[${attr}]`).join(',');
			const allElements = doc.querySelectorAll(attributeSelector);

			// Process elements for partial matches
			allElements.forEach(el => {
				// Skip if already marked for removal
				if (elementsToRemove.has(el)) {
					return;
				}

				// Get all relevant attributes and combine into a single string
				const attrs = TEST_ATTRIBUTES.map(attr => {
					if (attr === 'class') {
						return el.className && typeof el.className === 'string' ? el.className : '';
					}
					if (attr === 'id') {
						return el.id || '';
					}
					return el.getAttribute(attr) || '';
				}).join(' ').toLowerCase();

				// Skip if no attributes to check
				if (!attrs.trim()) {
					return;
				}

				// Check for partial match using single regex test
				if (partialRegex.test(attrs)) {
					elementsToRemove.add(el);
					partialSelectorCount++;
				}
			});
		}

		// Remove all collected elements in a single pass
		elementsToRemove.forEach(el => el.remove());

		const endTime = Date.now();
		this._log('Removed clutter elements:', {
			exactSelectors: exactSelectorCount,
			partialSelectors: partialSelectorCount,
			total: elementsToRemove.size,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});
	}

	private findMainContent(doc: Document): Element | null {
		// Find all potential content containers
		const candidates: { element: Element; score: number }[] = [];

		ENTRY_POINT_ELEMENTS.forEach((selector, index) => {
			const elements = doc.querySelectorAll(selector);
			elements.forEach(element => {
				// Base score from selector priority (earlier = higher)
				let score = (ENTRY_POINT_ELEMENTS.length - index) * 40;

				// Add score based on content analysis
				score += ContentScorer.scoreElement(element);
				
				candidates.push({ element, score });
			});
		});

		if (candidates.length === 0) {
			// Fall back to scoring block elements
			return this.findContentByScoring(doc);
		}

		// Sort by score descending
		candidates.sort((a, b) => b.score - a.score);
		
		if (this.debug) {
			this._log('Content candidates:', candidates.map(c => ({
				element: c.element.tagName,
				selector: this.getElementSelector(c.element),
				score: c.score
			})));
		}

		// If we only matched body, try table-based detection
		if (candidates.length === 1 && candidates[0].element.tagName.toLowerCase() === 'body') {
			const tableContent = this.findTableBasedContent(doc);
			if (tableContent) {
				return tableContent;
			}
		}

		return candidates[0].element;
	}

	private findTableBasedContent(doc: Document): Element | null {
		// First check if this looks like an old-style table-based layout
		const tables = Array.from(doc.getElementsByTagName('table'));
		const hasTableLayout = tables.some(table => {
			const width = parseInt(table.getAttribute('width') || '0');
			const inlineStyle = table.getAttribute('style') || '';
			const inlineWidthMatch = inlineStyle.match(/width:\s*(\d+)px/);
			const inlineWidth = inlineWidthMatch ? parseInt(inlineWidthMatch[1]) : 0;
			return width > 400 ||
				inlineWidth > 400 ||
				table.getAttribute('align') === 'center' ||
				table.className.toLowerCase().includes('content') ||
				table.className.toLowerCase().includes('article');
		});

		if (!hasTableLayout) {
			return null; // Don't try table-based extraction for modern layouts
		}

		const cells = Array.from(doc.getElementsByTagName('td'));
		return ContentScorer.findBestElement(cells);
	}

	private findContentByScoring(doc: Document): Element | null {
		const candidates: ContentScore[] = [];

		BLOCK_ELEMENTS.forEach((tag: string) => {
			Array.from(doc.getElementsByTagName(tag)).forEach((element: Element) => {
				const score = ContentScorer.scoreElement(element);
				if (score > 0) {
					candidates.push({ score, element });
				}
			});
		});

		return candidates.length > 0 ? candidates.sort((a, b) => b.score - a.score)[0].element : null;
	}

	private getElementSelector(element: Element): string {
		const parts: string[] = [];
		let current: Element | null = element;

		while (current && current !== this.doc.documentElement) {
			let selector = current.tagName.toLowerCase();
			if (current.id) {
				selector += '#' + current.id;
			} else if (current.className && typeof current.className === 'string') {
				selector += '.' + current.className.trim().split(/\s+/).join('.');
			}
			parts.unshift(selector);
			current = current.parentElement;
		}

		return parts.join(' > ');
	}

	private _extractSchemaOrgData(doc: Document): any {
		const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
		const rawSchemaItems: any[] = [];

		schemaScripts.forEach(script => {
			let jsonContent = script.textContent || '';
			
			try {
				jsonContent = jsonContent
					.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')
					.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
					.replace(/^\s*(\*\/|\/\*)\s*|\s*(\*\/|\/\*)\s*$/g, '')
					.trim();
					
				const jsonData = JSON.parse(jsonContent);

				if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
					rawSchemaItems.push(...jsonData['@graph']);
				} else {
					rawSchemaItems.push(jsonData);
				}
			} catch (error) {
				console.error('Defuddle: Error parsing schema.org data:', error);
				if (this.debug) {
					console.error('Defuddle: Problematic JSON content:', jsonContent);
				}
			}
		});

		const decodeStringsInObject = (item: any): any => {
			if (typeof item === 'string') {
				return this._decodeHTMLEntities(item);
			} else if (Array.isArray(item)) {
				return item.map(decodeStringsInObject);
			} else if (typeof item === 'object' && item !== null) {
				const newItem: { [key: string]: any } = {};
				for (const key in item) {
					if (Object.prototype.hasOwnProperty.call(item, key)) {
						newItem[key] = decodeStringsInObject(item[key]);
					}
				}
				return newItem;
			}
			return item;
		};

		return rawSchemaItems.map(decodeStringsInObject);
	}

	private _decodeHTMLEntities(text: string): string {
		const textarea = this.doc.createElement('textarea');
		textarea.innerHTML = text;
		return textarea.value;
	}
} 
