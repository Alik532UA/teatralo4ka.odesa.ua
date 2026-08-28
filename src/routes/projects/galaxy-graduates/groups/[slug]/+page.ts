import { error } from '@sveltejs/kit';
import { GROUPS, getGroupBySlug } from '$lib/data/groups';
import { GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
import mastersIndex from '$lib/data/masters.index.json';
import type { MasterIndexEntry } from '$lib/data/masters';

export const prerender = true;

export function entries() {
	return GROUPS.map((group) => ({ slug: group.slug }));
}

export async function load({ params }) {
	const group = getGroupBySlug(params.slug);
	if (!group) {
		error(404, `Групу не знайдено: ${params.slug}`);
	}

	// Майстри курсу з деталями
	const masters: (MasterIndexEntry | { id: string; fullName: string; displayName: string; photo?: string; departments?: string[] })[] =
		group.masters.map((m) => {
			const found = (mastersIndex as MasterIndexEntry[]).find((candidate) => candidate.id === m.id || candidate.slug === m.id);
			if (found) return found;
			return {
				id: m.id,
				slug: m.id,
				fullName: m.name,
				displayName: m.name,
				departments: m.department ? [m.department] : []
			};
		});

	// Випускники групи з індексу
	const members: GraduateIndexEntry[] = group.memberSlugs
		.map((slug) => GRADUATES.find((g) => g.slug === slug || g.code === slug))
		.filter((g): g is GraduateIndexEntry => Boolean(g));

	return {
		group,
		masters,
		members
	};
}
