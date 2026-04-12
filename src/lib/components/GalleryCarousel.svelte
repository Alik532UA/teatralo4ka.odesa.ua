<script lang="ts">
	import { Play, Pause } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import type { GalleryWidgetConfig } from '$lib/services/settings';

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
	}

	let { items, config, testIdPrefix = 'gallery-carousel' }: Props = $props();

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
			clearTimeout(wheelTimeout);
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

	// ── Swipe ─────────────────────────────────────────────────────────────────
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let isDragging = $state(false);
	let dragOffset = $state(0);
	let wheelAccumulator = 0;
	let wheelTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleTouchStart(e: TouchEvent | MouseEvent) {
		if (infiniteItems.length <= 1) return;
		isDragging = true;
		touchStartX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
		touchEndX = touchStartX;
		dragOffset = 0;
		autoplayOverride = false;
	}

	function handleTouchMove(e: TouchEvent | MouseEvent) {
		if (!isDragging) return;
		touchEndX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
		dragOffset = touchEndX - touchStartX;
		const n = items.length;
		if (n === 0) return;
		const baseIndex = bufferCount * n;
		if (currentIndex >= baseIndex + n && dragOffset < 0) currentIndex -= n;
		else if (currentIndex < baseIndex && dragOffset > 0) currentIndex += n;
	}

	function handleTouchEnd() {
		if (!isDragging) return;
		isDragging = false;
		if (Math.abs(dragOffset) > 40) {
			if (dragOffset < 0) next(false);
			else prev();
		}
		dragOffset = 0;
	}

	function handleClickCapture(e: MouseEvent) {
		if (Math.abs(touchStartX - touchEndX) > 10) {
			e.stopPropagation();
			e.preventDefault();
		}
	}

	function handleWheel(e: WheelEvent) {
		if (infiniteItems.length <= 1) return;
		const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0;
		const isShiftScroll = e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 0;
		if (isHorizontalScroll || isShiftScroll) {
			let delta = isShiftScroll ? e.deltaY : e.deltaX;
			if (e.deltaMode === 1) delta *= 33;
			else if (e.deltaMode === 2) delta *= 100;
			if (isShiftScroll) { try { e.preventDefault(); } catch {} }
			wheelAccumulator += delta;
			if (Math.abs(wheelAccumulator) >= 40) {
				if (wheelAccumulator > 0) next(false);
				else prev();
				wheelAccumulator = 0;
			}
			clearTimeout(wheelTimeout);
			wheelTimeout = setTimeout(() => { wheelAccumulator = 0; }, 250);
		}
	}

	const activeDot = $derived(items.length > 0 ? ((currentIndex % items.length) + items.length) % items.length : 0);
	const translateX = $derived(`calc(-${currentIndex * 100}% + ${isDragging ? dragOffset : 0}px)`);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="gc-root"
	data-testid={testIdPrefix}
	onmouseenter={() => { isHovered = true; }}
	onmouseleave={() => { isHovered = false; handleTouchEnd(); }}
>
	<div
		class="gc-carousel"
		style="aspect-ratio: {cssAspectRatio};"
		onwheel={handleWheel}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="gc-track"
			style="transform: translateX({translateX}); transition: {isTransitioning && !isDragging ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' : 'none'};"
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			onmousedown={handleTouchStart}
			onmousemove={handleTouchMove}
			onmouseup={handleTouchEnd}
			onclickcapture={handleClickCapture}
			ontransitionend={handleTransitionEnd}
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
					aria-label="Go to photo {i + 1}"
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

	/* ── Play/pause button — top-right ─────────────────── */
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

	/* ── Dots — below carousel, styled like ContentWidget ── */
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
		background: var(--color-deep-ocean, #005fae);
		width: 60px;
	}
	.gc-dot:hover { background: var(--color-deep-ocean, #005fae); opacity: 0.7; }

	@media (max-width: 768px) {
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
