/**
 * Куди відкрити панель випадайки: вниз чи вгору, і якої висоти.
 *
 * Винесено з компонентів заради перевірок. Уся складність випадайки саме тут, і
 * побачити помилку можна лише на конкретній сторінці з конкретною висотою вікна
 * — тобто випадково. Кнопка ж навпаки: у неї в кожному місці свій вигляд, і
 * спільного в ній нічого немає.
 *
 * Дефект, від якого це написано: панель відкривалася завжди вниз і просто
 * обрізалася кінцем сторінки — останні пункти ставали недосяжними. Нативний
 * `<select>` так не робить ніколи.
 */

export interface Rect {
	top: number;
	bottom: number;
	left: number;
	width: number;
}

export interface Viewport {
	width: number;
	height: number;
}

export interface Placement {
	left: number;
	top: number;
	width: number;
	maxHeight: number;
	/** Чи відкрилися вгору — потрібне для тіні й тестів. */
	above: boolean;
}

export interface PlaceOptions {
	/** Відступ від кнопки і від краю екрана. */
	edge?: number;
	/** Бажана висота; менша береться, коли місця немає. */
	preferredHeight?: number;
	/** Менше цього місця вниз не вважаємо придатним. */
	minHeight?: number;
	/** Панель не вужча за це, навіть коли кнопка вузька. */
	minWidth?: number;
}

export function placePanel(
	trigger: Rect,
	viewport: Viewport,
	options: PlaceOptions = {}
): Placement {
	const edge = options.edge ?? 8;
	const preferredHeight = options.preferredHeight ?? 320;
	const minHeight = options.minHeight ?? 120;
	const minWidth = options.minWidth ?? 200;

	const below = viewport.height - trigger.bottom - edge;
	const above = trigger.top - edge;

	/**
	 * Напрямок вибирається порівнянням реального місця з обох боків, а не
	 * питанням «чи влазить бажана висота».
	 *
	 * Якби умовою було `below < preferredHeight`, то на невисокому вікні панель
	 * ішла б угору навіть тоді, коли вниз місця більше — і обрізалася б уже
	 * зверху. Тому вгору йдемо лише коли вниз справді тісно І вгорі просторіше.
	 */
	const useAbove = below < minHeight && above > below;
	const room = useAbove ? above : below;

	// `minHeight` як підлога: якщо місця немає з обох боків, панель усе одно
	// показуємо — із власною прокруткою вона лишається придатною.
	const maxHeight = Math.max(Math.min(preferredHeight, room), minHeight);

	const width = Math.max(trigger.width, minWidth);
	// Не за правим краєм і не за лівим: `max` після `min` важливий саме в такому
	// порядку, інакше на вузькому вікні панель поїхала б у відʼємні координати.
	const left = Math.max(edge, Math.min(trigger.left, viewport.width - width - edge));

	return {
		left,
		width,
		maxHeight,
		above: useAbove,
		top: useAbove ? Math.max(edge, trigger.top - edge - maxHeight) : trigger.bottom + edge
	};
}
