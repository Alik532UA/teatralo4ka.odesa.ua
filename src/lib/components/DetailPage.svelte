<script lang="ts">
	import { getDisplayDate, type Article } from '$lib/services/articles';
	import { onMount } from 'svelte';
	import { renderContent, getContentExcerpt } from '$lib/utils/renderContent';
		import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { getCategoryLabel } from '$lib/config/categories';
	import { Play, Image as ImageIcon, ExternalLink } from 'lucide-svelte';
	import { cardImageUrl, parseVideoUrl } from '$lib/utils/videoEmbed';

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

	// Перехід на іншу статтю має скидати плеєр: інакше на новій сторінці
	// лишалося б відкрите відео попередньої.
	$effect(() => {
		void param;
		videoOpen = false;
	});

	$effect(() => {
		if (translation) {
			seo.update({
				title: `${translation.title} - ${$t('seo.brandTitle')}`,
				description: getContentExcerpt(translation.content || '', translation.contentFormat, 160)
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

<section class="detail-page container" data-testid="{testIdPrefix}-section">
	<div class="back-nav" data-testid="{testIdPrefix}-back-toolbar">
		<!-- Готова адреса від resolve() у виклику компонента. -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={backHref} class="btn btn-outline" data-testid="{testIdPrefix}-back-link">{$t(backLabelKey)}</a>
	</div>

	{#if loading}
		<div class="detail-page__loading" data-testid="{testIdPrefix}-loading-container">
			<p data-testid="{testIdPrefix}-loading-label">{$t(loadingKey)}</p>
		</div>
	{:else if error}
		<div class="detail-page__error" data-testid="{testIdPrefix}-error-container">
			<h1 class="detail-page__error-title" data-testid="{testIdPrefix}-error-title">{error}</h1>
		</div>
	{:else if article && translation}
		<article data-testid="{testIdPrefix}-content-container">
			<div class="article-body" class:has-cover={!!cover || !!video}>
				{#if cover || video}
					<aside class="article-cover" data-testid="{testIdPrefix}-cover-container">
						{#if videoOpen && video?.embeddable}
							<!-- Плеєр стає на місце зображення, у тій самій рамці. -->
							<iframe
								src="{video.embedUrl}?autoplay=1"
								title={translation.title || $t('common.hasVideo')}
								class="article-cover__player"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								referrerpolicy="strict-origin-when-cross-origin"
								data-testid="{testIdPrefix}-cover-video-container"
							></iframe>
						{:else if cover}
							<img
								src={cover}
								alt={translation.title || ''}
								class="article-cover__img"
								loading="eager"
								fetchpriority="high"
								decoding="async"
								data-testid="{testIdPrefix}-cover-img"
							/>
						{/if}

						{#if video}
							{#if video.embeddable}
								<button
									type="button"
									class="btn btn-outline article-cover__video-btn"
									onclick={() => (videoOpen = !videoOpen)}
									data-testid="{testIdPrefix}-cover-video-btn"
								>
									{#if videoOpen}
										<ImageIcon size={16} aria-hidden="true" />
										{$t('common.showCover')}
									{:else}
										<Play size={16} aria-hidden="true" />
										{$t('common.watchVideo')}
									{/if}
								</button>
							{:else}
								<!-- Instagram/Facebook: вбудувати не можемо, тож честніше
								     відкрити там, де воно справді працює. -->
								<!-- Правило звітує на рядку з `href`, тому він мусить бути на тому
								     самому рядку, що й `<a` — інакше disable-next-line його не
								     покриває. Той самий прийом, що для `backHref` вище. -->
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={video.url}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-outline article-cover__video-btn"
									data-testid="{testIdPrefix}-cover-video-link"
								>
									<ExternalLink size={16} aria-hidden="true" />
									{$t('common.watchVideo')}
								</a>
							{/if}
						{/if}
					</aside>
				{/if}

				<div class="article-main">
					<div class="article-header" data-testid="{testIdPrefix}-header">
						{#if formatDate(article) || getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
							<div class="article-meta" data-testid="{testIdPrefix}-meta-section">
								{#if getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
									<span class="tag" data-testid="{testIdPrefix}-category-badge">
										{getCategoryLabel(article.category, ($locale === 'en' ? 'en' : 'uk'))}
									</span>
								{/if}
								{#if formatDate(article)}
									<time data-testid="{testIdPrefix}-date-label">
										{formatDate(article)}
									</time>
								{/if}
							</div>
						{/if}
						<h1 data-testid="{testIdPrefix}-title-label">
							{translation.title || ''}
						</h1>
					</div>

					<div class="prose" data-testid="{testIdPrefix}-prose-container">
						<!-- Виняток за SECURITY-v8 § 5.3: контент із Firestore, який пише
						     редактор адмінки, тобто джерело недовірене. renderContent
						     завжди проганяє його через DOMPurify — і для markdown, і для
						     формату html (там ще й із конфігом, що дозволяє iframe). -->
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html renderContent(translation.content || '', translation.contentFormat)}
					</div>
				</div>
			</div>
		</article>
	{/if}
</section>

<style>
	.detail-page {
		padding: var(--page-pad-top) 24px var(--page-pad-bottom);
		min-height: 80vh;
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

	.back-nav {
		max-width: 1000px;
		margin: 0 auto 2rem;
	}

	.article-header {
		margin-bottom: 2.5rem;
	}

	.article-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.tag {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		padding: 0.4rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	time {
		color: var(--color-muted-text);
		font-weight: 500;
	}

	h1 {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--text-title);
		line-height: 1.1;
		margin: 0;
	}

	.article-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.article-body {
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.8;
		font-size: 1.1rem;
		color: var(--color-body-text);
	}

	.article-body.has-cover {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2.5rem;
		max-width: 1000px;
		align-items: start;
	}

	.article-cover {
		border-radius: 20px;
		overflow: hidden;
		/* Кнопка лягає під зображенням, тому рамка стає колонкою. */
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		aspect-ratio: 9 / 16;
		position: sticky;
		top: 120px;
	}

	/* Плеєр займає те саме місце, що й зображення, і в тій самій пропорції —
	   інакше вміст сторінки стрибав би при перемиканні. */
	.article-cover__player {
		width: 100%;
		flex: 1;
		border: 0;
		border-radius: 20px;
		background: var(--bg-surface);
		display: block;
	}

	.article-cover__video-btn {
		width: 100%;
		justify-content: center;
		flex-shrink: 0;
	}

	.article-cover__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.prose :global(h2) {
		font-family: var(--font-heading);
		color: var(--text-title);
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

	.prose :global(ul), .prose :global(ol) {
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}

	.prose :global(li) {
		margin-bottom: 0.5rem;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2.2rem;
		}

		.back-nav {
			text-align: center;
		}

		.article-body.has-cover {
			grid-template-columns: 1fr;
		}

		.article-cover {
			max-width: 240px;
			margin: 0 auto;
			position: static;
		}
	}
</style>
