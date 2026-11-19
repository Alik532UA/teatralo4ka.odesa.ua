import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn
			? '30 Years of Odesa Theatre School — Anniversary Playbill & Charity Fundraiser'
			: '30 років Одеській театральній школі — Афіша святкових заходів та збір для ЗСУ',
		seoDescription: isEn
			? 'Odesa Theatre School celebrates its 30th anniversary: festive concert, art exhibition, cinema zoom, charity fundraiser for the 14th Separate Reconnaissance Battalion of the Armed Forces of Ukraine.'
			: 'Одеська театральна школа святкує 30-річчя: ювілейний концерт, виставка, кіно-зум та благодійний збір для 14-го ОРБ ЗСУ на пікапи спільно з БФ "Я Лю Україну".'
	};
};
