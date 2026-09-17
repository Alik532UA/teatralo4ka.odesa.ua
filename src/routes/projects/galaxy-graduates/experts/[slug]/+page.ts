import { redirect } from '@sveltejs/kit';
import { EXPERTS, expertPath } from '$lib/data/experts';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import type { PageLoad, EntryGenerator } from './$types';

/**
 * Стара адреса розділу: `/experts/<хто>` → `/masters/<хто>`.
 *
 * ## Чому маршрут лишився, хоч сторінка переїхала
 *
 * Розділ перейменовано 17 вересня 2026: назва «Експертна Рада» була неправдою
 * для дванадцятьох із тридцяти семи (розбір і заміри — у докблоці
 * `config/renamedAddresses.ts`). Але стара адреса вже роздана: на неї ведуть
 * посилання в текстах новин і в тому, що люди собі зберегли.
 *
 * Прибрати теку означало б віддати їм «Сторінку не знайдено». Тому тут
 * лишилася ЛИШЕ заглушка: `entries()` перелічує всіх, щоб кожна стара адреса
 * потрапила в збірку, а `load` одразу відправляє далі. Той самий прийом і те
 * саме пояснення — у маршруті вистав (`plays/[id]`), де адреси міняли раніше.
 *
 * Своєї розмітки в неї немає: `load` перериває показ, і компонент не
 * встигає намалюватися — але маршрут без нього не існує, тож `+page.svelte`
 * поруч порожній.
 */
export const prerender = true;

export const entries: EntryGenerator = () => EXPERTS.map((e) => ({ slug: e.slug }));

export const load: PageLoad = ({ params, url }) => {
	redirect(301, localizedPath(expertPath(params.slug), localeFromPath(url.pathname)));
};
