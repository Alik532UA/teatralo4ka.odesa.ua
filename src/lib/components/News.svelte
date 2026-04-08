<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { getArticles, getDisplayDate } from '$lib/services/articles';

	interface NewsItem {
		id: string;
		slug?: string;
		title: string;
		date: string;
		image: string;
	}

	let newsItems = $state<NewsItem[]>([]);
	let loading = $state(true);
	let loadError = $state(false);
	let currentIndex = $state(0);
	let slideWidth = $state(33.333);

	const maxIndex = $derived(
		newsItems.length === 0 ? 0 : Math.max(0, Math.ceil(newsItems.length - 100 / slideWidth))
	);

	async function loadArticles() {
		try {
			const lang = (($locale as string) || 'uk') as 'uk' | 'en';
			const articles = await getArticles(lang, true);
			newsItems = articles.map(item => {
				const tr = item.translations?.[lang] ?? { title: '', content: '', isPublished: false };
				const timestamp = getDisplayDate(item);
				const dateStr = timestamp?.toDate
					? timestamp.toDate().toLocaleDateString(
							lang === 'uk' ? 'uk-UA' : 'en-US',
							{ day: 'numeric', month: 'short', year: 'numeric' }
					  )
					: '';
				return {
					id: item.id ?? '',
					slug: item.slug,
					title: tr.title || '',
					date: dateStr,
					image: tr.coverUrl || ''
				};
			});
		} catch (e) {
			console.error('News: failed to load articles', e);
			loadError = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		function updateSlideWidth() {
			if (window.innerWidth <= 640) slideWidth = 100;
			else if (window.innerWidth <= 1024) slideWidth = 50;
			else slideWidth = 33.333;
		}
		updateSlideWidth();
		window.addEventListener('resize', updateSlideWidth);

		const interval = setInterval(next, 15000);

		loadArticles();

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', updateSlideWidth);
		};
	});

	function next() {
		currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
	}

	function prev() {
		currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
	}

	function goTo(index: number) {
		currentIndex = index;
	}
</script>

{#if !loadError}
<section class="news" id="news-section" aria-labelledby="news-title" data-testid="news-section-container">
	<div class="container" data-testid="news-content-container">
		<div class="news__header" data-testid="news-header-group">
			<div class="news__title-group" data-testid="news-title-group">
				<h2 class="news__title" id="news-title" data-testid="news-title-label">
					{$t('news.title')}
				</h2>
				<p class="news__subtitle" data-testid="news-subtitle-label">{$t('news.subtitle')}</p>
			</div>
			
			<div class="news__nav" data-testid="news-nav-group">
				<a href={`${base}/news`} class="news__all-link" data-testid="news-all-link">
					{$t('news.allNews')}
					<span class="news__all-icon" aria-hidden="true">→</span>
				</a>
			</div>
		</div>

		<div class="news__carousel" data-testid="news-carousel-container">
			<div class="focus-viewport" role="region" aria-label={$t('news.title')} aria-roledescription="carousel" data-testid="news-carousel-viewport">
				<div 
					class="focus-track" 
					style="transform: translateX(-{currentIndex * slideWidth}%);"
					data-testid="news-carousel-track-group"
				>
					{#each newsItems as item}
						<div class="focus-slide" role="group" aria-roledescription="slide" data-testid={`news-slide-${item.id}-group`}>
							<article class="news-card" data-testid={`news-article-${item.id}`}>
								<div class="news-card__image-wrap" data-testid={`news-image-wrap-${item.id}`}>
									{#if item.image}
										<img src={item.image} alt={item.title} class="news-card__image" loading="lazy" />
									{/if}
									<div class="news-card__overlay" data-testid={`news-card-overlay-${item.id}`}></div>
								</div>
								<div class="news-card__content" data-testid={`news-card-content-${item.id}`}>
									<time class="news-card__date" data-testid={`news-card-date-${item.id}`}>{item.date}</time>
									<h3 class="news-card__title" data-testid={`news-card-title-${item.id}`}>{item.title}</h3>
									<a href={`${base}/news/${item.slug ?? item.id}`} class="news-card__link" data-testid={`news-card-link-${item.id}`}>
										{$t('news.readMore')}
									</a>
								</div>
							</article>
						</div>
					{/each}
				</div>

				<button class="nav-btn nav-btn--prev" onclick={prev} aria-label="Попередній слайд" data-testid="news-prev-button">←</button>
				<button class="nav-btn nav-btn--next" onclick={next} aria-label="Наступний слайд" data-testid="news-next-button">→</button>
			</div>

			<div class="focus-dots" role="tablist" aria-label={$t('news.title')} data-testid="news-dots-menu">
				{#each {length: maxIndex + 1} as _, i}
					<button 
						class="focus-dot" 
						class:active={currentIndex === i} 
						role="tab" 
						aria-selected={currentIndex === i}
						aria-label="Слайд {i + 1}"
						onclick={() => goTo(i)}
						data-testid={`news-dot-${i}-button`}
					></button>
				{/each}
			</div>
		</div>
	</div>
</section>
{/if}

<style>
	.news {
		padding: var(--space-2xl) 0;
		background: transparent;
		overflow: hidden;
	}

	.news__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: var(--space-2xl);
		gap: var(--space-xl);
	}

	.news__title {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 800;
		color: var(--color-deep-ocean);
		margin-bottom: var(--space-xs);
	}

	.news__subtitle {
		font-size: 1.1rem;
		color: var(--color-muted-text);
		max-width: 500px;
	}

	.news__all-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-family: var(--font-heading);
		font-weight: 700;
		color: var(--color-sea-blue);
		text-decoration: none;
		transition: all var(--transition-base);
	}

	.news__all-link:hover {
		color: var(--color-deep-ocean);
		transform: translateX(5px);
	}

	.news__carousel {
		position: relative;
	}

	.focus-viewport {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-2xl);
		cursor: grab;
	}

	.focus-track {
		display: flex;
		transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform;
	}

	.focus-slide {
		flex: 0 0 33.333%;
		min-width: 33.333%;
		padding: 0 var(--space-md);
	}

	@media (max-width: 1024px) {
		.focus-slide { flex: 0 0 50%; min-width: 50%; }
	}

	@media (max-width: 640px) {
		.focus-slide { flex: 0 0 100%; min-width: 100%; }
	}

	.news-card {
		background: var(--color-surface);
		border-radius: var(--radius-xl);
		overflow: hidden;
		height: 100%;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
		border: 1px solid rgba(0,0,0,0.05);
	}

	.news-card:hover {
		transform: translateY(-10px);
		box-shadow: var(--shadow-lg);
	}

	.news-card__image-wrap {
		position: relative;
		height: 240px;
		overflow: hidden;
	}

	.news-card__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.8s ease;
	}

	.news-card:hover .news-card__image {
		transform: scale(1.1);
	}

	.news-card__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, color-mix(in srgb, var(--color-dark-text, #000), transparent 40%), transparent);
		opacity: 0.6;
	}

	.news-card__content {
		padding: var(--space-xl);
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.news-card__date {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-sea-blue);
		margin-bottom: var(--space-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.news-card__title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
		margin-bottom: var(--space-lg);
		line-height: 1.3;
	}

	.news-card__link {
		margin-top: auto;
		font-weight: 700;
		color: var(--color-sea-blue);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.news-card__link:hover {
		gap: calc(var(--space-xs) + 5px);
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: var(--color-surface);
		border: none;
		box-shadow: var(--shadow-md);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 10;
		transition: all var(--transition-base);
		font-size: 1.5rem;
		color: var(--color-deep-ocean);
	}

	.nav-btn:hover {
		background: var(--color-sea-blue);
		color: var(--color-white);
		transform: translateY(-50%) scale(1.1);
	}

	.nav-btn--prev { left: var(--space-md); }
	.nav-btn--next { right: var(--space-md); }

	.focus-dots {
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		margin-top: var(--space-xl);
	}

	.focus-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-sky-blue);
		border: none;
		cursor: pointer;
		transition: all var(--transition-base);
		padding: 0;
	}

	.focus-dot.active {
		width: 30px;
		background: var(--color-sea-blue);
		border-radius: var(--radius-full);
	}
</style>
