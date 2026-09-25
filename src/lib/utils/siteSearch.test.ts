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

describe('одрук у тексті, а не в назві', () => {
	/*
	 * Реальний випадок: автор набрав «ляпоси» замість «ляпаси» й не знайшов
	 * нічого. Слово в записі Є, але не в назві («Уривки з драматургії 20
	 * століття») — воно в переліку номерів, тобто в тексті. Шар одруків по
	 * назвах дістати його не міг за визначенням.
	 */
	const ВИСТАВА: SearchEntry[] = [
		{
			id: 'play:uryvky-2012',
			title: 'Уривки з драматургії 20 століття',
			href: '/projects/galaxy-graduates/plays/uryvky-2012/',
			kind: 'galaxy',
			text: 'Уривки з драматургії 20 століття 2012 Л. Андреєв «Той, хто отримує ляпаси»'
		}
	];

	it('знаходить із однією помилковою літерою', () => {
		expect(searchEntries(ВИСТАВА, 'ляпоси').map((h) => h.id)).toEqual(['play:uryvky-2012']);
	});

	it('точний збіг лишається знаходитись і важить більше', () => {
		const точно = searchEntries(ВИСТАВА, 'ляпаси');
		const одрук = searchEntries(ВИСТАВА, 'ляпоси');
		expect(точно).toHaveLength(1);
		expect(точно[0].score).toBeGreaterThan(одрук[0].score);
	});

	it('дві помилки не знаходять — це вже інше слово', () => {
		expect(searchEntries(ВИСТАВА, 'лупоси')).toEqual([]);
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

	it('надає перевагу активній мові сайту при однаковому збігу', () => {
		const entries: SearchEntry[] = [
			{ id: 'page:en:about', title: 'About Us', href: '/about/', kind: 'page', text: 'School' },
			{ id: 'page:uk:about', title: 'Про школу', href: '/about/', kind: 'page', text: 'School' }
		];
		const hitsEn = searchEntries(entries, 'School', 20, 'en');
		expect(hitsEn[0].id).toBe('page:en:about');

		const hitsUk = searchEntries(entries, 'School', 20, 'uk');
		expect(hitsUk[0].id).toBe('page:uk:about');
	});

	it('знаходить контакти за прихованими ключами «Адреса», «Факс» та видимим «email»', () => {
		const rawMd = `
# Контакти

## **Одеська театральна школа**

<span class="sr-only">Адреса, факс, email (address, fax)</span>

**[м. Одеса, вул. Софіївська, 24](https://maps.app.goo.gl/ya4gki6tuZv36Tjz8)**

### Телефони
+380 48 723 63 04 — директор

### Email
teatr_school@i.ua
`;
		const contactsEntry: SearchEntry = {
			id: 'page:uk:contacts',
			title: 'Контакти',
			href: '/contacts/',
			kind: 'page',
			text: plainTextFromMarkdown(rawMd)
		};

		for (const query of ['Адреса', 'адреса', 'Факс', 'факс', 'email', 'Email']) {
			const hits = searchEntries([contactsEntry], query);
			expect(hits, `Пошук не знайшов сторінку за запитом "${query}"`).toHaveLength(1);
			expect(hits[0].id).toBe('page:uk:contacts');
		}
	});

	it(
		'індексує сторінку контактів з файлів на диску та знаходить її за ключами',
		async () => {
			const { pageEntries } = await import('$lib/services/searchIndex');
		const pages = pageEntries('uk');
		const contacts = pages.find((p) => p.id === 'page:uk:contacts');
		expect(contacts).toBeDefined();

		for (const query of ['Адреса', 'адреса', 'Факс', 'факс', 'email', 'Email']) {
			const hits = searchEntries(pages, query, 10, 'uk');
			expect(hits.some((h) => h.id === 'page:uk:contacts'), `Пошук не знайшов контакти за запитом "${query}"`).toBe(true);
		}

		const pagesEn = pageEntries('en');
		const contactsEn = pagesEn.find((p) => p.id === 'page:en:contacts');
		expect(contactsEn).toBeDefined();

		for (const query of ['Address', 'address', 'Fax', 'fax', 'email', 'Email']) {
			const hits = searchEntries(pagesEn, query, 10, 'en');
			expect(hits.some((h) => h.id === 'page:en:contacts'), `EN search didn't find contacts for "${query}"`).toBe(true);
		}
	}, 40000);
});

/**
 * Пошук по людях: три шари, і в кожного свій доказ.
 *
 * Записи тут навмисно такі самі, якими їх бачить пошук насправді (`searchGalaxy`
 * кладе в `text` ім'я, підпис і рік) — інакше перевірка стерегла б не те, що
 * ламається.
 */
const ЛЮДИ: SearchEntry[] = [
	{ id: 'p:tunkevych', title: 'Аліса Тункевич', href: '/1/', kind: 'galaxy', text: 'Аліса Тункевич випуск 2016' },
	{ id: 'p:zapolnov', title: 'Алік Запольнов', href: '/2/', kind: 'galaxy', text: 'Алік Запольнов випуск 2011' },
	{ id: 'p:sukhanova', title: 'Марина Суханова', href: '/3/', kind: 'galaxy', text: 'Марина Суханова випуск 1998' },
	{ id: 'p:sukhanov', title: 'Іван Суханов', href: '/4/', kind: 'galaxy', text: 'Іван Суханов випуск 2003' },
	{ id: 'p:hurevych', title: 'Дар’я Гуревич', href: '/5/', kind: 'galaxy', text: 'Дар’я Гуревич випуск 2019' }
];

const знайдено = (запит: string) => searchEntries(ЛЮДИ, запит).map((h) => h.id);

describe('пошук по людях', () => {
	it('те саме прізвище іншим написанням', () => {
		expect(знайдено('Тункевіч')).toEqual(['p:tunkevych']);
		expect(знайдено('Маріна Суханова')).toEqual(['p:sukhanova']);
	});

	it('прямий апостроф знаходить типографський', () => {
		expect(знайдено("Дар'я")).toEqual(['p:hurevych']);
	});

	it('порядок слів не має значення', () => {
		expect(знайдено('Тункевич Аліса')).toEqual(['p:tunkevych']);
	});

	it('одна помилкова літера: заміна, пропуск, перестановка', () => {
		expect(знайдено('Запальнов'), 'заміна літери').toEqual(['p:zapolnov']);
		expect(знайдено('Суханва'), 'пропущена літера').toEqual(['p:sukhanova']);
		expect(знайдено('Тукневич'), 'переставлені сусідні').toEqual(['p:tunkevych']);
	});

	it('дві помилки — це вже не одруківка', () => {
		// Інакше пошук почав би вгадувати, і в переліку опинявся б хто завгодно.
		expect(знайдено('Запальнав')).toEqual([]);
	});

	it('точний збіг завжди вище приблизного', () => {
		// «Суханова» точно, «Суханов» — на одну літеру далі.
		expect(знайдено('Суханова')).toEqual(['p:sukhanova', 'p:sukhanov']);
	});

	it('фрагмент показує текст як він написаний, а не згорнутий', () => {
		const текст = `${'слово '.repeat(20)}Дар’я Гуревич ${'слово '.repeat(20)}далі`;
		const [hit] = searchEntries(
			[{ id: 'x', title: 'Назва без збігу', href: '/x/', kind: 'galaxy', text: текст }],
			"Дар'я Гуревич"
		);
		expect(hit.snippet).toContain('Дар’я Гуревич');
	});
});

describe('шар одруків вмикається не завжди', () => {
	const театри = (скільки: number): SearchEntry[] => [
		...Array.from({ length: скільки }, (_, i) => ({
			id: `t:${i}`,
			title: `Театр номер ${i + 1}`,
			href: `/t/${i}/`,
			kind: 'galaxy' as const,
			text: `Театр номер ${i + 1}`
		})),
		{ id: 't:typo', title: 'Театер у Львові', href: '/t/typo/', kind: 'galaxy', text: 'Театер у Львові' }
	];

	it('коли точних збігів досить — приблизних не додається', () => {
		const ids = searchEntries(театри(5), 'Театр').map((h) => h.id);
		expect(ids).not.toContain('t:typo');
		expect(ids.length).toBe(5);
	});

	it('коли точних мало — «Театер» з’являється', () => {
		/*
		 * Зворотний експеримент до попередньої перевірки: без нього вона була б
		 * зелена й тоді, коли шар одруків не працює взагалі.
		 */
		expect(searchEntries(театри(4), 'Театр').map((h) => h.id)).toContain('t:typo');
	});

	it('надто коротке слово не «виправляється»', () => {
		const короткі: SearchEntry[] = [
			{ id: 'x:sad', title: 'Сад', href: '/x/', kind: 'page', text: 'Вишневий сад' },
			{ id: 'x:sadok', title: 'Садок', href: '/y/', kind: 'page', text: 'Садок вишневий' }
		];
		// «рад» від «сад» — одна літера, і саме тому не шукається: на трьох
		// літерах одна помилка перетворює слово на будь-яке інше.
		expect(searchEntries(короткі, 'рад')).toEqual([]);
		// А «радок» від «садок» — уже осмислена одруківка.
		expect(searchEntries(короткі, 'радок').map((h) => h.id)).toEqual(['x:sadok']);
	});
});

describe('galaxyEntries: митці та друзі', () => {
	it('індексує фахівців (Олег Стефан) з правильним посиланням на сторінку митця', async () => {
		const { galaxyEntries } = await import('$lib/services/searchGalaxy');
		const entries = galaxyEntries();
		const stefan = entries.find((e) => e.title === 'Олег Стефан');
		expect(stefan).toBeDefined();
		expect(stefan?.href).toBe('/projects/galaxy-graduates/masters/oleh-stefan/');
		expect(stefan?.kind).toBe('expert');
		expect(stefan?.text).toContain('Львів');
		expect(stefan?.text).toContain('Мрій-Дім');

		const hits = searchEntries(entries, 'Олег Стефан');
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0].id).toBe('expert:oleh-stefan');
	});

	it('індексує фахівців (Римма Зюбіна) з правильним посиланням на сторінку митця', async () => {
		const { galaxyEntries } = await import('$lib/services/searchGalaxy');
		const entries = galaxyEntries();
		const ziubina = entries.find((e) => e.title === 'Римма Зюбіна');
		expect(ziubina).toBeDefined();
		expect(ziubina?.href).toBe('/projects/galaxy-graduates/masters/rymma-ziubina/');
		expect(ziubina?.kind).toBe('expert');
		expect(ziubina?.text).toContain('Київ');
		expect(ziubina?.text).toContain('Акторка театру і кіно');

		const hits = searchEntries(entries, 'Римма Зюбіна');
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0].id).toBe('expert:rymma-ziubina');
	});

	it('індексує друзів без власної сторінки з посиланням на /friends/', async () => {
		const { galaxyEntries } = await import('$lib/services/searchGalaxy');
		const entries = galaxyEntries();
		const barskyi = entries.find((e) => e.title === 'Борис Барський');
		expect(barskyi).toBeDefined();
		expect(barskyi?.href).toBe('/projects/galaxy-graduates/friends/');
		expect(barskyi?.kind).toBe('friend');

		const hits = searchEntries(entries, 'Борис Барський');
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0].id).toBe('friend:borys-barskyi');
	});

	it('індексує фестивалі з роком у назві та точною категорією festival', async () => {
		const { galaxyEntries } = await import('$lib/services/searchGalaxy');
		const entries = galaxyEntries();
		const mriiDim2012 = entries.find((e) => e.id === 'festival:mrii-dim-2012');
		expect(mriiDim2012).toBeDefined();
		expect(mriiDim2012?.title).toBe('Мрій-Дім (2012)');
		expect(mriiDim2012?.kind).toBe('festival');

		const mriiDim2013 = entries.find((e) => e.id === 'festival:mrii-dim-2013');
		expect(mriiDim2013).toBeDefined();
		expect(mriiDim2013?.title).toBe('Мрій-Дім (2013)');
		expect(mriiDim2013?.kind).toBe('festival');
	});
});

