import type { Attachment } from 'svelte/attachments';
import { ui } from '$lib/controllers/ui.svelte';

export interface CustomScrollOptions {
	/** Базова ширина повзунка у стані спокою (px). Типово 6. */
	restWidth?: number;
	/** Ширина повзунка при наближенні / наведенні (px). Типово 14. */
	hoverWidth?: number;
	/** Мінімальна висота повзунка (px). Типово 24. */
	minThumbHeight?: number;
	/** Відстань спрацьовування наближення курсора (px). Типово 45. */
	proximityThreshold?: number;
	/** Відступ доріжки від правого краю (px). Типово 0. */
	rightOffset?: number;
	/** Вирівнювання розширення повзунка: 'center' або 'right'. Типово 'right'. */
	alignThumb?: 'center' | 'right';
}

/**
 * Авторський оверлей-скрол для вікон, модалок, попапів та випадаючих списків.
 */
export function customScroll(options: CustomScrollOptions = {}): Attachment {
	const REST_WIDTH = options.restWidth ?? 6;
	const HOVER_WIDTH = options.hoverWidth ?? 14;
	const MIN_THUMB = options.minThumbHeight ?? 24;
	const PROXIMITY = options.proximityThreshold ?? 45;
	const RIGHT_OFFSET = options.rightOffset ?? 0;
	const ALIGN = options.alignThumb ?? 'right';
	const TRACK_WIDTH = HOVER_WIDTH + 8;

	return (nodeElement: Element) => {
		const node = nodeElement as HTMLElement;

		const computedPos = typeof window !== 'undefined' ? window.getComputedStyle(node).position : 'static';
		if (computedPos === 'static') {
			node.style.position = 'relative';
		}

		const track = document.createElement('div');
		track.className = 'custom-scroll-track';
		track.setAttribute('aria-hidden', 'true');
		track.setAttribute('data-testid', 'custom-scroll-track');
		track.style.cssText = `position:absolute;top:0;right:${RIGHT_OFFSET}px;width:${TRACK_WIDTH}px;z-index:999;pointer-events:auto;user-select:none;-webkit-user-select:none;touch-action:none;opacity:0;transition:opacity 0.2s ease;`;

		const thumb = document.createElement('div');
		thumb.className = 'custom-scroll-thumb';
		thumb.setAttribute('data-testid', 'custom-scroll-thumb');

		const thumbBaseStyle = `position:absolute;top:0;width:${REST_WIDTH}px;min-height:${MIN_THUMB}px;border-radius:999px;background:var(--scrollbar-thumb,rgba(0,180,216,0.45));pointer-events:auto;cursor:pointer;transition:width 0.15s cubic-bezier(0.16,1,0.3,1),background 0.15s ease,opacity 0.2s ease;`;

		if (ALIGN === 'center') {
			thumb.style.cssText = `${thumbBaseStyle}left:50%;transform:translate(-50%,0);transform-origin:center center;`;
		} else {
			thumb.style.cssText = `${thumbBaseStyle}right:2px;transform:translateY(0);transform-origin:right center;`;
		}

		track.appendChild(thumb);
		node.appendChild(track);

		let isScrollable = false;
		let thumbHeight = MIN_THUMB;
		let isDragging = false;
		let dragStartY = 0;
		let dragStartScrollTop = 0;
		let isCustomActive = ui.scrollbarMode !== 'standard';

		function applyModeState() {
			isCustomActive = ui.scrollbarMode !== 'standard';
			if (!isCustomActive) {
				node.classList.remove('custom-scroll-container');
				track.style.display = 'none';
			} else {
				node.classList.add('custom-scroll-container');
				track.style.display = '';
				updateGeometry();
			}
		}

		function updateGeometry() {
			if (!isCustomActive) return;
			const clientH = node.clientHeight;
			const scrollH = node.scrollHeight;
			const scrollT = node.scrollTop;
			const maxScroll = scrollH - clientH;

			isScrollable = maxScroll > 1 && clientH > 0;
			if (!isScrollable) {
				track.style.opacity = '0';
				track.style.pointerEvents = 'none';
				return;
			}

			track.style.opacity = '1';
			track.style.pointerEvents = 'auto';
			track.style.height = `${clientH}px`;
			track.style.transform = `translateY(${scrollT}px)`;

			thumbHeight = Math.max(Math.round((clientH / scrollH) * clientH), MIN_THUMB);
			const thumbTop = Math.round((scrollT / maxScroll) * (clientH - thumbHeight));

			thumb.style.height = `${thumbHeight}px`;
			if (ALIGN === 'center') {
				thumb.style.transform = `translate(-50%, ${thumbTop}px)`;
			} else {
				thumb.style.transform = `translateY(${thumbTop}px)`;
			}
		}

		function onPointerMove(e: PointerEvent) {
			if (!isCustomActive || isDragging || !isScrollable) return;
			const rect = node.getBoundingClientRect();
			let distance: number;

			if (ALIGN === 'center') {
				const trackCenterX = (rect.right - RIGHT_OFFSET) - TRACK_WIDTH / 2;
				distance = Math.abs(e.clientX - trackCenterX);
			} else {
				distance = (rect.right - RIGHT_OFFSET) - e.clientX;
			}

			const yInNode = e.clientY - rect.top;

			if (distance >= 0 && distance <= PROXIMITY && yInNode >= 0 && yInNode <= rect.height) {
				const progress = Math.min(Math.max((PROXIMITY - distance) / (PROXIMITY - 8), 0), 1);
				const currentWidth = Math.round(REST_WIDTH + (HOVER_WIDTH - REST_WIDTH) * progress);
				thumb.style.width = `${currentWidth}px`;
				thumb.style.background = distance <= 16 ? 'var(--accent-primary, #00b4d8)' : 'var(--scrollbar-thumb, rgba(0, 180, 216, 0.45))';
			} else {
				thumb.style.width = `${REST_WIDTH}px`;
				thumb.style.background = 'var(--scrollbar-thumb, rgba(0, 180, 216, 0.45))';
			}
		}

		function onPointerLeave() {
			if (isDragging) return;
			thumb.style.width = `${REST_WIDTH}px`;
			thumb.style.background = 'var(--scrollbar-thumb, rgba(0, 180, 216, 0.45))';
		}

		function onThumbPointerDown(e: PointerEvent) {
			if (!isCustomActive) return;
			e.preventDefault();
			e.stopPropagation();
			isDragging = true;
			thumb.style.width = `${HOVER_WIDTH}px`;
			thumb.style.background = 'var(--accent-primary, #00b4d8)';
			dragStartY = e.clientY;
			dragStartScrollTop = node.scrollTop;

			try {
				thumb.setPointerCapture(e.pointerId);
			} catch {
				// capture fallback
			}

			window.addEventListener('pointermove', onWindowPointerMove);
			window.addEventListener('pointerup', onWindowPointerUp);
			window.addEventListener('pointercancel', onWindowPointerUp);
		}

		function onWindowPointerMove(e: PointerEvent) {
			if (!isDragging) return;
			const clientH = node.clientHeight;
			const scrollH = node.scrollHeight;
			const maxScroll = scrollH - clientH;
			const maxThumbTravel = clientH - thumbHeight;
			if (maxThumbTravel <= 0) return;

			const deltaY = e.clientY - dragStartY;
			const scrollDelta = (deltaY / maxThumbTravel) * maxScroll;
			node.scrollTop = dragStartScrollTop + scrollDelta;
		}

		function onWindowPointerUp(e: PointerEvent) {
			if (!isDragging) return;
			isDragging = false;
			try {
				thumb.releasePointerCapture(e.pointerId);
			} catch {
				// release fallback
			}
			window.removeEventListener('pointermove', onWindowPointerMove);
			window.removeEventListener('pointerup', onWindowPointerUp);
			window.removeEventListener('pointercancel', onWindowPointerUp);
			onPointerLeave();
		}

		function onTrackPointerDown(e: PointerEvent) {
			if (!isCustomActive || e.target === thumb) return;
			e.preventDefault();
			const rect = track.getBoundingClientRect();
			const clickY = e.clientY - rect.top;
			const clientH = node.clientHeight;
			const scrollH = node.scrollHeight;
			const maxScroll = scrollH - clientH;
			const maxThumbTravel = clientH - thumbHeight;
			if (maxThumbTravel <= 0) return;

			const targetScrollTop = ((clickY - thumbHeight / 2) / maxThumbTravel) * maxScroll;
			node.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
		}

		node.addEventListener('scroll', updateGeometry, { passive: true });
		node.addEventListener('pointermove', onPointerMove, { passive: true });
		node.addEventListener('pointerleave', onPointerLeave, { passive: true });
		thumb.addEventListener('pointerdown', onThumbPointerDown);
		track.addEventListener('pointerdown', onTrackPointerDown);

		let observer: ResizeObserver | null = null;
		if (typeof ResizeObserver !== 'undefined') {
			observer = new ResizeObserver(() => updateGeometry());
			observer.observe(node);
			if (node.firstElementChild) observer.observe(node.firstElementChild);
		}

		applyModeState();
		const interval = typeof window !== 'undefined' ? setInterval(applyModeState, 150) : null;

		if (typeof requestAnimationFrame !== 'undefined') {
			requestAnimationFrame(updateGeometry);
		} else {
			updateGeometry();
		}

		return () => {
			if (interval) clearInterval(interval);
			node.removeEventListener('scroll', updateGeometry);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerleave', onPointerLeave);
			thumb.removeEventListener('pointerdown', onThumbPointerDown);
			track.removeEventListener('pointerdown', onTrackPointerDown);
			if (typeof window !== 'undefined') {
				window.removeEventListener('pointermove', onWindowPointerMove);
				window.removeEventListener('pointerup', onWindowPointerUp);
				window.removeEventListener('pointercancel', onWindowPointerUp);
			}
			observer?.disconnect();
			node.classList.remove('custom-scroll-container');
			track.remove();
		};
	};
}
