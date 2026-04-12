import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { ContentFormat } from '$lib/services/articles';
import { DOMPURIFY_HTML_CONFIG, configureMarkedRenderer } from '$lib/utils/markedConfig';

// Initialize shared marked renderer for client-side usage
configureMarkedRenderer();

/**
 * Renders article content as sanitized HTML string.
 * - markdown: passes through marked parser, then DOMPurify
 * - html: passes through DOMPurify directly (with iframe support)
 */
export function renderContent(content: string, format?: ContentFormat): string {
	if (!content) return '';

	if (format === 'html') {
		return DOMPurify.sanitize(content, DOMPURIFY_HTML_CONFIG);
	}

	return DOMPurify.sanitize(marked.parse(content) as string);
}

/**
 * Extracts plain text excerpt from content, stripping both HTML and Markdown syntax.
 */
export function getContentExcerpt(content: string, format?: ContentFormat, maxLength = 150): string {
	if (!content) return '';

	let plainText: string;
	if (format === 'html') {
		plainText = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
	} else {
		plainText = content.replace(/[#*`_\[\]()]/g, '');
	}

	plainText = plainText.replace(/\s+/g, ' ').trim();
	return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
}
