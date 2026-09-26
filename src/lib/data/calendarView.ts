import type { ResolvedPathname } from '$app/types';
import { CALENDAR_THEMES, DEFAULT_CALENDAR_THEME_ID } from '$lib/config/calendarThemes';
import { localizedPath, type Locale } from '$lib/i18n/routing';
import { LATEST_ACADEMIC_YEAR_ID, isAcademicYearId, type AcademicYearId } from './academicYears';

/**
 * Що показує сторінка `/calendar/` — ЦІЛКОМ з адреси.
 *
 * `?year=2024-2025&bg=nature-winter&blur=8&filter=dark&density=40` відкриває
 * рівно той плакат, який бачив той, хто посилання надіслав. Рішення автора
 * 2026-09-26: «всі календарі в одному», рік параметром, типово — останній рік,
 * і фон з налаштуваннями — теж параметрами.
 *
 * Доти рік жив у шляху (`/calendar/2025-2026/`), а фон — у `localStorage`: та
 * сама адреса в двох людей показувала різне.
 *
 * ## Типові значення в адресу не пишуться
 *
 * Без жодного параметра `/calendar/` — це останній рік на фоні «Геометрія».
 * Параметр з'являється лише тоді, коли значення відрізняється від типового, і
 * зникає, щойно його повернули назад. Незнайоме значення (описка, рік, якого
 * ще немає) тихо стає типовим, а не ламає сторінку.
 *
 * ## Чому стан читається ЛИШЕ в браузері
 *
 * Сторінка prerender-иться, а під prerender SvelteKit забороняє читати
 * `url.searchParams` — у статичному файлі параметрів не існує. Тому HTML завжди
 * містить типовий вигляд, а параметри застосовуються після гідрації.
 */

export const BLUR_PX = { min: 0, max: 16, default: 4 } as const;
export const FILTER_DENSITY = { min: 5, max: 80, step: 5, default: 25 } as const;

export const FILTER_MODES = ['none', 'light', 'dark'] as const;
export type FilterMode = (typeof FILTER_MODES)[number];

export interface CalendarView {
	year: AcademicYearId;
	/** `id` теми фону з `config/calendarThemes.ts`. */
	bg: string;
	blur: number;
	filter: FilterMode;
	/** Густина фільтра у відсотках; без фільтра не має значення. */
	density: number;
}

export const DEFAULT_VIEW: Readonly<CalendarView> = {
	year: LATEST_ACADEMIC_YEAR_ID,
	bg: DEFAULT_CALENDAR_THEME_ID,
	blur: BLUR_PX.default,
	filter: 'none',
	density: FILTER_DENSITY.default
};

/** Імена параметрів — саме в цьому порядку вони стоять в адресі. */
const PARAMS = ['year', 'bg', 'blur', 'filter', 'density'] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Ціле число з параметра в межах — або типове.
 *
 * Порожній рядок перевіряється окремо: `Number('')` дорівнює нулю, і `?blur=`
 * тихо ставав би мінімумом (той самий дефект уже ловили в `graduateSlideshow`).
 */
function intParam(raw: string | null, min: number, max: number, fallback: number): number {
	if (raw === null || raw.trim() === '') return fallback;
	const value = Number(raw);
	return Number.isFinite(value) ? clamp(Math.round(value), min, max) : fallback;
}

export function parseCalendarView(params: URLSearchParams): CalendarView {
	const year = params.get('year') ?? '';
	const bg = params.get('bg') ?? '';
	const filter = params.get('filter') ?? '';
	return {
		year: isAcademicYearId(year) ? year : DEFAULT_VIEW.year,
		bg: CALENDAR_THEMES.some((t) => t.id === bg) ? bg : DEFAULT_VIEW.bg,
		blur: intParam(params.get('blur'), BLUR_PX.min, BLUR_PX.max, BLUR_PX.default),
		filter: (FILTER_MODES as readonly string[]).includes(filter)
			? (filter as FilterMode)
			: DEFAULT_VIEW.filter,
		density: intParam(
			params.get('density'),
			FILTER_DENSITY.min,
			FILTER_DENSITY.max,
			FILTER_DENSITY.default
		)
	};
}

/**
 * Параметри адреси для вигляду: лише ті, що відрізняються від типових.
 *
 * `keep` — параметри, які вже стоять в адресі й календарю не належать
 * (`?debug=1`, мітки реклами). Вони лишаються як були: перезаписуються тільки
 * свої п'ять.
 */
export function calendarViewParams(view: CalendarView, keep?: URLSearchParams): URLSearchParams {
	const params = new URLSearchParams(keep);
	for (const name of PARAMS) params.delete(name);
	if (view.year !== DEFAULT_VIEW.year) params.set('year', view.year);
	if (view.bg !== DEFAULT_VIEW.bg) params.set('bg', view.bg);
	if (view.blur !== DEFAULT_VIEW.blur) params.set('blur', String(view.blur));
	if (view.filter !== DEFAULT_VIEW.filter) {
		params.set('filter', view.filter);
		if (view.density !== DEFAULT_VIEW.density) params.set('density', String(view.density));
	}
	return params;
}

/**
 * Адреса сторінки з цим виглядом.
 *
 * `ResolvedPathname`, бо за цим типом `svelte/no-navigation-without-resolve`
 * визнає адресу перевіреною — так само, як результат `localizedPath`, з якого
 * вона й починається.
 */
export function calendarHref(
	view: CalendarView,
	locale: Locale,
	keep?: URLSearchParams
): ResolvedPathname {
	const path = localizedPath('/calendar/', locale);
	const query = calendarViewParams(view, keep).toString();
	return (query ? `${path}?${query}` : path) as ResolvedPathname;
}
