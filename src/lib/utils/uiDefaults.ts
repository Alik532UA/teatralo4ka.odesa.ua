import type { BackgroundType } from '$lib/config/backgroundOptions';
import type { ScrollbarMode } from '$lib/config/scrollbarModes';

/**
 * Що з типових значень адміністратора справді застосувати до цього відвідувача.
 *
 * Логіка винесена з `controllers/ui.svelte.ts` не заради розміру файлу, а заради
 * перевірок: усередині рунного класу її неможливо викликати з тесту, а правило
 * тут одне й важливе — **власний вибір відвідувача не перебивається ніколи**.
 * Інакше налаштування, зроблене відвідувачем, зникало б після кожної правки в
 * адмінці, і виглядало б це як поламане збереження.
 */

/** Те, що лежить у сховищі. `null` означає «відвідувач цього не вибирав». */
export interface StoredChoices {
	backgroundType: string | null;
	enableDynamicBackground: string | null;
	enableBlurEffect: string | null;
	scrollbarMode: string | null;
}

export interface AdminDefaults {
	defaultBackground: BackgroundType;
	defaultBlur: boolean;
	defaultScrollbar: ScrollbarMode;
}

/** Лише ті поля, які треба перезаписати. Відсутнє поле означає «не чіпати». */
export interface DefaultsToApply {
	backgroundType?: BackgroundType;
	enableDynamicBackground?: boolean;
	enableBlurEffect?: boolean;
	scrollbarMode?: ScrollbarMode;
}

export function defaultsToApply(saved: StoredChoices, admin: AdminDefaults): DefaultsToApply {
	const out: DefaultsToApply = {};

	/**
	 * Фон — це ДВА поля стану, а не одне: «Немає» означає вимкнений динамічний
	 * фон, а не окремий тип. Тому й перевіряти треба обидва ключі: відвідувач,
	 * який вибрав «Немає», зберіг лише `enableDynamicBackground`, а той, хто
	 * вибрав «Хвилі», — обидва. Дивитися лише на `backgroundType` означало б
	 * перебити вибір «Немає».
	 */
	if (saved.backgroundType === null && saved.enableDynamicBackground === null) {
		if (admin.defaultBackground === 0) {
			out.enableDynamicBackground = false;
		} else {
			out.backgroundType = admin.defaultBackground;
			out.enableDynamicBackground = true;
		}
	}

	if (saved.enableBlurEffect === null) {
		out.enableBlurEffect = admin.defaultBlur;
	}

	if (saved.scrollbarMode === null) {
		out.scrollbarMode = admin.defaultScrollbar;
	}

	return out;
}
