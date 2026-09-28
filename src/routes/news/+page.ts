import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'News' : 'Новини',
		seoDescription: isEn
			? 'Latest news, events, performances, and achievements of students and teachers of Odesa Theatre School.'
			: 'Останні новини, події, вистави та досягнення учнів і викладачів Одеської театральної школи.',
		ogImageUrl: '/og/og-default-1200x630.jpg'
	};
};
