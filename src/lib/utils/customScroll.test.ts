import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { customScroll } from './customScroll';
import { ui } from '$lib/controllers/ui.svelte';

describe('customScroll', () => {
	let container: HTMLElement;

	beforeEach(() => {
		ui.setScrollbarMode('custom');
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
		ui.setScrollbarMode('custom');
	});

	it('додає клас custom-scroll-container та створює елементи оверлею в режимі custom', () => {
		const cleanup = customScroll()(container) as () => void;

		expect(container.classList.contains('custom-scroll-container')).toBe(true);
		const track = container.querySelector('[data-testid="custom-scroll-track"]');
		const thumb = container.querySelector('[data-testid="custom-scroll-thumb"]');

		expect(track).toBeTruthy();
		expect(thumb).toBeTruthy();

		cleanup();
		expect(container.classList.contains('custom-scroll-container')).toBe(false);
		expect(container.querySelector('[data-testid="custom-scroll-track"]')).toBeNull();
	});

	it('забезпечує non-static позиціонування для контейнера', () => {
		container.style.position = 'static';
		const cleanup = customScroll()(container) as () => void;

		expect(container.style.position).toBe('relative');
		cleanup();
	});

	it('підтримує налаштування rightOffset та alignThumb', () => {
		const cleanup = customScroll({ rightOffset: -10, alignThumb: 'center' })(container) as () => void;

		const track = container.querySelector('[data-testid="custom-scroll-track"]') as HTMLElement;
		const thumb = container.querySelector('[data-testid="custom-scroll-thumb"]') as HTMLElement;

		expect(track.style.right).toBe('-10px');
		expect(thumb.style.left).toBe('50%');

		cleanup();
	});

	it('прибирає всі слухачі та спостерігачі при виклику cleanup', () => {
		const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');
		const cleanup = customScroll()(container) as () => void;

		cleanup();
		expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function));
	});

	it('вимикає оверлей та знімає custom-scroll-container у режимі standard', async () => {
		ui.setScrollbarMode('standard');
		const cleanup = customScroll()(container) as () => void;

		const track = container.querySelector('[data-testid="custom-scroll-track"]') as HTMLElement;
		expect(container.classList.contains('custom-scroll-container')).toBe(false);
		expect(track.style.display).toBe('none');

		cleanup();
	});
});
