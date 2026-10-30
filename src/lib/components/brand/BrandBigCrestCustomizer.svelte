<script lang="ts">
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { Download, RotateCcw, Loader2 } from 'lucide-svelte';
	import {
		type CrestConfig,
		type CrestPreset,
		DEFAULT_CREST_CONFIG,
		getCrestSvgString,
		getCrestViewBox
	} from '$lib/data/brandAssets/crestLayers';
	import BrandBigCrestStage from './BrandBigCrestStage.svelte';
	import BrandBigCrestControls from './BrandBigCrestControls.svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
	let config = $state<CrestConfig>({ ...DEFAULT_CREST_CONFIG });
	let isExportingPng = $state(false);

	function applyPreset(preset: CrestPreset) {
		config = { ...preset.config };
	}

	function resetConfig() {
		config = { ...DEFAULT_CREST_CONFIG };
	}

	function downloadSvg() {
		const svgString = getCrestSvgString(config);
		const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'teatralo4ka-crest-custom.svg';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	async function downloadPng() {
		if (!browser) return;
		isExportingPng = true;

		try {
			const vb = getCrestViewBox(config);
			const targetWidth = 3500;
			const targetHeight = Math.round(targetWidth * (vb.height / vb.width));

			const canvas = document.createElement('canvas');
			canvas.width = targetWidth;
			canvas.height = targetHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			const svgString = getCrestSvgString(config);
			const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
			const url = URL.createObjectURL(svgBlob);
			const img = new Image();

			await new Promise<void>((resolve, reject) => {
				img.onload = () => {
					ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
					URL.revokeObjectURL(url);
					resolve();
				};
				img.onerror = reject;
				img.src = url;
			});

			canvas.toBlob((pngBlob) => {
				if (!pngBlob) return;
				const pngUrl = URL.createObjectURL(pngBlob);
				const link = document.createElement('a');
				link.href = pngUrl;
				link.download = `teatralo4ka-crest-custom-${targetWidth}px.png`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(pngUrl);
			}, 'image/png');
		} catch {
			// ignore export errors
		} finally {
			isExportingPng = false;
		}
	}
</script>

<div class="customizer-wrapper" data-testid={`${testIdPrefix}-crest-customizer-card`}>
	<div class="customizer-grid">
		<div class="customizer-col stage-col">
			<BrandBigCrestStage {config} {testIdPrefix} />
		</div>
		<div class="customizer-col controls-col">
			<BrandBigCrestControls {config} onApplyPreset={applyPreset} {testIdPrefix} />
		</div>
	</div>

	<!-- Customizer Action Footer -->
	<div class="customizer-actions">
		<div class="actions-hint">
			<span class="hint-title">
				{isEn ? 'Vector & Ultra-HD Raster Export' : 'Векторний та Ultra-HD растровий експорт'}
			</span>
			<span class="hint-subtitle">
				{isEn
					? 'Download clean SVG vector or 3500px transparent PNG.'
					: 'Завантажуйте чистий векторний SVG або чіткий PNG 3500px з прозорістю.'}
			</span>
		</div>

		<div class="action-buttons">
			<button
				type="button"
				class="action-btn action-btn--reset"
				onclick={resetConfig}
				title={isEn ? 'Reset to default colors' : 'Скинути до стандартних кольорів'}
				data-testid={`${testIdPrefix}-reset-btn`}
			>
				<RotateCcw size={14} aria-hidden="true" />
				<span>{isEn ? 'Reset' : 'Скинути'}</span>
			</button>

			<div class="buttons-separator" aria-hidden="true"></div>

			<button
				type="button"
				class="action-btn action-btn--svg"
				onclick={downloadSvg}
				title={isEn ? 'Download clean vector SVG' : 'Завантажити чистий векторний SVG'}
				data-testid={`${testIdPrefix}-download-svg-btn`}
			>
				<Download size={14} aria-hidden="true" />
				<span>SVG</span>
			</button>

			<button
				type="button"
				class="action-btn action-btn--png"
				onclick={downloadPng}
				disabled={isExportingPng}
				title={isEn ? 'Download high-resolution PNG (3500px)' : 'Завантажити PNG високої чіткості (3500px)'}
				data-testid={`${testIdPrefix}-download-png-btn`}
			>
				{#if isExportingPng}
					<Loader2 size={14} class="spin" aria-hidden="true" />
					<span>{isEn ? 'Generating...' : 'Створення...'}</span>
				{:else}
					<Download size={14} aria-hidden="true" />
					<span>PNG (3500px)</span>
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.customizer-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		border-radius: 16px;
		background: transparent;
	}

	.customizer-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
		gap: 1.25rem;
		align-items: stretch;
	}

	.customizer-col {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.customizer-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 12px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.actions-hint {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.hint-title {
		font-size: 0.86rem;
		font-weight: 700;
		color: var(--text-title);
	}

	.hint-subtitle {
		font-size: 0.76rem;
		color: var(--text-muted);
	}

	.action-buttons {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.55rem;
	}

	.buttons-separator {
		width: 1px;
		height: 22px;
		background: var(--color-border);
		margin: 0 0.15rem;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.48rem 0.95rem;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
		border: 1px solid var(--color-border);
		background: var(--bg-card);
		color: var(--text-main);
	}

	.action-btn:hover {
		border-color: var(--accent-text);
		color: var(--accent-text);
	}

	.action-btn--reset {
		background: transparent;
		color: var(--text-muted);
	}

	.action-btn--reset:hover {
		color: var(--text-title);
		border-color: var(--text-title);
		background: rgba(0, 0, 0, 0.04);
	}

	.action-btn--svg {
		border-color: #e20413;
		background: #e20413;
		color: #ffffff;
		box-shadow: 0 2px 6px rgba(226, 4, 19, 0.25);
	}

	.action-btn--svg:hover {
		background: #c80310;
		border-color: #c80310;
		color: #ffffff;
		transform: translateY(-1px);
	}

	.action-btn--png {
		border-color: #00b5ec;
		background: #00b5ec;
		color: #141518;
		box-shadow: 0 2px 6px rgba(0, 181, 236, 0.25);
	}

	.action-btn--png:hover:not(:disabled) {
		background: #009ecc;
		border-color: #009ecc;
		color: #141518;
		transform: translateY(-1px);
	}

	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
