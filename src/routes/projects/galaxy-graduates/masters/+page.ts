import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
	const isEn = localeFromPath(url.pathname) === 'en';
	return {
		seoTitle: isEn ? 'Teachers and Masters' : 'Викладачі та майстри',
		seoDescription: isEn
			? 'Course masters and teachers of the Galaxy of Graduates: theatre educators, directors, mentors of generations.'
			: 'Майстри курсів та викладачі «Галактики випускників»: театральні педагоги, режисери, наставники поколінь.',
		ogImageUrl: '/og/og-gg-1200x630.jpg'
	};
};
