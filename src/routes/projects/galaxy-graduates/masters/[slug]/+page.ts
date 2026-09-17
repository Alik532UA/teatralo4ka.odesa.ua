import { error, redirect } from '@sveltejs/kit';
import { EXPERTS, getExpertBySlug, expertPath } from '$lib/data/experts';
import { FESTIVALS, festivalPath } from '$lib/data/festivals';
import { INSTITUTIONS, institutionPath } from '$lib/data/institutions';
import { expertNewsKey, loadPersonNews } from '$lib/data/newsBacklinks';
import { LINKED_GRADUATES, rosterOrder, type GraduateIndexEntry } from '$lib/data/graduates';
import { detailWords, joinDescription } from '$lib/config/seoDetail';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import { RENAMED_EXPERT_SLUGS } from '$lib/config/renamedAddresses';
import type { Pathname } from '$app/types';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [
	...EXPERTS.filter((e) => !e.hidden).map((e) => ({ slug: e.slug })),
	...Object.keys(RENAMED_EXPERT_SLUGS).map((slug) => ({ slug }))
];

export const load: PageLoad = async ({ params, url, fetch }) => {
	const renamedTo = RENAMED_EXPERT_SLUGS[params.slug];
	if (renamedTo) {
		redirect(301, localizedPath(expertPath(renamedTo), localeFromPath(url.pathname)));
	}

	const expert = getExpertBySlug(params.slug);
	if (!expert || expert.hidden) {
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

	/*
	 * СТУДЕНТИ Й ЗАКЛАДИ — з боку закладу, і знову не другим полем у фахівця.
	 *
	 * `masterSlug` лежить У СТУДЕНТА (`institutions.data.json`), а не в курсі:
	 * на одному потоці бувають різні майстри, і курс як спільний запис цього не
	 * вміщає. Тому обидва зрізи рахуються перебором — сімнадцять майстрів на
	 * весь реєстр, ціна нульова, а другого місця для того самого твердження не
	 * з'являється.
	 *
	 * Зв'язок доти був ОДНОБІЧНИЙ: зі сторінки випускника було видно майстра
	 * курсу, а зі сторінки майстра — нікого. Тобто граф галактики мав ребро,
	 * яким можна пройти лише в один бік.
	 */
	const студенти: { institution: string; graduate: GraduateIndexEntry }[] = [];
	/* `href` саме `Pathname`, а не `string`: `localizedPath` приймає лише
	   перевірений тип адреси, і широка анотація ламала збірку в `svelte-check`
	   (юніт-гейти цього не бачать — вони не типізують розмітку). */
	const заклади: { slug: string; name: string; href: Pathname }[] = [];
	for (const заклад of INSTITUTIONS) {
		let свій = false;
		for (const s of заклад.students) {
			if (s.masterSlug !== expert.slug) continue;
			свій = true;
			const g = LINKED_GRADUATES.find((x) => x.id === s.id);
			if (g) студенти.push({ institution: заклад.slug, graduate: g });
		}
		if (свій)
			заклади.push({ slug: заклад.slug, name: заклад.name, href: institutionPath(заклад.slug) });
	}
	/* Той самий порядок, що в переліках галактики: спершу з обличчями. */
	студенти.sort((a, b) => rosterOrder(a.graduate) - rosterOrder(b.graduate));

	/*
	 * Новини беруться зрізом і ФІЛЬТРУЮТЬСЯ тут, а не в розмітці: інакше в дані
	 * кожної з тридцяти семи сторінок поїхав би весь файл (11.7 КБ) заради
	 * кількох рядків. Те саме рішення й той самий виклик — на сторінці поїздки.
	 */
	const новини = (await loadPersonNews(fetch))[expertNewsKey(expert.slug)] ?? [];

	const words = detailWords(url.pathname);
	const seoDescription = joinDescription([
		expert.name,
		expert.city,
		appearances.length ? `${appearances.length} × ${words.festivalTail}` : undefined
	]);

	return {
		expert,
		appearances,
		students: студенти.map((x) => x.graduate),
		news: новини,
		institutions: заклади,
		seoTitle: expert.name,
		seoDescription
	};
};
