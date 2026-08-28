<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { asset, resolve } from '$app/paths';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { DOMPURIFY_HTML_CONFIG } from '$lib/utils/markedConfig';
	import { ArrowLeft, Download, ExternalLink, ShieldCheck } from 'lucide-svelte';

	let { data } = $props();

	let content = $derived($locale === 'en' ? data.en : data.uk);

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

<section class="page-content container" style="padding: var(--page-pad-top) 24px var(--page-pad-bottom);" data-testid="statute-page-section">
	<div class="back-nav" data-testid="statute-back-nav">
		<a href={resolve('/documents')} class="back-link" data-testid="statute-back-to-documents-link">
			<ArrowLeft size={18} />
			<span>{$t('documents.title')}</span>
		</a>
	</div>

	<!-- Sticky / Top Notification Banner -->
	<div class="statute-notice-banner" data-testid="statute-notice-banner">
		<div class="statute-notice__main">
			<div class="statute-notice__icon-wrap">
				<ShieldCheck size={26} />
			</div>
			<div class="statute-notice__text">
				<div class="statute-notice__badge-row">
					<span class="statute-badge statute-badge--edition">{$t('documents.statuteEdition')}</span>
					<span class="statute-badge statute-badge--size">{$t('documents.fileSize')}</span>
				</div>
				<p class="statute-notice__desc">{$t('documents.statuteDigitalNotice')}</p>
			</div>
		</div>

		<div class="statute-notice__actions" data-testid="statute-notice-actions-toolbar">
			<a
				href={asset('/documents/statut-2025.pdf')}
				target="_blank"
				rel="noopener noreferrer"
				class="btn btn-outline statute-btn"
				data-testid="statute-notice-view-pdf-btn"
			>
				<ExternalLink size={16} />
				<span>{$t('documents.viewOriginalPdf')}</span>
			</a>

			<a
				href={asset('/documents/statut-2025.pdf')}
				download="Statut-Odeska-Teatralna-Shkola-2025.pdf"
				class="btn btn-primary statute-btn"
				data-testid="statute-notice-download-pdf-btn"
			>
				<Download size={16} />
				<span>{$t('documents.download')}</span>
			</a>
		</div>
	</div>

	{#if content}
		<article class="statute-article" data-testid="statute-article-section">
			<div class="prose statute-prose" data-testid="statute-prose-container">
				<!-- Виняток за SECURITY-v8 § 5.3: markdown зі сторінок репозиторію,
				     пропущений через DOMPurify безпосередньо перед вставкою. -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html DOMPurify.sanitize(content.html, DOMPURIFY_HTML_CONFIG)}
			</div>
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="statute-loading-container">
			<p data-testid="statute-loading-status">{$t('common.loading')}</p>
		</div>
	{/if}
</section>

<style>
	.back-nav {
		max-width: 860px;
		margin: 0 auto 1.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--accent-primary);
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: none;
		transition: transform 0.2s ease, color 0.2s ease;
	}

	.back-link:hover {
		transform: translateX(-4px);
		color: var(--palette-orange, var(--accent-primary));
	}

	/* Notice banner */
	.statute-notice-banner {
		max-width: 860px;
		margin: 0 auto 2.5rem;
		padding: 1.25rem 1.75rem;
		background: linear-gradient(
			135deg,
			var(--bg-surface, #ffffff) 0%,
			color-mix(in srgb, var(--accent-primary) 8%, var(--bg-surface, #ffffff)) 100%
		);
		border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border-main, rgba(255, 255, 255, 0.15)));
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
	}

	.statute-notice__main {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex: 1;
	}

	.statute-notice__icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		min-width: 48px;
		border-radius: 14px;
		background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
		color: var(--accent-primary);
	}

	.statute-notice__text {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.statute-notice__badge-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.statute-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 600;
		font-family: var(--font-heading);
	}

	.statute-badge--edition {
		background: color-mix(in srgb, var(--accent-primary) 20%, transparent);
		color: var(--accent-primary);
	}

	.statute-badge--size {
		background: color-mix(in srgb, var(--text-muted) 18%, transparent);
		color: var(--text-title);
	}

	.statute-notice__desc {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	.statute-notice__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		flex-shrink: 0;
	}

	.statute-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 1.15rem;
		font-size: 0.88rem;
		font-weight: 600;
		border-radius: 9999px;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.statute-btn:hover {
		transform: translateY(-1px);
	}

	.statute-article {
		max-width: 860px;
		margin: 0 auto;
	}

	/* Prose typography enhancements for statute */
	:global(.statute-prose h1) {
		font-size: 2.2rem;
		text-align: center;
		margin-bottom: 0.25rem;
	}

	:global(.statute-prose h2) {
		margin-top: 2rem;
		border-bottom: 1px solid var(--border-main, rgba(255, 255, 255, 0.1));
		padding-bottom: 0.5rem;
	}

	:global(.statute-prose h3) {
		text-align: center;
		font-size: 1.1rem;
		opacity: 0.85;
		margin-top: 0;
	}

	:global(.statute-prose blockquote) {
		background: color-mix(in srgb, var(--accent-primary) 6%, transparent);
		border-left: 4px solid var(--accent-primary);
		padding: 1rem 1.25rem;
		border-radius: 0 12px 12px 0;
		margin: 1.5rem 0;
	}

	:global(.statute-prose p) {
		line-height: 1.7;
	}

	@media (max-width: 768px) {
		.statute-notice-banner {
			flex-direction: column;
			align-items: stretch;
			padding: 1.25rem;
			gap: 1.25rem;
		}

		.statute-notice__actions {
			flex-direction: column;
			width: 100%;
		}

		.statute-btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
