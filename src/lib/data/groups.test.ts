import { describe, it, expect } from 'vitest';
import {
	GROUPS,
	getGroupBySlug,
	getGroupByTitleOrAbbr,
	getGroupsByMember,
	groupProfilePath
} from './groups';
import graduatesIndex from '$lib/data/graduates.index.json';
import mastersIndex from '$lib/data/masters.index.json';
import type { GraduateIndexEntry } from '$lib/data/graduates';
import type { MasterIndexEntry } from '$lib/data/masters';

describe('GROUPS data integrity', () => {
	it('усі групи мають коректний slug, назву та роки випуску', () => {
		expect(GROUPS.length).toBeGreaterThan(0);
		for (const group of GROUPS) {
			expect(group.slug).toMatch(/^[a-z0-9-]+$/);
			expect(group.name.trim().length).toBeGreaterThan(0);
			expect(group.graduationYears.length).toBeGreaterThan(0);
			for (const yr of group.graduationYears) {
				expect(yr).toBeGreaterThanOrEqual(1990);
				expect(yr).toBeLessThanOrEqual(2035);
			}
		}
	});

	/*
	 * Звіряється саме з `id`, а не зі `slug`: адресу законно виправляють, ключ —
	 * ні. Якби перевірка й далі дивилася на адресу, вона червоніла б від кожного
	 * виправлення імені й не бачила б справжнього розриву зв'язку.
	 */
	it('кожен memberId у групі існує в реєстрі випускників', () => {
		const known = new Set((graduatesIndex as GraduateIndexEntry[]).map((g) => g.id));
		const bad: string[] = [];
		for (const group of GROUPS)
			for (const memberId of group.memberIds)
				if (!known.has(memberId)) bad.push(`${group.slug} → ${memberId}`);
		expect(bad, `склад посилається в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен master.id у групі існує в masters.index.json', () => {
		const allMasterIds = new Set((mastersIndex as MasterIndexEntry[]).map((m) => m.id));
		for (const group of GROUPS) {
			for (const master of group.masters) {
				expect(allMasterIds.has(master.id), `Майстер ${master.id} має бути в masters.index.json`).toBe(true);
			}
		}
	});

	/*
	 * Репертуар тепер — ключі, а не копії назв, тож валідність самих вистав
	 * перевіряє `plays.test.ts`. Тут лишається те, що стосується групи: сторінка
	 * без жодної вистави була б порожньою.
	 */
	it('у кожної групи є щонайменше одна вистава', () => {
		const bad = GROUPS.filter((g) => g.playIds.length === 0).map((g) => g.slug);
		expect(bad, `група без репертуару:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('хелпери getGroupBySlug, getGroupByTitleOrAbbr, getGroupsByMember повертають правильні групи', () => {
		const group = getGroupBySlug('zakhysnyky-teatralnykh-kulis');
		expect(group).toBeDefined();
		expect(group?.name).toBe('Захисники театральних куліс');

		expect(getGroupByTitleOrAbbr('ЗТК')?.slug).toBe('zakhysnyky-teatralnykh-kulis');
		expect(getGroupByTitleOrAbbr('Захисники театральних куліс')?.slug).toBe('zakhysnyky-teatralnykh-kulis');
		expect(getGroupsByMember('alik-zapolnov').map((g) => g.slug)).toEqual([
			'zakhysnyky-teatralnykh-kulis'
		]);

		expect(groupProfilePath('zakhysnyky-teatralnykh-kulis')).toBe(
			'/projects/galaxy-graduates/groups/zakhysnyky-teatralnykh-kulis'
		);
	});
});
