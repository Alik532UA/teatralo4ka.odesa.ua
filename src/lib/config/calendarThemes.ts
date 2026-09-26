import type { LocalImage } from './localImages';

/**
 * Фони плаката навчального календаря.
 *
 * `bgUrl` типізований як `LocalImage`: файл мусить бути в мапі розмірів
 * (`config/localImages.ts`), а там його ширину й висоту звіряє з диском
 * `localImages.test.ts`. Тобто фон, якого немає в `static/`, — помилка типів,
 * а не порожній плакат.
 *
 * `weekdayBg` — колір смуги днів тижня в картках місяців, підібраний до фону;
 * білий текст на ньому тримає контраст 4.5 : 1 (`calendarThemes.test.ts`).
 */
export interface CalendarTheme {
	id: string;
	nameUk: string;
	nameEn: string;
	bgUrl: LocalImage;
	weekdayBg: string;
	weekdayText: string;
}

export const CALENDAR_THEMES: readonly CalendarTheme[] = [
	{
		id: 'geometry',
		nameUk: 'Геометрія',
		nameEn: 'Geometry',
		bgUrl: '/calendar/calendar-bg-geometry.webp',
		weekdayBg: '#1d4ed8',
		weekdayText: '#ffffff'
	},
	{
		id: 'blue-hall',
		nameUk: 'Синя зала',
		nameEn: 'Blue Hall',
		bgUrl: '/calendar/calendar-bg-blue-hall.webp',
		weekdayBg: '#2c5270',
		weekdayText: '#ffffff'
	},
	{
		id: 'orange-hall',
		nameUk: 'Теракотова зала',
		nameEn: 'Terracotta Hall',
		bgUrl: '/calendar/calendar-bg-orange-hall.webp',
		weekdayBg: '#c2410c',
		weekdayText: '#ffffff'
	},
	{
		id: 'fairy-stage',
		nameUk: 'Казкова сцена',
		nameEn: 'Fairy Stage',
		bgUrl: '/calendar/calendar-bg-fairy-stage.webp',
		weekdayBg: '#c53030',
		weekdayText: '#ffffff'
	},
	{
		id: 'nature-dark',
		nameUk: 'Нічний ліс',
		nameEn: 'Night Forest',
		bgUrl: '/calendar/calendar-bg-dark.webp',
		weekdayBg: '#0f766e',
		weekdayText: '#ffffff'
	},
	{
		id: 'nature-green',
		nameUk: 'Літній гай',
		nameEn: 'Summer Grove',
		bgUrl: '/calendar/calendar-bg-green.webp',
		weekdayBg: '#15803d',
		weekdayText: '#ffffff'
	},
	{
		id: 'nature-autumn',
		nameUk: 'Осінній захід',
		nameEn: 'Autumn Sunset',
		bgUrl: '/calendar/calendar-bg-orange-purple.webp',
		weekdayBg: '#6b21a8',
		weekdayText: '#ffffff'
	},
	{
		id: 'nature-winter',
		nameUk: 'Зимова казка',
		nameEn: 'Winter Tale',
		bgUrl: '/calendar/calendar-bg-winter.webp',
		weekdayBg: '#0369a1',
		weekdayText: '#ffffff'
	}
];

export const DEFAULT_CALENDAR_THEME_ID = 'geometry';

/** Невідомий `id` (стара назва зі сховища) — типовий фон, а не порожнеча. */
export function getCalendarThemeById(id: string): CalendarTheme {
	return (
		CALENDAR_THEMES.find((t) => t.id === id) ??
		CALENDAR_THEMES.find((t) => t.id === DEFAULT_CALENDAR_THEME_ID) ??
		CALENDAR_THEMES[0]
	);
}
