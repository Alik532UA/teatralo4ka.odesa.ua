<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Sparkles, Download, Archive } from 'lucide-svelte';
	import { brandGridTheme } from '$lib/services/brandGridTheme.svelte';
	import { MINI_ICONS } from '$lib/data/brandAssets';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-particles' }: Props = $props();

	const isEn = $derived($locale === 'en');
</script>

<div
	class="brand-particles-card"
	class:theme--dark-grid={brandGridTheme.current === 'dark'}
	data-testid={`${testIdPrefix}-card`}
>
	<div class="particles-header-row">
		<div class="particles-info">
			<div class="particles-header">
				<Sparkles size={18} aria-hidden="true" />
				<h3 class="particles-title">
					{isEn ? 'Branded Micro-Particles (Mini-Icons)' : 'Фірмові мікро-частки (Mini-Icons)'}
				</h3>
			</div>
			<p class="particles-desc">
				{isEn
					? 'Vector and high-resolution raster graphic assets for posters, certificates, diplomas, social media templates, and animations.'
					: 'Векторні (SVG) та растрові (PNG) мікроелементи айдентики для оформлення дипломів, афіш, соцмереж та анімацій.'}
			</p>
		</div>

		<a
			href={asset('/miniIcon/teatralo4ka-mini-icons.zip')}
			download="teatralo4ka-mini-icons.zip"
			class="dl-zip-btn"
			title={isEn ? 'Download all icons as ZIP' : 'Завантажити всі іконки архівом ZIP'}
			data-testid={`${testIdPrefix}-download-all-btn`}
		>
			<Archive size={15} aria-hidden="true" />
			<span>{isEn ? 'All Icons (ZIP)' : 'Усі частки (ZIP)'}</span>
		</a>
	</div>

	<div class="particles-grid" data-testid={`${testIdPrefix}-list`}>
		{#each MINI_ICONS as icon (icon.id)}
			<div class="particle-card" data-testid={`${testIdPrefix}-item-${icon.code}`}>
				<div class="particle-visual" title={isEn ? icon.nameEn : icon.nameUk}>
					<img
						src={asset(icon.svgFile)}
						alt={isEn ? icon.nameEn : icon.nameUk}
						width="128"
						height="128"
						class="particle-img"
						loading="lazy"
					/>
				</div>

				<div class="particle-meta">
					<span class="particle-code">#{icon.code}</span>
					<span class="particle-name" title={isEn ? icon.nameEn : icon.nameUk}>
						{isEn ? icon.nameEn : icon.nameUk}
					</span>
				</div>

				<div class="particle-actions">
					<a
						href={asset(icon.svgFile)}
						download={`t4-mini-icon-${icon.code}.svg`}
						class="pill-btn pill-btn--svg"
						title={isEn ? `Download SVG #${icon.code}` : `Завантажити SVG #${icon.code}`}
						data-testid={`${testIdPrefix}-dl-svg-${icon.code}-btn`}
					>
						<Download size={11} aria-hidden="true" />
						<span>SVG</span>
					</a>
					<a
						href={asset(icon.pngFile)}
						download={`t4-mini-icon-${icon.code}.png`}
						class="pill-btn pill-btn--png"
						title={isEn ? `Download PNG #${icon.code}` : `Завантажити PNG #${icon.code}`}
						data-testid={`${testIdPrefix}-dl-png-${icon.code}-btn`}
					>
						<Download size={11} aria-hidden="true" />
						<span>PNG</span>
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.brand-particles-card {
		--checker-c1: #ffffff;
		--checker-c2: #e5e7eb;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
		min-width: 0;
		max-width: 100%;
		box-sizing: border-box;
	}

	@media (max-width: 768px) {
		.brand-particles-card {
			background: transparent;
			border: none;
			border-radius: 0;
			padding: 0;
			box-shadow: none;
		}
	}

	.brand-particles-card.theme--dark-grid {
		--checker-c1: #23252a;
		--checker-c2: #141518;
	}

	.particles-header-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.particles-info {
		max-width: 720px;
	}

	.particles-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--palette-orange);
		margin-bottom: 0.35rem;
	}

	.particles-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-title);
	}

	.particles-desc {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.55;
		color: var(--text-muted);
	}

	.dl-zip-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.5rem 0.9rem;
		border-radius: 10px;
		background: var(--accent-primary, #00b5ec);
		color: var(--text-on-accent, #ffffff);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 700;
		transition: filter 0.15s ease, transform 0.15s ease;
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.dl-zip-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.particles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(130px, 100%), 1fr));
		gap: 0.9rem;
	}

	@media (min-width: 900px) {
		.particles-grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	.particle-card {
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 0.75rem 0.6rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--color-surface, #ffffff);
		transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.particle-card:hover {
		transform: translateY(-2px);
		border-color: var(--accent-text, #00b5ec);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
	}

	.particle-visual {
		width: 100%;
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1);
		background-image: repeating-conic-gradient(var(--checker-c2) 0% 25%, var(--checker-c1) 0% 50%);
		background-position: 0 0;
		background-size: 10px 10px;
		border-radius: 10px;
		margin-bottom: 0.5rem;
		padding: 2.5%;
		box-sizing: border-box;
	}

	.particle-img {
		width: 95%;
		height: 95%;
		object-fit: contain;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
	}

	.particle-meta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		text-align: center;
		width: 100%;
		margin-bottom: 0.5rem;
	}

	.particle-code {
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--accent-text, #00b5ec);
	}

	.particle-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-title);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.particle-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		width: 100%;
	}

	.pill-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		padding: 0.22rem 0.45rem;
		border-radius: 6px;
		font-size: 0.72rem;
		font-weight: 700;
		text-decoration: none;
		transition: background-color 0.15s ease, color 0.15s ease;
		flex: 1;
		min-width: 0;
	}

	.pill-btn--svg {
		background: rgba(0, 181, 236, 0.12);
		color: var(--accent-text, #00b5ec);
		border: 1px solid rgba(0, 181, 236, 0.25);
	}

	.pill-btn--svg:hover {
		background: var(--accent-primary, #00b5ec);
		color: var(--text-on-accent, #ffffff);
	}

	.pill-btn--png {
		background: rgba(249, 179, 29, 0.15);
		color: var(--palette-orange, #f9b31d);
		border: 1px solid rgba(249, 179, 29, 0.3);
	}

	.pill-btn--png:hover {
		background: var(--palette-orange, #f9b31d);
		color: #1d1d1d;
	}
</style>
