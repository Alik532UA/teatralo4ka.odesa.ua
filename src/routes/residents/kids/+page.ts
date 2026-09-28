import { loadPageWithMetadata } from '$lib/i18n/loader';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const uk = loadPageWithMetadata('uk', 'residents-kids');
	const en = loadPageWithMetadata('en', 'residents-kids');
	const current = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		uk,
		en,
		seoTitle: current?.metadata?.title,
		seoDescription: current?.metadata?.seo?.description,
		ogImageUrl: current?.metadata?.coverUrl
	};
};
