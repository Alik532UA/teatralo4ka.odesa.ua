import castData from './play-cast.json';
import { GRADUATES, type GraduateIndexEntry } from './graduates';

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
 * ## Чому окремий JSON, а не читання анкет
 *
 * Анкети лежать у `static/` і в бандл не потрапляють — разом 96 КБ. Зріз
 * рахує `scripts/build-play-cast.ts` на збірці, а свіжість тримає гейт
 * `play-cast.test.ts`, який перераховує його наново й звіряє.
 *
 * Цей модуль імпортує ЛИШЕ маршрут вистави, тож у критичний шлях головної
 * зріз не потрапляє.
 */
export interface CastEntry {
	graduateId: string;
	role?: string;
	/** Номер програми — уривок вечора. Див. `PlayProgrammeItem` у `plays.ts`. */
	item?: string;
	/** Рядок зі списку школи, а не зі слів людини. Див. `GraduatePlay.fromRegistry`. */
	fromRegistry?: boolean;
}

export const PLAY_CAST = castData as Record<string, CastEntry[]>;

/** Один рядок складу з уже знайденою людиною. */
export interface CastMember {
	graduate: GraduateIndexEntry;
	role?: string;
	/** Номер програми, у якому людина грала. Немає — вона назвала весь вечір. */
	item?: string;
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
export function castOf(playId: string): CastMember[] {
	const members: CastMember[] = [];
	for (const entry of PLAY_CAST[playId] ?? []) {
		const graduate = GRADUATES.find((g) => g.id === entry.graduateId);
		if (graduate)
			members.push({
				graduate,
				role: entry.role,
				item: entry.item,
				fromRegistry: entry.fromRegistry
			});
	}
	return members.sort((a, b) => a.graduate.name.localeCompare(b.graduate.name, 'uk'));
}
