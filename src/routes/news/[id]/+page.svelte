<script lang="ts">
	import { page } from '$app/state';
	import { getArticleById, getDisplayDate, type Article } from '$lib/services/articles';
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { base } from '$app/paths';
	import { locale, t } from 'svelte-i18n';
	import { ARTICLE_CATEGORIES, type ArticleCategory } from '$lib/config/categories';

	let article = $state<Article | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadArticle() {
		const id = page.params.id;
		if (!id) return;
		
		try {
			article = await getArticleById(id);
			if (!article) {
				error = $t('news.notFound');
			}
		} catch (e) {
			console.error(e);
			error = $t('news.errorLoading');
		} finally {
			loading = false;
		}
	}

	onMount(loadArticle);

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

<svelte:head>
	{#if article}
		{@const translation = article.translations?.[$locale as 'uk' | 'en']}
		<title>{translation?.title || ''} | {$t('seo.brandTitle')}</title>
		<meta name="description" content={(translation?.content || '').substring(0, 160)} />
	{/if}
</svelte:head>

{#key page.params.id}
<section class="news-page container" style="padding: 160px 24px; min-height: 80vh;" data-testid="article-page-section">
	{#if loading}
		<div style="text-align: center; padding: 4rem;" data-testid="article-loading-container">
			<p data-testid="article-loading-label">{$t('news.loadingArticle')}</p>
		</div>
	{:else if error}
		<div style="text-align: center; padding: 4rem;" data-testid="article-error-container">
			<h1 style="color: var(--color-deep-ocean); margin-bottom: 2rem;" data-testid="article-error-title">{error}</h1>
			<a href={`${base}/`} class="btn btn-primary" data-testid="article-error-home-link">{$t('news.backToHome')}</a>
		</div>
	{:else if article}
		{@const translation = article.translations?.[$locale as 'uk' | 'en']}
		<article class="article-content" data-testid="article-content-container">
			<div class="article-header" style="margin-bottom: 3rem; text-align: center;" data-testid="article-header-group">
				<div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; align-items: center;" data-testid="article-meta-group">
					<span class="tag" style="background: var(--color-deep-ocean); color: var(--color-white); padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;" data-testid="article-category-tag">
						{ARTICLE_CATEGORIES[article.category as ArticleCategory]?.[$locale === 'en' ? 'en' : 'uk'] || article.category}
					</span>
					<time style="color: var(--color-muted-text); font-weight: 500;" data-testid="article-date-label">
						{formatDate(article)}
					</time>
				</div>
				<h1 style="font-family: var(--font-heading); font-size: 3.5rem; font-weight: 900; color: var(--color-deep-ocean); line-height: 1.1; margin-bottom: 2rem;" data-testid="article-title-label">
					{translation?.title || ''}
				</h1>
			</div>

			{#if translation?.coverUrl}
				<div class="article-cover" data-testid="article-cover-container">
					<img src={translation.coverUrl} alt={translation?.title || ''} class="article-cover__img" data-testid="article-cover-img" />
				</div>
			{/if}

			<div class="prose" style="max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 1.1rem; color: var(--color-body-text);" data-testid="article-prose-container">
				{@html DOMPurify.sanitize(marked.parse(translation?.content || '') as string)}
			</div>

			<div style="margin-top: 5rem; text-align: center; border-top: 1px solid var(--color-border); padding-top: 3rem;" data-testid="article-back-group">
				<a href={`${base}/news`} class="btn btn-outline" data-testid="article-back-link">{$t('news.backToNews')}</a>
			</div>
		</article>
	{/if}
</section>
{/key}

<style>
	.prose :global(h2) {
		font-family: var(--font-heading);
		color: var(--color-deep-ocean);
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
		.news-page {
			padding-top: 120px !important;
		}
		h1 {
			font-size: 2.5rem !important;
		}
	}

	.article-cover {
		max-width: 800px;
		margin: 0 auto 3rem;
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
	}

	.article-cover__img {
		width: 100%;
		height: auto;
		max-height: 480px;
		object-fit: cover;
		display: block;
	}
</style>

