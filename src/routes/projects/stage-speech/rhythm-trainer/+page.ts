import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Rhythm Trainer' : 'Ритм-тренажер для дикції',
		seoDescription: isEn
			? 'Interactive speech metronome (40-180 BPM) for diction, tempo-rhythm control, and stage speech practice.'
			: 'Інтерактивний метроном (40-180 BPM) для контролю темпоритму мовлення, артикуляційних тренувань та скоромовок.',
		ogImageUrl: '/png/stage-speech.webp'
	};
};
