// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { PAGES_WITHOUT_ROUTE, SEARCHABLE_PAGES } from './searchablePages';

/**
 * Сторінка, якої немає в переліку пошуку, існує й недосяжна.
 *
 * Це той самий клас, що «існування ≠ досяжність»: файл написаний, сторінка
 * працює, а знайти її неможливо — і дізнатися про це нема як, бо пошук нічого не
 * повідомляє про те, чого не індексує. Тому кожен markdown-файл мусить бути або
 * в переліку, або в переліку винятків із причиною.
 *
 * Перевірка читає теку напряму, а не через `import.meta.glob`: тут потрібен
 * ФАКТ на диску, і саме розбіжність між диском і кодом ми й ловимо.
 */

const PAGES_DIR = 'src/lib/i18n/pages';

const slugsOnDisk = (lang: string) =>
	readdirSync(`${PAGES_DIR}/${lang}`)
		.filter((f) => f.endsWith('.md'))
		.map((f) => f.replace(/\.md$/, ''));

describe('перелік сторінок для пошуку', () => {
	const uk = slugsOnDisk('uk');

	it('файли знайдено — перевірка жива', () => {
		expect(uk.length).toBeGreaterThan(5);
		expect(SEARCHABLE_PAGES.length).toBeGreaterThan(5);
	});

	it('кожна сторінка або шукається, або має записану причину', () => {
		const covered = new Set([...SEARCHABLE_PAGES.map((p) => p.slug), ...Object.keys(PAGES_WITHOUT_ROUTE)]);
		const forgotten = uk.filter((slug) => !covered.has(slug));
		expect(forgotten, `сторінки поза пошуком і без причини: ${forgotten.join(', ')}`).toEqual([]);
	});

	it('у переліку немає слугів, яких не існує на диску', () => {
		const onDisk = new Set(uk);
		const ghosts = SEARCHABLE_PAGES.map((p) => p.slug).filter((slug) => !onDisk.has(slug));
		expect(ghosts, `слуги без файлу: ${ghosts.join(', ')}`).toEqual([]);
	});

	it('причина винятку непорожня', () => {
		for (const [slug, reason] of Object.entries(PAGES_WITHOUT_ROUTE)) {
			expect(reason.trim().length, `${slug}: причина порожня`).toBeGreaterThan(20);
		}
	});

	/**
	 * Пошук працює двома мовами, тож англійська версія мусить існувати для кожної
	 * сторінки — інакше в англійському інтерфейсі частина сайту тихо зникає з
	 * результатів.
	 */
	it('англійські версії існують для всіх слугів', () => {
		const en = new Set(slugsOnDisk('en'));
		const missing = uk.filter((slug) => !en.has(slug));
		expect(missing, `немає англійської версії: ${missing.join(', ')}`).toEqual([]);
	});
});
