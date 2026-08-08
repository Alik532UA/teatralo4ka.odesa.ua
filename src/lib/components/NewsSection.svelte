<script lang="ts">
	import { t } from 'svelte-i18n';
	import { base } from '$app/paths';
	import ContentWidget from '$lib/components/ContentWidget.svelte';
	import type { ContentCardItem } from '$lib/components/ContentCard.svelte';
	import type { ContentWidgetConfig } from '$lib/components/ContentWidget.svelte';
	import { newsToContentConfig, DEFAULT_NEWS_WIDGET_HOME, type NewsWidgetConfig } from '$lib/services/settings';

	interface Props {
		items?: ContentCardItem[];
		config?: NewsWidgetConfig;
		error?: boolean;
	}

	let { items = [], config = DEFAULT_NEWS_WIDGET_HOME, error = false }: Props = $props();

	const widgetConfig = $derived<ContentWidgetConfig>(newsToContentConfig(config));
</script>

{#if !error}
<section class="news" id="news-section" aria-labelledby="news-title" data-testid="news-section-container">
	<div class="container" data-testid="news-content-container">
		{#if items.length > 0}
			<ContentWidget
				items={items}
				config={widgetConfig}
				showAllLink
				allLinkHref="{base}/news"
				allLinkLabel={$t('news.allNews')}
				allLinkViewKey="news-view"
				linkPrefix="news"
				readMoreLabel={$t('news.readMore')}
				testIdPrefix="news-widget"
				cardTestIdPrefix="news-page"
				storageKey=""
				title={$t('news.title')}
				subtitle={$t('news.subtitle')}
			/>
		{:else}
			<p style="text-align: center; color: var(--text-title); font-weight: bold; font-size: 1.2rem;" data-testid="news-empty-label">{$t('news.empty')}</p>
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
