import fs from 'fs';
import path from 'path';
import config from '../svelte.config.js';
import { LOCALES, localeFromPath, localeAlternates } from '../src/lib/i18n/routing';
import { isRedirectPage } from '../src/lib/config/redirects';
import { HIDDEN_ROUTES, isHiddenRoute } from '../src/lib/config/hiddenRoutes';
import { SITE_ORIGIN } from '../src/lib/config/site';

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

// Origin ЧИТАЄТЬСЯ з джерела правди, а не дублюється тут.
// CUSTOM-DOMAIN-v8 § 5 називає HIGH саме власну копію в гейті збірки: вона
// розходиться з рештою рівно в момент переїзду — і тоді гейт оголошує чужою
// кожну адресу сайту.
const SITE_URL = SITE_ORIGIN;
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
	return EXCLUDE.some((re) => re.test(page)) || isRedirectPage(pathname) || isHiddenRoute(pathname);
}

/**
 * Службова сторінка — перевіряти ПРОТИЛЕЖНЕ (BETA-CHECKLIST-v8 § 5.5).
 *
 * Публічна сторінка мусить мати canonical і не мати `noindex`; у службової рівно
 * навпаки. Обидві обіцянки перевіряються окремо, бо ламаються окремо: зникне
 * `noindex` — сторінка поїде в індекс; з'явиться canonical — вона почне
 * конкурувати з публічними за той самий вміст.
 *
 * ЧОМУ ЦЕ ПЕРЕВІРЯЄТЬСЯ НАД `build/`, а не в коді: у джерелах стоїть умова
 * `{#if !data.hidden}`, і що з неї вийшло, видно лише в зібраному HTML. Умова,
 * яка ніколи не спрацювала (бо прапорець не доїхав із `+layout.ts`), виглядає в
 * коді бездоганно.
 *
 * ЩЕ ОДНА ПАСТКА, і вона в самій перевірці: заміна або пошук, які нічого не
 * знайшли, дають зелений прогін, що виглядає як доказ. Тому кожен пошук нижче
 * має пару «щось знайдено» — саме тому тут перевіряється й наявність `<title>`.
 */
function checkHiddenPages(builtPaths: string[]) {
	const built = new Set(builtPaths.map((p) => (p === '' ? '/' : `/${p}`)));
	const bad: string[] = [];

	// Обидві мови: зникнути може не сторінка, а лише англійське дзеркало.
	const expected = HIDDEN_ROUTES.flatMap((route) => [route, `/en${route}`]);

	for (const route of expected) {
		if (!built.has(route)) {
			bad.push(`${route} — сторінки немає у build/ (зник маршрут або запис у prerender.entries)`);
			continue;
		}

		const file = path.join(BUILD_DIR, route.slice(1), 'index.html');
		const html = fs.readFileSync(file, 'utf8');

		if (!/<title[^>]*>[^<]/i.test(html)) {
			bad.push(`${route} — немає <title>, тобто перевірка нижче шукала б у порожньому HTML`);
		}
		if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
			bad.push(`${route} — немає noindex: службова сторінка поїде в індекс`);
		}
		if (/rel=["']canonical["']/i.test(html)) {
			bad.push(`${route} — є canonical, якого в службової сторінки бути не мусить`);
		}
		if (/rel=["']alternate["'][^>]*hreflang/i.test(html)) {
			bad.push(`${route} — є hreflang: сторінка оголошує мовну групу, якої не існує`);
		}
		// Слаг лише ASCII: кириличний гомоглиф (`с` U+0441 замість `c`) дає адресу,
		// яка виглядає правильною й не працює — у шляху вона percent-кодується, і
		// посилання, sitemap та robots.txt розходяться, а в diff різниці не видно.
		//
		// Порівняння за кодом символу, а не регуляркою з діапазоном: діапазон із
		// керівними символами вимагає inline-вимкнення правила поруч із перевіркою —
		// саме те, проти чого написаний CODE-QUALITY-v8 § 6.4.1.
		const nonAscii = [...route].filter((ch) => (ch.codePointAt(0) ?? 0) > 127);
		if (nonAscii.length > 0) {
			bad.push(`${route} — не-ASCII символи в назві маршруту: ${nonAscii.join(' ')}`);
		}
	}

	if (bad.length > 0) {
		console.error('❌ службова сторінка зібрана неправильно (BETA-CHECKLIST-v8 § 5.5):');
		for (const b of bad) console.error(`   ${b}`);
		process.exit(1);
	}
}

/**
 * І зворотний бік тієї самої обіцянки: у публічних сторінок canonical Є, а
 * `noindex` немає. Без цієї половини перевірка вище зеленіла б і на збірці, де
 * `noindex` стоїть на КОЖНІЙ сторінці — тобто на сайті, якого немає в пошуку.
 */
function checkPublicPagesIndexable(pages: string[]) {
	const bad: string[] = [];
	for (const page of pages) {
		const html = fs.readFileSync(path.join(BUILD_DIR, page, 'index.html'), 'utf8');
		const pathname = page === '' ? '/' : `/${page}`;
		if (!/rel=["']canonical["']/i.test(html)) bad.push(`${pathname} — немає canonical`);
		if (/content=["'][^"']*noindex/i.test(html)) bad.push(`${pathname} — стоїть noindex`);
	}
	if (bad.length > 0) {
		console.error('❌ публічні сторінки зібрані неправильно (SEO-v8):');
		for (const b of bad) console.error(`   ${b}`);
		process.exit(1);
	}
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
	checkHiddenPages(all);
	checkPublicPagesIndexable(pages);

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
