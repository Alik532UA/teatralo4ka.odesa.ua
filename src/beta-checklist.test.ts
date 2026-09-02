// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import config from '../svelte.config.js';
import {
	BETA_CHECKS,
	BETA_TABS,
	BETA_UNCOVERED_ROUTES,
	COVERAGE_ORDER
} from './lib/data/betaChecklist';
import { HIDDEN_ROUTES } from './lib/config/hiddenRoutes';

/**
 * Інваріанти чеклиста бета-тестування (BETA-CHECKLIST-v8 § 5).
 *
 * Найдорожча пастка чеклистів — не помилка в пункті, а ВІДСТАВАННЯ: код
 * змінився, пункт лишився, і людина ставить «перевірено» на тому, чого вже
 * немає. Правило в документі помічає це тоді, коли документ хтось перечитає;
 * інваріант — на кожному прогоні. Саме тому канон називає чеклист у вигляді
 * `QA.md` анти-патерном рівня HIGH: не за формат, а за відсутність цих перевірок.
 */

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/[\\/]/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
};

const PRERENDER_ENTRIES: string[] = config.kit?.prerender?.entries ?? [];

/**
 * Локатори, зібрані так, як їх збирає браузер.
 *
 * У SvelteKit локатор буває складений із двох частин: у розмітці стоїть
 * `data-testid="theme-light{sfx}-btn"`, а `sfx` — це `''` або `'-mobile'`, тобто
 * рядка `theme-light-btn` немає в джерелах НІДЕ. Наївний пошук за точним збігом
 * забракував би правильну назву, і автор пункта прибрав би поле `testid` — рівно
 * так у чужому проєкті пункт став неперевірним, а перевірка мовчала, бо її
 * позбавили входу.
 */
function locators(): { literals: Set<string>; patterns: RegExp[] } {
	const literals = new Set<string>();
	const patterns: RegExp[] = [];

	for (const file of walk('src').filter((f) => f.endsWith('.svelte'))) {
		const text = readFileSync(file, 'utf8');
		for (const m of text.matchAll(/data-testid="([^"]+)"/g)) {
			const raw = m[1];
			if (!raw.includes('{')) {
				literals.add(raw);
				continue;
			}
			// Динамічна частина може бути порожньою (`sfx` = ''), тому `[^"]*`.
			const source = raw
				.split(/\{[^}]*\}/)
				.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.join('[^"]*');
			patterns.push(new RegExp(`^${source}$`));
		}
	}
	return { literals, patterns };
}

const LOCATORS = locators();
const locatorExists = (name: string) =>
	LOCATORS.literals.has(name) || LOCATORS.patterns.some((re) => re.test(name));

/** Внутрішні назви, яких у тексті для живої людини бути не мусить (§ 2.1). */
const INTERNAL_WORDS = [
	'.ts',
	'.svelte',
	'data-testid',
	'testid',
	'локатор',
	'$state',
	'$effect',
	'Firestore',
	'localStorage',
	'prerender',
	'canonical',
	'sitemap',
	'сервіс'
];

describe('чеклист бета-тестування: дані', () => {
	it('дані прочитані — перевірка жива', () => {
		// Без цього рядка все нижче зеленіє на порожньому переліку.
		expect(BETA_TABS.length, 'жодної вкладки').toBeGreaterThan(2);
		expect(BETA_CHECKS.length, 'жодного пункта').toBeGreaterThan(10);
		expect(LOCATORS.literals.size, 'жодного локатора в джерелах').toBeGreaterThan(50);
		expect(PRERENDER_ENTRIES.length, 'prerender.entries порожній').toBeGreaterThan(10);
	});

	it('кожен маршрут проєкту заявлений рівно однією вкладкою (§ 5.1)', () => {
		// Маршрути беруться з `prerender.entries` — того самого переліку, який
		// будує сайт. Другий список, узгоджений руками, розійшовся б із першим на
		// першій же новій сторінці, і розходження було б тихим.
		const claimed = new Map<string, string[]>();
		for (const tab of BETA_TABS) {
			for (const route of tab.routes) {
				claimed.set(route, [...(claimed.get(route) ?? []), tab.id]);
			}
		}

		const routes = PRERENDER_ENTRIES
			// Англійські дзеркала — ті самі сторінки; службові до чеклиста не належать.
			.filter((r) => r === '/' || !r.startsWith('/en'))
			.filter((r) => !HIDDEN_ROUTES.some((h) => r === h))
			.map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));

		const uncovered = routes.filter(
			(r) => !claimed.has(r) && !BETA_UNCOVERED_ROUTES.includes(r)
		);
		expect(
			uncovered,
			'сторінка є, а перевіряти її нічим. Або додайте пункти у вкладку, або\n' +
				'внесіть адресу в BETA_UNCOVERED_ROUTES із причиною — відсутність рядка\n' +
				'виглядає точно так само, як свідомий пропуск:\n  ' +
				uncovered.join('\n  ')
		).toEqual([]);

		const twice = [...claimed.entries()].filter(([, tabs]) => tabs.length > 1);
		expect(twice, `маршрут заявлений кількома вкладками: ${JSON.stringify(twice)}`).toEqual([]);

		const unknown = [...claimed.keys()].filter((r) => !routes.includes(r));
		expect(unknown, `вкладка заявляє адресу, якої немає в prerender.entries: ${unknown}`).toEqual(
			[]
		);
	});

	it('covered називає файл, і файл існує; решта не називає нічого (§ 5.2)', () => {
		const missing = BETA_CHECKS.filter((c) => c.coverage === 'covered').filter(
			(c) => !c.test || !existsSync(c.test)
		);
		expect(
			missing.map((c) => `${c.id} → ${c.test ?? '(без назви)'}`),
			'твердження про покриття гниє швидше за сам чеклист: файл названий і не існує'
		).toEqual([]);

		const liars = BETA_CHECKS.filter((c) => c.coverage !== 'covered' && c.test);
		expect(
			liars.map((c) => `${c.id} (${c.coverage}) → ${c.test}`),
			'рівень каже «покриття немає», а файл тесту названий — одне з двох неправда'
		).toEqual([]);
	});

	it('пункт, що просить натиснути, називає ІСНУЮЧИЙ локатор (§ 5.3)', () => {
		const naked = BETA_CHECKS.filter((c) => /натисн|press |introduce/i.test(c.text.uk)).filter(
			(c) => !c.testid
		);
		expect(
			naked.map((c) => c.id),
			'пункт просить натиснути й не називає локатора — неперевірний за побудовою'
		).toEqual([]);

		const ghosts = BETA_CHECKS.filter((c) => c.testid && !locatorExists(c.testid));
		expect(
			ghosts.map((c) => `${c.id} → ${c.testid}`),
			'названого локатора немає в джерелах. Це або перейменований елемент, або\n' +
				'вигаданий пункт — і друге дорожче: тестувальник поставить «не працює»\n' +
				'справному коду, а потім хтось розбиратиме звіт'
		).toEqual([]);
	});

	it('id унікальні й мають форму {вкладка}_{номер} (§ 5.4)', () => {
		const ids = BETA_CHECKS.map((c) => c.id);
		expect(ids.length, 'id повторюються — прогрес людини накладеться').toBe(new Set(ids).size);

		const wrongForm: string[] = [];
		for (const tab of BETA_TABS) {
			for (const check of tab.checks) {
				if (!new RegExp(`^${tab.id}_\\d+$`).test(check.id)) wrongForm.push(check.id);
			}
		}
		expect(wrongForm, 'id не з тієї вкладки або без номера').toEqual([]);
	});

	it('обидві мови непорожні, і жодна не залізла в чужу (§ 5.4)', () => {
		const bad: string[] = [];
		const cyrillic = /[а-яїієґА-ЯЇІЄҐ]/;

		for (const check of BETA_CHECKS) {
			for (const field of ['text', 'category'] as const) {
				const value = check[field];
				if (!value.uk.trim() || !value.en.trim()) bad.push(`${check.id}.${field}: порожньо`);
				// Забутий переклад тип не бачить: скопійований український рядок —
				// валідний `string`. Ловиться лише за кирилицею в англійському полі.
				if (cyrillic.test(value.en)) bad.push(`${check.id}.${field}.en: кирилиця`);
				if (!cyrillic.test(value.uk)) bad.push(`${check.id}.${field}.uk: без кирилиці`);
			}
		}
		expect(bad).toEqual([]);
	});

	it('в українському тексті один вид апострофа (§ 5.4)', () => {
		// Два різні апострофи ламають пошук по чеклисту — а шукати доводиться
		// щоразу, коли зі звіту треба знайти пункт за словом.
		const straight = BETA_CHECKS.filter((c) => c.text.uk.includes("'") || c.category.uk.includes("'"));
		expect(
			straight.map((c) => c.id),
			'прямий апостроф у тексті: у чеклисті вживається лише ’ (U+2019)'
		).toEqual([]);
	});

	it('текст не починається з номера і не містить внутрішніх назв (§ 2.1, § 2.2)', () => {
		const numbered = BETA_CHECKS.filter((c) => /^\s*\d/.test(c.text.uk) || /^\s*\d/.test(c.text.en));
		expect(
			numbered.map((c) => c.id),
			'номер малює сторінка з позиції — вписаний розійдеться з нею на першій вставці'
		).toEqual([]);

		const leaked: string[] = [];
		for (const check of BETA_CHECKS) {
			for (const word of INTERNAL_WORDS) {
				if (check.text.uk.includes(word) || check.text.en.includes(word)) {
					leaked.push(`${check.id}: ${word}`);
				}
			}
		}
		expect(
			leaked,
			'людина, яка згодилася потикати сайт, не знає, що таке локатор чи сервіс'
		).toEqual([]);
	});

	it('у кожної вкладки є пункт для людини і пункт-межа (§ 2.3, § 5.4)', () => {
		const noManual = BETA_TABS.filter((t) => !t.checks.some((c) => c.coverage === 'manual'));
		expect(
			noManual.map((t) => t.id),
			'вкладка, де все покрито машиною, марнує час людини'
		).toEqual([]);

		const noNegative = BETA_TABS.filter((t) => !t.checks.some((c) => c.negative));
		expect(
			noNegative.map((t) => t.id),
			'немає пункта «не мусить». Найдорожчі дефекти тихі: ліміт, який перестав\n' +
				'діяти, виглядає точно так само, як ліміт, що діє — і не натисне цього ніхто'
		).toEqual([]);
	});

	it('рівні показуються manual → testable → covered', () => {
		expect(COVERAGE_ORDER).toEqual(['manual', 'testable', 'covered']);
	});
});

describe('чеклист бета-тестування: сторінка поза індексом (§ 4)', () => {
	it('адреса є у prerender.entries обома мовами', () => {
		// § 5.5: зникнути може не сторінка, а лише англійське дзеркало — і це
		// найтихіший варіант, бо українська версія працює.
		const missing = HIDDEN_ROUTES.flatMap((route) => [route, `/en${route}`]).filter(
			(route) => !PRERENDER_ENTRIES.includes(route)
		);
		expect(missing, 'без запису в entries сторінки просто не буде у build/').toEqual([]);
	});

	it('svelte.config.js повторює перелік дослівно', () => {
		// Конфіг збірки не може імпортувати `.ts` через аліас, тож адреса написана
		// там удруге. Два списки без інваріанта — це два списки, що розходяться.
		const source = readFileSync('svelte.config.js', 'utf8');
		const listed = /const HIDDEN_ENTRIES = \[([^\]]*)\]/.exec(source)?.[1] ?? '';
		const parsed = [...listed.matchAll(/'([^']+)'/g)].map((m) => m[1]);
		expect(parsed.length, 'HIDDEN_ENTRIES у svelte.config.js не знайдено').toBeGreaterThan(0);
		expect(parsed).toEqual([...HIDDEN_ROUTES]);
	});

	it('robots.txt закриває кожну мовну адресу', () => {
		const robots = readFileSync('static/robots.txt', 'utf8');
		const missing = HIDDEN_ROUTES.flatMap((route) => [`${route}/`, `/en${route}/`]).filter(
			(route) => !robots.includes(`Disallow: ${route}`)
		);
		expect(missing, 'адреса не закрита в robots.txt').toEqual([]);
	});

	it('сторінка не з’являється в меню й у пошуку сайту', () => {
		// Прихована рівно настільки: адреса працює завжди, але шляху до неї з
		// самого сайту немає. Інакше «випадкова сторінка» приводила б туди
		// відвідувача — це зламана обіцянка посилання.
		//
		// Сама сторінка себе не «показує»: маршрут службової сторінки законно
		// лежить за цією ж адресою, і без цього винятку інваріант забороняв би
		// службовій сторінці існувати.
		const OWN_ROUTE = /^src\/routes\//;
		/*
		 * Названий виняток: ТЕКСТ ДЛЯ КОПІЮВАННЯ — не шлях зі сайту.
		 *
		 * `generateTextReport` збирає звіт про наповнення архіву, який людина
		 * копіює в буфер і надсилає собі чи колезі; останній рядок — «Допомогти
		 * заповнити архів: <адреса>». Це рівно те, що докблок реєстру й називає
		 * дозволеним: «посилання на неї дають руками тому, хто погодився
		 * допомогти». Клікнути його зі сайту не можна — воно з'являється лише в
		 * тексті, який людина забирає з собою.
		 */
		const REPORT_TEXT = new Set(['src/lib/data/stats.ts']);
		const linked = walk('src')
			.filter((f) => /\.(svelte|ts)$/.test(f))
			.filter((f) => !f.includes('beta') && !/\.(test|spec)\.ts$/.test(f))
			// Сам реєстр адресу, звісно, містить — він і є її єдиним джерелом.
			.filter((f) => f !== 'src/lib/config/hiddenRoutes.ts')
			.filter((f) => !OWN_ROUTE.test(f) && !REPORT_TEXT.has(f))
			.filter((f) => HIDDEN_ROUTES.some((route) => readFileSync(f, 'utf8').includes(route)));
		expect(
			linked,
			'посилання на службову сторінку з коду сайту — окрім переліку у config/hiddenRoutes.ts'
		).toEqual([]);
	});
});
