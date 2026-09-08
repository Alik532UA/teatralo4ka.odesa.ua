/**
 * Перетягування плаваючого вікна вказівником — арифметика без розмітки.
 *
 * ## Чому окремо від компонента
 *
 * Це самодостатня відповідальність: узяти, порахувати нове місце, утримати в
 * межах екрана, відпустити. Компонент, який її містив, переріс стелю рядків —
 * але шов тут не через стелю, а тому що в цьому коді немає нічого про кольори,
 * а в компоненті нічого про піксельну арифметику.
 *
 * ## Три речі, які легко забути й важко помітити
 *
 * `pointer*`, а не `mouse*`: те саме працює пальцем, а дизайнер сидить на
 * планшеті. `setPointerCapture` — щоб швидкий рух за межі вікна не «загубив»
 * перетягування на півдорозі. І прапорець `moved`: `pointerup` тягне за собою
 * `click`, тож без нього кожне перетягування закінчувалося б спрацюванням
 * кнопки, за яку тягли.
 */

export interface Spot {
	x: number;
	y: number;
}

export interface WindowDragOptions {
	/** Саме вікно за елементом, на якому лежить обробник. */
	frame: (handle: HTMLElement) => HTMLElement | null;
	onMove: (spot: Spot) => void;
	onEnd: () => void;
	/** Скільки вікна мусить лишитися на екрані, щоб його можна було повернути. */
	edge?: number;
}

export function createWindowDrag(options: WindowDragOptions) {
	const край = options.edge ?? 24;
	let зсув: Spot = { x: 0, y: 0 };

	const стан = $state({ dragging: false, moved: false });

	function рамка(подія: PointerEvent): HTMLElement | null {
		const ручка = подія.currentTarget as HTMLElement | null;
		return ручка ? options.frame(ручка) : null;
	}

	return {
		get dragging() {
			return стан.dragging;
		},
		/** Чи справді рухали — питає обробник натиску, щоб не спрацювати після тяги. */
		takeMoved(): boolean {
			const було = стан.moved;
			стан.moved = false;
			return було;
		},
		down(подія: PointerEvent) {
			const вікно = рамка(подія);
			if (!вікно) return;
			const r = вікно.getBoundingClientRect();
			зсув = { x: подія.clientX - r.left, y: подія.clientY - r.top };
			стан.dragging = true;
			стан.moved = false;
			(подія.currentTarget as HTMLElement).setPointerCapture(подія.pointerId);
		},
		move(подія: PointerEvent) {
			if (!стан.dragging) return;
			const вікно = рамка(подія);
			if (!вікно) return;
			стан.moved = true;
			options.onMove({
				x: Math.min(
					Math.max(подія.clientX - зсув.x, край - вікно.offsetWidth),
					window.innerWidth - край
				),
				y: Math.min(Math.max(подія.clientY - зсув.y, 0), window.innerHeight - край)
			});
		},
		up() {
			if (!стан.dragging) return;
			стан.dragging = false;
			options.onEnd();
		}
	};
}
