import { calendarPageSeo } from '$lib/data/calendarText';
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad } from './$types';

export const prerender = true;

/*
 * Одна сторінка на всі роки: рік і вигляд плаката — у параметрах адреси
 * (`data/calendarView.ts`). Тут їх не читаємо й не можна: під prerender
 * SvelteKit забороняє `url.searchParams`, тож завантажувач віддає лише назву
 * й опис, а параметри застосовує сама сторінка після гідрації.
 */
export const load: PageLoad = ({ url }) => calendarPageSeo(localeFromPath(url.pathname));
