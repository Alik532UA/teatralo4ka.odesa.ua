import type { HandleClientError } from '@sveltejs/kit';
import { migrateStorageKeys } from '$lib/utils/storageMigration';
import { errorLogger } from '$lib/services/errorLogger';

/**
 * Client init hook — runs once when the app starts in the browser, before the
 * route modules evaluate. That is early enough to migrate legacy (unprefixed)
 * localStorage keys before controllers/services read them (the `ui` singleton,
 * for example, reads localStorage in its constructor at import time).
 *
 * Placed here rather than in +layout.svelte because +layout imports those
 * controllers at the top, so their storage reads happen before any +layout code.
 */
export function init() {
	migrateStorageKeys();
}

/**
 * Неперехоплені помилки клієнта (ERROR-HANDLING-v8 § 2.4).
 *
 * До цього гачка не було, і `errorLogger` разом із ним: сервіс був написаний,
 * покритий дев'ятьма тестами й **не імпортований нізвідки** — рівно той випадок
 * «існування ≠ досяжність» із AI-AGENT-PITFALLS-v8 § 3, коли зелені тести
 * створюють враження працюючого логування помилок, якого немає.
 *
 * Повертається УЗАГАЛЬНЕНЕ повідомлення, а не `error.message`: те, що прийшло
 * б від рантайму («Cannot read properties of undefined»), для відвідувача
 * театральної студії не інформація, а витік нутрощів (CRITICAL у § анти-патернів).
 * `errorId` лишається в об'єкті — його видно на сторінці помилки й можна
 * назвати в листі; за ним запис знаходиться в `errorLogger.getCache()`.
 *
 * Гачок спрацьовує лише на НЕОЧІКУВАНІ помилки: `error()` і `redirect()` через
 * нього не проходять, тож 404 сюди не потрапляє.
 */
export const handleError: HandleClientError = ({ error, event, status }) => {
	// `status` 404 сюди не приходить, але перестрахуватися дешевше, ніж потім
	// розбирати шум у кеші.
	if (status === 404) return;

	const normalized = error instanceof Error ? error : new Error(String(error));
	const errorId = errorLogger.logError(normalized, {
		component: 'client-unhandled',
		page: event?.url?.pathname
	});

	return { message: 'Something went wrong', errorId };
};
