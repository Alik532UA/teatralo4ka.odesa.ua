import type { Pathname } from '$app/types';
import groupsData from './groups.data.json';

export interface GroupPlay {
	year: number;
	text: string;
	/**
	 * Запис вистави. Саме ПОСИЛАННЯ, а не голий ідентифікатор: розбирає його
	 * `parseVideoUrl` — той самий, що й для новин, — і він же вирішує, чи можна
	 * показати плеєр на сторінці. Тримати тут `id` означало б зашити «це
	 * YouTube» у дані й повторити розбір, який уже написаний і перевірений.
	 */
	videoUrl?: string;
}

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

export interface GraduateGroup {
	slug: string;
	name: string;
	abbr: string | null;
	nameEn?: string;
	masters: GroupMaster[];
	/** Викладачі курсу. Немає поля — група їх не має, секція просто не з'явиться. */
	teachers?: GroupTeacher[];
	graduationYears: number[];
	memberSlugs: string[];
	plays: GroupPlay[];
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
 * Приведення типу, а не перевірка на кожному запуску: цілісність реєстру —
 * кожен `memberSlug` існує, кожен `master.id` знайдеться, у кожної групи є
 * вистава — тримає `groups.test.ts`, і тримає на збірці, а не в браузері
 * читача.
 */
export const GROUPS: readonly GraduateGroup[] = groupsData as readonly GraduateGroup[];

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

/** Знаходить групу за slug випускника */
export function getGroupByMember(memberSlug: string): GraduateGroup | undefined {
	return GROUPS.find((g) => g.memberSlugs.includes(memberSlug));
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
