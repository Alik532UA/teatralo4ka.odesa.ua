import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'BrandBook' : 'Брендбук школи',
		seoDescription: isEn
			? 'Official brand identity guidelines of Odesa Children’s Theatre School: colors, e-Ukraine font, logo usage, and graphic assets.'
			: 'Офіційний брендбук та гайдлайн візуального стилю Одеської дитячої театральної школи: кольори, шрифт e-Ukraine та логотипи.',
		ogImageUrl: '/png/brandbook.webp'
	};
};
