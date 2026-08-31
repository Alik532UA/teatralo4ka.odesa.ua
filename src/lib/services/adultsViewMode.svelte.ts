import { browser } from '$app/environment';
import { storage } from './storage';
import type { ViewMode } from '$lib/components/adults/MasterViewToggle.svelte';

/**
 * Режим показу майстрів на `/residents/adults`: картки / галерея / компактно.
 *
 * ## Чому контролер, а не `$state` у сторінці
 *
 * Спершу вибір жив у самій сторінці й писався в `localStorage` напряму —
 * `localStorage.getItem('adults_view_mode')` в `onMount` і `setItem` в
 * обробнику. Два наслідки, обидва справжні:
 *
 * 1. **Ключ ішов БЕЗ префікса проєкту.** Сайт живе на спільному origin разом з
 *    іншими проєктами, і `adults_view_mode` там нічий. Правило
 *    `no-restricted-globals` у `eslint.config.js` це й ловило — і саме через
 *    ці два рядки `npm run lint` падав, а разом із ним у CI не виконувалися
 *    кроки `Unit tests`, `Audit` і `Validate static content`
 *    (STORAGE-NAMESPACE-v8, CI-CD-AND-TOOLS-v8 § 1.8).
 * 2. `onMount` для гідрації означає перший кадр із типовим значенням і
 *    перемальовування після нього. Конструктор під `browser` віддає правильне
 *    значення одразу.
 *
 * Форма взята з сусіднього [`adultsVisibility`](./adultsVisibility.svelte.ts) —
 * той самий розділ, той самий фасад, той самий спосіб гідрації. Наскрізний
 * запис у мутаторі, без `$effect`, що ганяється за станом (SVELTE-CORE-v8 § 1.9).
 */
const STORAGE_KEY = 'adults_view_mode';

const MODES = ['cards', 'gallery', 'compact'] as const satisfies readonly ViewMode[];

/**
 * Охоронець типу відкритий назовні: перемикач служить двом розділам із різними
 * наборами режимів і тому віддає рядок. Звужує той, хто знає свій набір, — тут
 * і в [`productionsViewMode`](./productionsViewMode.svelte.ts).
 */
export function isMode(value: string | null): value is ViewMode {
	return value !== null && (MODES as readonly string[]).includes(value);
}

class AdultsViewModeState {
	current = $state<ViewMode>('gallery');

	constructor() {
		if (browser) {
			const saved = storage.get(STORAGE_KEY);
			// Перевірка потрібна не лише проти сміття: значення могло лишитися з
			// редакції, де режимів було два.
			if (isMode(saved)) this.current = saved;
		}
	}

	/** Запис — там, де стан змінюється. Одна операція, а не ефект. */
	set(mode: ViewMode): void {
		this.current = mode;
		if (browser) storage.set(STORAGE_KEY, mode);
	}
}

export const adultsViewMode = new AdultsViewModeState();
