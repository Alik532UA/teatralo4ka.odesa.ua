/**
 * Рішення «чи це клік по email і по якому саме» — без жодних залежностей.
 *
 * Окремо від `emailCopy.ts` не заради краси: контролер тостів написаний на
 * рунах (`.svelte.ts`), а vitest у цьому проєкті працює без плагіна Svelte —
 * імпорт такого модуля валить увесь файл тесту ще до першого `it`. Проєкт уже
 * розв'язує це так само (`articleForm.ts`, `uiDefaults.ts`, `dropdownPlace.ts`):
 * логіка живе в чистій функції та перевіряється, а підключення до стану —
 * тонкий шар навколо неї.
 */

/** `mailto:` з можливими параметрами: `mailto:a@b.c?subject=…`. */
const MAILTO_HREF = /^mailto:([^?]*)/i;

/** Адреса з `href`, або `null`, якщо це не поштове посилання. */
export function emailFromHref(href: string | null | undefined): string | null {
	if (!href) return null;
	const m = MAILTO_HREF.exec(href.trim());
	if (!m) return null;
	try {
		const address = decodeURIComponent(m[1]).trim();
		return address.length > 0 ? address : null;
	} catch {
		// Некоректна escape-послідовність у href — беремо як є.
		return m[1].trim() || null;
	}
}

export interface MailtoClick {
	email: string;
	/** Саме посилання — до нього прив'яжеться тост (NOTIFICATIONS-v8 § 5). */
	anchor: HTMLAnchorElement;
}

/**
 * Розбирає клік: чи варто його перехоплювати і яка це адреса.
 *
 * `null` означає «не наша справа» — звичайне посилання, модифікатор, середня
 * кнопка або клік, який хтось уже обробив. Модифікатори лишаються браузеру
 * навмисно: `Ctrl`+клік це «відкрити інакше», і перехоплювати його означало б
 * зламати звичну поведінку.
 */
export function resolveMailtoClick(event: MouseEvent): MailtoClick | null {
	if (event.defaultPrevented || event.button !== 0) return null;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

	const target = event.target;
	if (!(target instanceof Element)) return null;

	// `closest`, бо ціллю кліку буває вміст усередині посилання: у markdown
	// сторінок пошта загорнута в `<svg>` і текст, а не лежить голим рядком.
	const link = target.closest('a[href]');
	if (!(link instanceof HTMLAnchorElement)) return null;

	// `getAttribute`, а не `.href`: другий уже нормалізований браузером.
	const email = emailFromHref(link.getAttribute('href'));
	return email ? { email, anchor: link } : null;
}
