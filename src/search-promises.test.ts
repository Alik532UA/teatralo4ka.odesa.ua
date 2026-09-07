// @vitest-environment node
import { describe, expect, it } from 'vitest';
import ukJson from './lib/i18n/locales/uk.json';
import enJson from './lib/i18n/locales/en.json';
import mastersIndex from './lib/data/masters.index.json';
import { FESTIVALS, matchesFestivalQuery } from '$lib/data/festivals';
import { GROUPS, matchesGroupQuery } from '$lib/data/groups';
import { INSTITUTIONS, matchesInstitutionQuery } from '$lib/data/institutions';
import { THEATRES, matchesTheatreQuery } from '$lib/data/theatres';
import { PLAYS, matchesPlayQuery } from '$lib/data/plays';
import { matchesMasterQuery } from '$lib/data/masters';
import { filterGraduates } from '$lib/utils/graduateGalaxy';
import graduatesIndex from '$lib/data/graduates.index.json';
import type { GraduateIndexEntry } from '$lib/data/graduates';

/**
 * ПОЛЕ ПОШУКУ ВИКОНУЄ СВОЮ ОБІЦЯНКУ.
 *
 * ## Що це за дефект
 *
 * Автор знайшов його сам: «обіцяємо шукати по країні теж і не шукаємо». Поле на
 * сторінці фестивалів було підписане «Пошук за назвою, країною або роком», а
 * «Україна» давала нуль — бо в реєстрі лежить код `UA`, і в полях пошуку були
 * саме коди. «Прилуки» теж давали нуль: міста в переліку не було взагалі, хоч
 * рядок його показує.
 *
 * Той коміт полагодив фестивалі й додав гейт на КОДИ КРАЇН — але не на саму
 * обіцянку. Тобто клас лишився відкритим, і ревізія знайшла в ньому ще
 * випадки: `/admin/pages` обіцяв категорію й не шукав її; сторінка вистав
 * шукала своїм `includes`, тож «Полтавка Наталка» не знаходила «Наталку
 * Полтавку»; ім'я майстрині стояло в рядку групи й не шукалося.
 *
 * ## Як перевіряється
 *
 * Двома кроками, і разом вони замикають коло:
 *
 * 1. **Текст ↔ перелік критеріїв.** Слова обіцянки читаються з ЖИВОГО
 *    підпису поля обома мовами. Набір знайдених критеріїв мусить точно
 *    дорівнювати заявленому — тобто дописане в підпис слово без правила валить
 *    перевірку, і навпаки.
 * 2. **Критерій ↔ поведінка.** Для кожного критерію береться СПРАВЖНЄ значення
 *    з реєстру, віддається зіставлювачу, і запис мусить знайтися. Це не можна
 *    задовольнити коментарем: або знаходить, або ні.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v9 § 1.1)
 *
 * Проведено: з `matchesInstitutionQuery` прибрано назви країн — упала поведінка
 * критерію «країна» саме для закладів; із підпису закладів прибрано слово
 * «країною» — упала перевірка тексту; `matchesGroupQuery` перестав брати
 * майстрів — упала поведінка критерію «майстер».
 */

type Критерій =
	| 'name'
	| 'city'
	| 'country'
	| 'year'
	| 'master'
	| 'subject'
	| 'author'
	| 'group'
	| 'play'
	| 'participant';

/**
 * Слова, якими підпис поля називає критерій.
 *
 * Корені, а не цілі слова: підпис ставить їх у різних відмінках («містом»,
 * «країною», «роком»). Набір закритий — саме тому дописане в підпис слово
 * ЗНАЙДЕТЬСЯ або зламає перевірку, а не проїде мовчки.
 */
const СЛОВА: Record<Критерій, { uk: RegExp; en: RegExp }> = {
	/*
	 * Два корені, і це не недбалість: підпис каже «за НАЗВОЮ» про річ
	 * (фестиваль, заклад, театр) і «за ІМЕНЕМ» про людину (майстер, випускник).
	 * Перша редакція словника мала лише «назв», і перевірка одразу назвала два
	 * поля, де критерій той самий, а слово інше.
	 */
	name: { uk: /назв|імен/i, en: /\bname\b/i },
	city: { uk: /міст/i, en: /\bcity\b/i },
	country: { uk: /країн/i, en: /\bcountry\b/i },
	year: { uk: /рок|роц/i, en: /\byear\b/i },
	master: { uk: /майстр/i, en: /\bmaster\b/i },
	subject: { uk: /предмет/i, en: /\bsubject\b/i },
	author: { uk: /автор/i, en: /\bauthor\b/i },
	group: { uk: /груп/i, en: /\bgroup\b/i },
	play: { uk: /вистав/i, en: /\bplay\b/i },
	participant: { uk: /учасник/i, en: /\bparticipant\b/i }
};

const uk = ukJson as unknown as Record<string, Record<string, string>>;
const en = enJson as unknown as Record<string, Record<string, string>>;
const підпис = (ключ: string, мова: 'uk' | 'en') => {
	const [розділ, поле] = ключ.split('.');
	return (мова === 'uk' ? uk : en)[розділ][поле] ?? '';
};

/** Назва країни — так само, як її бере сторінка: із словника інтерфейсу. */
const назваКраїни = (мова: 'uk' | 'en') => (code: string) =>
	(мова === 'uk' ? uk : en).galaxy[`country.${code}`] ??
	((мова === 'uk' ? ukJson : enJson) as { galaxy: { country: Record<string, string> } }).galaxy
		.country[code] ??
	code;

const майстри = mastersIndex as { id: string; slug: string; displayName: string }[];
const імяМайстра = (id: string, fallback: string) =>
	майстри.find((m) => m.id === id || m.slug === id)?.displayName ?? fallback;

interface Поле {
	/** Ключ підпису — щоб перевірка читала те, що бачить читач. */
	ключ: string;
	критерії: Критерій[];
	/** Справжнє значення цього критерію й запит, що мусить знайти запис. */
	приклад: (критерій: Критерій) => { запит: string; знайдено: boolean } | null;
}

const фестиваль = FESTIVALS.find((f) => f.city && f.countries.length > 0 && f.years.length > 0);
const група = GROUPS.find((g) => g.masters.length > 0 && g.graduationYears.length > 0);
const заклад = INSTITUTIONS.find((i) => i.city && i.countries.length > 0);
const театр = THEATRES.find((t) => t.city && t.countries.length > 0);
const показ = PLAYS.find((p) => p.author && p.year);
const майстер = майстри.find((m) => m.displayName);

const ПОЛЯ: Поле[] = [
	{
		ключ: 'galaxy.festivalsSearch',
		критерії: ['name', 'city', 'country', 'year'],
		приклад: (к) => {
			if (!фестиваль) return null;
			const запит =
				к === 'name'
					? фестиваль.name
					: к === 'city'
						? (фестиваль.city as string)
						: к === 'country'
							? назваКраїни('uk')(фестиваль.countries[0])
							: String(фестиваль.years[0]);
			return { запит, знайдено: matchesFestivalQuery(фестиваль, запит, назваКраїни('uk')) };
		}
	},
	{
		ключ: 'galaxy.groupsSearch',
		критерії: ['name', 'master', 'year'],
		приклад: (к) => {
			if (!група) return null;
			const запит =
				к === 'name'
					? група.name
					: к === 'master'
						? імяМайстра(група.masters[0].id, група.masters[0].name)
						: String(група.graduationYears[0]);
			return { запит, знайдено: matchesGroupQuery(група, запит, імяМайстра) };
		}
	},
	{
		ключ: 'galaxy.institutionsSearch',
		критерії: ['name', 'city', 'country'],
		приклад: (к) => {
			if (!заклад) return null;
			const запит =
				к === 'name'
					? заклад.name
					: к === 'city'
						? (заклад.city as string)
						: назваКраїни('uk')(заклад.countries[0]);
			return { запит, знайдено: matchesInstitutionQuery(заклад, запит, назваКраїни('uk')) };
		}
	},
	{
		ключ: 'galaxy.theatresSearch',
		критерії: ['name', 'city', 'country'],
		приклад: (к) => {
			if (!театр) return null;
			const запит =
				к === 'name'
					? театр.name
					: к === 'city'
						? (театр.city as string)
						: назваКраїни('uk')(театр.countries[0]);
			return { запит, знайдено: matchesTheatreQuery(театр, запит, назваКраїни('uk')) };
		}
	},
	{
		ключ: 'galaxy.playsSearch',
		критерії: ['play', 'author', 'group', 'year'],
		приклад: (к) => {
			if (!показ) return null;
			const КУРС = 'Скоморохи';
			const запит =
				к === 'play'
					? показ.title
					: к === 'author'
						? (показ.author as string)
						: к === 'group'
							? КУРС
							: String(показ.year);
			return { запит, знайдено: matchesPlayQuery(показ, [КУРС], запит) };
		}
	},
	{
		ключ: 'galaxy.productionsSearch',
		критерії: ['play', 'author', 'group', 'year', 'participant'],
		приклад: (к) => {
			const УЧАСНИК = 'Марина Чебан';
			const КУРС = 'Скоморохи';
			const вистава = { ...(показ as NonNullable<typeof показ>), participants: [УЧАСНИК] };
			const запит =
				к === 'play'
					? вистава.title
					: к === 'author'
						? (вистава.author as string)
						: к === 'group'
							? КУРС
							: к === 'year'
								? String(вистава.year)
								: УЧАСНИК;
			return { запит, знайдено: matchesPlayQuery(вистава, [КУРС], запит) };
		}
	},
	{
		ключ: 'galaxy.searchMasters',
		критерії: ['name', 'subject'],
		приклад: (к) => {
			if (!майстер) return null;
			const ПРЕДМЕТ = 'Сценічна мова';
			const запис = { displayName: майстер.displayName, subjects: [ПРЕДМЕТ] };
			const запит = к === 'name' ? майстер.displayName : ПРЕДМЕТ;
			return { запит, знайдено: matchesMasterQuery(запис, запит) };
		}
	},
	{
		ключ: 'galaxy.searchName',
		критерії: ['name'],
		приклад: () => {
			const люди = graduatesIndex as GraduateIndexEntry[];
			const хтось = люди.find((g) => g.name);
			if (!хтось) return null;
			const знайдені = filterGraduates(люди, { query: хтось.name });
			return { запит: хтось.name, знайдено: знайдені.some((g) => g.id === хтось.id) };
		}
	}
];

/** Які критерії НАЗИВАЄ підпис — читається з тексту, а не з переліку вище. */
function критеріїЗПідпису(ключ: string, мова: 'uk' | 'en'): Критерій[] {
	const текст = підпис(ключ, мова);
	return (Object.keys(СЛОВА) as Критерій[]).filter((к) => СЛОВА[к][мова].test(текст));
}

describe('поле пошуку виконує свою обіцянку', () => {
	it('перевірка жива: підписи й дані на місці', () => {
		expect(ПОЛЯ.length).toBeGreaterThan(0);
		for (const поле of ПОЛЯ) {
			expect(підпис(поле.ключ, 'uk'), `немає підпису ${поле.ключ}`).toBeTruthy();
			expect(підпис(поле.ключ, 'en'), `немає англійського підпису ${поле.ключ}`).toBeTruthy();
		}
		expect(фестиваль && група && заклад && театр && показ && майстер, 'реєстри порожні').toBeTruthy();
	});

	it('підпис поля називає РІВНО ті критерії, що заявлені (обома мовами)', () => {
		const bad: string[] = [];
		for (const поле of ПОЛЯ) {
			for (const мова of ['uk', 'en'] as const) {
				const зТексту = критеріїЗПідпису(поле.ключ, мова).sort();
				const заявлені = [...поле.критерії].sort();
				if (зТексту.join(',') !== заявлені.join(',')) {
					bad.push(
						`${поле.ключ} (${мова}): підпис «${підпис(поле.ключ, мова)}» називає ` +
							`[${зТексту.join(', ')}], а заявлено [${заявлені.join(', ')}]`
					);
				}
			}
		}
		expect(
			bad,
			'підпис і перелік критеріїв розійшлися. Або допишіть правило, або приберіть ' +
				`слово з підпису — обіцяти й не шукати гірше за обидва:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('кожен обіцяний критерій СПРАВДІ знаходить запис', () => {
		const bad: string[] = [];
		for (const поле of ПОЛЯ) {
			for (const критерій of поле.критерії) {
				const проба = поле.приклад(критерій);
				if (!проба) {
					bad.push(`${поле.ключ}: немає даних, щоб перевірити «${критерій}»`);
					continue;
				}
				if (!проба.знайдено) {
					bad.push(`${поле.ключ}: «${критерій}» — запит «${проба.запит}» не знайшов запису`);
				}
			}
		}
		expect(
			bad,
			'поле обіцяє критерій, за яким не шукає — рівно той дефект, який автор ' +
				`знайшов на фестивалях:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('нісенітниця не знаходить нічого — інакше попередня перевірка нічого не варта', () => {
		const дурня = 'ЖЖЖ-нісенітниця-42';
		expect(matchesFestivalQuery(фестиваль!, дурня, назваКраїни('uk'))).toBe(false);
		expect(matchesGroupQuery(група!, дурня, імяМайстра)).toBe(false);
		expect(matchesInstitutionQuery(заклад!, дурня, назваКраїни('uk'))).toBe(false);
		expect(matchesTheatreQuery(театр!, дурня, назваКраїни('uk'))).toBe(false);
		expect(matchesPlayQuery(показ!, ['Скоморохи'], дурня)).toBe(false);
	});

	it('усі слова словника вжиті хоч в одному підписі — перелік не заростає', () => {
		const вжиті = new Set<Критерій>();
		for (const поле of ПОЛЯ) for (const к of поле.критерії) вжиті.add(к);
		const зайві = (Object.keys(СЛОВА) as Критерій[]).filter((к) => !вжиті.has(к));
		expect(зайві, `слово в словнику, якого не обіцяє жодне поле: ${зайві.join(', ')}`).toEqual([]);
	});
});
