import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Exercise 4: Tongue-Twisters Anthology' : 'Вправа 4: Антологія скоромовок',
		seoDescription: isEn
			? 'Comprehensive collection of classic and theatrical Ukrainian tongue-twisters with live search, sound filters, and warmup mode.'
			: 'Велика добірка класичних та сценічних українських скоромовок для розминки артикуляційного апарату з пошуком та фільтрами.',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
