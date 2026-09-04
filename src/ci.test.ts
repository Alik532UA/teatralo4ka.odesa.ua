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

/**
 * Вміст кожного workflow окремо: частина перевірок нижче не склеюється.
 *
 * `\r\n` → `\n` ОБОВ'ЯЗКОВО, і це не косметика. У JavaScript `.` не збігається
 * з `\r` — це термінатор рядка, — а `$` без прапорця `m` стоїть перед `\n`, але
 * не перед `\r`. Тому `/^(\s+)- name: (.*)$/` на рядку
 * `«      - name: Install dependencies\r»` не збігається ЖОДНОГО разу.
 *
 * Наслідок був такий: у CI чекаут із `\n`, розбір бачив 18 кроків і 5 гейтів;
 * на Windows-чекауті `core.autocrlf` дає `\r\n`, і той самий розбір бачив НУЛЬ.
 * Тобто `npm test` локально червонів на тому, що в CI зелене, — а це гірше за
 * відсутню перевірку: вона привчає не дивитися на червоне.
 *
 * Зловила це рівно перевірка живості нижче, і саме для цього вона й стоїть.
 */
const byFile = new Map(
	files.map((f) => [f, readFileSync(`${DIR}/${f}`, 'utf8').replace(/\r\n/g, '\n')] as const)
);
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

/**
 * Впала перевірка не забирає звіт у решти (CI-CD-AND-TOOLS-v8 § 1.8).
 *
 * ## Що саме ловить ця перевірка
 *
 * GitHub за замовчуванням НЕ запускає кроки після впалого. Job із рядка
 * `check → lint → test → audit` при червоному `lint` дає один рядок у звіті —
 * і про тести з аудитом відомо не «зелені» й не «червоні», а НІЧОГО.
 *
 * Це не гіпотеза. У `teatralo4ka` крок `Lint` падав на 26 помилках, і `gh run
 * list` показував `failure` на шести послідовних пушах; три наступні гейти
 * (`Unit tests`, `Audit`, `Validate content`) за ці дві доби не виконалися ані
 * разу. Червоне при цьому стало звичним фоном — тобто гірше за зелену галочку
 * без прогону, бо виглядає як чесне падіння.
 *
 * ## Межа правила
 *
 * Під нього підпадають лише НЕЗАЛЕЖНІ СТАТИЧНІ гейти — ті, яким потрібні самі
 * `node_modules`: типи, lint, юніт-тести, аудит, валідація вмісту, паритет мов.
 * Кроки з побічним ефектом (`build`, `deploy`, `upload-pages-artifact`) і кроки,
 * що залежать від `build/` або від браузерів (`check:build`, `check:bundle`,
 * Playwright, Lighthouse), `!cancelled()` НЕ отримують: запускати їх після
 * впалої збірки означає не звіт, а шум.
 *
 * Гейт визначається за КОМАНДОЮ, а не за назвою кроку: назви в проєктах різні
 * («Lint» / «Linting», «Unit Tests» / «Run unit tests»), команди однакові.
 *
 * Перший гейт у job `if` не потребує: до нього ще ніщо не падало.
 */
const INDEPENDENT_GATE =
	/npm run check(?![:\w])|npm run check:(worker|i18n)\b|npm run lint(?![:\w])|npm (run )?test(?!:(e2e|watch))(:\w+)?(?!\S)|npm audit\b|npm run validate-content\b/;
/** Виглядає гейтом, але залежить від збірки чи браузерів. */
const BUILD_DEPENDENT = /check:build|check:bundle|check:rules|playwright|lhci|npm run build/;

/**
 * Кроки одного workflow у порядку появи, з розбиттям на job.
 *
 * Розбір регуляркою, а не YAML-парсером: `js-yaml` є не в кожному проєкті, а
 * додавати залежність заради однієї перевірки дорожче за розбір рівнів відступу.
 * Ціна — перевірка «розбір живий» нижче, без якої порожній результат читався б
 * як «порушень немає».
 */
function stepsOf(text: string): { job: string; name: string; body: string }[] {
	const steps: { job: string; name: string; body: string }[] = [];
	const lines = text.split('\n');
	let job = '(поза job)';
	for (let i = 0; i < lines.length; i++) {
		const jobLine = /^ {2}([A-Za-z0-9_.-]+):\s*$/.exec(lines[i]);
		if (jobLine) {
			job = jobLine[1];
			continue;
		}
		const stepLine = /^(\s+)- name: (.*)$/.exec(lines[i]);
		if (!stepLine) continue;
		const [, indent, name] = stepLine;
		let j = i + 1;
		// Коментар на рівні кроку належить НАСТУПНОМУ кроку: інакше рядок
		// «# playwright install без кешу…» приліплюється до `Audit dependencies`
		// і виключає його як залежний від браузерів.
		while (
			j < lines.length &&
			!new RegExp(`^${indent}- `).test(lines[j]) &&
			!new RegExp(`^${indent}#`).test(lines[j])
		) {
			j++;
		}
		steps.push({ job, name: name.trim(), body: lines.slice(i, j).join('\n') });
	}
	return steps;
}

describe('гейти не ховають один одного (CI-CD-AND-TOOLS-v8 § 1.8)', () => {
	// Свій перелік файлів, а не спільний `all`: назва файлу потрібна в тексті
	// помилки, а склеєний вміст її втрачає.
	// Вміст беремо з `byFile`, а не читаємо файл ЗНОВУ: там уже нормалізовані
	// закінчення рядків, без яких цей розбір бачить нуль кроків на Windows.
	const gates = files.flatMap((file) =>
		stepsOf(byFile.get(file) ?? '')
			.filter((s) => INDEPENDENT_GATE.test(s.body) && !BUILD_DEPENDENT.test(s.body))
			.map((s) => ({ ...s, file }))
	);

	it('вміст workflow приходить без `\\r`', () => {
		/*
		 * Це перевірка МЕЖІ, а не одного розбору, і саме тому вона тут.
		 *
		 * `stepsOf` вимагає нормалізованого тексту: його `/^(\s+)- name: (.*)$/`
		 * не має прапорця `m`, а в JavaScript `.` не збігається з `\r` — тобто на
		 * CRLF-чекауті розбір бачить НУЛЬ кроків. Лагодити можна було й у самому
		 * `stepsOf`, але тоді наступна регулярка без `m`, яку тут допишуть,
		 * наступить на те саме. Нормалізація стоїть один раз, при читанні, — і
		 * ця перевірка стежить, щоб її не прибрали.
		 *
		 * Синтетичний приклад нижче — щоб перевірка не залежала від того, як git
		 * саме зараз розгорнув репозиторій: на машині з `\n` вона інакше зеленіла б,
		 * не сказавши про `\r\n` нічого.
		 */
		const dirty = [...byFile.entries()].filter(([, text]) => text.includes('\r')).map(([f]) => f);
		expect(dirty, `нормалізація закінчень рядків зникла: ${dirty.join(', ')}`).toEqual([]);

		const step = ['jobs:', '  build:', '    steps:', '      - name: Lint', '        run: npm run lint'];
		expect(stepsOf(step.join('\n')).length, 'розбір не бачить кроку навіть із `\\n`').toBe(1);
		expect(
			stepsOf(step.join('\r\n')).length,
			'`stepsOf` і далі не переживає `\\r\\n` — тобто нормалізація при читанні ' +
				'обов’язкова, і попереднє твердження не декоративне'
		).toBe(0);
	});

	it('розбір живий: незалежні статичні гейти знайдено', () => {
		expect(
			gates.length,
			'у workflow не знайдено жодного кроку з `npm run check/lint/test/audit` — ' +
				'або розбір зламався, або гейтів справді немає; обидва випадки червоні'
		).toBeGreaterThan(0);
	});

	it('кожен гейт після першого в job несе `if: !cancelled()`', () => {
		const seen = new Set<string>();
		const offenders: string[] = [];
		for (const gate of gates) {
			const key = `${gate.file}::${gate.job}`;
			const isFirst = !seen.has(key);
			seen.add(key);
			if (isFirst) continue;
			if (!/!cancelled\(\)/.test(gate.body)) {
				offenders.push(`${gate.file} → ${gate.job} → «${gate.name}»`);
			}
		}
		expect(
			offenders,
			`перший червоний гейт забере звіт у цих кроків:\n${offenders.join('\n')}`
		).toEqual([]);
	});

	it('`continue-on-error` не стоїть на гейтах', () => {
		// `continue-on-error: true` — не альтернатива `!cancelled()`, а
		// протилежність: job зеленіє при червоному гейті. Це рівно те, що § 1.6
		// забороняє.
		const lax = gates
			.filter((g) => /continue-on-error:\s*true/.test(g.body))
			.map((g) => `${g.file} → «${g.name}»`);
		expect(lax, `гейт, який не валить job:\n${lax.join('\n')}`).toEqual([]);
	});
});

/**
 * Кеш залежностей справді влучає (CI-CD-AND-TOOLS-v8 § 1.6).
 *
 * ## Дефект, який це ловить
 *
 * `.husky/pre-commit` кличе `npm run bump-version`, і той піднімає `version` у
 * `package.json` та `package-lock.json` на КОЖЕН коміт. Тому будь-який ключ
 * кешу, зроблений із `hashFiles('package-lock.json')` — зокрема вбудований
 * `cache: "npm"` у `actions/setup-node`, який усередині робить рівно це, —
 * змінюється щокоміту, і кеш не влучає НІ РАЗУ.
 *
 * Заміряно 2026-09-04, а не припущено: `npm cache is not found` у журналі
 * кожного job; `gh cache list` — три різні ключі `node-cache-Linux-x64-npm-*` на
 * `refs/heads/main` за півтори години; `npm ci` 5 хв 02 с у деплої, 7 хв 03 с у
 * глибоких перевірках, 4 хв 09 с у гейтах — проти 14 с добою раніше, коли
 * реєстр npm ще був швидкий. Тобто дефект просидів непоміченим саме тому, що
 * без нього все одно швидко, — і виставив рахунок у найгірший день.
 *
 * Ця перевірка потрібна ще й тому, що дефект СТРАШНО легко повернути: `cache:
 * "npm"` — рядок із офіційної документації `setup-node`, і наступна правка
 * воркфлоу поставить його назад як «стандартний спосіб».
 *
 * ## Чому саме дві вимоги
 *
 * Стабільний ключ дає влучання. `restore-keys` дає влучання ще й тоді, коли
 * залежність справді змінилася: піднімається попередній кеш, і `npm ci` качає
 * різницю, а не всі 647 пакетів. Без нього одне оновлення Dependabot повертає
 * повне завантаження — тобто рівно ту ціну, від якої тікаємо.
 *
 * Зворотний експеримент (§ 1.1): повернути `key: npm-…-${{
 * hashFiles('package-lock.json') }}` або `cache: "npm"` — перевірка мусить
 * назвати файл і рядок.
 */
describe('кеш залежностей у CI влучає', () => {
	/**
	 * Коментарі геть — інакше перевірка ловить власне пояснення.
	 *
	 * Той самий урок, що записаний у `src/meta-description.test.ts`: там регулярка
	 * знайшла згадку `<meta name="description">` у коментарі й назвала порушником
	 * файл, який нічого не порушував. У цих воркфлоу заборонений рядок згаданий у
	 * п'яти коментарях — саме там, де пояснено, чому він заборонений.
	 */
	const безКоментарів = new Map(
		[...byFile.entries()].map(
			([file, text]) =>
				[file, text.replace(/^[ \t]*#.*$/gm, '').replace(/(:\s*\S.*?)\s+#.*$/gm, '$1')] as const
		)
	);

	it('перевірка жива: у воркфлоу є кеш і є встановлення залежностей', () => {
		const текст = [...безКоментарів.values()].join('\n');
		expect(/uses:\s*actions\/cache@/.test(текст), 'жодного actions/cache — перевіряти нема що').toBe(
			true
		);
		expect(/run:\s*npm ci\b/.test(текст), 'жодного `npm ci` — перевіряти нема що').toBe(true);
	});

	it('ключ кешу не робиться з package-lock.json (§ 1.6)', () => {
		const offenders: string[] = [];
		for (const [file, text] of безКоментарів) {
			text.split('\n').forEach((line, i) => {
				if (/hashFiles\([^)]*package-lock\.json/.test(line)) {
					offenders.push(`${file}:${i + 1} — ${line.trim()}`);
				}
				if (/^\s*cache:\s*["']?npm["']?\s*$/.test(line)) {
					offenders.push(`${file}:${i + 1} — cache: "npm" у setup-node`);
				}
			});
		}
		expect(
			offenders,
			'`bump-version` піднімає версію в lock-файлі щокоміту, тож такий ключ ' +
				'не влучає ніколи — потрібен `node scripts/deps-hash.mjs`:\n' +
				offenders.join('\n')
		).toEqual([]);
	});

	/**
	 * Крок цілком, а не одним рядком.
	 *
	 * Спроба вирізати блок регуляркою `[\s\S]*?(?=\n\1- |\n\S|$)` з прапорцем
	 * `m` дала нуль: із `m` крапка-кінець `$` збігається з КІНЦЕМ КОЖНОГО РЯДКА,
	 * тож ліниве повторення спинялося одразу. Перевірка тоді назвала порушниками
	 * усі сім кешів, зокрема ті, у яких `restore-keys` стоїть. Прохід рядками
	 * такої двозначності не має.
	 */
	function блокиКешу(text: string): string[] {
		const рядки = text.split('\n');
		const блоки: string[] = [];
		for (let i = 0; i < рядки.length; i += 1) {
			if (!/uses:\s*actions\/cache@/.test(рядки[i])) continue;
			let початок = i;
			while (початок > 0 && !/^\s*- /.test(рядки[початок])) початок -= 1;
			const відступ = (/^(\s*)- /.exec(рядки[початок])?.[1] ?? '').length;
			let кінець = початок + 1;
			while (кінець < рядки.length) {
				const рядок = рядки[кінець];
				const свій = /^(\s*)\S/.exec(рядок)?.[1]?.length;
				if (свій !== undefined && свій <= відступ) break;
				кінець += 1;
			}
			блоки.push(рядки.slice(початок, кінець).join('\n'));
		}
		return блоки;
	}

	it('розбір живий: блок кроку з кешем читається цілком', () => {
		const блоки = [...безКоментарів.values()].flatMap(блокиКешу);
		expect(блоки.length, 'жодного блоку — розбір зламався').toBeGreaterThan(0);
		expect(
			блоки.filter((б) => /key:/.test(б)).length,
			'у жодному блоці немає `key:` — значить блок обрізається на першому ж рядку, ' +
				'і твердження нижче зеленіло б на порожньому місці'
		).toBe(блоки.length);
	});

	it('кожен actions/cache має restore-keys (§ 1.6)', () => {
		const offenders: string[] = [];
		for (const [file, text] of безКоментарів) {
			for (const блок of блокиКешу(text)) {
				if (/restore-keys:/.test(блок)) continue;
				const ключ = /key:\s*(.*)/.exec(блок)?.[1]?.trim() ?? '(без key)';
				offenders.push(`${file} — кеш із ключем ${ключ}`);
			}
		}
		expect(
			offenders,
			'без `restore-keys` перша ж зміна ключа коштує повне завантаження:\n' +
				offenders.join('\n')
		).toEqual([]);
	});
});

/**
 * `workflow_run` посилається на СПРАВЖНЮ назву воркфлоу (CI-CD-AND-TOOLS-v8 § 1.3).
 *
 * `on: workflow_run: workflows: ["…"]` зв'язує прогони РЯДКОМ, який мусить точно
 * збігатися з `name:` іншого файлу. Помилка в цьому рядку не дає ані падіння,
 * ані попередження: прогін просто не запускається ніколи. А «не запустився» у
 * звіті виглядає точнісінько як «нічого не знайшов» — той самий клас дефекту,
 * що вже описаний у § 1.4 вище.
 *
 * Зворотний експеримент (§ 1.1): переписати назву в `deep-checks.yml` на
 * «Deploy all schools» — перевірка мусить показати обидва рядки.
 */
describe('зв’язок workflow_run не розірваний', () => {
	const names = new Set(
		[...byFile.values()].flatMap((text) => [...text.matchAll(/^name:\s*(.+)$/gm)].map((m) => m[1].trim()))
	);

	it('перевірка жива: назви воркфлоу прочитано', () => {
		expect(names.size, 'жоден воркфлоу не має `name:` — порівнювати нема з чим').toBeGreaterThan(0);
	});

	it('кожна назва в workflows: існує', () => {
		const broken: string[] = [];
		for (const [file, text] of byFile) {
			const block = /workflow_run:\s*\n(?:[ \t]+.*\n)*?[ \t]+workflows:\s*\[(.*?)\]/.exec(text);
			if (!block) continue;
			for (const raw of block[1].split(',')) {
				const назва = raw.trim().replace(/^["']|["']$/g, '');
				if (назва && !names.has(назва)) broken.push(`${file} → «${назва}»`);
			}
		}
		expect(
			broken,
			`workflow_run указує на назву, якої немає — прогін не запуститься жодного разу:\n${broken.join('\n')}`
		).toEqual([]);
	});
});

/**
 * `--legacy-peer-deps` у CI (DEPENDENCIES-v8 § 2.4, `DEP-TOOL-ENGINE-CONFLICT`).
 *
 * Прапорець знімає перевірку peer-залежностей для УСЬОГО дерева — тобто гасить
 * сигнал там, де він потрібен, заради одного пакета, який його породив. І
 * головне: він переживає причину. У `MindStep` його додали 2026-03-03 комітом
 * «resolve Vite 7 dependency conflict» і не знімали пів року; на 2026-08-23
 * `npm ci` без прапорця проходить чисто, тобто екосистема наздогнала Vite 7
 * давно, а перевірка peer-залежностей лишалася вимкненою.
 *
 * Правильний спосіб для інструмента, чиї транзитивні `engines` конфліктують із
 * проєктом, — обгортка над `npx` із послабленням РІВНО для дочірнього процесу
 * (`scripts/firebase-cli.mjs`), а не прапорець на весь install.
 *
 * Перевірка тримає нуль: у шести проєктах із семи прапорця не було ніколи, і
 * ратчет на нулі коштує нічого — зате перша ж спроба «швидко полагодити install»
 * стає видимою в прогоні, а не через пів року.
 */
describe('install у CI не глушить перевірку peer-залежностей', () => {
	it('жоден workflow не кличе npm із --legacy-peer-deps', () => {
		const offenders = files.filter((file) =>
			/--legacy-peer-deps/.test(readFileSync(`${DIR}/${file}`, 'utf8'))
		);
		expect(
			offenders,
			'прапорець знімає перевірку peer-залежностей для всього дерева; ' +
				'для інструмента з конфліктом engines є обгортка над npx (DEPENDENCIES-v8 § 2.4):\n' +
				offenders.join('\n')
		).toEqual([]);
	});

	it('перевірка жива: workflow прочитано', () => {
		expect(files.length, 'у .github/workflows немає жодного yml').toBeGreaterThan(0);
	});
});
