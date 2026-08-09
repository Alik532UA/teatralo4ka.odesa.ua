import fs from 'fs';
import path from 'path';

/**
 * Будує sitemap зі СТОРІНОК, ЯКІ СПРАВДІ ЗГЕНЕРОВАНО, а не зі списку markdown-файлів.
 *
 * Попередня версія перелічувала src/lib/i18n/pages/<lang>/*.md і видавала 28 адрес,
 * з яких існувало 5: контент цих сторінок береться з Firestore, маршрут [slug]
 * має prerender = false, а англомовних маршрутів у проєкті немає взагалі. Тобто
 * пошуковику пропонувалося 23 адреси, що відповідають 404.
 *
 * Тому запускається ПІСЛЯ збірки (postbuild) і читає build/.
 */

const SITE_URL = 'https://teatralo4ka.odesa.ua';
const BUILD_DIR = 'build';

/** Не для індексу: адмінка та технічні сторінки. */
const EXCLUDE = [/^admin(\/|$)/];

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

function generateSitemap() {
	if (!fs.existsSync(BUILD_DIR)) {
		console.error(`❌ ${BUILD_DIR}/ не існує — sitemap будується після збірки`);
		process.exit(1);
	}

	const pages = builtPages(BUILD_DIR)
		.filter((p) => !EXCLUDE.some((re) => re.test(p)))
		.sort();

	if (pages.length === 0) {
		console.error('❌ у build/ не знайдено жодної сторінки — перевірка мертва');
		process.exit(1);
	}

	const today = new Date().toISOString().split('T')[0];
	const entries = pages.map((p) => {
		const loc = p === '' ? `${SITE_URL}/` : `${SITE_URL}/${p}`;
		const isHome = p === '';
		return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${isHome ? 'weekly' : 'monthly'}</changefreq>
    <priority>${isHome ? '1.0' : '0.8'}</priority>
  </url>`;
	});

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}
</urlset>
`;

	fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), xml);
	console.log(`✅ sitemap: ${pages.length} сторінок (усі перевірені в ${BUILD_DIR}/)`);
}

generateSitemap();
