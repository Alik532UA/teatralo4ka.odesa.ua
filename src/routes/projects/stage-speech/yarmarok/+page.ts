import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Exercise 2: Yarmarok Tongue-Twister' : 'Вправа 2: Довгомовка «Ярмарок»',
		seoDescription: isEn
			? 'Ukrainian diction exercise based on Ostap Vyshnya’s "Fair" tongue-twister with accurate orthoepic accents and glossary.'
			: 'Вправа на тривале безперервне дихання та орфоепічні наголоси за текстом Остапа Вишні «Ярмарок» зі словничком.',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
