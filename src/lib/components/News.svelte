<script lang="ts">
	import Wave from "./Wave.svelte";
	import PhotoIcon from "./icons/PhotoIcon.svelte";
	import BirdIcon from "./icons/BirdIcon.svelte";
	import { page } from "$app/state";
	import { browser } from "$app/environment";
	import { replaceState } from "$app/navigation";
	import { onMount, untrack } from "svelte";
	import { base } from "$app/paths";
	import { CarouselController } from "$lib/controllers/Carousel.svelte";
	import { getArticles, type Article } from "$lib/services/articles";
	import { locale } from "svelte-i18n";

	let articles = $state<Article[]>([]);
	let loading = $state(true);
	let carousel = $state<CarouselController | null>(null);
	let mounted = $state(false);

	async function loadNews() {
		const lang = ($locale as "uk" | "en") || "uk";
		articles = await getArticles("news", lang);
		
		if (articles.length > 0) {
			// Ініціалізуємо карусель тільки коли є дані
			carousel = new CarouselController(articles.length + 2, 1);
		}
		loading = false;
	}

	$effect(() => {
		loadNews();
	});

	// Логіка для БЕЗКІНЕЧНОГО слайдера
	const infiniteNews = $derived(articles.length > 0 
		? [articles[articles.length - 1], ...articles, articles[0]] 
		: []);
	
	// Sync slide with URL
	$effect(() => {
		if (!mounted || !browser || !carousel || articles.length === 0) return;
		const realIndex = (carousel.currentIndex - 1 + articles.length) % articles.length;
		
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
			} catch (e) {}
		});
	});

	onMount(() => {
		setTimeout(() => {
			if (carousel) {
				const initial = page.url.searchParams.get("news_page");
				if (initial) {
					carousel.currentIndex = parseInt(initial) + 1;
				}
			}
			mounted = true;
		}, 200);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!carousel) return;
		if (typeof document !== "undefined" && ["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName)) return;
		if (e.key === "ArrowLeft") carousel.prev();
		else if (e.key === "ArrowRight") carousel.next();
	}

	function formatDate(timestamp: any) {
		if (!timestamp) return "";
		const date = timestamp.toDate();
		return date.toLocaleDateString($locale || 'uk', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<section class="news" id="news-section" aria-labelledby="news-title">
	<div class="container">
		<div class="news__header">
			<div class="news__title-group">
				<h2 class="news__title" id="news-title">
					НОВИНИ ТА ПОДІЇ
					<BirdIcon className="news__title-bird" size={45} />
				</h2>
				<p class="news__subtitle">Будьте в курсі життя нашої школи</p>
			</div>
		</div>

		{#if loading}
			<div style="height: 480px; display: flex; align-items: center; justify-content: center;">
				<p>Завантаження новин...</p>
			</div>
		{:else if articles.length > 0 && carousel}
			<div class="focus-viewport" role="region" aria-label="Карусель новин" aria-roledescription="carousel">
				<div
					class="focus-track"
					style="
						transform: translateX(calc(50% - 300px - {carousel.currentIndex * 620}px));
						transition: {carousel.isTransitioning ? 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'};
					"
					aria-live="polite"
				>
					{#each infiniteNews as item, i}
						{@render NewsCard(item, i)}
					{/each}
				</div>

				<button class="nav-btn nav-btn--prev" onclick={carousel.prev} aria-label="Попередній слайд">←</button>
				<button class="nav-btn nav-btn--next" onclick={carousel.next} aria-label="Наступний слайд">→</button>
			</div>

			<div class="focus-dots" role="tablist" aria-label="Вибір новини">
				{#each articles as _, i}
					<button
						class="f-dot"
						role="tab"
						class:active={(carousel.currentIndex - 1 + articles.length) % articles.length === i}
						onclick={() => carousel?.goTo(i + 1)}
						aria-label="Перейти до новини {i + 1}"
						aria-selected={(carousel.currentIndex - 1 + articles.length) % articles.length === i}
					></button>
				{/each}
			</div>
		{:else}
			<div style="height: 480px; display: flex; align-items: center; justify-content: center; opacity: 0.5;">
				<p>Наразі новин немає.</p>
			</div>
		{/if}
	</div>
</section>

{#snippet NewsCard(item: Article, i: number)}
	<article
		class="focus-card"
		class:is-active={carousel?.currentIndex === i}
		role="group"
		aria-roledescription="slide"
	>
		<div class="focus-card__img-wrap" style="background: linear-gradient(45deg, #e0eafc, #cfdef3)">
			<PhotoIcon size={64} className="focus-card__placeholder" />
		</div>
		<div class="focus-card__content">
			<div class="focus-card__meta">
				<span class="tag">{item.category === 'news' ? 'Новина' : 'Оголошення'}</span>
				<time class="date">{formatDate(item.createdAt)}</time>
			</div>
			<h3 class="focus-card__title">{item.title}</h3>
			<div class="focus-card__excerpt">
				<p>{item.content.substring(0, 150)}...</p>
			</div>
			<a
				href={`${base}/news/${item.id}`}
				class="btn-more"
				tabindex={carousel?.currentIndex === i ? 0 : -1}
			>Читати далі →</a>
		</div>
	</article>
{/snippet}

	<style>
	/* Стилі залишаються без змін, як у оригінальному компоненті */
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
		background: white;
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
		color: #888;
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
		background: white;
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
		background: #cbd5e0;
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
