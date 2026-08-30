import { asset } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { localizedPath, type Locale } from '$lib/i18n/routing';
import { isMasterRecordPublic, type MasterVisibility } from '$lib/config/mastersVisibility';
import { GRADUATES, type Department, type GraduateIndexEntry } from './graduates';
import mastersIndexData from './masters.index.json';

/**
 * Життєвий цикл людини в школі. Про ЛЮДИНУ, а не про розділ сайту.
 *
 * `former`, а не `history`: розділ на сторінці зветься «Історія школи», і поки
 * значення звалося так само, два різних питання виглядали одним. Людина, що вже
 * не працює, не обов'язково показується в тому розділі — явний виняток
 * `unconfirmed` веде її в «Потребують уточнення» (див. `masterSection`).
 */
export const MASTER_STATUSES = ['active', 'former', 'honorary'] as const;

export type MasterStatus = (typeof MASTER_STATUSES)[number];

/**
 * Функціональна роль — ЧИМ людина займається. Більше нічого.
 *
 * ## Три осі, які доти були однією — і 77 записів без ролі
 *
 * До 2026-08-24 це поле відповідало одночасно на три різних питання:
 *
 *   ЯКА РОЛЬ — `administration`, `pedagogues`, `production`, `it`, `support`;
 *   ЯКИЙ ЖИТТЄВИЙ ЦИКЛ — `honorary`, `history`;
 *   ЧИ ПОВНІ ДАНІ — `needsClarification`.
 *
 * Ціна змішування заміряна: значення `needsClarification` стояло в 77 зі 118
 * записів (65%) і СТИРАЛО в них роль. Із запису не було видно, викладачка ця
 * людина чи бухгалтерка, — не тому що ніхто не знав, а тому що поле було зайняте
 * відповіддю на інше питання. Плюс `isHonorary` дублював `status === 'honorary'`
 * у трьох записах, і `MasterCard` перевіряв ОДИН факт тричі.
 *
 * Це та сама хвороба, яку в цьому файлі вже лікували для зв'язків випускників
 * (`role` → `relation` + `kind`, див. `MasterStudentEntry`). Тепер осей три, і
 * кожна відповідає на своє: `category` — роль, `status` — цикл, повнота даних
 * НЕ зберігається взагалі, а обчислюється (`masterSection`).
 *
 * Поле необов'язкове, і це значуще: у 77 записів роль справді невідома. Порожньо
 * тут означає «не знаємо», і саме тому такий запис не може стати в розділ ролі.
 *
 * `heads` (завідувачі відділень) відділено від `administration` 2026-08-24 на
 * прохання автора: це третя роль, а не відтінок двох сусідніх. Директорка й
 * заступниця керують ШКОЛОЮ і відділення не мають (`departments: []`),
 * бухгалтерія не викладає взагалі, а завідувачка веде своє відділення й свої
 * предмети. Доти всі троє лежали в `administration`, і сторінка не показувала
 * різниці; заодно виявилося, що завідувачка МУЗИЧНИМ відділенням стояла з
 * `departments: ['theatre']`.
 */
/**
 * Роль людини в школі.
 *
 * `teachers` лишається, хоча діючих із цією роллю більше немає: 2026-08-29 фах
 * розділили на п'ять окремих ролей (`artists`, `choreographers`, `vocalists`,
 * `musicians`, `speech`), бо в переліку складу вони й були окремими групами.
 * Значення тримається для тих, хто вже в «Історії школи» та «Світлій пам'яті»:
 * там роль — це факт про минуле, і переписувати її заднім числом означало б
 * вигадати, який саме фах людина вела.
 */
export const MASTER_CATEGORIES = [
	'administration',
	'heads',
	'directors',
	'speech',
	'artists',
	'choreographers',
	'vocalists',
	'musicians',
	'accompanists',
	'teachers',
	'production',
	'it',
	'support'
] as const;

export type MasterCategory = (typeof MASTER_CATEGORIES)[number];

/**
 * Розділ на сторінці `/residents/adults` — ПОХІДНА величина, не поле даних.
 *
 * camelCase у `needsClarification`, попри те що решта значень — односкладові
 * слова: підпис розділу шукається складанням `galaxy.categories.${key}Subtitle`,
 * тож дефіс дав би ключ `needs-clarificationSubtitle`.
 */
export type MasterSection = MasterCategory | 'honorary' | 'history' | 'needsClarification';

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
	/**
	 * «Відображаємо на сайті: ні». Поля немає = показуємо.
	 *
	 * Що саме означає «ні» і чому сторінка при цьому лишається живою — у
	 * [`config/mastersVisibility.ts`](../config/mastersVisibility.ts). Тут лише
	 * поле: рішення про чотири поверхні (список, `noindex`, мапа сайту, сама
	 * сторінка) ухвалюється в одному місці, а не чотирма правками.
	 */
	visible?: boolean;
	/**
	 * Чи запис підтверджений — ЯВНИЙ ВИНЯТОК із правила розділу.
	 *
	 * Поля немає — розділ визначають цикл і роль. `true` — тримати в «Потребують
	 * уточнення», хоч решта полів і веде до змістового розділу.
	 *
	 * 2026-08-24 автор назвав дванадцять таких записів, і перевірка показала, що
	 * спільного ПОЛЯ в них немає: Пирогова і Стельмах — так само лише прізвища —
	 * лишилися в «Історії школи», а Пруба із записаним предметом поїхала. Тобто
	 * межа «змістовий розділ проти технічного» з даних НЕ ВИВОДИТЬСЯ, це знання
	 * про людей.
	 *
	 * `true`, а не `boolean`: другого способу сказати «підтверджений» бути не
	 * мусить — його каже відсутність поля. Тристанним воно побуло кілька годин, поки
	 * розділ залежав від фотографії: тоді `false` означало «показувати попри
	 * відсутній знімок». Правило прибрано, і сенсу в `false` не лишилося. Форма
	 * взята з `GraduateIndexEntry.hasPhoto`.
	 *
	 * Ціна відома: ручне поле старіє. Тому гейт вимагає, щоб кожен прапорець
	 * СПРАВДІ змінював розділ; на записі, який і без нього в технічному розділі,
	 * він стає мертвим рядком — рівно так помер запис `liliia-velychko` у переліку
	 * порядку керівництва.
	 */
	unconfirmed?: true;
	/** Що ця людина викладає ВЗАГАЛІ. Що саме комусь окремому — у зв'язку. */
	subjects?: string[];
	/** У кого ця людина вчилася сама. Порожньо — не вчилася тут або невідомо. */
	studiedUnder?: (string | MasterMentorLink)[];
}

/**
 * Один термін роботи в школі.
 *
 * `from` обов'язковий, `to` — `null`, якщо триває досі. Терміну без початкового
 * року не буває: якщо рік невідомий, запису про термін просто немає. Інакше
 * `{ from: null, to: null }` означало б водночас «невідомо» і «працює зараз», і
 * кількість років порахувати було б ні з чого.
 */
export interface MasterWorkPeriod {
	from: number;
	to: number | null;
}


export interface MasterProfile extends MasterIndexEntry {
	bio?: string;
	socials?: MasterSocial[];
	/**
	 * Терміни роботи — КІЛЬКА, бо люди повертаються: «2012–2016, 2022 — дотепер».
	 *
	 * Живе лише у профілі (`static/masters/profiles/*.json`), як `bio` і
	 * `socials`, а не в індексі. Причина не в акуратності: `masters.index.json`
	 * імпортується модулем і потрапляє в клієнтський бандл цілком, тобто терміни
	 * всіх 118 людей везлися б на кожну сторінку сайту заради одного рядка на
	 * сторінці профілю. Профіль довантажується `fetch` лише там, де потрібен.
	 *
	 * На сторінці показується не самі роки, а їхня СУМА (`yearsOfService`).
	 */
	periods?: MasterWorkPeriod[];
	/** Режисерські роботи, покази вистав та творчі проєкти. */
	/**
	 * Вистави майстра — ПОСИЛАННЯ на реєстр, а не власні записи.
	 *
	 * Усе, що було в `MasterProduction` — назва, рік, група, склад, нагороди, —
	 * це властивості самої вистави, а не стосунку майстра до неї. Тому вони
	 * переїхали в `plays.data.json`, а тут лишився перелік ключів.
	 */
	playIds?: string[];
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

/* Та сама розкладка, що в `graduates.ts`: форму тримає `satisfies`, значення
 * відділень — спільний гейт. */
type MasterEntryJson = Omit<
	MasterIndexEntry,
	'departments' | 'category' | 'status' | 'unconfirmed'
> & {
	departments: string[];
	category?: string;
	status?: string;
	unconfirmed?: boolean;
};
const MASTERS_JSON = mastersIndexData satisfies readonly MasterEntryJson[];

export const MASTERS: Master[] = (MASTERS_JSON as MasterIndexEntry[]).map((m) => ({
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
 * Рівно ті три поля, які читає `masterSection`.
 *
 * `photo` тут НЕМА, і це рішення автора від 2026-08-24: «всі без фотографії — в
 * «Потребують уточнення»» було умовним правилом для розбору купи, а не фактом
 * про людей, і фіксувати його в коді не треба. Фотографія тепер не впливає на
 * розділ узагалі — картка без неї малює заглушку-камеру там, де людині й місце.
 *
 * Вужче за `MasterIndexEntry` навмисно: так у сигнатурі видно, від чого розділ
 * ЗАЛЕЖИТЬ, і перевірити правило можна об'єктом із трьох полів, не вигадуючи
 * решти чотирнадцяти лише щоб задовольнити тип.
 */
export type SectionInput = Pick<MasterIndexEntry, 'status' | 'category' | 'unconfirmed'>;

/**
 * Розділ, у якому людина показується. ОБЧИСЛЮЄТЬСЯ, а не зберігається.
 *
 * ## Чому похідне, а не поле
 *
 * Доти розділ лежав у `category` як значення `needsClarification`, і тримався на
 * пам'яті того, хто правив дані. Тепер його визначають ЛИШЕ три речі: життєвий
 * цикл, роль і явний виняток.
 *
 * ## Фотографія на розділ НЕ впливає
 *
 * Правило «всі без фотографії — в «Потребують уточнення»» діяло тут 2026-08-24 і
 * того ж дня прибране на пряме рішення автора: це було умовне правило для
 * розбору купи, а не факт про людей, і фіксувати його в коді не треба. Ціна
 * прибирання заміряна — переїхали ЧОТИРИ записи (Дерепа, Рибальченко Д.Д.,
 * Козовякін, Сухобоєвська: усі `former`, без фотографії й без ролі), і жодного
 * більше: решта тих, хто без знімка, і так не має ролі. Картка без фотографії
 * малює заглушку-камеру — тобто змістовий розділ від цього не ламається.
 *
 * ## Порядок умов значущий
 *
 * `honorary` перевіряється ПЕРШИМ: «Світла пам'ять» — розділ про людей, і
 * виносити звідти когось прапорцем не можна. Далі виняток, далі цикл, далі роль.
 *
 * Порожня `category` теж дає «Потребують уточнення» — і це не дірка, а те саме
 * твердження: роль невідома, отже розділ ролі невідомий.
 */
export function masterSection(m: SectionInput): MasterSection {
	if (m.status === 'honorary') return 'honorary';
	// Явний виняток стоїть ПІСЛЯ «Світлої пам'яті»: той розділ про людей, і
	// виносити звідти когось прапорцем не можна.
	if (m.unconfirmed) return 'needsClarification';
	if (m.status === 'former') return 'history';
	return m.category ?? 'needsClarification';
}

/** Чи показуємо запис на сайті. Політика й межі — у `config/mastersVisibility.ts`. */
export function isMasterPublic(m: MasterVisibility): boolean {
	return isMasterRecordPublic(m);
}

/** Лише ті, кого показуємо. Для списку на `/residents/adults`. */
export function getPublicMasters(): Master[] {
	return MASTERS.filter(isMasterPublic);
}

/**
 * Скільки років людина в школі — сума всіх термінів.
 *
 * Терміни складаються, а не беруться крайніми датами: «2012–2016, 2022 —
 * дотепер» це вісім років роботи, а не чотирнадцять. Незакритий термін (`to`
 * дорівнює `null`) міряється до `currentYear`.
 *
 * Рік передається аргументом, а не читається з `Date` тут: сторінки
 * пререндерені, і функція, яка сама дивиться на годинник, дала б у зібраному
 * HTML одне число, а після гідратації — інше.
 *
 * `null` означає «сказати нічого»: термінів немає. Нуль — теж відповідь
 * («менше року»), і плутати її з відсутністю даних не можна, тому саме `null`.
 */
export function yearsOfService(periods: MasterWorkPeriod[] | undefined, currentYear: number): number | null {
	if (!periods?.length) return null;
	let total = 0;
	for (const p of periods) {
		const to = p.to ?? currentYear;
		// Термін, що починається в майбутньому або закінчився до початку, —
		// зіпсовані дані; додавати від'ємне до суми гірше, ніж не додавати нічого.
		if (to > p.from) total += to - p.from;
	}
	return total;
}

/**
 * Яка з трьох українських форм слова «рік» потрібна для цього числа.
 *
 * Окрема функція, а не тернарник у розмітці, бо це ПРАВИЛО МОВИ, і його треба
 * перевіряти числами: 1 рік, 2 роки, 5 років, 11 років (не «11 рік»), 21 рік,
 * 112 років. Англійська обходиться двома формами, тому `One` там збігається з
 * однією, а `Few` і `Many` — з іншою; ключі все одно три, щоб словники були
 * дзеркальними (цього вимагає `i18n/translations.test.ts`).
 *
 * ICU-плюралізації (`{n, plural, one {…}}`) у проєкті немає ніде, і вводити її
 * заради одного рядка означало б завести другий спосіб робити те саме.
 */
export function yearsLabelKey(count: number): 'One' | 'Few' | 'Many' {
	const mod10 = count % 10;
	const mod100 = count % 100;
	if (mod10 === 1 && mod100 !== 11) return 'One';
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'Few';
	return 'Many';
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
	for (const g of GRADUATES) {
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

/**
 * Поля, за якими шукають людину в списку команди.
 *
 * Логіка тут, а не в компоненті: усе, що робить пошук — це перетворення рядків,
 * і саме в них живуть помилки, яких не видно оком (регістр, апостроф, порожній
 * запит, що раптом нічого не показує). Те саме рішення, що й у `siteSearch`.
 */
export interface MasterSearchable {
	displayName?: string;
	fullName?: string;
	displayNameEn?: string;
	fullNameEn?: string;
	roleTitle?: string;
	subjects?: string[];
}

/**
 * Зводить рядок до вигляду, у якому порівняння не залежить від дрібниць.
 *
 * Апострофи зводяться до одного: у даних трапляються всі три варіанти
 * (`'`, `’`, `ʼ`), і без цього «Бур'ян» не знаходився б за «Бурʼян» — тобто
 * пошук мовчки не показував би людину, яка в списку є.
 */
function normalizeQuery(value: string): string {
	return value
		.toLowerCase()
		.replace(/['’`ʼ]/gu, "'")
		.replace(/\s+/gu, ' ')
		.trim();
}

/**
 * Чи підходить запис під запит. Порожній запит підходить усім — інакше поле
 * пошуку в стані спокою ховало б увесь список.
 */
export function matchesMasterQuery(master: MasterSearchable, query: string): boolean {
	const q = normalizeQuery(query);
	if (!q) return true;

	// Кожне слово запиту окремо: так «риськіна майстерність» знаходить людину
	// за іменем І предметом, а не вимагає, щоб вони стояли поруч одним рядком.
	const haystack = normalizeQuery(
		[
			master.displayName,
			master.fullName,
			master.displayNameEn,
			master.fullNameEn,
			master.roleTitle,
			...(master.subjects ?? [])
		]
			.filter(Boolean)
			.join(' ')
	);

	return q.split(' ').every((word) => haystack.includes(word));
}
