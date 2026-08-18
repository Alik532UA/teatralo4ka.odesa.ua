import indexData from './graduates.index.json';
import { asset } from '$app/paths';

/**
 * Випускники «Галактики» — дані в репозиторії, не у Firestore.
 *
 * Рішення записане в PROJECT-CONTEXT: цей перелік майже не змінюється (80
 * записів за 27 років), а найдорожче тут — потрапити в індекс пошуку. Дані з
 * репозиторію проходять prerender і опиняються в HTML; дані з Firestore
 * приходять уже в браузері, і сторінка їде в індекс порожньою — саме тому
 * `/news` і `/projects/[slug]` мають записане відхилення.
 *
 * Джерело — `scripts/parse-graduates.ts` над дампом Google Sites. Правити цей
 * файл руками можна: він і є тепер джерелом істини, а не проміжним артефактом.
 *
 * ## Що НЕ лежить тут
 *
 * Повні переліки вистав, ролей і біографії. Індекс — 43 КБ, повні записи 125;
 * галактиці потрібне лише те, що видно на зірці й у короткій картці. Решта
 * приїде разом зі сторінкою окремого випускника.
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
	/** `null` буває: у джерелі рік випуску вказаний не завжди. */
	graduationYear: number | null;
	/** Список, а не число: вступати можна двічі (у джерелі є «2003, 2007»). */
	enrollmentYears: number[];
	departments: Department[];
	/** Абревіатура й розшифровка окремо: у джерелі це «ЗТК» + «Захисники…». */
	group: { abbr: string | null; name: string | null } | null;
	masters: string[];
	socials: GraduateSocial[];
	playCount: number;
	/** Звідки запис прийшов. Лишається до кінця міграції — на нього посилаються звіти. */
	sourceUrl: string;
}

/** Відсортовано за роком випуску (новіші перші), у межах року — за іменем. */
export const GRADUATES: readonly GraduateIndexEntry[] = indexData as GraduateIndexEntry[];

/**
 * Розміри портретів, які справді існують у `static/graduates/`.
 *
 * Числа тут не декоративні: вони йдуть у `srcset` дескрипторами `w`, а
 * дескриптор мусить бути правдивим. Тому `fetch-graduate-photos.ts` і робить
 * сторону файлу рівно такою, як в його імені.
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
