<script lang="ts">
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import { ArrowLeft, Drama } from 'lucide-svelte';
	import UartManifest from '$lib/components/uart/UartManifest.svelte';
	import UartShowcase from '$lib/components/uart/UartShowcase.svelte';

	const isEn = $derived($locale === 'en');

	$effect(() => {
		seo.update({
			title: isEn
				? `«UArt» Educational Theatre - ${$t('seo.brandTitle')}`
				: `Навчальний театр «UArt» - ${$t('seo.brandTitle')}`,
			description: isEn
				? '«UArt» Educational Theatre of Odesa Theatre School: You&Art — You and Art! UA — our Ukrainian roots. Young Repertoire Theatre.'
				: 'Навчальний театр «UArt» Одеської театральної школи: You&Art — Ти і Мистецтво! UA — наше коріння. Юний Репертуарний Театр.'
		});
	});
</script>

<div class="uart-page" data-testid="uart-section">
	<div class="container uart-page__container">
		<header class="uart-header">
			<a href={resolve('/projects')} class="back-link" data-testid="uart-back-link">
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('projects.allProjects')}</span>
			</a>

			<div class="uart-header__badge">
				<Drama size={15} aria-hidden="true" />
				<span>{isEn ? 'Educational Theatre' : 'Навчальний театр'}</span>
			</div>

			<h1 class="uart-header__title" data-testid="uart-page-title">
				{isEn ? '«UArt» Educational Theatre' : 'Навчальний театр «UArt»'}
			</h1>
			<p class="uart-header__lead">
				{isEn
					? 'A living creative space where stage education grows into true repertoire theatrical art.'
					: 'Живий творчий простір, де навчання переростає у справжнє репертуарне сценічне мистецтво.'}
			</p>
		</header>

		<UartManifest />
		<UartShowcase />
	</div>
</div>

<style>
	.uart-page {
		padding: 2.5rem 1rem 5rem;
		min-height: calc(100dvh - 80px);
		background: var(--bg-page);
		color: var(--text-main);
	}

	.uart-page__container {
		max-width: 1160px;
		margin: 0 auto;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--accent-text);
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 4px;
		transition: opacity 0.2s ease;
		margin-bottom: 1.5rem;
	}

	.back-link:hover {
		opacity: 0.8;
	}

	.uart-header {
		margin-bottom: 3.5rem;
	}

	.uart-header__badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
		color: var(--accent-text);
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.uart-header__title {
		font-size: clamp(2.2rem, 5vw, 3.5rem);
		font-weight: 800;
		line-height: 1.15;
		color: var(--text-title);
		margin: 0 0 1rem;
		letter-spacing: -0.02em;
	}

	.uart-header__lead {
		font-size: 1.2rem;
		line-height: 1.6;
		max-width: 720px;
		color: var(--text-muted);
		margin: 0;
	}

	@media (max-width: 600px) {
		.uart-page {
			padding: 1.5rem 0.75rem 3.5rem;
		}

		.uart-header {
			margin-bottom: 2rem;
		}
	}
</style>
