<script lang="ts">
	import { page } from '$app/state';
	import { getProjectPageBySlug, getDisplayDate, type Article } from '$lib/services/articles';
	import { onMount } from 'svelte';
	import { renderContent, getContentExcerpt } from '$lib/utils/renderContent';
	import { base } from '$app/paths';
	import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { getCategoryLabel } from '$lib/config/categories';

	let article = $state<Article | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadPage() {
		const slug = page.params.slug;
		if (!slug) return;

		try {
			article = await getProjectPageBySlug(slug);
			if (!article) {
				error = $t('projects.notFound');
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
			error = $t('projects.errorLoading');
		} finally {
			loading = false;
		}
	}

	onMount(loadPage);

	const slug = $derived(page.params.slug);

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

{#key slug}
<section class="detail-page container" style="padding: 160px 24px 6rem; min-height: 80vh;" data-testid="project-page-section">
	<div class="back-nav" data-testid="project-back-group">
		<a href={`${base}/projects`} class="btn btn-outline" data-testid="project-back-link">{$t('projects.backToProjects')}</a>
	</div>

	{#if loading}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="project-page-loading-container">
			<p data-testid="project-page-loading-label">{$t('projects.loadingProject')}</p>
		</div>
	{:else if error}
		<div style="text-align: center; padding: 4rem;" data-testid="project-page-error-container">
			<h1 style="color: var(--color-deep-ocean); margin-bottom: 2rem;" data-testid="project-page-error-title">{error}</h1>
		</div>
	{:else if article && translation}
		<article data-testid="project-page-article">

			<div class="article-body" class:has-cover={!!translation.coverUrl}>
				{#if translation.coverUrl}
					<aside class="article-cover" data-testid="project-page-cover">
						<img src={translation.coverUrl} alt={translation.title} class="article-cover__img" />
					</aside>
				{/if}
				<div class="article-main">
					<div class="article-header">
						{#if formatDate(article) || getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
							<div class="article-meta">
								{#if getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
									<span class="tag">{getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}</span>
								{/if}
								{#if formatDate(article)}
									<time>{formatDate(article)}</time>
								{/if}
							</div>
						{/if}
						<h1>{translation.title}</h1>
					</div>

					<div class="prose" data-testid="project-page-prose">
						{@html renderContent(translation.content || '', translation.contentFormat)}
					</div>
				</div>
			</div>
		</article>
	{/if}
</section>
{/key}

<style>
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
		background: var(--color-deep-ocean);
		color: var(--color-white);
		padding: 0.4rem 1rem;
		border-radius: 100px;
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
		color: var(--color-deep-ocean);
		line-height: 1.1;
		margin: 0;
	}

	.article-main {
		display: flex;
		flex-direction: column;
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
		.detail-page {
			padding-top: 120px !important;
		}
		h1 {
			font-size: 2.2rem;
		}
		.article-body.has-cover {
			grid-template-columns: 1fr;
		}
		.article-cover {
			max-width: 240px;
			position: static;
		}
	}
</style>
