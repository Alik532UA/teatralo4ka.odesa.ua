/* eslint-disable no-script-url -- це тест НА відкидання `javascript:`: без самих
   цих рядків він не перевіряв би нічого. Правило створене проти таких адрес
   у КОДІ, а тут вони є вхідними даними для перевірки. */
import { describe, expect, it } from 'vitest';
import { isSafeUrl, safeUrl } from './safeUrl';

/** `javascript` із табом усередині — так, як його побачить браузер. */
const TAB = String.fromCharCode(0x09);
const NEWLINE = String.fromCharCode(0x0a);
const NUL = String.fromCharCode(0x00);

describe('safeUrl', () => {
	it('пропускає адреси, які справді вживає сайт', () => {
		const allowed = [
			'https://teatralo4ka.odesa.ua',
			'http://example.com/path?a=1#frag',
			'HTTPS://EXAMPLE.COM',
			'mailto:hello@example.com',
			'tel:+380671234567',
			'/news',
			'/projects/[slug]',
			'#anchor',
			'?tab=promo',
			'//cdn.example.com/x.png',
			// Пробіли в параметрах запиту — законні й мають лишитися.
			'https://example.com/search?q=odesa theatre'
		];
		for (const url of allowed) {
			expect(isSafeUrl(url), url).toBe(true);
			expect(safeUrl(url), url).toBe(url.trim());
		}
	});

	it('відкидає схеми, що виконують код', () => {
		const blocked = [
			'javascript:alert(1)',
			'JavaScript:alert(1)',
			'JaVaScRiPt:alert(document.cookie)',
			'vbscript:msgbox(1)',
			'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
			'data:text/html,<script>alert(1)</script>'
		];
		for (const url of blocked) {
			expect(isSafeUrl(url), url).toBe(false);
			expect(safeUrl(url), url).toBe('#');
		}
	});

	/**
	 * Головна причина, чому тут allowlist, а не `startsWith('javascript:')`:
	 * браузер викидає керівні символи зі схеми ще до розбору, тож усі ці
	 * рядки — робочий `javascript:`, який наївна перевірка пропускає.
	 */
	it('відкидає схему, розірвану керівними символами', () => {
		const blocked = [
			`java${TAB}script:alert(1)`,
			`java${NEWLINE}script:alert(1)`,
			`java${NUL}script:alert(1)`,
			'  javascript:alert(1)',
			`${TAB}javascript:alert(1)`,
			'j a v a s c r i p t:alert(1)'
		];
		for (const url of blocked) {
			expect(isSafeUrl(url), JSON.stringify(url)).toBe(false);
			expect(safeUrl(url), JSON.stringify(url)).toBe('#');
		}
	});

	it('порожнє й не-рядок дають запасне значення', () => {
		for (const value of ['', '   ', null, undefined, 42, {}, []]) {
			expect(isSafeUrl(value), JSON.stringify(value)).toBe(false);
		}
		expect(safeUrl(undefined)).toBe('#');
		expect(safeUrl(null, '/')).toBe('/');
	});

	it('обрізає пробіли по краях, але не всередині', () => {
		expect(safeUrl('  https://example.com/a b  ')).toBe('https://example.com/a b');
	});
});
