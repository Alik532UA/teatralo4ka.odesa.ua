import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn
			? '30th Anniversary Video Digest of Teatralo4ka'
			: 'Ювілейний відео-дайджест: 30 років «Театрало4ки»',
		seoDescription: isEn
			? '5-episode historical video digest for the 30th anniversary of Odesa Theatre School: watch episodes, answer quiz questions for prizes, and support the 14th ORB fundraiser.'
			: '5-серійний відео-дайджест до 30-річчя Одеської театральної школи: серії, вікторина з підказками та призами, а також збір на пікапи для 14 ОРБ ЗСУ.',
		ogImageUrl: '/posters/anniversary-booklet/p12-teatralo4ka-30.webp'
	};
};
