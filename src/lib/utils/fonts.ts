/**
 * Гарантування завантаження та декодування веб-шрифтів перед друком або рендерингом.
 *
 * ## Чому це критично для друку
 *
 * Шрифти `e-Ukraine` мають `font-display: swap`. Коли користувач натискає друк
 * або викликає `window.print()`, браузер синхронно знімає сторінку для друку.
 * Якщо файл шрифту ще не декодовано у пам'ять, браузер миттєво підставляє системний
 * шрифт (Arial / Segoe UI sans-serif) у документ попереднього перегляду друку.
 *
 * При повторному відкритті шрифт уже декодований у пам'яті, тому друкується правильно.
 * Щоб уникнути цього стрибка, ми обов'язково очікуємо `document.fonts.load(...)`
 * та `document.fonts.ready` перед викликом `window.print()`.
 */

export const E_UKRAINE_FONT_TARGETS = [
	'700 16px "e-Ukraine"',
	'500 16px "e-Ukraine"',
	'400 16px "e-Ukraine"'
] as const;

export async function ensureFontsReady(
	targets: readonly string[] = E_UKRAINE_FONT_TARGETS
): Promise<void> {
	if (typeof document === 'undefined' || !('fonts' in document)) return;

	try {
		await Promise.all([
			...targets.map((font) => document.fonts.load(font)),
			document.fonts.ready
		]);
	} catch {
		// Якщо браузер або мережа збійнули, не блокуємо подальший виклик друку
	}
}
