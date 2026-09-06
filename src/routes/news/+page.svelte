<script lang="ts">
	import ContentWidget from "$lib/components/ContentWidget.svelte";
	import type { ContentWidgetConfig } from "$lib/components/ContentWidget.svelte";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { getArticles, getDisplayDate, mapArticleToWidgetItem, type Article } from "$lib/services/articles";
	import { locale, t } from "svelte-i18n";
	import { getNewsPageSettings, getCachedNewsPageSettings, newsToContentConfig, DEFAULT_NEWS_WIDGET_PAGE, DEFAULT_NEWS_WIDGET_PAGE_MOBILE, type NewsWidgetConfig } from "$lib/services/settings";
	import { newsFeed } from "$lib/utils/newsFeed";

	// ── SWR: instant from cache, then revalidate ──────────────────────────────────────────
	const cachedNews = browser ? getCachedNewsPageSettings() : null;
	const isMobile = browser ? window.matchMedia('(max-width: 1024px)').matches : false;

	function pickConfig(desktop?: NewsWidgetConfig, mobile?: NewsWidgetConfig): NewsWidgetConfig {
		if (isMobile) return mobile ?? { ...DEFAULT_NEWS_WIDGET_PAGE_MOBILE };
		return desktop ?? { ...DEFAULT_NEWS_WIDGET_PAGE };
	}

	let rawNewsArticles = $state<Article[]>([]);
	let widgetConfig = $state<NewsWidgetConfig>(pickConfig(cachedNews?.newsWidget, cachedNews?.mobileNewsWidget));
	let loading = $state(true);

	const contentConfig = $derived<ContentWidgetConfig>(newsToContentConfig(widgetConfig));

	// Reactive locale for widget re-mapping
	const activeLang = $derived((($locale as string) || 'uk') as 'uk' | 'en');

	/*
	 * ПЕРЕЛІК ЗВОДИТЬ ДВА ДЖЕРЕЛА: базу й репозиторій — спільною хронологією.
	 *
	 * Доти тут стояло просте склеювання «код, далі база», і виглядало воно
	 * правильно лише тому, що обидві новини з коду найновіші. Розбір і причина,
	 * чому це чекало на першу ж перенесену старішу новину, — у `utils/newsFeed`.
	 *
	 * Новини з коду й далі не чекають на Firestore: поки база не відповіла, у
	 * переліку самі лише вони — вже в правильному порядку між собою.
	 *
	 * Чернетки не приходять узагалі: `codeNewsCards` віддає лише `published`,
	 * так само як фільтр нижче віддає лише `isPublished` зі статей бази.
	 */
	let newsItems = $derived.by(() =>
		newsFeed(
			activeLang,
			rawNewsArticles
				.filter((a) => a.translations?.[activeLang]?.isPublished)
				.map((item, index) => ({
					картка: mapArticleToWidgetItem(item, activeLang, index),
					час: getDisplayDate(item)?.toMillis() ?? 0
				}))
		)
	);

	onMount(async () => {
		try {
			const lang = ($locale as "uk" | "en") || "uk";
			const [articlesResult, settingsResult] = await Promise.allSettled([
				getArticles(lang, true),
				getNewsPageSettings(),
			]);

			if (settingsResult.status === 'fulfilled' && settingsResult.value) {
				widgetConfig = pickConfig(settingsResult.value.newsWidget, settingsResult.value.mobileNewsWidget);
			} else if (settingsResult.status === 'rejected') {
				console.error('Failed to load news settings:', settingsResult.reason);
			}

			if (articlesResult.status === 'fulfilled' && articlesResult.value.length > 0) {
				const allArticles = articlesResult.value;
				const onlyNews = allArticles.filter(article => article.type !== 'page' && article.type !== 'page_project');
				rawNewsArticles = [...onlyNews].sort((a, b) => {
					const dateA = getDisplayDate(a);
					const dateB = getDisplayDate(b);
					const timeA = dateA?.toDate ? dateA.toDate().getTime() : 0;
					const timeB = dateB?.toDate ? dateB.toDate().getTime() : 0;
					return timeB - timeA;
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
<section class="news news--page" id="news-section" aria-labelledby="news-title" data-testid="news-page-section">
	<div class="container" data-testid="news-page-container">
		<!--
			Напис «завантажується» — лише коли показати НІЧОГО. Доти він стояв на
			час запиту завжди, і новини з коду, які вже в бандлі, ховалися за ним
			разом із рештою — тобто готовий вміст чекав на мережу без причини.
		-->
		{#if loading && newsItems.length === 0}
			<p class="news-page__status" data-testid="news-page-loading-status">{$t('news.loading')}</p>
		{:else if newsItems.length > 0}
			<ContentWidget
				items={newsItems}
				config={contentConfig}
				linkPrefix="news"
				readMoreLabel={$t('news.readMore')}
				testIdPrefix="news-widget"
				cardTestIdPrefix="news-page"
				storageKey="news-view"
				title={$t('news.title')}
				subtitle={$t('news.subtitle')}
			/>
		{:else}
			<p class="news-page__status news-page__status--large" data-testid="news-page-empty-message">{$t('news.empty')}</p>
		{/if}
	</div>
</section>

<style>
	.news {
		background: var(--bg-page);
		padding: 4rem 0 6rem;
		overflow: hidden;
		position: relative;
	}

	.news--page {
		padding-top: var(--page-pad-top);
	}

	.news-page__status {
		text-align: center;
		color: var(--text-title);
		font-weight: bold;
	}

	.news-page__status--large {
		font-size: 1.2rem;
	}

	@media (max-width: 1024px) {
		.news {
			padding: 4rem 0;
		}
	}
</style>
