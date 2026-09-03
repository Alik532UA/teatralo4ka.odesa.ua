import { describe, expect, it } from 'vitest';
import { balancedRows } from './balancedRows';

/** Розміри рядків — те, про що правило й говорить. */
const sizes = <T>(rows: T[][]) => rows.map((r) => r.length);

describe('рядки, де наступний не коротший за попередній', () => {
	const five = ['а', 'б', 'в', 'г', 'д'];

	it('усе вміщається — один рядок', () => {
		expect(sizes(balancedRows(five.slice(0, 2), 2))).toEqual([2]);
		expect(sizes(balancedRows(five, 5))).toEqual([5]);
		expect(sizes(balancedRows(five, 9))).toEqual([5]);
	});

	it('приклади автора при двох позиціях у рядку', () => {
		// 3 → 1 і 2; 4 → 2 і 2; 5 → 1, 2 і 2 (двома рядками по 2 п'ять не вмістити).
		expect(sizes(balancedRows(five.slice(0, 3), 2))).toEqual([1, 2]);
		expect(sizes(balancedRows(five.slice(0, 4), 2))).toEqual([2, 2]);
		expect(sizes(balancedRows(five, 2))).toEqual([1, 2, 2]);
	});

	it('п’ять по три — саме 2 і 3, як просив автор', () => {
		expect(sizes(balancedRows(five, 3))).toEqual([2, 3]);
	});

	it('жоден рядок не коротший за попередній — на всіх розмірах до двадцяти', () => {
		for (let n = 1; n <= 20; n++) {
			const items = Array.from({ length: n }, (_, i) => i);
			for (let perRow = 1; perRow <= 6; perRow++) {
				const rows = sizes(balancedRows(items, perRow));
				for (let i = 1; i < rows.length; i++) {
					expect(
						rows[i],
						`${n} позицій по ${perRow}: рядок ${i + 1} коротший за попередній (${rows.join('+')})`
					).toBeGreaterThanOrEqual(rows[i - 1]);
				}
				// Жоден рядок не переповнений, і нічого не загубилося.
				expect(Math.max(...rows)).toBeLessThanOrEqual(Math.max(perRow, 1));
				expect(rows.reduce((a, b) => a + b, 0)).toBe(n);
			}
		}
	});

	it('порядок позицій зберігається', () => {
		expect(balancedRows(five, 2)).toEqual([['а'], ['б', 'в'], ['г', 'д']]);
	});

	it('порожній перелік і безглузда ширина не валять розкладку', () => {
		expect(balancedRows([], 3)).toEqual([]);
		expect(sizes(balancedRows(five, 0))).toEqual([1, 1, 1, 1, 1]);
		expect(sizes(balancedRows(five, -2))).toEqual([1, 1, 1, 1, 1]);
	});
});
