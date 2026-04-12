import { loadPageWithMetadata } from '$lib/i18n/loader';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'support-production');
	const en = loadPageWithMetadata('en', 'support-production');

	return { uk, en };
};
