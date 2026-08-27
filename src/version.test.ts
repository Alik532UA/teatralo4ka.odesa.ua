import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * VERSIONING-v8 § 6.
 *
 * Найважливіша перевірка тут — друга, і вона поза шаблоном пакета.
 *
 * `static/app-version.json` — це те, що бачить БРАУЗЕР ВІДВІДУВАЧА:
 * `services/version.ts` тягне цей файл і, якщо версія в ньому відрізняється від
 * збереженої, чистить кеші й перезавантажує сторінку. Оновлює його лише
 * `npm run bump-version` — а той жене `.husky/pre-commit` перед кожним комітом.
 *
 * Гачок, однак, не гарантія: свіжий клон до `npm install` його ще не має,
 * `--no-verify` його обходить, а `core.hooksPath` — локальне налаштування, якого
 * в репозиторії немає. Тому збіг файлів однаково тримає перевірка нижче.
 *
 * Наслідок розходження несиметричний. Якщо `package.json` пішов уперед, а файл
 * лишився позаду, механізм оновлення просто не спрацює: користувач сидітиме на
 * старому кеші, і жодна перевірка про це не скаже. У зворотний бік — гірше:
 * кожен відвідувач отримає примусове перезавантаження на версію, якої в збірці
 * немає.
 */
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/\\/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(ts|svelte)$/.test(entry)) out.push(full);
	}
	return out;
};

describe('версіонування', () => {
	const sources = walk('src').filter((f) => !/\.(test|spec)\.ts$/.test(f));

	it('знаходить джерела — перевірка жива', () => {
		expect(sources.length).toBeGreaterThan(0);
		expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it('версія ніде не захардкоджена (§ анти-патерни)', () => {
		const bad = sources.filter((f) =>
			/const\s+\w*VERSION\w*\s*=\s*['"]\d+\.\d+\.\d+['"]/.test(readFileSync(f, 'utf8'))
		);
		expect(
			bad,
			`хардкод версії розсинхронізується з релізом і бреше в баг-репорті:\n${bad.join('\n')}`
		).toEqual([]);
	});

	it('app-version.json збігається з package.json', () => {
		const raw = JSON.parse(readFileSync('static/app-version.json', 'utf8')) as {
			version?: string;
		};
		expect(
			raw.version,
			'файл версії відстав від package.json — механізм оновлення або не спрацює, ' +
				'або жене відвідувачів на версію, якої в збірці немає'
		).toBe(pkg.version);
	});

	/**
	 * Документація про бамп звіряється з ГАЧКОМ, а не переписується з пам'яті.
	 *
	 * Ціна вже заплачена. До 2026-08-28 `AGENTS.md`, `PROJECT-CONTEXT.md`,
	 * `README.md` і шапка ЦЬОГО файлу однаково стверджували «`husky` не
	 * встановлено, автобампу немає» — при тому, що `.husky/pre-commit` лежить у
	 * репозиторії, жене `npm run bump-version`, а `prepare` ставить гачки на
	 * `npm install`. Тобто чотири документи розповідали про власний репозиторій
	 * те, чого в ньому немає, і кожен, хто вірив їм, бампив ще раз руками —
	 * тобто стрибав через версію.
	 *
	 * Клас дефекту той самий, що в AI-AGENT-PITFALLS-v8 § 5.5: твердження про
	 * проєкт, зроблене з пам'яті, а не отримане командою. Різниця в тому, що
	 * документацію ніхто не прогоняє — тож її звіряє гейт.
	 *
	 * Зворотний експеримент: повернути «`husky` не встановлено» в `AGENTS.md` —
	 * перевірка мусить назвати файл і рядок. Зроблено, падає.
	 */
	it('документація не суперечить гачку, який справді лежить у репозиторії', () => {
		const HOOK = '.husky/pre-commit';
		const hookBumps = existsSync(HOOK) && /bump-version/.test(readFileSync(HOOK, 'utf8'));

		// Гачок прибрали свідомо — тоді ця перевірка не має про що судити, і
		// правити треба документацію, а не її.
		if (!hookBumps) return;

		/** Твердження, кожне з яких суперечить наявному гачку. */
		const CONTRADICTIONS = [
			/husky[^|\n]{0,40}не встановлен/i,
			/автобампу немає/i,
			/авто-?bump[^|\n]{0,30}не діє/i,
			/бамп[^|\n]{0,30}вручну/i
		];

		const DOCS = ['AGENTS.md', 'PROJECT-CONTEXT.md', 'README.md', 'src/version.test.ts'];
		const wrong: string[] = [];

		/*
		 * Власні джерела читаються БЕЗ коментарів і без рядків-регулярок.
		 *
		 * Інакше перший же прогін падає на самому собі: щоб пояснити дефект, його
		 * доводиться процитувати, а щоб шукати — записати шаблоном. Коментарі
		 * заміняються пробілами, щоб номери рядків у звіті лишилися правдивими
		 * (FLUID-SIZING-v8 § 9). Той самий прийом — у `css-variables.test.ts`.
		 */
		const readable = (doc: string): string[] => {
			const raw = readFileSync(doc, 'utf8');
			const text = doc.endsWith('.ts')
				? raw
						.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
						.replace(/(^|[^:])\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '))
				: raw;
			// Рядок, що складається з регулярки, — це шаблон пошуку, а не твердження.
			return text.split('\n').map((line) => (/^\s*\/.*\/[a-z]*,?\s*$/.test(line) ? '' : line));
		};

		for (const doc of DOCS) {
			readable(doc).forEach((line, i) => {
				for (const pattern of CONTRADICTIONS) {
					if (pattern.test(line)) wrong.push(`${doc}:${i + 1} — ${line.trim().slice(0, 120)}`);
				}
			});
		}

		expect(
			wrong,
			`${HOOK} жене bump-version перед кожним комітом, а документація каже ` +
				`протилежне. Той, хто їй вірить, бампить удруге й перестрибує версію:\n  ${wrong.join('\n  ')}`
		).toEqual([]);
	});

	it('app-version.json не містить даних моменту (§ 1.4)', () => {
		const raw = JSON.parse(readFileSync('static/app-version.json', 'utf8')) as object;
		expect(
			Object.keys(raw),
			'дані моменту дописуються при збірці, а не комітяться — інакше кожен ' +
				'локальний білд бруднить дерево і ця зміна їде в чужі коміти'
		).toEqual(['version']);
	});
});
