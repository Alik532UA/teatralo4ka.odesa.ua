<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { DOMPURIFY_HTML_CONFIG } from '$lib/utils/markedConfig';
	import GalleryCarousel from '$lib/components/GalleryCarousel.svelte';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';
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

	function handleArticleClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target && target.tagName === 'IMG') {
			const img = target as HTMLImageElement;
			const article = img.closest('article, section, .page-content');
			if (!article) return;

			const allImgs = Array.from(article.querySelectorAll('.prose img, img.page-cover__img')) as HTMLImageElement[];
			if (allImgs.length === 0) return;

			const list: LightboxImage[] = allImgs.map(i => ({
				src: i.src,
				alt: i.alt,
				title: i.title || i.alt
			}));
			const clickedIdx = allImgs.indexOf(img);
			openLightbox(list, clickedIdx >= 0 ? clickedIdx : 0);
		}
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

		return () => { mql.removeEventListener('change', handler); };
	});

	const galleryImages = $derived([
		{ src: asset('/photo/IMG_1608.jpg'), alt: $t('about.gallery.edu'), title: $t('about.gallery.edu'), position: '0% center' },
		{ src: asset('/photo/IMG_1741.jpg'), alt: $t('about.gallery.workshop'), title: $t('about.gallery.workshop'), position: 'center 100%' },
		{ src: asset('/photo/IMG_1616.jpg'), alt: $t('about.gallery.musicians'), title: $t('about.gallery.musicians'), position: '10% center' },
		{ src: asset('/photo/IMG_3992.jpg'), alt: $t('about.gallery.stage'), title: $t('about.gallery.stage') },
		{ src: asset('/photo/IMG_6667.jpg'), alt: $t('about.gallery.event'), title: $t('about.gallery.event'), position: '20% center' },
		{ src: asset('/photo/IMG_4558.jpg'), alt: $t('about.gallery.talents'), title: $t('about.gallery.talents'), position: '20% center' },
		{ src: asset('/photo/IMG_4851.jpg'), alt: $t('about.gallery.festival'), title: $t('about.gallery.festival') },
		{ src: asset('/photo/IMG_4485.jpg'), alt: $t('about.gallery.lesson'), title: $t('about.gallery.lesson'), position: 'center 65%' },
		{ src: asset('/photo/IMG_6705.jpg'), alt: $t('about.gallery.atmosphere'), title: $t('about.gallery.atmosphere') },
		{ src: asset('/photo/IMG_6921.jpg'), alt: $t('about.gallery.virtuosos'), title: $t('about.gallery.virtuosos'), position: '70% center' },
	]);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<section class="page-content container" style="padding: var(--page-pad-top) 24px var(--page-pad-bottom);" data-testid="about-page-section" onclick={handleArticleClick}>
	{#if content}
		<article class="prose" style="margin-bottom: 4rem;" data-testid="about-page-article-section">
			<!-- Виняток за SECURITY-v8 § 5.3: markdown зі сторінок репозиторію,
			     пропущений через DOMPurify безпосередньо перед вставкою. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html DOMPurify.sanitize(content.html, DOMPURIFY_HTML_CONFIG)}
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="about-page-loading-container">
			<p data-testid="about-page-loading-label">{$t('common.loading')}</p>
		</div>
	{/if}

	{#if galleryConfig.defaultView === 'carousel'}
		<GalleryCarousel items={galleryImages} config={galleryConfig} testIdPrefix="about-gallery-carousel" />
	{:else}
		<div class="g-bento" data-testid="about-gallery-list">
			{#each galleryImages.slice(0, galleryConfig.maxItemsGrid > 0 ? galleryConfig.maxItemsGrid : galleryImages.length) as img, i (img.src)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div class="g-bento__item g-bento__item--{i}" data-testid="about-gallery-item-{i}" onclick={() => openLightbox(galleryImages, i)} role="button" tabindex="0">
					<img 
						src={img.src} 
						alt={img.alt} 
						width="1200" 
						height="900" 
						loading="lazy" 
						decoding="async" 
						style={img.position ? `object-position: ${img.position}` : ''}
						data-testid="about-gallery-img-{i}" 
					/>
					{#if galleryConfig.showCaptions}
						<div class="g-bento__overlay" data-testid="about-gallery-overlay-{i}">
							<span class="g-bento__caption" data-testid="about-gallery-caption-text-{i}">{img.title}</span>
						</div>
					{/if}
				</div>
			{/each}
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
	.prose :global(img) {
		cursor: pointer;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}
	.prose :global(img:hover) {
		transform: scale(1.015);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
	}

	.g-bento {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-auto-rows: 240px;
		gap: 24px;
	}
	.g-bento__item {
		position: relative;
		border-radius: 40px;
		overflow: hidden;
		box-shadow: 0 15px 35px rgba(0,0,0,0.05);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
		cursor: pointer;
	}
	.g-bento__item:hover {
		transform: translateY(-8px);
		box-shadow: 0 30px 60px rgba(0,0,0,0.12);
		z-index: 2;
	}
	.g-bento__item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.g-bento__item:hover img {
		transform: scale(1.08);
	}
	
	/* Adaptive Grid Spans */
	.g-bento__item--0 { grid-column: span 2; grid-row: span 2; }
	.g-bento__item--1 { grid-column: span 2; grid-row: span 1; }
	.g-bento__item--2 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--3 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--4 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--5 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--6 { grid-column: span 2; grid-row: span 1; }
	.g-bento__item--7 { grid-column: span 2; grid-row: span 1; }
	.g-bento__item--8 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--9 { grid-column: span 1; grid-row: span 1; }

	.g-bento__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, color-mix(in srgb, var(--text-title), transparent 15%), transparent 60%);
		display: flex;
		align-items: flex-end;
		padding: 2rem;
		opacity: 0;
		transition: opacity 0.4s ease;
	}
	.g-bento__item:hover .g-bento__overlay { opacity: 1; }
	.g-bento__caption {
		color: var(--color-white);
		font-family: var(--font-heading);
		font-size: 1.2rem;
		font-weight: 800;
		transform: translateY(20px);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.g-bento__item:hover .g-bento__caption { transform: translateY(0); }

	@media (max-width: 1024px) {
		.g-bento { grid-template-columns: repeat(2, 1fr); }
		/* Reset spans for tablet */
		.g-bento__item { grid-column: span 1 !important; grid-row: span 1 !important; }
		.g-bento__item--0 { grid-column: span 2 !important; grid-row: span 2 !important; }
	}

	@media (max-width: 640px) {
		.g-bento { grid-template-columns: 1fr; grid-auto-rows: 200px; }
		.g-bento__item { grid-column: span 1 !important; grid-row: span 1 !important; border-radius: 32px; }
	}
</style>
