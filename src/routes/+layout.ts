import { waitLocale } from 'svelte-i18n';
import '$lib/i18n';

export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';

export async function load({ url }: { url: URL }) {
	// svelte-i18n loads dictionaries lazily, and the layout used to wrap the
	// whole page in {#await waitLocale()}. During prerendering that promise is
	// still pending, so every page shipped the empty placeholder branch: no
	// header, no nav, no headings. Awaiting here means the dictionary is ready
	// before anything renders.
	await waitLocale();

	// Generate canonical URL on server side to prevent hydration mismatch
	const SITE_FALLBACK_ORIGIN = 'https://teatralo4ka.odesa.ua';
	const canonicalUrl = `${SITE_FALLBACK_ORIGIN}${url.pathname}`;

	return {
		canonicalUrl,
	};
}
