import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Exercise 6: Voice Power & Registers' : 'Вправа 6: Сила голосу та регістри',
		seoDescription: isEn
			? 'Voice projection and register exercises: "Ivanko" calling dialogue by Tkach Translator and "Jump Rope" breath rhythm drill.'
			: 'Тренування сили та регістрів голосу: сценічний діалог-гукання «Іванко» («Ткач-перекладач») та вправа «Скакалка».',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
