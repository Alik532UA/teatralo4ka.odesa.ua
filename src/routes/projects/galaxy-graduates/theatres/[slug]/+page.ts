import { error } from '@sveltejs/kit';
import { detailWords, joinDescription } from '$lib/config/seoDetail';
import { THEATRES, getTheatreBySlug, theatreSize } from '$lib/data/theatres';
import { localeFromPath } from '$lib/i18n/routing';
import { LINKED_GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
import type { TheatreMember } from '$lib/data/theatres';

export const prerender = true;

export function entries() {
	return THEATRES.map((theatre) => ({ slug: theatre.slug }));
}

export function load({ params, url }) {
	const theatre = getTheatreBySlug(params.slug);
	if (!theatre) {
		error(404, `Театр не знайдено: ${params.slug}`);
	}

	/*
	 * Пошук за `id`, а не за адресою — те саме правило й та сама причина, що на
	 * сторінках фестивалю та навчального закладу: адресу випускника законно
	 * виправляють, і пошук за нею тихо губив би людину зі списку, лишаючи гейт
	 * зеленим.
	 */
	const members: { graduate: GraduateIndexEntry; member: TheatreMember }[] = [];
	for (const member of theatre.members) {
		const graduate = LINKED_GRADUATES.find((g) => g.id === member.id);
		if (graduate) members.push({ graduate, member });
	}

	/*
	 * Опис для прев'ю — ТУТ, а не в `<svelte:head>`: у `og:description` доходить
	 * лише те, що завантажувач поклав у `seoDescription`. Розбір — у докблоці
	 * `config/seoDetail.ts`.
	 */
	const words = detailWords(url.pathname);
	const назва =
		localeFromPath(url.pathname) === 'en' && theatre.nameEn ? theatre.nameEn : theatre.name;
	const seoDescription = joinDescription([назва, theatre.city, words.theatreTail]);

	return { theatre, members, seoDescription, total: theatreSize(theatre) };
}
