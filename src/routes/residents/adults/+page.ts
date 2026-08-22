import { loadPageWithMetadata } from '$lib/i18n/loader';
import { getAllMasters, getGraduatesByMaster } from '$lib/data/masters';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const uk = loadPageWithMetadata('uk', 'residents-adults');
	const en = loadPageWithMetadata('en', 'residents-adults');

	const masters = getAllMasters().map((m) => {
		const graduates = getGraduatesByMaster(m.id);
		return {
			...m,
			graduatesCount: graduates.length
		};
	});

	return { uk, en, masters };
};
