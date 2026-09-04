import institutionsData from './institutions.data.json';
import type { Pathname } from '$app/types';
import type { VerificationStatusProp } from './groups';

/**
 * Творчі навчальні заклади, куди вступили наші випускники.
 *
 * ## Навіщо окрема сутність
 *
 * Прохання автора: «вищим навчальним закладам треба теж зробити сторінки, по
 * прикладу як є сторінки у вистав, фестивалів та груп — тобто на сторінці буде
 * список тих наших випускників, які вступили до цього навчального закладу, і
 * рік вступу».
 *
 * Доти заклад існував лише рядком у полі `afterGraduation` кожної окремої
 * анкети — «КНУТКіТ, акторський, курс Д. Богомазова», — і з такого рядка не
 * складається нічого: не видно, що до КНУТКіТ вступили СЕМЕРО, і не видно, що
 * троє з них на курсі того самого майстра. Заклад стає видимим лише як
 * ОБ'ЄКТ, у якого є свій список людей.
 *
 * ## ЧОМУ РІК СТОЇТЬ НА ЛЮДИНІ, А НЕ НА ЗАКЛАДІ
 *
 * Тут головна різниця з фестивалем. У фестивалю роки живуть у самому записі
 * (`years`), бо поїздка — це подія: усі, хто в ній був, були в ній того самого
 * року. Заклад подією не є: він приймає щороку, і за п'ять років у КНУТКіТ
 * поїде п'ять різних наборів. Список `memberIds`, як у фестивалю, тут збрехав
 * би на другий же рік — звів би до купи людей різних вступів.
 *
 * Тому `students` — це РЕБРО: пара «людина + рік», плюс те, що правдиве лише
 * про цю пару (напрям і майстер курсу).
 *
 * ## Чому два списки людей
 *
 * `students` — ті, хто є в реєстрі випускників, і на сторінці вони картками з
 * обличчям. `unlistedStudents` — ті, кого реєстр не знає: з новини 4 вересня
 * 2026 таких троє з сімнадцяти (питання про них стоїть у `DATA-QUESTIONS.md`
 * § 8.3). Це та сама пара, що в вистави: `cast` із анкет проти `participants`
 * паперовим текстом. Викидати їх до з'ясування означало б, що сторінка ОТХФК
 * показує нуль людей, хоч ми знаємо двох.
 *
 * ## Чому повна назва не в кожного
 *
 * Автор написав скорочення, і саме так їх називають. Розшифровки я вписав лише
 * там, де впевнений; у ЛНУ, наприклад, скорочення неоднозначне, і вигадувати
 * назву закладу — найкращий спосіб помилитися в ній публічно. Питання стоїть у
 * `DATA-QUESTIONS.md` § 8.4, а до відповіді сторінка показує те, що знає.
 */
export interface InstitutionStudent {
	/** `id` із реєстру випускників — стійкий ключ, а не адреса. */
	id: string;
	/** Рік ВСТУПУ, а не випуску зі школи: у трьох із чотирнадцяти вони різні. */
	year: number;
	/** «акторський», «театр ляльок», «кіно-фото-відео» — як записано в джерелі. */
	programme?: string;
	/** Майстер курсу вільним текстом: у джерелі стоять лише ініціали, і в реєстр майстрів школи ці люди не входять. */
	master?: string;
	/** Те, чого не скажеш попередніми полями: «філіал у Мюнхені, Німеччина». */
	note?: string;
}

/** Той, кого називає джерело, а реєстр випускників не знає. Різниця — у докблоці вище. */
export interface UnlistedStudent {
	name: string;
	year: number;
	programme?: string;
	master?: string;
	note?: string;
}

export interface Institution {
	slug: string;
	/** Як заклад називають: «КНУТКіТ», ««École de culture générale»». */
	name: string;
	nameEn?: string;
	/** Повна назва, якщо вона відома точно. Немає поля — не вигадуємо. */
	fullName?: string;
	/** Місто, де заклад. */
	city?: string;
	/**
	 * Країни кодами ISO 3166-1 alpha-2 — так само, як у фестивалів, і з тієї ж
	 * причини: назва країни залежить від мови сторінки, а код ні, і за тим самим
	 * кодом малює прапор `CountryFlag`.
	 *
	 * Кодів буває більше одного: у КМАЕЦМ це UA і DE, бо один зі вступників
	 * навчається в мюнхенському філіалі.
	 */
	countries: string[];
	students: InstitutionStudent[];
	unlistedStudents?: UnlistedStudent[];
	verificationStatus?: VerificationStatusProp;
}

/*
 * Приведення тут не потрібне: реєстр збігається з типом ТОЧНО, і це перевіряє
 * компілятор, а не довіра. `as` мовчки погодилося б і з файлом, у якому поля
 * роз'їхалися.
 */
export const INSTITUTIONS: readonly Institution[] = institutionsData satisfies readonly Institution[];

const BY_SLUG = new Map(INSTITUTIONS.map((i) => [i.slug, i]));

/** Заклад за адресою, або `undefined` — сторінка тоді віддає 404. */
export function getInstitutionBySlug(slug: string): Institution | undefined {
	return BY_SLUG.get(slug);
}

/**
 * Адреса сторінки закладу.
 *
 * Типізована як `Pathname` із тієї ж причини, що шлях вистави й майстра: за цим
 * типом `svelte/no-navigation-without-resolve` визнає адресу перевіреною, і
 * описка ловиться компіляцією, а не читачем.
 */
export function institutionPath(slug: string): Pathname {
	return `/projects/galaxy-graduates/institutions/${slug}` as Pathname;
}

/** Скільком людям цей заклад відомий — разом із тими, кого реєстр не знає. */
export function institutionSize(institution: Institution): number {
	return institution.students.length + (institution.unlistedStudents?.length ?? 0);
}

/**
 * Заклади, куди вступив цей випускник, — зворотний зріз реєстру.
 *
 * Потрібен сторінці людини: вона знає свій `id` і не мусить перебирати заклади
 * сама. Повертає пару «заклад + що саме про цей вступ відомо», бо рік і курс
 * живуть на ребрі, а не в закладі.
 */
export function institutionsOfGraduate(
	graduateId: string
): { institution: Institution; student: InstitutionStudent }[] {
	const out: { institution: Institution; student: InstitutionStudent }[] = [];
	for (const institution of INSTITUTIONS) {
		const student = institution.students.find((s) => s.id === graduateId);
		if (student) out.push({ institution, student });
	}
	return out;
}
