// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Кожен файл перевірки належить раннеру, який у проєкті справді є
 * (AI-AGENT-PITFALLS-v8 § 1.3).
 *
 * Клас дефекту: файл виглядає як перевірка, рахується в переліку «що в нас
 * тестується» — і не запускається ніде. Три способи, якими це стається:
 *
 *   1. Раннера немає в залежностях узагалі (файл під Playwright у проєкті,
 *      де Playwright не встановлений).
 *   2. Раннер є, конфігу немає.
 *   3. Раннер і конфіг є, але файл лежить поза `testDir` — Playwright його
 *      просто не бачить, і жодного слова про це не буде.
 *
 * Мовчазне зникнення перевірки гірше за порожню заглушку: заглушка хоч
 * виконується. Окремо ловиться `@ts-nocheck` — він вимикає останній гейт,
 * який міг би помітити мертвий імпорт.
 *
 * Зворотний експеримент (§ 1.1): тимчасово прибрати `vitest` із
 * `devDependencies` — перевірка має перелічити всі файли перевірок проєкту.
 */

/** Корінь проєкту: vitest завжди стартує звідти, на відміну від `__dirname` в ESM. */
const ROOT = process.cwd().replace(/\\/g, '/');

/**
 * Каталоги, у яких взагалі можуть лежати файли перевірок.
 *
 * `vitest` і `scripts` додано 2026-08-20: перший тримає `support/tokens.test.ts`,
 * тобто справжню перевірку, і вона не потрапляла в цей інваріант зовсім. Другий —
 * тому що саме туди кладуть «швиденько перевірити» і залишають назавжди.
 */
const SEARCH_DIRS = ['src', 'tests', 'e2e', 'vitest', 'scripts'];

const RUNNERS = [
	{ imports: '@playwright/test', dep: '@playwright/test', config: /^playwright\.config\./ },
	{ imports: 'vitest', dep: 'vitest', config: /^vitest\.config\.|^vite\.config\./ }
];

function playwrightTestDir(): string | null {
	const config = readdirSync(ROOT).find((f) => /^playwright\.config\./.test(f));
	if (!config) return null;
	const source = readFileSync(join(ROOT, config), 'utf8');
	const match = source.match(/testDir\s*:\s*['"`]\.?\/?([^'"`]+)['"`]/);
	return match ? match[1].replace(/\/$/, '') : null;
}

/**
 * Коментарі відрізаються перед пошуком імпорту, інакше перевірка оголосить
 * сиротою сама себе: у докблоці вище процитовано назви раннерів.
 */
function withoutComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function walk(dir: string, out: string[] = []): string[] {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(spec|test)\.(ts|js)$/.test(entry)) out.push(full.replace(/\\/g, '/'));
	}
	return out;
}

const specFiles = SEARCH_DIRS.flatMap((dir) => walk(join(ROOT, dir))).map((f) => f.slice(ROOT.length + 1));

describe('файли перевірок', () => {
	it('перевірка жива: файли перевірок узагалі знайдено', () => {
		expect(specFiles.length, 'жодного файлу перевірки — сканер шукає не там').toBeGreaterThan(2);
	});

	it('кожен файл перевірки належить раннеру, який у проєкті є', () => {
		const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
		const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
		const rootEntries = readdirSync(ROOT);

		const orphans: string[] = [];
		for (const file of specFiles) {
			const source = withoutComments(readFileSync(join(ROOT, file), 'utf8'));
			const runner = RUNNERS.find((r) =>
				new RegExp(`from\\s*['"]${r.imports.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}['"]`).test(source)
			);

			if (!runner) {
				orphans.push(`${file}: не імпортує жодного відомого раннера`);
				continue;
			}
			if (!deps[runner.dep]) {
				orphans.push(`${file}: імпортує ${runner.dep}, якого немає в package.json`);
				continue;
			}
			if (!rootEntries.some((entry) => runner.config.test(entry))) {
				orphans.push(`${file}: імпортує ${runner.dep}, але конфігу для нього в корені немає`);
				continue;
			}
			if (runner.dep === '@playwright/test') {
				const dir = playwrightTestDir();
				if (dir && !file.startsWith(`${dir}/`)) {
					orphans.push(`${file}: під Playwright, але поза testDir «${dir}» — раннер його не бачить`);
				}
			}
		}

		expect(orphans, `перевірки, яких не запускає ніхто:\n${orphans.join('\n')}`).toEqual([]);
	});

	it('жоден файл перевірки не вимикає типи через @ts-nocheck', () => {
		const silenced = specFiles.filter((file) =>
			/^\s*\/\/\s*@ts-nocheck/m.test(readFileSync(join(ROOT, file), 'utf8'))
		);
		expect(
			silenced,
			`@ts-nocheck вимикає останній гейт, який міг би помітити мертвий імпорт:\n${silenced.join('\n')}`
		).toEqual([]);
	});
});

/**
 * Маска `include` раннера не викидає жодного файлу перевірки
 * (AI-AGENT-PITFALLS-v8 § 1.2).
 *
 * Це третій випадок, гірший за порожню заглушку й за перевірку, що дивиться
 * поруч: файл написаний правильно, ловить саму помилку — і НЕ ВХОДИТЬ У ПРОГІН.
 * У виводі немає ні падіння, ні згадки про нього, а підсумковий рядок звітує
 * успіх по тому, що лишилося.
 *
 * `test-runners.test.ts` вище цього не бачить за побудовою: він перевіряє, що в
 * проєкті є раннер, чий API файл імпортує, — а не те, що раннер цей файл
 * ПІДХОПИТЬ. Різниця конкретна: маска цього проєкту — `src/**` плюс
 * `vitest/support/**\/*.test.ts`. Другий шаблон покриває лише ОДИН суфікс, тож
 * `vitest/support/tokens.spec.ts` зник би мовчки, і `npm test` лишився б зеленим.
 *
 * Зворотний експеримент (§ 1.1): звузити маску в `vitest.config.ts` до
 * `src/**\/*.spec.ts` — перевірка мусить перелічити всі `*.test.ts` проєкту.
 */
describe('маска include', () => {
	const CONFIG = 'vitest.config.ts';

	/** Літерали з `include: [...]` у конфігу раннера. */
	function includeGlobs(): string[] {
		const source = readFileSync(join(ROOT, CONFIG), 'utf8');
		const list = /\binclude\s*:\s*\[([^\]]*)\]/.exec(source)?.[1] ?? '';
		return [...list.matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
	}

	/** Літерал регексу з довільного тексту. */
	function quote(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/**
	 * Glob у регекс — одним проходом.
	 *
	 * Розкривати `{a,b}` окремим `replace` до екранування не можна: наступний
	 * прохід екранує вже й дужки з `|` розкритої групи, і шаблон перестає
	 * збігатися з чим завгодно. Перша редакція цієї перевірки саме так і впала
	 * на власному файлі — тобто canary нижче зробив свою роботу.
	 */
	function globToRegExp(glob: string): RegExp {
		let out = '';
		let i = 0;
		while (i < glob.length) {
			const rest = glob.slice(i);
			if (rest.startsWith('**/')) {
				out += '(?:[^/]+/)*';
				i += 3;
			} else if (rest.startsWith('**')) {
				out += '.*';
				i += 2;
			} else if (rest.startsWith('*')) {
				out += '[^/]*';
				i += 1;
			} else if (rest.startsWith('{')) {
				const close = rest.indexOf('}');
				if (close === -1) {
					out += quote('{');
					i += 1;
				} else {
					out += `(?:${rest.slice(1, close).split(',').map(quote).join('|')})`;
					i += close + 1;
				}
			} else {
				out += quote(glob[i]);
				i += 1;
			}
		}
		return new RegExp(`^${out}$`);
	}

	const globs = includeGlobs();

	it('перевірка жива: маску в конфігу знайдено', () => {
		expect(globs.length, `у ${CONFIG} не знайдено include — перевіряти нема чим`).toBeGreaterThan(0);
	});

	it('кожен файл перевірки Vitest потрапляє в маску', () => {
		const patterns = globs.map(globToRegExp);
		const playwrightDir = playwrightTestDir();

		const missed = specFiles
			// Файли Playwright має свій testDir — його перевіряє describe вище.
			.filter((file) => !(playwrightDir && file.startsWith(`${playwrightDir}/`)))
			.filter((file) => !patterns.some((pattern) => pattern.test(file)));

		expect(
			missed,
			`ці файли не потрапляють у прогін — «N passed» їх не рахує:\n${missed.join('\n')}`
		).toEqual([]);
	});

	it('маска сама себе покриває — інваріант у прогоні', () => {
		const self = 'src/test-runners.test.ts';
		expect(specFiles, 'сканер не знайшов сам себе — шлях змінився').toContain(self);
		expect(globs.map(globToRegExp).some((pattern) => pattern.test(self))).toBe(true);
	});
});
