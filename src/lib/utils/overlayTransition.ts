import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/**
 * Поява й зникнення вікон поверх сторінки: картки випускника й аркуша реєстру.
 *
 * Доти обидва просто виникали й зникали в одному кадрі. На повний екран це
 * читається як стрибок: погляд не встигає зрозуміти, що з'явилося нове вікно, а
 * не підмінилася сторінка.
 *
 * Спільний модуль, а не два описи поруч: обидва вікна відкриваються тим самим
 * жестом (клік по імені) і мусять поводитися однаково. Розійшовшись, вони дали
 * б відчуття, що одне з них «швидше», хоча різниця була б лише в числах.
 *
 * Прохання про менший рух виконується ТУТ, а не в CSS: тривалість переходу
 * задає JavaScript, і медіазапит до неї не дотягується.
 */
function stillness(): boolean {
	return (
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/** Затемнення під вікном: просто проявляється. */
export function overlayFade(
	_node: Element,
	{ duration = 220 }: { duration?: number } = {}
): TransitionConfig {
	return {
		duration: stillness() ? 0 : duration,
		easing: cubicOut,
		css: (t) => `opacity: ${t};`
	};
}

/**
 * Саме вікно: проявляється, трохи під'їжджає знизу й доростає до свого розміру.
 *
 * Рух описується через `transform`, а не `translate`: обидва вікна вже
 * користуються властивістю `translate` для центрування (`-50%`), і перехід,
 * який писав би в неї, збив би їх убік. Дві властивості складаються, тож
 * центрування лишається недоторканим.
 */
export function overlayPop(
	_node: Element,
	{ duration = 260, y = 14, from = 0.97 }: { duration?: number; y?: number; from?: number } = {}
): TransitionConfig {
	return {
		duration: stillness() ? 0 : duration,
		easing: cubicOut,
		css: (t, u) =>
			`opacity: ${t}; transform: translateY(${u * y}px) scale(${from + (1 - from) * t});`
	};
}
