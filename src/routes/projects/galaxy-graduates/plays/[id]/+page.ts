import { error, redirect } from '@sveltejs/kit';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import { RENAMED_PLAY_IDS } from '$lib/config/renamedAddresses';
import { detailWords, joinDescription } from '$lib/config/seoDetail';
import { PLAYS, getPlayById, playPath } from '$lib/data/plays';
import { castOf } from '$lib/data/playCast';
import { classifyPlayGroups, groupsOfPlay, namedGroupsOfPlay } from '$lib/data/groups';
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
	return [
		...PLAYS.map((play) => ({ id: play.id })),
		/*
		 * Разом із чинними — СТАРІ адреси, перейменовані. Без них стара адреса не
		 * пререндериться, і людина за посиланням із мережі бачить «Сторінку не
		 * знайдено» замість перенаправлення. Замір — у
		 * `config/renamedAddresses.ts`.
		 */
		...Object.keys(RENAMED_PLAY_IDS).map((id) => ({ id }))
	];
}

export function load({ params, url }) {
	const renamedTo = RENAMED_PLAY_IDS[params.id];
	if (renamedTo) {
		redirect(301, localizedPath(playPath(renamedTo), localeFromPath(url.pathname)));
	}

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
	 * Групи, у чиєму репертуарі вистава числиться.
	 *
	 * Визначаються єдиною канонічною функцією `classifyPlayGroups` за складом:
	 * основні (>= 50% або найбільша частка) та допоміжні (>= 3 учасники).
	 */
	const classified = classifyPlayGroups(
		play.id,
		cast.map((c) => c.graduate.id)
	);

	/*
	 * Курс із ПАПЕРА школи головніший за підрахунок складу.
	 *
	 * Підрахунок помиляється саме там, де в показі грали гості: «Уривки з
	 * драматургії 20 століття» 2012 були показом курсу «Фреш», а в складі — три
	 * «хлопці-легіонери» із ЗТК проти однієї людини з Фреша, і основним курсом
	 * оголошувався ЗТК.
	 *
	 * Підрахунок не викидається: курси, які він знайшов і яких папір не назвав,
	 * стають «за участі» — для того самого показу це правда, легіонери справді
	 * прийшли із ЗТК.
	 */
	const named = namedGroupsOfPlay(play);
	const primaryGroups = named.length > 0 ? named : classified.primaryGroups;

	/*
	 * ПОСВЯТА НЕ НАЛЕЖИТЬ РЕПЕРТУАРУ ЖОДНОЇ ГРУПИ — і це не оформлення, а факт.
	 *
	 * Її для учнів готують випускники, і приходять вони з різних років і різних
	 * груп. Титри «Енеїди» 2022: випускники 2005, 2012, 2018, 2018, 2020 і 2022
	 * років. Підрахунок за складом бачив у цьому «основну групу» й підписував її
	 * «У репертуарі груп» — тобто оголошував захід частиною історії курсу, який
	 * його не ставив. Заміряно: «Енеїда» числилася за «Шевчужками», а
	 * «Театральне королівство» — за «Карандашами», обидва рядки прибрано з
	 * `groups.data.json` разом із цією правкою.
	 *
	 * `new-year` тут навмисно НЕ згадано: новорічний показ за традицією готують
	 * групи, які цього року випускаються, тож для нього репертуар — правда.
	 *
	 * Порожні переліки, а не окремий підпис: секція малюється лише за
	 * непорожнього переліку, тож сторінка просто не показує того, чого не знає.
	 * Групи учасників однаково видні — кожна картка складу веде в анкету.
	 */
	const репертуарГруп = play.kind !== 'posviata';

	/*
	 * У «за участі» падає ВСЕ інше, що зв'язане з показом, — включно з
	 * репертуарами груп (`groupsOfPlay`). Інакше сторінка показу мовчала б про
	 * групу, чия сторінка цей показ уже показує: саме через таку однобічність
	 * «Уривки з драматургії» й розійшлися з Фрешем. Гейт `симетрія «вистава ↔
	 * група»` тримає обидва боки разом.
	 */
	const supportingGroups = [
		...groupsOfPlay(play),
		...classified.primaryGroups,
		...classified.supportingGroups
	].filter(
		(g, i, all) =>
			!primaryGroups.some((p) => p.slug === g.slug) &&
			all.findIndex((x) => x.slug === g.slug) === i
	);
	const groups = [...primaryGroups, ...supportingGroups];

	/** Фестивалі, де виставу возили. Те саме застереження, що й з групами. */
	const festivals = FESTIVALS.filter((festival) => festival.playIds.includes(play.id));

	/** Майстри, у чиїх профілях вистава значиться, — розгорнуті з реєстру. */
	const masters = (play.masters ?? [])
		.map((id) => (mastersIndex as MasterIndexEntry[]).find((m) => m.id === id))
		.filter((m) => m !== undefined);

	/*
	 * Працівники школи, які в показі ГРАЛИ, — розгортаються ТУТ, а не в блоці
	 * «Хто грав».
	 *
	 * Причина та сама, що для складу груп: реєстр читає завантажувач, а розмітка
	 * дістає готові записи. Ще й `mastersIndex` уже імпортований цим модулем
	 * заради `masters` вище, тож розгортання тут не додає в бандл нічого.
	 *
	 * Запис без відповідника в реєстрі мовчки відкидається — але такого бути не
	 * може: `id` звіряє гейт `plays.test.ts` на збірці, тобто про розрив кричить
	 * він, а не порожня картка на сторінці.
	 */
	const staff = (play.staff ?? [])
		.map((entry) => {
			const master = (mastersIndex as MasterIndexEntry[]).find((m) => m.id === entry.id);
			return master ? { master, roles: entry.roles } : undefined;
		})
		.filter((entry) => entry !== undefined);

	/*
	 * Опис для прев'ю — ТУТ, а не в `<svelte:head>`: у `og:description` доходить
	 * лише `seoDescription`. Розбір — у докблоці `config/seoDetail.ts`.
	 *
	 * Складу в описі НЕМА навмисно: він росте від кожної нової анкети, а
	 * соцмережі кешують прев'ю надовго — той самий висновок і з тієї самої
	 * причини вже записаний у докблоці опису анкети випускника.
	 */
	const words = detailWords(url.pathname);
	/*
	 * Автор ОБРІЗАЄТЬСЯ: у вечорів із номерів це перелік усіх творів — в «Уривках
	 * з класики» 2015 він на дев'ять назв і триста символів. Прев'ю однаково
	 * покаже перші рядки, тож без обрізання хвіст опису не побачив би ніхто.
	 */
	const автор =
		play.author && play.author.length > 90 ? `${play.author.slice(0, 90).trimEnd()}…` : play.author;
	const seoDescription = joinDescription([`${play.title}, ${play.year}`, автор, words.playTail]);

	return {
		play,
		cast,
		staff,
		groups: репертуарГруп ? groups : [],
		primaryGroups: репертуарГруп ? primaryGroups : [],
		supportingGroups: репертуарГруп ? supportingGroups : [],
		festivals,
		masters,
		seoDescription
	};
}
