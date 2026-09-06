import { codeNewsCards, codeNewsTime } from '$lib/config/codeNews';
import type { ContentType, StoredArticle } from '$lib/services/articles';
import { getDisplayDate } from './articleDate';
import type { ContentCardItem } from '$lib/components/ContentCard.svelte';
import { hiddenCodeNews, replacementFor, type NewsOverrides } from './newsOverrides';

/**
 * Перелік контенту в адмінці зводить ТІ САМІ два джерела, що й сайт.
 *
 * ## Навіщо
 *
 * Автор сказав це прямо: «список і з firebase і з коду (щоб можна було
 * наприклад замінити чи приховати новину, я розумію що з адмінки ми не можемо
 * міняти код, але це і не треба)». Доти адмінка бачила лише базу — тобто
 * новини, які вже переїхали в код, зникали з-перед очей того, хто ними
 * керує. Приховати їх звідти було нічим.
 *
 * ## Чому окремий модуль, а не ще двісті рядків на сторінці
 *
 * Сторінка `/admin/content` уже стоїть на своїй стелі розміру, а вміст цієї
 * роботи — чиста обробка: звести, відсіяти, порахувати. Тут вона перевіряється
 * без браузера й без Firestore, а сторінці лишається розмітка.
 *
 * ## Чому спільний РЯДОК, а не дві гілки з власними фільтрами
 *
 * Фільтри в адмінці (пошук, стан, категорія, рік) писалися під статтю з бази.
 * Якби новини з коду прийшли окремою гілкою, кожен фільтр довелося б написати
 * двічі — і розійтися вони могли б непомітно, бо ніщо не звіряє дві копії
 * одного правила. Тому обидва джерела спершу зводяться до спільних полів, за
 * якими й відбирають, а джерело лишається під рукою для розмітки й дій.
 */

interface RowBase {
	/** Ключ для `{#each}`: джерело в ньому є, бо `id` двох джерел не пов'язані. */
	ключ: string;
	/** Мілісекунди для сортування. `0` — дати немає, тож піде в кінець. */
	час: number;
	тип: ContentType;
	назва: string;
	опис: string;
	/** СИРИЙ ключ категорії (`news`), а не підпис: фільтр звіряє саме його. */
	категорія: string;
	опубліковано: boolean;
}

export interface DbRow extends RowBase {
	вид: 'db';
	стаття: StoredArticle;
}

export interface CodeRow extends RowBase {
	вид: 'code';
	/** Ключ адреси новини — він же ключ у перевизначеннях. */
	id: string;
	картка: ContentCardItem;
	приховано: boolean;
	/** `id` статті з бази, яка стала новою версією цієї новини. */
	заміна?: string;
}

export type ContentRow = DbRow | CodeRow;

/**
 * Категорія новини з коду — завжди `news`, і це не припущення.
 *
 * Так вимагає перевірка «категорія markdown — саме `news`» у
 * `config/codeNews.test.ts`: новина з іншою категорією не пройде гейт. Тому тут
 * стоїть стала, а не читання frontmatter заради значення, яке не може бути
 * іншим — картка ж віддає ПІДПИС («Новина»), і фільтрувати за ним не можна.
 */
const КАТЕГОРІЯ_КОДУ = 'news';

export function contentRows(
	articles: readonly StoredArticle[],
	lang: 'uk' | 'en',
	overrides: NewsOverrides | null
): ContentRow[] {
	const приховані = hiddenCodeNews(overrides);

	const зКоду: ContentRow[] = codeNewsCards(lang).map((картка) => ({
		вид: 'code',
		ключ: `code:${картка.id}`,
		id: картка.id,
		картка,
		час: codeNewsTime(lang, картка.id),
		тип: 'article',
		назва: картка.title,
		опис: картка.excerpt,
		категорія: КАТЕГОРІЯ_КОДУ,
		/*
		 * «Опубліковано» для новини з коду означає «стоїть у переліках». Чернетка
		 * (`status: draft` у markdown) сюди не доходить узагалі — `codeNewsCards`
		 * її не віддає, — тож лишається рівно одна причина не бути в переліку:
		 * приховали з адмінки. Через це фільтр «чернетки» показує саме приховані,
		 * і шукати їх окремою кнопкою не треба.
		 */
		опубліковано: !приховані.has(картка.id),
		приховано: приховані.has(картка.id),
		заміна: replacementFor(overrides, картка.id)
	}));

	const зБази: ContentRow[] = articles.map((стаття) => ({
		вид: 'db',
		ключ: `db:${стаття.id}`,
		стаття,
		час: getDisplayDate(стаття)?.toMillis() ?? 0,
		тип: стаття.type || 'article',
		назва: стаття.translations?.[lang]?.title || '',
		опис: стаття.translations?.[lang]?.content || '',
		категорія: стаття.category || '',
		опубліковано: стаття.translations?.[lang]?.isPublished === true
	}));

	return [...зКоду, ...зБази].sort((a, b) => b.час - a.час);
}

export interface RowFilters {
	пошук: string;
	тип: 'all' | ContentType;
	стан: 'all' | 'published' | 'draft';
	категорія: string;
	/** Рік чотирма цифрами, `all` або `none` — «без дати». */
	рік: string;
}

export function filterRows(rows: readonly ContentRow[], f: RowFilters): ContentRow[] {
	const запит = f.пошук.trim().toLowerCase();
	return rows.filter((рядок) => {
		if (f.тип !== 'all' && рядок.тип !== f.тип) return false;

		if (запит) {
			const де = `${рядок.назва}\n${рядок.опис}\n${рядок.категорія}`.toLowerCase();
			if (!де.includes(запит)) return false;
		}

		if (f.стан === 'published' && !рядок.опубліковано) return false;
		if (f.стан === 'draft' && рядок.опубліковано) return false;

		if (f.категорія !== 'all' && рядок.категорія !== f.категорія) return false;

		if (f.рік === 'none') return рядок.час === 0;
		if (f.рік !== 'all') {
			if (!рядок.час) return false;
			if (new Date(рядок.час).getFullYear().toString() !== f.рік) return false;
		}

		return true;
	});
}

/** Роки, за якими є що показати, — новіші перші. `0` (без дати) сюди не йде. */
export function rowYears(rows: readonly ContentRow[]): string[] {
	const роки = new Set<string>();
	for (const рядок of rows) {
		if (рядок.час) роки.add(new Date(рядок.час).getFullYear().toString());
	}
	return [...роки].sort((a, b) => b.localeCompare(a));
}

/** Скільки чого — для лічильників над вкладками типів. */
export function rowTypeCounts(rows: readonly ContentRow[]): Record<'all' | ContentType, number> {
	const лічильники = { all: rows.length, article: 0, page: 0, page_project: 0 };
	for (const рядок of rows) лічильники[рядок.тип] += 1;
	return лічильники;
}
