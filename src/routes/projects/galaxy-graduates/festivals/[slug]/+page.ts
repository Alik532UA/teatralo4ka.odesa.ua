import { error, redirect } from '@sveltejs/kit';
import { FESTIVALS, getFestivalBySlug, festivalPath } from '$lib/data/festivals';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import { GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
import { playsByIds } from '$lib/data/plays';
import mastersIndex from '$lib/data/masters.index.json';
import type { MasterIndexEntry } from '$lib/data/masters';

export const prerender = true;

export function entries() {
	return FESTIVALS.map((festival) => ({ slug: festival.slug }));
}

/**
 * Адреси, які змінилися вже після виходу сторінки в прод.
 *
 * Той самий прийом, що в сторінок майстрів: стара адреса НЕ пререндериться —
 * її віддає `fallback: '404.html'`, клієнтський роутер виконує цей `load`,
 * бачить стару назву й веде на нову. Ціна відома й прийнята: у статиці стара
 * адреса лишається кодом 404, тобто краулер без JS редиректу не побачить.
 *
 * `slavianskyi-venok` була транслітерацією з РОСІЙСЬКОЇ назви («Славянский
 * венок»), тоді як сама назва українська. Адреса прожила в проді менш ніж
 * добу, але вона встигла потрапити в sitemap, тож просто зникнути не може.
 */
const RENAMED_SLUGS: Record<string, string> = {
	'slavianskyi-venok': 'slovianskyi-vinok'
};

export async function load({ params, url }) {
	const renamedTo = RENAMED_SLUGS[params.slug];
	if (renamedTo) {
		redirect(301, localizedPath(festivalPath(renamedTo), localeFromPath(url.pathname)));
	}

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
