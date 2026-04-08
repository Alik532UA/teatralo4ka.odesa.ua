<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Departments from '$lib/components/Departments.svelte';
	import News from '$lib/components/News.svelte';
	import Wave from '$lib/components/Wave.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { getHomeSettings, DEFAULT_BLOCKS, type BlockConfig } from '$lib/services/settings';

	let blocks = $state<BlockConfig[]>(DEFAULT_BLOCKS.map(b => ({ ...b })));
	let blocksReady = $state(false);
	let showDepartments = $state(false);
	let departmentsRef: HTMLElement | null = $state(null);

	// Load block ordering from Firestore (public read, falls back to default silently)
	onMount(() => {
		getHomeSettings().then(settings => {
			if (settings?.blocks?.length) {
				blocks = [...settings.blocks].sort((a, b) => a.order - b.order);
			}
		}).catch(() => { /* fallback to DEFAULT_BLOCKS */ }).finally(() => {
			blocksReady = true;
		});
	});

	// Lazy-load Departments via IntersectionObserver — reactive to departmentsRef
	$effect(() => {
		const el = departmentsRef;
		if (!el) return;
		if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
			showDepartments = true;
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				showDepartments = true;
				observer.disconnect();
			}
		}, { rootMargin: '200px' });
		observer.observe(el);
		return () => observer.disconnect();
	});

	const galleryItems = $derived([
		{ src: `${base}/photo/013.jpg`, alt: 'School Life 1', title: $t('gallery.items.process') },
		{ src: `${base}/photo/035.jpg`, alt: 'School Life 2', title: $t('gallery.items.talents') },
		{ src: `${base}/photo/059.jpg`, alt: 'School Life 3', title: $t('gallery.items.atmosphere') },
		{ src: `${base}/photo/125.jpg`, alt: 'School Life 4', title: $t('gallery.items.evenings') },
		{ src: `${base}/photo/495.jpg`, alt: 'School Life 5', title: $t('gallery.items.virtuosos') },
		{ src: `${base}/photo/5.jpg`, alt: 'School Life 6', title: $t('gallery.items.harmony') },
	]);

	const visibleBlocks = $derived(blocks.filter(b => b.visible));
</script>

{#if blocksReady}
	{#each visibleBlocks as block (block.id)}
	{#if block.id === 'hero'}
		<ErrorBoundary>
			<Hero />
		</ErrorBoundary>

	{:else if block.id === 'news'}
		<ErrorBoundary>
			<News />
		</ErrorBoundary>

	{:else if block.id === 'departments'}
		<div bind:this={departmentsRef} class="lazy-section" data-testid="home-lazy-section">
			{#if showDepartments}
				<ErrorBoundary>
					<Departments />
				</ErrorBoundary>
			{:else}
				<div class="lazy-placeholder" data-testid="home-lazy-placeholder">
					{$t('common.loading')}
				</div>
			{/if}
		</div>

	{:else if block.id === 'gallery'}
		<section class="gallery-bento" id="gallery-bento" aria-labelledby="gallery-title" data-testid="gallery-section">
			<div class="container" data-testid="gallery-container">
				<div class="gallery-bento__header" data-testid="gallery-header-group">
					<h2 class="gallery-bento__title" id="gallery-title" data-testid="gallery-title-label">{$t('gallery.title')}</h2>
					<p class="gallery-bento__subtitle" data-testid="gallery-subtitle-label">{$t('gallery.subtitle')}</p>
				</div>

				<div class="g-bento-4x3" data-testid="gallery-grid">
					{#each galleryItems as img, i (img.src)}
						<div class="g-bento-4x3__item" data-testid="gallery-item-{i}">
							<img src={img.src} alt={img.alt} width="1200" height="900" loading="lazy" decoding="async" data-testid="gallery-img-{i}" />
							<div class="g-bento-4x3__overlay" data-testid="gallery-overlay-{i}">
								<span class="g-bento-4x3__caption" data-testid="gallery-caption-{i}">{img.title}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}
{/each}
{/if}

<style>
	.lazy-placeholder {
		height: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-light-blue);
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .lazy-placeholder {
		background: transparent;
	}

	.gallery-bento {
		background: var(--color-light-blue);
		padding: 4rem 0 6rem;
		overflow: hidden;
		position: relative;
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .gallery-bento {
		background: transparent;
	}

	.gallery-bento__header {
		margin-bottom: 4rem;
		text-align: center;
	}

	.gallery-bento__title {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-deep-ocean);
		margin-bottom: 1rem;
		text-transform: uppercase;
	}

	.gallery-bento__subtitle {
		font-size: 1.2rem;
		color: var(--color-body-text);
		opacity: 0.7;
	}

	.g-bento-4x3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.g-bento-4x3__item {
		position: relative;
		border-radius: 40px;
		overflow: hidden;
		box-shadow: 0 15px 30px rgba(0,0,0,0.08);
		cursor: pointer;
		aspect-ratio: 4 / 3;
	}

	.g-bento-4x3__item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.g-bento-4x3__item:hover img {
		transform: scale(1.08);
	}

	.g-bento-4x3__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, var(--theme-gallery-overlay-from), transparent 60%);
		display: flex;
		align-items: flex-end;
		padding: 2.5rem;
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.g-bento-4x3__item:hover .g-bento-4x3__overlay {
		opacity: 1;
	}

	.g-bento-4x3__caption {
		display: block;
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-white);
		transform: translateY(20px);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.g-bento-4x3__item:hover .g-bento-4x3__caption {
		transform: translateY(0);
	}

	@media (max-width: 1024px) {
		.g-bento-4x3 {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.gallery-bento__title {
			font-size: 2.2rem;
		}
		.g-bento-4x3 {
			grid-template-columns: repeat(2, 1fr);
			gap: 16px;
		}
		.g-bento-4x3__item {
			border-radius: 32px;
		}
	}

	@media (max-width: 480px) {
		.g-bento-4x3 {
			grid-template-columns: 1fr;
		}
	}
</style>
