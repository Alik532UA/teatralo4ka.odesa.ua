import { marked } from 'marked';
// isomorphic-, а не звичайний dompurify: без DOM у нього немає навіть методу
// `sanitize` — виклик кидає «DOMPurify.sanitize is not a function». Зараз це
// не видно, бо жоден із викликів не потрапляє в prerender: статті вантажаться
// з Firestore уже в браузері. Але `getContentExcerpt` викликається з
// articles.ts, і щойно [slug] почне прередеритися, збірка впаде.
// Решта файлів проєкту вже на isomorphic — цей був єдиним винятком.
import DOMPurify from 'isomorphic-dompurify';
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

	return DOMPurify.sanitize(marked.parse(content) as string, DOMPURIFY_HTML_CONFIG);
}

/**
 * Extracts plain text excerpt from content, stripping both HTML and Markdown syntax.
 */
export function getContentExcerpt(content: string, format?: ContentFormat, maxLength = 150): string {
	if (!content) return '';

	// Обидва формати йдуть одним шляхом: спершу в HTML, потім теги геть.
	//
	// Раніше markdown не парсився, а з нього просто викидалися символи
	// `#*`_[]()`. Дужки зникали — і текст посилання склеювався з адресою:
	// `[«Одеса.Театр.PRO»](http://Одеса.Театр.PRO)` давало
	// «Одеса.Театр.PRO»http://Одеса.Театр.PRO прямо в опис картки новини.
	// Зображення на початку статті було ще гірше: `![Обкладинка](…/a.jpg)`
	// перетворювалося на «!Обкладинкаhttps://…/a.jpg».
	//
	// html-гілка робила правильно з самого початку, тож тут не новий підхід,
	// а той самий, застосований до обох форматів.
	const html = format === 'html' ? content : (marked.parse(content) as string);

	// Межі абзаців стають переносами ДО зняття тегів.
	//
	// Раніше тут стояло `\s+ -> ' '`, і разом із зайвими пробілами зникали
	// переноси між абзацами: оголошення з п'яти рядків («…з 17 серпня»,
	// «Софіївська, 24», «чекає на учнів…») перетворювалося в описі картки на
	// одну суцільну стрічку, де дата злипалася з адресою. На сторінці новини
	// той самий текст стоїть рядками, і опис має читатися так само.
	//
	// marked уже ставить `\n` після блокових тегів, тож для markdown вставляти
	// нічого не треба. Вставка потрібна для html із візуального редактора: там
	// теги йдуть суцільно, без переносів між ними.
	const withBreaks = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>(?!\n)/gi, '$&\n');

	const plainText = DOMPurify.sanitize(withBreaks, { ALLOWED_TAGS: [] })
		// Сутності лишаються від санітайзера текстом: «&amp;» замість «&».
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		// Горизонтальні пробіли стискаються, переноси лишаються. Три й більше
		// поспіль — це порожні абзаци розмітки, з них досить одного рядка.
		.replace(/[^\S\n]+/g, ' ')
		.replace(/ ?\n ?/g, '\n')
		.replace(/\n{2,}/g, '\n')
		.trim();

	return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
}
