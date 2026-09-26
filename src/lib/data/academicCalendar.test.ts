import { describe, expect, it } from 'vitest';
import { UKRAINIAN_HOLIDAYS } from '$lib/config/ukrainianHolidays';
import { ACADEMIC_YEARS, ACADEMIC_YEAR_IDS } from './academicYears';
import {
	buildAcademicCalendar,
	buildMonth,
	describeDay,
	easterDate,
	eventsOn
} from './academicCalendar';

const uk = (date: string) => eventsOn(date).map((e) => e.uk);

describe('плакат року', () => {
	it('тринадцять місяців: вересень — серпень і вересень наступного року', () => {
		for (const id of ACADEMIC_YEAR_IDS) {
			const months = buildAcademicCalendar(id);
			const [start, end] = id.split('-').map(Number);
			expect(months.map((m) => `${m.year}-${m.month}`), id).toEqual([
				`${start}-9`,
				`${start}-10`,
				`${start}-11`,
				`${start}-12`,
				...[1, 2, 3, 4, 5, 6, 7, 8].map((m) => `${end}-${m}`),
				`${end}-9`
			]);
			expect(months.filter((m) => m.isNextYearPreview), id).toHaveLength(1);
			expect(months[12].name.uk, id).toBe(`Вересень ${end}`);
		}
	});

	it('місяць — шість тижнів із понеділка, дні свого місяця підряд', () => {
		const month = buildMonth(2026, 10);
		expect(month.days).toHaveLength(42);
		// 1 жовтня 2026 — четвер: перед ним три дні вересня.
		expect(month.days.slice(0, 4).map((d) => d.date)).toEqual([
			'2026-09-28',
			'2026-09-29',
			'2026-09-30',
			'2026-10-01'
		]);
		const own = month.days.filter((d) => d.isCurrentMonth);
		expect(own.map((d) => d.day)).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
		expect(month.days.slice(5, 7).every((d) => d.isWeekend)).toBe(true);
	});

	it('місяць, що починається з понеділка, не має хвоста спереду', () => {
		// 1 вересня 2025 — понеділок.
		expect(buildMonth(2025, 9).days[0]).toMatchObject({ date: '2025-09-01', isCurrentMonth: true });
	});
});

describe('день', () => {
	it('канікули, навчальний день, літо й невідомий рік', () => {
		expect(describeDay('2026-10-28', true)).toMatchObject({ status: 'vacation', vacation: 'autumn' });
		expect(describeDay('2027-01-05', true)).toMatchObject({ status: 'vacation', vacation: 'winter' });
		expect(describeDay('2027-03-25', true)).toMatchObject({ status: 'vacation', vacation: 'spring' });
		expect(describeDay('2026-09-15', true).status).toBe('school');
		expect(describeDay('2026-07-10', true).status).toBe('summer');
		// Між 1 вересня й початком семестру — ще літо (2024: семестр з 2-го).
		expect(describeDay('2024-09-01', true).status).toBe('summer');
		expect(describeDay('2027-09-15', true).status).toBe('unknown');
	});

	it('прапор — на чотирьох свят, і кожне з них є серед державних', () => {
		const flagged = ['2026-06-28', '2026-07-15', '2026-08-24', '2026-10-01'];
		for (const date of flagged) expect(describeDay(date, true).badge, date).toBe('flag');
		expect(describeDay('2026-01-22', true).badge, 'День Соборності — без прапора').toBeUndefined();

		const holidays = new Set(UKRAINIAN_HOLIDAYS.map((h) => h.md));
		for (const date of flagged) expect(holidays.has(date.slice(5)), date).toBe(true);
	});

	it('Різдво поза канікулами — зі сніжинкою, але не канікули', () => {
		const christmas = describeDay('2025-12-25', true);
		expect(christmas).toMatchObject({ badge: 'winter', status: 'school' });
		expect(christmas.vacation).toBeUndefined();
		expect(christmas.events.map((e) => e.uk)).toEqual(['Різдво Христове']);
	});
});

describe('події', () => {
	it('свято і подія школи в один день — обидві, свято першим', () => {
		expect(uk('2025-09-01')).toEqual(['День знань', 'Початок 1 семестру']);
		expect(uk('2025-10-27')).toEqual([
			'День української писемності та мови',
			'Початок осінніх канікул'
		]);
	});

	it('межі семестрів і канікул кожного року', () => {
		for (const id of ACADEMIC_YEAR_IDS) {
			const { semesters, vacations } = ACADEMIC_YEARS[id];
			expect(uk(semesters[0].start), id).toContain('Початок 1 семестру');
			expect(uk(semesters[0].end), id).toContain('Завершення 1 семестру');
			expect(uk(semesters[1].start), id).toContain('Початок 2 семестру');
			expect(uk(semesters[1].end), id).toContain('Завершення 2 семестру');
			expect(uk(vacations.winter.start), id).toContain('Початок зимових канікул');
		}
	});

	/*
	 * Перша редакція ставила «літній відпочинок» на 1 червня незалежно від року.
	 * 2026–2027 другий семестр завершується 30 травня, тож відпочинок — з 31-го.
	 */
	it('літній відпочинок — наступного дня після другого семестру', () => {
		expect(uk('2027-05-31')).toContain('Початок літнього відпочинку');
		expect(uk('2027-06-01')).not.toContain('Початок літнього відпочинку');
		expect(uk('2026-06-01')).toContain('Початок літнього відпочинку');
	});

	it('усі державні свята названі тими самими словами, що й на заставці', () => {
		for (const holiday of UKRAINIAN_HOLIDAYS) {
			expect(uk(`2026-${holiday.md}`), holiday.md).toContain(holiday.uk);
		}
	});
});

describe('Великдень', () => {
	/* Відомі дати: 2025 обидві пасхалії збіглися, 2026 і 2027 — юліанська. */
	it.each([
		[2024, '2024-05-05'],
		[2025, '2025-04-20'],
		[2026, '2026-04-12'],
		[2027, '2027-05-02'],
		[2028, '2028-04-16']
	])('%i — %s', (year, date) => {
		expect(easterDate(year)).toBe(date);
		expect(uk(date)).toContain('Великдень');
	});
});
