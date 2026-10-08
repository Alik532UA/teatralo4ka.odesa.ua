import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'School Posters' : 'Афіші школи',
		seoDescription: isEn
			? 'Official digital posters of Odesa Children’s Theatre School: dance collective enrollment, interactive view, and A4 print.'
			: 'Офіційні цифрові афіші та оголошення Одеської дитячої театральної школи: набір у танцювальний колектив, цифровий перегляд та друк у форматі A4.'
	};
};
