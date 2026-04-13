<script lang="ts">
	import { getDisplayDate, type Article } from '$lib/services/articles';
	import { onMount } from 'svelte';
	import { renderContent, getContentExcerpt } from '$lib/utils/renderContent';
	import { base } from '$app/paths';
	import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { getCategoryLabel } from '$lib/config/categories';

	interface Props {
		/** The route parameter value (article ID or slug) */
		param: string | undefined;
		/** Function to fetch the article/page data */
		fetchFn: (param: string) => Promise<Article | null>;
		/** Back navigation link path (appended to base) */
		backHref: string;
		/** i18n key for back button text */
		backLabelKey: string;
		/** i18n key for loading state text */
		loadingKey: string;
		/** i18n key for "not found" error */
		notFoundKey: string;
		/** i18n key for generic error */
		errorKey: string;
		/** data-testid prefix */
		testIdPrefix: string;
	}

	const { param, fetchFn, backHref, backLabelKey, loadingKey, notFoundKey, errorKey, testIdPrefix }: Props = $props();

	let article = $state<Article | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		if (!param) return;

		loading = true;
		error = null;
		article = null;

		try {
			article = await fetchFn(param);
			if (!article) {
				error = $t(notFoundKey);
				return;
			}
			const lang = ($locale as 'uk' | 'en') || 'uk';
			const extUrl = (article.translations?.[lang]?.externalUrl || '').trim();
			if (extUrl) {
				window.location.href = extUrl;
				return;
			}
		} catch (e) {
			console.error(e);
			error = $t(errorKey);
		} finally {
			loading = false;
		}
	}

	onMount(loadData);

	let translation = $derived(
		article?.translations?.[$locale as 'uk' | 'en'] ?? null
	);

	$effect(() => {
		if (translation) {
			seo.update({
				title: `${translation.title} - ${$t('seo.brandTitle')}`,
				description: getContentExcerpt(translation.content || '', translation.contentFormat, 160)
			});
		}
	});

	function formatDate(article: Article) {
		const lang = ($locale as "uk" | "en") || "uk";
		const timestamp = getDisplayDate(article);
		if (!timestamp) return '';
		return timestamp.toDate().toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<section class="detail-page container" data-testid="{testIdPrefix}-section">
	<div class="back-nav" data-testid="{testIdPrefix}-back-group">
		<a href={`${base}${backHref}`} class="btn btn-outline" data-testid="{testIdPrefix}-back-link">{$t(backLabelKey)}</a>
	</div>

	{#if loading}
		<div class="detail-page__loading" data-testid="{testIdPrefix}-loading-container">
			<p data-testid="{testIdPrefix}-loading-label">{$t(loadingKey)}</p>
		</div>
	{:else if error}
		<div class="detail-page__error" data-testid="{testIdPrefix}-error-container">
			<h1 class="detail-page__error-title" data-testid="{testIdPrefix}-error-title">{error}</h1>
		</div>
	{:else if article && translation}
		<article data-testid="{testIdPrefix}-content-container">
			<div class="article-body" class:has-cover={!!translation.coverUrl}>
				{#if translation.coverUrl}
					<aside class="article-cover" data-testid="{testIdPrefix}-cover-container">
						<img src={translation.coverUrl} alt={translation.title || ''} class="article-cover__img" data-testid="{testIdPrefix}-cover-img" />
					</aside>
				{/if}

				<div class="article-main">
					<div class="article-header" data-testid="{testIdPrefix}-header-group">
						{#if formatDate(article) || getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
							<div class="article-meta" data-testid="{testIdPrefix}-meta-group">
								{#if getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
									<span class="tag" data-testid="{testIdPrefix}-category-tag">
										{getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
									</span>
								{/if}
								{#if formatDate(article)}
									<time data-testid="{testIdPrefix}-date-label">
										{formatDate(article)}
									</time>
								{/if}
							</div>
						{/if}
						<h1 data-testid="{testIdPrefix}-title-label">
							{translation.title || ''}
						</h1>
					</div>

					<div class="prose" data-testid="{testIdPrefix}-prose-container">
						{@html renderContent(translation.content || '', translation.contentFormat)}
					</div>
				</div>
			</div>
		</article>
	{/if}
</section>

<style>
	.detail-page {
		padding: 160px 24px 6rem;
		min-height: 80vh;
	}

	.detail-page__loading {
		display: flex;
		justify-content: center;
		padding: 4rem;
	}

	.detail-page__error {
		text-align: center;
		padding: 4rem;
	}

	.detail-page__error-title {
		color: var(--text-title);
		margin-bottom: 2rem;
	}

	.back-nav {
		max-width: 1000px;
		margin: 0 auto 2rem;
	}

	.article-header {
		margin-bottom: 2.5rem;
	}

	.article-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.tag {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		padding: 0.4rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	time {
		color: var(--color-muted-text);
		font-weight: 500;
	}

	h1 {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--text-title);
		line-height: 1.1;
		margin: 0;
	}

	.article-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.article-body {
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.8;
		font-size: 1.1rem;
		color: var(--color-body-text);
	}

	.article-body.has-cover {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2.5rem;
		max-width: 1000px;
		align-items: start;
	}

	.article-cover {
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		aspect-ratio: 9 / 16;
		position: sticky;
		top: 120px;
	}

	.article-cover__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.prose :global(h2) {
		font-family: var(--font-heading);
		color: var(--text-title);
		margin-top: 3rem;
		margin-bottom: 1.5rem;
		font-size: 2rem;
	}

	.prose :global(p) {
		margin-bottom: 1.5rem;
	}

	.prose :global(img) {
		max-width: 100%;
		border-radius: 20px;
		margin: 2rem 0;
	}

	.prose :global(ul), .prose :global(ol) {
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}

	.prose :global(li) {
		margin-bottom: 0.5rem;
	}

	@media (max-width: 768px) {
		.detail-page {
			padding-top: 120px !important;
		}

		h1 {
			font-size: 2.2rem;
		}

		.back-nav {
			text-align: center;
		}

		.article-body.has-cover {
			grid-template-columns: 1fr;
		}

		.article-cover {
			max-width: 240px;
			margin: 0 auto;
			position: static;
		}
	}
</style>
