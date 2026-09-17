import { redirect } from '@sveltejs/kit';
import { expertPath } from '$lib/data/experts';
import { MOVED_EXPERT_SLUGS } from '$lib/config/renamedAddresses';
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

/*
 * Перелік ЗАМОРОЖЕНИЙ, а не взятий із реєстру: інакше кожен доданий потім
 * майстер діставав би заглушку на адресу, якої ніколи не було, — і вона
 * потрапляла б у мапу сайту порожньою сторінкою. Саме так і сталося з Оксаною
 * Дмітрієвою через годину після переїзду.
 */
export const entries: EntryGenerator = () =>
	Object.keys(MOVED_EXPERT_SLUGS).map((slug) => ({ slug }));

export const load: PageLoad = ({ params, url }) => {
	/* Ціль — НОВА адреса: у чотирьох вона інакша, бо слуг став повним. */
	const куди = MOVED_EXPERT_SLUGS[params.slug] ?? params.slug;
	redirect(301, localizedPath(expertPath(куди), localeFromPath(url.pathname)));
};
