import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Exercise 5: Cumulative Breath Tales' : 'Вправа 5: Довгомовки на дихання',
		seoDescription: isEn
			? 'Cumulative breath training exercises: "The House That Jack Built" and "Japanese Name" by Ivan Nekhoda.'
			: 'Вправи на нарощування об’єму дихання: «Хатка, яку збудував собі Джек» та довгомовка «Японське ім’я» Івана Неходи.',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
