import { loadPageWithMetadata } from '$lib/i18n/loader';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const uk = loadPageWithMetadata('uk', 'festival');
	const en = loadPageWithMetadata('en', 'festival');
	const current = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		uk,
		en,
		seoTitle: current?.metadata?.title ?? (localeFromPath(url.pathname) === 'en' ? 'Festival' : 'Фестиваль'),
		seoDescription: current?.metadata?.seo?.description,
		ogImageUrl: current?.metadata?.coverUrl ?? '/og/og-default-1200x630.jpg'
	};
};
