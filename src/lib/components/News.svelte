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
		{#if items.length > 0}
			<NewsWidget 
				items={items} 
				config={config} 
				showAllLink 
				storageKey="" 
				title={$t('news.title')}
				subtitle={$t('news.subtitle')}
			/>
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

	@media (max-width: 480px) {
		.news {
			padding: var(--space-xl) 0;
		}
	}
</style>
