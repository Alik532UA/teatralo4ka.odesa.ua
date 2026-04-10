<script lang="ts">
	import NewsCard from '$lib/components/NewsCard.svelte';
	import { GalleryHorizontal, LayoutGrid, List, Play, Pause } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';
	import type { NewsWidgetConfig, NewsViewMode } from '$lib/services/settings';

	export interface NewsWidgetItem {
		id: string;
		slug?: string;
		title: string;
		date: string;
		category: string;
		excerpt: string;
		color: string;
		coverUrl: string;
	}

	interface Props {
		items: NewsWidgetItem[];
		config: NewsWidgetConfig;
		/** Show "all news →" link to /news page (homepage only) */
		showAllLink?: boolean;
		/** Persist view mode to localStorage under this key. '' disables persistence. */
		storageKey?: string;
	}

	let { items, config, showAllLink = false, storageKey = '' }: Props = $props();

	// ── View state ────────────────────────────────────────────────────────────
	let viewOverride = $state<NewsViewMode | null>(null);
	let autoplayOverride = $state<boolean | null>(null);
	const view = $derived(viewOverride ?? config.defaultView);
	const autoplay = $derived(autoplayOverride ?? config.autoplay);
	let isAutoAdvancing = $state(false);
	let isHovered = $state(false);
	let mounted = $state(false);

	// ── Carousel state ────────────────────────────────────────────────────────
	let currentIndex = $state(2);
	let isTransitioning = $state(true);
	let infiniteNews = $state<NewsWidgetItem[]>([]);

	// ── Max items for grid/list ───────────────────────────────────────────────
	let showingAll = $state(false);

	const maxItemsForCurrentView = $derived(view === 'grid' ? config.maxItemsGrid : view === 'list' ? config.maxItemsList : 0);

	const displayItems = $derived.by(() => {
		if (view === 'carousel' || maxItemsForCurrentView <= 0 || showingAll) return items;
		return items.slice(0, maxItemsForCurrentView);
	});

	const hasMore = $derived(maxItemsForCurrentView > 0 && items.length > maxItemsForCurrentView && view !== 'carousel');

	// ── Init ──────────────────────────────────────────────────────────────────
	$effect(() => {
		if (items.length === 0) return;

		// Build reordered list (pinned article at front for carousel)
		let ordered = [...items];
		if (config.pinnedArticleId) {
			const pinIdx = ordered.findIndex(it => it.id === config.pinnedArticleId);
			if (pinIdx > 0) {
				const [pinned] = ordered.splice(pinIdx, 1);
				ordered.unshift(pinned);
			}
		}

		if (ordered.length > 1) {
			infiniteNews = [
				ordered[ordered.length - 2],
				ordered[ordered.length - 1],
				...ordered,
				ordered[0],
				ordered[1],
			];
			currentIndex = 2;
		} else {
			infiniteNews = [ordered[0], ordered[0], ordered[0], ordered[0], ordered[0]];
			currentIndex = 2;
		}
	});

	onMount(() => {
		if (storageKey) {
			const saved = localStorage.getItem(storageKey) as NewsViewMode | null;
			if (saved && ['carousel', 'grid', 'list'].includes(saved)) {
				viewOverride = config.showViewSwitcher ? saved : null;
			}
		}
		setTimeout(() => { mounted = true; }, 100);
	});

	// Persist view to localStorage
	$effect(() => {
		if (browser && storageKey && viewOverride) localStorage.setItem(storageKey, view);
	});

	// ── Carousel navigation ───────────────────────────────────────────────────
	function next(fromAuto = false) {
		if (!isTransitioning || infiniteNews.length <= 1) return;
		if (!fromAuto) autoplayOverride = false;
		isAutoAdvancing = fromAuto;
		currentIndex++;
	}

	function prev() {
		if (!isTransitioning || infiniteNews.length <= 1) return;
		autoplayOverride = false;
		isAutoAdvancing = false;
		currentIndex--;
	}

	function goTo(i: number) {
		if (!isTransitioning || infiniteNews.length <= 1) return;
		if (i + 2 === currentIndex) return;
		autoplayOverride = false;
		isAutoAdvancing = false;
		currentIndex = i + 2;
	}

	function handleTransitionEnd(e: TransitionEvent) {
		if (e.target !== e.currentTarget) return;
		if (e.propertyName !== 'transform') return;

		const total = infiniteNews.length;
		if (currentIndex >= total - 2) {
			isTransitioning = false;
			currentIndex = 2;
			setTimeout(() => { isTransitioning = true; }, 30);
		} else if (currentIndex <= 1) {
			isTransitioning = false;
			currentIndex = total - 3;
			setTimeout(() => { isTransitioning = true; }, 30);
		}
	}

	function autoNext() { next(true); }

	// ── Autoplay interval ─────────────────────────────────────────────────────
	$effect(() => {
		if (!mounted || !autoplay || isHovered || view !== 'carousel' || infiniteNews.length <= 1) return;
		const id = setInterval(autoNext, 7000);
		return () => clearInterval(id);
	});

	// ── Keyboard ──────────────────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent) {
		if (typeof document !== 'undefined' && ['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) return;
		if (view !== 'carousel') return;
		if (e.key === 'ArrowLeft') prev();
		else if (e.key === 'ArrowRight') next(false);
	}

	function handleShowAll() {
		if (showAllLink) {
			if (browser) {
				const viewToSave = view === 'list' ? 'list' : 'grid';
				localStorage.setItem('news-view', viewToSave);
			}
			goto(`${base}/news`);
		} else {
			showingAll = true;
		}
	}

	function handleAllNewsLink(e: MouseEvent) {
		e.preventDefault();
		if (browser) {
			const viewToSave = view === 'list' ? 'list' : 'grid';
			localStorage.setItem('news-view', viewToSave);
		}
		goto(`${base}/news`);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="nw-root" data-testid="news-widget-root">
	<!-- Controls row -->
	<div class="nw-controls" data-testid="news-widget-controls">
		{#if showAllLink}
			<a href="{base}/news" class="nw-all-link" data-testid="news-widget-all-link" onclick={handleAllNewsLink}>
				{$t('news.allNews')}
			</a>
		{/if}

		<div class="nw-controls__right">
			{#if view === 'carousel' && items.length > 1}
				<button
					class="view-btn autoplay-btn"
					class:active={autoplay && !isHovered}
				onclick={() => autoplayOverride = !autoplay}
					aria-label={autoplay ? 'Pause' : 'Play'}
					aria-pressed={autoplay}
					data-testid="news-widget-autoplay-btn"
				>
					{#if autoplay}<Pause size={20} />{:else}<Play size={20} />{/if}
				</button>
			{/if}

			{#if config.showViewSwitcher}
				<div class="view-switcher" role="group" aria-label="View" data-testid="news-widget-view-switcher">
					<button class="view-btn" class:active={view === 'carousel'} onclick={() => viewOverride = 'carousel'} aria-label={$t('news.viewCarousel')} aria-pressed={view === 'carousel'} data-testid="news-widget-view-carousel-btn">
						<GalleryHorizontal size={20} />
					</button>
					<button class="view-btn" class:active={view === 'grid'} onclick={() => viewOverride = 'grid'} aria-label={$t('news.viewGrid')} aria-pressed={view === 'grid'} data-testid="news-widget-view-grid-btn">
						<LayoutGrid size={20} />
					</button>
					<button class="view-btn" class:active={view === 'list'} onclick={() => viewOverride = 'list'} aria-label={$t('news.viewList')} aria-pressed={view === 'list'} data-testid="news-widget-view-list-btn">
						<List size={20} />
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Carousel view -->
	{#if view === 'carousel'}
		<div class="focus-viewport" role="region" aria-label={$t('news.title')} data-testid="news-widget-viewport"
			onmouseenter={() => isHovered = true}
			onmouseleave={() => isHovered = false}
		>
			<div
				class="focus-track"
				style="
					transform: translateX(calc(50% - (var(--step-width) - var(--focus-gap)) / 2 - ({currentIndex} * var(--step-width))));
					transition: {isTransitioning ? `transform ${isAutoAdvancing ? '2.1s' : '0.7s'} cubic-bezier(0.16, 1, 0.3, 1)` : 'none'};
				"
				data-testid="news-widget-track"
				ontransitionend={handleTransitionEnd}
			>
				{#each infiniteNews as item, i}
					<NewsCard
						{item}
						variant="carousel"
						index={i}
						isActive={items.length > 0 && (i - 1 + items.length) % items.length === (currentIndex - 1 + items.length) % items.length}
					/>
				{/each}
			</div>

			{#if items.length > 1}
				<button class="nav-btn nav-btn--prev" onclick={prev} aria-label="Previous slide" data-testid="news-widget-prev-btn">←</button>
				<button class="nav-btn nav-btn--next" onclick={() => next(false)} aria-label="Next slide" data-testid="news-widget-next-btn">→</button>
			{/if}
		</div>

		{#if items.length > 1}
			<div class="focus-dots" data-testid="news-widget-dots">
				{#each items as _, i}
					<button
						class="f-dot"
						class:active={(currentIndex - 1 + items.length) % items.length === i}
						onclick={() => goTo(i)}
						aria-label="Slide {i + 1}"
						data-testid="news-widget-dot-{i}"
					></button>
				{/each}
			</div>
		{/if}

	<!-- Grid view -->
	{:else if view === 'grid'}
		<div class="grid-view" data-testid="news-widget-grid">
			{#each displayItems as item, i}
				<NewsCard {item} variant="grid" index={i} />
			{/each}
		</div>
		{#if hasMore && !showingAll}
			<div class="nw-show-all">
				<button class="nw-show-all-btn" onclick={handleShowAll} data-testid="news-widget-show-all-btn">
					{$t('admin.settings.newsShowAll')}
				</button>
			</div>
		{/if}

	<!-- List view -->
	{:else}
		<div class="list-view" data-testid="news-widget-list">
			{#each displayItems as item, i}
				<NewsCard {item} variant="list" index={i} />
			{/each}
		</div>
		{#if hasMore && !showingAll}
			<div class="nw-show-all">
				<button class="nw-show-all-btn" onclick={handleShowAll} data-testid="news-widget-show-all-btn">
					{$t('admin.settings.newsShowAll')}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.nw-root {
		position: relative;
		--focus-card-width: 600px;
		--focus-gap: 20px;
		--step-width: calc(var(--focus-card-width) + var(--focus-gap));
	}

	@media (max-width: 1024px) {
		.nw-root {
			--focus-card-width: 500px;
		}
	}

	@media (max-width: 768px) {
		.nw-root {
			--focus-card-width: 85vw;
			--focus-gap: 15px;
		}
	}

	/* ─── Controls row ─────────────────────────────────── */
	.nw-controls {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-lg);
		margin-bottom: 2rem;
		padding: 0 var(--space-xl);
	}

	@media (max-width: 600px) {
		.nw-controls {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
			padding: 0 var(--space-md);
		}
		
		.nw-controls__right {
			justify-content: space-between;
			width: 100%;
		}
	}

	.nw-controls__right {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.nw-all-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-deep-ocean);
		color: var(--color-white);
		border: none;
		padding: 0.8rem 2.5rem;
		border-radius: 16px;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.3s ease;
		margin-right: auto;
	}

	@media (max-width: 600px) {
		.nw-all-link {
			margin-right: 0;
			width: 100%;
		}
	}

	.nw-all-link:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px color-mix(in srgb, var(--color-deep-ocean), transparent 80%);
		color: var(--color-white);
	}

	/* ─── View switcher (pills) ────────────────────────── */
	.view-switcher {
		display: flex;
		gap: var(--space-xs);
		background: color-mix(in srgb, var(--color-surface), transparent 20%);
		border-radius: var(--radius-full, 100px);
		padding: 0.3rem;
		border: 1px solid color-mix(in srgb, var(--color-deep-ocean), transparent 88%);
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		background: transparent;
		border-radius: var(--radius-full, 100px);
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
	}

	@media (max-width: 768px) {
		.focus-viewport {
			height: auto;
			min-height: 500px;
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
		margin-top: 3rem;
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
		padding: 0 var(--space-xl);
	}

	@media (max-width: 900px) {
		.grid-view {
			grid-template-columns: 1fr;
			padding: 0 var(--space-md);
		}
	}

	/* ─── List view ────────────────────────────────────── */
	.list-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 0 var(--space-xl);
	}

	@media (max-width: 768px) {
		.list-view {
			padding: 0 var(--space-md);
		}
	}

	/* ─── Show all button ──────────────────────────────── */
	.nw-show-all {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}

	.nw-show-all-btn {
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

	.nw-show-all-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px color-mix(in srgb, var(--color-deep-ocean), transparent 80%);
	}

	/* ─── Responsive ───────────────────────────────────── */
	@media (max-width: 768px) {
		.nav-btn { display: none; }
	}
</style>
</style>
