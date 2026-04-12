/**
 * Shared carousel interaction logic (swipe, wheel, drag).
 *
 * Used by both ContentWidget and GalleryCarousel to avoid code duplication.
 */

interface CarouselHandlers {
	getItemsLength: () => number;
	getInfiniteLength: () => number;
	getBufferCount: () => number;
	getCurrentIndex: () => number;
	setCurrentIndex: (i: number) => void;
	isTransitioning: () => boolean;
	next: (fromAuto: boolean) => void;
	prev: () => void;
	setAutoplayOverride: (v: boolean) => void;
}

export interface DragState {
	isDragging: boolean;
	touchStartX: number;
	touchEndX: number;
	dragOffset: number;
}

export function createDragState(): DragState {
	return { isDragging: false, touchStartX: 0, touchEndX: 0, dragOffset: 0 };
}

export function handleTouchStart(
	e: TouchEvent | MouseEvent,
	drag: DragState,
	handlers: CarouselHandlers,
): DragState {
	if (handlers.getInfiniteLength() <= 1) return drag;
	const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
	handlers.setAutoplayOverride(false);
	return { isDragging: true, touchStartX: x, touchEndX: x, dragOffset: 0 };
}

export function handleTouchMove(
	e: TouchEvent | MouseEvent,
	drag: DragState,
	handlers: CarouselHandlers,
): DragState {
	if (!drag.isDragging) return drag;
	const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
	const offset = x - drag.touchStartX;

	const n = handlers.getItemsLength();
	if (n > 0) {
		const baseIndex = handlers.getBufferCount() * n;
		const ci = handlers.getCurrentIndex();
		if (ci >= baseIndex + n && offset < 0) handlers.setCurrentIndex(ci - n);
		else if (ci < baseIndex && offset > 0) handlers.setCurrentIndex(ci + n);
	}

	return { ...drag, touchEndX: x, dragOffset: offset };
}

export function handleTouchEnd(
	drag: DragState,
	handlers: CarouselHandlers,
): DragState {
	if (!drag.isDragging) return drag;
	if (Math.abs(drag.dragOffset) > 40) {
		if (drag.dragOffset < 0) handlers.next(false);
		else handlers.prev();
	}
	return { ...drag, isDragging: false, dragOffset: 0 };
}

export function handleClickCapture(e: MouseEvent, drag: DragState): void {
	if (Math.abs(drag.touchStartX - drag.touchEndX) > 10) {
		e.stopPropagation();
		e.preventDefault();
	}
}

interface WheelState {
	accumulator: number;
	timeout: ReturnType<typeof setTimeout> | undefined;
}

export function createWheelState(): WheelState {
	return { accumulator: 0, timeout: undefined };
}

export function handleWheel(
	e: WheelEvent,
	wheel: WheelState,
	handlers: CarouselHandlers,
): WheelState {
	if (handlers.getInfiniteLength() <= 1) return wheel;

	const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0;
	const isShift = e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 0;

	if (!isHorizontal && !isShift) return wheel;

	let delta = isShift ? e.deltaY : e.deltaX;
	if (e.deltaMode === 1) delta *= 33;
	else if (e.deltaMode === 2) delta *= 100;

	if (isShift) {
		try { e.preventDefault(); } catch { /* passive listener */ }
	}

	const newAcc = wheel.accumulator + delta;
	let acc = newAcc;

	if (Math.abs(acc) >= 40) {
		if (acc > 0) handlers.next(false);
		else handlers.prev();
		acc = 0;
	}

	clearTimeout(wheel.timeout);
	const timeout = setTimeout(() => { wheel.accumulator = 0; }, 250);

	handlers.setAutoplayOverride(false);

	return { accumulator: acc, timeout };
}

export function handleTransitionEnd(
	e: TransitionEvent,
	handlers: CarouselHandlers,
	setTransitioning: (v: boolean) => void,
): void {
	if (e.target !== e.currentTarget) return;
	if (e.propertyName !== 'transform') return;
	const n = handlers.getItemsLength();
	if (n === 0) return;
	const baseIndex = handlers.getBufferCount() * n;
	const ci = handlers.getCurrentIndex();
	if (ci >= baseIndex + n || ci < baseIndex) {
		setTransitioning(false);
		handlers.setCurrentIndex(baseIndex + ((ci % n) + n) % n);
		setTimeout(() => { setTransitioning(true); }, 30);
	}
}
