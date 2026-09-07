import { LINKED_GRADUATES, type GraduateIndexEntry } from './graduates';
import type { CastRole } from './castRoles';

/**
 * Склад вистав — зворотний зріз анкет: не «вистави цієї людини», а «люди цієї
 * вистави».
 *
 * ## Звідки береться
 *
 * Виключно з `playId` в анкетах: це і є заява «я в цьому грав». Виводити склад
 * із групи ЗАБОРОНЕНО — пояснення з двома замірами лежить у докблоці
 * `plays.ts`, і коротко воно таке: людина могла прийти в групу пізніше вистави,
 * а сама вистава могла зіграти двома групами разом.
 *
 * ## Чому окремий файл, а не читання анкет
 *
 * Анкети лежать у `static/` і в бандл не потрапляють — разом 96 КБ. Зріз
 * рахує `scripts/build-play-cast.ts` на збірці, а свіжість тримає гейт
 * `play-cast.test.ts`, який перераховує його наново й звіряє.
 *
 * ## ЧОМУ `fetch`, А НЕ `import` — і що це коштувало
 *
 * Доти зріз лежав у `src/lib/data/play-cast.json` і приходив звичайним
 * імпортом. Це означало, що він ЇДЕ В КЛІЄНТСЬКИЙ БАНДЛ — до кожного
 * відвідувача сайту, включно з тими, хто ніколи не відкриє жодного показу.
 *
 * Заміряно 7 вересня 2026, коли `check-bundle-budget` почервонів на п'яти нових
 * фестивалях: усі дані бандла важили 81 КБ brotli при стелі 80, і 7 КБ із них —
 * саме цей зріз. Стеля не випадкова: у її докблоці записано наперед, що робити,
 * дійшовши до неї, — «виносити реєстри у `static/` під запит, як це давно
 * зроблено з профілями майстрів і випускників». Підняти число замість переносу
 * означало б не виконати власну обіцянку.
 *
 * Тому зріз тепер лежить у `static/galaxy/play-cast.json`, а забирають його
 * `fetch`ем рівно три сторінки, яким він потрібен: показ, перелік показів і
 * сторінка майстра. Після переносу дані бандла — 74 КБ.
 *
 * `fetch` приходить із `load` SvelteKit: на пререндері він читає файл із диска
 * (тобто зріз потрапляє в готовий HTML і мережею не їде), а при переході в
 * браузері — з мережі, один раз на сеанс завдяки кешу нижче.
 */
export interface CastEntry {
	graduateId: string;
	role?: string;
	/** Номери програми — уривки вечора. Див. `PlayProgrammeItem` у `plays.ts`. */
	items?: string[];
	/** Роль у кожному номері окремо. Чому не досить `role` і чому перелік, а не мапа — у `scripts/build-play-cast.ts`. */
	roles?: CastRole[];
	/** Рядок зі списку школи, а не зі слів людини. Див. `GraduatePlay.fromRegistry`. */
	fromRegistry?: boolean;
}

export type PlayCast = Record<string, CastEntry[]>;

/** Адреса зрізу в `static/`. Одна на проєкт — щоб не розійшлася з `OUT` скрипта. */
export const PLAY_CAST_URL = '/galaxy/play-cast.json';

/**
 * Кеш на сеанс сторінки.
 *
 * Три різні `load` просять той самий файл, а при переходах між показами
 * `load` виконується щоразу наново. Без кешу перелік із двохсот показів
 * означав би двісті запитів за тим самим файлом; браузер більшість із них
 * віддав би зі свого кешу, але розбір JSON робився б щоразу.
 *
 * Кешується САМА ОБІЦЯНКА, а не результат: два `load` можуть початися
 * одночасно (перехід і попереднє завантаження посилання), і на результаті вони
 * зробили б два запити.
 */
let кеш: Promise<PlayCast> | null = null;

/**
 * Зріз складу — з `static/`, через `fetch` із `load`.
 *
 * Помилка мережі не валить сторінку: показ без складу — це те саме, що показ,
 * складу якого ми ще не знаємо, і сторінка вже вміє це показати («склад ще не
 * зібрано»). Валитися тут означало б віддати 500 замість сторінки з афішею.
 */
export async function loadPlayCast(fetchFn: typeof fetch): Promise<PlayCast> {
	кеш ??= fetchFn(PLAY_CAST_URL)
		.then((response) => (response.ok ? (response.json() as Promise<PlayCast>) : {}))
		.catch(() => ({}) as PlayCast);
	return кеш;
}

/** Лише ключі людей на кожен показ — те, чого вистачає рядам облич. */
export function castIdsOf(cast: PlayCast): Record<string, string[]> {
	const map: Record<string, string[]> = {};
	for (const [playId, entries] of Object.entries(cast)) {
		map[playId] = entries.map((entry) => entry.graduateId);
	}
	return map;
}

/** Один рядок складу з уже знайденою людиною. */
export interface CastMember {
	graduate: GraduateIndexEntry;
	role?: string;
	/** Номери програми, у яких людина грала. Порожньо — вона назвала весь вечір. */
	items?: string[];
	/** Роль у кожному з номерів окремо — для картки під фільтром уривка. Читають `castRoles.ts`. */
	roles?: CastRole[];
	/** Ім'я прийшло зі списку школи, а не зі слів людини. */
	fromRegistry?: boolean;
}

/**
 * Склад вистави з розгорнутими записами випускників.
 *
 * Люди, яких немає в реєстрі, мовчки відкидаються — але такого бути не може:
 * зріз будується з анкет, а кожна анкета належить запису реєстру. Фільтр тут
 * як запобіжник типів, а не як очікуваний випадок.
 */
export function castOf(cast: PlayCast, playId: string): CastMember[] {
	const members: CastMember[] = [];
	for (const entry of cast[playId] ?? []) {
		const graduate = LINKED_GRADUATES.find((g) => g.id === entry.graduateId);
		if (graduate)
			members.push({
				graduate,
				role: entry.role,
				items: entry.items,
				roles: entry.roles,
				fromRegistry: entry.fromRegistry
			});
	}
	return members.sort((a, b) => a.graduate.name.localeCompare(b.graduate.name, 'uk'));
}
