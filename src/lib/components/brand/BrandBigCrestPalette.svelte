<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { BRAND_PALETTE } from '$lib/data/brandAssets/crestLayers';

	interface Props {
		currentColor: string;
		isTransparent?: boolean;
		canBeTransparent?: boolean;
		onColorChange: (hex: string) => void;
		onToggleTransparent?: () => void;
		testIdPrefix?: string;
	}

	let {
		currentColor,
		isTransparent = false,
		canBeTransparent = true,
		onColorChange,
		onToggleTransparent,
		testIdPrefix = 'brand-logos'
	}: Props = $props();

	const isEn = $derived($locale === 'en');

	function handleHexInput(val: string) {
		const clean = val.trim();
		if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
			onColorChange(clean);
		}
	}
</script>

<div class="palette-section" data-testid={`${testIdPrefix}-palette-section`}>
	<span class="block-label">{isEn ? 'Color Palette:' : 'Палітра кольорів:'}</span>
	<div class="palette-grid">
		{#if canBeTransparent}
			<button
				type="button"
				class="swatch-btn swatch-transparent"
				class:active={isTransparent}
				onclick={() => onToggleTransparent?.()}
				title={isEn ? 'Transparent (Disabled)' : 'Прозорий (Вимкнено)'}
				aria-label={isEn ? 'Transparent' : 'Прозорий'}
				data-testid={`${testIdPrefix}-swatch-transparent-btn`}
			>
				<span class="transparent-icon">⊘</span>
			</button>
		{/if}

		{#each BRAND_PALETTE as col (col.hex)}
			<button
				type="button"
				class="swatch-btn"
				class:active={!isTransparent && currentColor.toLowerCase() === col.hex.toLowerCase()}
				style="background-color: {col.hex};"
				onclick={() => onColorChange(col.hex)}
				title={`${isEn ? col.nameEn : col.nameUk} (${col.hex})`}
				aria-label={`${isEn ? col.nameEn : col.nameUk} ${col.hex}`}
				data-testid={`${testIdPrefix}-swatch-${col.hex.replace('#', '')}-btn`}
			>
				{#if !isTransparent && currentColor.toLowerCase() === col.hex.toLowerCase()}
					<span class="swatch-check" style="color: {col.textColor};">✓</span>
				{/if}
			</button>
		{/each}

		<div class="custom-picker-wrap">
			<label class="color-picker-label" title={isEn ? 'Custom Color Picker' : 'Власний колір'}>
				<input
					type="color"
					value={currentColor}
					oninput={(e) => onColorChange(e.currentTarget.value)}
					class="native-color-input"
					data-testid={`${testIdPrefix}-native-color-input`}
				/>
			</label>
			<div class="hex-input-box">
				<input
					type="text"
					value={currentColor}
					oninput={(e) => handleHexInput(e.currentTarget.value)}
					maxlength={7}
					placeholder="#000000"
					class="hex-text-input"
					aria-label={isEn ? 'HEX Color Code' : 'HEX код кольору'}
					data-testid={`${testIdPrefix}-hex-text-input`}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.palette-section {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.block-label {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.palette-grid {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.swatch-btn {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.1s ease, border-color 0.15s ease;
		position: relative;
	}

	.swatch-btn:hover {
		transform: scale(1.1);
		border-color: var(--text-title);
	}

	.swatch-btn.active {
		border-color: var(--accent-text);
		box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 4px var(--accent-text);
	}

	.swatch-transparent {
		background-image: repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%);
		background-size: 8px 8px;
		color: #e20413;
	}

	.transparent-icon {
		font-size: 1.15rem;
		font-weight: 800;
		line-height: 1;
		color: #e20413;
	}

	.swatch-check {
		font-size: 0.9rem;
		font-weight: 800;
		line-height: 1;
	}

	.custom-picker-wrap {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-left: 0.25rem;
	}

	.color-picker-label {
		display: inline-block;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid var(--color-border);
		cursor: pointer;
		position: relative;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
	}

	.native-color-input {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	.hex-input-box {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.hex-text-input {
		width: 88px;
		padding: 0.38rem 0.55rem;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--bg-card);
		color: var(--text-main);
		font-family: monospace;
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.hex-text-input:focus {
		outline: none;
		border-color: var(--accent-text);
		box-shadow: 0 0 0 2px rgba(0, 181, 236, 0.2);
	}
</style>
