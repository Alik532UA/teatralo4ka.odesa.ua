import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Friends of School' : 'Друзі школи',
		seoDescription: isEn
			? 'Creative friends and partners of Odesa Theatre School: artists, cultural figures, teams, and organizations.'
			: 'Творчі друзі та партнери Одеської театральної школи: митці, діячі культури, колективи та організації.',
		ogImageUrl: '/og/og-gg-1200x630.jpg'
	};
};
