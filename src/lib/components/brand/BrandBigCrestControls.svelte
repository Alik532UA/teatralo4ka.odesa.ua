<script lang="ts">
	import { locale } from 'svelte-i18n';
	import {
		type CrestConfig,
		type CrestPreset,
		type CrestElement,
		type CrestSubPart,
		isColorDark
	} from '$lib/data/brandAssets/crestLayers';
	import BrandBigCrestPresets from './BrandBigCrestPresets.svelte';
	import BrandBigCrestPalette from './BrandBigCrestPalette.svelte';

	interface Props {
		config: CrestConfig;
		onApplyPreset: (preset: CrestPreset) => void;
		testIdPrefix?: string;
	}

	let { config, onApplyPreset, testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
	let activeElement = $state<CrestElement>('maskRed');
	let activeSubPart = $state<CrestSubPart>('fill');

	$effect(() => {
		if (activeElement === 'bgOval' && !config.hasOval) {
			activeElement = 'maskRed';
		} else if (activeElement === 'text' && !config.hasText) {
			activeElement = 'maskRed';
		}
	});

	const hasOutlineOption = $derived(
		activeElement === 'maskRed' ||
		activeElement === 'maskBlue' ||
		(activeElement === 'hands' && config.handsType === 'fill')
	);

	const currentColor = $derived.by(() => {
		if (activeElement === 'bgOval') return config.ovalColor;
		if (activeElement === 'text') return config.textColor;
		if (activeElement === 'hands') {
			return activeSubPart === 'outline' || config.handsType !== 'fill'
				? config.handsContourColor
				: config.handsColor;
		}
		if (activeElement === 'maskRed') {
			return activeSubPart === 'outline' ? config.maskRedOutlineColor : config.maskRedColor;
		}
		return activeSubPart === 'outline' ? config.maskBlueOutlineColor : config.maskBlueColor;
	});

	function setColor(hex: string) {
		if (activeElement === 'bgOval') {
			config.ovalColor = hex;
		} else if (activeElement === 'text') {
			config.textColor = hex;
		} else if (activeElement === 'hands') {
			if (activeSubPart === 'outline' || config.handsType !== 'fill') {
				config.handsContourColor = hex;
			} else {
				config.handsColor = hex;
			}
		} else if (activeElement === 'maskRed') {
			if (activeSubPart === 'outline') {
				config.maskRedOutlineColor = hex;
			} else {
				config.maskRedColor = hex;
				if (isColorDark(hex) && config.maskRedOutlineColor.toLowerCase() === '#1d1d1d') {
					config.maskRedOutlineColor = '#ffffff';
				} else if (!isColorDark(hex) && config.maskRedOutlineColor.toLowerCase() === '#ffffff') {
					config.maskRedOutlineColor = '#1d1d1d';
				}
			}
		} else if (activeElement === 'maskBlue') {
			if (activeSubPart === 'outline') {
				config.maskBlueOutlineColor = hex;
			} else {
				config.maskBlueColor = hex;
				if (isColorDark(hex) && config.maskBlueOutlineColor.toLowerCase() === '#1d1d1d') {
					config.maskBlueOutlineColor = '#ffffff';
				} else if (!isColorDark(hex) && config.maskBlueOutlineColor.toLowerCase() === '#ffffff') {
					config.maskBlueOutlineColor = '#1d1d1d';
				}
			}
		}
	}
</script>

<div class="controls-panel" data-testid={`${testIdPrefix}-controls-panel`}>
	<!-- 1 & 2. Presets and Structure Toggles -->
	<BrandBigCrestPresets {config} {onApplyPreset} {testIdPrefix} />

	<!-- 3. Target Element Selector Tabs -->
	<div class="control-block">
		<span class="block-label">{isEn ? 'Select Element:' : 'Оберіть елемент:'}</span>
		<div class="element-tabs" role="tablist">
			{#if config.hasOval}
				<button
					type="button"
					role="tab"
					class="element-tab"
					class:active={activeElement === 'bgOval'}
					aria-selected={activeElement === 'bgOval'}
					onclick={() => { activeElement = 'bgOval'; activeSubPart = 'fill'; }}
					data-testid={`${testIdPrefix}-tab-oval`}
				>
					<span class="color-dot" style="background-color: {config.ovalColor};"></span>
					<span>{isEn ? 'Oval' : 'Овал'}</span>
				</button>
			{/if}

			<button
				type="button"
				role="tab"
				class="element-tab"
				class:active={activeElement === 'hands'}
				aria-selected={activeElement === 'hands'}
				onclick={() => (activeElement = 'hands')}
				data-testid={`${testIdPrefix}-tab-hands`}
			>
				<span class="color-dot" style="background-color: {config.handsType === 'fill' ? config.handsColor : config.handsContourColor};"></span>
				<span>{isEn ? 'Hands' : 'Долоні'}</span>
			</button>

			<button
				type="button"
				role="tab"
				class="element-tab"
				class:active={activeElement === 'maskRed'}
				aria-selected={activeElement === 'maskRed'}
				onclick={() => (activeElement = 'maskRed')}
				data-testid={`${testIdPrefix}-tab-mask-red`}
			>
				<span class="color-dot" style="background-color: {config.maskRedColor};"></span>
				<span>{isEn ? 'Left Mask' : 'Ліва маска'}</span>
			</button>

			<button
				type="button"
				role="tab"
				class="element-tab"
				class:active={activeElement === 'maskBlue'}
				aria-selected={activeElement === 'maskBlue'}
				onclick={() => (activeElement = 'maskBlue')}
				data-testid={`${testIdPrefix}-tab-mask-blue`}
			>
				<span class="color-dot" style="background-color: {config.maskBlueColor};"></span>
				<span>{isEn ? 'Right Mask' : 'Права маска'}</span>
			</button>

			{#if config.hasText}
				<button
					type="button"
					role="tab"
					class="element-tab"
					class:active={activeElement === 'text'}
					aria-selected={activeElement === 'text'}
					onclick={() => { activeElement = 'text'; activeSubPart = 'fill'; }}
					data-testid={`${testIdPrefix}-tab-text`}
				>
					<span class="color-dot" style="background-color: {config.textColor};"></span>
					<span>{isEn ? 'URL Text' : 'Текст'}</span>
				</button>
			{/if}
		</div>

		<!-- Sub-part Selector: Fill vs Outline/Contour -->
		{#if hasOutlineOption}
			<div class="subpart-row" role="radiogroup" aria-label={isEn ? 'Part' : 'Частина елемента'}>
				<button
					type="button"
					class="subpart-btn"
					class:active={activeSubPart === 'fill'}
					onclick={() => (activeSubPart = 'fill')}
					data-testid={`${testIdPrefix}-subpart-fill-btn`}
				>
					<span class="color-dot" style="background-color: {activeElement === 'hands' ? config.handsColor : activeElement === 'maskRed' ? config.maskRedColor : config.maskBlueColor};"></span>
					<span>{isEn ? 'Element Fill' : 'Заливка елемента'}</span>
				</button>
				<button
					type="button"
					class="subpart-btn"
					class:active={activeSubPart === 'outline'}
					onclick={() => (activeSubPart = 'outline')}
					data-testid={`${testIdPrefix}-subpart-outline-btn`}
				>
					<span class="color-dot" style="background-color: {activeElement === 'hands' ? config.handsContourColor : activeElement === 'maskRed' ? config.maskRedOutlineColor : config.maskBlueOutlineColor};"></span>
					<span>{isEn ? 'Outline / Contour' : 'Обводка / Контур'}</span>
				</button>
			</div>
		{/if}
	</div>

	<!-- 4. Palette & Custom Color Picker Component -->
	<BrandBigCrestPalette {currentColor} onColorChange={setColor} {testIdPrefix} />
</div>

<style>
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		height: 100%;
		border-radius: 14px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
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

	.element-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.element-tab, .subpart-btn {
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

	.element-tab.active, .subpart-btn.active {
		border-color: var(--accent-text);
		background: var(--color-surface);
		color: var(--text-title);
		box-shadow: 0 0 0 1px var(--accent-text);
	}

	.subpart-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.25rem;
		padding: 0.35rem 0.5rem;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.03);
		border: 1px dashed var(--color-border);
	}

	.subpart-btn {
		background: transparent;
		border: 1px solid transparent;
		font-size: 0.74rem;
	}

	.subpart-btn.active {
		background: var(--bg-card);
		border-color: var(--accent-text);
	}

	.color-dot {
		display: inline-block;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.2);
		flex-shrink: 0;
	}
</style>
