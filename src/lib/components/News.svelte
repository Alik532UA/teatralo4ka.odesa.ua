<script lang="ts">
	import { t } from 'svelte-i18n';
	import NewsWidget from '$lib/components/NewsWidget.svelte';
	import type { NewsWidgetItem } from '$lib/components/NewsWidget.svelte';
	import type { NewsWidgetConfig } from '$lib/services/settings';
	import { DEFAULT_NEWS_WIDGET_HOME } from '$lib/services/settings';

	interface Props {
		items?: NewsWidgetItem[];
		config?: NewsWidgetConfig;
		error?: boolean;
	}

	let { items = [], config = DEFAULT_NEWS_WIDGET_HOME, error = false }: Props = $props();
</script>

{#if !error}
<section class="news" id="news-section" aria-labelledby="news-title" data-testid="news-section-container">
	<div class="container" data-testid="news-content-container">
		<div class="news__header" data-testid="news-header-group">
			<div class="news__title-group" data-testid="news-title-group">
				<h2 class="news__title" id="news-title" data-testid="news-title-label">
					{$t('news.title')}
				</h2>
				<p class="news__subtitle" data-testid="news-subtitle-label">{$t('news.subtitle')}</p>
			</div>
		</div>

		{#if items.length > 0}
			<NewsWidget items={items} config={config} showAllLink storageKey="" />
		{:else}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold; font-size: 1.2rem;" data-testid="news-empty-label">{$t('news.empty')}</p>
		{/if}
	</div>
</section>
{/if}

<style>
	.news {
		padding: var(--space-2xl) 0;
		background: transparent;
		overflow: hidden;
	}

	.news__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: var(--space-2xl);
		gap: var(--space-xl);
		padding: 0 var(--space-xl);
	}

	@media (max-width: 768px) {
		.news__header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-md);
			padding: 0 var(--space-md);
			margin-bottom: var(--space-xl);
		}
	}

	.news__title {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 800;
		color: var(--color-deep-ocean);
		margin-bottom: var(--space-xs);
	}

	.news__subtitle {
		font-size: 1.1rem;
		color: var(--color-muted-text);
		max-width: 500px;
	}

	@media (max-width: 480px) {
		.news__subtitle {
			font-size: 1rem;
		}
	}
</style>
