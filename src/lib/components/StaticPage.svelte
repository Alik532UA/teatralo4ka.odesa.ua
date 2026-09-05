<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { base, resolve } from '$app/paths';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { DOMPURIFY_HTML_CONFIG } from '$lib/utils/markedConfig';
	import type { PageContent } from '$lib/i18n/types';

	import { onMount, type Snippet } from 'svelte';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';

	interface Props {
		data: { uk: PageContent | null; en: PageContent | null };
		testPrefix?: string;
		/** Optional back navigation link (e.g. `${base}/projects`) */
		backHref?: string;
		/** Optional back navigation label (e.g. "Всі проєкти") */
		backLabel?: string;
		/**
		 * Дії саме цієї сторінки — під текстом і ПЕРЕД типовою навігацією
		 * чернетки. Порядок не косметичний: «На головну / Новини / Проєкти» —
		 * це вихід зі сторінки, і ставити його попереду прохання означало б
		 * пропонувати піти раніше, ніж допомогти.
		 */
		actions?: Snippet;
	}

	let { data, testPrefix = 'static', backHref, backLabel, actions }: Props = $props();

	let activeLightboxImages = $state<LightboxImage[]>([]);
	let activeLightboxIndex = $state(0);
	let isLightboxOpen = $state(false);

	onMount(() => {
		function handleClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (target && target.tagName === 'IMG' && target.closest('.prose, .page-cover')) {
				const article = target.closest('article, section, .page-content');
				if (!article) return;

				const allImgs = Array.from(article.querySelectorAll('.prose img, img.page-cover__img')) as HTMLImageElement[];
				if (allImgs.length === 0) return;

				const list: LightboxImage[] = allImgs.map(i => ({
					src: i.src,
					alt: i.alt,
					title: i.title || i.alt
				}));
				const clickedIdx = allImgs.indexOf(target as HTMLImageElement);
				activeLightboxImages = list;
				activeLightboxIndex = clickedIdx >= 0 ? clickedIdx : 0;
				isLightboxOpen = true;
			}
		}
		window.addEventListener('click', handleClick);
		return () => window.removeEventListener('click', handleClick);
	});

	let content = $derived($locale === 'en' ? data.en : data.uk);
	let coverUrl = $derived.by(() => {
		const raw = content?.metadata?.coverUrl;
		if (!raw) return '';
		return raw.startsWith(base) ? raw : `${base}${raw}`;
	});

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

<section class="page-content container" style="padding: var(--page-pad-top) 24px var(--page-pad-bottom);" data-testid="{testPrefix}-page-section">
	{#if backHref && backLabel}
		<div class="back-nav" data-testid="{testPrefix}-back-toolbar">
			<!-- Готова адреса від resolve() у виклику компонента. -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={backHref} class="btn btn-outline" data-testid="{testPrefix}-back-link">{backLabel}</a>
		</div>
	{/if}
	{#if content}
		<article data-testid="{testPrefix}-page-article-section">
			<div class="page-body" class:has-cover={!!coverUrl}>
				{#if coverUrl}
					<aside class="page-cover" data-testid="{testPrefix}-page-cover-img">
						<img src={coverUrl} alt={content.metadata.title} class="page-cover__img" />
					</aside>
				{/if}
				<div class="page-main">
					<div class="prose prose--zoomable">
						<!-- Виняток за SECURITY-v8 § 5.3: markdown зі сторінок репозиторію,
						     пропущений через DOMPurify безпосередньо перед вставкою. -->
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html DOMPurify.sanitize(content.html, DOMPURIFY_HTML_CONFIG)}
					</div>

					{@render actions?.()}

					{#if content.metadata.status === 'draft'}
						<div class="draft-actions" data-testid="{testPrefix}-draft-toolbar">
							<a href={resolve('/')} class="btn btn-primary" data-testid="{testPrefix}-home-link">
								{$t('common.backToHome')}
							</a>
							<a href={resolve('/news')} class="btn btn-outline" data-testid="{testPrefix}-news-link">
								{$t('nav.news')}
							</a>
							<a href={resolve('/projects')} class="btn btn-outline" data-testid="{testPrefix}-projects-link">
								{$t('nav.projects')}
							</a>
						</div>
					{/if}
				</div>
			</div>
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="{testPrefix}-page-loading-container">
			<p data-testid="{testPrefix}-page-loading-status">{$t('common.loading')}</p>
		</div>
	{/if}
</section>

<PhotoLightbox
	images={activeLightboxImages}
	currentIndex={activeLightboxIndex}
	isOpen={isLightboxOpen}
	onclose={() => (isLightboxOpen = false)}
/>

<style>
	.back-nav {
		max-width: 1000px;
		margin: 0 auto 2rem;
	}
	.page-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.draft-actions {
		margin-top: 3rem;
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.page-body {
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.8;
		font-size: 1.1rem;
		color: var(--color-body-text);
	}
	.page-body.has-cover {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2.5rem;
		max-width: 1000px;
		align-items: start;
	}
	.page-cover {
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		aspect-ratio: 9 / 16;
		position: sticky;
		top: 120px;
	}
	.page-cover__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		cursor: pointer;
		transition: transform 0.3s ease;
	}
	.page-cover__img:hover {
		transform: scale(1.02);
	}
	/*
	 * Типографія `.prose` живе в `global.css` — і зображення, і таблиця, і
	 * заголовки. Тут була їхня копія; розбір і причина — у гейті
	 * `prose-ownership`.
	 *
	 * Курсор і підйом знімка на наведенні теж переїхали, але на МОДИФІКАТОР
	 * `.prose--zoomable`: обіцянку «знімок відкриється» виконує обробник нижче,
	 * і клас ставиться там, де цей обробник є.
	 */

	@media (max-width: 768px) {
		.back-nav {
			text-align: center;
		}

		.page-body.has-cover {
			grid-template-columns: 1fr;
		}

		.page-cover {
			max-width: 240px;
			margin: 0 auto;
			position: static;
		}
	}
</style>
