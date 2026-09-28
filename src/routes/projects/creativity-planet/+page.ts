import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Planet of Creativity' : 'Планета творчості',
		seoDescription: isEn
			? 'Planet of Creativity of Odesa Theatre School: current students, profiles, future stars, and creative growth.'
			: 'Планета творчості Одеської театральної школи: учні, анкети, майбутні зірки сцени та творче зростання.',
		ogImageUrl: '/png/creativity-planet.webp'
	};
};
