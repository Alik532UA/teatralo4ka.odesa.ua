/**
 * Таблиці розрахунків для виставлення рейтингової оцінки.
 *
 * Джерело даних: макет Figma (.private/notes/notes-2026-09-30.txt).
 */

export interface PercentageGradeRow {
	percentageRange: string;
	grade: number;
}

export interface LessonAbsenceRow {
	missedLessons: number;
	percentage: number;
	grade: number;
}

export const PERCENTAGE_GRADE_TABLE: readonly PercentageGradeRow[] = [
	{ percentageRange: '0% - 8%', grade: 1 },
	{ percentageRange: '9% - 19%', grade: 2 },
	{ percentageRange: '20% - 31%', grade: 3 },
	{ percentageRange: '32% - 42%', grade: 4 },
	{ percentageRange: '43% - 53%', grade: 5 },
	{ percentageRange: '54% - 64%', grade: 6 },
	{ percentageRange: '65% - 73%', grade: 7 },
	{ percentageRange: '74% - 79%', grade: 8 },
	{ percentageRange: '80% - 86%', grade: 9 },
	{ percentageRange: '87% - 92%', grade: 10 },
	{ percentageRange: '93% - 97%', grade: 11 },
	{ percentageRange: '98% - 100%', grade: 12 }
] as const;

export const ONE_LESSON_WEEK_TABLE: readonly LessonAbsenceRow[] = [
	{ missedLessons: 1, percentage: 91, grade: 11 },
	{ missedLessons: 2, percentage: 82, grade: 10 },
	{ missedLessons: 3, percentage: 73, grade: 9 },
	{ missedLessons: 4, percentage: 64, grade: 8 },
	{ missedLessons: 5, percentage: 55, grade: 7 },
	{ missedLessons: 6, percentage: 46, grade: 6 },
	{ missedLessons: 7, percentage: 37, grade: 5 },
	{ missedLessons: 8, percentage: 28, grade: 4 },
	{ missedLessons: 9, percentage: 19, grade: 3 },
	{ missedLessons: 10, percentage: 10, grade: 2 }
] as const;

export const TWO_LESSONS_WEEK_TABLE: readonly LessonAbsenceRow[] = [
	{ missedLessons: 1, percentage: 94, grade: 11 },
	{ missedLessons: 2, percentage: 88, grade: 10 },
	{ missedLessons: 3, percentage: 82, grade: 10 },
	{ missedLessons: 4, percentage: 76, grade: 9 },
	{ missedLessons: 5, percentage: 70, grade: 8 },
	{ missedLessons: 6, percentage: 64, grade: 8 },
	{ missedLessons: 7, percentage: 58, grade: 7 },
	{ missedLessons: 8, percentage: 52, grade: 6 },
	{ missedLessons: 9, percentage: 46, grade: 6 },
	{ missedLessons: 10, percentage: 40, grade: 5 },
	{ missedLessons: 11, percentage: 34, grade: 4 },
	{ missedLessons: 12, percentage: 28, grade: 4 },
	{ missedLessons: 13, percentage: 22, grade: 3 },
	{ missedLessons: 14, percentage: 16, grade: 2 },
	{ missedLessons: 15, percentage: 10, grade: 2 }
] as const;

export const THREE_LESSONS_WEEK_TABLE: readonly LessonAbsenceRow[] = [
	{ missedLessons: 1, percentage: 95, grade: 11 },
	{ missedLessons: 2, percentage: 90, grade: 11 },
	{ missedLessons: 3, percentage: 85, grade: 10 },
	{ missedLessons: 4, percentage: 80, grade: 10 },
	{ missedLessons: 5, percentage: 75, grade: 9 },
	{ missedLessons: 6, percentage: 70, grade: 8 },
	{ missedLessons: 7, percentage: 65, grade: 8 },
	{ missedLessons: 8, percentage: 60, grade: 7 },
	{ missedLessons: 9, percentage: 55, grade: 7 },
	{ missedLessons: 10, percentage: 50, grade: 6 },
	{ missedLessons: 11, percentage: 45, grade: 6 },
	{ missedLessons: 12, percentage: 40, grade: 5 },
	{ missedLessons: 13, percentage: 35, grade: 5 },
	{ missedLessons: 14, percentage: 30, grade: 4 },
	{ missedLessons: 15, percentage: 25, grade: 3 },
	{ missedLessons: 16, percentage: 25, grade: 3 },
	{ missedLessons: 17, percentage: 15, grade: 2 }
] as const;

export interface GradingTableTexts {
	mainTitle: string;
	mainSubtitle: string;
	ratioTableTitle: string;
	ratioColPercentage: string;
	ratioColGrade: string;
	weeklyTables: {
		oneLesson: string;
		twoLessons: string;
		threeLessons: string;
	};
	weeklyCols: {
		missedLessons: string;
		ratingPercentage: string;
		semesterGrade: string;
	};
	formatMissedLessons: (count: number) => string;
}

export const GRADING_TEXTS: Record<'uk' | 'en', GradingTableTexts> = {
	uk: {
		mainTitle: 'ТАБЛИЦІ РОЗРАХУНКІВ',
		mainSubtitle: 'для виставлення рейтингової оцінки',
		ratioTableTitle: 'Таблиця співвідношення % — оцінка',
		ratioColPercentage: 'відсоток%',
		ratioColGrade: 'відповідна оцінка',
		weeklyTables: {
			oneLesson: '1 урок на тиждень',
			twoLessons: '2 уроки на тиждень',
			threeLessons: '3 уроки на тиждень'
		},
		weeklyCols: {
			missedLessons: 'кількість пропущених уроків',
			ratingPercentage: 'рейтинговий відсоток (%)',
			semesterGrade: 'семестрова оцінка'
		},
		formatMissedLessons: (count: number) => {
			if (count === 1) return '1 урок';
			if (count >= 2 && count <= 4) return `${count} уроки`;
			return `${count} уроків`;
		}
	},
	en: {
		mainTitle: 'CALCULATION TABLES',
		mainSubtitle: 'for rating grade determination',
		ratioTableTitle: 'Percentage to grade conversion table',
		ratioColPercentage: 'percentage%',
		ratioColGrade: 'corresponding grade',
		weeklyTables: {
			oneLesson: '1 lesson per week',
			twoLessons: '2 lessons per week',
			threeLessons: '3 lessons per week'
		},
		weeklyCols: {
			missedLessons: 'number of missed lessons',
			ratingPercentage: 'rating percentage (%)',
			semesterGrade: 'semester grade'
		},
		formatMissedLessons: (count: number) => (count === 1 ? '1 lesson' : `${count} lessons`)
	}
};
