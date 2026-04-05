<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { seo } from '$lib/services/seo.svelte';

	let { data } = $props();

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

	const galleryImages = $derived([
		{ src: `${base}/photo/IMG_1608.jpg`, alt: 'School Photo 1', title: $t('about.gallery.edu') },
		{ src: `${base}/photo/IMG_1616.jpg`, alt: 'School Photo 3', title: $t('about.gallery.musicians') },
		{ src: `${base}/photo/IMG_1741.jpg`, alt: 'School Photo 2', title: $t('about.gallery.workshop') },
		{ src: `${base}/photo/IMG_3992.jpg`, alt: 'School Photo 4', title: $t('about.gallery.stage') },
		{ src: `${base}/photo/IMG_4485.jpg`, alt: 'School Photo 5', title: $t('about.gallery.lesson') },
		{ src: `${base}/photo/IMG_4558.jpg`, alt: 'School Photo 6', title: $t('about.gallery.talents') },
		{ src: `${base}/photo/IMG_4851.jpg`, alt: 'School Photo 7', title: $t('about.gallery.festival') },
		{ src: `${base}/photo/IMG_6667.jpg`, alt: 'School Photo 8', title: $t('about.gallery.event') },
	]);
</script>

<section class="page-content container" style="padding: 160px 24px 6rem;">
	{#if content}
		<article class="prose" style="margin-bottom: 4rem;">
			{@html content.html}
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;">
			<p>Завантаження...</p>
		</div>
	{/if}

	<div class="g-bento">
		{#each galleryImages as img, i}
			<div class="g-bento__item g-bento__item--{i}">
				<img src={img.src} alt={img.alt} width="1200" height="900" loading="lazy" decoding="async" />
				<div class="g-bento__overlay">
					<span class="g-bento__caption">{img.title}</span>
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
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
	.g-bento__item--4 { grid-column: span 2; grid-row: span 1; }
	.g-bento__item--5 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--6 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--7 { grid-column: span 2; grid-row: span 1; }

	.g-bento__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0,95,174,0.85), transparent 60%);
		display: flex;
		align-items: flex-end;
		padding: 2rem;
		opacity: 0;
		transition: opacity 0.4s ease;
	}
	.g-bento__item:hover .g-bento__overlay { opacity: 1; }
	.g-bento__caption {
		color: white;
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
