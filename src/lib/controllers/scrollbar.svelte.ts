import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';
import { ui } from './ui.svelte';

/**
 * Хто саме зараз показує положення на сторінці.
 *
 * Рішення винесене з компонентів у одне місце навмисно. Раніше і `PageScrollbar`,
 * і `Minimap` самі вішали й знімали клас, що ховає нативну смугу. При перемиканні
 * режимів це давало гонку: новий компонент клас ставив, а прибиральник старого
 * спрацьовував ПІСЛЯ нього й одразу знімав. Наслідок було видно — дві смуги
 * поруч, власна й системна.
 *
 * Тепер клас має рівно одного власника, а компоненти лише питають, чи їхня черга.
 */

/** Сенсорні пристрої лишаються з нативною: там прокрутка пальцем. */
const canHover = new MediaQuery('(hover: hover) and (pointer: fine)');
/** На вузьких екранах мінімапа з'їдала б корисну ширину. */
const wideEnough = new MediaQuery('(min-width: 1100px)');

export type ScrollbarControl = 'native' | 'custom' | 'minimap' | 'minimap-full';

class ScrollbarState {
	/**
	 * Обраний режим може виявитися недоступним — тоді лишається нативна смуга.
	 * Це не помилка, а свідомий відступ: краще звичайна робоча смуга, ніж жодної.
	 */
	readonly active = $derived.by<ScrollbarControl>(() => {
		if (!browser || !canHover.current) return 'native';
		const mode = ui.scrollbarMode;
		if (mode === 'custom') return 'custom';
		if ((mode === 'minimap' || mode === 'minimap-full') && wideEnough.current) return mode;
		return 'native';
	});

	/** Чи ховати нативну смугу. Єдине джерело правди для класу на `<html>`. */
	readonly hidesNative = $derived(this.active !== 'native');
}

export const scrollbar = new ScrollbarState();
