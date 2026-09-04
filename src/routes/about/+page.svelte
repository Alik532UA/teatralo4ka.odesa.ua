<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { asset, resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { DOMPURIFY_HTML_CONFIG } from '$lib/utils/markedConfig';
	import { FileText, ArrowRight } from 'lucide-svelte';
	import GalleryCarousel from '$lib/components/GalleryCarousel.svelte';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';
	import PhotoBentoGallery from '$lib/components/PhotoBentoGallery.svelte';
	import { getAboutPageSettings, getCachedAboutPageSettings, DEFAULT_GALLERY_WIDGET_ABOUT, DEFAULT_GALLERY_WIDGET_ABOUT_MOBILE, type GalleryWidgetConfig } from '$lib/services/settings';

	let { data } = $props();

	let activeLightboxImages = $state<LightboxImage[]>([]);
	let activeLightboxIndex = $state(0);
	let isLightboxOpen = $state(false);

	function openLightbox(images: LightboxImage[], index: number) {
		activeLightboxImages = images;
		activeLightboxIndex = index;
		isLightboxOpen = true;
	}

	let content = $derived($locale === 'en' ? data.en : data.uk);

	$effect(() => {
		if (content) {
			seo.update({
				title: content.metadata.seo.title,
				description: content.metadata.seo.description,
				ogImage: content.metadata.seo.ogImage
			});
		}
	});

	let isMobile = $state(browser ? window.matchMedia('(max-width: 1024px)').matches : false);
	const cachedAbout = browser ? getCachedAboutPageSettings() : null;

	function pickGalleryWidget(desktop?: GalleryWidgetConfig, mobile?: GalleryWidgetConfig): GalleryWidgetConfig {
		if (isMobile) return mobile ?? { ...DEFAULT_GALLERY_WIDGET_ABOUT_MOBILE };
		return desktop ?? { ...DEFAULT_GALLERY_WIDGET_ABOUT };
	}

	let galleryConfig = $state<GalleryWidgetConfig>(pickGalleryWidget(cachedAbout?.galleryWidget, cachedAbout?.mobileGalleryWidget));

	// Keep galleryConfig in sync with isMobile changes
	let aboutSettings = $state<{ galleryWidget?: GalleryWidgetConfig; mobileGalleryWidget?: GalleryWidgetConfig } | null>(cachedAbout);

	$effect(() => {
		if (aboutSettings) {
			galleryConfig = pickGalleryWidget(aboutSettings.galleryWidget, aboutSettings.mobileGalleryWidget);
		}
	});

	onMount(() => {
		const mql = window.matchMedia('(max-width: 1024px)');
		const handler = (e: MediaQueryListEvent) => { isMobile = e.matches; };
		mql.addEventListener('change', handler);

		getAboutPageSettings().then(settings => {
			if (settings) {
				aboutSettings = settings;
			}
		}).catch(() => {});

		function handleDocClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (target && target.tagName === 'IMG' && target.closest('.prose')) {
				const article = target.closest('article, section, .page-content');
				if (!article) return;

				const allImgs = Array.from(article.querySelectorAll('.prose img')) as HTMLImageElement[];
				if (allImgs.length === 0) return;

				const list: LightboxImage[] = allImgs.map(i => ({
					src: i.src,
					alt: i.alt,
					title: i.title || i.alt
				}));
				const clickedIdx = allImgs.indexOf(target as HTMLImageElement);
				openLightbox(list, clickedIdx >= 0 ? clickedIdx : 0);
			}
		}
		window.addEventListener('click', handleDocClick);

		return () => {
			mql.removeEventListener('change', handler);
			window.removeEventListener('click', handleDocClick);
		};
	});

	const galleryImages = $derived([
		{ src: asset('/photo/IMG_1608.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default'), position: '0% center' },
		{ src: asset('/photo/IMG_1741.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default'), position: 'center 100%' },
		{ src: asset('/photo/IMG_1616.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default'), position: '10% center' },
		{ src: asset('/photo/IMG_3992.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default') },
		{ src: asset('/photo/IMG_6667.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default'), position: '20% center' },
		{ src: asset('/photo/IMG_4558.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default'), position: '20% center' },
		{ src: asset('/photo/IMG_4851.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default') },
		{ src: asset('/photo/IMG_4485.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default'), position: 'center 65%' },
		{ src: asset('/photo/IMG_6705.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default') },
		{ src: asset('/photo/IMG_6921.jpg'), alt: $t('about.gallery.default'), title: $t('about.gallery.default'), position: '70% center' },
	]);
</script>

<section class="page-content container" style="padding: var(--page-pad-top) 24px var(--page-pad-bottom);" data-testid="about-page-section">
	{#if content}
		<article class="prose" style="margin-bottom: 2.5rem;" data-testid="about-page-article-section">
			<!-- Виняток за SECURITY-v8 § 5.3: markdown зі сторінок репозиторію,
			     пропущений через DOMPurify безпосередньо перед вставкою. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html DOMPurify.sanitize(content.html, DOMPURIFY_HTML_CONFIG)}
		</article>

		<div class="about-docs-card" data-testid="about-documents-banner">
			<div class="about-docs-card__content">
				<div class="about-docs-card__icon-wrap">
					<FileText size={24} />
				</div>
				<div class="about-docs-card__text">
					<h3 class="about-docs-card__title">{$t('about.documentsLink')}</h3>
					<p class="about-docs-card__desc">{$t('about.documentsLinkDesc')}</p>
				</div>
			</div>
			<a href={resolve('/documents')} class="btn btn-outline about-docs-card__btn" data-testid="about-documents-link">
				<span>{$t('documents.view')}</span>
				<ArrowRight size={16} />
			</a>
		</div>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="about-page-loading-container">
			<p data-testid="about-page-loading-status">{$t('common.loading')}</p>
		</div>
	{/if}

	{#if galleryConfig.defaultView === 'carousel'}
		<GalleryCarousel items={galleryImages} config={galleryConfig} testIdPrefix="about-gallery-carousel" />
	{:else}
		<PhotoBentoGallery
			items={galleryImages.slice(0, galleryConfig.maxItemsGrid > 0 ? galleryConfig.maxItemsGrid : galleryImages.length)}
			testIdPrefix="about-gallery"
			showCaptions={galleryConfig.showCaptions}
			onpick={(i) => openLightbox(galleryImages, i)}
		/>
	{/if}
</section>

<PhotoLightbox
	images={activeLightboxImages}
	currentIndex={activeLightboxIndex}
	isOpen={isLightboxOpen}
	onclose={() => (isLightboxOpen = false)}
/>

<style>
	.prose :global(img) {
		cursor: pointer;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}
	.prose :global(img:hover) {
		transform: scale(1.015);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
	}

	.about-docs-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1.25rem 1.75rem;
		background: var(--bg-surface, rgba(255, 255, 255, 0.05));
		border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border-main, rgba(255, 255, 255, 0.15)));
		border-radius: 20px;
		margin-bottom: 3.5rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
		transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
	}

	.about-docs-card:hover {
		transform: translateY(-2px);
		border-color: var(--accent-primary);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
	}

	.about-docs-card__content {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.about-docs-card__icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		min-width: 48px;
		border-radius: 14px;
		background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
		color: var(--accent-primary);
	}

	.about-docs-card__text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.about-docs-card__title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.15rem;
		color: var(--text-title);
	}

	.about-docs-card__desc {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.about-docs-card__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 600;
		border-radius: 9999px;
		text-decoration: none;
		white-space: nowrap;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.about-docs-card {
			flex-direction: column;
			align-items: stretch;
			padding: 1.25rem;
			gap: 1rem;
		}

		.about-docs-card__btn {
			justify-content: center;
		}
	}
</style>
