import { readFileSync, readdirSync, statSync } from 'node:fs';
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
 * `npm run bump-version`, а `husky` у проєкті не встановлено — тобто бамп
 * ручний і забути його нічого не заважає.
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

	it('app-version.json не містить даних моменту (§ 1.4)', () => {
		const raw = JSON.parse(readFileSync('static/app-version.json', 'utf8')) as object;
		expect(
			Object.keys(raw),
			'дані моменту дописуються при збірці, а не комітяться — інакше кожен ' +
				'локальний білд бруднить дерево і ця зміна їде в чужі коміти'
		).toEqual(['version']);
	});
});
