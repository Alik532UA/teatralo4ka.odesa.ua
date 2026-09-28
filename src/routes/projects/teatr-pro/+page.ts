import { loadPageWithMetadata } from '$lib/i18n/loader';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const uk = loadPageWithMetadata('uk', 'teatr-pro');
	const en = loadPageWithMetadata('en', 'teatr-pro');
	const current = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		uk,
		en,
		seoTitle: current?.metadata.title ?? (localeFromPath(url.pathname) === 'en' ? 'Theater.PRO' : 'Театр.PRO'),
		seoDescription: current?.metadata.seo.description,
		ogImageUrl: current?.metadata.coverUrl ?? '/2025-2026/teatr-pro-2026.jpg'
	};
};
