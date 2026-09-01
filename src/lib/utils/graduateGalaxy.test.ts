import { describe, expect, it } from 'vitest';
import { courseMasterCounts, filterGraduates, makeLanes } from './graduateGalaxy';
import type { GraduateIndexEntry } from '$lib/data/graduates';

/** Передбачуваний «випадок»: значення по колу, щоб перевіряти межі, а не везіння. */
const cyclic = (values: number[]) => {
	let i = 0;
	return () => values[i++ % values.length];
};

const graduate = (name: string, graduationYear: number | null): GraduateIndexEntry => ({
	id: name.toLowerCase().replace(/\s+/g, '-'),
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

describe('makeLanes на повному наборі', () => {
	// 482 — це весь перелік випускників, тобто робочий випадок, а не край.
	it('рівномірний крок сам вкриває всю висоту', () => {
		const tops = makeLanes(482, 26, () => 0).map((l) => l.top);
		expect(Math.min(...tops)).toBeLessThan(1);
		expect(Math.max(...tops)).toBeGreaterThan(99);
	});

	it('не лишає пустих смуг: у кожній двадцятій частині є зірки', () => {
		// Саме це перевіряло, чи потрібен був знятий параметр `spread`.
		const tops = makeLanes(482, 26, () => 0.5).map((l) => l.top);
		const bins = new Array(20).fill(0);
		for (const top of tops) bins[Math.min(19, Math.floor(top / 5))]++;
		expect(bins.filter((count) => count === 0)).toEqual([]);
	});

	it('жодна зірка не виходить за межі 0..100', () => {
		for (const value of [0, 0.5, 1]) {
			for (const lane of makeLanes(482, 26, () => value)) {
				expect(lane.top).toBeGreaterThanOrEqual(0);
				expect(lane.top).toBeLessThanOrEqual(100);
			}
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

	it('фільтр за наявністю анкети/фото', () => {
		const mixed: GraduateIndexEntry[] = [
			{ id: 'a', slug: 'a', name: 'А', graduationYear: 2020, departments: ['theatre'], hasPhoto: true },
			{ id: 'b', slug: 'b', name: 'Б', graduationYear: 2020, departments: ['theatre'] }
		];
		expect(filterGraduates(mixed, { photo: 'with' })).toHaveLength(1);
		expect(filterGraduates(mixed, { photo: 'with' })[0].name).toBe('А');
		expect(filterGraduates(mixed, { photo: 'without' })).toHaveLength(1);
		expect(filterGraduates(mixed, { photo: 'without' })[0].name).toBe('Б');
		expect(filterGraduates(mixed, { photo: 'all' })).toHaveLength(2);
	});

	it('фільтр за кількома відділеннями одночасно', () => {
		const depts: GraduateIndexEntry[] = [
			{ id: 'a', slug: 'a', name: 'А', graduationYear: 2020, departments: ['theatre'] },
			{ id: 'b', slug: 'b', name: 'Б', graduationYear: 2020, departments: ['art'] },
			{ id: 'c', slug: 'c', name: 'В', graduationYear: 2020, departments: ['vocal'] },
			{ id: 'd', slug: 'd', name: 'Г', graduationYear: 2020, departments: ['piano'] }
		];
		expect(filterGraduates(depts, { departments: ['theatre', 'art'] })).toHaveLength(2);
		expect(filterGraduates(depts, { departments: ['vocal'] })).toHaveLength(1);
		expect(filterGraduates(depts, { departments: ['music'] })).toHaveLength(2); // vocal + piano
		expect(filterGraduates(depts, { departments: [] })).toHaveLength(4);
	});
});

/** Той самий випускник, але з майстрами курсу. */
const зМайстрами = (
	name: string,
	graduationYear: number | null,
	masters: string[]
): GraduateIndexEntry => ({
	...graduate(name, graduationYear),
	masters: masters.map((id) => ({ id }))
});

/**
 * Фільтр по майстру курсу й перелік майстрів для нього.
 *
 * ## Що саме стережеться
 *
 * 1. Достатньо ОДНОГО збігу. У частини випускників майстрів курсу декілька — у
 *    Романа Арабаджі четверо, — і людина належить кожному з них однаково. Умова
 *    «усі вибрані майстри мусять бути в людини» дала б порожньо на будь-якому
 *    виборі з двох.
 * 2. Порожній перелік означає «усі», як і в решти фільтрів. Інакше типовий стан
 *    сторінки мусив би перелічувати всіх двадцятьох сімох.
 * 3. Перелік майстрів упорядкований за КІЛЬКІСТЮ, і при однаковій кількості —
 *    за ідентифікатором: без другого правила порядок залежав би від того, у
 *    якому порядку трапилися записи, і дифи стрибали б.
 * 4. Люди без майстра просто не додають нічого до переліку.
 *
 * ## Зворотні експерименти (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * 1. Замінити `some` на `every` у фільтрі — падає «збігу одного досить».
 * 2. Прибрати умову `masters.length > 0` — падає «порожній перелік не фільтрує».
 * 3. Прибрати `|| a.id.localeCompare(b.id)` — падає перевірка однакових
 *    лічильників.
 *
 * Усі три прогнані.
 */
describe('фільтр по майстру курсу', () => {
	const набір = [
		зМайстрами('Одна', 2020, ['ryskina']),
		зМайстрами('Друга', 2021, ['tkach']),
		зМайстрами('Третя', 2022, ['ryskina', 'tkach']),
		graduate('Без майстра', 2023)
	];

	it('збігу ОДНОГО майстра досить', () => {
		const тільки = filterGraduates(набір, { masters: ['ryskina'] });
		expect(тільки.map((g) => g.name)).toEqual(['Одна', 'Третя']);
	});

	it('вибір двох майстрів дає обʼєднання, а не перетин', () => {
		const обидва = filterGraduates(набір, { masters: ['ryskina', 'tkach'] });
		expect(обидва.map((g) => g.name)).toEqual(['Одна', 'Друга', 'Третя']);
	});

	it('порожній перелік не фільтрує нічого', () => {
		expect(filterGraduates(набір, { masters: [] })).toHaveLength(4);
		expect(filterGraduates(набір, {})).toHaveLength(4);
	});

	it('людина без майстра не проходить жодного вибору', () => {
		const усі = filterGraduates(набір, { masters: ['ryskina', 'tkach'] });
		expect(усі.some((g) => g.name === 'Без майстра')).toBe(false);
	});

	it('майстри рахуються й упорядковуються за кількістю', () => {
		expect(courseMasterCounts(набір)).toEqual([
			{ id: 'ryskina', count: 2 },
			{ id: 'tkach', count: 2 }
		]);
	});

	it('при однаковій кількості порядок за ідентифікатором — щоб не стрибав', () => {
		const рівні = [зМайстрами('А', 2020, ['zzz']), зМайстрами('Б', 2021, ['aaa'])];
		expect(courseMasterCounts(рівні).map((m) => m.id)).toEqual(['aaa', 'zzz']);
	});

	it('перелік не містить тих, у кого немає жодного випускника', () => {
		expect(courseMasterCounts([graduate('Сама', 2020)])).toEqual([]);
	});
});
