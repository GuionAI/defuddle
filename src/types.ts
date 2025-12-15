export interface DefuddleMetadata {
	title: string;
	description: string;
	domain: string;
	favicon: string;
	image: string;
	parseTime: number;
	published: string;
	author: string;
	site: string;
	schemaOrgData: any;
	wordCount: number;
}

export interface MetaTagItem {
	name?: string | null;
	property?: string | null;
	content: string | null;
}

export interface DefuddleResponse extends DefuddleMetadata {
	content: string;
	extractorType?: string;
	metaTags?: MetaTagItem[];
}

export interface DefuddleOptions {
	/** URL of the page being parsed */
	url?: string;
	/** Enable debug logging */
	debug?: boolean;
	/** Remove all images */
	removeImages?: boolean;
	/** Remove elements matching exact selectors (ads, social buttons, etc) */
	removeExactSelectors?: boolean;
	/** Remove elements matching partial selectors */
	removePartialSelectors?: boolean;
}

export interface ExtractorVariables {
	[key: string]: string;
}

export interface ExtractedContent {
	title?: string;
	author?: string;
	published?: string;
	content?: string;
	contentHtml?: string;
	variables?: ExtractorVariables;
} 
