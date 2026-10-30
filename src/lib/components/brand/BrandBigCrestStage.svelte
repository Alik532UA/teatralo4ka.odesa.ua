<script lang="ts">
	import { locale } from 'svelte-i18n';
	import {
		type CrestConfig,
		getCrestSvgString
	} from '$lib/data/brandAssets/crestLayers';

	interface Props {
		config: CrestConfig;
		testIdPrefix?: string;
	}

	let { config, testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
	let stageTheme = $state<'checker' | 'white' | 'dark'>('checker');

	const svgDataUrl = $derived(
		'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(getCrestSvgString(config))
	);
</script>

<div class="stage-container" data-testid={`${testIdPrefix}-stage-container`}>
	<div class="stage-toolbar">
		<span class="stage-title">{isEn ? 'Preview Stage' : 'Попередній перегляд'}</span>
		<div class="stage-theme-switch" role="group" aria-label={isEn ? 'Preview Background' : 'Тло перегляду'}>
			<button
				type="button"
				class="theme-btn"
				class:active={stageTheme === 'checker'}
				onclick={() => (stageTheme = 'checker')}
				title={isEn ? 'Transparent checkerboard' : 'Прозора шахматка'}
				data-testid={`${testIdPrefix}-stage-theme-checker-btn`}
			>
				<span class="theme-chip theme-chip--checker" aria-hidden="true"></span>
				<span class="theme-text">{isEn ? 'Grid' : 'Шахматка'}</span>
			</button>
			<button
				type="button"
				class="theme-btn"
				class:active={stageTheme === 'white'}
				onclick={() => (stageTheme = 'white')}
				title={isEn ? 'Solid white' : 'Біле тло'}
				data-testid={`${testIdPrefix}-stage-theme-white-btn`}
			>
				<span class="theme-chip theme-chip--white" aria-hidden="true"></span>
				<span class="theme-text">{isEn ? 'White' : 'Біле'}</span>
			</button>
			<button
				type="button"
				class="theme-btn"
				class:active={stageTheme === 'dark'}
				onclick={() => (stageTheme = 'dark')}
				title={isEn ? 'Solid dark' : 'Темне тло'}
				data-testid={`${testIdPrefix}-stage-theme-dark-btn`}
			>
				<span class="theme-chip theme-chip--dark" aria-hidden="true"></span>
				<span class="theme-text">{isEn ? 'Dark' : 'Темне'}</span>
			</button>
		</div>
	</div>

	<div
		class="stage-canvas"
		class:stage-canvas--checker={stageTheme === 'checker'}
		class:stage-canvas--white={stageTheme === 'white'}
		class:stage-canvas--dark={stageTheme === 'dark'}
		data-testid={`${testIdPrefix}-stage-canvas-panel`}
	>
		<img
			src={svgDataUrl}
			alt={isEn ? 'Crest in hands preview' : 'Попередній перегляд герба у долоньках'}
			width="540"
			height="360"
			class="crest-svg"
		/>
	</div>
</div>

<style>
	.stage-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		border-radius: 14px;
		overflow: hidden;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.stage-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.stage-title {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.stage-theme-switch {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2px;
	}

	.theme-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.22rem 0.5rem;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.74rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.theme-btn.active {
		background: var(--color-surface);
		color: var(--text-title);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.theme-chip {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.15);
	}

	.theme-chip--checker {
		background-image: repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%);
		background-size: 6px 6px;
	}

	.theme-chip--white {
		background: #ffffff;
	}

	.theme-chip--dark {
		background: #1d1d1d;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.stage-canvas {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1.25rem, 3.5vw, 2.75rem);
		min-height: 320px;
		transition: background-color 0.2s ease;
	}

	.stage-canvas--checker {
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 16px 16px;
	}

	.stage-canvas--white {
		background-color: #ffffff;
	}

	.stage-canvas--dark {
		background-color: #141518;
	}

	.crest-svg {
		max-width: min(540px, 100%);
		max-height: 380px;
		width: 100%;
		height: auto;
		display: block;
		filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.08));
	}
</style>
