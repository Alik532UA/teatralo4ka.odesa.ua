import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { resolve } from '$app/paths';

export const prerender = true;

export const load: PageLoad = () => {
	throw redirect(301, `${resolve('/calendar/2025-2026')}/`);
};
