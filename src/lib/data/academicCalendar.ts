/**
 * Академічний календар Одеської театральної школи на 2025–2026 навчальний рік.
 * Джерело структури: макет Figma (.temp/calendar).
 */

export type Season = 'autumn' | 'winter' | 'spring' | 'summer';

export interface CalendarDay {
	date: string;
	day: number;
	month: number;
	year: number;
	isCurrentMonth: boolean;
	isWeekend: boolean;
	isUaHoliday?: boolean;
	vacation?: {
		id: 'autumn' | 'winter' | 'spring';
		nameUk: string;
		nameEn: string;
		season: Season;
	};
	specialEvent?: {
		titleUk: string;
		titleEn: string;
		isHoliday?: boolean;
		isSemesterBoundary?: boolean;
	};
}

export interface CalendarMonth {
	year: number;
	month: number;
	nameUk: string;
	nameEn: string;
	season: Season;
	isNextYearPreview?: boolean;
	days: CalendarDay[];
}

export interface VacationPeriod {
	id: 'autumn' | 'winter' | 'spring';
	season: Season;
	titleUk: string;
	titleEn: string;
	datesUk: string;
	datesEn: string;
	startDate: string;
	endDate: string;
}

export interface SemesterPeriod {
	id: 1 | 2;
	titleUk: string;
	titleEn: string;
	datesUk: string;
	datesEn: string;
	startDate: string;
	endDate: string;
}

export const ACADEMIC_YEAR_LABEL = '2025–2026';

export const SEMESTERS: readonly SemesterPeriod[] = [
	{
		id: 1,
		titleUk: '1-й семестр',
		titleEn: '1st Semester',
		datesUk: 'з 1 вересня по 26 грудня 2025 р.',
		datesEn: 'September 1 to December 26, 2025',
		startDate: '2025-09-01',
		endDate: '2025-12-26'
	},
	{
		id: 2,
		titleUk: '2-й семестр',
		titleEn: '2nd Semester',
		datesUk: 'з 12 січня по 31 травня 2026 р.',
		datesEn: 'January 12 to May 31, 2026',
		startDate: '2026-01-12',
		endDate: '2026-05-31'
	}
] as const;

export const VACATIONS: readonly VacationPeriod[] = [
	{
		id: 'autumn',
		season: 'autumn',
		titleUk: 'Осінні канікули',
		titleEn: 'Autumn Break',
		datesUk: 'з 27 жовтня по 2 листопада 2025 р.',
		datesEn: 'October 27 to November 2, 2025',
		startDate: '2025-10-27',
		endDate: '2025-11-02'
	},
	{
		id: 'winter',
		season: 'winter',
		titleUk: 'Зимові канікули',
		titleEn: 'Winter Break',
		datesUk: 'з 27 грудня 2025 р. по 11 січня 2026 р.',
		datesEn: 'December 27, 2025 to January 11, 2026',
		startDate: '2025-12-27',
		endDate: '2026-01-11'
	},
	{
		id: 'spring',
		season: 'spring',
		titleUk: 'Весняні канікули',
		titleEn: 'Spring Break',
		datesUk: 'з 23 березня по 29 березня 2026 р.',
		datesEn: 'March 23 to March 29, 2026',
		startDate: '2026-03-23',
		endDate: '2026-03-29'
	}
] as const;

export const UA_FLAG_DATES = new Set(['2025-10-01', '2026-06-28', '2026-07-15', '2026-08-24']);

export const SPECIAL_EVENTS: Record<string, { titleUk: string; titleEn: string; isHoliday?: boolean; isSemesterBoundary?: boolean }> = {
	'2025-09-01': { titleUk: 'День знань / Початок 1 семестру', titleEn: 'Knowledge Day / Start of Sem 1', isSemesterBoundary: true },
	'2025-10-01': { titleUk: 'День захисників і захисниць України', titleEn: 'Day of the Defenders of Ukraine', isHoliday: true },
	'2025-10-27': { titleUk: 'День української писемності та мови / Початок осінніх канікул', titleEn: 'Language Day / Autumn Break starts' },
	'2025-11-21': { titleUk: 'День Гідності та Свободи', titleEn: 'Day of Dignity and Freedom', isHoliday: true },
	'2025-12-06': { titleUk: 'День Збройних Сил України', titleEn: 'Day of the Armed Forces of Ukraine', isHoliday: true },
	'2025-12-25': { titleUk: 'Різдво Христове', titleEn: 'Christmas', isHoliday: true },
	'2025-12-26': { titleUk: 'Завершення 1 семестру', titleEn: 'End of 1st Semester', isSemesterBoundary: true },
	'2025-12-27': { titleUk: 'Початок зимових канікул', titleEn: 'Winter Break starts' },
	'2026-01-01': { titleUk: 'Новий рік', titleEn: "New Year's Day", isHoliday: true },
	'2026-01-12': { titleUk: 'Початок 2 семестру', titleEn: 'Start of 2nd Semester', isSemesterBoundary: true },
	'2026-01-22': { titleUk: 'День Соборності України', titleEn: 'Unity Day of Ukraine', isHoliday: true },
	'2026-02-19': { titleUk: 'День Державного Герба України', titleEn: 'Day of the State Coat of Arms', isHoliday: true },
	'2026-02-20': { titleUk: 'День Героїв Небесної Сотні', titleEn: 'Heroes of Heavenly Hundred Day', isHoliday: true },
	'2026-03-23': { titleUk: 'Початок весняних канікул', titleEn: 'Spring Break starts' },
	'2026-03-27': { titleUk: 'Всесвітній день театру 🎭', titleEn: 'World Theatre Day 🎭', isHoliday: true },
	'2026-04-12': { titleUk: 'Великдень', titleEn: 'Easter', isHoliday: true },
	'2026-05-31': { titleUk: 'Завершення 2 семестру', titleEn: 'End of 2nd Semester', isSemesterBoundary: true },
	'2026-06-01': { titleUk: 'Початок літнього відпочинку', titleEn: 'Summer break starts' },
	'2026-06-28': { titleUk: 'День Конституції України', titleEn: 'Constitution Day of Ukraine', isHoliday: true },
	'2026-07-15': { titleUk: 'День Української Державності', titleEn: 'Day of Ukrainian Statehood', isHoliday: true },
	'2026-08-23': { titleUk: 'День Державного Прапора України', titleEn: 'National Flag Day', isHoliday: true },
	'2026-08-24': { titleUk: 'День Незалежності України', titleEn: 'Independence Day of Ukraine', isHoliday: true }
};

const MONTH_NAMES: Record<number, { uk: string; en: string; season: Season }> = {
	1: { uk: 'Січень', en: 'January', season: 'winter' },
	2: { uk: 'Лютий', en: 'February', season: 'winter' },
	3: { uk: 'Березень', en: 'March', season: 'spring' },
	4: { uk: 'Квітень', en: 'April', season: 'spring' },
	5: { uk: 'Травень', en: 'May', season: 'spring' },
	6: { uk: 'Червень', en: 'June', season: 'summer' },
	7: { uk: 'Липень', en: 'July', season: 'summer' },
	8: { uk: 'Серпень', en: 'August', season: 'summer' },
	9: { uk: 'Вересень', en: 'September', season: 'autumn' },
	10: { uk: 'Жовтень', en: 'October', season: 'autumn' },
	11: { uk: 'Листопад', en: 'November', season: 'autumn' },
	12: { uk: 'Грудень', en: 'December', season: 'winter' }
};

function formatDate(y: number, m: number, d: number): string {
	return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function findVacation(dateStr: string) {
	if (dateStr === '2025-12-25') {
		return { id: 'winter' as const, nameUk: 'Різдво / Зимові свята', nameEn: 'Christmas / Winter Holidays', season: 'winter' as const };
	}
	for (const v of VACATIONS) {
		if (dateStr >= v.startDate && dateStr <= v.endDate) {
			return { id: v.id, nameUk: v.titleUk, nameEn: v.titleEn, season: v.season };
		}
	}
	return undefined;
}

export function buildMonth(year: number, month: number, isNextYearPreview = false): CalendarMonth {
	const info = MONTH_NAMES[month];
	const firstDay = new Date(year, month - 1, 1);
	const lastDay = new Date(year, month, 0);
	const daysCount = lastDay.getDate();
	const startDayOfWeek = (firstDay.getDay() + 6) % 7;
	const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
	const days: CalendarDay[] = [];

	for (let i = startDayOfWeek - 1; i >= 0; i--) {
		const prevDay = prevMonthLastDay - i;
		const prevDate = month === 1 ? formatDate(year - 1, 12, prevDay) : formatDate(year, month - 1, prevDay);
		const dayOfWeek = (startDayOfWeek - 1 - i + 7) % 7;
		days.push({
			date: prevDate,
			day: prevDay,
			month: month === 1 ? 12 : month - 1,
			year: month === 1 ? year - 1 : year,
			isCurrentMonth: false,
			isWeekend: dayOfWeek >= 5,
			isUaHoliday: UA_FLAG_DATES.has(prevDate),
			vacation: findVacation(prevDate),
			specialEvent: SPECIAL_EVENTS[prevDate]
		});
	}

	for (let d = 1; d <= daysCount; d++) {
		const curDate = formatDate(year, month, d);
		const curDow = (startDayOfWeek + d - 1) % 7;
		days.push({
			date: curDate,
			day: d,
			month,
			year,
			isCurrentMonth: true,
			isWeekend: curDow >= 5,
			isUaHoliday: UA_FLAG_DATES.has(curDate),
			vacation: findVacation(curDate),
			specialEvent: SPECIAL_EVENTS[curDate]
		});
	}

	const totalCells = 42; // Always 6 rows for uniform poster grid
	const remaining = totalCells - days.length;
	for (let n = 1; n <= remaining; n++) {
		const nextDate = month === 12 ? formatDate(year + 1, 1, n) : formatDate(year, month + 1, n);
		const nextDow = days.length % 7;
		days.push({
			date: nextDate,
			day: n,
			month: month === 12 ? 1 : month + 1,
			year: month === 12 ? year + 1 : year,
			isCurrentMonth: false,
			isWeekend: nextDow >= 5,
			isUaHoliday: UA_FLAG_DATES.has(nextDate),
			vacation: findVacation(nextDate),
			specialEvent: SPECIAL_EVENTS[nextDate]
		});
	}

	return {
		year,
		month,
		nameUk: isNextYearPreview ? 'Вересень 2026' : info.uk,
		nameEn: isNextYearPreview ? 'September 2026' : info.en,
		season: info.season,
		isNextYearPreview,
		days
	};
}

export function buildAcademicCalendar(): CalendarMonth[] {
	return [
		buildMonth(2025, 9),
		buildMonth(2025, 10),
		buildMonth(2025, 11),
		buildMonth(2025, 12),
		buildMonth(2026, 1),
		buildMonth(2026, 2),
		buildMonth(2026, 3),
		buildMonth(2026, 4),
		buildMonth(2026, 5),
		buildMonth(2026, 6),
		buildMonth(2026, 7),
		buildMonth(2026, 8),
		buildMonth(2026, 9, true)
	];
}
