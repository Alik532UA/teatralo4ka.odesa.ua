<script lang="ts">
	import { page } from '$app/state';
	import { getPageBySlug, type Article } from '$lib/services/articles';
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
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
			article = await getPageBySlug(slug);
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
<section class="page-content container" style="padding: 160px 24px 6rem; min-height: 80vh;" data-testid="dynamic-page-section">
	{#if loading}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="dynamic-page-loading-container">
			<p data-testid="dynamic-page-loading-label">{$t('common.loading')}</p>
		</div>
	{:else if error}
		<div style="text-align: center; padding: 4rem;" data-testid="dynamic-page-error-container">
			<h1 style="color: var(--color-deep-ocean); margin-bottom: 2rem;" data-testid="dynamic-page-error-title">{error}</h1>
			<a href={`${base}/`} class="btn btn-primary" data-testid="dynamic-page-home-link">{$t('nav.home')}</a>
		</div>
	{:else if article && translation}
		<article class="prose" data-testid="dynamic-page-article">
			<h1 data-testid="dynamic-page-title">{translation.title}</h1>
			{@html DOMPurify.sanitize(marked.parse(translation.content || '') as string)}
		</article>
	{/if}
</section>
{/key}
