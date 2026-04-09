import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { ContentFormat } from '$lib/services/articles';

const DOMPURIFY_HTML_CONFIG = {
	ADD_TAGS: ['iframe'],
	ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'referrerpolicy', 'style'],
	ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

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
		plainText = content.replace(/<[^>]*>/g, '');
	} else {
		plainText = content.replace(/[#*`_\[\]()]/g, '');
	}

	plainText = plainText.replace(/\s+/g, ' ').trim();
	return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
}
