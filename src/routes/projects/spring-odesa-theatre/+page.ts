import { loadPageWithMetadata } from '$lib/i18n/loader';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ url }) => {
	const uk = loadPageWithMetadata('uk', 'spring-odesa-theatre');
	const en = loadPageWithMetadata('en', 'spring-odesa-theatre');
	const current = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		uk,
		en,
		seoTitle: current?.metadata?.title ?? (localeFromPath(url.pathname) === 'en' ? '«Theatre Spring of Odesa»' : '«Театральна весна Одеси»'),
		seoDescription: current?.metadata?.seo?.description,
		ogImageUrl: current?.metadata?.coverUrl ?? '/og/og-default-1200x630.jpg'
	};
};
