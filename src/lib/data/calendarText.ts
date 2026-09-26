import type { Locale } from '$lib/i18n/routing';
import {
	ACADEMIC_YEARS,
	LATEST_ACADEMIC_YEAR_ID,
	type AcademicYearId,
	type DateRange,
	type VacationId
} from './academicYears';

/**
 * Слова навчального календаря: назви місяців і днів, підписи плаката, назва
 * сторінки.
 *
 * Окремо від `academicCalendar.ts`, бо відповідають на різне питання: там —
 * ЩО відбувається в який день, тут — ЯК це сказати двома мовами. Підписи
 * виводяться з дат реєстру: у розмітці плаката немає жодного числа, і перша
 * редакція, де «з 27 жовтня» було вписане текстом, не могла показати інший рік.
 *
 * Дата розбирається з рядка `YYYY-MM-DD`, без `Date`: підпис дня не мусить
 * залежати від часової зони ні машини збірки, ні відвідувача.
 */

export interface Localized {
	uk: string;
	en: string;
}

export const MONTHS: readonly Localized[] = [
	{ uk: 'Січень', en: 'January' },
	{ uk: 'Лютий', en: 'February' },
	{ uk: 'Березень', en: 'March' },
	{ uk: 'Квітень', en: 'April' },
	{ uk: 'Травень', en: 'May' },
	{ uk: 'Червень', en: 'June' },
	{ uk: 'Липень', en: 'July' },
	{ uk: 'Серпень', en: 'August' },
	{ uk: 'Вересень', en: 'September' },
	{ uk: 'Жовтень', en: 'October' },
	{ uk: 'Листопад', en: 'November' },
	{ uk: 'Грудень', en: 'December' }
];

/** Місяць у датах «з 27 жовтня» — родовий відмінок. */
const MONTHS_GENITIVE_UK = [
	'січня',
	'лютого',
	'березня',
	'квітня',
	'травня',
	'червня',
	'липня',
	'серпня',
	'вересня',
	'жовтня',
	'листопада',
	'грудня'
];

/** Дні тижня з понеділка: скорочення в смузі картки, повна назва — для читалки. */
export const WEEKDAYS: readonly { short: Localized; full: Localized }[] = [
	{ short: { uk: 'Пн', en: 'Mon' }, full: { uk: 'понеділок', en: 'Monday' } },
	{ short: { uk: 'Вт', en: 'Tue' }, full: { uk: 'вівторок', en: 'Tuesday' } },
	{ short: { uk: 'Ср', en: 'Wed' }, full: { uk: 'середа', en: 'Wednesday' } },
	{ short: { uk: 'Чт', en: 'Thu' }, full: { uk: 'четвер', en: 'Thursday' } },
	{ short: { uk: 'Пт', en: 'Fri' }, full: { uk: 'пʼятниця', en: 'Friday' } },
	{ short: { uk: 'Сб', en: 'Sat' }, full: { uk: 'субота', en: 'Saturday' } },
	{ short: { uk: 'Нд', en: 'Sun' }, full: { uk: 'неділя', en: 'Sunday' } }
];

export const VACATION_NAMES: Readonly<Record<VacationId, Localized>> = {
	autumn: { uk: 'Осінні канікули', en: 'Autumn break' },
	winter: { uk: 'Зимові канікули', en: 'Winter break' },
	spring: { uk: 'Весняні канікули', en: 'Spring break' }
};

/** Коротка назва в панелі плаката — як на макеті: «осінні», «зимові», «весняні». */
export const VACATION_SHORT_NAMES: Readonly<Record<VacationId, Localized>> = {
	autumn: { uk: 'осінні', en: 'autumn' },
	winter: { uk: 'зимові', en: 'winter' },
	spring: { uk: 'весняні', en: 'spring' }
};

export function pick(text: Localized, locale: Locale): string {
	return locale === 'en' ? text.en : text.uk;
}

function parts(iso: string): { year: number; month: number; day: number } {
	const [year, month, day] = iso.split('-').map(Number);
	return { year, month, day };
}

function dayMonth(iso: string, locale: Locale): string {
	const { month, day } = parts(iso);
	return locale === 'en'
		? `${MONTHS[month - 1].en.slice(0, 3)} ${day}`
		: `${day} ${MONTHS_GENITIVE_UK[month - 1]}`;
}

/**
 * «1 вересня 2025» / «September 1, 2025» — назва клітинки для читалки й картки
 * дня. Перша редакція писала «1 Вересень 2025»: називний відмінок із назви
 * картки місяця.
 */
export function dayLabel(iso: string, locale: Locale): string {
	const { year, month, day } = parts(iso);
	return locale === 'en'
		? `${MONTHS[month - 1].en} ${day}, ${year}`
		: `${day} ${MONTHS_GENITIVE_UK[month - 1]} ${year}`;
}

/** «з 1 вересня по 26 грудня 2025 р.» / «from Sep 1 to Dec 26, 2025». */
export function rangeText(range: DateRange, locale: Locale): string {
	const startYear = range.start.slice(0, 4);
	const endYear = range.end.slice(0, 4);
	const from = dayMonth(range.start, locale);
	const to = dayMonth(range.end, locale);
	if (locale === 'en') {
		return startYear === endYear
			? `from ${from} to ${to}, ${endYear}`
			: `from ${from}, ${startYear} to ${to}, ${endYear}`;
	}
	return startYear === endYear
		? `з ${from} по ${to} ${endYear} р.`
		: `з ${from} ${startYear} р. по ${to} ${endYear} р.`;
}

/** Два рядки панелі канікул, без року — як на макеті: «з 27 грудня» / «по 11 січня». */
export function vacationLines(range: DateRange, locale: Locale): [string, string] {
	return locale === 'en'
		? [`from ${dayMonth(range.start, locale)}`, `to ${dayMonth(range.end, locale)}`]
		: [`з ${dayMonth(range.start, locale)}`, `по ${dayMonth(range.end, locale)}`];
}

/** «2025–2026» — із тире, як у перемикачі років. */
export function yearRangeLabel(id: AcademicYearId): string {
	return id.replace('-', '–');
}

/**
 * Підпис на плакаті. Українською — з дефісом, як на макеті й у листі автора
 * («Навчальний рік 2024-2025»); в англійській — тире.
 */
export function academicYearLabel(id: AcademicYearId, locale: Locale): string {
	return locale === 'en' ? `Academic Year ${yearRangeLabel(id)}` : `Навчальний рік ${id}`;
}

/**
 * Назва й опис сторінки для `<title>`, `og:` і пошуку.
 *
 * Лише звідси, а не `<title>` у самій сторінці: до `og:`/`twitter:` другий
 * `<title>` не доходить (розбір — у `App.PageData`, `src/app.d.ts`). І саме
 * мовою адреси: перша редакція віддавала українську назву й англійській
 * сторінці, бо назва зі сторінки старша за словник.
 *
 * Року в НАЗВІ немає: сторінка одна на всі роки. Опис — про той, що
 * показується без параметра, тобто останній.
 */
export function calendarPageSeo(locale: Locale): { seoTitle: string; seoDescription: string } {
	const [first, second] = ACADEMIC_YEARS[LATEST_ACADEMIC_YEAR_ID].semesters;
	const years = yearRangeLabel(LATEST_ACADEMIC_YEAR_ID);
	if (locale === 'en') {
		return {
			seoTitle: 'Academic Calendar',
			seoDescription:
				`Odesa Theatre School academic calendar for ${years}: ` +
				`1st semester ${rangeText(first, 'en')}, 2nd semester ${rangeText(second, 'en')}, ` +
				'autumn, winter and spring breaks, state holidays. Earlier years are on the same page.'
		};
	}
	return {
		seoTitle: 'Навчальний календар',
		seoDescription:
			`Навчальний календар Одеської театральної школи на ${years} рік: ` +
			`1-й семестр ${rangeText(first, 'uk')}, 2-й семестр ${rangeText(second, 'uk')}, ` +
			'осінні, зимові та весняні канікули, державні свята. Попередні роки — на тій самій сторінці.'
	};
}
