<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { codeNewsCards } from '$lib/config/codeNews';
	import { galleryGestures } from '$lib/utils/galleryGestures';
	import type { FestivalNewsItem } from '$lib/data/newsBacklinks';

	interface Props {
		news: FestivalNewsItem[];
		lang: 'uk' | 'en';
	}

	let { news, lang }: Props = $props();

	const ROTATE_MS = 6000;

	let index = $state(0);
	let manualCount = $state(0);
	let isHovered = $state(false);

	interface NewsCardData {
		id: string;
		title: string;
		date: string;
		category: string;
		excerpt: string;
		coverUrl: string;
		coverPosition?: string;
	}

	const cards = $derived.by<NewsCardData[]>(() => {
		const allCodeCards = codeNewsCards(lang);
		const cardMap = new Map(allCodeCards.map((c) => [c.id, c]));
		return news.map((item) => {
			const found = cardMap.get(item.id);
			if (found) {
				return {
					id: found.id,
					title: found.title,
					date: found.date,
					category: found.category,
					excerpt: found.excerpt,
					coverUrl: found.coverUrl,
					coverPosition: found.coverPosition
				};
			}
			return {
				id: item.id,
				title: item.title[lang] ?? item.title.uk,
				date: item.date,
				category: $t('nav.news', { default: 'Новина' }),
				excerpt: '',
				coverUrl: ''
			};
		});
	});

	const activeIndex = $derived(cards.length === 0 ? 0 : Math.min(index, cards.length - 1));

	$effect(() => {
		const total = cards.length;
		if (total < 2) {
			index = 0;
			return;
		}
	});

	$effect(() => {
		const _ = manualCount;
		const total = cards.length;
		if (total < 2) return;

		const intervalId = setInterval(() => {
			if (!isHovered) {
				index = (index + 1) % total;
			}
		}, ROTATE_MS);

		return () => clearInterval(intervalId);
	});

	function step(direction: number, e?: MouseEvent) {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		const total = cards.length;
		if (total < 2) return;
		manualCount++;
		index = (index + direction + total) % total;
	}

	function select(i: number, e?: MouseEvent) {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		manualCount++;
		index = i;
	}
</script>

{#if cards.length > 0}
	<div
		class="news-banner"
		role="region"
		aria-label={$t('nav.news', { default: 'Новини' })}
		onmouseenter={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
		data-testid="galaxy-card-news-banner"
		{@attach galleryGestures({
			count: () => cards.length,
			next: () => step(1),
			prev: () => step(-1)
		})}
	>
		<div class="news-banner__viewport">
			<div
				class="news-banner__track"
				style="transform: translateX(-{activeIndex * 100}%);"
			>
				{#each cards as card, i (card.id)}
					<div
						class="news-banner__slide"
						class:is-active={activeIndex === i}
						aria-hidden={activeIndex !== i}
					>
						<a
							class="news-card"
							href={localizedPath(`/news/${card.id}`, lang)}
							data-testid="galaxy-card-news-link-{card.id}"
						>
							{#if card.coverUrl}
								<div class="news-card__media">
									<img
										src={card.coverUrl}
										alt={card.title}
										class="news-card__img"
										draggable="false"
										width="140"
										height="249"
										style={card.coverPosition ? `object-position: ${card.coverPosition}` : ''}
									/>
								</div>
							{:else}
								<div class="news-card__media news-card__media--fallback">
									<Newspaper size={28} aria-hidden="true" />
								</div>
							{/if}

							<div class="news-card__content">
								<div class="news-card__meta">
									<span class="news-card__tag">{card.category || $t('nav.news', { default: 'Новина' })}</span>
									{#if card.date}
										<time class="news-card__date">{card.date}</time>
									{/if}
								</div>

								<h4 class="news-card__title" data-testid="galaxy-card-news-title-{i}">
									{card.title}
								</h4>

								{#if card.excerpt}
									<p class="news-card__excerpt">
										{card.excerpt}
									</p>
								{/if}

								<span class="news-card__btn">
									{$t('news.readMore', { default: 'Читати далі' })}
								</span>
							</div>
						</a>
					</div>
				{/each}
			</div>
		</div>

		{#if cards.length > 1}
			<button
				type="button"
				class="news-banner__nav news-banner__nav--prev"
				onclick={(e) => step(-1, e)}
				aria-label={$t('common.previous', { default: 'Попередня новина' })}
				data-testid="galaxy-card-news-prev-btn"
			>
				<ChevronLeft size={18} aria-hidden="true" />
			</button>
			<button
				type="button"
				class="news-banner__nav news-banner__nav--next"
				onclick={(e) => step(1, e)}
				aria-label={$t('common.next', { default: 'Наступна новина' })}
				data-testid="galaxy-card-news-next-btn"
			>
				<ChevronRight size={18} aria-hidden="true" />
			</button>

			<div
				class="news-banner__dots"
				role="tablist"
				aria-label={$t('nav.news', { default: 'Новини' })}
			>
				{#each cards as card, i (card.id)}
					<button
						type="button"
						role="tab"
						class="news-banner__dot"
						class:is-active={activeIndex === i}
						aria-selected={activeIndex === i}
						aria-label={card.title}
						onclick={(e) => select(i, e)}
						data-testid="galaxy-card-news-item-{i}"
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.news-banner {
		position: relative;
		width: 100%;
		box-sizing: border-box;
	}

	.news-banner__viewport {
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: 18px;
	}

	.news-banner__track {
		display: flex;
		width: 100%;
		transition: transform 1.4s cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform;
	}

	.news-banner__slide {
		flex: 0 0 100%;
		width: 100%;
		min-width: 100%;
		box-sizing: border-box;
		transition:
			opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1),
			transform 1.4s cubic-bezier(0.22, 1, 0.36, 1);
		opacity: 0.35;
		transform: scale(0.97);
	}

	.news-banner__slide.is-active {
		opacity: 1;
		transform: scale(1);
	}

	/* ─── Compact Galaxy Card ─────────────────────────── */
	.news-card {
		display: flex;
		align-items: stretch;
		border-radius: 18px;
		background: rgb(255 255 255 / 0.05);
		border: var(--hairline-width) solid rgb(140 190 255 / 0.22);
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		min-height: 190px;
		backdrop-filter: blur(12px);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
		transition:
			background 0.25s ease,
			border-color 0.25s ease,
			box-shadow 0.25s ease,
			transform 0.25s ease;
	}

	.news-card:hover {
		background: rgb(255 255 255 / 0.08);
		border-color: rgb(140 190 255 / 0.5);
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.35);
		transform: translateY(-1px);
	}

	/* ─── 9:16 Vertical Cover Image ──────────────────── */
	.news-card__media {
		flex: 0 0 auto;
		width: clamp(105px, 30%, 140px);
		aspect-ratio: 9 / 16;
		position: relative;
		overflow: hidden;
		background: rgb(3 6 20 / 0.6);
	}

	.news-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.news-card__media--fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--galaxy-muted, #a8bfe0);
	}

	/* ─── Card Content ───────────────────────────────── */
	.news-card__content {
		flex: 1 1 auto;
		min-width: 0;
		padding: 0.9rem 1.05rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.45rem;
		text-align: left;
	}

	.news-card__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem 0.65rem;
	}

	.news-card__tag {
		display: inline-flex;
		align-items: center;
		padding: 0.18rem 0.55rem;
		border-radius: 999px;
		background: #00b4d8;
		color: #030614;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		line-height: 1.2;
	}

	.news-card__date {
		font-size: 0.78rem;
		color: var(--galaxy-muted, #a8bfe0);
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.news-card__title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 700;
		line-height: 1.35;
		color: #ffffff;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		transition: color 0.2s ease;
	}

	.news-card:hover .news-card__title {
		color: var(--galaxy-accent, #8cc4ff);
	}

	.news-card__excerpt {
		margin: 0;
		font-size: 0.77rem;
		line-height: 1.42;
		color: color-mix(in srgb, var(--galaxy-text, #ffffff), transparent 30%);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.news-card__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 1.05rem;
		border-radius: 999px;
		background: var(--galaxy-accent, #8cc4ff);
		color: #030614;
		font-size: 0.82rem;
		font-weight: 700;
		border: none;
		margin-top: 0.2rem;
		width: fit-content;
		box-shadow: 0 4px 14px color-mix(in srgb, var(--galaxy-accent, #8cc4ff), transparent 60%);
		transition:
			transform 0.2s ease,
			filter 0.2s ease,
			box-shadow 0.2s ease;
	}

	.news-card:hover .news-card__btn {
		filter: brightness(1.1);
		transform: translateY(-1px);
		box-shadow: 0 6px 18px color-mix(in srgb, var(--galaxy-accent, #8cc4ff), transparent 45%);
	}

	/* ─── Navigation Arrows ──────────────────────────── */
	.news-banner__nav {
		position: absolute;
		z-index: 5;
		top: 50%;
		transform: translateY(-50%);
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: var(--hairline-width) solid rgba(255, 255, 255, 0.22);
		border-radius: 50%;
		background: rgba(3, 6, 20, 0.65);
		backdrop-filter: blur(8px);
		color: #ffffff;
		cursor: pointer;
		transition:
			background 0.2s ease,
			transform 0.2s ease;
	}

	.news-banner__nav--prev {
		left: 6px;
	}

	.news-banner__nav--next {
		right: 6px;
	}

	.news-banner__nav:hover {
		background: rgba(3, 6, 20, 0.9);
		transform: translateY(-50%) scale(1.12);
	}

	.news-banner__nav:focus-visible {
		outline: 2px solid var(--galaxy-accent, #8cc4ff);
		outline-offset: 2px;
	}

	/* ─── Dots ───────────────────────────────────────── */
	.news-banner__dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.45rem;
		margin-top: 0.65rem;
	}

	.news-banner__dot {
		flex: none;
		width: 7px;
		height: 7px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, var(--galaxy-muted, #a8bfe0), transparent 60%);
		cursor: pointer;
		transition:
			background 0.3s ease,
			transform 0.3s ease;
	}

	.news-banner__dot:hover {
		background: color-mix(in srgb, var(--galaxy-muted, #a8bfe0), transparent 25%);
	}

	.news-banner__dot.is-active {
		background: var(--galaxy-accent, #8cc4ff);
		transform: scale(1.35);
	}

	.news-banner__dot:focus-visible {
		outline: 2px solid var(--galaxy-accent, #8cc4ff);
		outline-offset: 2px;
	}
</style>
