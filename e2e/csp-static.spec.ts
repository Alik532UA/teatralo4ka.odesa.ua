import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * Перевірка політики над зібраним HTML, без браузера.
 *
 * Браузерна перевірка консолі потрібна, але її недостатньо, і це з'ясувалося
 * дорогою ціною: коли хеш інлайн-скрипта прибрали навмисно, жоден із 24
 * браузерних тестів не впав. Причина — розташування: `<meta>` з політикою
 * діяла лише на те, що йде після неї, а скрипти стояли вище, тож CSP їх не
 * стосувалася взагалі. Тепер порядок виправлений в `app.html`, а ця перевірка
 * стежить, щоб він таким і лишався.
 */
const HTML = 'build/index.html';

function html() {
	return readFileSync(HTML, 'utf8');
}

function cspContent(source: string) {
	const meta = source.match(/<meta[^>]*Content-Security-Policy[^>]*>/i)?.[0];
	expect(meta, 'у зібраному HTML немає <meta> з політикою').toBeTruthy();
	return meta!.match(/content="([^"]*)"/i)?.[1] ?? '';
}

test('політика оголошена раніше за будь-який скрипт', () => {
	const source = html();
	const csp = source.search(/<meta[^>]*Content-Security-Policy/i);
	const firstScript = source.search(/<script[\s>]/i);

	expect(csp, 'мета-політика відсутня').toBeGreaterThan(-1);
	expect(
		csp,
		`політика на позиції ${csp}, а перший <script> на ${firstScript} — усе, що вище, політика не покриває`
	).toBeLessThan(firstScript);
});

test('кожен інлайн-скрипт дозволено хешем', () => {
	const source = html();
	const csp = cspContent(source);

	// Тільки виконувані: <script type="application/ld+json"> — блок даних,
	// браузер його не виконує, і script-src до нього не застосовується.
	const inline = [...source.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
		.filter(([, attrs]) => !/type="application\/ld\+json"/i.test(attrs))
		.map(([, , body]) => body);

	expect(inline.length, 'інлайн-скриптів не знайдено — перевірка мертва').toBeGreaterThan(0);

	/*
	 * ПЕРЕНЕСЕННЯ РЯДКІВ НОРМАЛІЗУЮТЬСЯ, і це не дрібниця — це та сама пастка, що
	 * колись зламала заставку, лише тепер у самій перевірці.
	 *
	 * Браузер хешує НЕ байти файлу, а текстовий вузол `<script>` після розбору
	 * HTML, а розбір перетворює `\r\n` на `\n` ще до появи DOM (HTML Standard,
	 * «preprocessing the input stream»). На Windows файл лежить із CRLF, тож хеш
	 * від сирих байтів не збігається ні з політикою, ні з тим, що вимагатиме
	 * браузер:
	 *
	 *   сирі байти (CRLF) → sha256-Wp/ZAinbEpIbGsGEg7zuPYm32MjBsZt51+586EIzjaM=
	 *   після розбору (LF) → sha256-h4GKPmHQehhC3Jtw2z3/CbPPkTxB/rBd+oB0aQwGURw=
	 *
	 * Друге і є в політиці — `svelte.config.js` рахує саме так (SECURITY-v8
	 * § 6.3.1, `SEC-CSP-HASH-EOL`). Тобто перевірка звітувала «політика заблокує
	 * цей скрипт мовчки» на цілком робочому сайті, і лише на Windows: у CI
	 * (Linux, LF) вона зелена. Червоний гейт, причина якого не в коді, — це той
	 * гейт, який зрештою вимикають.
	 */
	const blocked = inline.filter((body) => {
		const asParsed = body.replace(/\r\n/g, '\n');
		const hash = `sha256-${createHash('sha256').update(asParsed).digest('base64')}`;
		return !csp.includes(hash);
	});

	expect(
		blocked.map((b) => b.trim().slice(0, 70).replace(/\s+/g, ' ')),
		'ці скрипти політика заблокує мовчки'
	).toEqual([]);
});

/**
 * Політика мусить дозволяти те, що дозволяє санітайзер.
 *
 * Двічі одна й та сама пастка: код готує ресурс, а політика його не пускає, і
 * виглядає це не як помилка, а як «щось не працює». Зі звуком піаніно —
 * відсутній `media-src`; з відео в статтях — `<iframe>`, який DOMPurify
 * пропускає навмисно (`DOMPURIFY_HTML_CONFIG.ADD_TAGS`), а `frame-src` не
 * дозволяв.
 *
 * Перевірка груба — саме перелік директив, а не поведінка, — але вона ловить
 * найтихіший різновид: фолбек на `default-src`.
 */
test('директиви для медіа та фреймів задані явно', () => {
	const csp = cspContent(html());

	// Без явної директиви спрацьовує default-src 'self', і зовнішній ресурс
	// блокується мовчки.
	expect(csp, "media-src відсутній — звук піде через default-src 'self'").toContain('media-src');
	expect(csp, 'frame-src відсутній — вбудоване відео покаже порожню рамку').toContain('frame-src');
	// Firebase App Check створює Worker із blob. Без явної директиви поведінка
	// різниться між dev і продакшном, бо політика доставляється по-різному:
	// заголовком із nonce у dev і мета-тегом без нього у збірці.
	expect(csp, 'worker-src відсутній — App Check піде через script-src').toContain('worker-src');

	const frameSrc = csp.match(/frame-src([^;]*)/)?.[1] ?? '';
	expect(frameSrc, 'санітайзер дозволяє iframe заради відео — джерело має бути в політиці')
		.toContain('youtube.com');
});

test('нема ані unsafe-inline, ані unsafe-eval у script-src', () => {
	const scriptSrc = cspContent(html()).match(/script-src([^;]*)/)?.[1] ?? '';
	expect(scriptSrc, 'script-src відсутній').not.toBe('');
	expect(scriptSrc).not.toContain("'unsafe-inline'");
	expect(scriptSrc).not.toContain("'unsafe-eval'");
});
