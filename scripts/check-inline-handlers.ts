import fs from 'fs';
import path from 'path';

/**
 * Інлайнові обробники подій у ЗІБРАНОМУ HTML (SECURITY-v8 § 6.3, § 13).
 *
 * ## Що це ловить і чому саме над `build/`
 *
 * Політика сайту не має ні `'unsafe-inline'`, ні `'unsafe-hashes'`, тож будь-який
 * атрибут `onclick="…"` / `onload="…"` у розмітці браузер ВІДМОВЛЯЄТЬСЯ виконати:
 *
 *     Executing inline event handler violates the following Content Security
 *     Policy directive 'script-src …'. Note that hashes do not apply to event
 *     handlers … The action has been blocked.
 *
 * Сторінка при цьому малюється правильно. Немає ні падіння збірки, ні червоних
 * тестів, ні зсуву розкладки — лише рядок у консолі. Це той самий клас, що й
 * заблокований `media-src` (AI-AGENT-PITFALLS-v8 § 2.1): відсутність симптому не
 * є доказом відсутності проблеми.
 *
 * ## Чому в джерелах цього не видно
 *
 * Ніхто таких атрибутів не пише. Їх додає САМ Svelte 5 під час SSR — механізм
 * відтворення подій (`onload="this.__e=event"`): якщо зображення завантажилося
 * до гідрації, подія інакше загубилася б. Компілятор вставляє ці гачки в
 * елемент, чиї атрибути задані РОЗГОРТАННЯМ (`{...obj}`): що саме в об'єкті,
 * він не знає, тож припускає найгірше.
 *
 * Заміряно 2026-08-26 на цьому проєкті: тринадцять `<img>`, переведених на
 * `{...imageSize(шлях)}`, дали тринадцять пар `onload`/`onerror` у зібраному
 * HTML і 15 порушень CSP на головній. У джерелах — жодного обробника,
 * `svelte-check` чистий, 715 юніт-перевірок зелені. Побачив це лише
 * `e2e/csp.spec.ts`, тобто гейт, що виконується не на кожній гілці.
 *
 * Виправлення — писати атрибути явно (`width={size.width}`) замість
 * розгортання; ця перевірка тримає стан.
 */

const BUILD = 'build';

/**
 * Атрибути-обробники, які справді може згенерувати збірка або недогляд у
 * розмітці. Перелік, а не `/\bon[a-z]+=/`: останнє ловить і `only=`, і
 * `data-once="…"`, і кожен новий атрибут із «on» усередині.
 */
const HANDLERS = [
	'onload',
	'onerror',
	'onclick',
	'onchange',
	'oninput',
	'onsubmit',
	'onfocus',
	'onblur',
	'onmouseover',
	'onmouseenter',
	'onkeydown',
	'onkeyup',
	'ontoggle',
	'onanimationend',
	'ontransitionend'
];

const ATTR = new RegExp(`\\s(?:${HANDLERS.join('|')})\\s*=\\s*["'][^"']*["']`, 'gi');

function htmlFiles(dir: string, out: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (fs.statSync(full).isDirectory()) htmlFiles(full, out);
		else if (entry.endsWith('.html')) out.push(full);
	}
	return out;
}

function fail(message: string): never {
	console.error(`❌ ${message}`);
	process.exit(1);
}

function main() {
	if (!fs.existsSync(BUILD)) {
		fail(`${BUILD}/ не існує — інлайнові обробники перевіряються після збірки`);
	}

	const files = htmlFiles(BUILD);
	if (files.length === 0) {
		// Canary: без нього зламаний шлях дає нуль знахідок і зелений результат.
		fail(`${BUILD}/ не містить жодного .html — перевірка дивиться не туди`);
	}

	const found: string[] = [];
	for (const file of files) {
		const html = fs.readFileSync(file, 'utf8');
		const hits = html.match(ATTR);
		if (hits) {
			const shown = [...new Set(hits.map((h) => h.trim().slice(0, 60)))];
			found.push(`${file}: ${hits.length} — ${shown.join(', ')}`);
		}
	}

	if (found.length > 0) {
		fail(
			`інлайнові обробники подій у зібраному HTML — CSP їх блокує, і сторінка ` +
				`мовчки втрачає цю дію:\n${found.join('\n')}\n` +
				`Найчастіша причина — розгортання атрибутів ({...obj}) на елементі: ` +
				`Svelte додає туди onload/onerror для відтворення подій. Писати атрибути явно`
		);
	}

	console.log(`🛡️  інлайнових обробників немає: ${files.length} сторінок у ${BUILD}/`);
}

main();
