import type { Pathname } from '$app/types';
import festivalsData from './festivals.data.json';

export interface Festival {
	slug: string;
	name: string;
	nameEn?: string;
	/**
	 * Роки участі — СПИСОК, бо на фестиваль їздять не раз.
	 *
	 * «Мрій-Дім» — 2012 і 2013, і в анкеті це один рядок: «2012 та 2013 у
	 * Прилуках». Два записи замість одного дали б дві майже однакові сторінки й
	 * розділили б те, що для школи є однією історією.
	 */
	years: number[];
	/**
	 * Країни кодами ISO 3166-1 alpha-2, а не назвами.
	 *
	 * Назва країни залежить від мови сторінки, а код — ні. Прапорець теж
	 * рахується з коду (`flagOf`), тож таблиці прапорців у проєкті не існує:
	 * додана країна не вимагає нічого, крім двох рядків у словниках.
	 */
	countries: string[];
	/** Місто, коли воно й є місцем: «Прилуки». Немає поля — вистачає країни. */
	city?: string;
	/** Хто з випускників їздив — за СТІЙКИМ ключем, як і склад групи. */
	memberIds: string[];
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

/**
 * Прапорець із коду країни — арифметикою, а не таблицею.
 *
 * Літери коду переводяться в REGIONAL INDICATOR SYMBOL (U+1F1E6 — «A»), і пара
 * таких символів і є прапорцем. Тому нова країна не потребує жодного запису.
 *
 * Повертає порожній рядок на негодящому коді: прапорець — прикраса, і зламати
 * через нього сторінку було б непропорційно. Про сам негодящий код кричить
 * гейт, і кричить на збірці.
 */
export function flagOf(code: string): string {
	if (!/^[A-Z]{2}$/.test(code)) return '';
	return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

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
export function getFestivalsByMember(memberId: string): Festival[] {
	return FESTIVALS.filter((f) => f.memberIds.includes(memberId));
}

/** Найпізніший рік — за ним перелік упорядковується, новіші перші. */
export function latestYear(festival: Festival): number {
	return Math.max(...festival.years);
}

/** Шлях сторінки фестивалю БЕЗ мовного префікса — його додає `localizedPath`. */
export function festivalPath(slug: string): Pathname {
	return `/projects/galaxy-graduates/festivals/${slug}` as Pathname;
}
