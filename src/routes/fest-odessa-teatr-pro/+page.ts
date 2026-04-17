import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { base } from '$app/paths';

export const prerender = true;

export const load: PageLoad = () => {
	throw redirect(301, `${base}/projects/teatr-pro/`);
};
