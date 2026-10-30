<script lang="ts">
	import { locale } from 'svelte-i18n';
	import {
		type CrestConfig,
		type CrestPreset,
		CREST_PRESETS,
		isPresetActive
	} from '$lib/data/brandAssets/crestLayers';

	interface Props {
		config: CrestConfig;
		onApplyPreset: (preset: CrestPreset) => void;
		testIdPrefix?: string;
	}

	let { config, onApplyPreset, testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
</script>

<div class="presets-section" data-testid={`${testIdPrefix}-presets-section`}>
	<!-- 1. Presets Toolbar -->
	<div class="control-block">
		<span class="block-label">{isEn ? 'Presets:' : 'Пресети:'}</span>
		<div class="presets-row">
			{#each CREST_PRESETS as preset (preset.id)}
				<button
					type="button"
					class="preset-btn"
					class:active={isPresetActive(config, preset)}
					onclick={() => onApplyPreset(preset)}
					data-testid={`${testIdPrefix}-preset-${preset.id}-btn`}
				>
					{isEn ? preset.nameEn : preset.nameUk}
				</button>
			{/each}
		</div>
	</div>

	<!-- 2. Structure Toggles -->
	<div class="control-block">
		<span class="block-label">{isEn ? 'Structure Toggles:' : 'Конструкція:'}</span>
		<div class="toggles-row">
			<button
				type="button"
				class="toggle-chip"
				class:active={config.hasOval}
				onclick={() => (config.hasOval = !config.hasOval)}
				aria-pressed={config.hasOval}
				data-testid={`${testIdPrefix}-oval-toggle`}
			>
				<span class="toggle-indicator"></span>
				<span>{isEn ? 'Oval Background' : 'Овальний фон'}</span>
			</button>

			<button
				type="button"
				class="toggle-chip"
				class:active={config.hasText}
				onclick={() => (config.hasText = !config.hasText)}
				aria-pressed={config.hasText}
				data-testid={`${testIdPrefix}-text-toggle`}
			>
				<span class="toggle-indicator"></span>
				<span>{isEn ? 'Website URL Text' : 'Адреса сайту'}</span>
			</button>

			<button
				type="button"
				class="toggle-chip"
				class:active={config.hasHandsFill}
				onclick={() => (config.hasHandsFill = !config.hasHandsFill)}
				aria-pressed={config.hasHandsFill}
				data-testid={`${testIdPrefix}-hands-fill-toggle`}
			>
				<span class="toggle-indicator"></span>
				<span>{isEn ? 'Hands: Fill' : 'Заливка долонь'}</span>
			</button>

			<button
				type="button"
				class="toggle-chip"
				class:active={config.hasHandsContour}
				onclick={() => (config.hasHandsContour = !config.hasHandsContour)}
				aria-pressed={config.hasHandsContour}
				data-testid={`${testIdPrefix}-hands-contour-toggle`}
			>
				<span class="toggle-indicator"></span>
				<span>{isEn ? 'Hands: Contour' : 'Контур долонь'}</span>
			</button>

			<button
				type="button"
				class="toggle-chip"
				class:active={config.hasMasksFill}
				onclick={() => (config.hasMasksFill = !config.hasMasksFill)}
				aria-pressed={config.hasMasksFill}
				data-testid={`${testIdPrefix}-masks-fill-toggle`}
			>
				<span class="toggle-indicator"></span>
				<span>{isEn ? 'Masks: Fill' : 'Заливка масок'}</span>
			</button>
		</div>
	</div>
</div>

<style>
	.presets-section {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.control-block {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.block-label {
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.presets-row, .toggles-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.preset-btn {
		padding: 0.28rem 0.65rem;
		border-radius: 20px;
		font-size: 0.76rem;
		font-weight: 600;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.preset-btn:hover {
		border-color: var(--accent-text);
		color: var(--accent-text);
	}

	.preset-btn.active {
		border-color: var(--accent-text);
		background: rgba(0, 181, 236, 0.12);
		color: var(--accent-text);
		font-weight: 700;
	}

	.toggle-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.32rem 0.65rem;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 600;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toggle-indicator {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-border);
		transition: background-color 0.15s ease;
	}

	.toggle-chip.active {
		border-color: var(--accent-text);
		background: rgba(0, 181, 236, 0.08);
		color: var(--text-title);
	}

	.toggle-chip.active .toggle-indicator {
		background: var(--accent-text);
		box-shadow: 0 0 6px var(--accent-text);
	}
</style>
