import fs from 'fs';
import path from 'path';

/**
 * Биті внутрішні посилання у зібраному сайті (SEO-v8 § 6.1).
 *
 * ## Чому цього не робив ніхто інший
 *
 * `handleHttpError: 'fail'` їх НЕ ловить, і це перевірено прямим експериментом
 * 2026-08-13: із `fallback: '404.html'` адаптер у режимі SPA, і шлях без
 * маршруту помилкою не вважається. `<a href="/does-not-exist-anywhere">` на
 * прередереній сторінці дав збірку з кодом 0 і жодної згадки в логу.
 *
 * `resolve()` типізований проти списку маршрутів, тож помилку в АДРЕСІ
 * МАРШРУТУ він ловить на компіляції. Але посилання приходять не лише з коду:
 * сторінковий вміст — це markdown у `src/lib/i18n/pages/`, а меню й статті —
 * дані з Firestore. Ці шляхи не бачить ані TypeScript, ані ESLint.
 *
 * ## Найважливіша пастка цієї перевірки
 *
 * `paths.relative` типово `true`, тож у зібраному HTML `resolve('/')` на
 * сторінці `/departments/music/` виглядає як `../../`. Наївне порівняння з
 * переліком сторінок оголосило б битим кожне посилання на сайті. Тому кожен
 * href розв'язується ВІДНОСНО адреси сторінки, у якій він стоїть.
 */

const BUILD_DIR = 'build';

/**
 * Динамічні маршрути, яких у `build/` немає навмисно: записи приходять із
 * Firestore і з'являються без перезбірки.
 *
 * Це послаблення перевірки, і його треба знати: усе під цими префіксами
 * вважається дійсним, тож помилку в слузі статті вона не побачить. Для
 * статичних дітей `/projects/` вона теж не спрацює — але їх покриває
 * типізований `resolve()`, який ловить помилку ще на компіляції.
 */
const DYNAMIC_PREFIXES = ['/news/', '/projects/'];

/** Схеми, які не є внутрішніми посиланнями. */
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function walkHtml(dir: string, out: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (fs.statSync(full).isDirectory()) {
			if (entry === '_app') continue;
			walkHtml(full, out);
		} else if (entry === 'index.html' || entry === '404.html') {
			out.push(full.split('\\').join('/'));
		}
	}
	return out;
}

/** Адреса сторінки за шляхом її файлу: `build/about/index.html` → `/about/`. */
function pageUrl(file: string): string {
	const rel = file.slice(BUILD_DIR.length).replace(/\/index\.html$/, '/');
	return rel === '/404.html' ? '/' : rel || '/';
}

/** Усе, що справді лежить у `build/` і може бути ціллю посилання. */
function builtTargets(dir: string, out = new Set<string>()): Set<string> {
	for (const entry of fs.readdirSync(dir)) {
		const full = path.join(dir, entry);
		const url = `/${path.relative(BUILD_DIR, full).split('\\').join('/')}`;
		if (fs.statSync(full).isDirectory()) {
			out.add(`${url}/`);
			builtTargets(full, out);
		} else {
			out.add(url);
			// Каталог зі сторінкою — теж дійсна ціль без імені файлу.
			if (entry === 'index.html') out.add(url.replace(/index\.html$/, ''));
		}
	}
	return out;
}

function normalize(url: string): string {
	const withoutFragment = url.split('#')[0].split('?')[0];
	if (withoutFragment === '') return '';
	// Хвостова риска не є різницею: сайт віддає `/about/`, посилання може бути
	// на `/about`. Порівнюємо обидві форми через додавання риски.
	return withoutFragment.endsWith('/') ? withoutFragment : `${withoutFragment}/`;
}

function main() {
	if (!fs.existsSync(BUILD_DIR)) {
		console.error(`❌ ${BUILD_DIR}/ не існує — посилання перевіряються після збірки`);
		process.exit(1);
	}

	const pages = walkHtml(BUILD_DIR);
	if (pages.length === 0) {
		console.error('❌ у build/ не знайдено сторінок — перевірка мертва');
		process.exit(1);
	}

	const targets = builtTargets(BUILD_DIR);
	const broken = new Map<string, Set<string>>();
	let checked = 0;

	for (const file of pages) {
		const from = pageUrl(file);
		const html = fs.readFileSync(file, 'utf8');

		for (const m of html.matchAll(/\shref\s*=\s*["']([^"']+)["']/gi)) {
			const raw = m[1].trim();
			if (raw === '' || EXTERNAL.test(raw)) continue;

			// Ось та сама пастка: `../../` розв'язується відносно сторінки.
			const absolute = new URL(raw, `https://x${from}`).pathname;
			checked++;

			if (DYNAMIC_PREFIXES.some((p) => absolute.startsWith(p) && absolute !== p)) continue;

			const candidate = normalize(absolute);
			if (targets.has(candidate) || targets.has(absolute)) continue;

			if (!broken.has(absolute)) broken.set(absolute, new Set());
			broken.get(absolute)!.add(from);
		}
	}

	if (checked === 0) {
		console.error('❌ не перевірено жодного посилання — перевірка мертва');
		process.exit(1);
	}

	if (broken.size > 0) {
		console.error(`❌ биті внутрішні посилання (${broken.size}):`);
		for (const [target, sources] of [...broken].sort()) {
			console.error(`   ${target}`);
			console.error(`      зі сторінок: ${[...sources].sort().join(', ')}`);
		}
		process.exit(1);
	}

	console.log(`🔗 посилання: ${checked} перевірено на ${pages.length} сторінках, битих немає`);
}

main();
