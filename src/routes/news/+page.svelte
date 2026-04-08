<script lang="ts">
	import Wave from "$lib/components/Wave.svelte";
	import BirdIcon from "$lib/components/icons/BirdIcon.svelte";
	import NewsCard from "$lib/components/NewsCard.svelte";
	import { GalleryHorizontal, LayoutGrid, List } from 'lucide-svelte';
	import { page } from "$app/state";
	import { browser } from "$app/environment";
	import { replaceState } from "$app/navigation";
	import { onMount, untrack } from "svelte";
	import { base } from "$app/paths";
	import { getArticles, getDisplayDate } from "$lib/services/articles";
	import { ARTICLE_CATEGORIES, type ArticleCategory } from "$lib/config/categories";
	import { locale, t } from "svelte-i18n";

	let newsItems = $state<any[]>([]);
	let infiniteNews = $state<any[]>([]);
	let currentIndex = $state(1);
	let isTransitioning = $state(true);
	let mounted = $state(false);
	let loading = $state(true);
	let isAnimating = $state(false);
	let view = $state<'carousel' | 'grid' | 'list'>('carousel');

	const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C", "#F7FFF7", "#FF9F1C"];

	onMount(async () => {
		try {
			const lang = ($locale as "uk" | "en") || "uk";
			// Fetch all published articles for current language
			const allArticles = await getArticles(lang, true);

			if (allArticles.length > 0) {
				newsItems = allArticles.map((item, index) => {
					let dateStr = "";
					const timestamp = getDisplayDate(item);
					if (timestamp?.toDate) {
						dateStr = timestamp.toDate().toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
					}
					
					const translation = item.translations?.[lang as 'uk' | 'en'] || { title: '', content: '' };
					// Remove HTML/Markdown tags for excerpt
					const plainText = (translation.content || '').replace(/[#*`_\[\]()]/g, '');
					
					const categoryKey = item.category as ArticleCategory;
					const categoryName = ARTICLE_CATEGORIES[categoryKey]?.[$locale === 'en' ? 'en' : 'uk'] || item.category;

					return {
						id: item.id,
						slug: item.slug,
						title: translation.title || '',
						date: dateStr,
						category: categoryName,
						excerpt: plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText,
						color: colors[index % colors.length],
						coverUrl: translation.coverUrl || ''
					};
				});

				if (newsItems.length > 1) {
					infiniteNews = [newsItems[newsItems.length - 1], ...newsItems, newsItems[0]];
				} else if (newsItems.length === 1) {
					infiniteNews = [newsItems[0], newsItems[0], newsItems[0]];
				}

				const initial = page.url.searchParams.get("news_page");
				if (initial) {
					currentIndex = parseInt(initial) + 1;
				}
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
			const savedView = browser ? localStorage.getItem('news-view') as 'carousel' | 'grid' | 'list' | null : null;
			if (savedView && ['carousel', 'grid', 'list'].includes(savedView)) {
				view = savedView;
			}
			setTimeout(() => {
				mounted = true;
			}, 100);
		}
	});

	$effect(() => {
		if (browser) localStorage.setItem('news-view', view);
	});

	function next() {
		if (isAnimating || infiniteNews.length <= 1) return;
		isAnimating = true;
		currentIndex++;
	}

	function prev() {
		if (isAnimating || infiniteNews.length <= 1) return;
		isAnimating = true;
		currentIndex--;
	}

	function goTo(i: number) {
		if (isAnimating || infiniteNews.length <= 1) return;
		if (i + 1 === currentIndex) return; // вже на цьому слайді — не блокувати carousel
		isAnimating = true;
		currentIndex = i + 1;
	}

	function handleTransitionEnd(e: TransitionEvent) {
		// Ігноруємо transitionend від дочірніх елементів (.focus-card transition: all),
		// які спливають вгору і можуть спрацювати раніше ніж translateX треку
		if (e.target !== e.currentTarget) return;
		if (e.propertyName !== 'transform') return;
		if (currentIndex >= infiniteNews.length - 1) {
			isTransitioning = false;
			currentIndex = 1;
			requestAnimationFrame(() => requestAnimationFrame(() => {
				isTransitioning = true;
				isAnimating = false;
			}));
		} else if (currentIndex <= 0) {
			isTransitioning = false;
			currentIndex = infiniteNews.length - 2;
			requestAnimationFrame(() => requestAnimationFrame(() => {
				isTransitioning = true;
				isAnimating = false;
			}));
		} else {
			isAnimating = false;
		}
	}

	$effect(() => {
		if (!mounted || !browser || newsItems.length === 0) return;
		const realIndex = (currentIndex - 1 + newsItems.length) % newsItems.length;
		
		untrack(() => {
			const currentParam = page.url.searchParams.get("news_page");
			if (currentParam === realIndex.toString() && (realIndex !== 0 || !currentParam)) return;

			const url = new URL(page.url.href);
			if (realIndex > 0) {
				url.searchParams.set("news_page", realIndex.toString());
			} else {
				url.searchParams.delete("news_page");
			}
			
			try {
				replaceState(url.toString(), { keepfocus: true });
			} catch (e) {
			}
		});
	});

	function handleKeydown(e: KeyboardEvent) {
		if (typeof document !== "undefined" && ["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName)) return;
		if (e.key === "ArrowLeft") prev();
		else if (e.key === "ArrowRight") next();
	}
</script>

<svelte:head>
	<title>{$t('news.title')} | {$t('seo.brandTitle')}</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<!-- News Section -->
<section class="news" id="news-section" aria-labelledby="news-title" style="padding-top: 140px;" data-testid="news-page-section">
	<div class="container" data-testid="news-page-container">
		<div class="news__header" data-testid="news-page-header-group">
			<div class="news__title-group" data-testid="news-page-title-group">
				<h2 class="news__title" id="news-title" data-testid="news-page-title-label">
					{$t('news.title')}
				</h2>
				<p class="news__subtitle" data-testid="news-page-subtitle-label">{$t('news.subtitle')}</p>
			</div>
			<div class="view-switcher" data-testid="news-view-switcher" role="group" aria-label="Вигляд">
				<button
					class="view-btn"
					class:active={view === 'carousel'}
					onclick={() => view = 'carousel'}
					aria-label={$t('news.viewCarousel')}
					aria-pressed={view === 'carousel'}
					data-testid="news-view-carousel-btn"
				><GalleryHorizontal size={20} /></button>
				<button
					class="view-btn"
					class:active={view === 'grid'}
					onclick={() => view = 'grid'}
					aria-label={$t('news.viewGrid')}
					aria-pressed={view === 'grid'}
					data-testid="news-view-grid-btn"
				><LayoutGrid size={20} /></button>
				<button
					class="view-btn"
					class:active={view === 'list'}
					onclick={() => view = 'list'}
					aria-label={$t('news.viewList')}
					aria-pressed={view === 'list'}
					data-testid="news-view-list-btn"
				><List size={20} /></button>
			</div>
		</div>

		{#if loading}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold;" data-testid="news-page-loading-label">{$t('news.loading')}</p>
		{:else if newsItems.length > 0}
			{#if view === 'carousel'}
			<div class="focus-viewport" data-testid="news-page-viewport-container">
				<div
					class="focus-track"
					style="
						transform: translateX(calc(50% - 300px - {currentIndex * 620}px));
						transition: {isTransitioning ? 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'};
					"
					data-testid="news-page-carousel-track"
					ontransitionend={handleTransitionEnd}
				>
					{#each infiniteNews as item, i}
						<NewsCard {item} variant="carousel" index={i} isActive={currentIndex === i} />
					{/each}
				</div>

				{#if newsItems.length > 1}
					<button class="nav-btn nav-btn--prev" onclick={prev} aria-label="Попередній слайд" data-testid="news-page-prev-btn">←</button>
					<button class="nav-btn nav-btn--next" onclick={next} aria-label="Наступний слайд" data-testid="news-page-next-btn">→</button>
				{/if}
			</div>

			{#if newsItems.length > 1}
				<div class="focus-dots" data-testid="news-page-dots">
					{#each newsItems as _, i}
						<button
							class="f-dot"
							class:active={(currentIndex - 1 + newsItems.length) % newsItems.length === i}
							onclick={() => goTo(i)}
							aria-label="Слайд {i + 1}"
							data-testid="news-page-dot-{i}"
						></button>
					{/each}
				</div>
			{/if}

			{:else if view === 'grid'}
			<div class="grid-view" data-testid="news-page-grid-container">
				{#each newsItems as item, i}
				<NewsCard {item} variant="grid" index={i} />
			{/each}
			</div>

			{:else}
			<div class="list-view" data-testid="news-page-list-container">
				{#each newsItems as item, i}
				<NewsCard {item} variant="list" index={i} />
			{/each}
			</div>
			{/if}
		{:else}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold; font-size: 1.2rem;" data-testid="news-page-empty-label">{$t('news.empty')}</p>
		{/if}
	</div>
</section>

<style>
	.news {
		background: var(--color-light-blue);
		padding: 4rem 0 6rem;
		overflow: hidden;
		position: relative;
	}

	.news__header {
		/* layout defined in view-switcher section below */
		padding: 0 var(--space-xl);
	}

	.news__title {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-deep-ocean);
		margin-bottom: 1rem;
	}

	.news__subtitle {
		font-size: 1.2rem;
		color: var(--color-body-text);
		opacity: 0.7;
	}

	.focus-viewport {
		position: relative;
		height: 480px;
		margin: 0 auto;
	}

	.focus-track {
		display: flex;
		gap: 20px;
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

	.nav-btn--prev {
		left: 40px;
	}
	.nav-btn--next {
		right: 40px;
	}

	.focus-dots {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 4rem;
	}

	.f-dot {
		width: 40px;
		height: 6px;
		border-radius: 3px;
		border: none;
		background: var(--color-border);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.f-dot.active {
		background: var(--color-deep-ocean);
		width: 80px;
	}

	@media (max-width: 768px) {
		.news {
			padding: 4rem 0;
		}
		.nav-btn {
			display: none;
		}
		.news__title {
			font-size: 2.2rem;
		}
		.grid-view {
			grid-template-columns: 1fr;
		}
	}

	/* ─── View Switcher ─────────────────────────────────── */
	.news__header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-lg);
		margin-bottom: 4rem;
	}

	.news__title-group {
		text-align: left;
	}

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
		background: var(--color-deep-ocean);
		color: var(--color-white);
	}

	/* ─── Grid View ─────────────────────────────────────── */
	.grid-view {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		padding: 0 var(--space-xl);
	}

	/* ─── List View ─────────────────────────────────────── */
	.list-view {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 0 var(--space-xl);
	}

	@media (max-width: 1024px) {
		.grid-view {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
