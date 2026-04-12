import { loadPageWithMetadata } from '$lib/i18n/loader';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'photo-archive');
	const en = loadPageWithMetadata('en', 'photo-archive');

	return { uk, en };
};
