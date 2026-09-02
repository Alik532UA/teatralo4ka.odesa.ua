import castData from './play-cast.json';
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
	/** Номери програми — уривки вечора. Див. `PlayProgrammeItem` у `plays.ts`. */
	items?: string[];
	/** Роль у кожному номері окремо. Чому не досить `role` і чому перелік, а не мапа — у `scripts/build-play-cast.ts`. */
	roles?: CastRole[];
	/** Рядок зі списку школи, а не зі слів людини. Див. `GraduatePlay.fromRegistry`. */
	fromRegistry?: boolean;
}

export const PLAY_CAST = castData as Record<string, CastEntry[]>;

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
export function castOf(playId: string): CastMember[] {
	const members: CastMember[] = [];
	for (const entry of PLAY_CAST[playId] ?? []) {
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
