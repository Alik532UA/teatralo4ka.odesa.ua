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
	let activeElement = $state<CrestElement>('hands');
	let activeSubPart = $state<CrestSubPart>('fill');

	const isCurrentTransparent = $derived.by(() => {
		if (activeElement === 'bgOval') return !config.hasOval;
		if (activeElement === 'text') return !config.hasText;
		if (activeElement === 'hands') {
			return activeSubPart === 'fill' ? !config.hasHandsFill : !config.hasHandsContour;
		}
		return activeSubPart === 'fill' ? !config.hasMasksFill : false;
	});

	const canCurrentBeTransparent = $derived(
		!(activeElement !== 'bgOval' && activeElement !== 'text' && activeElement !== 'hands' && activeSubPart === 'outline')
	);

	const currentColor = $derived.by(() => {
		if (activeElement === 'bgOval') return config.ovalColor;
		if (activeElement === 'text') return config.textColor;
		if (activeElement === 'hands') {
			return activeSubPart === 'fill' ? config.handsColor : config.handsContourColor;
		}
		if (activeElement === 'maskRed') {
			return activeSubPart === 'fill' ? config.maskRedColor : config.maskRedOutlineColor;
		}
		return activeSubPart === 'fill' ? config.maskBlueColor : config.maskBlueOutlineColor;
	});

	function toggleTransparent() {
		if (activeElement === 'bgOval') config.hasOval = !config.hasOval;
		else if (activeElement === 'text') config.hasText = !config.hasText;
		else if (activeElement === 'hands') {
			if (activeSubPart === 'fill') config.hasHandsFill = !config.hasHandsFill;
			else config.hasHandsContour = !config.hasHandsContour;
		} else if (activeSubPart === 'fill') config.hasMasksFill = !config.hasMasksFill;
	}

	function setColor(hex: string) {
		if (activeElement === 'bgOval') {
			config.hasOval = true;
			config.ovalColor = hex;
		} else if (activeElement === 'text') {
			config.hasText = true;
			config.textColor = hex;
		} else if (activeElement === 'hands') {
			if (activeSubPart === 'fill') {
				config.hasHandsFill = true;
				config.handsColor = hex;
			} else {
				config.hasHandsContour = true;
				config.handsContourColor = hex;
			}
		} else {
			const isRed = activeElement === 'maskRed';
			if (activeSubPart === 'fill') {
				config.hasMasksFill = true;
				if (isRed) config.maskRedColor = hex;
				else config.maskBlueColor = hex;
				const outProp = isRed ? 'maskRedOutlineColor' : 'maskBlueOutlineColor';
				if (isColorDark(hex) && config[outProp].toLowerCase() === '#1d1d1d') config[outProp] = '#ffffff';
				else if (!isColorDark(hex) && config[outProp].toLowerCase() === '#ffffff') config[outProp] = '#1d1d1d';
			} else {
				if (isRed) config.maskRedOutlineColor = hex;
				else config.maskBlueOutlineColor = hex;
			}
		}
	}

	const tabs = $derived([
		{
			id: 'bgOval' as CrestElement,
			label: isEn ? 'Oval' : 'Овал',
			isTrans: !config.hasOval,
			color: config.ovalColor,
			testId: `${testIdPrefix}-oval-tab`
		},
		{
			id: 'hands' as CrestElement,
			label: isEn ? 'Hands' : 'Долоні',
			isTrans: !config.hasHandsFill && !config.hasHandsContour,
			color: config.hasHandsFill ? config.handsColor : config.handsContourColor,
			testId: `${testIdPrefix}-hands-tab`
		},
		{
			id: 'maskRed' as CrestElement,
			label: isEn ? 'Left Mask' : 'Ліва маска',
			isTrans: !config.hasMasksFill,
			color: config.maskRedColor,
			testId: `${testIdPrefix}-mask-red-tab`
		},
		{
			id: 'maskBlue' as CrestElement,
			label: isEn ? 'Right Mask' : 'Права маска',
			isTrans: !config.hasMasksFill,
			color: config.maskBlueColor,
			testId: `${testIdPrefix}-mask-blue-tab`
		},
		{
			id: 'text' as CrestElement,
			label: isEn ? 'URL Text' : 'Текст',
			isTrans: !config.hasText,
			color: config.textColor,
			testId: `${testIdPrefix}-text-tab`
		}
	]);

	const subparts = $derived([
		{
			id: 'fill' as CrestSubPart,
			label: isEn ? 'Fill' : 'Заливка',
			isTrans: activeElement === 'hands' ? !config.hasHandsFill : !config.hasMasksFill,
			color: activeElement === 'hands' ? config.handsColor : activeElement === 'maskRed' ? config.maskRedColor : config.maskBlueColor,
			testId: `${testIdPrefix}-subpart-fill-btn`
		},
		{
			id: 'outline' as CrestSubPart,
			label: activeElement === 'hands' ? (isEn ? 'Contour' : 'Контур') : (isEn ? 'Outline' : 'Обводка'),
			isTrans: activeElement === 'hands' ? !config.hasHandsContour : false,
			color: activeElement === 'hands' ? config.handsContourColor : activeElement === 'maskRed' ? config.maskRedOutlineColor : config.maskBlueOutlineColor,
			testId: `${testIdPrefix}-subpart-outline-btn`
		}
	]);
</script>

<div class="controls-panel" data-testid={`${testIdPrefix}-controls-panel`}>
	<BrandBigCrestPresets {config} {onApplyPreset} {testIdPrefix} />

	<div class="control-block">
		<span class="block-label">{isEn ? 'Select Element:' : 'Оберіть елемент:'}</span>
		<div class="element-tabs" role="tablist">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					role="tab"
					class="element-tab"
					class:active={activeElement === tab.id}
					aria-selected={activeElement === tab.id}
					onclick={() => { activeElement = tab.id; if (tab.id === 'bgOval' || tab.id === 'text') activeSubPart = 'fill'; }}
					data-testid={tab.testId}
				>
					<span
						class="color-dot"
						class:color-dot--transparent={tab.isTrans}
						style="background-color: {tab.isTrans ? 'transparent' : tab.color};"
					></span>
					<span>{tab.label}</span>
				</button>
			{/each}
		</div>

		{#if activeElement === 'hands' || activeElement === 'maskRed' || activeElement === 'maskBlue'}
			<div class="subpart-row" role="radiogroup" aria-label={isEn ? 'Part' : 'Частина елемента'}>
				{#each subparts as sp (sp.id)}
					<button
						type="button"
						class="subpart-btn"
						class:active={activeSubPart === sp.id}
						onclick={() => (activeSubPart = sp.id)}
						data-testid={sp.testId}
					>
						<span
							class="color-dot"
							class:color-dot--transparent={sp.isTrans}
							style="background-color: {sp.isTrans ? 'transparent' : sp.color};"
						></span>
						<span>{sp.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<BrandBigCrestPalette
		{currentColor}
		isTransparent={isCurrentTransparent}
		canBeTransparent={canCurrentBeTransparent}
		onColorChange={setColor}
		onToggleTransparent={toggleTransparent}
		{testIdPrefix}
	/>
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

	.color-dot--transparent {
		background-image: repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%) !important;
		background-size: 6px 6px !important;
		position: relative;
	}

	.color-dot--transparent::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1.5px;
		background: #e20413;
		transform: rotate(-45deg);
	}
</style>
