/**
 * Навчальні роки школи — ЄДИНЕ місце, де записані дати семестрів і канікул.
 *
 * ## Лише дати, жодного тексту
 *
 * Перша редакція тримала кожен факт тричі: `startDate: '2024-10-28'`, поруч
 * рядок «з 28 жовтня» для плаката і ще «from Oct 28». Така трійка розходиться
 * мовчки — виправили дату, забули підпис, і плакат каже одне, а картка дня
 * інше. Тепер підписи виводить `academicCalendar.ts` із цих самих дат.
 *
 * ## Звідки дати
 *
 * 2025–2026 — з макета плаката (перший календар, коміт `c065618`); 2024–2025 і
 * 2026–2027 — від автора 2026-09-26. Описку в цифрі ловить
 * `academicYears.test.ts`: зимові канікули стикуються з обома семестрами день у
 * день, осінні лежать усередині першого, весняні — другого.
 *
 * ## Як додати рік
 *
 * Дописати запис у кінець — і все: сторінка одна (`/calendar/`), рік обирається
 * параметром `?year=`, а без параметра показується актуальний навчальний рік,
 * який автоматично перемикається з 1 серпня (`DEFAULT_ACADEMIC_YEAR_ID`).
 *
 * `$lib` тут не імпортується: модуль чистий, без залежностей, і таким має
 * лишитися — його читають і юніт-тести, і сторінка, і плакат.
 */

/** Проміжок днів `YYYY-MM-DD`, обидва краї включно. */
export interface DateRange {
	start: string;
	end: string;
}

export type VacationId = 'autumn' | 'winter' | 'spring';

export interface AcademicYear {
	semesters: readonly [DateRange, DateRange];
	vacations: Readonly<Record<VacationId, DateRange>>;
}

/** Порядок записів хронологічний — у ньому роки стоять у перемикачі. */
export const ACADEMIC_YEARS = {
	'2024-2025': {
		semesters: [
			{ start: '2024-09-02', end: '2024-12-23' },
			{ start: '2025-01-09', end: '2025-05-31' }
		],
		vacations: {
			autumn: { start: '2024-10-28', end: '2024-11-03' },
			winter: { start: '2024-12-24', end: '2025-01-08' },
			spring: { start: '2025-03-24', end: '2025-03-30' }
		}
	},
	'2025-2026': {
		semesters: [
			{ start: '2025-09-01', end: '2025-12-26' },
			{ start: '2026-01-12', end: '2026-05-31' }
		],
		vacations: {
			autumn: { start: '2025-10-27', end: '2025-11-02' },
			winter: { start: '2025-12-27', end: '2026-01-11' },
			spring: { start: '2026-03-23', end: '2026-03-29' }
		}
	},
	'2026-2027': {
		semesters: [
			{ start: '2026-09-01', end: '2026-12-24' },
			{ start: '2027-01-11', end: '2027-05-30' }
		],
		vacations: {
			autumn: { start: '2026-10-26', end: '2026-11-01' },
			winter: { start: '2026-12-25', end: '2027-01-10' },
			spring: { start: '2027-03-22', end: '2027-03-28' }
		}
	},
	'2027-2028': {
		semesters: [
			{ start: '2027-09-01', end: '2027-12-24' },
			{ start: '2028-01-10', end: '2028-05-31' }
		],
		vacations: {
			autumn: { start: '2027-10-25', end: '2027-10-31' },
			winter: { start: '2027-12-25', end: '2028-01-09' },
			spring: { start: '2028-03-27', end: '2028-04-02' }
		}
	},
	'2028-2029': {
		semesters: [
			{ start: '2028-09-01', end: '2028-12-24' },
			{ start: '2029-01-08', end: '2029-05-31' }
		],
		vacations: {
			autumn: { start: '2028-10-30', end: '2028-11-05' },
			winter: { start: '2028-12-25', end: '2029-01-07' },
			spring: { start: '2029-03-26', end: '2029-04-01' }
		}
	},
	'2029-2030': {
		semesters: [
			{ start: '2029-09-03', end: '2029-12-24' },
			{ start: '2030-01-14', end: '2030-05-31' }
		],
		vacations: {
			autumn: { start: '2029-10-29', end: '2029-11-04' },
			winter: { start: '2029-12-25', end: '2030-01-13' },
			spring: { start: '2030-03-25', end: '2030-03-31' }
		}
	},
	'2030-2031': {
		semesters: [
			{ start: '2030-09-02', end: '2030-12-24' },
			{ start: '2031-01-13', end: '2031-05-31' }
		],
		vacations: {
			autumn: { start: '2030-10-28', end: '2030-11-03' },
			winter: { start: '2030-12-25', end: '2031-01-12' },
			spring: { start: '2031-03-24', end: '2031-03-30' }
		}
	},
	'2031-2032': {
		semesters: [
			{ start: '2031-09-01', end: '2031-12-24' },
			{ start: '2032-01-12', end: '2032-05-31' }
		],
		vacations: {
			autumn: { start: '2031-10-27', end: '2031-11-02' },
			winter: { start: '2031-12-25', end: '2032-01-11' },
			spring: { start: '2032-03-22', end: '2032-03-28' }
		}
	}
} as const satisfies Record<`${number}-${number}`, AcademicYear>;

export type AcademicYearId = keyof typeof ACADEMIC_YEARS;

export const ACADEMIC_YEAR_IDS = Object.keys(ACADEMIC_YEARS) as AcademicYearId[];

/**
 * Навчальний рік, який показується відвідувачу за замовчуванням (без параметра `?year=`).
 *
 * Перемикається 1 серпня: з 1 серпня по 31 липня наступного року типовим є
 * навчальний рік, що розпочинається.
 * Якщо обчисленого року немає в реєстрі — повертається найближчий наявний.
 */
export function defaultAcademicYearId(now: Date = new Date()): AcademicYearId {
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const targetId = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
	if (isAcademicYearId(targetId)) return targetId;
	if (targetId < ACADEMIC_YEAR_IDS[0]) return ACADEMIC_YEAR_IDS[0];
	return ACADEMIC_YEAR_IDS[ACADEMIC_YEAR_IDS.length - 1];
}

/** Типовий рік на поточний момент (перемикається з 1 серпня). */
export const DEFAULT_ACADEMIC_YEAR_ID: AcademicYearId = defaultAcademicYearId();

/** Останній рік у реєстрі (хронологічно найпізніший). */
export const LATEST_ACADEMIC_YEAR_ID: AcademicYearId =
	ACADEMIC_YEAR_IDS[ACADEMIC_YEAR_IDS.length - 1];

export function isAcademicYearId(value: string): value is AcademicYearId {
	return Object.hasOwn(ACADEMIC_YEARS, value);
}

/** '2025-2026' → 2025 і 2026. Рік у назві — той самий факт, тому окремо не зберігається. */
export function yearBounds(id: string): { startYear: number; endYear: number } {
	const [startYear, endYear] = id.split('-').map(Number);
	return { startYear, endYear };
}

/**
 * Навчальний рік, у якому лежить дата: з 1 вересня по 31 серпня.
 *
 * Віддає назву й тоді, коли такого року в реєстрі ще немає, — питання «чи є
 * про нього дані» ставить той, хто викликає.
 */
export function academicYearIdOf(date: string): string {
	const year = Number(date.slice(0, 4));
	const month = Number(date.slice(5, 7));
	return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}
