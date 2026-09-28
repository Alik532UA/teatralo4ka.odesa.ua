import { loadPageWithMetadata } from '$lib/i18n/loader';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const uk = loadPageWithMetadata('uk', 'tkach-perekladach');
	const en = loadPageWithMetadata('en', 'tkach-perekladach');
	const current = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		uk,
		en,
		seoTitle: current?.metadata.title ?? '«Ткач Перекладач»',
		seoDescription: current?.metadata.seo.description,
		ogImageUrl: current?.metadata.coverUrl ?? '/png/tkach-perekladach.webp'
	};
};
