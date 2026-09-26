import { UKRAINIAN_HOLIDAYS } from '$lib/config/ukrainianHolidays';
import {
	ACADEMIC_YEARS,
	academicYearIdOf,
	isAcademicYearId,
	yearBounds,
	type AcademicYear,
	type AcademicYearId,
	type DateRange,
	type VacationId
} from './academicYears';
import { MONTHS, type Localized } from './calendarText';

/**
 * Навчальний календар: з дат `academicYears.ts` — дні плаката й події.
 *
 * ## Чому все виводиться, а не записується
 *
 * Дата — єдиний факт. Із неї тут рахуються клітинки місяців, статус кожного
 * дня й назви подій у картці дня; підписи плаката — у `calendarText.ts`. Перша
 * редакція тримала події словником конкретних дат 2025–2026, тож для іншого
 * року плакат лишався б без жодного свята.
 *
 * Події прив'язані до ДАТИ, а не до року плаката: 1 вересня 2026 — це і
 * останній місяць плаката 2025–2026, і перший місяць 2026–2027, і в обох він
 * мусить казати те саме. Тому індекс подій один на всі роки реєстру.
 *
 * ## Державні свята — з `config/ukrainianHolidays.ts`
 *
 * Той перелік уже звіряється з інлайн-скриптом заставки. Друга копія назв тут
 * розійшлася б із ним на першій же правці (перша редакція календаря так і мала
 * власний список із іншими англійськими назвами).
 */

/**
 * Що означає день для учня.
 *
 * `unknown` — року ще немає в реєстрі (останній місяць плаката дивиться на
 * вересень наступного року). Про такий день відомо лише, чи він вихідний.
 */
export type DayStatus = 'school' | 'vacation' | 'summer' | 'unknown';

/** Позначка клітинки на плакаті. Одна на день, щоб малюнки не накладалися. */
export type DayBadge = VacationId | 'flag';

export interface CalendarDay {
	date: string;
	day: number;
	month: number;
	year: number;
	/** Клітинка належить своєму місяцю, а не хвосту сусіднього. */
	isCurrentMonth: boolean;
	isWeekend: boolean;
	status: DayStatus;
	vacation?: VacationId;
	/** Одне з чотирьох свят, яким плакат малює прапор. */
	isFlagDay: boolean;
	badge?: DayBadge;
	events: readonly Localized[];
}

export interface CalendarMonth {
	year: number;
	month: number;
	name: Localized;
	/** Тринадцятий місяць плаката — вересень наступного навчального року. */
	isNextYearPreview: boolean;
	/** Завжди 42 клітинки, шість тижнів: сітка плаката однакова для всіх місяців. */
	days: readonly CalendarDay[];
}

/**
 * Свята з прапором на плакаті — так на макеті: чотири головні державні.
 * Решта державних свят у картці дня названа, але прапора не має.
 */
const FLAG_DAYS: ReadonlySet<string> = new Set(['06-28', '07-15', '08-24', '10-01']);

/**
 * Різдво на плакаті зі сніжинкою, навіть коли зимові канікули починаються
 * пізніше (2025: свято 25-го, канікули з 27-го). Так на макеті; самі канікули
 * цей день НЕ розширює — у картці дня він лишається святом, а не канікулами.
 */
const CHRISTMAS = '12-25';

/** Дні школи й театру, яких немає серед державних свят. */
const SCHOOL_OBSERVANCES: readonly { md: string; name: Localized }[] = [
	{ md: '09-01', name: { uk: 'День знань', en: 'Knowledge Day' } },
	{ md: '03-27', name: { uk: 'Всесвітній день театру 🎭', en: 'World Theatre Day 🎭' } }
];

/** Дата `YYYY-MM-DD` у полудні UTC — щоб жодна часова зона не зсунула день. */
function toDate(iso: string): Date {
	return new Date(`${iso}T12:00:00Z`);
}

export function addDays(iso: string, days: number): string {
	const date = toDate(iso);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

function isoOf(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const inRange = (date: string, range: DateRange) => date >= range.start && date <= range.end;

/**
 * Великдень — за юліанською пасхалією, у григоріанській даті.
 *
 * ПЦУ й УГКЦ, перейшовши 2023 року на новий стиль, рахують Великдень так само,
 * як до переходу. Формула Меуса дає юліанську дату, зсув +13 днів чинний для
 * 1900–2099 років. Друга редакція тримала дати списком літералів — кожен новий
 * рік вимагав би дописати ще один, і забутий давав би мовчазний пропуск.
 */
export function easterDate(year: number): string {
	const a = year % 4;
	const b = year % 7;
	const c = year % 19;
	const d = (19 * c + 15) % 30;
	const e = (2 * a + 4 * b - d + 34) % 7;
	const month = Math.floor((d + e + 114) / 31);
	const day = ((d + e + 114) % 31) + 1;
	return addDays(isoOf(year, month, day), 13);
}

function schoolEvents(year: AcademicYear): [string, Localized][] {
	const [first, second] = year.semesters;
	return [
		[first.start, { uk: 'Початок 1 семестру', en: 'Start of the 1st semester' }],
		[first.end, { uk: 'Завершення 1 семестру', en: 'End of the 1st semester' }],
		[second.start, { uk: 'Початок 2 семестру', en: 'Start of the 2nd semester' }],
		[second.end, { uk: 'Завершення 2 семестру', en: 'End of the 2nd semester' }],
		[year.vacations.autumn.start, { uk: 'Початок осінніх канікул', en: 'Autumn break starts' }],
		[year.vacations.winter.start, { uk: 'Початок зимових канікул', en: 'Winter break starts' }],
		[year.vacations.spring.start, { uk: 'Початок весняних канікул', en: 'Spring break starts' }],
		[addDays(second.end, 1), { uk: 'Початок літнього відпочинку', en: 'Summer break starts' }]
	];
}

/** Події школи з усіх років реєстру — один індекс, бо подія належить даті. */
const SCHOOL_EVENTS = new Map<string, Localized[]>();
for (const year of Object.values(ACADEMIC_YEARS) as AcademicYear[]) {
	for (const [date, event] of schoolEvents(year)) {
		SCHOOL_EVENTS.set(date, [...(SCHOOL_EVENTS.get(date) ?? []), event]);
	}
}

/**
 * Усе, що відбувається в цей день: спершу свята, потім події школи.
 * Порядок той самий, що був на плакаті: «День знань / Початок 1 семестру».
 */
export function eventsOn(date: string): Localized[] {
	const md = date.slice(5);
	const events: Localized[] = [];
	for (const h of UKRAINIAN_HOLIDAYS) if (h.md === md) events.push({ uk: h.uk, en: h.en });
	for (const o of SCHOOL_OBSERVANCES) if (o.md === md) events.push(o.name);
	if (date === easterDate(Number(date.slice(0, 4)))) events.push({ uk: 'Великдень', en: 'Easter' });
	events.push(...(SCHOOL_EVENTS.get(date) ?? []));
	return events;
}

function statusOf(date: string): { status: DayStatus; vacation?: VacationId } {
	const id = academicYearIdOf(date);
	if (!isAcademicYearId(id)) return { status: 'unknown' };

	const year: AcademicYear = ACADEMIC_YEARS[id];
	for (const vacation of Object.keys(year.vacations) as VacationId[]) {
		if (inRange(date, year.vacations[vacation])) return { status: 'vacation', vacation };
	}
	if (year.semesters.some((semester) => inRange(date, semester))) return { status: 'school' };
	// До першого семестру або після другого — ті самі літні канікули.
	return { status: 'summer' };
}

export function describeDay(date: string, isCurrentMonth: boolean): CalendarDay {
	const d = toDate(date);
	const weekday = d.getUTCDay();
	const md = date.slice(5);
	const { status, vacation } = statusOf(date);
	const isFlagDay = FLAG_DAYS.has(md);
	const badge: DayBadge | undefined =
		vacation ?? (md === CHRISTMAS ? 'winter' : isFlagDay ? 'flag' : undefined);

	return {
		date,
		day: d.getUTCDate(),
		month: d.getUTCMonth() + 1,
		year: d.getUTCFullYear(),
		isCurrentMonth,
		isWeekend: weekday === 0 || weekday === 6,
		status,
		vacation,
		isFlagDay,
		badge,
		events: eventsOn(date)
	};
}

/** Місяць сітки плаката: тижні з понеділка, 42 клітинки разом із хвостами сусідів. */
export function buildMonth(year: number, month: number, isNextYearPreview = false): CalendarMonth {
	const first = isoOf(year, month, 1);
	const leading = (toDate(first).getUTCDay() + 6) % 7;
	const start = addDays(first, -leading);

	const days: CalendarDay[] = [];
	for (let i = 0; i < 42; i += 1) {
		const date = addDays(start, i);
		days.push(describeDay(date, Number(date.slice(5, 7)) === month));
	}

	const name = MONTHS[month - 1];
	return {
		year,
		month,
		name: isNextYearPreview ? { uk: `${name.uk} ${year}`, en: `${name.en} ${year}` } : name,
		isNextYearPreview,
		days
	};
}

/** Тринадцять місяців плаката: вересень — серпень і вересень наступного року. */
export function buildAcademicCalendar(id: AcademicYearId): CalendarMonth[] {
	const { startYear, endYear } = yearBounds(id);
	const months: CalendarMonth[] = [];
	for (let m = 9; m <= 12; m += 1) months.push(buildMonth(startYear, m));
	for (let m = 1; m <= 8; m += 1) months.push(buildMonth(endYear, m));
	months.push(buildMonth(endYear, 9, true));
	return months;
}
