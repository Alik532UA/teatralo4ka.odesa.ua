<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, Palette } from 'lucide-svelte';
	import BrandColors from '$lib/components/brand/BrandColors.svelte';
	import BrandTypography from '$lib/components/brand/BrandTypography.svelte';
	import BrandLogos from '$lib/components/brand/BrandLogos.svelte';
	import BrandParticles from '$lib/components/brand/BrandParticles.svelte';
	import BrandAiRemakes from '$lib/components/brand/BrandAiRemakes.svelte';
	import BrandToc from '$lib/components/brand/BrandToc.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `BrandBook - Visual Identity - ${$t('seo.brandTitle')}`
				: `Брендбук - Фірмовий стиль школи - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Official brand identity guidelines of Odesa Children’s Theatre School: colors, e-Ukraine font, logo usage, and graphic assets.'
				: 'Офіційний брендбук та гайдлайн візуального стилю Одеської дитячої театральної школи: кольори (#ffed00, #00b5ec, #e20413, #f9b31d, #1d1d1d), шрифт e-Ukraine та логотипи.'
		});
	});
</script>

<div class="brandbook-page" data-testid="brandbook-section">
	<div class="container brandbook-page__container">
		<header class="brandbook-page__header">
			<a href={resolve('/projects')} class="back-link" data-testid="brandbook-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('projects.allProjects')}</span>
			</a>

			<div class="brandbook-page__content">
				<div class="header-badge">
					<Palette size={14} aria-hidden="true" />
					<span>{isEn ? 'Brand Guidelines' : 'Фірмовий стиль та айдентика'}</span>
				</div>
				<h1 class="header-title" data-testid="brandbook-title">
					{isEn ? 'BrandBook & Style Guide' : 'Брендбук Одеської театральної школи'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Visual identity constants, official color palette, e-Ukraine typography, logos, and graphic assets.'
						: 'Константи візуального стилю, офіційна колірна палітра, типографіка e-Ukraine, правила використання логотипа та фірмові графічні елементи.'}
				</p>
			</div>
		</header>

		<div class="brandbook-layout">
			<BrandToc testIdPrefix="brandbook-toc" />

			<div class="brandbook-sections">
				<section id="logos" class="brand-section">
					<BrandLogos testIdPrefix="brandbook-logos" />
				</section>

				<section id="colors" class="brand-section">
					<BrandColors testIdPrefix="brandbook-colors" />
				</section>

				<section id="typography" class="brand-section">
					<BrandTypography testIdPrefix="brandbook-type" />
				</section>

				<section id="particles" class="brand-section">
					<BrandParticles testIdPrefix="brandbook-particles" />
				</section>

				<section id="ai-styles" class="brand-section">
					<BrandAiRemakes testIdPrefix="brandbook-ai" />
				</section>
			</div>
		</div>
	</div>
</div>

<style>
	.brandbook-page {
		padding: var(--page-pad-top, 140px) 0 var(--page-pad-bottom, 80px);
		min-height: 85dvh;
	}

	.brandbook-page__container {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		min-width: 0;
		max-width: 100%;
	}

	.brandbook-page__header {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
	}

	.brandbook-page__content {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
		text-decoration: none;
		transition: color 0.15s ease;
		width: fit-content;
	}

	.back-link:hover {
		color: var(--accent-text, #00b5ec);
	}

	.header-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(0, 181, 236, 0.12);
		color: var(--accent-text);
		border: 1px solid rgba(0, 181, 236, 0.25);
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 0.75rem;
		width: fit-content;
	}

	.header-title {
		margin: 0 0 0.75rem;
		font-size: clamp(2rem, 3.5vw, 2.6rem);
		font-weight: 800;
		color: var(--text-title);
		line-height: 1.15;
		word-break: break-word;
	}

	.header-lead {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.6;
		color: var(--text-main);
		max-width: 760px;
	}

	.brandbook-layout {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr);
		gap: 2.5rem;
		align-items: start;
		min-width: 0;
		max-width: 100%;
	}

	.brandbook-sections {
		display: flex;
		flex-direction: column;
		gap: 3rem;
		min-width: 0;
		max-width: 100%;
	}

	.brand-section {
		width: 100%;
		min-width: 0;
		max-width: 100%;
	}

	@media (max-width: 900px) {
		.brandbook-page {
			padding: calc(var(--header-height, 72px) + 0.5rem) 0 var(--page-pad-bottom, 40px);
		}

		.brandbook-page__container {
			gap: 1.25rem;
			padding-left: clamp(0.5rem, 2vw, 0.75rem);
			padding-right: clamp(0.5rem, 2vw, 0.75rem);
		}

		.brandbook-layout {
			grid-template-columns: minmax(0, 1fr);
			gap: 1rem;
		}

		.brandbook-sections {
			gap: 1.5rem;
		}

		.header-title {
			font-size: clamp(1.5rem, 5vw, 2rem);
		}

		.header-lead {
			font-size: 0.95rem;
		}
	}
</style>
