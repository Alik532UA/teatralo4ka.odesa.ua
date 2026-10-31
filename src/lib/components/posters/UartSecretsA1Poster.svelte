<script lang="ts">
	import UartA1Variant1 from './uart-a1/UartA1Variant1.svelte';
	import UartA1Variant2 from './uart-a1/UartA1Variant2.svelte';
	import UartA1Variant3 from './uart-a1/UartA1Variant3.svelte';
	import { LayoutTemplate, Sparkles, Printer } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'uart-dark' }: Props = $props();

	type VariantKey = 'variant1' | 'variant2' | 'variant3';
	let activeVariant = $state<VariantKey>('variant1');

	type SchoolLogoVariant = 'crest' | 'logo2026';
	let schoolLogoVariant = $state<SchoolLogoVariant>('crest');

	function toggleSchoolLogo() {
		schoolLogoVariant = schoolLogoVariant === 'crest' ? 'logo2026' : 'crest';
	}

	const isLight = $derived(themeId === 'uart-light');
</script>

<div class="a1-poster-container" data-testid="uart-a1-poster-container">
	<!-- Внутрішня панель перемикання 3 варіантів афіші A1 -->
	<div class="a1-toolbar" data-testid="uart-a1-toolbar">
		<div class="variant-tabs" role="tablist" aria-label={isEn ? 'A1 Poster layout variants' : 'Варіанти макета афіші A1'}>
			<button
				type="button"
				role="tab"
				aria-selected={activeVariant === 'variant1'}
				class="var-tab-btn"
				class:var-tab-btn--active={activeVariant === 'variant1'}
				onclick={() => (activeVariant = 'variant1')}
				data-testid="uart-a1-variant1-btn"
			>
				<LayoutTemplate size={14} aria-hidden="true" />
				<span>{isEn ? '1: Classic Theatre' : '1: Театральний класичний'}</span>
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={activeVariant === 'variant2'}
				class="var-tab-btn"
				class:var-tab-btn--active={activeVariant === 'variant2'}
				onclick={() => (activeVariant = 'variant2')}
				data-testid="uart-a1-variant2-btn"
			>
				<Sparkles size={14} aria-hidden="true" />
				<span>{isEn ? '2: Cinema Panorama' : '2: Кіно-панорама'}</span>
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={activeVariant === 'variant3'}
				class="var-tab-btn"
				class:var-tab-btn--active={activeVariant === 'variant3'}
				onclick={() => (activeVariant = 'variant3')}
				data-testid="uart-a1-variant3-btn"
			>
				<LayoutTemplate size={14} aria-hidden="true" />
				<span>{isEn ? '3: Avant-Garde' : '3: Авангардний модерн'}</span>
			</button>
		</div>

		<div class="toolbar-side">
			<div class="logo-toggle-wrap">
				<span class="logo-toggle-label">{isEn ? 'Logo:' : 'Лого:'}</span>
				<div class="logo-btn-group">
					<button
						type="button"
						class="logo-opt-btn"
						class:logo-opt-btn--active={schoolLogoVariant === 'crest'}
						onclick={() => (schoolLogoVariant = 'crest')}
						data-testid="uart-a1-logo-crest-btn"
					>
						{isEn ? 'Crest' : 'Герб'}
					</button>
					<button
						type="button"
						class="logo-opt-btn"
						class:logo-opt-btn--active={schoolLogoVariant === 'logo2026'}
						onclick={() => (schoolLogoVariant = 'logo2026')}
						data-testid="uart-a1-logo-2026-btn"
					>
						{isEn ? '2026' : '2026'}
					</button>
				</div>
			</div>

			<div class="a1-badge-hint">
				<Printer size={13} aria-hidden="true" />
				<span>{isEn ? 'A1 (594 × 841 mm) · 1 page' : 'A1 (594 × 841 мм) · 1 сторона'}</span>
			</div>
		</div>
	</div>

	<!-- Робоче поле постера формату A1 (вертикальне) -->
	<div class="a1-poster-frame">
		{#if activeVariant === 'variant1'}
			<UartA1Variant1 {isEn} {isLight} {schoolLogoVariant} onToggleLogo={toggleSchoolLogo} />
		{:else if activeVariant === 'variant2'}
			<UartA1Variant2 {isEn} {isLight} {schoolLogoVariant} onToggleLogo={toggleSchoolLogo} />
		{:else}
			<UartA1Variant3 {isEn} {isLight} {schoolLogoVariant} onToggleLogo={toggleSchoolLogo} />
		{/if}
	</div>
</div>

<style>
	.a1-poster-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		width: 100%;
	}

	.a1-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		max-width: 840px;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 8px 14px;
		box-sizing: border-box;
	}

	.variant-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.var-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 0.84rem;
		font-weight: 600;
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.var-tab-btn:hover {
		background: color-mix(in srgb, var(--bg-surface), var(--text-main) 8%);
	}
	.var-tab-btn--active {
		background: #ffed00 !important;
		color: #111827 !important;
		border-color: rgba(0, 0, 0, 0.15) !important;
		font-weight: 700;
		box-shadow: 0 2px 6px rgba(255, 237, 0, 0.35);
	}

	.toolbar-side {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.logo-toggle-wrap {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.logo-toggle-label {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.logo-btn-group {
		display: inline-flex;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		overflow: hidden;
	}
	.logo-opt-btn {
		padding: 4px 8px;
		font-size: 0.76rem;
		font-weight: 700;
		background: var(--bg-surface);
		color: var(--text-muted);
		border: none;
		cursor: pointer;
	}
	.logo-opt-btn--active {
		background: var(--accent-primary, #00b5ec);
		color: var(--text-on-accent, #0f172a);
	}

	.a1-badge-hint {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-muted);
		background: rgba(0, 0, 0, 0.04);
		padding: 4px 8px;
		border-radius: 6px;
	}

	.a1-poster-frame {
		position: relative;
		width: 100%;
		max-width: 840px;
		margin: 0 auto;
		border-radius: 8px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	@media print {
		.a1-toolbar {
			display: none !important;
		}
		.a1-poster-container {
			gap: 0 !important;
			padding: 0 !important;
			margin: 0 !important;
		}
		.a1-poster-frame {
			width: 594mm !important;
			height: 841mm !important;
			max-width: none !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			margin: 0 !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
		}
	}
</style>

