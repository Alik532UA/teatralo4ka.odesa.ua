import { error } from '@sveltejs/kit';
import { PLAYS, getPlayById } from '$lib/data/plays';
import { castOf } from '$lib/data/playCast';
import { GROUPS } from '$lib/data/groups';
import { FESTIVALS } from '$lib/data/festivals';
import mastersIndex from '$lib/data/masters.index.json';
import type { MasterIndexEntry } from '$lib/data/masters';

export const prerender = true;

/**
 * Сторінка є в КОЖНОЇ вистави реєстру, навіть якщо про неї відомий сам лише
 * рік.
 *
 * Спокуса зробити сторінки тільки «наповненим» велика: 89 вистав із 363 не
 * назвав своєю ніхто. Але поріг довелося б знати ще й тому, хто малює
 * посилання: список вистав випускника не має способу спитати «а чи є сторінка
 * в цієї». Посилання, що веде в 404, гірше за скупу сторінку — а скупа тут не
 * порожня: назва, рік і те, у чиєму репертуарі вистава числиться, є завжди.
 */
export function entries() {
	return PLAYS.map((play) => ({ id: play.id }));
}

export function load({ params }) {
	const play = getPlayById(params.id);
	if (!play) {
		error(404, `Виставу не знайдено: ${params.id}`);
	}

	/*
	 * Склад — ТІЛЬКИ з анкет. Добуток «учасники групи × вистави групи» дав би
	 * більше імен і частину з них — хибних: людина могла прийти в групу вже
	 * після цієї вистави. Заміри в докблоці `plays.ts`.
	 */
	const cast = castOf(play.id);

	/*
	 * Групи, у чиєму репертуарі вистава числиться. Це НЕ склад і показується
	 * окремо від нього: репертуар групи каже, що вистава належить її історії, а
	 * не що в ній грали всі її учасники.
	 */
	const groups = GROUPS.filter((group) => group.playIds.includes(play.id));

	/** Фестивалі, де виставу возили. Те саме застереження, що й з групами. */
	const festivals = FESTIVALS.filter((festival) => festival.playIds.includes(play.id));

	/** Майстри, у чиїх профілях вистава значиться, — розгорнуті з реєстру. */
	const masters = (play.masters ?? [])
		.map((id) => (mastersIndex as MasterIndexEntry[]).find((m) => m.id === id))
		.filter((m) => m !== undefined);

	return { play, cast, groups, festivals, masters };
}
