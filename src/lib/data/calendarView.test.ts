import { describe, expect, it } from 'vitest';
import { CALENDAR_THEMES } from '$lib/config/calendarThemes';
import { ACADEMIC_YEAR_IDS, LATEST_ACADEMIC_YEAR_ID } from './academicYears';
import {
	BLUR_PX,
	DEFAULT_VIEW,
	FILTER_DENSITY,
	calendarHref,
	calendarViewParams,
	parseCalendarView,
	type CalendarView
} from './calendarView';

const parse = (query: string) => parseCalendarView(new URLSearchParams(query));

describe('вигляд календаря з адреси', () => {
	it('без параметрів — останній рік на типовому фоні', () => {
		expect(parse('')).toEqual(DEFAULT_VIEW);
		expect(DEFAULT_VIEW.year).toBe(LATEST_ACADEMIC_YEAR_ID);
	});

	it('кожен параметр читається', () => {
		const other = CALENDAR_THEMES.find((t) => t.id !== DEFAULT_VIEW.bg)!.id;
		expect(parse(`year=${ACADEMIC_YEAR_IDS[0]}&bg=${other}&blur=9&filter=dark&density=40`)).toEqual({
			year: ACADEMIC_YEAR_IDS[0],
			bg: other,
			blur: 9,
			filter: 'dark',
			density: 40
		});
	});

	it('описка чи рік, якого ще немає, — типове значення, а не зламана сторінка', () => {
		expect(parse('year=1999-2000&bg=nope&filter=sepia')).toEqual(DEFAULT_VIEW);
		expect(parse('year=toString').year).toBe(DEFAULT_VIEW.year);
	});

	it('числа затискаються в межі повзунків', () => {
		expect(parse('blur=999').blur).toBe(BLUR_PX.max);
		expect(parse('blur=-5').blur).toBe(BLUR_PX.min);
		expect(parse('density=1').density).toBe(FILTER_DENSITY.min);
		expect(parse('blur=abc').blur).toBe(BLUR_PX.default);
		// `Number('')` — нуль, а не «немає»: порожній параметр мусить дати типове.
		expect(parse('blur=').blur).toBe(BLUR_PX.default);
	});
});

describe('вигляд календаря в адресу', () => {
	it('типове значення в адресу не пишеться', () => {
		expect(calendarViewParams(DEFAULT_VIEW).toString()).toBe('');
		expect(calendarHref(DEFAULT_VIEW, 'uk')).toBe('/calendar/');
		expect(calendarHref(DEFAULT_VIEW, 'en')).toBe('/en/calendar/');
	});

	it('туди й назад — той самий вигляд', () => {
		const view: CalendarView = {
			year: ACADEMIC_YEAR_IDS[0],
			bg: CALENDAR_THEMES.at(-1)!.id,
			blur: 12,
			filter: 'light',
			density: 55
		};
		const href = calendarHref(view, 'uk');
		expect(href.startsWith('/calendar/?')).toBe(true);
		expect(parseCalendarView(new URL(href, 'https://example.org').searchParams)).toEqual(view);
	});

	it('густина без фільтра в адресу не йде — вона нічого не міняє', () => {
		const params = calendarViewParams({ ...DEFAULT_VIEW, density: 60 });
		expect(params.has('density')).toBe(false);
	});

	it('чужі параметри лишаються, свої перезаписуються', () => {
		const keep = new URLSearchParams('debug=1&year=1999-2000&blur=3');
		const params = calendarViewParams({ ...DEFAULT_VIEW, blur: 8 }, keep);
		expect(params.get('debug')).toBe('1');
		expect(params.get('year')).toBeNull();
		expect(params.get('blur')).toBe('8');
	});
});
