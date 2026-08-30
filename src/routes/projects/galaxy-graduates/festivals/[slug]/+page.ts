import { error } from '@sveltejs/kit';
import { FESTIVALS, getFestivalBySlug } from '$lib/data/festivals';
import { GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
import { playsByIds } from '$lib/data/plays';
import mastersIndex from '$lib/data/masters.index.json';
import type { MasterIndexEntry } from '$lib/data/masters';

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

	/*
	 * Викладачі розгортаються з реєстру ТУТ, як і склад: сторінка має дістати
	 * готові дані, а не ходити в реєстр із розмітки. Ключ, якому нічого не
	 * відповідає, мовчки відкидається — про саме́ розходження кричить гейт.
	 */
	const masters = festival.masterIds
		.map((id) => (mastersIndex as MasterIndexEntry[]).find((m) => m.id === id))
		.filter((m) => m !== undefined);

	return { festival, members, masters, plays };
}
