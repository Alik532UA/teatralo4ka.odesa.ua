import { error, redirect } from '@sveltejs/kit';
import { detailWords, joinDescription } from '$lib/config/seoDetail';
import { FESTIVALS, getFestivalBySlug, festivalPath } from '$lib/data/festivals';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import { RENAMED_FESTIVAL_SLUGS } from '$lib/config/renamedAddresses';
import { LINKED_GRADUATES, kindOrder, type GraduateIndexEntry } from '$lib/data/graduates';
import { playsByIds } from '$lib/data/plays';
import mastersIndex from '$lib/data/masters.index.json';
import type { MasterIndexEntry } from '$lib/data/masters';

export const prerender = true;


/*
 * Разом із чинними — СТАРІ адреси, перейменовані. Без них стара адреса не
 * пререндериться, і людина за посиланням із мережі бачить «Сторінку не
 * знайдено» замість перенаправлення. Розбір і замір — у
 * `config/renamedAddresses.ts`.
 */
export function entries() {
	return [
		...FESTIVALS.map((festival) => ({ slug: festival.slug })),
		...Object.keys(RENAMED_FESTIVAL_SLUGS).map((slug) => ({ slug }))
	];
}

export async function load({ params, url }) {
	const renamedTo = RENAMED_FESTIVAL_SLUGS[params.slug];
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
		.map((id) => LINKED_GRADUATES.find((g) => g.id === id))
		.filter((g): g is GraduateIndexEntry => Boolean(g))
		.sort((a, b) => kindOrder(a) - kindOrder(b));

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
	const майстер = (id: string) => (mastersIndex as MasterIndexEntry[]).find((m) => m.id === id);

	const masters = festival.masterIds.map(майстер).filter((m) => m !== undefined);

	/*
	 * Працівники, які поїхали УЧАСНИКАМИ, а не керівниками. Розділ сторінки в
	 * них той самий, що у випускників, — різниться лише реєстр, з якого
	 * розгортається картка. Чому окремим полем, а не ключами в `memberIds`, —
	 * у докблоці `data/festivals`.
	 */
	const memberMasters = (festival.memberMasterIds ?? []).map(майстер).filter((m) => m !== undefined);

	/*
	 * Опис для прев'ю — ТУТ, а не в `<svelte:head>` сторінки: у `og:description`
	 * доходить лише те, що завантажувач поклав у `seoDescription`. Подробиці й
	 * замір — у докблоці `config/seoDetail.ts`.
	 *
	 * Країн у тексті немає навмисно: їхні назви живуть у словниках
	 * (`galaxy.country.*`), а `$t` у `load` недосяжний.
	 */
	const words = detailWords(url.pathname);
	const назва = localeFromPath(url.pathname) === 'en' && festival.nameEn ? festival.nameEn : festival.name;
	const роки = [...festival.years].sort((a, b) => a - b).join(', ');
	const seoDescription = joinDescription([
		`«${назва}», ${роки}`,
		festival.city,
		words.festivalTail
	]);

	return { festival, members, memberMasters, masters, plays, seoDescription };
}
