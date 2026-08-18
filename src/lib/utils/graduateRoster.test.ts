import { describe, expect, it } from 'vitest';
import { layoutRoster, rowSizes, sortRoster } from './graduateRoster';
import type { GraduateIndexEntry } from '$lib/data/graduates';

const person = (
	name: string,
	graduationYear: number | null,
	hasPhoto?: true
): GraduateIndexEntry => ({
	slug: name.toLowerCase().replace(/\s+/g, '-'),
	name,
	graduationYear,
	departments: ['theatre'],
	...(hasPhoto ? { hasPhoto } : {})
});

describe('sortRoster', () => {
	it('роки від новіших', () => {
		const sorted = sortRoster([person('А', 2014), person('Б', 2025), person('В', 1998)]);
		expect(sorted.map((g) => g.graduationYear)).toEqual([2025, 2014, 1998]);
	});

	it('у межах року спершу заповнені анкети, і кожна група за абеткою', () => {
		const sorted = sortRoster([
			person('Яна Без', 2020),
			person('Ада Без', 2020),
			person('Яна Анкета', 2020, true),
			person('Ада Анкета', 2020, true)
		]);
		expect(sorted.map((g) => g.name)).toEqual(['Ада Анкета', 'Яна Анкета', 'Ада Без', 'Яна Без']);
	});

	it('анкета не перестрибує рік', () => {
		// Порядок років старший за порядок анкет: інакше 80 портретів зібралися б
		// на початку переліку й роки перестали б щось означати.
		const sorted = sortRoster([person('Старий', 2000, true), person('Новий', 2024)]);
		expect(sorted.map((g) => g.name)).toEqual(['Новий', 'Старий']);
	});

	it('українська абетка, а не порядок кодів', () => {
		// За кодами «Є» (U+0404) стоїть попереду всіх великих літер, тобто перед «А».
		const sorted = sortRoster([person('Ірина', 2020), person('Єва', 2020), person('Андрій', 2020)]);
		expect(sorted.map((g) => g.name)).toEqual(['Андрій', 'Єва', 'Ірина']);
	});

	it('запис без року йде в кінець, а не на початок', () => {
		const sorted = sortRoster([person('Без', null), person('З роком', 1998)]);
		expect(sorted.map((g) => g.name)).toEqual(['З роком', 'Без']);
	});

	it('вихідний масив не змінюється', () => {
		const list = [person('Б', 2000), person('А', 2020)];
		sortRoster(list);
		expect(list.map((g) => g.name)).toEqual(['Б', 'А']);
	});
});

describe('rowSizes', () => {
	it('порожньо для нуля й від’ємних', () => {
		expect(rowSizes(0, 4)).toEqual([]);
		expect(rowSizes(-5, 4)).toEqual([]);
	});

	it('останній рядок не лишається на одну-дві людини', () => {
		// Саме через це набивання «по повній, доки не скінчаться» й не годиться:
		// 19 при шести в рядку давало 6+6+6+1, а 21 — 6+6+6+3.
		for (const count of [7, 13, 19, 21, 26, 31, 35]) {
			const sizes = rowSizes(count, 6);
			expect(sizes.reduce((a, b) => a + b, 0)).toBe(count);
			expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
		}
	});

	it('рядків рівно стільки, скільки потрібно при цій ширині', () => {
		expect(rowSizes(19, 6)).toHaveLength(4);
		expect(rowSizes(6, 6)).toHaveLength(1);
		expect(rowSizes(7, 6)).toHaveLength(2);
	});

	it('19 при шести — чотири рядки по 4-5, а не 6+6+6+1', () => {
		// Точний порядок тут не перевіряється навмисно: важливо, що самотнього
		// рядка немає, а не в якій саме позиції стоїть коротший.
		const sizes = rowSizes(19, 6);
		expect(sizes).toHaveLength(4);
		expect(sizes.every((size) => size >= 4)).toBe(true);
		expect(sizes).not.toContain(1);
	});

	it('надлишок роздається через рядок — сусідні рядки різні', () => {
		// Різниця в одного й дає шахівницю після центрування.
		expect(rowSizes(14, 4)).toEqual([4, 3, 4, 3]);
		expect(rowSizes(13, 5)).toEqual([5, 4, 4]);
	});

	it('жоден рядок не ширший за дозволене', () => {
		for (const count of [1, 5, 17, 80, 402]) {
			for (const perRow of [1, 2, 3, 5, 8]) {
				expect(Math.max(...rowSizes(count, perRow))).toBeLessThanOrEqual(perRow);
			}
		}
	});

	it('одна людина — один рядок, і це не помилка', () => {
		expect(rowSizes(1, 6)).toEqual([1]);
	});
});

describe('layoutRoster', () => {
	it('порожньо на порожньому переліку', () => {
		expect(layoutRoster([], 4)).toEqual({ cells: [], headingRows: [] });
	});

	it('у кожного року свій заголовок, і перший — не виняток', () => {
		expect(layoutRoster([{ filled: 3, plain: 4 }], 4).headingRows).toEqual([1]);
		// 1 заголовок + 1 рядок анкет + 1 рядок решти, і знову заголовок.
		expect(layoutRoster([{ filled: 3, plain: 4 }, { filled: 0, plain: 2 }], 4).headingRows).toEqual([
			1, 4
		]);
	});

	it('рядок анкет просторіший за рядок решти', () => {
		// Шість у рядку для решти означає п'ять для анкет — картки ширші.
		const layout = layoutRoster([{ filled: 5, plain: 6 }], 6);
		const rows = new Map<number, number>();
		for (const cell of layout.cells) rows.set(cell.row, (rows.get(cell.row) ?? 0) + 1);
		expect([...rows.values()]).toEqual([5, 6]);
	});

	it('кожен рядок центрований: вільне місце однакове з обох боків', () => {
		const perRow = 6;
		const layout = layoutRoster([{ filled: 4, plain: 3 }], perRow);
		const rows = new Map<number, number[]>();
		for (const cell of layout.cells) {
			rows.set(cell.row, [...(rows.get(cell.row) ?? []), cell.column]);
		}
		for (const columns of rows.values()) {
			const left = Math.min(...columns) - 1;
			// Людина займає дві колонки, усього колонок 2·perRow.
			const right = 2 * perRow - (Math.max(...columns) + 1);
			expect(right).toBe(left);
		}
	});

	it('порожня група не отримує заголовка', () => {
		const layout = layoutRoster([{ filled: 2, plain: 0 }, { filled: 0, plain: 0 }], 3);
		expect(layout.headingRows).toHaveLength(1);
		expect(layout.cells).toHaveLength(2);
	});

	it('людей рівно стільки, скільки в групах, і всі в різних клітинках', () => {
		const groups = [
			{ filled: 9, plain: 26 },
			{ filled: 4, plain: 27 },
			{ filled: 1, plain: 29 },
			{ filled: 0, plain: 12 }
		];
		const layout = layoutRoster(groups, 5);
		const total = groups.reduce((sum, g) => sum + g.filled + g.plain, 0);
		expect(layout.cells).toHaveLength(total);
		expect(new Set(layout.cells.map((c) => `${c.row}:${c.column}`)).size).toBe(total);
		// Заголовок не сідає в рядок, у якому вже є люди.
		const busy = new Set(layout.cells.map((c) => c.row));
		expect(layout.headingRows.filter((row) => busy.has(row))).toEqual([]);
	});

	it('анкети йдуть перед рештою свого року — порядок клітинок збігається з переліком', () => {
		const layout = layoutRoster([{ filled: 2, plain: 3 }], 4);
		const rows = layout.cells.map((c) => c.row);
		// Перші дві клітинки — рядок анкет, решта — наступний рядок.
		expect(rows).toEqual([2, 2, 3, 3, 3]);
	});
});
