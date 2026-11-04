// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SITE_MAP_COLUMNS } from './siteMapStructure';

describe('siteMapStructure (Карта сайту)', () => {
	it('має рівно 4 колонки зі змістовними назвами двома мовами', () => {
		expect(SITE_MAP_COLUMNS).toHaveLength(4);
		for (const col of SITE_MAP_COLUMNS) {
			expect(col.id).toBeTruthy();
			expect(col.titleUk.trim().length).toBeGreaterThan(0);
			expect(col.titleEn.trim().length).toBeGreaterThan(0);
			expect(col.groups.length).toBeGreaterThan(0);
		}
	});

	it('усі пункти мають унікальні ідентифікатори', () => {
		const allIds = new Set<string>();
		for (const col of SITE_MAP_COLUMNS) {
			for (const group of col.groups) {
				for (const item of group.items) {
					expect(allIds.has(item.id), `Дубльований id пункту: ${item.id}`).toBe(false);
					allIds.add(item.id);
				}
			}
		}
		expect(allIds.size).toBeGreaterThanOrEqual(25);
	});

	it('кожен пункт має дійсний маршрут (href починається з /) та локалізовані підписи', () => {
		for (const col of SITE_MAP_COLUMNS) {
			for (const group of col.groups) {
				for (const item of group.items) {
					expect(item.labelUk.trim().length).toBeGreaterThan(0);
					expect(item.labelEn.trim().length).toBeGreaterThan(0);
					const href = item.href();
					expect(typeof href).toBe('string');
					expect(href.startsWith('/')).toBe(true);
					expect(href).not.toContain('//');
				}
			}
		}
	});

	it('не містить постерів (/posters) та індивідуальних динамічних сторінок випускників/театрів', () => {
		for (const col of SITE_MAP_COLUMNS) {
			for (const group of col.groups) {
				for (const item of group.items) {
					const href = item.href();
					expect(href.startsWith('/posters')).toBe(false);
					// Не містить квадратних дужок параметрів маршруту
					expect(href).not.toContain('[');
					expect(href).not.toContain(']');
				}
			}
		}
	});

	it('не називає заклад «студією» (офіційно — Одеська театральна школа)', () => {
		for (const col of SITE_MAP_COLUMNS) {
			expect(col.titleUk.toLowerCase()).not.toContain('студії');
			expect(col.titleUk.toLowerCase()).not.toContain('студія');
			for (const group of col.groups) {
				expect(group.titleUk.toLowerCase()).not.toContain('про студію');
				expect(group.titleUk.toLowerCase()).not.toContain('проєкти студії');
			}
		}
	});
});

