import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = true;

const EXTERNAL_URL = 'https://sites.google.com/view/ats-ua';

export const load: PageServerLoad = async () => {
	redirect(301, EXTERNAL_URL);
};
