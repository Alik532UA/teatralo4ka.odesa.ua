import { loadPageWithMetadata } from '$lib/i18n/loader';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const uk = loadPageWithMetadata('uk', 'photo-archive');
	const en = loadPageWithMetadata('en', 'photo-archive');
	const current = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		uk,
		en,
		seoTitle: current?.metadata?.title ?? (localeFromPath(url.pathname) === 'en' ? 'Photo Archive' : 'Фотоархів'),
		seoDescription: current?.metadata?.seo?.description,
		ogImageUrl: current?.metadata?.coverUrl ?? '/png/photo-archive.png'
	};
};
