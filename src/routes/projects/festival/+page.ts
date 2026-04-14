import { loadPageWithMetadata } from '$lib/i18n/loader';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'festival');
	const en = loadPageWithMetadata('en', 'festival');

	return { uk, en };
};
