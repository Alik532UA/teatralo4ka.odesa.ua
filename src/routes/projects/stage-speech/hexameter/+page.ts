import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Exercise 1: Hexameter' : 'Вправа 1: Гекзаметр',
		seoDescription: isEn
			? 'Ancient Homeric hexameter exercise with breathing and caesura practice, accompanied by a rhythm metronome.'
			: 'Вправа на античний гекзаметр Гомера («Одіссея») для опрацювання дихання, цезури та ритму з метрономом.',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
