<script lang="ts">
	import { getDisplayDate, type Article } from '$lib/services/articles';
	import { onMount } from 'svelte';
	import { renderContent, getContentExcerpt } from '$lib/utils/renderContent';
		import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { getCategoryLabel } from '$lib/config/categories';
	import ArticleView from '$lib/components/ArticleView.svelte';
	import { cardImageUrl, parseVideoUrl } from '$lib/utils/videoEmbed';
	import { page } from '$app/state';

	interface Props {
		/** The route parameter value (article ID or slug) */
		param: string | undefined;
		/** Function to fetch the article/page data */
		fetchFn: (param: string) => Promise<Article | null>;
		/** Готова адреса від resolve(). Складати її з префіксом не треба:
		    подвійне складання давало "…odesa.ua../" на вкладених сторінках. */
		backHref: string;
		/** i18n key for back button text */
		backLabelKey: string;
		/** i18n key for loading state text */
		loadingKey: string;
		/** i18n key for "not found" error */
		notFoundKey: string;
		/** i18n key for generic error */
		errorKey: string;
		/** data-testid prefix */
		testIdPrefix: string;
	}

	const { param, fetchFn, backHref, backLabelKey, loadingKey, notFoundKey, errorKey, testIdPrefix }: Props = $props();

	let article = $state<Article | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadData() {
		if (!param) return;

		loading = true;
		error = null;
		article = null;

		try {
			article = await fetchFn(param);
			if (!article) {
				error = $t(notFoundKey);
				return;
			}
			const lang = ($locale as 'uk' | 'en') || 'uk';
			const extUrl = (article.translations?.[lang]?.externalUrl || '').trim();
			if (extUrl) {
				window.location.href = extUrl;
				return;
			}
		} catch (e) {
			console.error(e);
			error = $t(errorKey);
		} finally {
			loading = false;
		}
	}

	onMount(loadData);

	let translation = $derived(
		article?.translations?.[$locale as 'uk' | 'en'] ?? null
	);

	/**
	 * Відео на сторінці статті: зображення лишається, кнопка перемикає.
	 *
	 * Плеєр НЕ вставляється одразу, і це не оптимізація «на всяк випадок».
	 * `<iframe>` YouTube тягне за собою кількасот кілобайт і встановлює cookie
	 * ще до того, як відвідувач вирішив дивитися. Тому: зображення + кнопка, а
	 * плеєр з'являється на тому самому місці за кліком.
	 *
	 * Для Instagram і Facebook плеєра немає — там кнопка відкриває посилання в
	 * новій вкладці. Причина в CSP: вбудовування вимагало б нових доменів і
	 * стороннього SDK, а ламалося б мовчки, порожньою рамкою.
	 */
	let videoOpen = $state(false);
	const video = $derived(parseVideoUrl(translation?.videoUrl));
	/** Обкладинка сторінки: своє зображення, інакше кадр із відео. */
	const cover = $derived(cardImageUrl(translation?.coverUrl, translation?.videoUrl));

	/**
	 * Перехід на іншу статтю скидає плеєр: інакше на новій сторінці лишалося б
	 * відкрите відео попередньої.
	 *
	 * Виняток — `?video=1`. За ним приходять із кнопки відео в сповіщенні про
	 * гарячу новину: там натиснули саме «дивитися», і показати натомість
	 * обкладинку з кнопкою означало б попросити зробити те саме вдруге.
	 */
	$effect(() => {
		void param;
		videoOpen = page.url.searchParams.get('video') === '1';
	});

	$effect(() => {
		if (translation) {
			seo.update({
				title: `${translation.title} - ${$t('seo.brandTitle')}`,
				// Переноси тут зайві: це вміст `<meta name="description">`, рядок в
				// одну лінію. Абзаци потрібні описам карток, не пошуковій видачі.
				description: getContentExcerpt(translation.content || '', translation.contentFormat, 160)
					.replace(/\n/g, ' ')
			});
		}
	});

	function formatDate(article: Article) {
		const lang = ($locale as "uk" | "en") || "uk";
		const timestamp = getDisplayDate(article);
		if (!timestamp) return '';
		return timestamp.toDate().toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

{#if loading || error}
	<section class="detail-page container" data-testid="{testIdPrefix}-section">
		<div class="back-nav" data-testid="{testIdPrefix}-back-toolbar">
			<!-- Готова адреса від resolve() у виклику компонента. -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={backHref} class="btn btn-outline" data-testid="{testIdPrefix}-back-link">{$t(backLabelKey)}</a>
		</div>

		{#if loading}
			<div class="detail-page__loading" data-testid="{testIdPrefix}-loading-container">
				<p data-testid="{testIdPrefix}-loading-status">{$t(loadingKey)}</p>
			</div>
		{:else}
			<div class="detail-page__error" data-testid="{testIdPrefix}-error-container">
				<h1 class="detail-page__error-title" data-testid="{testIdPrefix}-error-title">{error}</h1>
			</div>
		{/if}
	</section>
{:else if article && translation}
	<ArticleView
		title={translation.title || ''}
		dateLabel={formatDate(article)}
		categoryLabel={getCategoryLabel(article.category, $locale === 'en' ? 'en' : 'uk')}
		coverUrl={cover}
		{video}
		bind:videoOpen
		{backHref}
		backLabel={$t(backLabelKey)}
		{testIdPrefix}
	>
		{#snippet prose()}
			<!-- Виняток за SECURITY-v8 § 5.3: контент із Firestore, який пише
			     редактор адмінки, тобто джерело недовірене. renderContent
			     завжди проганяє його через DOMPurify — і для markdown, і для
			     формату html (там ще й із конфігом, що дозволяє iframe). -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html renderContent(translation.content || '', translation.contentFormat)}
		{/snippet}
	</ArticleView>
{/if}

<style>
	/*
	 * Тут лишилися стилі СТАНІВ запиту, а розкладка статті поїхала в
	 * `ArticleView` — разом із власною копією цих двох правил.
	 *
	 * Копія навмисна й дрібна: `.detail-page` задає відступи сторінки, а
	 * `.back-nav` — ширину смуги «назад», і потрібні вони обом гілкам. Спроба
	 * поділитися ними означала б або глобальний клас на дві сторінки, або
	 * обгортку навколо станів «завантажується / не знайдено» — тобто більше
	 * зв'язності, ніж коштують шість рядків.
	 */
	.detail-page {
		padding: var(--page-pad-top) 24px var(--page-pad-bottom);
		min-height: 80dvh;
	}

	.back-nav {
		max-width: 1000px;
		margin: 0 auto 2rem;
	}

	.detail-page__loading {
		display: flex;
		justify-content: center;
		padding: 4rem;
	}

	.detail-page__error {
		text-align: center;
		padding: 4rem;
	}

	.detail-page__error-title {
		color: var(--text-title);
		margin-bottom: 2rem;
	}

	@media (max-width: 768px) {
		.back-nav {
			text-align: center;
		}
	}
</style>
