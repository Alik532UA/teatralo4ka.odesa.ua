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

	const blocked = inline.filter((body) => {
		const hash = `sha256-${createHash('sha256').update(body).digest('base64')}`;
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
