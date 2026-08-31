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

/**
 * Підпис курсу для ПОКАЗУ: назва головна, тимчасовий номер — тиха приписка.
 *
 * ## Чому номер не може бути головним підписом
 *
 * `theatreGroup` у розкладі містить номер курсу на конкретний рік — «7Т-20». Це
 * величина, що змінюється щороку: той самий курс «ТВ Продакшн» був 6Т-19, потім
 * 7Т-20, потім 8Т-21. Тобто номер не називає курс, а лише каже, на якому він
 * році навчання в цьому сезоні. У переліку вистав на сторінці викладача поряд із
 * назвою вистави він читався як головна ознака — і не давав нічого.
 *
 * Заміряно 2026-08-31 на репертуарах усіх 142 працівників: 591 рядок, і з них
 * **321 показував голий номер** («гр. 3Т-9»), ще 74 — сиру назву з лапками й
 * приставкою «гр. ». Резолвер, який знає, як показати це правильно, лежав
 * поряд — але його кликали лише сторінка вистав і сторінка вистави.
 *
 * ## Звідки береться назва
 *
 * Спершу зі СКЛАДУ: `classifyPlayGroups` рахує, скільки учасників кожного курсу
 * назвали цю виставу своєю, і курс із ≥50% складу стає основним. Це і є
 * «вистава сама визначає, чий вона курс» — назва тоді приходить із реєстру
 * груп, разом з англійським варіантом.
 *
 * Якщо складу ще немає — беруться назви з самого поля. Їх там 43, і лише 4
 * збігаються з реєстром груп, тож поле — ЄДИНЕ місце, де живуть решта 39
 * («BEST THEATER SOCKS», «ЛІ-Те-Ра», «Шпильки»). Саме тому поле не спрощується
 * і не чиститься: разом із номером зникли б і вони.
 *
 * ## Чому номер лишається у відповіді
 *
 * Бо для 321 рядка це ЄДИНЕ, що взагалі відомо: назви немає ні в полі, ні в
 * реєстрі. Прибрати його означало б лишити рядок без жодної ознаки курсу. Тому
 * він повертається окремо — щоб показ вирішував сам, і показував тихо.
 */
export interface PlayGroupCaption {
	/** Назви курсів. Порожньо — назви немає ніде, лишається тільки приписка. */
	names: string[];
	/** Тимчасовий номер курсу на цей рік, якщо поле містить саме один код. */
	number: string | null;
	/**
	 * Те, що не є ні назвою, ні одним номером: перелік кількох курсів
	 * («2Т-5, 3Т-9»), підрахунок людей («85 чел», «61 + 17 худ. + 6 музик»),
	 * місце показу. Показується так само тихо, як номер.
	 */
	note: string | null;
}

/**
 * Один код курсу. Форми взяті З ДАНИХ, а не придумані:
 *
 *   «7Т-20»  новий вигляд          «18-Т»    старий
 *   «3-РТЗ»  режисерсько-театральне «4-Е-8»  два дефіси
 *   «12/2-Т» зі скісною             «1Т-1Н»  з літерою в кінці
 *   «3Т-8+»  із плюсом              «4Е–7»   з тире замість дефіса
 *
 * Перша спроба зразка знала лише «7Т-20» — і 18 значень старого вигляду
 * («14-Т», «7-Е») поїхали в НАЗВИ. На екрані це виглядало як курс на ім'я
 * «19-Т», що й є те саме, від чого ми тут ідемо.
 */
const GROUP_CODE =
	/^\d{1,2}(?:\/\d{1,2})?\s*[-–]?\s*(?:МТ|РТЗ|РТ|[ТЕМН])?\s*[-–]?\s*\d{0,2}\s*[-–]?\s*\d{0,2}\s*[Н+]?$/i;

/**
 * Підрахунок людей, а не курс: «85 чел», «61 + 17 худ. + 6 музик».
 *
 * Слово шукається РАЗОМ із цифрою (див. використання), бо саме по собі «муз»
 * зустрічається в справжній назві курсу «Муз. театр», а «випуск» — у «Театр
 * випускників». Перший зразок був на самих словах і обидві назви перетворював
 * на примітку.
 */
const HEADCOUNT_WORD = /чел|худ|муз/i;

/**
 * Розбирає `theatreGroup` на назву, номер і примітку.
 *
 * Лапки бувають обох видів — і «…», і "…": у розкладі вони перемішані, і
 * зразок лише на кутових пропустив би 11 значень із машинописними.
 */
/** Цифра плюс слово про кількість — це вже не курс. */
const isHeadcount = (v: string) => /[0-9]/.test(v) && HEADCOUNT_WORD.test(v);

function parseGroupField(raw?: string): PlayGroupCaption {
	const empty: PlayGroupCaption = { names: [], number: null, note: null };
	if (!raw) return empty;

	const bare = raw.trim().replace(/^гр\.?\s*/i, '');
	const quoted = [...bare.matchAll(/[«"]([^»"]+)[»"]/g)].map((m) => m[1].trim()).filter(Boolean);
	const rest = bare.replace(/[«"][^»"]+[»"]/g, ' ').replace(/\s+/g, ' ').trim();
	/* Порожня обгортка на кшталт «( )» чи «–» лишається після вирізання лапок і
	 * приміткою не є. */
	const leftover = /[\p{L}\p{N}]/u.test(rest) ? rest : '';

	if (quoted.length > 0) {
		const isCode = leftover !== '' && GROUP_CODE.test(leftover) && !isHeadcount(leftover);
		return {
			names: quoted,
			number: isCode ? leftover : null,
			note: isCode || leftover === '' ? null : leftover
		};
	}
	if (leftover === '') return empty;
	if (isHeadcount(leftover)) return { names: [], number: null, note: leftover };

	const tokens = leftover.split(/[,\s]+/).filter(Boolean);
	if (tokens.every((t) => GROUP_CODE.test(t))) {
		return tokens.length === 1
			? { names: [], number: tokens[0], note: null }
			: { names: [], number: null, note: leftover };
	}
	/* Кілька кодів через кому, злиплих без пробілу («1М,2М3М,4М») — це перелік
	 * курсів, а не назва: назвою його показувати було б неправдою. */
	if (/\d/.test(leftover) && /[,;]/.test(leftover)) {
		return { names: [], number: null, note: leftover };
	}
	return { names: [leftover], number: null, note: null };
}

export function playGroupCaption(
	playId: string,
	castMemberIds: string[],
	theatreGroup?: string,
	isEn = false
): PlayGroupCaption {
	const fromField = parseGroupField(theatreGroup);
	const { primaryGroups } = classifyPlayGroups(playId, castMemberIds);
	if (primaryGroups.length === 0) return fromField;
	return {
		names: primaryGroups.map((g) => (isEn && g.nameEn ? g.nameEn : g.name)),
		number: fromField.number,
		note: fromField.note
	};
}

/**
 * Прибирає з запасного підпису те, що не є назвою: «гр. » і лапки навколо.
 *
 * Без цього плашки читалися по-різному в сусідніх картках — «Адреналін» з
 * реєстру поруч із «гр. «ЛІ-Те-Ра»» з поля. Заміряно: 35 різних значень
 * `theatreGroup`, і 27 із них починаються з «гр. ».
 *
 * Лапки знімаються ЛИШЕ коли всередині їх більше немає. Інакше жадібний розбір
 * псує складені підписи: «гр. «Інтенсив» – «ХлопаФФки»» перетворився б на
 * «Інтенсив» – «ХлопаФФки» — з обрізаною першою лапкою й зайвою останньою.
 * Перевірено на всіх 35 значеннях: складені й ті, що з уточненням у дужках,
 * лишаються цілими.
 */
function tidyGroupLabel(raw: string): string {
	const withoutPrefix = raw.trim().replace(/^гр\.\s*/, '');
	const bare = /^«([^«»]+)»$/.exec(withoutPrefix);
	return bare ? bare[1] : withoutPrefix;
}

/**
 * Назви основних груп вистави — для плашок у переліку.
 *
 * Живе ТУТ, а не на сторінці переліку, з двох причин. Перша: поруч уже стоять
 * `classifyPlayGroups` і `playGroupCaption`, тобто вся решта відповідей на
 * питання «якої групи ця вистава». Друга практична — сторінка переліку впритул
 * до стелі `structure.test.ts`, і чистій логіці даних там не місце.
 *
 * Порядок рішень той самий, що на сторінці вистави:
 * 1. Є склад із анкет — беруться основні групи (>= 50% або найбільша частка).
 * 2. Складу ще немає — групи з реєстру (`playIds`).
 * 3. У реєстрі груп немає — запасний підпис із `theatreGroup`.
 */
export function playGroupNames(
	playId: string,
	/* Склад приходить ГОТОВИМ, а не дістається тут: `groups.ts` навмисно не знає
	   про `playCast` — так само, як у `playGroupCaption` поруч. Тип змінюваний, бо
	   такий у сусідньої `classifyPlayGroups`, якій цей список і передається. */
	castMemberIds: string[],
	fallback: string | undefined,
	isEn: boolean
): string[] {
	const { primaryGroups } = classifyPlayGroups(playId, castMemberIds);
	if (primaryGroups.length > 0) {
		return primaryGroups.map((g) => (isEn && g.nameEn ? g.nameEn : g.name));
	}
	const tidied = fallback ? tidyGroupLabel(fallback) : undefined;
	return tidied ? [tidied] : [];
}
