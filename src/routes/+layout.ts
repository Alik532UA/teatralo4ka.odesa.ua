import { waitLocale, locale } from 'svelte-i18n';
import '$lib/i18n';
import { localeFromPath, localeAlternates } from '$lib/i18n/routing';

export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';

const SITE_FALLBACK_ORIGIN = 'https://teatralo4ka.odesa.ua';

export async function load({ url }: { url: URL }) {
	// Мова визначається АДРЕСОЮ, а не сховищем (I18N-v8 § 3.1).
	//
	// Порядок тут значущий і не переставляється: спершу `locale.set`, аж потім
	// `waitLocale`. Інакше очікування завершиться на словнику попередньої мови,
	// а потрібний почне вантажитися вже після рендеру — і сторінка з'явиться з
	// ключами замість тексту.
	//
	// Під час prerender це єдине джерело: `browser` там `false`, тож типова
	// детекція в `$lib/i18n` завжди дала б `uk`, і всі сторінки `/en/…`
	// зібралися б українською. Саме такий тихий збіг і робив би функцію
	// «зробленою», але неробочою.
	const lang = localeFromPath(url.pathname);
	locale.set(lang);
	await waitLocale(lang);

	// svelte-i18n loads dictionaries lazily, and the layout used to wrap the
	// whole page in {#await waitLocale()}. During prerendering that promise is
	// still pending, so every page shipped the empty placeholder branch: no
	// header, no nav, no headings. Awaiting here means the dictionary is ready
	// before anything renders.

	// Абсолютні адреси — від явної константи, а НЕ від `page.url.origin` (під
	// час prerender це `sveltekit-prerender`) і не від `base` (він відносний).
	// Обидві пастки описані в SEO-v8 § 1.2–1.3, і друга вже коштувала
	// "https://teatralo4ka.odesa.ua../logo/…" у структурованих даних.
	const canonicalUrl = `${SITE_FALLBACK_ORIGIN}${url.pathname}`;

	// Альтернативи однакові для обох мовних версій сторінки — це властивість,
	// перевірена тестом `routing.test.ts`. Якби набір відрізнявся, Google
	// вважав би розмітку суперечливою і не брав до уваги жодну.
	const alternates = localeAlternates(url.pathname).map(({ locale: l, path }) => ({
		locale: l,
		url: `${SITE_FALLBACK_ORIGIN}${path}`
	}));

	return {
		lang,
		canonicalUrl,
		alternates
	};
}
