import { error } from '@sveltejs/kit';
import { GROUPS, getGroupBySlug,
	playIdsOfGroup
} from '$lib/data/groups';
import { GRADUATES, type GraduateIndexEntry } from '$lib/data/graduates';
import mastersIndex from '$lib/data/masters.index.json';
import { playsByIds } from '$lib/data/plays';
import type { MasterIndexEntry } from '$lib/data/masters';

export const prerender = true;

export function entries() {
	return GROUPS.map((group) => ({ slug: group.slug }));
}

export async function load({ params }) {
	const group = getGroupBySlug(params.slug);
	if (!group) {
		error(404, `Групу не знайдено: ${params.slug}`);
	}

	/*
	 * Ім'я для картки — `displayName` («Тетяна ІСАЧКІНА»), а не `fullName`
	 * («Ісачкіна Тетяна Валеріївна»).
	 *
	 * Перше — те, як людину називають; друге — те, як її записують у документі.
	 * На сторінці групи поруч стоять випускники, підписані іменем і прізвищем,
	 * і ПІБ серед них читався як рядок із відомості. Так само підписані
	 * викладачі всюди в галактиці й у розділі резидентів.
	 *
	 * Обидві мови віддаються тут, а вибір робить сторінка: мова живе в
	 * `$locale`, а завантажувач пререндериться один раз.
	 */
	const masters: (
		| MasterIndexEntry
		| {
				id: string;
				slug: string;
				/** ПІБ лишається — його бере опис сторінки для пошуковиків. */
				fullName: string;
				displayName: string;
				displayNameEn: string;
				photo?: string;
				departments?: string[];
		  }
	)[] = group.masters.map((m) => {
		const found = (mastersIndex as MasterIndexEntry[]).find(
			(candidate) => candidate.id === m.id || candidate.slug === m.id
		);
		if (found) return found;
		return {
			id: m.id,
			slug: m.id,
			fullName: m.name,
			displayName: m.name,
			displayNameEn: m.name,
			departments: m.department ? [m.department] : []
		};
	});

	// Викладачі курсу — той самий пошук у реєстрі, що й для майстрів, але з
	// предметом: саме він відрізняє викладача від майстра на картці.
	const teachers = (group.teachers ?? []).map((teacher) => {
		const found = (mastersIndex as MasterIndexEntry[]).find(
			(candidate) => candidate.id === teacher.id || candidate.slug === teacher.id
		);
		return {
			id: teacher.id,
			slug: found?.slug ?? teacher.id,
			displayName: found?.displayName ?? teacher.name,
			displayNameEn: found?.displayNameEn ?? teacher.name,
			photo: found?.photo,
			subject: teacher.subject
		};
	});

	/*
	 * Пошук за `id`, а не за адресою.
	 *
	 * `memberIds` — саме ключі, і гейт груп звіряє їх із `g.id`. Пошук же йшов за
	 * `slug`/`code` і працював лише збігом: сьогодні в жодного випускника вони не
	 * розходяться. Першого ж виправлення адреси — а таких за одну сесію було
	 * п'ять — вистачило б, щоб людина зникла зі складу, а гейт лишився зеленим.
	 */
	const members: GraduateIndexEntry[] = group.memberIds
		.map((id) => GRADUATES.find((g) => g.id === id))
		.filter((g): g is GraduateIndexEntry => Boolean(g));

	/*
	 * Репертуар розгортається з ключів ТУТ, а не в компоненті: сторінка має
	 * дістати готові дані, а не ходити в реєстр із розмітки. Ключі, яким нічого
	 * не відповідає, `playsByIds` мовчки відкидає — про саме́ розходження кричить
	 * гейт, і кричить на збірці.
	 */
	// Репертуар — з ОБОХ джерел: див. докблок `playIdsOfGroup`.
	const plays = playsByIds(playIdsOfGroup(group.slug));

	/*
	 * Частини злитої групи розгортаються тут же. Порожні відкидаються: частина
	 * без жодної вистави дала б на сторінці заголовок над нічим.
	 */
	const parts = (group.parts ?? [])
		.map((part) => ({ name: part.name, plays: playsByIds(part.playIds) }))
		.filter((part) => part.plays.length > 0);

	return {
		parts,
		group,
		masters,
		teachers,
		members,
		plays
	};
}
