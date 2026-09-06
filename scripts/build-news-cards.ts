import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Легкий покажчик КАРТОК новин із коду — щоб головна не тягла їхній текст.
 *
 * ## Що було заміряно
 *
 * `import.meta.glob('…/*.md', { eager: true, query: '?raw' })` у `i18n/loader`
 * вкладає в бандл ПОВНИЙ текст кожної сторінки. Доти це коштувало 34.6 КБ
 * brotli, і чанк лежав у критичному шляху головної, бо `codeNewsCards` читає
 * frontmatter саме через цей завантажувач.
 *
 * 6 вересня 2026 в код переїхали чотирнадцять новин, і той самий чанк став
 * 41.7 КБ — головна вийшла за свій бюджет (297 із 290 КБ). Причина не в
 * новинах, а в тому, ЩО саме через них приїхало: картці потрібні назва, дата,
 * плашка й анотація, а приїжджав увесь текст усіх сторінок. При задумі автора
 * («більшість новин в коді») п'ятдесят новин зробили б із цього ≈90 КБ — третину
 * бюджету головної за текст, якого головна не показує.
 *
 * ## Що робить цей скрипт
 *
 * Читає frontmatter обох мов для кожної новини з `CODE_NEWS` і пише
 * `src/lib/data/news-cards.data.json` — рівно ті п'ять полів, що потрібні
 * картці.
 * Після цього `config/codeNews` більше не імпортує `i18n/loader`, і текст
 * сторінок лишається там, де він справді потрібен: на сторінці новини й у
 * пошуку.
 *
 * ## Чому згенерований файл лежить у репозиторії
 *
 * Так само, як `static/search/profiles.json`: щоб `npm run dev` і перевірки
 * працювали без попереднього прогону збірки. Розходження з markdown стереже
 * гейт `src/news-cards.test.ts` — він рахує те саме й порівнює.
 *
 * ## Чому JSON, а не згенерований TypeScript
 *
 * Перша редакція писала `.ts`, і на шістнадцяти новинах файл мав 237 рядків
 * SLOC при канонічній межі 250 (`src/structure.test.ts` § 7). Кожна новина
 * додає чотирнадцять — тобто на сімнадцятій наступній ЗГЕНЕРОВАНИЙ файл
 * почав би валити гейт розміру, і його стелю довелося б піднімати щопартії.
 * Саме такий рядок канон і називає пам'ятником. JSON гейт не рахує, бо
 * рахувати в ньому нема чого: це дані, і в них нуль логіки — рівно як у
 * `src/lib/data/*.data.json` поруч.
 */

const СТОРІНКИ = join(process.cwd(), 'src', 'lib', 'i18n', 'pages');
const ЦІЛЬ = join(process.cwd(), 'src', 'lib', 'data', 'news-cards.data.json');

export interface NewsCardMeta {
	title: string;
	/** `YYYY-MM-DD` із frontmatter — заявлена дата ПОДІЇ, а не зміни файлу. */
	date: string;
	/** Ключ для `getCategoryLabel`: `newsCategory`, якщо він є, інакше `category`. */
	category: string;
	excerpt: string;
	/** `status: "published"`. Чернетка в переліки не потрапляє. */
	published: boolean;
}

/** Той самий розбір, що в `i18n/loader`: пласкі поля плюс вкладений `seo`. */
function frontmatter(текст: string): Record<string, string> {
	const блок = текст.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!блок) return {};
	const дані: Record<string, string> = {};
	let розділ = '';
	for (const рядок of блок[1].split('\n')) {
		if (!рядок.trim() || рядок.trim().startsWith('#')) continue;
		const відступ = рядок.search(/\S/);
		const частини = рядок.trim().split(':');
		const ключ = частини[0].trim();
		const значення = частини.slice(1).join(':').trim().replace(/^['"](.*)['"]$/, '$1');
		if (відступ > 0) {
			if (розділ) дані[`${розділ}.${ключ}`] = значення;
			continue;
		}
		розділ = значення ? '' : ключ;
		if (значення) дані[ключ] = значення;
	}
	return дані;
}

export function картка(текст: string): NewsCardMeta {
	const f = frontmatter(текст);
	return {
		title: f.title ?? '',
		date: f.date ?? '',
		/* Плашка новини перемагає рід сторінки — розбір у `i18n/schema`. */
		category: f.newsCategory || f.category || 'news',
		/* Те саме правило, що доти стояло в `codeNewsCards`: своя анотація, а
		   якщо її немає — опис для пошуковика. */
		excerpt: f.excerpt || f['seo.description'] || '',
		published: f.status === 'published'
	};
}

/**
 * Слуги новин — із ДИСКА, а не розбором TypeScript.
 *
 * Перша редакція шукала пари `id`/`slug` регуляркою в `config/codeNews.ts` — і
 * пропустила одну новину з шістнадцяти: у записі про вісімнадцять студентів між
 * ними стоять коментар і `mediaShape`. Розбирати мову регуляркою тут і не
 * треба: `slug` новини за побудовою дорівнює `news-<id>` (так пише конвертер, і
 * так стоять обидва записи, зроблені руками), а перевірка
 * `config/codeNews.test.ts` цю рівність стереже.
 *
 * Імпортувати сам реєстр не можна: він тягне `$app/paths` і `i18n/loader`,
 * тобто аліаси, які існують лише в збірці Vite.
 */
export function слугиНовин(): { id: string; slug: string }[] {
	return readdirSync(join(СТОРІНКИ, 'uk'))
		.filter((файл) => файл.startsWith('news-') && файл.endsWith('.md'))
		.map((файл) => файл.replace(/\.md$/, ''))
		.map((slug) => ({ id: slug.replace(/^news-/, ''), slug }));
}

export function зібрати(): Record<'uk' | 'en', Record<string, NewsCardMeta>> {
	const out: Record<'uk' | 'en', Record<string, NewsCardMeta>> = { uk: {}, en: {} };
	for (const { id, slug } of слугиНовин()) {
		for (const мова of ['uk', 'en'] as const) {
			const файл = join(СТОРІНКИ, мова, `${slug}.md`);
			out[мова][id] = картка(readFileSync(файл, 'utf8'));
		}
	}
	return out;
}

function записати(): void {
	const дані = зібрати();
	writeFileSync(ЦІЛЬ, `${JSON.stringify(дані, null, '	')}
`, 'utf8');
	console.log(
		`🗂️  картки новин: ${Object.keys(дані.uk).length} новин × 2 мови ` +
			'у src/lib/data/news-cards.data.json'
	);
}

if (process.argv[1]?.includes('build-news-cards')) {
	записати();
}
