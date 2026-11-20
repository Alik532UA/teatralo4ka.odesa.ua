/**
 * Що просить адреса: показати, сховати чи нічого.
 *
 * Чиста функція, що розбирає службові параметри перемикання видимості
 * (наприклад `?early=1` / `?early=0` або `?theme-lab=1` / `?theme-lab=0`).
 * `1` і `0` — типові значення.
 * Будь-що інше — `null`: адреса не про це.
 */
export function visibilityFromUrl(value: string | null): boolean | null {
	if (value === '1') return true;
	if (value === '0') return false;
	return null;
}
