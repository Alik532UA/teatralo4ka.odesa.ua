// Відносні імпорти, а не `$lib`: цей модуль читає ще й `scripts/generate-sitemap.ts`,
// який виконується в Node через tsx, де аліасів SvelteKit не існує. Так само
// зроблено в `mastersVisibility.ts`, `hiddenRoutes.ts` і `redirects.ts`.
//
// Дані беруться з `graduates.index.json` НАПРЯМУ, а не через `data/graduates.ts`:
// той модуль імпортує `asset` із `$app/paths`, тобто в tsx падає ще на імпорті.
import { stripLocale } from '../i18n/routing';
import graduatesIndexData from '../data/graduates.index.json';
import { isLinked, isListed } from './visibility';

/**
 * Видимість випускника — три рівні, спільні з працівниками (`./visibility.ts`).
 *
 * ## Що означає кожен рівень саме тут
 *
 *   `listed` (поля немає) — зірка в галактиці, рядок у реєстрі, картки за
 *      зв'язками, сторінка індексується. Перелік — `GRADUATES`.
 *   `linked` — з галактики й реєстру викинутий, але в складах вистав, групах,
 *      фестивалях, потоках учнів майстра й у зв'язку «також працівник»
 *      показується (`LINKED_GRADUATES`); сторінка жива, `noindex`, не в мапі
 *      сайту. Це учні, ті, хто не закінчив, і випускники, яких у галактиці
 *      показувати не треба, а зв'язки — треба.
 *   `direct` — не показується нікуди, зв'язки в даних збираються; сторінка
 *      жива лише за прямим посиланням.
 *
 * Статус людини («хто») — окреме поле `kind` у `data/graduates.ts`, і від
 * видимості він не залежить: той, хто не закінчив, буває і в галактиці
 * (Розводюк), і лише за зв'язками (Тимофієнко), і лише за посиланням
 * (Захарченко).
 *
 * ## Чотири обіцянки, і четверта протилежна першим трьом
 *
 *   1. галактика, перелік випускників і роки випуску людину не показують — це
 *      робить `GRADUATES` у `graduates.ts`, який лишає лише `listed`; склади
 *      вистав, групи й фестивалі читають `LINKED_GRADUATES` і викидають лише
 *      `direct`;
 *   2. `+layout.ts` віддає сторінці `noindex` і не малює `canonical`/`hreflang`
 *      для обох нижніх рівнів;
 *   3. `generate-sitemap.ts` не кладе адресу в мапу сайту;
 *   4. сама сторінка ЛИШАЄТЬСЯ живою за прямим посиланням.
 *
 * Четверте — вимога, а не недогляд. Адреса випускника це ідентифікатор, який
 * людина роздає роками (у цьому проєкті вона й досі повторює стару адресу з
 * Google-сайту), і перетворити її на 404 означало б «людину видалили», а не
 * «людину не показуємо в переліках».
 *
 * Модель та сама, що для працівників у `mastersVisibility.ts`: «поза індексом»,
 * а не «не існує».
 *
 * ## Чому адреса, а не `slug`
 *
 * Сторінка живе за `code ?? slug` (`graduateAddress`): у 90 із 531 адреса
 * повторює стару з Google-сайту. Порівнювати тільки `slug` означало б не впізнати
 * саме тих, у кого адреса особлива.
 */
export interface GraduateVisibility {
	slug: string;
	code?: string;
	/** Рівень; поля немає — `listed`. Рядком, бо з JSON літерал не виводиться. */
	visibility?: string;
}

/** У переліку: галактика, реєстр, роки випуску. Поля немає = так. */
export function isGraduateListed(g: { visibility?: string }): boolean {
	return isListed(g);
}

/** Показуємо там, де є зв'язок: `listed` і `linked`. */
export function isGraduateLinked(g: { visibility?: string }): boolean {
	return isLinked(g);
}

/** Адреси поза індексом — рівні `linked` і `direct`. */
const UNLISTED_ADDRESSES: ReadonlySet<string> = new Set(
	(graduatesIndexData satisfies readonly GraduateVisibility[])
		.filter((g) => !isGraduateListed(g))
		.map((g) => g.code ?? g.slug)
);

/** Адреса сторінки випускника без мовного префікса, або `null`. */
function graduateAddressFromPath(pathname: string): string | null {
	const bare = stripLocale(pathname).replace(/\/+$/, '') || '/';
	const match = /^\/projects\/galaxy-graduates\/([^/]+)$/.exec(bare);
	return match ? match[1] : null;
}

/**
 * Чи ця адреса — сторінка випускника поза індексом (`linked` або `direct`).
 *
 * Хвостова коса риска знімається (`trailingSlash: 'always'` дає її в адресі, а
 * обхід `build/` — ні), мовний префікс теж: `/en/projects/galaxy-graduates/x` —
 * та сама людина.
 *
 * Підрозділи галактики (`/plays/…`, `/groups/…`, `/festivals/…`) сюди не
 * потрапляють: у них два сегменти після `galaxy-graduates`, а тут рівно один.
 */
export function isUnlistedGraduatePath(pathname: string): boolean {
	const address = graduateAddressFromPath(pathname);
	return address !== null && UNLISTED_ADDRESSES.has(address);
}

/** Скільки записів поза індексом. Для звітів збірки — щоб «нуль» був видимим. */
export function unlistedGraduatesCount(): number {
	return UNLISTED_ADDRESSES.size;
}
