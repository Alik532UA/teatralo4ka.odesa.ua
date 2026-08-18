import type { PageLoad } from './$types';
import { GRADUATES, GRADUATION_YEARS } from '$lib/data/graduates';

/**
 * До 2026-08-16 тут стояв `redirect(301, 'https://sites.google.com/view/ats-ua')`,
 * а сторінка була заглушкою з `meta refresh`. Наслідків було три: вся вага
 * посилань ішла на чужий домен, `/en/projects/galaxy-graduates` давав 757
 * порушень axe у розмітці Google Sites, і написаний `galaxy-graduates.md` роками
 * лежав недосяжним.
 *
 * Дані беруться з репозиторію (`$lib/data/graduates`), тому сторінка
 * prerender-иться цілком: усі 80 імен потрапляють у HTML і в індекс пошуку. Саме
 * заради цього дані й лежать у git, а не у Firestore.
 */
export const prerender = true;

export const load: PageLoad = async () => {
	return {
		graduates: GRADUATES,
		years: GRADUATION_YEARS
	};
};
