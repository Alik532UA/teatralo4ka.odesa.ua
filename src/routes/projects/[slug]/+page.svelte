<script lang="ts">
	import { page } from '$app/state';
	import { getProjectPageBySlug, type Article } from '$lib/services/articles';
	import { onMount } from 'svelte';
	import { renderContent } from '$lib/utils/renderContent';
	import { base } from '$app/paths';
	import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';

	let article = $state<Article | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadPage() {
		const slug = page.params.slug;
		if (!slug) return;

		try {
			article = await getProjectPageBySlug(slug);
			if (!article) {
				error = $t('pages.notFound');
			}
		} catch (e) {
			console.error(e);
			error = $t('pages.errorLoading');
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
				description: (translation.content || '').replace(/<[^>]*>/g, '').substring(0, 160)
			});
		}
	});
</script>

{#key slug}
<section class="page-content container" style="padding: 160px 24px 6rem; min-height: 80vh;" data-testid="project-page-section">
	{#if loading}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="project-page-loading-container">
			<p data-testid="project-page-loading-label">{$t('common.loading')}</p>
		</div>
	{:else if error}
		<div style="text-align: center; padding: 4rem;" data-testid="project-page-error-container">
			<h1 style="color: var(--color-deep-ocean); margin-bottom: 2rem;" data-testid="project-page-error-title">{error}</h1>
			<a href={`${base}/projects`} class="btn btn-primary" data-testid="project-page-back-link">{$t('nav.projects')}</a>
		</div>
	{:else if article && translation}
		<article data-testid="project-page-article">
			<div class="page-body" class:has-cover={!!translation.coverUrl}>
				{#if translation.coverUrl}
					<aside class="page-cover" data-testid="project-page-cover">
						<img src={translation.coverUrl} alt={translation.title} class="page-cover__img" />
					</aside>
				{/if}
				<div class="page-main">
					<h1 class="page-title" data-testid="project-page-title">{translation.title}</h1>
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
	.page-title {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-deep-ocean);
		line-height: 1.1;
		margin: 0 0 2rem;
	}
	.page-main {
		display: flex;
		flex-direction: column;
	}
	.page-body {
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.8;
		font-size: 1.1rem;
		color: var(--color-body-text);
	}
	.page-body.has-cover {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2.5rem;
		max-width: 1000px;
		align-items: start;
	}
	.page-cover {
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		aspect-ratio: 9 / 16;
		position: sticky;
		top: 120px;
	}
	.page-cover__img {
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
	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}
		.page-body.has-cover {
			grid-template-columns: 1fr;
		}
		.page-cover {
			max-width: 240px;
			position: static;
		}
	}
</style>
