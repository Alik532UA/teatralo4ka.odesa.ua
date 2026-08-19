import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * CI-CD-AND-TOOLS-v8 § 3 — workflow теж код, і його стан перевіряється.
 *
 * Пайплайн живе поза межами всіх інших гейтів: `svelte-check` його не читає,
 * ESLint не читає, тести не читають. Помилка в ньому виявляється або на
 * наступному push (у кращому разі), або взагалі ніколи — коли крок мовчки
 * перестає щось перевіряти, а зелена галочка лишається.
 */
const DIR = '.github/workflows';

const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f)) : [];
/** Вміст кажного workflow окремо: частина перевірок нижче не склеюється. */
const byFile = new Map(files.map((f) => [f, readFileSync(`${DIR}/${f}`, 'utf8')] as const));
const all = [...byFile.values()].join('\n');
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
	scripts?: Record<string, string>;
};
const scripts = pkg.scripts ?? {};

describe('перевірка жива', () => {
	it('workflow знайдено', () => {
		expect(files.length, 'у .github/workflows немає жодного yml — перевіряти нема що').toBeGreaterThan(0);
	});
});

describe('CI', () => {
	it('тести запускаються в CI (§ 1.6)', () => {
		expect(/run:\s*npm (test|run test)/.test(all), 'у workflow немає кроку з тестами').toBe(true);
	});

	it('використовується npm ci, а не npm install', () => {
		expect(/run:\s*npm install\b/.test(all), 'npm install робить білд невідтворюваним').toBe(
			false
		);
	});

	it('Playwright має крок встановлення браузерів (§ 1.3)', () => {
		if (!/playwright test/.test(all)) return;
		expect(/playwright install/.test(all), 'без install крок падає на відсутньому браузері').toBe(
			true
		);
	});

	it('жоден тестовий скрипт не у watch-режимі (§ 1.4)', () => {
		// Не лише `test`: гейтом у workflow буває `test:unit`, `test:report`,
		// `test:ci` — і саме там watch і зустрічається, бо `test` перевіряють, а
		// решту ні. `test:watch` виключений навмисно: він для цього й існує.
		const watchers = Object.entries(scripts)
			.filter(([name]) => /^test(:|$)/.test(name) && name !== 'test:watch')
			.filter(([, cmd]) => /^vitest\s*$/.test(cmd));
		expect(watchers, 'watch-режим підвисне поза CI, де немає CI=true').toEqual([]);
	});

	/**
	 * CI-CD-AND-TOOLS-v8 § 1.3, AI-AGENT-PITFALLS-v8 § 1.4.
	 *
	 * `cancel-in-progress: true` (або відсутня група взагалі) означає, що пуш
	 * пачкою комітів лишає тільки останній прогін. Прогін, який УПЕРШЕ виконав
	 * би щойно доданий гейт, не завершується — і крок, якого ніколи не було в
	 * зеленому прогоні, у звіті не відрізняється від крока, що не знайшов
	 * порушень.
	 */
	it('деплой має групу паралельності без скасування (§ 1.3)', () => {
		const group = /concurrency:\s*\n\s*group:\s*(\S+)/.exec(all);
		expect(group, 'у workflow немає блоку concurrency').not.toBeNull();
		expect(
			/cancel-in-progress:\s*false/.test(all),
			'cancel-in-progress не false — проміжні прогони скасовуються разом із гейтами'
		).toBe(true);
	});

	/**
	 * CI-CD-AND-TOOLS-v8 § 1.5 — машинна перевірка правила «артефакт збірки не
	 * комітиться» (VERSIONING-v8 § 1.4). Іншого способу це помітити немає:
	 * брудне дерево після збірки виглядає як звичайна незакомічена правка.
	 */
	it('після збірки перевіряється чистота дерева (§ 1.5)', () => {
		if (!/run:\s*npm run build/.test(all)) return;
		expect(
			/run:\s*git diff --exit-code/.test(all),
			'немає кроку `git diff --exit-code` — артефакт збірки поїде в коміт непоміченим'
		).toBe(true);
	});

	/**
	 * Пункт поза шаблоном пакета — знайдений у цих проєктах.
	 *
	 * Workflow кличе npm-скрипти за іменем. Перейменування скрипта в
	 * `package.json` не ламає нічого локально й нічого не ламає на збірці: воно
	 * ламає рівно той крок CI, який на нього посилався, і виявляється це вже
	 * після push. Тут це видно до коміту.
	 */
	it('кожен npm-скрипт із workflow існує в package.json', () => {
		const referenced = [...all.matchAll(/run:\s*npm run ([\w:-]+)/g)].map((m) => m[1]);
		const missing = [...new Set(referenced)].filter((name) => !(name in scripts));
		expect(
			missing,
			`workflow кличе скрипт, якого немає — крок упаде на push: ${missing.join(', ')}`
		).toEqual([]);
	});

	/**
	 * CODE-QUALITY-v8 § 6.1 — гейти виконуються на КОЖЕН pull request.
	 *
	 * Клас дефекту, заміряний тут 2026-08-20: усі гейти проєкту жили в
	 * `deploy.yml` із тригером `push: branches: [main]`. Тобто в гілці, де йде
	 * робота, і в Dependabot-PR не перевірялося нічого — `npm run lint` місяцями
	 * міг бути червоним, і саме таким і був. Гейт, який не виконується, у звіті
	 * не відрізняється від гейта без порушень (AI-AGENT-PITFALLS-v8 § 1.4).
	 *
	 * Перевірка навмисно НЕ склеює файли: тригер в одному workflow і
	 * тестовий крок в іншому — це не покриття PR, а два різні прогони. Тому
	 * обидві ознаки шукаються в межах ОДНОГО файлу.
	 *
	 * Зворотний експеримент (§ 1.1): прибрати `pull_request` із `gates.yml` —
	 * перевірка мусить стати червоною.
	 */
	it('гейти виконуються на pull_request (§ 6.1)', () => {
		const onPullRequest = [...byFile.entries()].filter(([, text]) => {
			// Блок `on:` — до першого рядка без відступу після нього.
			const on = /^on:[ \t]*$([\s\S]*?)^\S/m.exec(text)?.[1] ?? '';
			return /^[ \t]+pull_request[ \t]*:/m.test(on) && /run:\s*npm (test|run test)/.test(text);
		});
		expect(
			onPullRequest.map(([file]) => file),
			'жоден workflow не запускає тести на pull_request — PR мерджиться неперевіреним'
		).not.toEqual([]);
	});
});

/**
 * CI-CD-AND-TOOLS-v8 § 2.1 — вендорні файли AI-інструкцій — тонкі вказівники.
 *
 * Канонічне джерело одне — `AGENTS.md`. Вендорний файл, що дублює зміст,
 * розходиться з ним — питання лише коли. Це не гіпотеза: до 2026-08-20
 * `.github/copilot-instructions.md` був копією на 200 рядків, де базовий шлях
 * був неправильний, половина згаданих файлів не існувала, а кількість тестів
 * відставала на порядок. Асистент, який прочитав би саме його, пише
 * `${base}/шлях` там, де проєкт вимагає `resolve()`.
 *
 * Розходження двох markdown-файлів не ловить ані `svelte-check`, ані lint,
 * ані тести — тому й жило довго. Дві ознаки вказівника перевірюються
 * машинно: він посилається на `AGENTS.md` і він короткий. Межа рядків — не
 * смак: саме вона відрізняє вказівник від копії з правилами.
 *
 * Зворотний експеримент (§ 1.1): дописати в будь-який із цих файлів таблицю
 * правил — перевірка мусить назвати саме його.
 */
describe('інструкції для AI', () => {
	/** Файли, які читають конкретні асистенти замість `AGENTS.md`. */
	const VENDOR = [
		'GEMINI.md',
		'CLAUDE.md',
		'.cursorrules',
		'.github/copilot-instructions.md'
	];

	/**
	 * Межа з запасом: найдовший чинний вказівник — 27 рядків (він несе ще й
	 * post-mortem видаленої копії). Сто рядків — це вже друга інструкція.
	 */
	const MAX_LINES = 60;

	it('AGENTS.md існує — перевірка жива', () => {
		expect(existsSync('AGENTS.md'), 'немає AGENTS.md — вказувати ні на що').toBe(true);
	});

	it('вендорний файл посилається на AGENTS.md і не дублює її (§ 2.1)', () => {
		const problems = VENDOR.filter(existsSync).flatMap((file) => {
			const text = readFileSync(file, 'utf8');
			const lines = text.split('\n').length;
			const issues: string[] = [];
			if (!text.includes('AGENTS.md')) issues.push(`${file}: не посилається на AGENTS.md`);
			if (lines > MAX_LINES) {
				issues.push(`${file}: ${lines} рядків (межа ${MAX_LINES}) — це друга інструкція, а не вказівник`);
			}
			return issues;
		});
		expect(problems, `вендорні файли розійдуться з AGENTS.md:\n${problems.join('\n')}`).toEqual([]);
	});
});
