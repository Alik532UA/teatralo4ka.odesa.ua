import { marked } from 'marked';

/**
 * DOMPurify configuration for HTML content sanitization.
 * Shared between client-side (renderContent.ts) and server-side (loader.ts).
 */
export const DOMPURIFY_HTML_CONFIG = {
	ADD_TAGS: ['iframe'],
	ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'referrerpolicy', 'style'],
	ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Configures the shared marked renderer for link handling.
 * - Fixes monobank links (adds https:// prefix, removes trailing slash)
 * - Opens external links in a new tab with noopener/noreferrer
 * - Escapes title attribute to prevent XSS
 *
 * Call this once per environment (client/server) before parsing markdown.
 */
export function configureMarkedRenderer(): void {
	marked.use({
		renderer: {
			link(token) {
				let { href, title, tokens } = token;

				// Fix monobank links
				if (href.includes('send.monobank.ua')) {
					if (!href.startsWith('http')) href = 'https://' + href;
					// Removing trailing slash as it's often the cause of redirection issues
					href = href.replace(/\/$/, '');
					token.href = href;
				}

				const isExternal = href.startsWith('http') || href.startsWith('//');

				if (isExternal) {
					const escapedTitle = title ? title.replace(/"/g, '&quot;') : '';
					const titleAttr = escapedTitle ? ` title="${escapedTitle}"` : '';
					const innerHtml = this.parser.parseInline(tokens);
					return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${innerHtml}</a>`;
				}

				return false;
			}
		}
	});
}
