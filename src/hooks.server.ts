import type { Handle } from '@sveltejs/kit';
import { localeFromPath, DEFAULT_LOCALE } from '$lib/i18n/routing';

/**
 * `<html lang>` у ЗІБРАНОМУ HTML (I18N-v8 § 5.2, ACCESSIBILITY-v8 — обидва HIGH).
 *
 * Атрибут зашитий в `app.html` як `lang="uk"`, і клієнтський код виправляє його
 * після гідрації. Для англійських сторінок цього недостатньо: у прередереному
 * файлі — а це саме те, що читають пошуковий робот і диктор до запуску JS, —
 * лишалося б `lang="uk"` на англійському тексті.
 *
 * ## Чому заміна `lang="uk"`, а не власний плейсхолдер `%lang%`
 *
 * Плейсхолдер виглядає чистіше, але має тихий провальний режим: SvelteKit
 * підставляє лише свої `%sveltekit.*%`, тож якщо цей хук колись не виконається
 * для якоїсь сторінки, у HTML поїде буквальний `lang="%lang%"` — невалідний
 * атрибут, який ніхто не помітить, бо сторінка й далі малюється. Заміна
 * готового значення такого режиму не має взагалі: не спрацювало — лишилося
 * коректне `uk`.
 *
 * Хук виконується і під час prerender: `adapter-static` збирає сторінки
 * серверним білдом, тобто через `handle`.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const lang = localeFromPath(event.url.pathname);
	if (lang === DEFAULT_LOCALE) return resolve(event);

	return resolve(event, {
		// Заміна лише першого входження: рядок `lang="uk"` більше в `app.html`
		// не зустрічається, але `replace` без прапорця `g` тут ще й дешевший —
		// перетворення викликається на КОЖЕН фрагмент відповіді.
		transformPageChunk: ({ html }) => html.replace('lang="uk"', `lang="${lang}"`)
	});
};
