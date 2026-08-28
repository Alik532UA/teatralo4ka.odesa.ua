import { describe, it, expect } from 'vitest';
import {
	GROUPS,
	getGroupBySlug,
	getGroupByTitleOrAbbr,
	getGroupByMember,
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

	it('кожен memberSlug у групі існує в graduates.index.json', () => {
		const allSlugs = new Set((graduatesIndex as GraduateIndexEntry[]).map((g) => g.slug));
		for (const group of GROUPS) {
			for (const memberSlug of group.memberSlugs) {
				expect(allSlugs.has(memberSlug), `Випускник ${memberSlug} має бути в graduates.index.json`).toBe(true);
			}
		}
	});

	it('кожен master.id у групі існує в masters.index.json', () => {
		const allMasterIds = new Set((mastersIndex as MasterIndexEntry[]).map((m) => m.id));
		for (const group of GROUPS) {
			for (const master of group.masters) {
				expect(allMasterIds.has(master.id), `Майстер ${master.id} має бути в masters.index.json`).toBe(true);
			}
		}
	});

	it('усі вистави в групі мають валідні роки та назви', () => {
		for (const group of GROUPS) {
			expect(group.plays.length).toBeGreaterThan(0);
			for (const play of group.plays) {
				expect(play.year).toBeGreaterThanOrEqual(1990);
				expect(play.text.trim().length).toBeGreaterThan(0);
			}
		}
	});

	it('хелпери getGroupBySlug, getGroupByTitleOrAbbr, getGroupByMember повертають правильні групи', () => {
		const group = getGroupBySlug('zakhysnyky-teatralnykh-kulis');
		expect(group).toBeDefined();
		expect(group?.name).toBe('Захисники театральних куліс');

		expect(getGroupByTitleOrAbbr('ЗТК')?.slug).toBe('zakhysnyky-teatralnykh-kulis');
		expect(getGroupByTitleOrAbbr('Захисники театральних куліс')?.slug).toBe('zakhysnyky-teatralnykh-kulis');
		expect(getGroupByMember('alik-zapolnov')?.slug).toBe('zakhysnyky-teatralnykh-kulis');

		expect(groupProfilePath('zakhysnyky-teatralnykh-kulis')).toBe(
			'/projects/galaxy-graduates/groups/zakhysnyky-teatralnykh-kulis'
		);
	});
});
