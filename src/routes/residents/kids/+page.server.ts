import { loadPageWithMetadata } from '$lib/i18n/loader';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'residents-kids');
	const en = loadPageWithMetadata('en', 'residents-kids');

	return { uk, en };
};
