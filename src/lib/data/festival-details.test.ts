// @vitest-environment node
// Перевірка читає два файли з диска — браузер і DOM їй не потрібні.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { FESTIVALS } from './festivals';
import { parseVideoUrl } from '../utils/videoEmbed';

/**
 * Зріз подробиць не розійшовся з реєстром фестивалів.
 *
 * ## Навіщо
 *
 * `bio`, `outsideMembers`, `photos`, `diplomas` і `booklets` переїхали з
 * `festivals.data.json` у `static/galaxy/festival-details.json` 16 вересня
 * 2026: вони важили 5.3 КБ із 10 і їхали в клієнтський бандл до кожного
 * відвідувача, хоч читає їх лише сторінка самого фестивалю (докблок
 * `festivalDetails.ts`).
 *
 * На відміну від `play-cast.json`, який РАХУЄТЬСЯ з анкет і тому звіряється
 * перерахунком, тут дані авторські й нізвідки не виводяться. Отже єдине, що їх
 * тримає разом, — ключ `slug`, і розходження за ним ТИХЕ з обох боків:
 *
 *   подробиці без фестивалю .... сирота: адресу перейменували, опис лишився на
 *                                старому ключі й не показується ніде
 *   фестиваль без подробиць .... законно (їх може ще не бути), тому не помилка
 *
 * Перший випадок і ловить ця перевірка. Другий свідомо пропущено: 4 з 34
 * фестивалів подробиць не мають, і це нормальний стан даних.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v9 § 1.1)
 *
 * Перейменувати ключ у `festival-details.json` — перевірка називає саме його.
 */

const DETAILS_PATH = join('static', 'galaxy', 'festival-details.json');
const details = JSON.parse(readFileSync(DETAILS_PATH, 'utf8')) as Record<
	string,
	Record<string, unknown>
>;

/** Поля, які саме й винесені. Реєстр не має права їх повернути непомітно. */
const MOVED = ['bio', 'outsideMembers', 'photos', 'diplomas', 'booklets'] as const;

describe('подробиці фестивалів (винос у static)', () => {
	it('перевірка жива: обидва файли прочитано й у них є що звіряти', () => {
		expect(FESTIVALS.length, 'реєстр фестивалів порожній').toBeGreaterThan(10);
		expect(Object.keys(details).length, 'зріз подробиць порожній').toBeGreaterThan(10);
	});

	it('кожен ключ подробиць має фестиваль у реєстрі', () => {
		const slugs = new Set(FESTIVALS.map((f) => f.slug));
		const orphans = Object.keys(details).filter((slug) => !slugs.has(slug));
		expect(
			orphans,
			`подробиці без фестивалю — опис лежить на ключі, якого немає:\n${orphans.join('\n')}`
		).toEqual([]);
	});

	it('винесені поля не повернулися в реєстр', () => {
		// Повернення одного поля коштує тихо: бандл росте, а гейт бюджету
		// червоніє вже на наступному поповненні даних і показує на інше місце.
		const registry = JSON.parse(readFileSync(join('src', 'lib', 'data', 'festivals.data.json'), 'utf8')) as Record<
			string,
			unknown
		>[];
		const back: string[] = [];
		for (const festival of registry)
			for (const field of MOVED)
				if (field in festival) back.push(`${festival.slug}: ${field}`);
		expect(back, `поле повернулося в реєстр замість static/:\n${back.join('\n')}`).toEqual([]);
	});

	it('реєстр лишається під тим розміром, заради якого його різали', () => {
		/*
		 * Окреме число саме тут, а не лише в `check-bundle-budget`: той міряє суму
		 * всіх сімох реєстрів і почервоніє, коли виросте будь-який. Розібратися,
		 * що саме виросло, доводиться вручну — а цей рядок називає винуватця
		 * одразу. Заміряно після виносу: 4.70 КБ brotli-11.
		 */
		const kb =
			zlib.brotliCompressSync(readFileSync(join('src', 'lib', 'data', 'festivals.data.json')), {
				params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
			}).length / 1024;
		expect(kb, `реєстр фестивалів ${kb.toFixed(2)} КБ — більше за стелю 6`).toBeLessThan(6);
	});

	it('кожен запис у подробицях розпізнається як відео', () => {
		const bad: string[] = [];
		for (const [slug, item] of Object.entries(details)) {
			const videos = (item.videos as (string | { url: string; title?: string })[] | undefined) ?? [];
			for (const v of videos) {
				const url = typeof v === 'string' ? v : v?.url;
				if (!url || !parseVideoUrl(url)) {
					bad.push(`${slug}: ${JSON.stringify(v)}`);
				}
			}
		}
		expect(bad, `посилання не розпізналося:\n  ${bad.join('\n  ')}`).toEqual([]);
	});
});
