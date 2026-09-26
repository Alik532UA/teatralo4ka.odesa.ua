import { describe, expect, it } from 'vitest';
import { ACADEMIC_YEARS, LATEST_ACADEMIC_YEAR_ID } from './academicYears';
import {
	academicYearLabel,
	calendarPageSeo,
	dayLabel,
	rangeText,
	vacationLines,
	yearRangeLabel
} from './calendarText';

describe('підписи плаката', () => {
	it('семестри — словами листа школи', () => {
		const [first, second] = ACADEMIC_YEARS['2024-2025'].semesters;
		expect(rangeText(first, 'uk')).toBe('з 2 вересня по 23 грудня 2024 р.');
		expect(rangeText(second, 'uk')).toBe('з 9 січня по 31 травня 2025 р.');
		expect(rangeText(first, 'en')).toBe('from Sep 2 to Dec 23, 2024');
	});

	it('проміжок через Новий рік називає обидва роки', () => {
		const { winter } = ACADEMIC_YEARS['2026-2027'].vacations;
		expect(rangeText(winter, 'uk')).toBe('з 25 грудня 2026 р. по 10 січня 2027 р.');
		expect(rangeText(winter, 'en')).toBe('from Dec 25, 2026 to Jan 10, 2027');
	});

	it('рядки панелі канікул — без року, як на макеті', () => {
		const { autumn, winter } = ACADEMIC_YEARS['2025-2026'].vacations;
		expect(vacationLines(autumn, 'uk')).toEqual(['з 27 жовтня', 'по 2 листопада']);
		expect(vacationLines(winter, 'uk')).toEqual(['з 27 грудня', 'по 11 січня']);
		expect(vacationLines(winter, 'en')).toEqual(['from Dec 27', 'to Jan 11']);
	});

	it('назва року і день — у правильному відмінку', () => {
		expect(academicYearLabel('2024-2025', 'uk')).toBe('Навчальний рік 2024-2025');
		expect(academicYearLabel('2024-2025', 'en')).toBe('Academic Year 2024–2025');
		expect(dayLabel('2025-09-01', 'uk')).toBe('1 вересня 2025');
		expect(dayLabel('2025-09-01', 'en')).toBe('September 1, 2025');
	});
});

describe('назва й опис сторінки', () => {
	it('мовою адреси й про рік, що відкривається типово', () => {
		const ua = calendarPageSeo('uk');
		const en = calendarPageSeo('en');
		const latest = yearRangeLabel(LATEST_ACADEMIC_YEAR_ID);
		expect(ua.seoTitle).toBe('Навчальний календар');
		expect(en.seoTitle).toBe('Academic Calendar');
		expect(ua.seoDescription).toContain(latest);
		expect(en.seoDescription).toContain(latest);
		expect(en.seoDescription).not.toMatch(/[а-яїієґ]/i);
	});
});
