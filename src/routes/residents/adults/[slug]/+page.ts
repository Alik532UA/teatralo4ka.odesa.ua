import { error } from '@sveltejs/kit';
import { asset } from '$app/paths';
import {
	getMasterBySlug,
	getGraduatesByMaster,
	getStudentsByMaster,
	masterProfileJson,
	MASTERS,
	type MasterProfile
} from '$lib/data/masters';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return MASTERS.map((m) => ({ slug: m.slug }));
};

export const load: PageLoad = async ({ params, fetch }) => {
	const master = getMasterBySlug(params.slug);
	if (!master) {
		throw error(404, 'Master not found');
	}

	let profile: MasterProfile | null = null;
	try {
		const response = await fetch(masterProfileJson(master.slug));
		if (response.ok) {
			const json = await response.json();
			profile = {
				...json,
				photo: json.photo ? asset(json.photo) : undefined
			};
		}
	} catch {
		// Fallback to index entry if profile JSON fetch fails
	}

	const masterData = profile ? { ...master, ...profile } : master;
	const students = getStudentsByMaster(master.id);

	/*
	 * `graduates` — лише записи ВИПУСКНИКІВ, і фільтр тут не косметика: серед
	 * `students` тепер бувають колеги-майстри, які самі вчилися в цього майстра, а
	 * в переліку випускників їх немає. Доти рядок був `students.map((s) => s.graduate)`
	 * і на такому записі дав би `undefined` у масиві.
	 */
	const graduates = getGraduatesByMaster(master.id);

	return {
		master: masterData,
		students,
		graduates
	};
};
