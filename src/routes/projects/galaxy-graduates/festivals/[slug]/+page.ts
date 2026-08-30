import { error } from '@sveltejs/kit';
import { FESTIVALS, getFestivalBySlug } from '$lib/data/festivals';
import { GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
import { playsByIds } from '$lib/data/plays';

export const prerender = true;

export function entries() {
	return FESTIVALS.map((festival) => ({ slug: festival.slug }));
}

export async function load({ params }) {
	const festival = getFestivalBySlug(params.slug);
	if (!festival) {
		error(404, `Фестиваль не знайдено: ${params.slug}`);
	}

	/*
	 * Пошук за `id`, а не за адресою.
	 *
	 * Адресу законно виправляють — за одну сесію п'ятьох випускників привели до
	 * порядку «ім'я-прізвище», — і пошук за нею тихо губив би учасника: гейт
	 * лишався б зеленим, бо він звіряє саме `id`, а сторінка показувала б менше
	 * людей, ніж є в даних.
	 */
	const members: GraduateIndexEntry[] = festival.memberIds
		.map((id) => GRADUATES.find((g) => g.id === id))
		.filter((g): g is GraduateIndexEntry => Boolean(g));

	/*
	 * Показ розгортається з ключів ТУТ, а не в розмітці: сторінка має дістати
	 * готові дані. Ключі, яким нічого не відповідає, `playsByIds` мовчки
	 * відкидає — про саме́ розходження кричить гейт, і кричить на збірці.
	 */
	const plays = playsByIds(festival.playIds);

	return { festival, members, plays };
}
