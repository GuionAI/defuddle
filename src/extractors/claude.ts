import { ConversationExtractor } from './_conversation';
import { ConversationMessage, ConversationMetadata } from '../types/extractors';

export class ClaudeExtractor extends ConversationExtractor {
	private articles: NodeListOf<Element> | null;

	constructor(document: Document, url: string) {
		super(document, url);
		// Find all message blocks - both user and assistant messages
		this.articles = document.querySelectorAll('div[data-testid="user-message"], div[data-testid="assistant-message"], div.font-claude-message');
	}

	canExtract(): boolean {
		return !!this.articles && this.articles.length > 0;
	}

	protected extractMessages(): ConversationMessage[] {
		const messages: ConversationMessage[] = [];

		if (!this.articles) return messages;

		this.articles.forEach((article) => {
			let role: string;
			let content: string;

			if (article.hasAttribute('data-testid')) {
				// Handle user messages
				if (article.getAttribute('data-testid') === 'user-message') {
					role = 'you';
					content = article.innerHTML;
				}
				// Skip non-message elements
				else {
					return;
				}
			} else if (article.classList.contains('font-claude-message')) {
				// Handle Claude messages
				role = 'assistant';
				content = article.innerHTML;
			} else {
				// Skip unknown elements
				return;
			}

			if (content) {
				messages.push({
					author: role === 'you' ? 'You' : 'Claude',
					content: content.trim(),
					metadata: {
						role: role
					}
				});
			}
		});

		return messages;
	}

	protected getMetadata(): ConversationMetadata {
		const title = this.getTitle();
		const messages = this.extractMessages();

		return {
			title,
			site: 'Claude',
			url: this.url,
			messageCount: messages.length,
			description: `Claude conversation with ${messages.length} messages`
		};
	}

	private getTitle(): string {
		// Try page title (handles both "- Claude" and "| Claude" suffixes)
		const pageTitle = this.document.title?.trim();
		if (pageTitle && pageTitle !== 'Claude') {
			return pageTitle.replace(/\s*[-|]\s*Claude$/, '');
		}

		// Fall back to first user message text
		const firstArticle = this.articles?.item(0);
		if (firstArticle?.getAttribute('data-testid') === 'user-message') {
			const text = firstArticle.textContent?.trim() || '';
			if (text) {
				return text.length > 50 ? text.slice(0, 50) + '...' : text;
			}
		}

		return 'Claude Conversation';
	}
} 