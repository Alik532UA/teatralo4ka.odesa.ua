// Відносні імпорти, а не `$lib`: цей модуль читає ще й `scripts/generate-sitemap.ts`,
// який виконується в Node через tsx, де аліасів SvelteKit не існує. Так само
// зроблено в `mastersVisibility.ts`, `hiddenRoutes.ts` і `redirects.ts`.
//
// Дані беруться з `graduates.index.json` НАПРЯМУ, а не через `data/graduates.ts`:
// той модуль імпортує `asset` із `$app/paths`, тобто в tsx падає ще на імпорті.
import { stripLocale } from '../i18n/routing';
import graduatesIndexData from '../data/graduates.index.json';

/**
 * «Прихований» випускник — і що саме це означає.
 *
 * ## Чотири обіцянки, і четверта протилежна першим трьом
 *
 *   1. галактика, перелік випускників, склади вистав і фестивалі його не
 *      показують — це робить `hidden` у `graduates.ts`, який викидає запис із
 *      `GRADUATES`;
 *   2. `+layout.ts` віддає сторінці `noindex` і не малює `canonical`/`hreflang`;
 *   3. `generate-sitemap.ts` не кладе адресу в мапу сайту;
 *   4. сама сторінка ЛИШАЄТЬСЯ живою за прямим посиланням.
 *
 * Четверте — вимога, а не недогляд. Адреса випускника це ідентифікатор, який
 * людина роздає роками (у цьому проєкті вона й досі повторює стару адресу з
 * Google-сайту), і перетворити її на 404 означало б «людину видалили», а не
 * «людину не показуємо в переліках».
 *
 * Модель та сама, що для майстрів у `mastersVisibility.ts`: «поза індексом», а
 * не «не існує».
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
	hidden?: boolean;
}

/** Чи показуємо цей запис у переліках. Поля немає = показуємо. */
export function isGraduateRecordPublic(g: { hidden?: boolean }): boolean {
	return g.hidden !== true;
}

const HIDDEN_ADDRESSES: ReadonlySet<string> = new Set(
	(graduatesIndexData satisfies readonly GraduateVisibility[])
		.filter((g) => !isGraduateRecordPublic(g))
		.map((g) => g.code ?? g.slug)
);

/** Адреса сторінки випускника без мовного префікса, або `null`. */
function graduateAddressFromPath(pathname: string): string | null {
	const bare = stripLocale(pathname).replace(/\/+$/, '') || '/';
	const match = /^\/projects\/galaxy-graduates\/([^/]+)$/.exec(bare);
	return match ? match[1] : null;
}

/**
 * Чи ця адреса — сторінка випускника, якого ми не показуємо.
 *
 * Хвостова коса риска знімається (`trailingSlash: 'always'` дає її в адресі, а
 * обхід `build/` — ні), мовний префікс теж: `/en/projects/galaxy-graduates/x` —
 * та сама людина.
 *
 * Підрозділи галактики (`/plays/…`, `/groups/…`, `/festivals/…`) сюди не
 * потрапляють: у них два сегменти після `galaxy-graduates`, а тут рівно один.
 */
export function isHiddenGraduatePath(pathname: string): boolean {
	const address = graduateAddressFromPath(pathname);
	return address !== null && HIDDEN_ADDRESSES.has(address);
}

/** Скільки записів приховано. Для звітів збірки — щоб «нуль» був видимим. */
export function hiddenGraduatesCount(): number {
	return HIDDEN_ADDRESSES.size;
}
