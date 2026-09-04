import { error } from '@sveltejs/kit';
import { detailWords, joinDescription } from '$lib/config/seoDetail';
import { INSTITUTIONS, getInstitutionBySlug, institutionSize } from '$lib/data/institutions';
import { localeFromPath } from '$lib/i18n/routing';
import { LINKED_GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
import type { InstitutionStudent } from '$lib/data/institutions';

export const prerender = true;

export function entries() {
	return INSTITUTIONS.map((institution) => ({ slug: institution.slug }));
}

export function load({ params, url }) {
	const institution = getInstitutionBySlug(params.slug);
	if (!institution) {
		error(404, `Навчальний заклад не знайдено: ${params.slug}`);
	}

	/*
	 * Пошук за `id`, а не за адресою — те саме правило й та сама причина, що на
	 * сторінці фестивалю: адресу випускника законно виправляють, і пошук за нею
	 * тихо губив би людину зі списку, лишаючи гейт зеленим.
	 *
	 * Порядок задає РЕЄСТР, а не абетка: у джерелі студенти стоять так, як їх
	 * перелічила школа, і цей порядок сам собою осмислений — спершу ті, кого
	 * назвали першими.
	 */
	const students: { graduate: GraduateIndexEntry; student: InstitutionStudent }[] = [];
	for (const student of institution.students) {
		const graduate = LINKED_GRADUATES.find((g) => g.id === student.id);
		if (graduate) students.push({ graduate, student });
	}

	/*
	 * Опис для прев'ю — ТУТ, а не в `<svelte:head>`: у `og:description` доходить
	 * лише те, що завантажувач поклав у `seoDescription`. Розбір — у докблоці
	 * `config/seoDetail.ts`.
	 *
	 * Країн у тексті немає навмисно, як і в фестивалю: їхні назви живуть у
	 * словниках (`galaxy.country.*`), а `$t` у `load` недосяжний.
	 */
	const words = detailWords(url.pathname);
	const назва =
		localeFromPath(url.pathname) === 'en' && institution.nameEn
			? institution.nameEn
			: institution.name;
	const роки = [
		...new Set(
			[
				...institution.students.map((s) => s.year),
				...(institution.unlistedStudents ?? []).map((s) => s.year)
			].filter((year): year is number => typeof year === 'number')
		)
	].sort((a, b) => a - b);
	const seoDescription = joinDescription([
		`${назва}${підписРоку(роки)}`,
		institution.city,
		words.institutionTail
	]);

	return { institution, students, seoDescription, total: institutionSize(institution) };
}

/** «, вступ 2026» або «, вступ 2024–2026». Порожньо — років ще немає. */
function підписРоку(роки: number[]): string {
	if (роки.length === 0) return '';
	const перший = роки[0];
	const останній = роки[роки.length - 1];
	return перший === останній ? `, вступ ${перший}` : `, вступ ${перший}–${останній}`;
}
