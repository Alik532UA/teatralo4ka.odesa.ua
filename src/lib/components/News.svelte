<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { getArticles, getDisplayDate } from '$lib/services/articles';
	import { getContentExcerpt } from '$lib/utils/renderContent';
	import { getCategoryLabel } from '$lib/config/categories';
	import { getHomeSettings, DEFAULT_NEWS_WIDGET_HOME, type NewsWidgetConfig } from '$lib/services/settings';
	import NewsWidget, { type NewsWidgetItem } from '$lib/components/NewsWidget.svelte';

	const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F7FFF7', '#FF9F1C'];

	let newsItems = $state<NewsWidgetItem[]>([]);
	let widgetConfig = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_HOME });
	let loading = $state(true);
	let loadError = $state(false);

	onMount(async () => {
		try {
			const [, settings] = await Promise.all([
				loadArticles(),
				getHomeSettings(),
			]);
			if (settings?.newsWidget) {
				widgetConfig = settings.newsWidget;
			}
		} catch {
			// fallback to defaults
		}
	});

	async function loadArticles() {
		try {
			const lang = (($locale as string) || 'uk') as 'uk' | 'en';
			const articles = await getArticles(lang, true);
			
			// Фільтруємо тільки статті (не сторінки та не проєкти)
			const onlyNews = articles.filter(article => article.type !== 'page' && article.type !== 'page_project');
			
			// Сортуємо по дате відображення (customDate > updatedAt > createdAt) від нових до старих
			const sortedArticles = [...onlyNews].sort((a, b) => {
				const dateA = getDisplayDate(a);
				const dateB = getDisplayDate(b);
				const timeA = dateA?.toDate ? dateA.toDate().getTime() : 0;
				const timeB = dateB?.toDate ? dateB.toDate().getTime() : 0;
				return timeB - timeA; // Від більших до менших (нові першими)
			});
			
			newsItems = sortedArticles.map((item, index) => {
				const tr = item.translations?.[lang] ?? { title: '', content: '' };
				const timestamp = getDisplayDate(item);
				const dateStr = timestamp?.toDate
					? timestamp.toDate().toLocaleDateString(
							lang === 'uk' ? 'uk-UA' : 'en-US',
							{ day: 'numeric', month: 'short', year: 'numeric' }
					  )
					: '';
				const excerpt = getContentExcerpt(
					(tr as any).content || '',
					(tr as any).contentFormat,
					150
				);
				return {
					id: item.id ?? '',
					slug: item.slug,
					title: (tr as any).title || '',
					date: dateStr,
					category: getCategoryLabel(item.category, lang),
					excerpt,
					color: colors[index % colors.length],
					coverUrl: (tr as any).coverUrl || '',
				};
			});
		} catch (e) {
			console.error('News: failed to load articles', e);
			loadError = true;
		} finally {
			loading = false;
		}
	}
</script>

{#if !loadError}
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

		{#if loading}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold;" data-testid="news-loading-label">{$t('news.loading')}</p>
		{:else if newsItems.length > 0}
			<NewsWidget items={newsItems} config={widgetConfig} showAllLink storageKey="" />
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
</style>
