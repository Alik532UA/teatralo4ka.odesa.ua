import { asset } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { localizedPath, type Locale } from '$lib/i18n/routing';
import type { Department, GraduateIndexEntry } from './graduates';
import mastersIndexData from './masters.index.json';
import indexData from './graduates.index.json';

export type MasterStatus = 'active' | 'honorary' | 'history';

export type MasterCategory =
	| 'administration'
	| 'pedagogues'
	| 'production'
	| 'it'
	| 'support'
	| 'honorary'
	| 'history';

export interface MasterSocial {
	network: string;
	url: string;
}

/**
 * «Ця людина сама вчилася в цієї школи, у такого-то майстра».
 *
 * Окремий тип, а не рядок у примітках: без нього такий зв'язок не існував ніде,
 * і на сторінці Імаса троє його ж учнів, які тепер викладають самі, не з'являлися
 * взагалі. Вони не в переліку випускників (`graduates.index.json`) — власної
 * анкети випускника ці люди не заповнювали, вони в базі як МАЙСТРИ.
 *
 * `relation` і `subjects` НЕОБОВ'ЯЗКОВІ навмисно: часто відомий лише сам факт
 * «навчався у», а курс це був чи окремий предмет — ні. Порожнє поле тут означає
 * «невідомо», і саме так воно й показується; вигадувати курс, щоб заповнити
 * структуру, було б гірше за прогалину.
 */
export interface MasterMentorLink {
	id: string;
	/** `master` — вів курс, `teacher` — викладав предмет. Немає = невідомо. */
	relation?: 'master' | 'teacher';
	/** Предмети саме цього зв'язку, якщо відомі. */
	subjects?: string[];
}

export interface MasterIndexEntry {
	id: string;
	slug: string;
	displayName: string;
	fullName: string;
	displayNameEn: string;
	fullNameEn: string;
	departments: Department[];
	category?: MasterCategory;
	roleTitle?: string;
	photo?: string;
	portrait?: string;
	status?: MasterStatus;
	isHonorary?: boolean;
	/** Що ця людина викладає ВЗАГАЛІ. Що саме комусь окремому — у зв'язку. */
	subjects?: string[];
	/** У кого ця людина вчилася сама. Порожньо — не вчилася тут або невідомо. */
	studiedUnder?: (string | MasterMentorLink)[];
}

export interface MasterProfile extends MasterIndexEntry {
	bio?: string;
	socials?: MasterSocial[];
}

export type Master = MasterProfile;

/**
 * Хтось, хто вчився в цього майстра.
 *
 * ## Дві ОСІ, які доти були однією — і саме тому троє людей губилися
 *
 * Раніше тут стояло одне поле `role: 'master' | 'teacher'`, і воно змішувало два
 * різних питання:
 *
 *   ЯК ця людина пов'язана з майстром — він вів її курс (`relation: 'master'`)
 *   чи викладав їй окремий предмет (`relation: 'teacher'`);
 *
 *   ХТО ця людина зараз — запис випускника (`kind: 'graduate'`) чи колега, який
 *   сам став майстром цієї школи (`kind: 'master'`).
 *
 * Друга вісь не існувала зовсім, тож колеги-майстри не могли з'явитися в потоці
 * в принципі: `getStudentsByMaster` перебирав лише `graduates.index.json`, а їх
 * там немає. На сторінці Самуїла Імаса це означало, що з шести його учнів видно
 * трьох.
 *
 * Розмір зірки в потоці залежить від `kind`, а не від `relation`: колега-майстер
 * більший, випускник курсу — звичайний, учень окремого предмета — трохи менший.
 * Доти розмір залежав від `role`, тобто від зовсім іншої величини.
 *
 * Розмічений об'єднаний тип, а не одна структура з опційними полями: так
 * компілятор не дає прочитати `graduate` у майстра й навпаки, а `svelte-check`
 * ловить це до запуску.
 */
export type MasterStudentEntry =
	| {
			kind: 'graduate';
			relation: 'master' | 'teacher';
			graduate: GraduateIndexEntry;
			/** Предмети саме цього зв'язку. Порожньо — не записані. */
			subjects?: string[];
	  }
	| {
			kind: 'master';
			/** Може бути невідомим: див. `MasterMentorLink`. */
			relation?: 'master' | 'teacher';
			master: Master;
			subjects?: string[];
	  };

export const MASTERS: Master[] = (mastersIndexData as MasterIndexEntry[]).map((m) => ({
	...m,
	photo: m.photo ? asset(m.photo) : undefined,
	portrait: m.portrait ? asset(m.portrait) : undefined
}));

const MASTERS_BY_ID = new Map<string, Master>(MASTERS.map((m) => [m.id, m]));
const MASTERS_BY_SLUG = new Map<string, Master>(MASTERS.map((m) => [m.slug, m]));

export function getMasterById(id: string): Master | undefined {
	return MASTERS_BY_ID.get(id);
}

export function getMasterBySlug(slug: string): Master | undefined {
	return MASTERS_BY_SLUG.get(slug);
}

export function getAllMasters(): Master[] {
	return MASTERS;
}

/**
 * Адреса сторінки майстра, з мовним префіксом і типізована проти маршрутів.
 *
 * Мовний префікс додає `localizedPath`, а не рядкова конкатенація: тип
 * `ResolvedPathname` — те, за чим `svelte/no-navigation-without-resolve` визнає
 * адресу перевіреною, і без нього три компоненти карток (`MasterCard`,
 * `MasterCompact`, `MasterPoster`) та `GraduateProfileView` мали
 * `eslint-disable-next-line`, який до того ж не діяв: правило звітує на рядку
 * атрибута `href`, а коментар стояв перед тегом `<a`.
 */
export function masterProfilePath(slug: string, lang: Locale = 'uk'): ResolvedPathname {
	return localizedPath(`/residents/adults/${slug}`, lang);
}

export function masterProfileJson(slug: string): string {
	return asset(`/masters/profiles/${encodeURIComponent(slug)}.json`);
}

/**
 * Предмети зв'язку, зведені до переліку.
 *
 * `subjects` — правильна форма. `subject` — стара, вільний рядок; його ділимо
 * комою, бо саме так у нього писали кілька предметів. Порожній результат означає
 * «не записано», і це НЕ те саме, що «жодного»: у такому разі показ підставляє
 * власний перелік майстра (див. `GraduateProfileView`).
 */
export function relationSubjects(link: { subjects?: string[]; subject?: string }): string[] {
	if (link.subjects?.length) return link.subjects;
	if (link.subject) {
		return link.subject
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}
	return [];
}

/**
 * Усі, хто вчився в цього майстра: і випускники, і колеги-майстри.
 *
 * Порядок навмисний — спершу колеги, далі випускники курсу, далі учні окремих
 * предметів. Це не косметика: потік у `MasterGraduateFlow` роздає смуги в
 * порядку надходження, і так найбільші зірки не опиняються всі в одному краю.
 */
export function getStudentsByMaster(masterId: string): MasterStudentEntry[] {
	const colleagues: MasterStudentEntry[] = [];
	const courseStudents: MasterStudentEntry[] = [];
	const subjectStudents: MasterStudentEntry[] = [];

	// ── Колеги, які самі вчилися тут ────────────────────────────────────────
	for (const m of MASTERS) {
		if (m.id === masterId) continue; // сам у себе не вчився
		const link = (m.studiedUnder ?? []).find((s) => (typeof s === 'string' ? s === masterId : s.id === masterId));
		if (link === undefined) continue;
		// Рядкова форма означає «навчався, подробиць немає»: ні курс/предмет, ні
		// перелік предметів у ній не записані, і вигадувати їх тут нема з чого.
		const detail: MasterMentorLink = typeof link === 'string' ? { id: link } : link;
		colleagues.push({
			kind: 'master',
			master: m,
			relation: detail.relation,
			subjects: relationSubjects(detail)
		});
	}

	// ── Випускники ──────────────────────────────────────────────────────────
	for (const g of indexData as GraduateIndexEntry[]) {
		const asCourseMaster = g.masters?.some((m) => (typeof m === 'string' ? m === masterId : m.id === masterId));
		if (asCourseMaster) {
			courseStudents.push({ kind: 'graduate', relation: 'master', graduate: g });
			// `continue`: одна людина — один запис. Якщо майстер вів і курс, і
			// предмет, курс важливіший, і подвійна зірка в потоці була б помилкою.
			continue;
		}

		const teacherLink = g.teachers?.find((t) => (typeof t === 'string' ? t === masterId : t.id === masterId));
		if (teacherLink !== undefined) {
			subjectStudents.push({
				kind: 'graduate',
				relation: 'teacher',
				graduate: g,
				subjects: typeof teacherLink === 'string' ? [] : relationSubjects(teacherLink)
			});
		}
	}

	return [...colleagues, ...courseStudents, ...subjectStudents];
}

/** Лише записи випускників — колеги-майстри в переліку випускників не значаться. */
export function getGraduatesByMaster(masterId: string): GraduateIndexEntry[] {
	return getStudentsByMaster(masterId)
		.filter((s): s is Extract<MasterStudentEntry, { kind: 'graduate' }> => s.kind === 'graduate')
		.map((s) => s.graduate);
}
