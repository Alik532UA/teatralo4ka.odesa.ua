import { error } from '@sveltejs/kit';
import { EXPERTS, getExpertBySlug } from '$lib/data/experts';
import { FESTIVALS, festivalPath } from '$lib/data/festivals';
import { detailWords, joinDescription } from '$lib/config/seoDetail';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => EXPERTS.map((e) => ({ slug: e.slug }));

export const load: PageLoad = async ({ params, url }) => {
	const expert = getExpertBySlug(params.slug);
	if (!expert) {
		error(404, `Фахівця не знайдено: ${params.slug}`);
	}

	/*
	 * Фестивалі розгортаються ТУТ, а не в розмітці, і не зберігаються у фахівця.
	 *
	 * Зв'язок уже записаний з боку фестивалю (`expertIds`, `coachIds`,
	 * `guestIds`), і другий його бік у реєстрі людей був би копією, яка
	 * розходиться: додав фахівця у фестиваль — мусиш не забути дописати фестиваль
	 * фахівцеві. Так уже зроблено для випускників і майстрів курсу.
	 *
	 * Роль зберігається разом із фестивалем, бо та сама людина буває експертом
	 * одного року й гостем іншого.
	 */
	const appearances = FESTIVALS.flatMap((festival) => {
		const role =
			festival.expertIds?.includes(expert.slug) ? 'experts'
			: festival.coachIds?.includes(expert.slug) ? 'coaches'
			: festival.guestIds?.includes(expert.slug) ? 'guests'
			: null;
		if (!role) return [];
		return [
			{
				slug: festival.slug,
				name: festival.name,
				nameEn: festival.nameEn,
				href: festivalPath(festival.slug),
				year: festival.years[0],
				role
			}
		];
	}).sort((a, b) => b.year - a.year);

	const words = detailWords(url.pathname);
	const seoDescription = joinDescription([
		expert.name,
		expert.city,
		appearances.length ? `${appearances.length} × ${words.festivalTail}` : undefined
	]);

	return { expert, appearances, seoTitle: expert.name, seoDescription };
};
