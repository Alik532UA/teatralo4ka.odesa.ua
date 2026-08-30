// Відносні імпорти, а не `$lib`: цей модуль читає ще й `scripts/generate-sitemap.ts`,
// який виконується в Node через tsx, де аліасів SvelteKit не існує. Так само
// зроблено в `hiddenRoutes.ts` і `redirects.ts` — і з тієї самої причини.
//
// Дані беруться з `masters.index.json` НАПРЯМУ, а не через `data/masters.ts`:
// той модуль імпортує `asset` із `$app/paths`, тобто в tsx падає ще на імпорті.
import { stripLocale } from '../i18n/routing';
import mastersIndexData from '../data/masters.index.json';

/**
 * «Відображаємо на сайті: так/ні» — і що саме означає «ні».
 *
 * ## Чому це окремий модуль, а не прапорець у розмітці списку
 *
 * Прибрати людину зі списку — це одна з ЧОТИРЬОХ обіцянок, і решта три ламаються
 * окремо й тихо:
 *
 *   1. список `/residents/adults` не малює картку;
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
 * ## Типове значення — «показуємо»
 *
 * Поля немає в жодному записі, і це означає «так». Прапорець — виняток, який
 * ставлять руками; інакше 118 записів довелося б розмітити словом «так», і
 * забуте поле в новому записі ховало б людину без жодної помилки.
 */
export interface MasterVisibility {
	visible?: boolean;
}

/** Чи показуємо цей запис на сайті. Поля немає = показуємо. */
export function isMasterRecordPublic(m: MasterVisibility): boolean {
	return m.visible !== false;
}

const HIDDEN_SLUGS: ReadonlySet<string> = new Set(
	(mastersIndexData satisfies readonly { slug: string; visible?: boolean }[])
		.filter((m) => !isMasterRecordPublic(m))
		.map((m) => m.slug)
);

/** Адреса сторінки майстра без мовного префікса, або `null`, якщо це не вона. */
function masterSlugFromPath(pathname: string): string | null {
	const bare = stripLocale(pathname).replace(/\/+$/, '') || '/';
	const match = /^\/residents\/adults\/([^/]+)$/.exec(bare);
	return match ? match[1] : null;
}

/**
 * Чи ця адреса — сторінка майстра, якого ми не показуємо.
 *
 * Хвостова коса риска знімається: `trailingSlash: 'always'` дає її в адресі, а
 * обхід `build/` у `generate-sitemap.ts` — ні. Мовний префікс теж:
 * `/en/residents/adults/x` — та сама людина, що й `/residents/adults/x`, і
 * забути про це означало б залишити англійське дзеркало в мапі сайту.
 */
export function isHiddenMasterPath(pathname: string): boolean {
	const slug = masterSlugFromPath(pathname);
	return slug !== null && HIDDEN_SLUGS.has(slug);
}

/** Скільки записів приховано. Для звітів збірки — щоб «нуль» був видимим. */
export function hiddenMastersCount(): number {
	return HIDDEN_SLUGS.size;
}
