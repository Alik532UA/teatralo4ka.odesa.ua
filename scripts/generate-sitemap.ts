import fs from 'fs';
import path from 'path';
import config from '../svelte.config.js';
import { LOCALES, localeFromPath, localeAlternates } from '../src/lib/i18n/routing';
import { isRedirectPage } from '../src/lib/config/redirects';

/**
 * Будує sitemap зі СТОРІНОК, ЯКІ СПРАВДІ ЗГЕНЕРОВАНО, а не зі списку markdown-файлів.
 *
 * Попередня версія перелічувала src/lib/i18n/pages/<lang>/*.md і видавала 28 адрес,
 * з яких існувало 5: контент цих сторінок береться з Firestore, а маршрут [slug]
 * має prerender = false. Тобто пошуковику пропонувалося 23 адреси, що
 * відповідають 404.
 *
 * Тому запускається ПІСЛЯ збірки (postbuild) і читає build/.
 *
 * Мовні адреси `/en/…` з'явилися 2026-08-14 (хук `reroute`). До того цей файл
 * англійських сторінок не давав — і коментар вище стверджував, що англомовних
 * маршрутів «немає взагалі». Це було правдою про код і НЕ було правдою про
 * PROJECT-CONTEXT, який рядком «Реалізовано в generate-sitemap.ts» роками
 * обіцяв протилежне.
 */

const SITE_URL = 'https://teatralo4ka.odesa.ua';
const BUILD_DIR = 'build';

/** Не для індексу: адмінка та технічні сторінки. */
const EXCLUDE = [/^admin(\/|$)/];

/**
 * Сторінки-заглушки в мапу сайту не потрапляють — SEO-v8 називає це CRITICAL.
 *
 * У них порожній `<body>` і `meta refresh`: пошуковику пропонувалася адреса, за
 * якою немає вмісту. Шість таких (три сторінки × дві мови) лежали в
 * `sitemap.xml` до 2026-08-14, причому E2E їх уже обходив — перелік жив у
 * `e2e/pages.ts`, тобто в тестах, куди цей скрипт не заглядає. Тепер обидва
 * читають один реєстр `src/lib/config/redirects.ts`.
 */
function isExcluded(page: string): boolean {
	const pathname = page === '' ? '/' : `/${page}`;
	return EXCLUDE.some((re) => re.test(page)) || isRedirectPage(pathname);
}

function builtPages(dir: string, prefix = ''): string[] {
	const out: string[] = [];
	for (const entry of fs.readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (fs.statSync(full).isDirectory()) {
			if (entry.startsWith('_') || entry === 'og') continue;
			out.push(...builtPages(full, prefix ? `${prefix}/${entry}` : entry));
		} else if (entry === 'index.html') {
			out.push(prefix);
		}
	}
	return out;
}

/**
 * Хвостова коса риска не є різницею між адресами.
 *
 * `prerender.entries` містить `/en/` (з рискою — так вимагає
 * `trailingSlash: 'always'` для головної), а обхід `build/` дає `/en` (без —
 * бо це назва каталогу). Без нормалізації перевірка оголосила б відсутньою
 * сторінку, яка лежить на диску: саме це й сталося на першій збірці з
 * мовними адресами.
 *
 * Регістр НЕ нормалізується навмисно — його розходження ця перевірка й ловить.
 */
function normalize(p: string): string {
	return p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p;
}

/**
 * Кожен запис `prerender.entries` мусив дати сторінку.
 *
 * SvelteKit налаштований на `handleUnseenRoutes: 'ignore'` і `handleHttpError:
 * 'warn'`, тому адреса, якої не існує, не завалює збірку і не лишає жодного
 * сліду. Так у переліку жила '/test' — маршруту немає взагалі — і
 * '/projects/spring-Odesa-theatre' з великою «O», яка збиралася лише тому, що
 * Windows не розрізняє регістр у шляхах, а Linux у CI розрізняє.
 *
 * Порівняння регістрозалежне навмисно: саме цю помилку воно й ловить.
 */
function checkPrerenderEntries(builtPaths: string[]) {
	const entries: string[] = config.kit?.prerender?.entries ?? [];
	const built = new Set(builtPaths.map((p) => normalize(p === '' ? '/' : `/${p}`)));

	const missing = entries.filter((e) => !built.has(normalize(e)));
	if (missing.length > 0) {
		console.error('❌ у prerender.entries є адреси, яких немає в build/:');
		for (const m of missing) console.error(`   ${m}`);
		console.error('   Причина зазвичай одна з двох: маршрут видалили, або розійшовся регістр.');
		process.exit(1);
	}
}

/**
 * Жодна адреса в мапі сайту не веде на порожню сторінку.
 *
 * Реєстр `redirects.ts` — це те, що МИ ЗАПАМ'ЯТАЛИ. Ця перевірка натомість
 * міряє сам `build/`, тобто ловить КЛАС, а не перелік: наступна заглушка,
 * яку забудуть внести в реєстр, завалить збірку замість того, щоб тихо поїхати
 * в індекс. SEO-v8 називає порожню сторінку в індексі CRITICAL, а такі речі не
 * видно ані в джерелах, ані оком — лише в зібраному виводі.
 *
 * Поріг 120 символів узятий із `e2e/smoke.spec.ts`, щоб дві перевірки не
 * розходилися в оцінці «порожня»: найкоротші справжні сторінки проєкту дають
 * близько 180 разом із шапкою й підвалом, зламана — близько 60.
 */
function checkNoEmptyPages(pages: string[]) {
	const MIN_TEXT = 120;
	const bad: string[] = [];

	for (const page of pages) {
		const file = path.join(BUILD_DIR, page, 'index.html');
		const html = fs.readFileSync(file, 'utf8');

		if (/http-equiv=["']refresh["']/i.test(html)) {
			bad.push(`/${page} — сторінка-перенаправлення (meta refresh), її не можна індексувати`);
			continue;
		}

		// Груба, але достатня оцінка: знімаємо script/style, потім усі теги.
		const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '';
		const text = body
			.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		if (text.length < MIN_TEXT) {
			bad.push(`/${page} — у зібраному HTML лише ${text.length} символів тексту`);
		}
	}

	if (bad.length > 0) {
		console.error('❌ у sitemap потрапили сторінки без вмісту (SEO-v8, CRITICAL):');
		for (const b of bad) console.error(`   ${b}`);
		console.error('   Заглушки перенаправлення вносяться в src/lib/config/redirects.ts.');
		process.exit(1);
	}
}

function generateSitemap() {
	if (!fs.existsSync(BUILD_DIR)) {
		console.error(`❌ ${BUILD_DIR}/ не існує — sitemap будується після збірки`);
		process.exit(1);
	}

	const all = builtPages(BUILD_DIR);
	checkPrerenderEntries(all);

	const pages = all.filter((p) => !isExcluded(p)).sort();

	if (pages.length === 0) {
		console.error('❌ у build/ не знайдено жодної сторінки — перевірка мертва');
		process.exit(1);
	}

	checkNoEmptyPages(pages);

	const today = new Date().toISOString().split('T')[0];

	// Сторінки, які справді є в build/ — щоб `<xhtml:link>` не вказував на адресу,
	// якої немає. hreflang на неіснуючу сторінку гірший за його відсутність:
	// Google трактує це як помилку розмітки і може не взяти до уваги всю групу.
	const existing = new Set(pages.map((p) => (p === '' ? '/' : `/${p}`)));

	const entries = pages.map((p) => {
		const pathname = p === '' ? '/' : `/${p}`;
		const loc = p === '' ? `${SITE_URL}/` : `${SITE_URL}/${p}`;
		// «Головна» — це і `/`, і `/en/`: обидві однаково важливі, тож пріоритет
		// у них однаковий. Порівняння через `stripLocale` замість `p === ''`,
		// інакше англійська головна поїхала б із priority 0.8 як внутрішня.
		const isHome = pathname === '/' || pathname === `/${localeFromPath(pathname)}`;

		const alternates = localeAlternates(pathname)
			.filter(({ path: alt }) => existing.has(alt === '/' ? '/' : alt.replace(/\/$/, '')))
			.map(
				({ locale, path: alt }) =>
					`\n    <xhtml:link rel="alternate" hreflang="${locale}" href="${SITE_URL}${alt}" />`
			)
			.join('');

		return `
  <url>
    <loc>${loc}</loc>${alternates}
    <lastmod>${today}</lastmod>
    <changefreq>${isHome ? 'weekly' : 'monthly'}</changefreq>
    <priority>${isHome ? '1.0' : '0.8'}</priority>
  </url>`;
	});

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}
</urlset>
`;

	fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), xml);

	const perLocale = LOCALES.map(
		(l) => `${l}: ${pages.filter((p) => localeFromPath(p === '' ? '/' : `/${p}`) === l).length}`
	).join(', ');
	console.log(`✅ sitemap: ${pages.length} сторінок (${perLocale}) — усі перевірені в ${BUILD_DIR}/`);
}

generateSitemap();
