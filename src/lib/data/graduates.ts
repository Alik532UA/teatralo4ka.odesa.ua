import indexData from './graduates.index.json';
import { asset } from '$app/paths';

/**
 * Випускники «Галактики» — дані в репозиторії, не у Firestore.
 *
 * Рішення записане в PROJECT-CONTEXT: перелік майже не змінюється, а найдорожче
 * тут — потрапити в індекс пошуку. Дані з репозиторію проходять prerender і
 * опиняються в HTML; дані з Firestore приходять уже в браузері, і сторінка їде в
 * індекс порожньою — саме тому `/news` має записане відхилення.
 *
 * ## Два види записів, і різниця між ними принципова
 *
 * Заміряно на джерелі: випускників **482** за 1998–2025, і лише **80** із них
 * заповнили анкету — тобто мають власну сторінку, портрет і подробиці. Решта 402
 * присутні на сторінці-індексі просто іменем.
 *
 * Спершу тут лежали тільки ті 80 — бо краулер ходив за посиланнями, а на решту
 * посилань немає. Це давало не «менше даних», а НЕПРАВДУ: сторінка казала
 * «вісімдесят випускників», хоча їх понад чотириста.
 *
 * `hasPhoto` і є ця різниця. Запис без нього летить у галактиці зіркою без
 * обличчя, і це не заглушка: людина в переліку є, просто анкету ще не заповнила.
 *
 * ## Чому поля опційні
 *
 * У 402 записів немає нічого, крім імені, року й відділення. Тримати для них
 * порожні масиви означає платити за них розміром у кожного відвідувача: стислий
 * файл — 80 КБ проти 154 з порожніми полями.
 */

/** Відділення. Ключі збігаються з емодзі-маркерами джерела (див. парсер). */
export type Department = 'theatre' | 'music' | 'vocal' | 'art' | 'piano' | 'guitar';

export interface GraduateMaster {
	id?: string;
	name: string;
	department?: Department | string | null;
}

export interface GraduateSocial {
	network: string;
	url: string;
}

export interface GraduateIndexEntry {
	slug: string;
	name: string;
	/** `null` буває: у джерелі рік вказаний не завжди. */
	graduationYear: number | null;
	departments: Department[];
	/** Є портрет і подробиці — тобто анкету заповнено. Інакше поля нижче порожні. */
	hasPhoto?: true;
	/**
	 * Код сторінки на старому сайті: `15K`, `18A_1`, `odessitkavmonreale`.
	 *
	 * Це не внутрішній ідентифікатор, а САМА АДРЕСА, за якою людину знали:
	 * `sites.google.com/view/ats-ua/GG/2015/15K` → `/projects/galaxy-graduates/15K`.
	 * Тому код не перегенеровується й не «покращується» — інакше всі посилання,
	 * які випускники роздавали роками, поїхали б у нікуди.
	 *
	 * Є у 80 із 482: решта на старому сайті власної сторінки не мали.
	 */
	code?: string;
	/** Список, а не число: вступати можна двічі (у джерелі є «2003, 2007»). */
	enrollmentYears?: number[];
	/** Абревіатура й розшифровка окремо: у джерелі це «ЗТК» + «Захисники…». */
	group?: { abbr: string | null; name: string | null };
	masters?: (string | GraduateMaster)[];
	socials?: GraduateSocial[];
	playCount?: number;
	sourceUrl?: string;
}

/** Одна вистава: рік і рядок дослівно зі старого сайту (назва разом із ролями). */
export interface GraduatePlay {
	year: number | null;
	text: string;
}

/**
 * Повний профіль — те, що лежало на власній сторінці випускника.
 *
 * Окремо від індексу і НЕ в бандлі: разом усі 80 профілів — 96 КБ, і тягнути їх
 * на сторінку галактики заради однієї відкритої картки безглуздо. Кожен лежить
 * у `static/graduates/profiles/<code>.json` (найбільший — 3 КБ) і читається на
 * вимогу: сторінкою профілю під час prerender, карткою в галактиці — на кліку.
 */
export interface GraduateProfile {
	code: string;
	slug: string;
	name: string;
	graduationYear: number | null;
	enrollmentYears: number[];
	departments: Department[];
	hasPhoto: boolean;
	group: string | null;
	masters: (string | GraduateMaster)[];
	socials: GraduateSocial[];
	plays: GraduatePlay[];
	/** Абзаци «про себе»: навчання після школи, робота, власні слова. */
	bio: string[];
	festivals: string[];
	duringStudies: string | null;
	afterGraduation: string | null;
	/** Сторінка-джерело на старому сайті — походження даних видиме. */
	sourceUrl: string;
}

/** Адреса файлу профілю. */
export function graduateProfileJson(code: string): string {
	return asset(`/graduates/profiles/${code}.json`);
}

/**
 * Шлях сторінки профілю БЕЗ мовного префікса — його додає `withLocale`.
 *
 * Саме рядок, а не `resolve()` з `$app/paths`, і це перевірено збіркою, а не
 * вирішено: під SSR `resolve()` віддає ВІДНОСНИЙ шлях
 * (`../../../projects/galaxy-graduates/15K`), і мовний префікс поверх нього дав
 * `/en../../../projects/…`. Наслідок був тихий і дорогий: сторінки в збірці
 * лишилися, але краулер prerender не знайшов англійських — у мапі сайту стало
 * 100 uk і 20 en замість 100 і 100. Про цю саму пастку попереджає коментар до
 * `base` в `+layout.svelte`.
 */
export function graduateProfilePath(code: string): string {
	return `/projects/galaxy-graduates/${code}`;
}

/** Відсортовано за роком випуску (новіші перші), у межах року — за іменем. */
export const GRADUATES: readonly GraduateIndexEntry[] = indexData as GraduateIndexEntry[];

/** Ті, у кого є портрет: саме вони летять у галактиці з обличчям. */
export const WITH_PHOTO: readonly GraduateIndexEntry[] = GRADUATES.filter((g) => g.hasPhoto);

/** Ті, хто ще не заповнив анкету: летять зірками без обличчя, з іменем на наведенні. */
export const WITHOUT_PHOTO: readonly GraduateIndexEntry[] = GRADUATES.filter((g) => !g.hasPhoto);

/**
 * Розміри портретів, які справді існують у `static/graduates/`.
 *
 * Числа не декоративні: вони йдуть у `srcset` дескрипторами `w`, а дескриптор
 * мусить бути правдивим. Тому `fetch-graduate-photos.ts` і робить сторону файлу
 * рівно такою, як в його імені.
 */
export const PHOTO_SIZES = [96, 192, 480] as const;

/** Адреса портрета потрібного розміру. */
export function graduatePhoto(slug: string, size: (typeof PHOTO_SIZES)[number]): string {
	return asset(`/graduates/${slug}-${size}.webp`);
}

/** `srcset` на всі наявні розміри — браузер обирає під щільність екрана сам. */
export function graduatePhotoSrcset(slug: string): string {
	return PHOTO_SIZES.map((size) => `${graduatePhoto(slug, size)} ${size}w`).join(', ');
}

/** Роки випуску, які є в даних — для фільтра. Новіші перші. */
export const GRADUATION_YEARS: readonly number[] = [
	...new Set(GRADUATES.map((g) => g.graduationYear).filter((y): y is number => y !== null))
].sort((a, b) => b - a);

/** Ті, у кого є власна сторінка з подробицями — саме вони мають свою адресу. */
export const WITH_PAGE: readonly GraduateIndexEntry[] = GRADUATES.filter((g) => g.code);
