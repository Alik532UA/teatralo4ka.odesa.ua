import { pushState } from '$app/navigation';
import { page } from '$app/state';
import {
	LINKED_GRADUATES,
	graduateAddress,
	graduateProfilePath,
	type GraduateIndexEntry
} from '$lib/data/graduates';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';

/**
 * Відкриття картки випускника через АДРЕСУ, а не через локальний прапорець.
 *
 * У галактиці так було завжди: клік по зірці робить `pushState`, адреса стає
 * особистою сторінкою людини, і кнопка «назад» картку закриває. На сторінках
 * майстра й навчальної групи натомість стояло звичайне `selectedGraduate = …`,
 * тож адреса не змінювалася взагалі: посилання на відкриту картку не
 * скопіювати, «назад» виходило зі сторінки, а перезавантаження губило вибір.
 *
 * Розширення `.svelte.ts`, а не просто `.ts`: модуль читає реактивний
 * `page.state`, і `graduateFromPageState()` розрахований на виклик усередині
 * `$derived`. Практичний бік того самого — типоорієнтований ESLint увімкнено
 * лише для `.svelte` та `.svelte.ts` (див. `eslint.config.js`), тож у звичайному
 * `.ts` правило `svelte/no-navigation-without-resolve` не бачить, що адреса вже
 * має тип `ResolvedPathname`, і лається на `pushState`.
 *
 * Логіка зібрана сюди, а не скопійована втретє, бо всі три місця мусять
 * поводитися однаково: розійшовшись, вони дали б ту саму зірку, що на одній
 * сторінці міняє адресу, а на іншій ні.
 */

/**
 * Кладе випускника в стан сторінки й переписує адресу.
 *
 * Адреса міняється ЗАВЖДИ. Доти тут стояла розвилка: у кого немає `code`, тому
 * `pushState('')` — тобто стан кладеться, а адреса лишається чужою. Це було
 * правдою, доки власної сторінки в тих 440 не існувало; відколи вона є, розвилка
 * лише ховала її від людини, яка вже стоїть на картці.
 */
export function openGraduateModal(graduate: GraduateIndexEntry): void {
	/*
	 * `resolve()` тут не викликається свідомо — під SSR він віддає ВІДНОСНИЙ
	 * шлях, і мовний префікс поверх нього дає `/en../../../projects/…`. Замість
	 * вимкнення правила `svelte/no-navigation-without-resolve` адреса
	 * ТИПІЗОВАНА: `graduateProfilePath` віддає `Pathname`, `localizedPath` —
	 * `ResolvedPathname`, і саме за типом правило визнає її перевіреною.
	 */
	const href = localizedPath(
		graduateProfilePath(graduateAddress(graduate)),
		localeFromPath(page.url.pathname)
	);
	pushState(href, { graduateAddress: graduateAddress(graduate) });
}

/**
 * Випускник, якого зараз показує стан сторінки, або `null`.
 *
 * Пошук іде по ПОВНОМУ реєстру, а не по списку конкретної сторінки: реєстр і
 * так цілком приходить на клієнт, зате картка знайдеться незалежно від того,
 * хто саме її відкрив — склад групи, потік учнів майстра чи зірка в галактиці.
 */
export function graduateFromPageState(): GraduateIndexEntry | null {
	const { graduateAddress: адреса } = page.state;
	if (!адреса) return null;
	return LINKED_GRADUATES.find((graduate) => graduateAddress(graduate) === адреса) ?? null;
}

/**
 * Закриває картку.
 *
 * Саме `history.back()`, а не скидання стану: стан поклав `pushState`, тож
 * зняти його має історія. Інакше в ній лишився б запис, з якого «назад»
 * відкриває картку знову.
 */
export function closeGraduateModal(): void {
	history.back();
}
