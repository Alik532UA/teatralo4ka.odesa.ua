// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
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
