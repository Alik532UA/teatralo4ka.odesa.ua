// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contentRows, filterRows, rowTypeCounts, rowYears, type ContentRow } from './adminContentRows';
import { codeNewsCards } from '$lib/config/codeNews';
import type { StoredArticle } from '$lib/services/articles';

/**
 * Перелік адмінки на СПРАВЖНІХ новинах із коду й вигаданих статтях із бази.
 *
 * Новини з коду підмінити нічим — `codeNewsCards` читає markdown із бандла, — і
 * це радше добре: перевірка через це стежить за тим, що адмінка бачить рівно ті
 * самі новини, які бачить сайт. Статті з бази, навпаки, вигадані: справжніх у
 * перевірці бути не може, а потрібні від них лише дата й прапорець публікації.
 *
 * ## Що саме стережеться
 *
 * Дефект, який тут неможливо помітити оком: фільтри писалися під статтю з бази,
 * і новина з коду легко опинилася б поза ними — тобто «показати чернетки» або
 * «2026 рік» мовчки ховали б половину переліку. Тому кожен фільтр перевіряється
 * на ОБОХ джерелах.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v9 § 1.1)
 *
 * Проведено: у `contentRows` прибрано новини з коду — впали три перевірки й
 * назвали кількість; `filterRows` перестав дивитися на `опубліковано` — упала
 * перевірка про приховану новину; сортування змінено на зростання — упала
 * перевірка порядку.
 */

const мітка = (ms: number) => ({ toMillis: () => ms, toDate: () => new Date(ms) });

function стаття(id: string, ms: number, опції: Partial<StoredArticle> = {}): StoredArticle {
	return {
		id,
		category: 'news',
		author: '',
		dateMode: 'createdAt',
		createdAt: мітка(ms),
		updatedAt: null,
		translations: {
			uk: { title: `назва ${id}`, content: `текст ${id}`, isPublished: true },
			en: { title: '', content: '', isPublished: false }
		},
		...опції
	} as unknown as StoredArticle;
}

const КОД = codeNewsCards('uk');
const перший = КОД[0].id;
const кодовий = (rows: ContentRow[]) => rows.filter((r) => r.вид === 'code');

describe('перелік контенту в адмінці', () => {
	it('перевірка жива: новини в коді є', () => {
		expect(КОД.length, 'жодної новини в коді — половину перевірок нема на чому робити')
			.toBeGreaterThan(0);
	});

	it('в одному переліку обидва джерела', () => {
		const rows = contentRows([стаття('a', 1_700_000_000_000)], 'uk', null);
		expect(rows.length).toBe(КОД.length + 1);
		expect(кодовий(rows).length, 'адмінка не бачить новин із коду').toBe(КОД.length);
		expect(rows.filter((r) => r.вид === 'db').length).toBe(1);
	});

	it('порядок — за датою, а не за джерелом', () => {
		const давно = стаття('стара', Date.UTC(2001, 0, 1));
		const завтра = стаття('свіжа', Date.now() + 86_400_000);
		const ключі = contentRows([давно, завтра], 'uk', null).map((r) => r.ключ);
		expect(ключі[0]).toBe('db:свіжа');
		expect(ключі.at(-1)).toBe('db:стара');
	});

	it('ключ рядка називає джерело — інакше `id` двох джерел могли б збігтися', () => {
		const rows = contentRows([стаття(перший, 1)], 'uk', null);
		expect(new Set(rows.map((r) => r.ключ)).size, 'два рядки з тим самим ключем').toBe(rows.length);
	});

	it('прихована новина з коду лишається в переліку, але як НЕопублікована', () => {
		/* Саме заради цього адмінка й показує код: приховане треба бачити й уміти
		   повернути. На сайті його немає — тут воно є. */
		const rows = contentRows([], 'uk', { hidden: [перший], replacedBy: {} });
		const рядок = кодовий(rows).find((r) => r.id === перший);
		expect(рядок, 'прихована новина зникла з адмінки — повернути її було б нічим').toBeDefined();
		expect(рядок?.приховано).toBe(true);
		expect(рядок?.опубліковано).toBe(false);
	});

	it('замінена новина знає, ЧИМ її замінили', () => {
		const rows = contentRows([], 'uk', { hidden: [], replacedBy: { [перший]: 'нова-стаття' } });
		const рядок = кодовий(rows).find((r) => r.id === перший);
		expect(рядок?.заміна).toBe('нова-стаття');
		expect(рядок?.приховано, 'замінена новина не стоїть у переліках сайту').toBe(true);
	});

	it('пошук знаходить і в коді, і в базі', () => {
		const rows = contentRows([стаття('a', 1)], 'uk', null);
		const базові = { тип: 'all', стан: 'all', категорія: 'all', рік: 'all' } as const;

		const заНазвоюКоду = filterRows(rows, { ...базові, пошук: КОД[0].title });
		expect(заНазвоюКоду.some((r) => r.вид === 'code' && r.id === перший)).toBe(true);

		const заТекстомБази = filterRows(rows, { ...базові, пошук: 'текст a' });
		expect(заТекстомБази.map((r) => r.ключ)).toEqual(['db:a']);
	});

	it('фільтр «чернетки» показує приховані новини з коду', () => {
		const rows = contentRows([стаття('опублікована', 2)], 'uk', {
			hidden: [перший],
			replacedBy: {}
		});
		const чернетки = filterRows(rows, {
			пошук: '',
			тип: 'all',
			стан: 'draft',
			категорія: 'all',
			рік: 'all'
		});
		expect(чернетки.map((r) => r.ключ)).toEqual([`code:${перший}`]);
	});

	it('фільтр року бачить новини з коду', () => {
		const rows = contentRows([], 'uk', null);
		const рік = new Date(rows[0].час).getFullYear().toString();
		const свій = filterRows(rows, { пошук: '', тип: 'all', стан: 'all', категорія: 'all', рік });
		expect(свій.length, `у ${рік} році немає жодної новини з коду`).toBeGreaterThan(0);
		expect(rowYears(rows), 'рік новини з коду не потрапив у перелік років').toContain(рік);
	});

	it('«без дати» — це рівно ті, у кого дати немає', () => {
		const без = стаття('без-дати', 0, { dateMode: 'hidden' });
		const rows = contentRows([без, стаття('з-датою', 1_700_000_000_000)], 'uk', null);
		const порожні = filterRows(rows, {
			пошук: '',
			тип: 'all',
			стан: 'all',
			категорія: 'all',
			рік: 'none'
		});
		expect(порожні.map((r) => r.ключ)).toEqual(['db:без-дати']);
		expect(rowYears(rows), 'нуль мілісекунд перетворився б на 1970 рік').not.toContain('1970');
	});

	it('новина з коду рахується статтею, а не сторінкою', () => {
		const rows = contentRows([стаття('сторінка', 3, { type: 'page' })], 'uk', null);
		const лічильники = rowTypeCounts(rows);
		expect(лічильники.article).toBe(КОД.length);
		expect(лічильники.page).toBe(1);
		expect(лічильники.all).toBe(rows.length);

		const лише = filterRows(rows, {
			пошук: '',
			тип: 'page',
			стан: 'all',
			категорія: 'all',
			рік: 'all'
		});
		expect(лише.map((r) => r.ключ)).toEqual(['db:сторінка']);
	});

	it('категорія новини з коду — сирий ключ, а не підпис «Новина»', () => {
		// За підписом фільтр не працює: у `Select` значення — саме ключі.
		const rows = contentRows([], 'uk', null);
		expect(кодовий(rows)[0].категорія).toBe('news');
		const новини = filterRows(rows, {
			пошук: '',
			тип: 'all',
			стан: 'all',
			категорія: 'news',
			рік: 'all'
		});
		expect(новини.length).toBe(КОД.length);
	});
});
