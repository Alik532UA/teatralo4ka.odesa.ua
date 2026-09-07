// @vitest-environment node
import { describe, expect, it } from 'vitest';
import config from '../svelte.config.js';
import {
	RENAMED_FESTIVAL_SLUGS,
	RENAMED_GRADUATE_ADDRESSES,
	RENAMED_GROUP_SLUGS,
	RENAMED_MASTER_SLUGS,
	RENAMED_PATHS,
	RENAMED_PLAY_IDS
} from './lib/config/renamedAddresses';
import { REDIRECT_PAGES } from './lib/config/redirects';
import { BETA_UNCOVERED_ROUTES } from './lib/data/betaChecklist';
import { FESTIVALS } from './lib/data/festivals';
import { GROUPS } from './lib/data/groups';
import { PLAYS } from './lib/data/plays';
import { MASTERS } from './lib/data/masters';
import { WITH_PAGE, graduateAddress } from './lib/data/graduates';

/**
 * Перейменована адреса справді веде на нову — і в збірці, а не лише на словах.
 *
 * ## Що саме тут ловиться
 *
 * П'ять мап старих адрес жили по одній у своїх маршрутах, і кожна обіцяла в
 * докблоці перенаправлення, якого НЕ БУЛО: стару адресу не пререндерили, а
 * `fallback: '404.html'` віддає готову сторінку «Сторінку не знайдено» й
 * маршрут заново не розв'язує. Заміряно 7 вересня 2026 у справжньому браузері:
 * усі 57 адрес давали 404. Компілятор цього не бачив — мапа є, `redirect()` у
 * коді є, типи сходяться.
 *
 * Щоб адреса справді ожила, її мусять знати ЧОТИРИ місця: `entries()` свого
 * маршруту (українська сторінка), `PUBLIC_ENTRIES` у `svelte.config.js`
 * (англійське дзеркало), `config/redirects.ts` (інакше збірка червоніє на
 * `meta refresh`) і `BETA_UNCOVERED_ROUTES` (інакше гейт чеклиста вимагає
 * пунктів на сторінку, якої людина не побачить). Три з чотирьох виводяться з
 * одного джерела, четверте — конфіг збірки — перевіряється тут.
 *
 * Саму поведінку (сторінка віддається з кодом 200 і містить `meta refresh` на
 * нову адресу) перевіряє `e2e/redirects.spec.ts` на зібраній статиці, обома
 * мовами.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v9 § 1.1)
 *
 * Проведено: з `PUBLIC_ENTRIES` прибрано один рядок — упала перевірка «адреса є
 * у prerender.entries обома мовами» й назвала обидві адреси; ціль однієї
 * вистави замінено на неіснуючий ключ — упала перевірка «ціль існує» й назвала
 * пару; ключем мапи зроблено адресу ЖИВОЇ сторінки (`boikot-2016`) — упали
 * одразу дві, «стара адреса не забирає чинну сторінку» і «ціль існує».
 */

const ENTRIES: string[] = config.kit?.prerender?.entries ?? [];

const МАПИ = {
	фестивалі: RENAMED_FESTIVAL_SLUGS,
	групи: RENAMED_GROUP_SLUGS,
	вистави: RENAMED_PLAY_IDS,
	майстри: RENAMED_MASTER_SLUGS,
	випускники: RENAMED_GRADUATE_ADDRESSES
} as const;

/** Чинні адреси кожного роду — те, на що перейменування має право вести. */
const ЧИННІ: Record<keyof typeof МАПИ, string[]> = {
	фестивалі: FESTIVALS.map((f) => f.slug),
	групи: GROUPS.map((g) => g.slug),
	вистави: PLAYS.map((p) => p.id),
	майстри: MASTERS.map((m) => m.slug),
	випускники: WITH_PAGE.map((g) => graduateAddress(g))
};

describe('перейменовані адреси', () => {
	it('перевірка жива: мапи не порожні й адреси зібрані', () => {
		// Без цього рядка все нижче зеленіє на порожньому переліку.
		expect(RENAMED_PATHS.length, 'жодної перейменованої адреси').toBeGreaterThan(10);
		expect(ENTRIES.length, 'prerender.entries порожній').toBeGreaterThan(10);
		for (const [рід, чинні] of Object.entries(ЧИННІ)) {
			expect(чинні.length, `${рід}: реєстр порожній, звіряти нема з чим`).toBeGreaterThan(0);
		}
	});

	it('адреса є у prerender.entries обома мовами', () => {
		/*
		 * Саме на цьому ламалося все інше: без рядка в `PUBLIC_ENTRIES`
		 * англійського дзеркала не існує, і `e2e/redirects.spec.ts` падає на 404 —
		 * а до нього ще треба дійти, бо збірка триває чверть години.
		 */
		const missing = RENAMED_PATHS.flatMap(([старий]) => [старий, `/en${старий}`]).filter(
			(шлях) => !ENTRIES.includes(шлях)
		);
		expect(
			missing,
			'без запису в PUBLIC_ENTRIES (svelte.config.js) сторінки не буде у build/'
		).toEqual([]);
	});

	it('адреса є в реєстрі заглушок — обома мовами', () => {
		const missing = RENAMED_PATHS.flatMap(([старий]) => [старий, `/en${старий}`]).filter(
			(шлях) => !(шлях in REDIRECT_PAGES)
		);
		expect(missing, 'без запису в config/redirects.ts заглушка їде в мапу сайту').toEqual([]);
	});

	it('ціль у реєстрі — хвіст нової адреси', () => {
		// Контракт поля `target` один для всіх записів реєстру:
		// `e2e/redirects.spec.ts` перевіряє, що `meta refresh` МІСТИТЬ цей рядок.
		const bad = RENAMED_PATHS.filter(([старий, новий]) => {
			const запис = REDIRECT_PAGES[старий];
			return !запис || запис.external || запис.target !== новий;
		}).map(([старий]) => старий);
		expect(bad).toEqual([]);
	});

	it('адреса заявлена в чеклисті як така, що не перевіряється', () => {
		const missing = RENAMED_PATHS.map(([старий]) => старий).filter(
			(шлях) => !BETA_UNCOVERED_ROUTES.includes(шлях)
		);
		expect(missing, 'гейт чеклиста вимагатиме пунктів на сторінку-перенаправлення').toEqual([]);
	});

	it('ціль існує — інакше перенаправлення веде в 404', () => {
		const bad: string[] = [];
		for (const [рід, мапа] of Object.entries(МАПИ)) {
			for (const [старий, новий] of Object.entries(мапа)) {
				if (!ЧИННІ[рід as keyof typeof МАПИ].includes(новий)) {
					bad.push(`${рід}: ${старий} → ${новий}, а такої сторінки немає`);
				}
			}
		}
		expect(bad, `перенаправлення в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('стара адреса не забирає чинну сторінку', () => {
		/*
		 * Ключ мапи перехоплює адресу ДО пошуку сторінки, тобто збіг зі справжнім
		 * slug зробив би живу сторінку недосяжною — і мовчки: у збірці вона стала б
		 * заглушкою з `meta refresh`, а не зникла.
		 */
		const bad: string[] = [];
		for (const [рід, мапа] of Object.entries(МАПИ)) {
			for (const старий of Object.keys(мапа)) {
				if (ЧИННІ[рід as keyof typeof МАПИ].includes(старий)) {
					bad.push(`${рід}: ${старий} — це чинна адреса, а не стара`);
				}
			}
		}
		expect(bad, `сторінка стала недосяжною:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('ланцюжків немає: ціль сама не є старою адресою', () => {
		// Два перенаправлення поспіль браузер пройде, але `meta refresh` додає
		// затримку на кожному, а пошуковик бачить другий крок окремою порожньою
		// сторінкою.
		const bad: string[] = [];
		for (const [рід, мапа] of Object.entries(МАПИ)) {
			for (const [старий, новий] of Object.entries(мапа)) {
				if (новий in мапа) bad.push(`${рід}: ${старий} → ${новий} → ${мапа[новий]}`);
			}
		}
		expect(bad).toEqual([]);
	});
});
