import { describe, expect, it } from 'vitest';
import {
	GRADING_TEXTS,
	ONE_LESSON_WEEK_TABLE,
	PERCENTAGE_GRADE_TABLE,
	THREE_LESSONS_WEEK_TABLE,
	TWO_LESSONS_WEEK_TABLE
} from './gradingTables';

describe('gradingTables data', () => {
	it('percentage table has 12 entries with grades from 1 to 12', () => {
		expect(PERCENTAGE_GRADE_TABLE.length).toBe(12);
		expect(PERCENTAGE_GRADE_TABLE.map((r) => r.grade)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
		]);
	});

	it('1 lesson per week has 10 rows', () => {
		expect(ONE_LESSON_WEEK_TABLE.length).toBe(10);
		expect(ONE_LESSON_WEEK_TABLE[0]).toEqual({ missedLessons: 1, percentage: 91, grade: 11 });
		expect(ONE_LESSON_WEEK_TABLE.at(-1)).toEqual({ missedLessons: 10, percentage: 10, grade: 2 });
	});

	it('2 lessons per week has 15 rows', () => {
		expect(TWO_LESSONS_WEEK_TABLE.length).toBe(15);
		expect(TWO_LESSONS_WEEK_TABLE[0]).toEqual({ missedLessons: 1, percentage: 94, grade: 11 });
		expect(TWO_LESSONS_WEEK_TABLE.at(-1)).toEqual({ missedLessons: 15, percentage: 10, grade: 2 });
	});

	it('3 lessons per week has 17 rows', () => {
		expect(THREE_LESSONS_WEEK_TABLE.length).toBe(17);
		expect(THREE_LESSONS_WEEK_TABLE[0]).toEqual({ missedLessons: 1, percentage: 95, grade: 11 });
		expect(THREE_LESSONS_WEEK_TABLE.at(-1)).toEqual({ missedLessons: 17, percentage: 15, grade: 2 });
	});

	it('texts are localized in both uk and en', () => {
		for (const locale of ['uk', 'en'] as const) {
			const texts = GRADING_TEXTS[locale];
			expect(texts.mainTitle.length).toBeGreaterThan(0);
			expect(texts.mainSubtitle.length).toBeGreaterThan(0);
			expect(texts.ratioTableTitle.length).toBeGreaterThan(0);
			expect(texts.weeklyTables.oneLesson.length).toBeGreaterThan(0);
			expect(texts.formatMissedLessons(1).length).toBeGreaterThan(0);
			expect(texts.formatMissedLessons(3).length).toBeGreaterThan(0);
			expect(texts.formatMissedLessons(5).length).toBeGreaterThan(0);
		}
	});
});
