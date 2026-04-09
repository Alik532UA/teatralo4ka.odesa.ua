<script lang="ts">
	import { t } from "svelte-i18n";
	import { base } from "$app/paths";

	interface NewsItem {
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
		item: NewsItem;
		variant: 'carousel' | 'grid' | 'list';
		index: number;
		isActive?: boolean;
	}

	let { item, variant, index, isActive = false }: Props = $props();
</script>

{#if variant === 'carousel'}
	<article class="focus-card" class:is-active={isActive} data-testid="news-page-card-{index}">
		{#if item.coverUrl}
			<div class="focus-card__img-wrap" data-testid="news-page-card-img-wrap-{index}">
				<img src={item.coverUrl} alt={item.title} class="focus-card__img" data-testid="news-page-card-img-{index}" />
			</div>
		{/if}
		<div class="focus-card__content" data-testid="news-page-card-content-{index}">
			<div class="focus-card__meta" data-testid="news-page-card-meta-{index}">
				<span class="tag" data-testid="news-page-card-tag-{index}">{item.category}</span>
				<time class="date" data-testid="news-page-card-date-{index}">{item.date}</time>
			</div>
			<h3 class="focus-card__title" data-testid="news-page-card-title-{index}">{item.title}</h3>
			<p class="focus-card__excerpt" data-testid="news-page-card-excerpt-{index}">{item.excerpt}</p>
			<a href="{base}/news/{item.slug ?? item.id}" class="btn-more" data-testid="news-page-readmore-{index}">{$t('news.readMore')}</a>
		</div>
	</article>

{:else if variant === 'grid'}
	<article class="grid-card" data-testid="news-page-grid-card-{index}">
		{#if item.coverUrl}
			<div class="grid-card__img-wrap" data-testid="news-page-grid-img-{index}">
				<img src={item.coverUrl} alt={item.title} class="grid-card__img" />
			</div>
		{/if}
		<div class="focus-card__content" data-testid="news-page-grid-content-{index}">
			<div class="focus-card__meta">
				<span class="tag">{item.category}</span>
				<time class="date">{item.date}</time>
			</div>
			<h3 class="focus-card__title">{item.title}</h3>
			<p class="focus-card__excerpt">{item.excerpt}</p>
			<a href="{base}/news/{item.slug ?? item.id}" class="btn-more">{$t('news.readMore')}</a>
		</div>
	</article>

{:else}
	<article class="list-item" data-testid="news-page-list-item-{index}">
		{#if item.coverUrl}
			<div class="list-item__img-wrap" data-testid="news-page-list-img-{index}">
				<img src={item.coverUrl} alt={item.title} class="list-item__img" />
			</div>
		{/if}
		<div class="list-item__body" data-testid="news-page-list-body-{index}">
			<div class="focus-card__meta">
				<span class="tag">{item.category}</span>
				<time class="date">{item.date}</time>
			</div>
			<h3 class="list-item__title">{item.title}</h3>
			<p class="list-item__excerpt">{item.excerpt}</p>
		</div>
		<a href="{base}/news/{item.slug ?? item.id}" class="btn-more list-item__link" data-testid="news-page-list-link-{index}">{$t('news.readMore')}</a>
	</article>
{/if}

<style>
	/* ─── Carousel card ──────────────────────────────────── */
	.focus-card {
		flex: 0 0 600px;
		height: 400px;
		background: var(--color-surface);
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

	/* ─── Shared card content (carousel + grid) ─────────── */
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
		color: var(--color-white);
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
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
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
		color: var(--color-white);
		text-decoration: none;
		padding: 0.8rem 1.8rem;
		border-radius: 16px;
		font-weight: 700;
		width: fit-content;
		transition: all 0.3s ease;
	}

	.btn-more:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px color-mix(in srgb, var(--color-deep-ocean), transparent 80%);
	}

	/* ─── Grid card ──────────────────────────────────────── */
	.grid-card {
		background: var(--color-surface);
		border-radius: 32px;
		overflow: hidden;
		display: flex;
		flex-direction: row;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.03);
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
		height: 280px;
	}

	.grid-card:hover {
		transform: translateY(-8px);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
	}

	.grid-card__img-wrap {
		flex: 0 0 35%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.grid-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.grid-card .focus-card__content {
		padding: 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		flex: 1;
		min-width: 0;
	}

	.grid-card .focus-card__title {
		font-size: 1.05rem;
		line-height: 1.3;
		margin-bottom: 0.75rem;
	}

	.grid-card .focus-card__excerpt {
		font-size: 0.8rem;
		line-height: 1.5;
		margin-bottom: 1rem;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ─── List item ──────────────────────────────────────── */
	.list-item {
		display: flex;
		align-items: center;
		gap: 2rem;
		background: var(--color-surface);
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.03);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		padding-right: 2.5rem;
	}

	.list-item:hover {
		transform: translateX(6px);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
	}

	.list-item__img-wrap {
		width: 90px;
		aspect-ratio: 9 / 16;
		height: auto;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.list-item__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.list-item__body {
		flex: 1;
		min-width: 0;
		padding: 1.25rem 0;
	}

	.list-item__body .focus-card__meta {
		margin-bottom: 0.5rem;
	}

	.list-item__title {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
		line-height: 1.3;
		margin-bottom: 0.4rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.list-item__excerpt {
		color: var(--color-body-text);
		font-size: 0.9rem;
		line-height: 1.5;
		opacity: 0.75;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.list-item__link {
		flex-shrink: 0;
		white-space: nowrap;
	}

	/* ─── Responsive ─────────────────────────────────────── */
	@media (max-width: 1024px) {
		.focus-card {
			flex: 0 0 500px;
		}
	}

	@media (max-width: 768px) {
		.focus-card {
			flex: 0 0 90%;
			flex-direction: column;
			height: auto;
		}
		.focus-card__img-wrap {
			height: 200px;
		}
		.focus-card__content {
			padding: 2rem;
		}
		.focus-card__title {
			font-size: 1.5rem;
		}
		.list-item {
			flex-direction: column;
		}
		.list-item__img-wrap {
			width: 100%;
			height: 180px;
		}
		.list-item__link {
			align-self: flex-start;
		}
	}
</style>
