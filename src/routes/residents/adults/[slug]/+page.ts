import { error } from '@sveltejs/kit';
import { getMasterBySlug, getGraduatesByMaster, MASTERS } from '$lib/data/masters';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return MASTERS.map((m) => ({ slug: m.slug }));
};

export const load: PageLoad = async ({ params }) => {
	const master = getMasterBySlug(params.slug);
	if (!master) {
		throw error(404, 'Master not found');
	}
	const graduates = getGraduatesByMaster(master.id);

	return {
		master,
		graduates
	};
};
