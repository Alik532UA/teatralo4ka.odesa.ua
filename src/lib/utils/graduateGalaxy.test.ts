import { describe, expect, it } from 'vitest';
import { filterGraduates, makeLanes, pickFree } from './graduateGalaxy';
import type { GraduateIndexEntry } from '$lib/data/graduates';

/** Передбачуваний «випадок»: значення по колу, щоб перевіряти межі, а не везіння. */
const cyclic = (values: number[]) => {
	let i = 0;
	return () => values[i++ % values.length];
};

const graduate = (name: string, graduationYear: number | null): GraduateIndexEntry => ({
	slug: name.toLowerCase().replace(/\s+/g, '-'),
	name,
	graduationYear,
	departments: ['theatre']
});

describe('makeLanes', () => {
	it('порожній набір для нуля й від’ємних', () => {
		expect(makeLanes(0, 30, () => 0.5)).toEqual([]);
		expect(makeLanes(-3, 30, () => 0.5)).toEqual([]);
	});

	it('висота роздається рівномірно й не виходить за 100%', () => {
		// `random = 1` — найгірший випадок: максимальний зсув у межах кроку.
		const lanes = makeLanes(10, 30, () => 1);
		expect(lanes).toHaveLength(10);
		for (const lane of lanes) {
			expect(lane.top).toBeGreaterThanOrEqual(0);
			expect(lane.top).toBeLessThan(100);
		}
		// Порядок зростає: доріжки не змішуються, змішуються лише зірки в них.
		const tops = lanes.map((l) => l.top);
		expect([...tops].sort((a, b) => a - b)).toEqual(tops);
	});

	it('затримка від’ємна — зірки розкидані вже на першому кадрі', () => {
		// Це не косметика: з нульовою затримкою всі зірки вилітають з лівого краю
		// одночасно, і замість галактики видно щільну хвилю.
		const lanes = makeLanes(5, 30, cyclic([0.1, 0.9, 0.5]));
		for (const lane of lanes) expect(lane.delay).toBeLessThanOrEqual(0);
	});

	it('тривалість у межах [min, 2×min]', () => {
		for (const value of [0, 0.5, 1]) {
			const [lane] = makeLanes(1, 30, () => value);
			expect(lane.duration).toBeGreaterThanOrEqual(30);
			expect(lane.duration).toBeLessThanOrEqual(60);
		}
	});
});

describe('pickFree', () => {
	it('віддає індекс, якого немає на екрані', () => {
		expect(pickFree(4, [0, 1, 2], () => 0)).toBe(3);
	});

	it('null, коли пул вичерпано — інакше зірка задублювалася б', () => {
		expect(pickFree(3, [0, 1, 2], () => 0)).toBeNull();
		expect(pickFree(0, [], () => 0)).toBeNull();
	});

	it('ніколи не повертає вже показаний індекс', () => {
		const assigned = [1, 3];
		for (const value of [0, 0.34, 0.67, 0.99]) {
			expect(assigned).not.toContain(pickFree(5, assigned, () => value));
		}
	});
});

describe('filterGraduates', () => {
	const list = [
		graduate('Ольга Полякова', 2003),
		graduate('Марія Полякова', 2011),
		graduate('Алік Запольнов', 2012),
		graduate('Без Року', null)
	];

	it('без фільтрів віддає всіх', () => {
		expect(filterGraduates(list, { year: 'all', query: '' })).toHaveLength(4);
	});

	it('фільтр за роком', () => {
		expect(filterGraduates(list, { year: 2012, query: '' }).map((g) => g.name)).toEqual([
			'Алік Запольнов'
		]);
	});

	it('пошук за підрядком і без огляду на регістр', () => {
		// Людина шукає «поляк», а не точне «Ольга Полякова».
		expect(filterGraduates(list, { year: 'all', query: 'поляк' })).toHaveLength(2);
		expect(filterGraduates(list, { year: 'all', query: 'ПОЛЯК' })).toHaveLength(2);
	});

	it('пробіли навколо запиту не звужують результат', () => {
		expect(filterGraduates(list, { year: 'all', query: '  ' })).toHaveLength(4);
		expect(filterGraduates(list, { year: 'all', query: '  Алік ' })).toHaveLength(1);
	});

	it('рік і пошук діють разом', () => {
		expect(filterGraduates(list, { year: 2011, query: 'поляк' }).map((g) => g.name)).toEqual([
			'Марія Полякова'
		]);
	});

	it('запис без року не потрапляє під фільтр року', () => {
		expect(filterGraduates(list, { year: 2003, query: '' }).map((g) => g.name)).toEqual([
			'Ольга Полякова'
		]);
	});
});
