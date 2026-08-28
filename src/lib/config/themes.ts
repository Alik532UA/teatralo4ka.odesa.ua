/**
 * Порядок, у якому клавіша `T` перебирає теми — і що з нього випливає для UI.
 *
 * ## Чому в конфізі, а не там, де перебирає
 *
 * Споживачів у порядку двоє, і вони РІЗНІ за природою: обробник клавіші
 * (`ui/ServiceLayer.svelte`) із нього рахує наступну тему, а панель налаштувань
 * — яку саме кнопку `T` натисне наступною, щоб повідомити про це скорочення
 * (`aria-keyshortcuts`, HOTKEYS-v8 § 5). Порядок кнопок у панелі при цьому
 * ІНШИЙ — світла, світло-жовта, жовта, темна, — тобто з розмітки цей порядок не
 * виводиться й копія в ній розійшлася б із першою мовчки: підказка вказувала б
 * на кнопку, якої клавіша не натискає.
 *
 * ## Чому саме такий порядок
 *
 * Від найсвітлішої до найтемнішої, з жовтою парою всередині: перебір читається
 * як плавне затемнення, а не як стрибки між родинами кольорів.
 */

import { dev } from '$app/environment';

export type Theme = 'light' | 'light-yellow' | 'yellow' | 'dark' | 'dark-cyan';

/** Публічний перелік тем для продакшену (4 теми). */
export const PROD_THEME_CYCLE = ['light', 'light-yellow', 'dark', 'dark-cyan'] as const satisfies readonly Theme[];

/** Розширений перелік для dev (включає dev-test-01 / yellow). */
export const DEV_THEME_CYCLE = ['light', 'light-yellow', 'yellow', 'dark', 'dark-cyan'] as const satisfies readonly Theme[];

/**
 * Кортеж, а не масив: `as const` дає точний тип елементів, тож `nextTheme`
 * повертає `Theme`, а не `string`, і додавання теми одразу видно в типах.
 */
export const THEME_CYCLE: readonly Theme[] = dev ? DEV_THEME_CYCLE : PROD_THEME_CYCLE;

/**
 * Наступна тема в переборі.
 *
 * `indexOf` повертає `-1` для значення поза кортежем, і `(-1 + 1) % N === 0`
 * дає першу тему — тобто невідома тема (стара збережена, чужий запис у сховищі)
 * перебором ЛІКУЄТЬСЯ, а не гасить клавішу.
 */
export function nextTheme(current: Theme, isDev: boolean = dev): Theme {
	const cycle: readonly Theme[] = isDev ? DEV_THEME_CYCLE : PROD_THEME_CYCLE;
	const index = cycle.indexOf(current);
	return cycle[(index + 1) % cycle.length];
}
