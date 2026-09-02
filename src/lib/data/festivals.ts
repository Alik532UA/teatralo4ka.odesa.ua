import type { Pathname } from '$app/types';
import type { VerificationStatusProp } from './groups';
import festivalsData from './festivals.data.json';

export interface Festival {
	slug: string;
	name: string;
	nameEn?: string;
	verificationStatus?: VerificationStatusProp;
	/**
	 * Роки участі — СПИСОК, хоча зазвичай у ньому один рік.
	 *
	 * Кожна поїздка — окремий запис, і це рішення з даних: «Мрій-Дім» їздили
	 * 2012-го і 2013-го РІЗНИМ складом. Спершу тут стояв один запис на два роки —
	 * так це записано в анкеті, — але тоді сторінка звела б у купу дві різні
	 * групи людей і сказала б неправду про обидві.
	 *
	 * Список лишається на випадок, коли поїздка справді одна, а тривала два роки
	 * поспіль тим самим складом. Назва тоді не розрізняє записи, тож пару
	 * «назва + рік» стереже гейт.
	 */
	years: number[];
	/**
	 * Країни кодами ISO 3166-1 alpha-2, а не назвами.
	 *
	 * Назва країни залежить від мови сторінки, а код — ні. За тим самим кодом
	 * малює прапор `CountryFlag` — інлайновим SVG, бо в системних шрифтах
	 * Windows прапорців немає й емодзі 🇺🇦 показувалося б як «UA».
	 */
	countries: string[];
	/** Місто, коли воно й є місцем: «Прилуки». Немає поля — вистачає країни. */
	city?: string;
	/** Хто з випускників їздив — за СТІЙКИМ ключем, як і склад групи. */
	memberIds: string[];
	/**
	 * Хто з працівників школи їздив — за `id` реєстру майстрів.
	 *
	 * Тільки ключі: ім'я живе в самому реєстрі, і копія тут розійшлася б із ним
	 * при першому ж виправленні. Так само вже зроблено на ребрах випускників.
	 */
	masterIds: string[];
	/** Вистави, показані на фестивалі, — посилання на реєстр, а не копії назв. */
	playIds: string[];
	bio?: string[];
	photos?: string[];
}

/*
 * Реєстр у JSON, а не масивом у коді, — з тієї самої причини, що й групи: він
 * росте з кожним фестивалем, а `structure.test.ts` рахує рядки коду, не даних.
 *
 * `satisfies`, а не приведення: форму звіряє компілятор на збірці й нічого не
 * важить у бандлі. Цілісність — що кожен `memberId` існує, що `playId`
 * знаходиться, що код країни справжній — тримає `festivals.test.ts`.
 */
export const FESTIVALS: readonly Festival[] = festivalsData satisfies readonly Festival[];

/** Фестиваль за адресою. */
export function getFestivalBySlug(slug: string): Festival | undefined {
	return FESTIVALS.find((f) => f.slug === slug);
}

/**
 * Фестивалі, на яких був цей випускник, — УСІ, а не перший.
 *
 * Так само, як із групами: людина їздила не раз, і котра з поїздок «головна»,
 * дані не кажуть.
 */
/**
 * Новіші згори.
 *
 * Порядок у реєстрі — від найдавнішого, бо так його й вносили. Доти обидва ці
 * переліки віддавали саме його, а сторінка-перелік фестивалів сортувала сама, і
 * та сама людина бачила поїздки в різному порядку залежно від того, звідки
 * дивиться. Сортування ТУТ, а не в показі: порядок — властивість відповіді на
 * питання «на яких фестивалях ця людина була», а не одного місця показу.
 *
 * Тай-брейк назвою — щоб дві поїздки того самого року не мінялися місцями між
 * збірками (у реєстрі є два «Мрій-Дім» поспіль).
 */
function newestFirst(list: Festival[]): Festival[] {
	return [...list].sort((a, b) => latestYear(b) - latestYear(a) || a.name.localeCompare(b.name, 'uk'));
}

export function getFestivalsByMember(memberId: string): Festival[] {
	return newestFirst(FESTIVALS.filter((f) => f.memberIds.includes(memberId)));
}

/**
 * Фестивалі, на які їздив цей ПРАЦІВНИК.
 *
 * Окремою функцією, а не тим самим `getFestivalsByMember` з іншим ключем:
 * `memberIds` і `masterIds` — два різні поля, і людина в них означає різне.
 * Випускник у складі й викладач, що вів групу, обидва «були на фестивалі», але
 * шукати їх треба в різних списках; спроба зіставити одним полем знайшла б
 * викладача лише тоді, коли він ще й випускник цієї школи.
 *
 * Заміряно на реєстрі: у чотирьох фестивалях `masterIds` заповнені в усіх
 * чотирьох (по 2–5 людей), а в `memberIds` жоден із цих п'ятьох викладачів не
 * значиться.
 */
export function getFestivalsByMaster(masterId: string): Festival[] {
	return newestFirst(FESTIVALS.filter((f) => f.masterIds.includes(masterId)));
}

/** Найпізніший рік — за ним перелік упорядковується, новіші перші. */
export function latestYear(festival: Festival): number {
	return Math.max(...festival.years);
}

/** Шлях сторінки фестивалю БЕЗ мовного префікса — його додає `localizedPath`. */
export function festivalPath(slug: string): Pathname {
	return `/projects/galaxy-graduates/festivals/${slug}` as Pathname;
}
