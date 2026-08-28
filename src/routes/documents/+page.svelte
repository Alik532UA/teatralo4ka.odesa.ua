<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { asset, resolve } from '$app/paths';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { DOMPURIFY_HTML_CONFIG } from '$lib/utils/markedConfig';
	import { FileText, Download, ExternalLink, ShieldCheck, ArrowLeft, BookOpen, FileCheck } from 'lucide-svelte';

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

<section class="page-content container" style="padding: var(--page-pad-top) 24px var(--page-pad-bottom);" data-testid="documents-page-section">
	<div class="back-nav" data-testid="documents-back-nav">
		<a href={resolve('/about')} class="back-link" data-testid="documents-back-to-about-link">
			<ArrowLeft size={18} />
			<span>{$t('documents.backToAbout')}</span>
		</a>
	</div>

	{#if content}
		<article class="page-article" data-testid="documents-article-section">
			<div class="prose" data-testid="documents-prose-container">
				<!-- Виняток за SECURITY-v8 § 5.3: markdown зі сторінок репозиторію,
				     пропущений через DOMPurify безпосередньо перед вставкою. -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html DOMPurify.sanitize(content.html, DOMPURIFY_HTML_CONFIG)}
			</div>

			<div class="docs-section" data-testid="documents-grid-section">
				<!-- 1. Установчі документи -->
				<div class="doc-category" data-testid="doc-category-constituent-section">
					<div class="category-header">
						<div class="category-icon-wrap">
							<ShieldCheck size={22} />
						</div>
						<h2 class="category-title">{$t('documents.constituent')}</h2>
					</div>

					<div class="docs-list">
						<!-- Картка Статуту 2025 -->
						<div class="doc-card doc-card--featured" data-testid="doc-card-statute">
							<div class="doc-card__badge-row">
								<span class="doc-badge doc-badge--format">PDF</span>
								<span class="doc-badge doc-badge--size">{$t('documents.fileSize')}</span>
								<span class="doc-badge doc-badge--edition">{$t('documents.statuteEdition')}</span>
							</div>

							<div class="doc-card__body">
								<div class="doc-card__icon-box">
									<FileText size={36} />
								</div>
								<div class="doc-card__info">
									<h3 class="doc-card__title">{$t('documents.statuteFullTitle')}</h3>
									<p class="doc-card__desc">{$t('documents.statuteDesc')}</p>
								</div>
							</div>

							<div class="doc-card__actions" data-testid="doc-card-actions-toolbar">
								<a
									href={asset('/documents/statut-2025.pdf')}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-primary doc-btn"
									data-testid="doc-statute-view-btn"
								>
									<ExternalLink size={18} />
									<span>{$t('documents.view')}</span>
								</a>

								<a
									href={asset('/documents/statut-2025.pdf')}
									download="Statut-Odeska-Teatralna-Shkola-2025.pdf"
									class="btn btn-outline doc-btn"
									data-testid="doc-statute-download-btn"
								>
									<Download size={18} />
									<span>{$t('documents.download')}</span>
								</a>
							</div>
						</div>
					</div>
				</div>

				<!-- 2. Освітній процес та прийом -->
				<div class="doc-category" data-testid="doc-category-educational-section">
					<div class="category-header">
						<div class="category-icon-wrap">
							<BookOpen size={22} />
						</div>
						<h2 class="category-title">{$t('documents.educational')}</h2>
					</div>

					<div class="info-card" data-testid="doc-info-educational-card">
						<div class="info-card__content">
							<FileCheck size={28} class="info-card__icon" />
							<div>
								<h3 class="info-card__title">{$t('seo.pages.admission.title')}</h3>
								<p class="info-card__desc">{$t('seo.pages.admission.description')}</p>
							</div>
						</div>
						<a href={resolve('/admission')} class="btn btn-outline doc-btn" data-testid="doc-admission-link">
							<span>{$t('admission.title')}</span>
						</a>
					</div>
				</div>
			</div>
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="documents-loading-container">
			<p data-testid="documents-loading-status">{$t('common.loading')}</p>
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

	.page-article {
		max-width: 860px;
		margin: 0 auto;
	}

	.docs-section {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		margin-top: 2rem;
	}

	.doc-category {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.category-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
		color: var(--accent-primary);
	}

	.category-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.4rem;
		color: var(--text-title);
	}

	.docs-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Document Card */
	.doc-card {
		background: var(--bg-surface, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--border-main, rgba(255, 255, 255, 0.12));
		border-radius: 24px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
		transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
	}

	.doc-card--featured {
		border-color: color-mix(in srgb, var(--accent-primary) 30%, transparent);
		background: linear-gradient(
			135deg,
			var(--bg-surface, #ffffff) 0%,
			color-mix(in srgb, var(--accent-primary) 5%, var(--bg-surface, #ffffff)) 100%
		);
	}

	.doc-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
		border-color: var(--accent-primary);
	}

	.doc-card__badge-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.doc-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 600;
		font-family: var(--font-heading);
		letter-spacing: 0.02em;
	}

	.doc-badge--format {
		background: #c62828;
		color: #ffffff;
	}

	.doc-badge--size {
		background: color-mix(in srgb, var(--text-muted) 18%, transparent);
		color: var(--text-title);
	}

	.doc-badge--edition {
		background: color-mix(in srgb, var(--accent-primary) 20%, transparent);
		color: var(--accent-primary);
	}

	.doc-card__body {
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
	}

	.doc-card__icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		min-width: 56px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
		color: var(--accent-primary);
	}

	.doc-card__info {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.doc-card__title {
		margin: 0;
		font-size: 1.2rem;
		font-family: var(--font-heading);
		color: var(--text-title);
		line-height: 1.35;
	}

	.doc-card__desc {
		margin: 0;
		font-size: 0.95rem;
		color: var(--text-muted);
		line-height: 1.5;
	}

	.doc-card__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border-main, rgba(255, 255, 255, 0.08));
	}

	.doc-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.25rem;
		font-size: 0.95rem;
		font-weight: 600;
		border-radius: 9999px;
		text-decoration: none;
		cursor: pointer;
		transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
	}

	.doc-btn:hover {
		transform: translateY(-1px);
	}

	/* Educational info card */
	.info-card {
		background: var(--bg-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--border-main, rgba(255, 255, 255, 0.1));
		border-radius: 20px;
		padding: 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.info-card__content {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 250px;
		flex: 1;
	}

	:global(.info-card__icon) {
		color: var(--accent-primary);
		min-width: 28px;
	}

	.info-card__title {
		margin: 0;
		font-size: 1.05rem;
		font-family: var(--font-heading);
		color: var(--text-title);
	}

	.info-card__desc {
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	@media (max-width: 640px) {
		.doc-card {
			padding: 18px;
		}

		.doc-card__body {
			flex-direction: column;
			gap: 0.75rem;
		}

		.doc-card__icon-box {
			width: 44px;
			height: 44px;
			min-width: 44px;
		}

		.doc-card__actions {
			flex-direction: column;
			width: 100%;
		}

		.doc-btn {
			width: 100%;
			justify-content: center;
		}

		.info-card {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
