<script lang="ts">
	import { base } from "$app/paths";

	export interface ContentCardItem {
		id: string;
		slug?: string;
		title: string;
		date: string;
		category: string;
		excerpt: string;
		color: string;
		coverUrl: string;
		/** For static pages that have a full path already */
		href?: string;
		/** Whether the link points to an external site */
		isExternal?: boolean;
	}

	interface Props {
		item: ContentCardItem;
		variant: 'carousel' | 'grid' | 'list';
		index: number;
		isActive?: boolean;
		/** URL segment for card links, e.g. 'news' → /news/{slug} */
		linkPrefix?: string;
		/** "Read more" button text */
		readMoreLabel?: string;
		/** data-testid prefix for all card elements */
		testIdPrefix?: string;
	}

	let {
		item, variant, index, isActive = false,
		linkPrefix = 'news',
		readMoreLabel = 'Read more',
		testIdPrefix = 'content',
	}: Props = $props();

	const link = $derived(item.href ?? `${base}/${linkPrefix}/${item.slug ?? item.id}`);
	const linkTarget = $derived(item.isExternal ? '_blank' : undefined);
	const linkRel = $derived(item.isExternal ? 'noopener noreferrer' : undefined);
</script>

{#if variant === 'carousel'}
	<article class="focus-card" class:is-active={isActive} data-testid="{testIdPrefix}-card-{index}">
		{#if item.coverUrl}
			<div class="focus-card__img-wrap" data-testid="{testIdPrefix}-card-img-wrap-{index}">
				<img src={item.coverUrl} alt={item.title} class="focus-card__img" draggable="false" data-testid="{testIdPrefix}-card-img-{index}" />
			</div>
		{/if}
		<div class="focus-card__content" data-testid="{testIdPrefix}-card-content-{index}">
			<div class="focus-card__meta" data-testid="{testIdPrefix}-card-meta-{index}">
				{#if item.category}
					<span class="tag" data-testid="{testIdPrefix}-card-tag-{index}">{item.category}</span>
				{/if}
				{#if item.date}
					<time class="date" data-testid="{testIdPrefix}-card-date-{index}">{item.date}</time>
				{/if}
			</div>
			<h3 class="focus-card__title" data-testid="{testIdPrefix}-card-title-{index}">{item.title}</h3>
			<p class="focus-card__excerpt" data-testid="{testIdPrefix}-card-excerpt-{index}">{item.excerpt}</p>
			<a href={link} target={linkTarget} rel={linkRel} class="btn-more" data-testid="{testIdPrefix}-readmore-{index}">{readMoreLabel}{#if item.isExternal}&nbsp;↗{/if}</a>
		</div>
	</article>

{:else if variant === 'grid'}
	<article class="grid-card" data-testid="{testIdPrefix}-grid-card-{index}">
		{#if item.coverUrl}
			<div class="grid-card__img-wrap" data-testid="{testIdPrefix}-grid-img-{index}">
				<img src={item.coverUrl} alt={item.title} class="grid-card__img" />
			</div>
		{/if}
		<div class="focus-card__content" data-testid="{testIdPrefix}-grid-content-{index}">
			<div class="focus-card__meta">
				{#if item.category}
					<span class="tag">{item.category}</span>
				{/if}
				{#if item.date}
					<time class="date">{item.date}</time>
				{/if}
			</div>
			<h3 class="focus-card__title">{item.title}</h3>
			<p class="focus-card__excerpt">{item.excerpt}</p>
			<a href={link} target={linkTarget} rel={linkRel} class="btn-more">{readMoreLabel}{#if item.isExternal}&nbsp;↗{/if}</a>
		</div>
	</article>

{:else}
	<article class="list-item desktop-list" data-testid="{testIdPrefix}-list-item-{index}">
		{#if item.coverUrl}
			<div class="list-item__img-wrap" data-testid="{testIdPrefix}-list-img-{index}">
				<img src={item.coverUrl} alt={item.title} class="list-item__img" />
			</div>
		{/if}
		<div class="list-item__body" data-testid="{testIdPrefix}-list-body-{index}">
			<div class="focus-card__meta">
				{#if item.category}
					<span class="tag">{item.category}</span>
				{/if}
				{#if item.date}
					<time class="date">{item.date}</time>
				{/if}
			</div>
			<h3 class="list-item__title">{item.title}</h3>
			<p class="list-item__excerpt">{item.excerpt}</p>
		</div>
		<a href={link} target={linkTarget} rel={linkRel} class="btn-more list-item__link" data-testid="{testIdPrefix}-list-link-{index}">{readMoreLabel}{#if item.isExternal}&nbsp;↗{/if}</a>
	</article>

	<!-- Mobile version of list that uses grid styles -->
	<article class="grid-card mobile-list-as-grid" data-testid="{testIdPrefix}-mobile-list-item-{index}">
		{#if item.coverUrl}
			<div class="grid-card__img-wrap" data-testid="{testIdPrefix}-mobile-list-img-{index}">
				<img src={item.coverUrl} alt={item.title} class="grid-card__img" />
			</div>
		{/if}
		<div class="focus-card__content" data-testid="{testIdPrefix}-mobile-list-content-{index}">
			<div class="focus-card__meta">
				{#if item.category}
					<span class="tag">{item.category}</span>
				{/if}
				{#if item.date}
					<time class="date">{item.date}</time>
				{/if}
			</div>
			<h3 class="focus-card__title">{item.title}</h3>
			<p class="focus-card__excerpt">{item.excerpt}</p>
			<a href={link} target={linkTarget} rel={linkRel} class="btn-more">{readMoreLabel}{#if item.isExternal}&nbsp;↗{/if}</a>
		</div>
	</article>
{/if}

<style>
	/* ─── Carousel card ──────────────────────────────────── */
	.focus-card {
		flex: 0 0 var(--focus-card-width, 600px);
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
		background: var(--accent-primary);
		color: var(--text-on-accent);
		padding: 0.4rem 1rem;
		border-radius: var(--radius-full);
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
		color: var(--text-title);
		line-height: 1.5;
		margin-bottom: 1rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		padding-bottom: 0.1em;
	}

	.focus-card__excerpt {
		color: var(--color-body-text);
		line-height: 1.6;
		margin-bottom: 2rem;
		opacity: 0.8;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.btn-more {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		text-decoration: none;
		padding: 0.8rem 1.8rem;
		border-radius: var(--radius-full);
		font-weight: 700;
		width: fit-content;
		transition: all 0.3s ease;
	}

	.btn-more:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px color-mix(in srgb, var(--accent-primary), transparent 80%);
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
		min-height: 280px;
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
		line-height: 1.5;
		margin-bottom: 0.75rem;
		-webkit-line-clamp: 3;
		line-clamp: 3;
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

	.mobile-list-as-grid {
		display: none;
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
		color: var(--text-title);
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
		.focus-card__content {
			padding: 2rem;
		}
	}

	@media (max-width: 1024px) {
		.focus-card {
			flex-direction: row;
			height: auto;
			min-height: 280px;
			flex: 0 0 var(--focus-card-width, 85vw);
			border-radius: 24px;
		}
		.focus-card__img-wrap {
			flex: 0 0 35%;
			width: auto;
		}
		.focus-card__content {
			padding: 1.25rem 1.5rem;
			justify-content: center;
		}
		.focus-card__title {
			font-size: 1.15rem;
			line-height: 1.5;
			margin-bottom: 0.5rem;
			-webkit-line-clamp: 3;
			line-clamp: 3;
		}
		.focus-card__excerpt {
			display: none;
		}
		.focus-card__meta {
			margin-bottom: 0.75rem;
			gap: 0.5rem;
			flex-wrap: wrap;
		}

		.grid-card {
			flex-direction: row;
			height: auto;
			min-height: 200px;
			border-radius: 20px;
		}
		.grid-card__img-wrap {
			flex: 0 0 30%;
			width: auto;
		}
		.grid-card .focus-card__content {
			padding: 1rem 1.25rem;
			justify-content: center;
		}
		.grid-card .focus-card__title {
			font-size: 1rem;
			line-height: 1.5;
			margin-bottom: 0.4rem;
			-webkit-line-clamp: 3;
			line-clamp: 3;
		}
		.grid-card .focus-card__excerpt {
			display: none;
		}

		.desktop-list {
			display: none !important;
		}
		.mobile-list-as-grid {
			display: flex !important;
		}

		.list-item {
			padding-right: 1rem;
			gap: 1rem;
			border-radius: 16px;
		}
		.list-item__img-wrap {
			width: 70px;
		}
		.list-item__body {
			padding: 1rem 0;
		}
		.list-item__title {
			font-size: 0.95rem;
			white-space: normal;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
		}
		.list-item__excerpt {
			font-size: 0.8rem;
		}

		.tag {
			padding: 0.25rem 0.6rem;
			font-size: 0.6rem;
		}
		.date {
			font-size: 0.75rem;
		}
		.btn-more {
			padding: 0.5rem 1rem;
			font-size: 0.8rem;
			border-radius: var(--radius-full);
			margin-top: 0.5rem;
		}
	}
</style>
