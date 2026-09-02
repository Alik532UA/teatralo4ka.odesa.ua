import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { getEntityHref, generateTextReport, type StatsData } from './stats';

const statsJsonPath = join(process.cwd(), 'static/galaxy/stats.json');
const STATS: StatsData = JSON.parse(readFileSync(statsJsonPath, 'utf8'));

describe('реєстр статистики наповнення архіву (STATS)', () => {
	it('містить валідну структуру з 5 категоріями', () => {
		expect(STATS).toBeDefined();
		expect(typeof STATS.overallPercent).toBe('number');
		expect(STATS.overallPercent).toBeGreaterThanOrEqual(0);
		expect(STATS.overallPercent).toBeLessThanOrEqual(100);

		const categoryIds = STATS.categories.map((c) => c.id);
		expect(categoryIds).toEqual(['graduates', 'groups', 'plays', 'masters', 'festivals']);
	});

	it('для кожної метрики кількість відсутніх збігається з (total - completed)', () => {
		for (const cat of STATS.categories) {
			expect(cat.metrics.length).toBeGreaterThan(0);
			expect(cat.totalEntities).toBeGreaterThan(0);

			for (const metric of cat.metrics) {
				expect(metric.completed).toBeLessThanOrEqual(metric.total);
				expect(metric.percent).toBeGreaterThanOrEqual(0);
				expect(metric.percent).toBeLessThanOrEqual(100);
				expect(metric.missingItems.length).toBe(metric.total - metric.completed);

				for (const item of metric.missingItems) {
					expect(item.length).toBeGreaterThanOrEqual(2);
					expect(typeof item[0]).toBe('string'); // id / slug
					expect(typeof item[1]).toBe('string'); // title
				}
			}
		}
	});

	it('getEntityHref формує правильні шляхи для всіх сутностей', () => {
		expect(getEntityHref('graduates', 'test-grad')).toBe('/projects/galaxy-graduates/test-grad/');
		expect(getEntityHref('groups', 'test-group')).toBe('/projects/galaxy-graduates/groups/test-group/');
		expect(getEntityHref('plays', 'test-play')).toBe('/projects/galaxy-graduates/plays/test-play/');
		expect(getEntityHref('masters', 'test-master')).toBe('/residents/adults/test-master/');
		expect(getEntityHref('festivals', 'test-fest')).toBe('/projects/galaxy-graduates/festivals/test-fest/');
	});

	it('generateTextReport формує структурований текстовий звіт для поширення', () => {
		const report = generateTextReport(STATS);
		expect(report).toContain('ЗВІТ НАПОВНЕННЯ АРХІВУ');
		expect(report).toContain('ВИПУСКНИКИ');
		expect(report).toContain('ГРУПИ');
		expect(report).toContain('ВИСТАВИ');
		expect(report).toContain('ВИКЛАДАЧІ');
		expect(report).toContain('ФЕСТИВАЛІ');
		expect(report).toContain('https://teatralo4ka.odesa.ua/projects/galaxy-graduates/stats');
	});
});
