import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Stage Speech Exercises' : 'Вправи зі сценічної мови',
		seoDescription: isEn
			? 'Practical exercises for diction, breathing, and rhythm: hexameter, the "Fair" tongue-twister by Ostap Vyshnya, and rhythm trainer.'
			: 'Практичні матеріали та тренажери для розвитку акторської дикції, дихання та темпоритму: гекзаметр, довгомовка «Ярмарок» та ритм-тренажер.',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
