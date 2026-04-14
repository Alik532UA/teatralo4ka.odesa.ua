export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';

export function load({ url }: { url: URL }) {
	// Generate canonical URL on server side to prevent hydration mismatch
	const SITE_FALLBACK_ORIGIN = 'https://teatralo4ka.odesa.ua';
	const canonicalUrl = `${SITE_FALLBACK_ORIGIN}${url.pathname}`;

	return {
		canonicalUrl,
	};
}
