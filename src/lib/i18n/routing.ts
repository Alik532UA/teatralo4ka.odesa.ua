/**
 * Мова в адресі (I18N-v8 § 3.1, HIGH).
 *
 * До цього мова жила ЛИШЕ в `localStorage`. Наслідків було два, і обидва
 * дорогі. Перший: англійської версії не існувало для пошуку — у `sitemap.xml`
 * стояло 22 адреси, усі українські, а сімнадцять сторінок, вичитаних людиною,
 * не мали власної адреси взагалі. Другий, менш очевидний: посиланням не можна
 * було поділитися. Надіслана адреса відкривалася тією мовою, яка збережена в
 * ОТРИМУВАЧА, а не тією, яку бачив відправник.
 *
 * Схема: `uk` лишається на голому шляху, `en` отримує префікс `/en/…`. Наявні
 * адреси через це не змінюються — жодного перенаправлення для вже
 * проіндексованих сторінок не потрібно.
 *
 * ## Чому це чисті функції в окремому модулі
 *
 * Ці правила читають щонайменше чотири різні місця: хук `reroute`, `load`
 * кореневого layout, перемикач мови й `scripts/generate-sitemap.ts` (той
 * узагалі виконується в Node під час збірки, без застосунку). Логіка,
 * розкладена по цих чотирьох місцях, розійдеться при першій же правці, а
 * розходження буде тихим: сторінка збереться, просто в `hreflang` стоятиме
 * одне, а в sitemap інше.
 */

import type { Pathname, ResolvedPathname } from '$app/types';

export const LOCALES = ['uk', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Мова без префікса. Її сторінки лежать на голому шляху. */
export const DEFAULT_LOCALE: Locale = 'uk';

/** Мови, що мають префікс у шляху. */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value);
}

/**
 * Мова, задана адресою. Для голого шляху — типова.
 *
 * Порівнюється саме сегмент, а не префікс рядка: `startsWith('/en')` дало б
 * `en` для `/energy`, і сторінка мовчки поїхала б не тією мовою.
 */
export function localeFromPath(pathname: string): Locale {
	const segment = pathname.split('/')[1] ?? '';
	return isLocale(segment) && segment !== DEFAULT_LOCALE ? segment : DEFAULT_LOCALE;
}

/**
 * Шлях без мовного префікса — тобто той, який справді існує серед маршрутів.
 *
 * Саме це віддає хук `reroute`: адреса лишається `/en/about`, а маршрут
 * шукається за `/about`. Тому 25 каталогів маршрутів не переїжджають нікуди,
 * і `resolve()` лишається типізованим проти реального списку.
 */
export function stripLocale(pathname: string): string {
	const locale = localeFromPath(pathname);
	if (locale === DEFAULT_LOCALE) return pathname;
	const rest = pathname.slice(`/${locale}`.length);
	// `/en` і `/en/` обидва означають головну сторінку. Без цього рядка перший
	// випадок дав би порожній шлях, який не зіставляється ні з чим.
	return rest === '' ? '/' : rest;
}

/**
 * Той самий вміст іншою мовою.
 *
 * @param pathname Будь-яка адреса — з префіксом або без.
 */
export function withLocale(pathname: string, locale: Locale): string {
	const bare = stripLocale(pathname);
	if (locale === DEFAULT_LOCALE) return bare;
	// Голова: `/en/` замість `/en`, щоб не розходитися з `trailingSlash: 'always'`.
	return bare === '/' ? `/${locale}/` : `/${locale}${bare}`;
}

/**
 * Те саме, що `withLocale`, але типізоване проти справжнього списку маршрутів.
 *
 * ## Навіщо окрема функція, якщо є `withLocale`
 *
 * `withLocale` приймає й віддає `string`, бо її кличуть і місця, де шлях
 * приходить із адресного рядка (перемикач мови, `redirects`) — там ніякої
 * типізації бути не може за визначенням. Для ПОСИЛАНЬ, що будуються з коду,
 * це занадто слабко, і слабкість була платною: адреса
 * `/projects/spring-Odesa-theatre` з великою «O» тримала сторінку зламаною в
 * продакшні, і саме через це в проєкті увімкнене
 * `svelte/no-navigation-without-resolve`.
 *
 * Тут перший аргумент — `Pathname` із `$app/types`, тобто згенерований список
 * реальних шляхів проєкту: описка в шляху стає помилкою компіляції. Результат —
 * `ResolvedPathname`, і саме за цим типом правило ESLint визнає адресу
 * перевіреною (воно приймає або прямий виклик `resolve()`, або значення цього
 * типу).
 *
 * ## Чому не `resolve()` напряму
 *
 * Перевірено збіркою, а не вирішено: під SSR `resolve()` віддає ВІДНОСНИЙ шлях
 * (`../../../projects/galaxy-graduates/15K`), і мовний префікс поверх нього дав
 * `/en../../../projects/…`. Наслідок був тихий: сторінки в збірці лишилися, але
 * краулер prerender не знайшов англійських — у мапі сайту стало 100 uk і 20 en
 * замість 100 і 100. Розгорнуто — у докблоці `graduateProfilePath`
 * ([`data/graduates.ts`](../data/graduates.ts)).
 *
 * Тобто тут не «обхід правила», а виконання його МЕТИ (типізована адреса)
 * способом, який працює під prerender.
 */
export function localizedPath(bare: Pathname, locale: Locale): ResolvedPathname {
	return withLocale(bare, locale) as ResolvedPathname;
}

/**
 * Усі мовні варіанти адреси — для `hreflang` і для `<xhtml:link>` у sitemap.
 *
 * Порядок фіксований (типова мова перша), бо цей масив рендериться в HTML і в
 * XML: різний порядок між збірками дав би дифи там, де нічого не змінилося.
 */
export function localeAlternates(pathname: string): { locale: Locale; path: string }[] {
	return LOCALES.map((locale) => ({ locale, path: withLocale(pathname, locale) }));
}
