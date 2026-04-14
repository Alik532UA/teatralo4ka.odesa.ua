import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const prerender = true;

const EXTERNAL_URL = 'https://sites.google.com/view/ats-ua';

export const load: PageLoad = async () => {
	redirect(301, EXTERNAL_URL);
};
