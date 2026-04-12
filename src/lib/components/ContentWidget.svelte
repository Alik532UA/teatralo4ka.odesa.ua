<script lang="ts">
	import ContentCard from '$lib/components/ContentCard.svelte';
	import type { ContentCardItem } from '$lib/components/ContentCard.svelte';
	import { GalleryHorizontal, LayoutGrid, List, Play, Pause } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';

	export type ContentViewMode = 'carousel' | 'grid' | 'list';

	export interface ContentWidgetConfig {
		defaultView: ContentViewMode;
		showViewSwitcher: boolean;
		autoplay: boolean;
		autoplayInterval: number;
		pinnedItemId: string;
		maxItemsGrid: number;
		maxItemsList: number;
	}

	interface Props {
		items: ContentCardItem[];
		config: ContentWidgetConfig;
		/** Show "all →" link (homepage mode) */
		showAllLink?: boolean;
		/** Href for the "all →" link, e.g. '/news' */
		allLinkHref?: string;
		/** Label for the "all →" link */
		allLinkLabel?: string;
		/** localStorage key to save view preference when navigating to "all" page */
		allLinkViewKey?: string;
		/** URL segment for card links: 'news' → /news/{slug} */
		linkPrefix?: string;
		/** Card "Read more" button text */
		readMoreLabel?: string;
		/** data-testid prefix for widget elements */
		testIdPrefix?: string;
		/** data-testid prefix for card elements */
		cardTestIdPrefix?: string;
		/** Persist widget's own view mode to this localStorage key. '' disables persistence. */
		storageKey?: string;
		title?: string;
		subtitle?: string;
	}

	let {
		items,
		config,
		showAllLink = false,
		allLinkHref = '',
		allLinkLabel = '',
		allLinkViewKey = '',
		linkPrefix = 'news',
		readMoreLabel = '',
		testIdPrefix = 'content-widget',
		cardTestIdPrefix = 'content',
		storageKey = '',
		title = '',
		subtitle = '',
	}: Props = $props();


	// ── View state ────────────────────────────────────────────────────────────
	let viewOverride = $state<ContentViewMode | null>(null);
	let autoplayOverride = $state<boolean | null>(null);
	const autoplay = $derived(autoplayOverride ?? config.autoplay);
	let isAutoAdvancing = $state(false);
	let isHovered = $state(false);
	let mounted = $state(false);
	let isMobile = $state(false);

	// ── Carousel state ────────────────────────────────────────────────────────
	// Dynamic buffer for seamless infinite loop to handle rapid clicking
	let currentIndex = $state(0);
	let isTransitioning = $state(true);
	let infiniteItems = $state<ContentCardItem[]>([]);
	let bufferCount = $state(1);

	// ── Max items for grid/list ───────────────────────────────────────────────
	let showingAll = $state(false);

	const view = $derived.by(() => {
		let v = viewOverride ?? config.defaultView;
		// Force 'list' view on mobile if 'grid' is selected (since grid is hidden from switcher)
		if (isMobile && v === 'grid') return 'list';
		return v;
	});

	const maxItemsForCurrentView = $derived(view === 'grid' ? config.maxItemsGrid : view === 'list' ? config.maxItemsList : 0);

	const displayItems = $derived.by(() => {
		if (view === 'carousel' || maxItemsForCurrentView <= 0 || showingAll) return items;
		return items.slice(0, maxItemsForCurrentView);
	});

	const hasMore = $derived(maxItemsForCurrentView > 0 && items.length > maxItemsForCurrentView && view !== 'carousel');

	// ── Init ──────────────────────────────────────────────────────────────────
	$effect(() => {
		if (items.length === 0) return;

		// Build reordered list (pinned item at front for carousel)
		let ordered = [...items];
		if (config.pinnedItemId) {
			const pinIdx = ordered.findIndex(it => it.id === config.pinnedItemId);
			if (pinIdx > 0) {
				const [pinned] = ordered.splice(pinIdx, 1);
				ordered.unshift(pinned);
			}
		}

		// Calculate how many copies we need for a safe buffer
		// We want at least ~20 items of buffer on each side so rapid clicks don't hit the end
		if (ordered.length > 0) {
			bufferCount = Math.max(3, Math.ceil(20 / ordered.length));
			let arr = [];
			const totalCopies = 1 + 2 * bufferCount;
			for (let i = 0; i < totalCopies; i++) {
				arr.push(...ordered);
			}
			infiniteItems = arr;
			currentIndex = bufferCount * ordered.length; // Start in the middle set
		}
	});

	onMount(() => {
		if (storageKey) {
			const saved = localStorage.getItem(storageKey) as ContentViewMode | null;
			if (saved && ['carousel', 'grid', 'list'].includes(saved)) {
				viewOverride = config.showViewSwitcher ? saved : null;
			}
		}

		const mql = window.matchMedia('(max-width: 1024px)');
		isMobile = mql.matches;
		const handler = (e: MediaQueryListEvent) => { isMobile = e.matches; };
		mql.addEventListener('change', handler);

		const mountTimer = setTimeout(() => { mounted = true; }, 100);
		return () => {
			mql.removeEventListener('change', handler);
			clearTimeout(mountTimer);
			clearTimeout(wheelTimeout);
		};
	});

	// Persist view to localStorage
	$effect(() => {
		if (browser && storageKey && viewOverride) localStorage.setItem(storageKey, view);
	});

	// ── Carousel navigation ───────────────────────────────────────────────────
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

		// Find the shortest path (forward or backward) to the target dot
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

		// Seamless jump back to the middle set if we drift out of it
		if (currentIndex >= baseIndex + n || currentIndex < baseIndex) {
			isTransitioning = false;
			currentIndex = baseIndex + ((currentIndex % n) + n) % n;
			setTimeout(() => { isTransitioning = true; }, 30);
		}
	}

	function autoNext() { next(true); }

	// ── Autoplay interval ─────────────────────────────────────────────────────
	$effect(() => {
		if (!mounted || !autoplay || isHovered || view !== 'carousel' || infiniteItems.length <= 1) return;
		const ms = (config.autoplayInterval || 7) * 1000;
		const id = setInterval(autoNext, ms);
		return () => clearInterval(id);
	});

	// ── Swipe & Scroll ────────────────────────────────────────────────────────
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let isDragging = $state(false);
	let dragOffset = $state(0);
	let wheelAccumulator = 0;
	let wheelTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleTouchStart(e: TouchEvent | MouseEvent) {
		if (view !== 'carousel' || infiniteItems.length <= 1) return;
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

		// Instant seamless jump while dragging if we go too far
		const n = items.length;
		if (n === 0) return;
		const baseIndex = bufferCount * n;

		if (currentIndex >= baseIndex + n && dragOffset < 0) {
			currentIndex -= n;
		} else if (currentIndex < baseIndex && dragOffset > 0) {
			currentIndex += n;
		}
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
		if (view !== 'carousel' || infiniteItems.length <= 1) return;

		const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0;
		const isShiftScroll = e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 0;

		if (isHorizontalScroll || isShiftScroll) {
			let delta = isShiftScroll ? e.deltaY : e.deltaX;

			// Normalize delta values depending on the device/browser
			if (e.deltaMode === 1) delta *= 33; // DOM_DELTA_LINE
			else if (e.deltaMode === 2) delta *= 100; // DOM_DELTA_PAGE

			if (isShiftScroll) {
				// Svelte 5 passive listeners might throw on preventDefault
				try { e.preventDefault(); } catch { /* passive listener */ }
			}

			wheelAccumulator += delta;

			// 40 is an optimal threshold for both fast trackpad flicks and standard mouse wheels
			if (Math.abs(wheelAccumulator) >= 40) {
				if (wheelAccumulator > 0) next(false);
				else prev();

				// Reset to 0 after triggering to prevent runaway multi-slide jumps from a single flick
				wheelAccumulator = 0;
			}

			clearTimeout(wheelTimeout);
			wheelTimeout = setTimeout(() => { wheelAccumulator = 0; }, 250);

			autoplayOverride = false;
		}
	}

	// ── Keyboard ──────────────────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent) {
		if (typeof document !== 'undefined' && ['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) return;
		if (view !== 'carousel') return;
		if (!isHovered) return;

		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			prev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			next(false);
		}
	}

	function handleShowAll() {
		if (showAllLink && allLinkHref) {
			if (browser && allLinkViewKey) {
				const viewToSave = view === 'list' ? 'list' : 'grid';
				localStorage.setItem(allLinkViewKey, viewToSave);
			}
			goto(allLinkHref);
		} else {
			showingAll = true;
		}
	}

	function handleAllLink(e: MouseEvent) {
		e.preventDefault();
		if (browser && allLinkViewKey) {
			const viewToSave = view === 'list' ? 'list' : 'grid';
			localStorage.setItem(allLinkViewKey, viewToSave);
		}
		if (allLinkHref) goto(allLinkHref);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet allLink(suffix = '', extraClass = '')}
	{#if showAllLink && allLinkHref}
		<a href={allLinkHref} class="cw-all-link {extraClass}" data-testid="{testIdPrefix}-all-link{suffix ? '-' + suffix : ''}" onclick={handleAllLink}>
			{allLinkLabel}
		</a>
	{/if}
{/snippet}

<div class="cw-root" data-testid="{testIdPrefix}-root">
	<!-- Controls row -->
	<div class="cw-controls" data-testid="{testIdPrefix}-controls">
		{#if title}
			<div class="cw-header-text">
				<h2 class="cw-title">{title}</h2>
				{#if subtitle}
					<p class="cw-subtitle">{subtitle}</p>
				{/if}
			</div>
		{/if}

		<div class="cw-controls__right">
			{#if view === 'carousel' && items.length > 1}
				<button
					class="view-btn autoplay-btn"
					class:active={autoplay && !isHovered}
					onclick={() => autoplayOverride = !autoplay}
					aria-label={autoplay ? $t('common.pause') : $t('common.play')}
					aria-pressed={autoplay}
					data-testid="{testIdPrefix}-autoplay-btn"
				>
					{#if autoplay}<Pause size={20} />{:else}<Play size={20} />{/if}
				</button>
			{/if}

			{#if config.showViewSwitcher}
				<div class="view-switcher" role="group" aria-label={$t('common.view')} data-testid="{testIdPrefix}-view-switcher">
					<button class="view-btn" class:active={view === 'carousel'} onclick={() => viewOverride = 'carousel'} aria-label={$t('news.viewCarousel')} aria-pressed={view === 'carousel'} data-testid="{testIdPrefix}-view-carousel-btn">
						<GalleryHorizontal size={20} />
					</button>
					<button class="view-btn hide-mobile" class:active={view === 'grid'} onclick={() => viewOverride = 'grid'} aria-label={$t('news.viewGrid')} aria-pressed={view === 'grid'} data-testid="{testIdPrefix}-view-grid-btn">
						<LayoutGrid size={20} />
					</button>
					<button class="view-btn" class:active={view === 'list'} onclick={() => viewOverride = 'list'} aria-label={$t('news.viewList')} aria-pressed={view === 'list'} data-testid="{testIdPrefix}-view-list-btn">
						<List size={20} />
					</button>
				</div>
			{/if}

			{#if mounted}
				{#if !isMobile}
					<div class="cw-desktop-only">
						{@render allLink('desktop', 'cw-all-link--inline')}
					</div>
				{/if}
			{:else}
				<div class="cw-desktop-only">
					{@render allLink('desktop', 'cw-all-link--inline')}
				</div>
			{/if}
		</div>
	</div>

	<!-- Carousel view -->
	{#if view === 'carousel'}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<section
			class="focus-viewport"
			aria-roledescription="carousel"
			aria-label={title}
			tabindex="0"
			data-testid="{testIdPrefix}-viewport"
			onmouseenter={() => isHovered = true}
			onmouseleave={() => { isHovered = false; isDragging = false; }}
			onmousedown={handleTouchStart}
			onmousemove={handleTouchMove}
			onmouseup={handleTouchEnd}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			onwheel={handleWheel}
			onclickcapture={handleClickCapture}
		>
			<div
				class="focus-track"
				style="
					transform: translateX(calc(50% - (var(--step-width) - var(--focus-gap)) / 2 - ({currentIndex} * var(--step-width)) + {dragOffset}px));
					transition: {isTransitioning && !isDragging ? `transform ${isAutoAdvancing ? '2.1s' : '0.7s'} cubic-bezier(0.16, 1, 0.3, 1)` : 'none'};
				"
				data-testid="{testIdPrefix}-track"
				ontransitionend={handleTransitionEnd}
			>
				{#each infiniteItems as item, i (item.id + i)}
					<ContentCard
						{item}
						variant="carousel"
						index={i}
						isActive={items.length > 0 && (i % items.length) === (currentIndex % items.length)}
						{linkPrefix}
						{readMoreLabel}
						testIdPrefix={cardTestIdPrefix}
					/>
				{/each}
			</div>

			{#if items.length > 1}
				<button class="nav-btn nav-btn--prev" onclick={prev} aria-label={$t('common.prev')} data-testid="{testIdPrefix}-prev-btn">←</button>
				<button class="nav-btn nav-btn--next" onclick={() => next(false)} aria-label={$t('common.next')} data-testid="{testIdPrefix}-next-btn">→</button>
			{/if}
		</section>

		{#if items.length > 1}
			<div class="focus-dots" data-testid="{testIdPrefix}-dots">
				{#each items as _, i}
					<button
						class="f-dot"
						class:active={(currentIndex % items.length) === i}
						onclick={() => goTo(i)}
						aria-label="{$t('common.slide')} {i + 1}"
						data-testid="{testIdPrefix}-dot-{i}"
					></button>
				{/each}
			</div>
		{/if}

	<!-- Grid view -->
	{:else if view === 'grid'}
		<div class="grid-view" data-testid="{testIdPrefix}-grid">
			{#each displayItems as item, i}
				<ContentCard {item} variant="grid" index={i} {linkPrefix} {readMoreLabel} testIdPrefix={cardTestIdPrefix} />
			{/each}
		</div>

	<!-- List view -->
	{:else}
		<div class="list-view" data-testid="{testIdPrefix}-list">
			{#each displayItems as item, i}
				<ContentCard {item} variant="list" index={i} {linkPrefix} {readMoreLabel} testIdPrefix={cardTestIdPrefix} />
			{/each}
		</div>
	{/if}

	{#if hasMore && !showingAll}
		<div class="cw-show-all">
			<button class="cw-show-all-btn" onclick={handleShowAll} data-testid="{testIdPrefix}-show-all-btn">
				{allLinkLabel || $t('common.showAll')}
			</button>
		</div>
	{/if}

	{#if mounted}
		{#if isMobile}
			<div class="cw-mobile-only cw-mobile-link-wrap">
				{@render allLink('mobile')}
			</div>
		{/if}
	{:else}
		<div class="cw-mobile-only cw-mobile-link-wrap">
			{@render allLink('mobile')}
		</div>
	{/if}
</div>

<style>
	.cw-root {
		position: relative;
		--focus-card-width: 600px;
		--focus-gap: 20px;
		--step-width: calc(var(--focus-card-width) + var(--focus-gap));
	}

	@media (max-width: 1024px) {
		.cw-root {
			--focus-card-width: min(500px, 85vw);
			--focus-gap: 15px;
		}
	}

	/* ─── Controls row ─────────────────────────────────── */
	.cw-controls {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-lg);
		margin-bottom: 0;
		padding: 0 var(--space-xl);
		width: 100%;
	}

	@media (max-width: 600px) {
		.cw-controls {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
			padding: 0 var(--space-md);
			margin-bottom: 0;
		}

		.cw-controls__right {
			width: 100%;
			display: flex;
			align-items: center;
		}
	}

	.cw-controls__right {
		display: flex;
		align-items: center;
		gap: var(--space-2xl);
		margin-left: auto;
	}

	.cw-desktop-only {
		display: block;
	}

	.cw-mobile-only {
		display: none;
	}

	@media (max-width: 1440px) {
		.cw-controls__right { gap: var(--space-xl); }
	}

	@media (max-width: 1200px) {
		.cw-controls__right { gap: var(--space-lg); }
	}

	@media (max-width: 1024px) {
		.cw-controls__right { gap: var(--space-md); }
		.cw-desktop-only { display: none; }
		.cw-mobile-only { display: block; }
	}

	.cw-mobile-link-wrap {
		margin-top: 1.5rem;
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 0 var(--space-md);
	}

	@media (max-width: 1024px) {
		.cw-controls__right { gap: var(--space-sm); }
	}

	@media (max-width: 480px) {
		.cw-controls__right { gap: var(--space-xs); }
	}

	.cw-header-text {
		margin-right: auto;
		text-align: left;
	}

	.cw-title {
		font-family: var(--font-heading);
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--color-deep-ocean);
		margin: 0;
		line-height: 1.1;
	}

	.cw-all-link--inline {
		padding: 0.5rem 1.5rem;
		font-size: 0.9rem;
		border-radius: 30px;
	}

	@media (max-width: 1024px) {
		.cw-title { font-size: 2rem; }
		.cw-subtitle { font-size: 1rem; }
	}

	.cw-subtitle {
		font-size: 1.1rem;
		color: var(--color-body-text);
		margin: 0.3rem 0 0;
		opacity: 0.8;
	}

	@media (max-width: 600px) {
		.cw-header-text {
			margin-right: 0;
			margin-bottom: 0.5rem;
			text-align: center;
		}
	}

	.cw-all-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-deep-ocean);
		color: var(--color-white);
		border: none;
		padding: 0.8rem 2.5rem;
		border-radius: 30px;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.3s ease;
	}

	@media (max-width: 1024px) {
		.cw-all-link {
			margin: 0 auto;
		}
	}

	@media (max-width: 600px) {
		.cw-all-link {
			width: 100%;
		}
	}

	.cw-all-link:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px color-mix(in srgb, var(--color-deep-ocean), transparent 80%);
		color: var(--color-white);
	}

	/* ─── View switcher (pills) ────────────────────────── */
	.view-switcher {
		display: flex;
		gap: var(--space-xs);
		background: color-mix(in srgb, var(--color-surface), transparent 20%);
		border-radius: 30px;
		padding: 0.3rem;
		border: 1px solid color-mix(in srgb, var(--color-deep-ocean), transparent 88%);
		margin-left: auto;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		background: transparent;
		border-radius: 25px;
		color: color-mix(in srgb, var(--color-deep-ocean), transparent 40%);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.view-btn:hover {
		color: var(--color-deep-ocean);
		background: color-mix(in srgb, var(--color-deep-ocean), transparent 92%);
	}

	.view-btn.active {
		background: var(--color-surface);
		color: var(--color-deep-ocean);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.autoplay-btn { width: 40px; height: 40px; }

	/* ─── Carousel ─────────────────────────────────────── */
	.focus-viewport {
		position: relative;
		height: 520px;
		margin: 0 auto;
		overflow: visible;
		touch-action: pan-y;
		user-select: none;
		cursor: grab;
	}

	.focus-viewport:active {
		cursor: grabbing;
	}

	@media (max-width: 1024px) {
		.focus-viewport {
			height: 300px;
			min-height: auto;
		}
	}

	.focus-track {
		display: flex;
		gap: var(--focus-gap);
		align-items: center;
		height: 100%;
		will-change: transform;
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: var(--color-surface);
		border: none;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		z-index: 10;
		font-size: 1.5rem;
		color: var(--color-deep-ocean);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-btn:hover {
		background: var(--color-deep-ocean);
		color: var(--color-white);
		transform: translateY(-50%) scale(1.1);
	}

	.nav-btn--prev { left: 40px; }
	.nav-btn--next { right: 40px; }

	.focus-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0;
		flex-wrap: wrap;
		padding: 0 var(--space-md);
	}

	.f-dot {
		width: 30px;
		height: 6px;
		border-radius: 3px;
		border: none;
		background: var(--color-border);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.f-dot.active {
		background: var(--color-deep-ocean);
		width: 60px;
	}

	@media (max-width: 480px) {
		.f-dot { width: 20px; }
		.f-dot.active { width: 40px; }
	}

	/* ─── Grid view ────────────────────────────────────── */
	.grid-view {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 2rem;
		padding: 3rem var(--space-xl);
	}

	@media (max-width: 1024px) {
		.grid-view {
			grid-template-columns: 1fr;
			padding: 3rem var(--space-md);
		}
	}

	/* ─── List view ────────────────────────────────────── */
	.list-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 3rem var(--space-xl);
	}

	@media (max-width: 1024px) {
		.list-view {
			padding: 3rem var(--space-md);
		}
	}

	/* ─── Show all button ──────────────────────────────── */
	.cw-show-all {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}

	.cw-show-all-btn {
		background: var(--color-deep-ocean);
		color: var(--color-white);
		border: none;
		padding: 0.8rem 2.5rem;
		border-radius: 16px;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.cw-show-all-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px color-mix(in srgb, var(--color-deep-ocean), transparent 80%);
	}

	/* ─── Responsive ───────────────────────────────────── */
	@media (max-width: 1024px) {
		.nav-btn { display: none; }
		.hide-mobile { display: none !important; }
	}
</style>
