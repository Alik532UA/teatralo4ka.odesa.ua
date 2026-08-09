// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getContentExcerpt, renderContent } from './renderContent';

/**
 * Docblock `node` тут не для зручності, а і є перевіркою (SECURITY-v8 § 5).
 *
 * Модуль довго імпортував звичайний `dompurify`. Без DOM у нього немає навіть
 * методу `sanitize`: виклик кидає «DOMPurify.sanitize is not a function».
 * У браузері все працювало, тож помітити це можна було лише там, де DOM немає
 * — у prerender або в node-тесті. Якщо хтось поверне звичайний імпорт, ці
 * тести впадуть одразу; jsdom-оточення сховало б регресію.
 */

const XSS = '<img src=x onerror="alert(1)"><script>alert(2)</script>текст';

describe('renderContent — markdown', () => {
	it('перетворює markdown на HTML', () => {
		expect(renderContent('# Заголовок')).toContain('<h1');
	});

	it('вирізає скрипт і обробники подій', () => {
		const out = renderContent(XSS);
		expect(out).not.toContain('<script');
		expect(out).not.toContain('onerror');
		expect(out).toContain('текст');
	});

	it('порожній вхід дає порожній рядок', () => {
		expect(renderContent('')).toBe('');
	});
});

describe('renderContent — формат html', () => {
	it('лишає розмітку, але прибирає небезпечне', () => {
		const out = renderContent('<p><b>жирний</b></p>' + XSS, 'html');
		expect(out).toContain('<b>жирний</b>');
		expect(out).not.toContain('<script');
		expect(out).not.toContain('onerror');
	});

	it('дозволяє iframe — цього вимагає вбудоване відео в статтях', () => {
		const out = renderContent('<iframe src="https://www.youtube.com/embed/x"></iframe>', 'html');
		expect(out).toContain('<iframe');
	});
});

describe('getContentExcerpt', () => {
	it('прибирає розмітку з html разом із вмістом скрипта', () => {
		// DOMPurify викидає <script> цілком, а не лише теги — тому тіло скрипта
		// не потрапляє в опис сторінки. Наївний regexp лишив би там «alert(1)».
		const out = getContentExcerpt('<p>Привіт</p><script>alert(1)</script>', 'html');
		expect(out).toBe('Привіт');
	});

	it('прибирає markdown-синтаксис', () => {
		expect(getContentExcerpt('# Заголовок *курсив*')).toBe('Заголовок курсив');
	});

	it('обрізає до заданої довжини', () => {
		const out = getContentExcerpt('а'.repeat(300), undefined, 50);
		expect(out).toHaveLength(53); // 50 + '...'
		expect(out.endsWith('...')).toBe(true);
	});
});
