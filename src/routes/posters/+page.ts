import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'School Posters' : 'Афіші школи',
		seoDescription: isEn
			? 'Official digital posters of Odesa Theatre School: dance collective enrollment, Defenders Day poetry playbill, interactive view, and A4 print.'
			: 'Офіційні цифрові афіші та оголошення Одеської театральної школи: набір у танцювальний колектив, поетична композиція до Дня захисників, цифровий перегляд та друк у форматі A4.'
	};
};
