import { describe, expect, it } from 'vitest';
import { monthGridStep } from './monthGridStep';

/*
 * Жовтень 2026: 31 день, 1-ше — четвер, тобто перед ним три клітинки вересня
 * (`leading` = 3). Індекс — день мінус один.
 */
const step = (day: number, key: string) => {
	const next = monthGridStep(day - 1, key, 3, 31);
	return next === null ? null : next + 1;
};

describe('клавіатура в сітці місяця', () => {
	it('стрілки — на день і на тиждень', () => {
		expect(step(10, 'ArrowRight')).toBe(11);
		expect(step(10, 'ArrowLeft')).toBe(9);
		expect(step(10, 'ArrowDown')).toBe(17);
		expect(step(10, 'ArrowUp')).toBe(3);
	});

	it('межу місяця не перетинає', () => {
		expect(step(1, 'ArrowLeft')).toBe(1);
		expect(step(31, 'ArrowRight')).toBe(31);
		expect(step(3, 'ArrowUp')).toBe(3);
		expect(step(28, 'ArrowDown')).toBe(28);
	});

	it('Home і End — до краю тижня, а не місяця', () => {
		// 8 жовтня — четвер; його тиждень у жовтні: 5 (пн) — 11 (нд).
		expect(step(8, 'Home')).toBe(5);
		expect(step(8, 'End')).toBe(11);
		// Перший тиждень починається у вересні — Home зупиняється на 1-му.
		expect(step(2, 'Home')).toBe(1);
		// Останній тиждень: 26 (пн) — 31 (сб), неділі в жовтні вже немає.
		expect(step(27, 'End')).toBe(31);
	});

	it('чужі клавіші пропускаються далі', () => {
		expect(step(10, 'Enter')).toBeNull();
		expect(step(10, 'Tab')).toBeNull();
		expect(step(10, 'a')).toBeNull();
	});
});
