import { error, redirect } from '@sveltejs/kit';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import { PLAYS, getPlayById, playPath } from '$lib/data/plays';
import { castOf } from '$lib/data/playCast';
import { classifyPlayGroups, groupsOfPlay, namedGroupsOfPlay } from '$lib/data/groups';
import { FESTIVALS } from '$lib/data/festivals';
import mastersIndex from '$lib/data/masters.index.json';
import type { MasterIndexEntry } from '$lib/data/masters';

/**
 * Стара адреса вистави → нова. Наслідок злиття двійників.
 *
 * ## Звідки взялися двійники
 *
 * Той самий показ приходив у реєстр двічі — з репертуару майстра й із розкладу,
 * — і назва в них написана по-різному: «Отрывки из «классики»» проти «Уривки з
 * класики», «Blondie» проти «Blondi». Дві назви ставали двома адресами.
 * Заміряно нечітким пошуком: 30 кластерів схожих назв в одному році, і лише в
 * одному з них це справді два різних покази («Показ етюдів» 2024, номери 57 і
 * 58).
 *
 * Розпізнати їх можна за тим, що номер показу школи є рівно в ОДНОГО запису
 * пари: номер веде реєстр, розклад його не знає.
 *
 * ## Чому редирект, а не просто зникла сторінка
 *
 * Причини й ціна ті самі, що для перейменованих адрес випускників — повний
 * розбір у докблоці `RENAMED_ADDRESSES` у
 * `projects/galaxy-graduates/[address]/+page.ts`. Коротко: стара адреса не
 * пререндериться, її віддає `fallback: '404.html'`, а клієнтський роутер
 * виконує цей `load` і веде на нову. Мовний префікс зберігається.
 */
const RENAMED_PLAY_IDS: Record<string, string> = {
	// Записи-уривки, згорнуті у свій вечір: уривок не вистава, а номер програми.
	'chuchelo-2016': 'boikot-2016',
	'divchynka-z-vedmedykom-2025': 'uryvky-z-klasyky-2025',
	'hrikh-2012': 'uryvky-z-dramaturhii-20-stolittia-2012',
	'romeo-i-dzhulietta-2025': 'uryvky-z-klasyky-2025',
	'uryvky-z-klasyky-toi-shcho-otrymuie-liapasa-2012': 'uryvky-z-dramaturhii-20-stolittia-2012',
	'uryvky-z-klasyky-neznaiomka-o-bloka-2013': 'uryvky-z-klasyky-2013',
	'uryvky-z-klasyky-asia-i-turhenev-2014': 'uryvky-z-klasyky-2014',
	'uryvky-z-klasyky-unyzhennye-y-oskorblennye-2015': 'uryvky-z-klasyky-2015',

	// Двійники з двох джерел: репертуар майстра й розклад.
	'balahanchyk-bratev-hrymm-2019': 'balahanchyk-brativ-hrym-2019',
	'blondie-2020': 'blondi-2020',
	'chapaiev-i-vasylisa-2021': 'chapaiev-ta-vasylisa-2021',
	'hde-vse-2015': 'de-vsi-2015',
	'do-svydania-ovrah-2014': 'do-svydanyia-ovrah-2014',
	'feisbuchyk-2019': 'feis-bu-chik-2019',
	'foto-toplies-2018': 'foto-toples-2018',
	'iak-podruzhytysia-z-chakalkoiu-2023': 'iak-podruzhytys-z-chekalkoiu-2023',
	'skazka-ardennskoho-lesa-2017': 'kazka-ardenskoho-lisu-2017',
	'krestyky-nolyky-2008': 'khrestyky-nulyky-2008',
	'komnata-nevest-2008': 'kimnata-narechenoi-2008',
	'koralina-v-kriny-koshmariv-2020': 'koralina-v-kraini-koshmariv-2020',
	'natashy-2013': 'natashi-2013',
	'nikomu-ne-potribni-2023': 'nikomu-nepotribni-2023',
	'yzumrudnyi-horod-2007': 'smarahdove-misto-2007',
	'tin-2013': 'ten-2013',
	'v-poshukakh-natkhnennia-2021': 'u-poshukakh-natkhnennia-2021',
	'uryvky-z-klasyky-2023': 'uryvky-iz-klasyky-2023',
	'otryvky-yz-klassyky-2013': 'uryvky-z-klasyky-2013',
	'otryvky-yz-klassyky-2014': 'uryvky-z-klasyky-2014',
	'otryvky-yz-klassyky-2015': 'uryvky-z-klasyky-2015',
	'otryvky-yz-klassyky-2016': 'uryvky-z-klasyky-2016',
	'vse-lito-v-odyn-den-2020': 'use-lito-v-odyn-den-2020',
	'zona-turbulentnosty-2017': 'zona-turbulentnosti-2017',
};

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

	return { play, cast, groups, primaryGroups, supportingGroups, festivals, masters };
}
