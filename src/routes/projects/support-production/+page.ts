import { loadPageWithMetadata } from '$lib/i18n/loader';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const uk = loadPageWithMetadata('uk', 'support-production');
	const en = loadPageWithMetadata('en', 'support-production');
	const current = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		uk,
		en,
		seoTitle: current?.metadata.title ?? (localeFromPath(url.pathname) === 'en' ? 'DTSH-production' : 'ДТШ-production'),
		seoDescription: current?.metadata.seo.description,
		ogImageUrl: current?.metadata.coverUrl ?? '/png/support-production.png'
	};
};
