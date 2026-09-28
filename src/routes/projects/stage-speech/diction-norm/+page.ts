import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Exercise 3: Diction Normative Practice' : 'Вправа 3: Дикційна нормативність',
		seoDescription: isEn
			? '15 systematic speech exercises based on A. Gladysheva with text adaptation by Tkach Translator for precise consonant articulation.'
			: '15 нормативних дикційних вправ за книгою А. Гладишевої в адаптації «Ткач-перекладач» для постановки приголосних звуків.',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
