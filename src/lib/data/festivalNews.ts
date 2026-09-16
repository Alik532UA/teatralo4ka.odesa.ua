/**
 * Новини, що розповідають про поїздку, — зріз, який рахується з самих новин.
 *
 * ## Звідки він береться
 *
 * Зв'язок «новина ↔ фестиваль» живе В ТЕКСТІ НОВИНИ: посилання на сторінку
 * поїздки. `scripts/build-festival-news.ts` повертає його другим боком і пише
 * `static/galaxy/festival-news.json`. Поля `newsIds` у реєстрі фестивалів
 * немає навмисно — воно було б другим місцем для того самого твердження й
 * розійшлося б із текстом тихо. Повний розбір — у докблоці скрипта.
 *
 * ## Чому `fetch` із `static/`, а не імпорт
 *
 * Розділ читає одна сторінка — сама поїздка. Імпорт поклав би назви всіх
 * новин усіх фестивалів у клієнтський бандл, де стеля рахується в сотнях
 * байтів. Та сама причина й той самий зразок, що в `festivalDetails`.
 */

export interface FestivalNewsItem {
	/** Адреса новини: `/news/<id>`. */
	id: string;
	/** ISO-дата, за нею ж зріз і впорядкований — від найновішої. */
	date: string;
	title: { uk: string; en: string };
}

export type FestivalNews = Record<string, FestivalNewsItem[]>;

/** Адреса зрізу в `static/`. Одна на проєкт — щоб не розійшлася з гейтом. */
export const FESTIVAL_NEWS_URL = '/galaxy/festival-news.json';

/**
 * Кеш на сеанс сторінки.
 *
 * Кешується САМА ОБІЦЯНКА, а не результат: два `load` можуть початися
 * одночасно (перехід і попереднє завантаження посилання), і на результаті вони
 * зробили б два запити. Те саме рішення, з тієї самої причини, що в
 * `festivalDetails`.
 */
let кеш: Promise<FestivalNews> | null = null;

/**
 * Зріз — із `static/`, через `fetch` із `load`.
 *
 * Помилка мережі не валить сторінку: поїздка без розділу новин — це те саме,
 * що поїздка, про яку новини ще не написали, і сторінка вже вміє це показати.
 */
export async function loadFestivalNews(fetchFn: typeof fetch): Promise<FestivalNews> {
	кеш ??= fetchFn(FESTIVAL_NEWS_URL)
		.then((response) => (response.ok ? (response.json() as Promise<FestivalNews>) : {}))
		.catch(() => ({}) as FestivalNews);
	return кеш;
}
