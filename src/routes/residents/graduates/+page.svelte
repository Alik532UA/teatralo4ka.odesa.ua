<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { DOMPURIFY_HTML_CONFIG } from '$lib/utils/markedConfig';
	import type { PageContent } from '$lib/i18n/types';
	import GraduateGalaxy from '$lib/components/GraduateGalaxy.svelte';
	import ProsePeopleLinks from '$lib/components/ProsePeopleLinks.svelte';
	import { openGraduateModal } from '$lib/services/graduateModal.svelte';
	import type { GraduateIndexEntry } from '$lib/data/graduates';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: { uk: PageContent | null; en: PageContent | null } } = $props();

	let content = $derived($locale === 'en' ? data.en : data.uk);

	let activeLightboxImages = $state<LightboxImage[]>([]);
	let activeLightboxIndex = $state(0);
	let isLightboxOpen = $state(false);

	onMount(() => {
		function handleClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (target && target.tagName === 'IMG' && target.closest('.prose')) {
				const article = target.closest('article');
				if (!article) return;

				const allImgs = Array.from(
					article.querySelectorAll('.prose img:not(.person-face)')
				) as HTMLImageElement[];
				if (allImgs.length === 0) return;

				activeLightboxImages = allImgs.map((i) => ({
					src: i.src,
					alt: i.alt,
					title: i.title || i.alt
				}));
				const clickedIdx = allImgs.indexOf(target as HTMLImageElement);
				activeLightboxIndex = clickedIdx >= 0 ? clickedIdx : 0;
				isLightboxOpen = true;
			}
		}
		window.addEventListener('click', handleClick);
		return () => window.removeEventListener('click', handleClick);
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

	function handleGraduateSelect(graduate: GraduateIndexEntry) {
		openGraduateModal(graduate);
	}
</script>

<div class="graduates-stage" data-testid="residents-graduates-page-section">
	<!-- Зіркове поле та випускники на фоні, як у галактиці випускників -->
	<div class="graduates-bg" aria-hidden="true">
		<GraduateGalaxy onselect={handleGraduateSelect} />
		<div class="graduates-bg__overlay"></div>
	</div>

	<!-- Основне вікно за взірцем update=open -->
	<div class="graduates-container">
		<div class="graduates-card" data-testid="residents-graduates-page-card">
			{#if content}
				<article
					class="prose prose--zoomable graduates-prose"
					data-testid="residents-graduates-page-article-section"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html DOMPurify.sanitize(content.html, DOMPURIFY_HTML_CONFIG)}
				</article>
			{/if}
		</div>
	</div>
</div>

<ProsePeopleLinks within=".graduates-prose" />

<PhotoLightbox
	images={activeLightboxImages}
	currentIndex={activeLightboxIndex}
	isOpen={isLightboxOpen}
	onclose={() => (isLightboxOpen = false)}
/>

<style>
	.graduates-stage {
		position: relative;
		min-height: calc(100dvh - var(--header-height, 80px) - var(--footer-height, 80px));
		background: var(--galaxy-bg, #050a1f);
	}

	.graduates-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: auto;
		overflow: hidden;
	}

	.graduates-bg__overlay {
		position: absolute;
		inset: 0;
		background: rgb(3 6 20 / 0.62);
		backdrop-filter: blur(2px);
		pointer-events: none;
	}

	.graduates-container {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: clamp(2rem, 5vw, 4rem) 1.25rem;
		min-height: calc(100dvh - var(--header-height, 80px) - var(--footer-height, 80px));
	}

	.graduates-card {
		position: relative;
		width: min(880px, 100%);
		margin-block: auto;
		background: var(--galaxy-card-bg, #0b1330);
		border: var(--hairline-width) solid rgb(140 190 255 / 0.22);
		border-radius: 1.5rem;
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.55);
		padding: clamp(1.5rem, 4vw, 3rem);
		color: var(--galaxy-text, #eaf2ff);
	}

	:global(.graduates-prose) {
		color: var(--galaxy-text, #eaf2ff);
	}

	:global(.graduates-prose h1),
	:global(.graduates-prose h2),
	:global(.graduates-prose h3) {
		color: #ffffff;
	}

	:global(.graduates-prose h1) {
		margin-top: 0;
		text-align: center;
	}

	:global(.graduates-prose strong) {
		color: #ffffff;
	}

	:global(.graduates-prose hr) {
		border-color: rgb(140 190 255 / 0.2);
	}

	:global(.graduates-prose a:not(.btn):not(.btn-galaxy-cta)) {
		color: var(--galaxy-accent, #8cc4ff);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.graduates-prose a:not(.btn):not(.btn-galaxy-cta):hover) {
		color: #ffffff;
	}

	:global(.graduates-prose .btn.btn-outline) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.6rem 1.6rem;
		border-radius: var(--radius-full, 9999px);
		border: 1.5px solid rgb(140 190 255 / 0.4);
		background: rgb(255 255 255 / 0.05);
		color: var(--galaxy-text, #eaf2ff);
		font-family: var(--font-heading);
		font-weight: 600;
		transition: all 0.2s ease;
	}

	:global(.graduates-prose .btn.btn-outline:hover) {
		background: rgb(140 190 255 / 0.2);
		border-color: rgb(140 190 255 / 0.7);
		color: #ffffff;
		transform: scale(1.02);
	}
</style>
