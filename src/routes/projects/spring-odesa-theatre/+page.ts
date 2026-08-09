import { loadPageWithMetadata } from '$lib/i18n/loader';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'spring-odesa-theatre');
	const en = loadPageWithMetadata('en', 'spring-odesa-theatre');

	return { uk, en };
};
