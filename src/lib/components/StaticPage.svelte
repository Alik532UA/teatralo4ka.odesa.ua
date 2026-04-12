<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import type { PageContent } from '$lib/i18n/types';

	interface Props {
		data: { uk: PageContent | null; en: PageContent | null };
		testPrefix?: string;
		/** Optional back navigation link (e.g. `${base}/projects`) */
		backHref?: string;
		/** Optional back navigation label (e.g. "Всі проєкти") */
		backLabel?: string;
	}

	let { data, testPrefix = 'static', backHref, backLabel }: Props = $props();

	let content = $derived($locale === 'en' ? data.en : data.uk);
	let coverUrl = $derived.by(() => {
		const raw = content?.metadata?.coverUrl;
		if (!raw) return '';
		return raw.startsWith(base) ? raw : `${base}${raw}`;
	});

	$effect(() => {
		if (content?.metadata?.seo) {
			seo.update({
				title: content.metadata.seo.title,
				description: content.metadata.seo.description,
				ogImage: content.metadata.seo.ogImage
			});
		}
	});
</script>

<section class="page-content container" style="padding: 160px 24px 6rem;" data-testid="{testPrefix}-page-section">
	{#if backHref && backLabel}
		<div class="back-nav" data-testid="{testPrefix}-back-group">
			<a href={backHref} class="btn btn-outline" data-testid="{testPrefix}-back-link">{backLabel}</a>
		</div>
	{/if}
	{#if content}
		<article data-testid="{testPrefix}-page-article">
			<div class="page-body" class:has-cover={!!coverUrl}>
				{#if coverUrl}
					<aside class="page-cover" data-testid="{testPrefix}-page-cover">
						<img src={coverUrl} alt={content.metadata.title} class="page-cover__img" />
					</aside>
				{/if}
				<div class="page-main">
					<div class="prose">
						{@html DOMPurify.sanitize(content.html)}
					</div>
				</div>
			</div>
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="{testPrefix}-page-loading-container">
			<p data-testid="{testPrefix}-page-loading-label">{$t('common.loading')}</p>
		</div>
	{/if}
</section>

<style>
	.back-nav {
		max-width: 1000px;
		margin: 0 auto 2rem;
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
		.page-content {
			padding-top: 120px !important;
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
