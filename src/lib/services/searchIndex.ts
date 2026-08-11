import { resolve } from '$app/paths';
import { listPageSlugs, loadPageForSearch } from '$lib/i18n/loader';
import { SEARCHABLE_PAGES } from '$lib/config/searchablePages';
import { getArticles } from '$lib/services/articles';
import { plainTextFromMarkdown, type SearchEntry } from '$lib/utils/siteSearch';

/**
 * Збирає те, по чому шукаємо.
 *
 * Два джерела поводяться зовсім по-різному, і саме тому вони розділені:
 *
 * - **сторінки** вже лежать у бандлі (`import.meta.glob` з `eager: true`), тож
 *   доступні синхронно й без мережі — пошук по них працює навіть без інтернету;
 * - **новини** живуть у Firestore, тож потрібен запит. Він робиться ОДИН раз на
 *   сеанс і кешується: інакше кожне відкриття накладки коштувало б читань, а
 *   набір символу — тим паче.
 */

/** Новини, прочитані раз за сеанс. Ключ — мова: переклади різні. */
const newsCache = new Map<string, SearchEntry[]>();

/** Сторінки — синхронно, з бандла (за замовчуванням усі мови). */
export function pageEntries(lang?: 'uk' | 'en'): SearchEntry[] {
	const langs: ('uk' | 'en')[] = lang ? [lang] : ['uk', 'en'];
	const entries: SearchEntry[] = [];

	for (const l of langs) {
		for (const { slug, href } of SEARCHABLE_PAGES) {
			const page = loadPageForSearch(l, slug);
			// `null` означає «файлу немає або сторінка в архіві» — і те, і те не шукаємо.
			if (!page) continue;

			entries.push({
				id: `page:${l}:${slug}`,
				title: page.title,
				href: `${href()}/`,
				kind: 'page',
				text: page.text
			});
		}
	}

	return entries;
}

/**
 * Новини — із мережі, один раз (за замовчуванням усі мови).
 *
 * Помилку не кидаємо далі: пошук по сторінках має працювати й тоді, коли
 * Firestore недосяжний. Порожній результат тут означає «новин не додалося», а не
 * «пошук зламався», і це правильна поведінка для другорядного джерела.
 */
export async function newsEntries(lang?: 'uk' | 'en'): Promise<SearchEntry[]> {
	const cacheKey = lang || 'all';
	const cached = newsCache.get(cacheKey);
	if (cached) return cached;

	try {
		const articles = await getArticles(lang || 'uk', true);
		const entries: SearchEntry[] = [];
		const langs: ('uk' | 'en')[] = lang ? [lang] : ['uk', 'en'];

		for (const article of articles) {
			for (const l of langs) {
				const tr = article.translations?.[l];
				if (!tr?.title) continue;

				// Стаття може бути і markdown, і HTML — знімаємо і те, і те.
				const body = tr.contentFormat === 'html' ? tr.content : plainTextFromMarkdown(tr.content ?? '');

				entries.push({
					id: `news:${l}:${article.id ?? article.slug ?? tr.title}`,
					title: tr.title,
					href: `${resolve('/news/[id]', { id: article.slug || article.id || '' })}/`,
					kind: 'news',
					text: plainTextFromMarkdown(`${tr.excerpt ?? ''} ${body}`)
				});
			}
		}

		newsCache.set(cacheKey, entries);
		return entries;
	} catch (error) {
		console.warn('Пошук: новини недоступні, шукаємо лише по сторінках', error);
		return [];
	}
}

/**
 * Скільки сторінок є в перелiку — для перевірки, що індекс не порожній.
 *
 * Потрібне саме як окрема функція: перевірка «пошук щось знаходить» без цього
 * була б зеленою й на порожньому переліку.
 */
export function searchableSlugCount(lang: 'uk' | 'en'): number {
	const onDisk = new Set(listPageSlugs(lang));
	return SEARCHABLE_PAGES.filter((p) => onDisk.has(p.slug)).length;
}
