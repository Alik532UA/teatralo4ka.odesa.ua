// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	/**
	 * Номер збірки, який Vite підставляє з `package.json` (`define` у
	 * `vite.config.ts`). Оголошення тут, бо це не змінна модуля, а константа
	 * компіляції — без цього рядка TypeScript про неї не знає.
	 */
	const __APP_VERSION__: string;

	namespace App {
		/**
		 * Форма `page.error`. `message` — узагальнений безпечний текст, який
		 * повертає `handleError` у `hooks.client.ts`; `errorId` дає змогу знайти
		 * повний запис у `errorLogger.getCache()`, не показуючи його користувачу
		 * (ERROR-HANDLING-v8 § 2.4).
		 */
		interface Error {
			message: string;
			errorId?: string;
		}
		// interface Locals {}

		/**
		 * `seoDescription` — опис сторінки, який знає лише сама сторінка.
		 *
		 * Карта описів у `+layout.svelte` має п'ять постійних ключів, і цього
		 * достатньо, доки сторінок скінченна кількість. Сторінок випускників
		 * вісімдесят на кожну мову, і опис у кожної свій — з імені, років, майстрів
		 * і кількості вистав. Без цього поля виходило ДВА теги `description` на
		 * сторінці: один від layout, другий від сторінки, — а пошук бере перший,
		 * тобто саме загальний.
		 */
		interface PageData {
			seoDescription?: string;
		}

		/**
		 * Стан, який кладе `pushState` — картка випускника поверх галактики.
		 *
		 * Саме через стан сторінки, а не через локальну змінну компонента: у
		 * картки має бути власна адреса (`/projects/galaxy-graduates/15K`), і тоді
		 * кнопка «назад» мусить її закривати. `page.state` дає обидві половини
		 * задарма — браузер сам знімає стан на `popstate`.
		 */
		interface PageState {
			graduateCode?: string;
			graduateSlug?: string;
		}
		// interface Platform {}
	}

	/**
	 * Лічильник часу завантаження зі `static/perf.js`.
	 *
	 * Скрипт виконується до застосунку і не є частиною збірки, тому TypeScript
	 * про нього нічого не знає — раніше кожне звернення писалося як
	 * `(window as any).__perf`. Оголошення тут прибирає шість `any` і заразом
	 * фіксує форму запису: якщо `perf.js` зміниться, розійдеться саме тут.
	 *
	 * Поля необов'язкові: у SSR і в тестах скрипт не виконується взагалі.
	 */
	interface Window {
		__perf?: (label: string) => void;
		__perfLog?: { t: number; label: string }[];
		__perfT0?: number;
	}
}

export {};
