<script lang="ts">
	import Wave from "$lib/components/Wave.svelte";
	import BirdIcon from "$lib/components/icons/BirdIcon.svelte";
	import NewsWidget, { type NewsWidgetItem } from "$lib/components/NewsWidget.svelte";
	import { page } from "$app/state";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { base } from "$app/paths";
	import { getArticles, getDisplayDate } from "$lib/services/articles";
	import { getContentExcerpt } from "$lib/utils/renderContent";
	import { getCategoryLabel } from "$lib/config/categories";
	import { locale, t } from "svelte-i18n";
	import { getNewsPageSettings, DEFAULT_NEWS_WIDGET_PAGE, type NewsWidgetConfig } from "$lib/services/settings";

	let newsItems = $state<NewsWidgetItem[]>([]);
	let widgetConfig = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_PAGE });
	let loading = $state(true);
	const isMobile = browser ? window.matchMedia('(max-width: 768px)').matches : false;

	const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C", "#F7FFF7", "#FF9F1C"];

	onMount(async () => {
		try {
			const lang = ($locale as "uk" | "en") || "uk";
			const [allArticles, newsSettings] = await Promise.all([
				getArticles(lang, true),
				getNewsPageSettings(),
			]);

			if (newsSettings) {
				const desktop = newsSettings.newsWidget;
				const mobile = newsSettings.mobileNewsWidget;
				widgetConfig = (isMobile && mobile) ? mobile : desktop;
			}

			if (allArticles.length > 0) {
				// Фільтруємо тільки статті (не сторінки та не проєкти)
				const onlyNews = allArticles.filter(article => article.type !== 'page' && article.type !== 'page_project');
				
				// Сортуємо по дате відображення (customDate > updatedAt > createdAt) від нових до старих
				const sortedArticles = [...onlyNews].sort((a, b) => {
					const dateA = getDisplayDate(a);
					const dateB = getDisplayDate(b);
					const timeA = dateA?.toDate ? dateA.toDate().getTime() : 0;
					const timeB = dateB?.toDate ? dateB.toDate().getTime() : 0;
					return timeB - timeA; // Від більших до менших (нові першими)
				});

				newsItems = sortedArticles.map((item, index) => {
					let dateStr = "";
					const timestamp = getDisplayDate(item);
					if (timestamp?.toDate) {
						dateStr = timestamp.toDate().toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
					}
					const translation = item.translations?.[lang as 'uk' | 'en'] || { title: '', content: '' };
					const excerpt = getContentExcerpt((translation as any).content || '', (translation as any).contentFormat, 150);
					const categoryName = getCategoryLabel(item.category, ($locale === 'en' ? 'en' : 'uk'));

					return {
						id: item.id ?? '',
						slug: item.slug,
						title: (translation as any).title || '',
						date: dateStr,
						category: categoryName,
						excerpt,
						color: colors[index % colors.length],
						coverUrl: (translation as any).coverUrl || ''
					};
				});
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{$t('news.title')} | {$t('seo.brandTitle')}</title>
</svelte:head>

<!-- News Section -->
<section class="news" id="news-section" aria-labelledby="news-title" style="padding-top: 140px;" data-testid="news-page-section">
	<div class="container" data-testid="news-page-container">
		<div class="news__header" data-testid="news-page-header-group">
			<div class="news__title-group" data-testid="news-page-title-group">
				<h2 class="news__title" id="news-title" data-testid="news-page-title-label">
					{$t('news.title')}
				</h2>
				<p class="news__subtitle" data-testid="news-page-subtitle-label">{$t('news.subtitle')}</p>
			</div>
		</div>

		{#if loading}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold;" data-testid="news-page-loading-label">{$t('news.loading')}</p>
		{:else if newsItems.length > 0}
			<NewsWidget items={newsItems} config={widgetConfig} storageKey="news-view" />
		{:else}
			<p style="text-align: center; color: var(--color-deep-ocean); font-weight: bold; font-size: 1.2rem;" data-testid="news-page-empty-label">{$t('news.empty')}</p>
		{/if}
	</div>
</section>

<style>
	.news {
		background: var(--color-light-blue);
		padding: 4rem 0 6rem;
		overflow: hidden;
		position: relative;
	}

	.news__header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-lg);
		margin-bottom: 4rem;
		padding: 0 var(--space-xl);
	}

	.news__title-group {
		text-align: left;
	}

	.news__title {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-deep-ocean);
		margin-bottom: 1rem;
	}

	.news__subtitle {
		font-size: 1.2rem;
		color: var(--color-body-text);
		opacity: 0.7;
	}

	@media (max-width: 768px) {
		.news {
			padding: 4rem 0;
		}
		.news__header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-md);
			padding: 0 var(--space-md);
			margin-bottom: var(--space-xl);
		}
		.news__title {
			font-size: clamp(2rem, 8vw, 2.5rem);
		}
		.news__subtitle {
			font-size: 1rem;
		}
	}
</style>
