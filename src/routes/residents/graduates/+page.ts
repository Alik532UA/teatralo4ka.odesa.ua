import { loadPageWithMetadata } from '$lib/i18n/loader';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'residents-graduates');
	const en = loadPageWithMetadata('en', 'residents-graduates');

	return { uk, en };
};
