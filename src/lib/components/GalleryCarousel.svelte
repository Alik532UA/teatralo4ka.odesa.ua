<script lang="ts">
	import { Play, Pause } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import type { GalleryWidgetConfig } from '$lib/services/settings';
	import {
		createDragState, createWheelState,
		handleTouchStart as sharedTouchStart,
		handleTouchMove as sharedTouchMove,
		handleTouchEnd as sharedTouchEnd,
		handleClickCapture as sharedClickCapture,
		handleWheel as sharedWheel,
		handleTransitionEnd as sharedTransitionEnd,
		type DragState,
	} from '$lib/utils/carouselInteraction';

	export interface GalleryItem {
		src: string;
		alt: string;
		title: string;
		position?: string;
	}

	interface Props {
		items: GalleryItem[];
		config: GalleryWidgetConfig;
		testIdPrefix?: string;
		/** Accessible label for the carousel region */
		ariaLabel?: string;
	}

	let { items, config, testIdPrefix = 'gallery-carousel', ariaLabel = '' }: Props = $props();

	const resolvedAriaLabel = $derived(ariaLabel || $t('common.gallery'));

	let autoplayOverride = $state<boolean | null>(null);
	const autoplay = $derived(autoplayOverride ?? config.autoplay);
	const cssAspectRatio = $derived((config.aspectRatio || '4:3').replace(':', ' / '));
	let isAutoAdvancing = $state(false);
	let isHovered = $state(false);
	let mounted = $state(false);

	let currentIndex = $state(0);
	let isTransitioning = $state(true);
	let infiniteItems = $state<GalleryItem[]>([]);
	let bufferCount = $state(1);

	$effect(() => {
		if (items.length === 0) return;

		let ordered = [...items];
		const pinnedIdx = config.pinnedIndex ?? -1;
		if (pinnedIdx >= 0 && pinnedIdx < ordered.length) {
			const [pinned] = ordered.splice(pinnedIdx, 1);
			ordered.unshift(pinned);
		}

		if (ordered.length > 0) {
			bufferCount = Math.max(3, Math.ceil(20 / ordered.length));
			const arr: GalleryItem[] = [];
			const totalCopies = 1 + 2 * bufferCount;
			for (let i = 0; i < totalCopies; i++) {
				arr.push(...ordered);
			}
			infiniteItems = arr;
			currentIndex = bufferCount * ordered.length;
		}
	});

	onMount(() => {
		const timer = setTimeout(() => { mounted = true; }, 100);
		return () => {
			clearTimeout(timer);
			clearTimeout(wheelState.timeout);
		};
	});

	function next(fromAuto = false) {
		if (!isTransitioning || infiniteItems.length <= 1) return;
		if (currentIndex >= infiniteItems.length - 2) return;
		if (!fromAuto) autoplayOverride = false;
		isAutoAdvancing = fromAuto;
		currentIndex++;
	}

	function prev() {
		if (!isTransitioning || infiniteItems.length <= 1) return;
		if (currentIndex <= 1) return;
		autoplayOverride = false;
		isAutoAdvancing = false;
		currentIndex--;
	}

	function goTo(i: number) {
		if (!isTransitioning || infiniteItems.length <= 1) return;
		const n = items.length;
		if (n === 0) return;
		const currentMod = ((currentIndex % n) + n) % n;
		if (i === currentMod) return;
		autoplayOverride = false;
		isAutoAdvancing = false;
		let diff = i - currentMod;
		if (diff > n / 2) diff -= n;
		else if (diff < -n / 2) diff += n;
		currentIndex += diff;
	}

	function handleTransitionEnd(e: TransitionEvent) {
		if (e.target !== e.currentTarget) return;
		if (e.propertyName !== 'transform') return;
		const n = items.length;
		if (n === 0) return;
		const baseIndex = bufferCount * n;
		if (currentIndex >= baseIndex + n || currentIndex < baseIndex) {
			isTransitioning = false;
			currentIndex = baseIndex + ((currentIndex % n) + n) % n;
			setTimeout(() => { isTransitioning = true; }, 30);
		}
	}

	function autoNext() { next(true); }

	$effect(() => {
		if (!mounted || !autoplay || isHovered || infiniteItems.length <= 1) return;
		const ms = (config.autoplayInterval || 5) * 1000;
		const id = setInterval(autoNext, ms);
		return () => clearInterval(id);
	});

	// â”€â”€ Swipe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	let drag = $state<DragState>(createDragState());
	let wheelState = createWheelState();

	const handlers = {
		getItemsLength: () => items.length,
		getInfiniteLength: () => infiniteItems.length,
		getBufferCount: () => bufferCount,
		getCurrentIndex: () => currentIndex,
		setCurrentIndex: (i: number) => { currentIndex = i; },
		isTransitioning: () => isTransitioning,
		next,
		prev,
		setAutoplayOverride: (v: boolean) => { autoplayOverride = v; },
	};

	function onTouchStart(e: TouchEvent | MouseEvent) {
		drag = sharedTouchStart(e, drag, handlers);
	}
	function onTouchMove(e: TouchEvent | MouseEvent) {
		drag = sharedTouchMove(e, drag, handlers);
	}
	function onTouchEnd() {
		drag = sharedTouchEnd(drag, handlers);
	}
	function onClickCapture(e: MouseEvent) {
		sharedClickCapture(e, drag);
	}
	function onWheel(e: WheelEvent) {
		wheelState = sharedWheel(e, wheelState, handlers);
	}
	function onTransitionEnd(e: TransitionEvent) {
		sharedTransitionEnd(e, handlers, (v) => { isTransitioning = v; });
	}

	const activeDot = $derived(items.length > 0 ? ((currentIndex % items.length) + items.length) % items.length : 0);
	const translateX = $derived(`calc(-${currentIndex * 100}% + ${drag.isDragging ? drag.dragOffset : 0}px)`);

	function handleKeydown(e: KeyboardEvent) {
		if (!isHovered || items.length <= 1) return;
		if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
		else if (e.key === 'ArrowRight') { e.preventDefault(); next(false); }
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="gc-root"
	data-testid={testIdPrefix}
	role="region"
	aria-roledescription="carousel"
	aria-label={resolvedAriaLabel}
	tabindex="0"
	onmouseenter={() => { isHovered = true; }}
	onmouseleave={() => { isHovered = false; drag = { ...drag, isDragging: false, dragOffset: 0 }; }}
	onkeydown={handleKeydown}
>
	<div
		class="gc-carousel"
		style="aspect-ratio: {cssAspectRatio};"
		onwheel={onWheel}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="gc-track"
			style="transform: translateX({translateX}); transition: {isTransitioning && !drag.isDragging ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' : 'none'};"
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
			onmousedown={onTouchStart}
			onmousemove={onTouchMove}
			onmouseup={onTouchEnd}
			onclickcapture={onClickCapture}
			ontransitionend={onTransitionEnd}
			role="list"
		>
			{#each infiniteItems as img, i (i)}
				<div class="gc-slide" role="listitem">
					<img
						src={img.src}
						alt={img.alt}
						width="1200"
						height="900"
						loading="lazy"
						decoding="async"
						draggable="false"
						style={img.position ? `object-position: ${img.position}` : ''}
					/>
					{#if config.showCaptions}
						<div class="gc-overlay">
							<span class="gc-caption">{img.title}</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if config.autoplay && items.length > 1}
			<button
				type="button"
				class="gc-play-btn"
				onclick={() => { autoplayOverride = !autoplay; }}
				aria-label={autoplay ? $t('common.pause') : $t('common.play')}
			>
				{#if autoplay}<Pause size={14} />{:else}<Play size={14} />{/if}
			</button>
		{/if}
	</div>

	{#if items.length > 1}
		<div class="gc-dots" data-testid="{testIdPrefix}-dots">
			{#each items as _, i}
				<button
					type="button"
					class="gc-dot"
					class:active={i === activeDot}
					onclick={() => goTo(i)}
					aria-label="{$t('common.slide')} {i + 1}"
					data-testid="{testIdPrefix}-dot-{i}"
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.gc-root {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.gc-carousel {
		position: relative;
		overflow: hidden;
		border-radius: 1rem;
		max-height: 70vh;
		user-select: none;
		-webkit-user-select: none;
	}

	.gc-track {
		display: flex;
		height: 100%;
		will-change: transform;
		cursor: grab;
	}
	.gc-track:active { cursor: grabbing; }

	.gc-slide {
		flex: 0 0 100%;
		position: relative;
		overflow: hidden;
	}
	.gc-slide img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		pointer-events: none;
	}

	.gc-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%);
		display: flex;
		align-items: flex-end;
		padding: 1.5rem;
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.gc-caption {
		color: #fff;
		font-size: 1.1rem;
		font-weight: 600;
		text-shadow: 0 1px 6px rgba(0,0,0,0.4);
	}

	/* â”€â”€ Play/pause button â€” top-right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
	.gc-play-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: rgba(255,255,255,0.65);
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-dark-text, #1a1a2e);
		transition: background 0.2s ease, opacity 0.25s ease;
		z-index: 2;
		opacity: 0;
		box-shadow: 0 2px 8px rgba(0,0,0,0.12);
	}
	.gc-carousel:hover .gc-play-btn { opacity: 1; }
	.gc-play-btn:hover { background: rgba(255,255,255,0.9); }

	/* â”€â”€ Dots â€” below carousel, styled like ContentWidget â”€â”€ */
	.gc-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
		padding: 0 var(--space-md, 1rem);
	}

	.gc-dot {
		width: 30px;
		height: 6px;
		border-radius: 3px;
		border: none;
		background: var(--color-border, #d0d5dd);
		cursor: pointer;
		padding: 0;
		transition: all 0.3s ease;
	}
	.gc-dot.active {
		background: var(--text-title, #005fae);
		width: 60px;
	}
	.gc-dot:hover { background: var(--text-title, #005fae); opacity: 0.7; }

	@media (max-width: 1024px) {
		.gc-carousel { border-radius: 0.75rem; }
		.gc-caption { font-size: 0.95rem; }
		.gc-overlay { padding: 1rem; }
		.gc-play-btn { opacity: 0.7; }
		.gc-carousel:hover .gc-play-btn { opacity: 0.9; }
	}

	@media (max-width: 480px) {
		.gc-dot { width: 20px; }
		.gc-dot.active { width: 40px; }
	}
</style>
