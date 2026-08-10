// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
	MIN_QUERY_LENGTH,
	normalize,
	plainTextFromMarkdown,
	searchEntries,
	type SearchEntry
} from './siteSearch';

/**
 * Перевіряється саме ядро: зіставлення, порядок і фрагмент.
 *
 * Накладка ж лише малює те, що повернула ця функція, і в ній перевіряти нічого
 * — а от помилки регістру, порядку результатів чи обрізаного посеред слова
 * фрагмента виглядають як «пошук поганий», а не як конкретний дефект, і шукати
 * їх довелося б навмання.
 */

const ENTRIES: SearchEntry[] = [
	{
		id: 'page:about',
		title: 'Про школу',
		href: '/about/',
		kind: 'page',
		text: 'Одеська театральна школа працює з 1990 року і навчає дітей акторській майстерності.'
	},
	{
		id: 'page:music',
		title: 'Музичне відділення',
		href: '/departments/music/',
		kind: 'page',
		text: 'Відділення дає фах для тих, хто обрав музику своєю справою.'
	},
	{
		id: 'news:1',
		title: 'Театральна вистава у грудні',
		href: '/news/1/',
		kind: 'news',
		text: 'Запрошуємо на виставу.'
	}
];

describe('normalize', () => {
	it('згортає переноси рядків у пробіли', () => {
		// Без цього запит із пробілом не знаходив би тексту, де між словами перенос.
		expect(normalize('театральна\n  школа')).toBe('театральна школа');
	});

	it('не залежить від регістру', () => {
		expect(normalize('ТЕАТР')).toBe(normalize('театр'));
	});
});

describe('plainTextFromMarkdown', () => {
	it('прибирає розмітку, лишаючи текст посилань', () => {
		const out = plainTextFromMarkdown('## Заголовок\n\nТекст із [посиланням](https://a.b) і **жирним**.');
		expect(out).toBe('Заголовок Текст із посиланням і жирним.');
	});

	it('викидає блоки коду й зображення', () => {
		const out = plainTextFromMarkdown('Було\n\n```js\nconst a = 1;\n```\n\n![фото](/x.jpg)\n\nстало');
		expect(out).not.toContain('const');
		expect(out).not.toContain('x.jpg');
		expect(out).toContain('Було');
		expect(out).toContain('стало');
	});

	it('прибирає списки й цитати, не з’їдаючи їхній текст', () => {
		const out = plainTextFromMarkdown('- перший\n- другий\n\n> цитата');
		expect(out).toBe('перший другий цитата');
	});
});

describe('searchEntries', () => {
	it('надто короткий запит не дає нічого', () => {
		expect(searchEntries(ENTRIES, 'т')).toEqual([]);
		expect(MIN_QUERY_LENGTH).toBe(2);
	});

	it('знаходить за текстом, не лише за назвою', () => {
		const hits = searchEntries(ENTRIES, 'акторській');
		expect(hits.map((h) => h.id)).toEqual(['page:about']);
	});

	it('не залежить від регістру запиту', () => {
		expect(searchEntries(ENTRIES, 'ОДЕСЬКА').map((h) => h.id)).toEqual(['page:about']);
	});

	/**
	 * Головне правило ранжування: людина шукає сторінку, а не згадку слова в ній.
	 *
	 * «Театральна» є і в назві новини, і в тексті сторінки «Про школу». Новина
	 * мусить бути вище — інакше збіг у назві важив би не більше за випадкову
	 * згадку в абзаці.
	 */
	it('збіг у назві важить більше за збіг у тексті', () => {
		/**
		 * Дані підібрані так, щоб вирішувала САМЕ вага, а не позиція.
		 *
		 * Перша версія цієї перевірки була зелена й тоді, коли вагу назви знизили
		 * до ваги тексту: там збіг у назві стояв на позиції 0, а в тексті — на 8,
		 * і порядок зберігався через позицію. Тут навпаки: у тексті збіг на самому
		 * початку, а в назві — далеко, тож позиція тягне в ІНШИЙ бік, і лишається
		 * тільки вага.
		 */
		const hits = searchEntries(
			[
				{ id: 'text-early', title: 'Нічого спільного', href: '/a/', kind: 'page', text: 'театр і діти' },
				{ id: 'title-late', title: 'Довга назва, у якій театр аж тут', href: '/b/', kind: 'page', text: 'без збігу' }
			],
			'театр'
		);

		expect(hits.map((h) => h.id)).toEqual(['title-late', 'text-early']);
	});

	it('фрагмент показує місце збігу', () => {
		const [hit] = searchEntries(ENTRIES, 'акторській');
		expect(hit.snippet).toContain('акторській');
	});

	/**
	 * Обрізати рівно по радіусу означало б різати слова навпіл: виглядає як
	 * помилка, хоч і не є нею. Тому перевіряється саме межа.
	 *
	 * Текст узятий довгий навмисно, щоб обрізання справді сталося з обох боків —
	 * інакше перевірка була б зеленою просто тому, що різати нічого.
	 */
	it('фрагмент починається й закінчується цілим словом', () => {
		/**
		 * Наповнювач має період 8 символів навмисно.
		 *
		 * Перша версія брала слово «слово » — шість символів, а радіус 60 ділиться
		 * на шість без остачі, тож наївний розріз рівно по радіусу ВИПАДКОВО падав
		 * на пробіл, і перевірка була зелена навіть без обробки меж. Із періодом 8
		 * розріз падає посеред слова з обох боків.
		 */
		const text = `Одеська театральна школа ${'абвгдеж '.repeat(40)}потрібне ${'абвгдеж '.repeat(40)}кінець`;
		const [hit] = searchEntries(
			[{ id: 'x', title: 'Назва без збігу', href: '/x/', kind: 'page', text }],
			'потрібне'
		);

		const body = hit.snippet.replace(/^…/, '').replace(/…$/, '');
		expect(hit.snippet.startsWith('…'), 'мало б обрізатися зліва').toBe(true);
		expect(hit.snippet.endsWith('…'), 'мало б обрізатися справа').toBe(true);
		expect(text).toContain(body);

		const at = text.indexOf(body);
		expect(text[at - 1], 'ліва межа посеред слова').toBe(' ');
		expect(text[at + body.length], 'права межа посеред слова').toBe(' ');
	});

	it('збіг лише в назві лишає фрагмент порожнім', () => {
		const [hit] = searchEntries(ENTRIES, 'музичне');
		expect(hit.id).toBe('page:music');
		expect(hit.snippet).toBe('');
	});

	it('обмеження кількості дотримується', () => {
		const hits = searchEntries(ENTRIES, 'а', 1);
		expect(hits.length).toBeLessThanOrEqual(1);
	});

	it('нічого не знайдено — порожній масив, не помилка', () => {
		expect(searchEntries(ENTRIES, 'кораблебудування')).toEqual([]);
	});
});
