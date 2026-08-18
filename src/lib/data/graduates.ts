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
export type Department = 'theatre' | 'music' | 'vocal' | 'art' | 'piano';

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
	/** Список, а не число: вступати можна двічі (у джерелі є «2003, 2007»). */
	enrollmentYears?: number[];
	/** Абревіатура й розшифровка окремо: у джерелі це «ЗТК» + «Захисники…». */
	group?: { abbr: string | null; name: string | null };
	masters?: string[];
	socials?: GraduateSocial[];
	playCount?: number;
	sourceUrl?: string;
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
