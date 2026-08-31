import type { Pathname } from '$app/types';
import groupsData from './groups.data.json';

export interface GroupMaster {
	id: string;
	name: string;
	department?: string | null;
}

export interface GroupTeacher {
	id: string;
	name: string;
	/** Предмет — те, чим викладач відрізняється від майстра курсу на картці. */
	subject: string;
}

/** Одна з груп, що злилися: власна назва, власний склад, власний репертуар. */
export interface GroupPart {
	name: string;
	memberIds: string[];
	playIds: string[];
}

export interface GraduateGroup {
	slug: string;
	name: string;
	abbr: string | null;
	nameEn?: string;
	masters: GroupMaster[];
	/** Викладачі курсу. Немає поля — група їх не має, секція просто не з'явиться. */
	teachers?: GroupTeacher[];
	graduationYears: number[];
	/**
	 * Склад групи — за СТІЙКИМ ключем випускника, а не за адресою.
	 *
	 * Доти тут лежали `slug`, і кожне виправлення імені (за одну сесію їх було
	 * п'ять) тихо розривало склад. Гейт це ловив, але постфактум — коли дані вже
	 * були зламані. `id` не міняється ніколи, тож рвати нема чого.
	 */
	memberIds: string[];
	/**
	 * Репертуар — ПОСИЛАННЯ на реєстр вистав, а не копії назв.
	 *
	 * Доти група тримала свій список рядків, майстер — свій, випускник — свій, і
	 * та сама вистава жила трьома незалежними записами. Тепер запис один, а
	 * група лише каже, які з них її.
	 */
	playIds: string[];
	/**
	 * Групи, що злилися в одну, — кожна зі своїм складом і репертуаром.
	 *
	 * «Аншлаг+Дєвішнік» — це не одна група з довгою назвою, а дві, які згодом
	 * стали однією. Показувати їхні двадцять сім вистав одним списком означало б
	 * стерти те, що частина з них ішла паралельно й різними людьми.
	 *
	 * Поділ виведено з анкет, а не вигаданий: до 2022 року ЖОДНА вистава не
	 * змішує ці два склади, а перша спільна — «Листи до Бога» 2022-го. Саме там
	 * і сталося злиття.
	 *
	 * `playIds` самої групи лишається за спільними виставами — тими, де грали
	 * обидві частини, і тими, яких не вказав ніхто: приписати такі навмання
	 * означало б вигадати за дані, а сховати — забути виставу.
	 */
	parts?: GroupPart[];
	bio?: string[];
	/**
	 * Знімки групи для банера. Список, а не один рядок: банер їх перегортає, і
	 * кожен відкривається на весь екран. Немає поля — банера просто немає.
	 */
	photos?: string[];
}

/*
 * Самі групи лежать у JSON, а не тут.
 *
 * Це РЕЄСТР, який росте з кожною новою групою, — так само, як `graduates.index`
 * і `masters.index`. Лишившись масивом у коді, він переріс типову межу файлу
 * втричі, і єдиним виходом був би запис у переліку боргів `structure.test.ts`,
 * який за задумом лише скорочується. Дані не борг: їх просто багато.
 *
 * `satisfies`, а не приведення: форму звіряє компілятор на збірці, і в бандл
 * це не важить нічого. Перевірки на кожному запуску тут немає свідомо —
 * цілісність реєстру —
 * кожен `memberSlug` існує, кожен `master.id` знайдеться, у кожної групи є
 * вистава — тримає `groups.test.ts`, і тримає на збірці, а не в браузері
 * читача.
 */
export const GROUPS: readonly GraduateGroup[] = groupsData satisfies readonly GraduateGroup[];

/** Знаходить групу за slug */
export function getGroupBySlug(slug: string): GraduateGroup | undefined {
	return GROUPS.find((g) => g.slug === slug);
}

/** Знаходить групу за назвою або абревіатурою */
export function getGroupByTitleOrAbbr(query: string): GraduateGroup | undefined {
	const clean = query.trim().toLowerCase();
	return GROUPS.find(
		(g) =>
			g.name.toLowerCase() === clean ||
			(g.abbr && g.abbr.toLowerCase() === clean) ||
			(g.nameEn && g.nameEn.toLowerCase() === clean)
	);
}

/**
 * Усі групи випускника — саме УСІ, а не перша.
 *
 * Людина буває в кількох групах одразу (заміряно — четверо), і хто з них
 * «головна», дані не кажуть. Доти картка малювала групи з рядка в анкеті, і
 * третина тих рядків не вела нікуди; тепер вона бере їх звідси, тож кожна
 * показана група — справжнє посилання.
 */
export function getGroupsByMember(memberId: string): GraduateGroup[] {
	return GROUPS.filter((g) => g.memberIds.includes(memberId));
}

/**
 * Групи, які веде (або вела) майстриня чи майстер курсу.
 *
 * Зв'язок виводиться з самих груп, а не дублюється в реєстрі майстрів: доти
 * сторінка викладача про свої курси не знала взагалі, і єдиний спосіб дійти до
 * групи був через випускника. Тримати той самий зв'язок у двох місцях означало
 * б, що додана група мовчки не з'явиться на сторінці майстра.
 */
export function getGroupsByMaster(masterId: string): GraduateGroup[] {
	return GROUPS.filter((group) => group.masters.some((master) => master.id === masterId));
}

/** Шлях до сторінки групи */
export function groupProfilePath(slug: string): Pathname {
	return `/projects/galaxy-graduates/groups/${slug}` as Pathname;
}

/** Результат аналізу належності вистави до груп. */
export interface PlayGroupsClassification {
	/** Основні (або рівнозначні) групи: >= 50% складу або найбільша частка */
	primaryGroups: GraduateGroup[];
	/** Допоміжні групи («за участі»): >= 3 учасників */
	supportingGroups: GraduateGroup[];
	/** Усі групи для репертуару */
	groups: GraduateGroup[];
}

/**
 * Визначає основні та допоміжні групи для вистави за складом випускників.
 *
 * Логіка:
 * 1. Якщо у вистави є склад (з анкет):
 *    - Групи з >= 50% учасників у складі (або група з найбільшою кількістю учасників) — основні.
 *    - Інші групи з >= 3 учасниками — допоміжні («за участі»).
 *    - Групи з < 3 учасниками і < 50% не відображаються.
 * 2. Якщо складу немає — беруться групи з реєстру (playIds).
 */
export function classifyPlayGroups(
	playId: string,
	castMemberIds: string[] = []
): PlayGroupsClassification {
	const candidateGroups = GROUPS.filter(
		(group) =>
			group.playIds.includes(playId) ||
			group.memberIds.some((m) => castMemberIds.includes(m))
	);

	if (candidateGroups.length === 0) {
		return { primaryGroups: [], supportingGroups: [], groups: [] };
	}

	const scored = candidateGroups.map((group) => {
		const castCount = group.memberIds.filter((m) => castMemberIds.includes(m)).length;
		const ratio = group.memberIds.length > 0 ? castCount / group.memberIds.length : 0;
		const isExplicit = group.playIds.includes(playId);
		return { group, castCount, ratio, isExplicit };
	});

	const maxCast = scored.length > 0 ? Math.max(...scored.map((s) => s.castCount)) : 0;

	const primaryGroups: GraduateGroup[] = [];
	const supportingGroups: GraduateGroup[] = [];

	if (maxCast === 0) {
		for (const s of scored) {
			if (s.isExplicit) primaryGroups.push(s.group);
		}
	} else {
		for (const s of scored) {
			if (s.ratio >= 0.5 && s.castCount > 0) {
				primaryGroups.push(s.group);
			} else if (s.castCount === maxCast && maxCast > 0) {
				if (!primaryGroups.some((g) => g.slug === s.group.slug)) {
					primaryGroups.push(s.group);
				}
			} else if (s.castCount >= 3) {
				supportingGroups.push(s.group);
			}
		}
	}

	const filteredSupporting = supportingGroups.filter(
		(g) => !primaryGroups.some((p) => p.slug === g.slug)
	);

	return {
		primaryGroups,
		supportingGroups: filteredSupporting,
		groups: [...primaryGroups, ...filteredSupporting]
	};
}
