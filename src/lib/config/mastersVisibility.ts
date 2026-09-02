// Відносні імпорти, а не `$lib`: цей модуль читає ще й `scripts/generate-sitemap.ts`,
// який виконується в Node через tsx, де аліасів SvelteKit не існує. Так само
// зроблено в `hiddenRoutes.ts` і `redirects.ts` — і з тієї самої причини.
//
// Дані беруться з `masters.index.json` НАПРЯМУ, а не через `data/masters.ts`:
// той модуль імпортує `asset` із `$app/paths`, тобто в tsx падає ще на імпорті.
import { stripLocale } from '../i18n/routing';
import mastersIndexData from '../data/masters.index.json';
import { isLinked, isListed } from './visibility';

/**
 * Видимість працівника — три рівні, спільні з випускниками (`./visibility.ts`).
 *
 *   `listed` (поля немає) — картка на `/residents/adults`, сторінка індексується.
 *   `linked` — картки в списку немає, але скрізь, де є зв'язок, людина
 *      показується: у майстрах вистави, в анкеті випускника, у кнопці «також
 *      випускник» (`dualRole.ts`), серед майстрів за згадками; сторінка жива,
 *      `noindex`, не в мапі сайту. Заміряно 2026-09-02: таких 28, і на
 *      чотирьох указують анкети (Туманов, Дроботов, Радзіховський, Полякова).
 *   `direct` — не показується нікуди; сторінка лише за прямим посиланням.
 *      Записів такого рівня серед працівників поки немає.
 *
 * До 2026-09-02 тут був прапорець `visible: false`, і він означав саме
 * `linked` — а однойменний за змістом `hidden` у випускників означав `direct`.
 * Одне поле з трьома значеннями в обох реєстрах прибрало цю плутанину.
 *
 * ## Чому це окремий модуль, а не прапорець у розмітці списку
 *
 * Прибрати людину зі списку — це одна з ЧОТИРЬОХ обіцянок, і решта три ламаються
 * окремо й тихо:
 *
 *   1. список `/residents/adults` не малює картку (`getListedMasters`);
 *   2. `+layout.ts` віддає сторінці `noindex` і не малює `canonical`/`hreflang`;
 *   3. `generate-sitemap.ts` не кладе адресу в мапу сайту;
 *   4. сама сторінка ЛИШАЄТЬСЯ живою.
 *
 * Четверте — не недогляд, а вимога: на 26 майстрів указують випускники
 * (`masters[]`/`teachers[]` у `graduates.index.json`), і прибрати сторінку
 * означало б перетворити ці посилання в 404. Тому тут саме «поза індексом», а не
 * «не існує» — та сама модель, що в `hiddenRoutes.ts`.
 *
 * ## Чому НЕ через `HIDDEN_ROUTES`, хоч модель та сама
 *
 * Той реєстр — кортеж `as const`, і на нього спираються чотири інваріанти:
 * адреса мусить бути в `prerender.entries`, дослівно повторена в
 * `HIDDEN_ENTRIES` у `svelte.config.js`, закрита `Disallow` у `robots.txt` і не
 * згадана більше ніде в коді. Для 77 сторінок це дало б 154 рядки `Disallow` у
 * ВОСЬМИ групах `robots.txt` — і зробило б протилежне до потрібного: закрита
 * `Disallow` сторінка не читається краулером, тобто `noindex` у ній не буде
 * прочитаний НІКОЛИ, і вже проіндексована адреса лишиться в індексі. Для зняття
 * з індексу правильний інструмент — саме `noindex` без `Disallow`.
 *
 * ## Типове значення — `listed`
 *
 * Поля немає у переважній більшості записів, і це означає «усюди». Рівень
 * ставлять руками; інакше 117 записів довелося б розмітити словом «так», і
 * забуте поле в новому записі ховало б людину без жодної помилки.
 */
export interface MasterVisibility {
	/** Рівень; поля немає — `listed`. Рядком, бо з JSON літерал не виводиться. */
	visibility?: string;
}

/** У переліку на `/residents/adults`. Поля немає = так. */
export function isMasterListed(m: MasterVisibility): boolean {
	return isListed(m);
}

/** Показуємо там, де є зв'язок: `listed` і `linked`. */
export function isMasterLinked(m: MasterVisibility): boolean {
	return isLinked(m);
}

/** Адреси поза індексом — рівні `linked` і `direct`. */
const UNLISTED_SLUGS: ReadonlySet<string> = new Set(
	(mastersIndexData satisfies readonly { slug: string; visibility?: string }[])
		.filter((m) => !isMasterListed(m))
		.map((m) => m.slug)
);

/** Адреса сторінки майстра без мовного префікса, або `null`, якщо це не вона. */
function masterSlugFromPath(pathname: string): string | null {
	const bare = stripLocale(pathname).replace(/\/+$/, '') || '/';
	const match = /^\/residents\/adults\/([^/]+)$/.exec(bare);
	return match ? match[1] : null;
}

/**
 * Чи ця адреса — сторінка майстра поза індексом (`linked` або `direct`).
 *
 * Хвостова коса риска знімається: `trailingSlash: 'always'` дає її в адресі, а
 * обхід `build/` у `generate-sitemap.ts` — ні. Мовний префікс теж:
 * `/en/residents/adults/x` — та сама людина, що й `/residents/adults/x`, і
 * забути про це означало б залишити англійське дзеркало в мапі сайту.
 */
export function isUnlistedMasterPath(pathname: string): boolean {
	const slug = masterSlugFromPath(pathname);
	return slug !== null && UNLISTED_SLUGS.has(slug);
}

/** Скільки записів поза індексом. Для звітів збірки — щоб «нуль» був видимим. */
export function unlistedMastersCount(): number {
	return UNLISTED_SLUGS.size;
}
