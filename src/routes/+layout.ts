import { waitLocale, locale } from 'svelte-i18n';
import '$lib/i18n';
import { localeFromPath, localeAlternates } from '$lib/i18n/routing';
import { SITE_ORIGIN } from '$lib/config/site';
import { isHiddenRoute } from '$lib/config/hiddenRoutes';
import { isHiddenMasterPath } from '$lib/config/mastersVisibility';

export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';

export async function load({ url }: { url: URL }) {
	// Мова визначається АДРЕСОЮ, а не сховищем (I18N-v8 § 3.1).
	//
	// Під час prerender це єдине джерело: `browser` там `false`, тож типова
	// детекція в `$lib/i18n` завжди дала б `uk`, і всі сторінки `/en/…`
	// зібралися б українською.
	const lang = localeFromPath(url.pathname);

	// ПОРЯДОК: спершу завантажити словник, аж ПОТІМ перемикати мову.
	//
	// Спершу тут стояло навпаки — `locale.set(lang)` і лише потім `waitLocale`.
	// Виглядало логічно й ловилося лише E2E, і то не щоразу: `locale.set`
	// перемикає мову НЕГАЙНО, а доки словник для неї не приїхав, `$t` віддає сам
	// ключ. У те вікно потрапляла гідрація, і в DOM опинявся рядок
	// «nav.skipToContent» замість «Перейти до основного контенту». Тест на це
	// падав приблизно раз на три прогони — тобто в CI виглядав би як флак.
	//
	// `waitLocale(lang)` завантажує словник, не перемикаючи мови, тож після нього
	// перемикання вже нічого не ламає.
	await waitLocale(lang);
	locale.set(lang);

	// svelte-i18n loads dictionaries lazily, and the layout used to wrap the
	// whole page in {#await waitLocale()}. During prerendering that promise is
	// still pending, so every page shipped the empty placeholder branch: no
	// header, no nav, no headings. Awaiting here means the dictionary is ready
	// before anything renders.

	// Абсолютні адреси — від явної константи, а НЕ від `page.url.origin` (під
	// час prerender це `sveltekit-prerender`) і не від `base` (він відносний).
	// Обидві пастки описані в SEO-v8 § 1.2–1.3, і друга вже коштувала
	// "https://teatralo4ka.odesa.ua../logo/…" у структурованих даних.
	const canonicalUrl = `${SITE_ORIGIN}${url.pathname}`;

	// Альтернативи однакові для обох мовних версій сторінки — це властивість,
	// перевірена тестом `routing.test.ts`. Якби набір відрізнявся, Google
	// вважав би розмітку суперечливою і не брав до уваги жодну.
	const alternates = localeAlternates(url.pathname).map(({ locale: l, path }) => ({
		locale: l,
		url: `${SITE_ORIGIN}${path}`
	}));

	/**
	 * Службові сторінки поза індексом (BETA-CHECKLIST-v8 § 4.1).
	 *
	 * Рішення ОДНЕ й ухвалюється тут, а не трьома окремими правками. Layout за
	 * цим прапорцем не малює `canonical` і `hreflang`, зате малює `noindex`; той
	 * самий перелік читають `generate-sitemap.ts` і `e2e/pages.ts`. Три списки,
	 * узгоджені руками, розійшлися б — у цьому проєкті так уже було з
	 * заглушками-перенаправленнями, і шість порожніх адрес поїхали в sitemap.
	 *
	 * Друге джерело — сторінки майстрів із `visible: false`
	 * (`config/mastersVisibility.ts`). Модель та сама («адреса працює, індексу
	 * немає»), реєстр окремий: у `HIDDEN_ROUTES` кожен запис зобовʼязаний бути ще
	 * й у `prerender.entries`, у `HIDDEN_ENTRIES` та в `robots.txt`, а для
	 * майстрів `Disallow` дав би протилежне потрібному — закриту від краулера
	 * сторінку, у якій `noindex` не буде прочитаний ніколи.
	 */
	const hidden = isHiddenRoute(url.pathname) || isHiddenMasterPath(url.pathname);

	return {
		lang,
		canonicalUrl,
		alternates,
		hidden
	};
}
