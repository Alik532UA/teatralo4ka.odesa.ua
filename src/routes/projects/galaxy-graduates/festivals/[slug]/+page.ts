import { error, redirect } from '@sveltejs/kit';
import { detailWords, joinDescription } from '$lib/config/seoDetail';
import { FESTIVALS, getFestivalBySlug, festivalPath } from '$lib/data/festivals';
import { loadFestivalDetails } from '$lib/data/festivalDetails';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import { RENAMED_FESTIVAL_SLUGS } from '$lib/config/renamedAddresses';
import { LINKED_GRADUATES, rosterOrder, type GraduateIndexEntry } from '$lib/data/graduates';
import { playsByIds } from '$lib/data/plays';
import { EXPERTS, expertTitle } from '$lib/data/experts';
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

export async function load({ params, url, fetch }) {
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
		.sort((a, b) => rosterOrder(a) - rosterOrder(b));

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
	 * Випускники, що приїхали вже випускниками, — той самий реєстр, що в складу,
	 * і той самий порядок. Окремий розділ, бо це поділ самого автора; розбір — у
	 * полі `alumniIds` в `data/festivals`.
	 */
	const alumni: GraduateIndexEntry[] = (festival.alumniIds ?? [])
		.map((id) => LINKED_GRADUATES.find((g) => g.id === id))
		.filter((g): g is GraduateIndexEntry => Boolean(g))
		.sort((a, b) => rosterOrder(a) - rosterOrder(b));

	/*
	 * ПОСАДА БЕРЕТЬСЯ ЗА РОКОМ ФЕСТИВАЛЮ, а не з реєстру як є.
	 *
	 * У запрошених фахівців посада змінюється, і в наших даних це видно прямо:
	 * Станіслав Жирков 2018-го вів «Золоті ворота», а 2021-го — театр драми і
	 * комедії на лівому березі Дніпра. Сторінка фестивалю мусить назвати ту
	 * посаду, яка стояла в програмці ТОГО року, інакше вона перепише історію
	 * теперішнім днем. Розбір — у докблоці `data/experts`.
	 *
	 * Рік беремо перший зі списку: у фестивалю їх майже завжди один, а коли два —
	 * це той самий склад, і посада за ці два роки не встигає змінитися.
	 */
	const рік = festival.years[0];
	const фахівці = (ids: string[] | undefined) =>
		(ids ?? [])
			.map((slug) => EXPERTS.find((e) => e.slug === slug))
			.filter((e) => e !== undefined)
			.map((e) => ({ slug: e.slug, name: e.name, nameEn: e.nameEn, city: e.city, photo: e.photo, title: expertTitle(e, рік) }));

	const experts = фахівці(festival.expertIds);
	const coaches = фахівці(festival.coachIds);
	const guests = фахівці(festival.guestIds);

	/*
	 * Свої в Експертній Раді — з реєстру працівників, а не продубльовані серед
	 * зовнішніх. У Раді 2018 сидів Олег Шевчук, наш колишній педагог.
	 */
	const expertMasters = (festival.expertMasterIds ?? []).map(майстер).filter((m) => m !== undefined);

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
		festival.city ?? festival.note,
		words.festivalTail
	]);

	/*
	 * Подробиці приходять `fetch`ем із `static/` і ЗЛИВАЮТЬСЯ у сам фестиваль.
	 *
	 * Злиття тут, а не окреме поле `details`, — щоб розмітка лишилася такою, як
	 * була: `data.festival.bio`, `data.festival.photos` і решта читаються звідти
	 * ж, звідки й читалися. Винос у `static/` — рішення про ВАГУ БАНДЛА, і воно
	 * не мусить просочуватися в сторінку.
	 *
	 * Чому взагалі винесено — у докблоці `data/festivalDetails.ts`: п'ять полів
	 * важили 5.3 КБ і їхали до кожного відвідувача сайту, хоч потрібні лише тут.
	 */
	const деталі = await loadFestivalDetails(fetch);

	return {
		festival: { ...festival, ...(деталі[festival.slug] ?? {}) },
		members,
		memberMasters,
		alumni,
		masters,
		experts,
		expertMasters,
		coaches,
		guests,
		plays,
		seoDescription
	};
}
