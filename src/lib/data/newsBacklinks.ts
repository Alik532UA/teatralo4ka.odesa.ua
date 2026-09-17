/**
 * Новини, що згадують поїздку або людину, — зрізи, які рахуються з самих новин.
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

/** Ключ — адреса фестивалю. */
export type FestivalNews = Record<string, FestivalNewsItem[]>;
/**
 * Ключ — рід людини й стійка мітка в межах цього роду.
 *
 * Для випускника мітка — `id`, а НЕ адреса: адресу законно виправляють («п'ятьох
 * випускників привели до порядку ім'я-прізвище»), а `id` не міняється ніколи;
 * зріз, ключований адресою, тихо осиротів би на першому ж перейменуванні.
 * Перекладає адресу в `id` сам скрипт, поки читає тексти.
 *
 * Рід у ключі з'явився, коли зріз перестав бути лише про випускників: у ньому
 * тепер живуть ще фахівці й викладачі, а `id` випускника, `slug` фахівця та
 * `slug` викладача — три незалежні набори. Ніщо не забороняє їм колись
 * збігтися, і збіг означав би чужі новини на чужій сторінці.
 */
export type PersonNews = Record<string, FestivalNewsItem[]>;

/**
 * Ключі зрізу — ОДНА реалізація на обидва боки.
 *
 * Їх пише `scripts/build-news-backlinks.ts` і читають сторінки; якби форма
 * ключа була записана двічі, розійтися вона могла б тихо — сторінка просто
 * нічого не знайшла б і показала б «новин немає». Тому скрипт імпортує саме
 * ці функції, а не повторює рядок.
 */
export const graduateNewsKey = (id: string) => `graduate:${id}`;
export const expertNewsKey = (slug: string) => `expert:${slug}`;
export const masterNewsKey = (slug: string) => `master:${slug}`;

/** Адреси зрізів у `static/`. По одній на проєкт — щоб не розійшлися з гейтом. */
export const FESTIVAL_NEWS_URL = '/galaxy/festival-news.json';
export const PERSON_NEWS_URL = '/galaxy/person-news.json';

/**
 * Кеш на сеанс сторінки.
 *
 * Кешується САМА ОБІЦЯНКА, а не результат: два `load` можуть початися
 * одночасно (перехід і попереднє завантаження посилання), і на результаті вони
 * зробили б два запити. Те саме рішення, з тієї самої причини, що в
 * `festivalDetails`.
 */
let кеш: Promise<FestivalNews> | null = null;
let кешЛюдей: Promise<PersonNews> | null = null;

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

/**
 * Те саме для людей — і читає його не `load`, а САМА картка випускника.
 *
 * Причина в тому, що картка живе у двох місцях: як сторінка з `load` і як
 * вікно поверх галактики, де жодного `load` немає. Проп із завантажувача був
 * би порожній рівно в половині випадків, тож зріз бере той, кому він потрібен.
 */
export async function loadPersonNews(fetchFn: typeof fetch = fetch): Promise<PersonNews> {
	кешЛюдей ??= fetchFn(PERSON_NEWS_URL)
		.then((response) => (response.ok ? (response.json() as Promise<PersonNews>) : {}))
		.catch(() => ({}) as PersonNews);
	return кешЛюдей;
}
