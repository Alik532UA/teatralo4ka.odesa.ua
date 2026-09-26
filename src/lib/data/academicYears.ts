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
 * параметром `?year=`, а без параметра показується ОСТАННІЙ рік реєстру
 * (рішення автора 2026-09-26). Тобто новий рік стає типовим того ж дня, коли
 * його дописали, а не 1 вересня.
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
	}
} as const satisfies Record<`${number}-${number}`, AcademicYear>;

export type AcademicYearId = keyof typeof ACADEMIC_YEARS;

export const ACADEMIC_YEAR_IDS = Object.keys(ACADEMIC_YEARS) as AcademicYearId[];

/** Рік, який сторінка показує без параметра `?year=`. */
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
