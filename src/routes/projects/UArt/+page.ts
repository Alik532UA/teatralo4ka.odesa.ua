import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn
			? '«UArt» Educational Theatre'
			: 'Навчальний театр «UArt»',
		seoDescription: isEn
			? '«UArt» Educational Theatre of Odesa Theatre School: You&Art — You and Art! UA — our Ukrainian roots. Young Repertoire Theatre.'
			: 'Навчальний театр «UArt» Одеської театральної школи: You&Art — Ти і Мистецтво! UA — наше коріння. Юний Репертуарний Театр.',
		ogImageUrl: '/png/uart-cover.webp'
	};
};
