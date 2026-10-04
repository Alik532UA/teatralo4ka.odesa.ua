<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Download } from 'lucide-svelte';
	import { BIG_EMBLEM_VARIANTS } from '$lib/data/brandAssets';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');

	let bigYear = $state<'2025' | '2022'>('2025');
	let bigColor = $state<'color' | 'white' | 'outline'>('color');
	let bigBg = $state<boolean>(true);
	let bigHands = $state<'color' | 'outline'>('color');

	const yearOptions = $derived([
		{ value: '2025' as const, label: isEn ? '2025 (with URL)' : '2025 (з адресою)' },
		{ value: '2022' as const, label: isEn ? '2022 (classic)' : '2022 (класичний)' }
	]);
	const colorOptions = $derived([
		{ value: 'color' as const, label: isEn ? 'Color' : 'Кольоровий' },
		{ value: 'white' as const, label: isEn ? 'White' : 'Білий' },
		{ value: 'outline' as const, label: isEn ? 'Outline' : 'Контурний' }
	]);
	const bgOptions = $derived([
		{ value: false, label: isEn ? 'Transparent' : 'Прозорий' },
		{ value: true, label: isEn ? 'With Oval Bg' : 'З фоном' }
	]);

	const activeBigEmblem = $derived.by(() => {
		const matches = BIG_EMBLEM_VARIANTS.filter(
			(v) => v.year === bigYear && v.colorScheme === bigColor
		);

		let found = matches.find((v) => {
			if (v.hasBg !== bigBg) return false;
			if (bigYear === '2022' && v.handsType !== (bigColor === 'outline' ? 'outline' : bigHands)) {
				return false;
			}
			return true;
		});

		if (found) return found;
		return matches[0] ?? BIG_EMBLEM_VARIANTS[0];
	});
</script>

<div class="interactive-creator">
	<!-- Control Toolbar -->
	<div class="creator-toolbar">
		<div class="toolbar-group">
			<span class="group-label">{isEn ? 'Edition:' : 'Версія:'}</span>
			<div class="toggle-switch">
				{#each yearOptions as opt (opt.value)}
					<button
						type="button"
						class="toggle-btn"
						class:active={bigYear === opt.value}
						onclick={() => (bigYear = opt.value)}
						data-testid={`${testIdPrefix}-year-${opt.value}-toggle`}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="toolbar-group">
			<span class="group-label">{isEn ? 'Color:' : 'Колір:'}</span>
			<div class="toggle-switch">
				{#each colorOptions as opt (opt.value)}
					<button
						type="button"
						class="toggle-btn"
						class:active={bigColor === opt.value}
						onclick={() => (bigColor = opt.value)}
						data-testid={`${testIdPrefix}-color-${opt.value}-toggle`}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="toolbar-group">
			<span class="group-label">{isEn ? 'Background:' : 'Овальний фон:'}</span>
			<div class="toggle-switch">
				{#each bgOptions as opt (opt.value)}
					<button
						type="button"
						class="toggle-btn"
						class:active={bigBg === opt.value}
						onclick={() => (bigBg = opt.value)}
						data-testid={`${testIdPrefix}-bg-${opt.value}-toggle`}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		{#if bigYear === '2022' && bigColor !== 'outline'}
			<div class="toolbar-group">
				<span class="group-label">{isEn ? 'Hands:' : 'Руки:'}</span>
				<div class="toggle-switch">
					<button
						type="button"
						class="toggle-btn"
						class:active={bigHands === 'color'}
						onclick={() => (bigHands = 'color')}
						data-testid={`${testIdPrefix}-hands-color-toggle`}
					>
						{bigColor === 'color' ? (isEn ? 'Yellow' : 'Жовті') : (isEn ? 'White' : 'Білі')}
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:active={bigHands === 'outline'}
						onclick={() => (bigHands = 'outline')}
						data-testid={`${testIdPrefix}-hands-outline-toggle`}
					>
						{isEn ? 'Outline' : 'Контурні'}
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Visual Preview Stage with Default Checkerboard -->
	<div class="big-preview-stage">
		<img
			src={asset(activeBigEmblem.previewUrl)}
			alt={isEn ? activeBigEmblem.nameEn : activeBigEmblem.nameUk}
			width="540"
			height="360"
			class="big-emblem-img"
			loading="lazy"
		/>
	</div>

	<!-- Active Big Emblem Download Footer -->
	<div class="showcase-meta">
		<div class="meta-desc">
			<strong class="meta-title">
				{isEn ? activeBigEmblem.nameEn : activeBigEmblem.nameUk}
			</strong>
		</div>

		<div class="dl-buttons-row">
			{#if activeBigEmblem.svgFile}
				<a
					href={asset(activeBigEmblem.svgFile)}
					download={activeBigEmblem.svgFile.split('/').pop()}
					class="dl-btn dl-btn--svg"
					data-testid={`${testIdPrefix}-dl-svg-${activeBigEmblem.id}-btn`}
				>
					<Download size={14} aria-hidden="true" />
					<span>SVG</span>
				</a>
			{/if}
			<a
				href={asset(activeBigEmblem.fullFile)}
				download={activeBigEmblem.downloadName}
				class="dl-btn dl-btn--png"
				data-testid={`${testIdPrefix}-dl-png-${activeBigEmblem.id}-btn`}
			>
				<Download size={14} aria-hidden="true" />
				<span>PNG <span class="btn-res">({activeBigEmblem.resolution})</span></span>
			</a>
		</div>
	</div>
</div>

<style>
	.interactive-creator {
		border: 1px solid var(--color-border);
		border-radius: 16px;
		overflow: hidden;
		background: var(--color-surface);
	}

	.big-preview-stage {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 16px 16px;
		position: relative;
		border-bottom: 1px solid var(--color-border);
		padding: clamp(2rem, 4vw, 3.5rem);
		min-height: 320px;
	}

	.big-emblem-img {
		max-width: min(540px, 100%);
		max-height: 360px;
		height: auto;
		display: block;
		object-fit: contain;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.06));
	}

	.showcase-meta {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem;
	}

	.meta-desc {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-title {
		font-size: 1.05rem;
		color: var(--text-title);
	}

	.dl-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.48rem 0.85rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 700;
		text-decoration: none;
		transition: filter 0.15s ease, transform 0.15s ease;
		white-space: nowrap;
	}

	.btn-res {
		font-size: 0.72rem;
		font-weight: 500;
		opacity: 0.9;
	}

	.dl-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.dl-buttons-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.dl-btn--png {
		background: var(--palette-blue);
		color: var(--palette-black);
	}

	.dl-btn--svg {
		background: rgba(0, 181, 236, 0.14);
		color: var(--accent-text);
		border: 1px solid rgba(0, 181, 236, 0.3);
	}

	.creator-toolbar {
		padding: 1.2rem 1.5rem;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.25rem;
	}

	.toolbar-group {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.group-label {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.toggle-switch {
		display: inline-flex;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.2rem;
		border-radius: 8px;
		gap: 0.2rem;
	}

	.toggle-btn {
		border: none;
		background: transparent;
		padding: 0.3rem 0.65rem;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-muted);
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.toggle-btn.active {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}
</style>
