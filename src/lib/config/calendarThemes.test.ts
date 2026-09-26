import { describe, expect, it } from 'vitest';
import { CALENDAR_THEMES, DEFAULT_CALENDAR_THEME_ID, getCalendarThemeById } from './calendarThemes';
import { LOCAL_IMAGE_SIZES } from './localImages';

/** Відносна яскравість sRGB за WCAG 2.2. */
function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

describe('фони плаката календаря', () => {
	it('перевірка жива: фонів кілька, id унікальні, типовий існує', () => {
		expect(CALENDAR_THEMES.length).toBeGreaterThanOrEqual(4);
		const ids = CALENDAR_THEMES.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).toContain(DEFAULT_CALENDAR_THEME_ID);
	});

	it('кожен фон — у мапі розмірів, тобто його файл звірено з диском', () => {
		// Тип `LocalImage` цього не дає в рантаймі: мапа могла б розійтися з типом
		// лише через `as`, а так видно й це.
		for (const theme of CALENDAR_THEMES) {
			expect(LOCAL_IMAGE_SIZES, theme.id).toHaveProperty([theme.bgUrl]);
		}
	});

	it('назви двома мовами, id придатний для адреси', () => {
		for (const theme of CALENDAR_THEMES) {
			expect(theme.id, theme.id).toMatch(/^[a-z0-9-]+$/);
			expect(theme.nameUk.trim().length, theme.id).toBeGreaterThan(0);
			expect(theme.nameEn.trim().length, theme.id).toBeGreaterThan(0);
		}
	});

	/*
	 * Текст днів тижня лежить на смузі `weekdayBg` — суцільний колір, тож його
	 * контраст рахується точно. Поріг 4.5 : 1 — звичайний текст за WCAG 2.2.
	 */
	it('текст днів тижня читається на своїй смузі', () => {
		const bad = CALENDAR_THEMES.filter((t) => contrast(t.weekdayText, t.weekdayBg) < 4.5).map(
			(t) => `${t.id}: ${contrast(t.weekdayText, t.weekdayBg).toFixed(2)}`
		);
		expect(bad).toEqual([]);
	});

	it('невідомий id — типовий фон', () => {
		expect(getCalendarThemeById('orange-hall').id).toBe('orange-hall');
		expect(getCalendarThemeById('такого-немає').id).toBe(DEFAULT_CALENDAR_THEME_ID);
	});
});
