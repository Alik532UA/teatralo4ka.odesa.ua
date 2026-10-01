import { describe, expect, it } from 'vitest';
import {
	ACADEMIC_YEARS,
	ACADEMIC_YEAR_IDS,
	DEFAULT_ACADEMIC_YEAR_ID,
	LATEST_ACADEMIC_YEAR_ID,
	academicYearIdOf,
	defaultAcademicYearId,
	isAcademicYearId,
	yearBounds,
	type AcademicYear,
	type DateRange
} from './academicYears';

/**
 * Реєстр навчальних років — дані, які вписують руками з листа школи.
 *
 * Тести тут не повторюють дати (тест «2024-10-28 дорівнює 2024-10-28» ловить
 * лише самого себе), а тримають ЗВ'ЯЗКИ між ними: описка в одній цифрі рве
 * котрийсь із них. Зворотний експеримент: `winter.start` 2026–2027 змінено на
 * '2026-12-26' — впала перевірка стику з першим семестром і назвала рік.
 */

const DAY = 24 * 60 * 60 * 1000;
const time = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const daysBetween = (a: string, b: string) => Math.round((time(b) - time(a)) / DAY);
const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const isIso = (value: string) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) &&
	new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
const inside = (inner: DateRange, outer: DateRange) =>
	inner.start > outer.start && inner.end < outer.end;

const YEARS = ACADEMIC_YEAR_IDS.map((id) => [id, ACADEMIC_YEARS[id] as AcademicYear] as const);

describe('реєстр навчальних років', () => {
	it('перевірка жива: років щонайменше три, і вони йдуть поспіль', () => {
		expect(ACADEMIC_YEAR_IDS.length).toBeGreaterThanOrEqual(3);
		for (let i = 1; i < ACADEMIC_YEAR_IDS.length; i += 1) {
			expect(yearBounds(ACADEMIC_YEAR_IDS[i]).startYear, ACADEMIC_YEAR_IDS[i]).toBe(
				yearBounds(ACADEMIC_YEAR_IDS[i - 1]).endYear
			);
		}
	});

	it('назва року — два сусідні роки', () => {
		for (const id of ACADEMIC_YEAR_IDS) {
			const { startYear, endYear } = yearBounds(id);
			expect(endYear - startYear, id).toBe(1);
		}
	});

	it('останній рік реєстру — найпізніший', () => {
		expect(LATEST_ACADEMIC_YEAR_ID).toBe(ACADEMIC_YEAR_IDS.at(-1));
	});

	it('усі дати справжні й лежать у своєму навчальному році', () => {
		const bad: string[] = [];
		for (const [id, year] of YEARS) {
			const ranges = [...year.semesters, ...Object.values(year.vacations)];
			for (const range of ranges) {
				for (const date of [range.start, range.end]) {
					if (!isIso(date)) bad.push(`${id}: ${date} — не дата`);
					else if (academicYearIdOf(date) !== id) bad.push(`${id}: ${date} — з іншого року`);
				}
				if (range.start > range.end) bad.push(`${id}: ${range.start} пізніше за ${range.end}`);
			}
		}
		expect(bad).toEqual([]);
	});

	it('зимові канікули стикуються з обома семестрами день у день', () => {
		const bad: string[] = [];
		for (const [id, year] of YEARS) {
			const [first, second] = year.semesters;
			const { winter } = year.vacations;
			if (daysBetween(first.end, winter.start) !== 1) {
				bad.push(`${id}: перший семестр до ${first.end}, канікули з ${winter.start}`);
			}
			if (daysBetween(winter.end, second.start) !== 1) {
				bad.push(`${id}: канікули до ${winter.end}, другий семестр з ${second.start}`);
			}
		}
		expect(bad).toEqual([]);
	});

	it('осінні канікули — усередині першого семестру, весняні — другого', () => {
		const bad: string[] = [];
		for (const [id, year] of YEARS) {
			if (!inside(year.vacations.autumn, year.semesters[0])) bad.push(`${id}: осінні`);
			if (!inside(year.vacations.spring, year.semesters[1])) bad.push(`${id}: весняні`);
		}
		expect(bad).toEqual([]);
	});

	/*
	 * Не закон, а звичка школи, яка трималася всі три роки: осінні й весняні
	 * канікули — рівно тиждень, з понеділка по неділю. Описка на день ламає
	 * саме це. Якщо школа колись оголосить інакше — прибрати перевірку разом із
	 * новими даними, а не «виправляти» дати під неї.
	 */
	it('осінні й весняні канікули — тиждень з понеділка по неділю', () => {
		const bad: string[] = [];
		for (const [id, year] of YEARS) {
			for (const name of ['autumn', 'spring'] as const) {
				const { start, end } = year.vacations[name];
				if (weekday(start) !== 1 || daysBetween(start, end) !== 6) {
					bad.push(`${id} ${name}: ${start} — ${end}`);
				}
			}
		}
		expect(bad).toEqual([]);
	});
});

describe('навчальний рік за датою', () => {
	it('рік починається 1 вересня й закінчується 31 серпня', () => {
		expect(academicYearIdOf('2026-08-31')).toBe('2025-2026');
		expect(academicYearIdOf('2026-09-01')).toBe('2026-2027');
		expect(academicYearIdOf('2027-01-15')).toBe('2026-2027');
	});

	it('рік поза реєстром називається, але не вважається відомим', () => {
		expect(academicYearIdOf('2035-10-01')).toBe('2035-2036');
		expect(isAcademicYearId('2035-2036')).toBe(false);
		expect(isAcademicYearId('2025-2026')).toBe(true);
		expect(isAcademicYearId('toString')).toBe(false);
	});
});

describe('типовий навчальний рік (перемикання з 1 серпня)', () => {
	it('до 1 серпня триває попередній навчальний рік, з 1 серпня — новий', () => {
		expect(defaultAcademicYearId(new Date('2026-07-31T23:59:59'))).toBe('2025-2026');
		expect(defaultAcademicYearId(new Date('2026-08-01T00:00:00'))).toBe('2026-2027');
		expect(defaultAcademicYearId(new Date('2026-10-01T12:00:00'))).toBe('2026-2027');
		expect(defaultAcademicYearId(new Date('2027-07-31T23:59:59'))).toBe('2026-2027');
		expect(defaultAcademicYearId(new Date('2027-08-01T00:00:00'))).toBe('2027-2028');
	});

	it('рік поза реєстром обмежується наявними межами реєстру', () => {
		expect(defaultAcademicYearId(new Date('2020-09-01T00:00:00'))).toBe('2024-2025');
		expect(defaultAcademicYearId(new Date('2040-09-01T00:00:00'))).toBe('2031-2032');
	});

	it('DEFAULT_ACADEMIC_YEAR_ID збігається з викликом defaultAcademicYearId()', () => {
		expect(DEFAULT_ACADEMIC_YEAR_ID).toBe(defaultAcademicYearId());
	});
});
