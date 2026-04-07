<script lang="ts">
	import Wave from "$lib/components/Wave.svelte";
	import BirdIcon from "$lib/components/icons/BirdIcon.svelte";
	import PhotoIcon from "$lib/components/icons/PhotoIcon.svelte";
	import { page } from "$app/state";
	import { browser } from "$app/environment";
	import { replaceState } from "$app/navigation";
	import { onMount, untrack } from "svelte";
	import { base } from "$app/paths";
	import { getArticles, getDisplayDate } from "$lib/services/articles";
	import { ARTICLE_CATEGORIES, type ArticleCategory } from "$lib/config/categories";
	import { locale } from "svelte-i18n";

	let newsItems = $state<any[]>([]);
	let infiniteNews = $state<any[]>([]);
	let currentIndex = $state(1);
	let isTransitioning = $state(true);
	let mounted = $state(false);
	let loading = $state(true);
	let isAnimating = $state(false);

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
			setTimeout(() => {
				mounted = true;
			}, 100);
		}
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
	<title>Новини та події - Одеська театральна школа</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<!-- News Section -->
<section class="news" id="news-section" aria-labelledby="news-title" style="padding-top: 140px;">
	<div class="container">
		<div class="news__header">
			<div class="news__title-group">
				<h2 class="news__title" id="news-title">
					НОВИНИ ТА ПОДІЇ
				</h2>
				<p class="news__subtitle">Будьте в курсі життя нашої школи</p>
			</div>
		</div>

		{#if loading}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold;">Завантаження новин...</p>
		{:else if infiniteNews.length > 0}
			<div class="focus-viewport">
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
						<article class="focus-card" class:is-active={currentIndex === i} data-testid="news-page-card-{i}">
						<div class="focus-card__img-wrap" style={item.coverUrl ? '' : `background: linear-gradient(45deg, ${item.color}, var(--color-white))`}>
							{#if item.coverUrl}
								<img src={item.coverUrl} alt={item.title} class="focus-card__img" />
							{:else}
								<PhotoIcon size={64} className="focus-card__placeholder" />
							{/if}
							</div>
							<div class="focus-card__content">
								<div class="focus-card__meta">
									<span class="tag">{item.category}</span>
									<time class="date">{item.date}</time>
								</div>
								<h3 class="focus-card__title">{item.title}</h3>
								<p class="focus-card__excerpt">{item.excerpt}</p>
								<a href="{base}/news/{item.id}" class="btn-more" data-testid="news-page-readmore-{i}">Читати далі →</a>
							</div>
						</article>
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
		{:else}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold; font-size: 1.2rem;">Новин поки немає.</p>
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
		margin-bottom: 4rem;
		text-align: center;
	}

	.news__title {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-deep-ocean);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
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

	.focus-card {
		flex: 0 0 600px;
		height: 400px;
		background: var(--color-white);
		border-radius: 40px;
		display: flex;
		overflow: hidden;
		transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
		opacity: 0.3;
		transform: scale(0.85);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.03);
	}

	.focus-card.is-active {
		opacity: 1;
		transform: scale(1);
		box-shadow: 0 40px 80px rgba(0, 0, 0, 0.12);
	}

	.focus-card__img-wrap {
		flex: 0 0 40%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.focus-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	:global(.focus-card__placeholder) {
		opacity: 0.2;
		color: var(--color-deep-ocean);
	}

	.focus-card__content {
		padding: 3rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		flex: 1;
	}

	.focus-card__meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.tag {
		background: var(--color-deep-ocean);
		color: white;
		padding: 0.4rem 1rem;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.date {
		font-size: 0.9rem;
		color: var(--color-muted-text);
		font-weight: 500;
	}

	.focus-card__title {
		font-family: var(--font-heading);
		font-size: 1.8rem;
		font-weight: 800;
		color: var(--color-deep-ocean);
		line-height: 1.2;
		margin-bottom: 1rem;
	}

	.focus-card__excerpt {
		color: var(--color-body-text);
		line-height: 1.6;
		margin-bottom: 2rem;
		opacity: 0.8;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.btn-more {
		background: var(--color-deep-ocean);
		color: white;
		text-decoration: none;
		padding: 0.8rem 1.8rem;
		border-radius: 16px;
		font-weight: 700;
		width: fit-content;
		transition: all 0.3s ease;
	}

	.btn-more:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px rgba(27, 94, 123, 0.2);
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: var(--color-white);
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
		color: white;
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

	@media (max-width: 1024px) {
		.focus-card {
			flex: 0 0 500px;
		}
	}

	@media (max-width: 768px) {
		.news {
			padding: 4rem 0;
		}
		.focus-card {
			flex: 0 0 90%;
			flex-direction: column;
			height: auto;
		}
		.focus-card__img-wrap {
			height: 200px;
		}
		.nav-btn {
			display: none;
		}
		.focus-card__content {
			padding: 2rem;
		}
		.focus-card__title {
			font-size: 1.5rem;
		}
		.news__title {
			font-size: 2.2rem;
		}
	}
</style>
