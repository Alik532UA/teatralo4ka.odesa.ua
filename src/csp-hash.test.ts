// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../svelte.config.js';

/**
 * Хеш інлайн-скрипта у CSP мусить збігатися з тим, що обчислить БРАУЗЕР
 * (SECURITY-v8 § 6, CODE-QUALITY-v8 § 6.4).
 *
 * ## Що саме тут зламалося (знайдено 2026-08-23)
 *
 * Браузер хешує не байти файлу, а текстовий вузол `<script>` ПІСЛЯ розбору
 * HTML, а розбір нормалізує `\r\n` у `\n` («preprocessing the input stream» у
 * HTML Standard). На Windows із `core.autocrlf` файл `src/app.html` лежить із
 * CRLF, тож `svelte.config.js` обчислював хеш над CRLF-текстом:
 *
 *   CRLF → sha256-gZ7ZVRfzFfd5h4FQkuj8N8PLpGEHXZsQmbA0Xk4TmBM=   (ішло в CSP)
 *   LF   → sha256-go+B8c0R7F7waorBzlHweJGjRFwYXYU6BXDgSoH7a38=   (вимагав браузер)
 *
 * Наслідок — блокування ВСЬОГО скрипта першого кадру: `data-splash` не
 * виставлявся (заставка-куліси не вмикалася, лишався суцільний жовтий фон),
 * анти-FOUC тема не працювала, клас смуги прокрутки не ставився. Сторінка при
 * цьому малюється, тому дефект не виглядав дефектом.
 *
 * ## Чому цього не зловив наявний `e2e/csp.spec.ts`
 *
 * Він перевіряє рівно те, що треба — `html[data-splash]` існує, — але:
 *   • на Linux (CI, продакшн) файл із LF, хеші збігаються, дефекту немає;
 *   • E2E у цьому проєкті живе лише в `deploy.yml` (тригер `push: main`), бо
 *     потребує секретів, яких Dependabot-PR не отримує.
 * Тобто перевірка була зелена там, де дефекту немає, і не запускалася там, де
 * він є. Рівно клас AI-AGENT-PITFALLS-v8 § 1.4.
 *
 * Тому ця перевірка — ЮНІТ: вона виконується в `gates.yml` на кожному пуші в
 * будь-яку гілку, без секретів і без браузера.
 */

/** Рівно те, що робить HTML-парсер із текстом скрипта перед хешуванням. */
function asBrowserSees(text: string): string {
	return text.replace(/\r\n/g, '\n');
}

function inlineScript(): string {
	const html = readFileSync('src/app.html', 'utf8');
	const open = '<script>';
	const close = '</' + 'script>';
	const start = html.indexOf(open);
	const end = html.indexOf(close, start);
	if (start < 0 || end < 0) throw new Error('app.html: інлайн-скрипт не знайдено');
	return html.slice(start + open.length, end);
}

const sha256 = (text: string) =>
	`sha256-${createHash('sha256').update(text).digest('base64')}`;

/** Хеші зі зібраного конфігу — те, що справді поїде в заголовок. */
const cspHashes: string[] = (() => {
	const directive = (config as { kit?: { csp?: { directives?: Record<string, string[]> } } }).kit
		?.csp?.directives?.['script-src'];
	return (directive ?? []).filter((value) => value.startsWith('sha256-'));
})();

describe('CSP: хеш інлайн-скрипта збігається з тим, що обчислить браузер', () => {
	it('перевірка жива: у конфігу є хоч один sha256 у script-src', () => {
		expect(
			cspHashes.length,
			'у script-src немає жодного sha256 — або CSP не налаштована, або розбір конфігу зламався'
		).toBeGreaterThan(0);
	});

	it('хеш обчислено над текстом із LF, а не з CRLF', () => {
		const raw = inlineScript();
		const browserHash = sha256(asBrowserSees(raw));
		expect(
			cspHashes,
			`браузер вимагає ${browserHash}, а в script-src лежить ${cspHashes.join(', ')}. ` +
				'Якщо різниця лише в переносах рядків — хеш обчислено над CRLF; ' +
				'`inlineThemeScript()` у svelte.config.js мусить прибирати \\r.'
		).toContain(browserHash);
	});

	it('CRLF-хеш у політику НЕ потрапляє', () => {
		const raw = inlineScript();
		if (!raw.includes('\r')) return; // на Linux порівнювати нема з чим
		const crlfHash = sha256(raw);
		expect(
			cspHashes,
			`у script-src лежить хеш над CRLF (${crlfHash}) — браузер його не приймає`
		).not.toContain(crlfHash);
	});

	/**
	 * Скрипт першого кадру мусить робити те, що обіцяє: без `data-splash`
	 * заставка-куліси не вмикається, і саме цей рядок є найдешевшим доказом, що
	 * блокування помітять. Перевірка текстова — виконання перевіряє E2E.
	 */
	it('інлайн-скрипт справді виставляє data-splash', () => {
		expect(
			inlineScript(),
			'у скрипті першого кадру немає setAttribute(\'data-splash\') — ' +
				'варіант заставки не увімкнеться, лишиться суцільний фон'
		).toContain("setAttribute('data-splash'");
	});
});
