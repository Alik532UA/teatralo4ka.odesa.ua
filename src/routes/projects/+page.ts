import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Projects' : 'Проєкти',
		seoDescription: isEn
			? 'Creative, educational, and partner projects of Odesa Theatre School: media, festivals, translations, and archives.'
			: 'Творчі, освітні та партнерські проєкти Одеської театральної школи: медіа, фестивалі, переклади та архів.',
		ogImageUrl: '/og/og-default-1200x630.jpg'
	};
};
