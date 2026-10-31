<script lang="ts">
	import UartA1Variant1 from './uart-a1/UartA1Variant1.svelte';
	import UartA1Variant2 from './uart-a1/UartA1Variant2.svelte';
	import UartA1Variant3 from './uart-a1/UartA1Variant3.svelte';
	import { Check, Printer } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'uart-dark' }: Props = $props();

	type VariantKey = 'variant1' | 'variant2' | 'variant3';
	let activeVariant = $state<VariantKey>('variant2');

	type BgKey = 'black' | 'theatre';
	let activeBg = $state<BgKey>('black');

	// Синхронізація з верхнім вибором теми "Фон", якщо обрано uart-dark або uart-black
	$effect(() => {
		if (themeId === 'uart-dark') activeBg = 'theatre';
		else if (themeId === 'uart-black') activeBg = 'black';
	});

	type SchoolLogoVariant = 'crest' | 'logo2026';
	let schoolLogoVariant = $state<SchoolLogoVariant>('crest');

	function toggleSchoolLogo() {
		schoolLogoVariant = schoolLogoVariant === 'crest' ? 'logo2026' : 'crest';
	}

	const isLight = $derived(themeId === 'uart-light');
</script>

<div class="a1-poster-container" data-testid="uart-a1-poster-container">
	<!-- Внутрішня панель перемикання кольору та фону афіші A1 -->
	<div class="a1-toolbar" data-testid="uart-a1-toolbar">
		<!-- 1. Акцентний колір (жовтий, білий, червоний) у вигляді круглих кнопок-зразків (приклад у брендбуці) -->
		<div class="toolbar-cluster">
			<span class="toolbar-cluster-label">{isEn ? 'Accent:' : 'Акцент:'}</span>
			<div class="swatch-group" role="tablist" aria-label={isEn ? 'Accent color' : 'Колір акценту'}>
				<button
					type="button"
					role="tab"
					aria-selected={activeVariant === 'variant1'}
					class="swatch-btn"
					class:swatch-btn--active={activeVariant === 'variant1'}
					style="background-color: #ffed00;"
					onclick={() => (activeVariant = 'variant1')}
					title={isEn ? 'Yellow accent (#ffed00)' : 'Жовтий акцент (#ffed00)'}
					aria-label={isEn ? 'Yellow accent' : 'Жовтий акцент'}
					data-testid="uart-a1-variant1-btn"
				>
					{#if activeVariant === 'variant1'}
						<Check size={14} color="#111827" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<button
					type="button"
					role="tab"
					aria-selected={activeVariant === 'variant2'}
					class="swatch-btn"
					class:swatch-btn--active={activeVariant === 'variant2'}
					style="background-color: #ffffff;"
					onclick={() => (activeVariant = 'variant2')}
					title={isEn ? 'White accent (#ffffff)' : 'Білий акцент (#ffffff)'}
					aria-label={isEn ? 'White accent' : 'Білий акцент'}
					data-testid="uart-a1-variant2-btn"
				>
					{#if activeVariant === 'variant2'}
						<Check size={14} color="#111827" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<button
					type="button"
					role="tab"
					aria-selected={activeVariant === 'variant3'}
					class="swatch-btn"
					class:swatch-btn--active={activeVariant === 'variant3'}
					style="background-color: #ef4444;"
					onclick={() => (activeVariant = 'variant3')}
					title={isEn ? 'Red accent (#ef4444)' : 'Червоний акцент (#ef4444)'}
					aria-label={isEn ? 'Red accent' : 'Червоний акцент'}
					data-testid="uart-a1-variant3-btn"
				>
					{#if activeVariant === 'variant3'}
						<Check size={14} color="#ffffff" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>
			</div>
		</div>

		<!-- 2. Фон афіші: Чорний (#000000) або Театральний (#171118) -->
		<div class="toolbar-cluster">
			<span class="toolbar-cluster-label">{isEn ? 'Background:' : 'Фон:'}</span>
			<div class="swatch-group" role="tablist" aria-label={isEn ? 'Poster background' : 'Фон афіші'}>
				<button
					type="button"
					role="tab"
					aria-selected={activeBg === 'black'}
					class="swatch-btn swatch-btn--dark"
					class:swatch-btn--active={activeBg === 'black'}
					style="background-color: #000000;"
					onclick={() => (activeBg = 'black')}
					title={isEn ? 'Black background (#000000)' : 'Чорний фон (#000000)'}
					aria-label={isEn ? 'Black background' : 'Чорний фон'}
					data-testid="uart-a1-bg-black-btn"
				>
					{#if activeBg === 'black'}
						<Check size={14} color="#ffffff" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>

				<button
					type="button"
					role="tab"
					aria-selected={activeBg === 'theatre'}
					class="swatch-btn swatch-btn--dark"
					class:swatch-btn--active={activeBg === 'theatre'}
					style="background-color: #171118;"
					onclick={() => (activeBg = 'theatre')}
					title={isEn ? 'Theatrical dark background (#171118)' : 'Театральний темний фон (#171118)'}
					aria-label={isEn ? 'Theatrical dark background' : 'Театральний темний фон'}
					data-testid="uart-a1-bg-theatre-btn"
				>
					{#if activeBg === 'theatre'}
						<Check size={14} color="#ffffff" strokeWidth={3} aria-hidden="true" />
					{/if}
				</button>
			</div>
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
			<UartA1Variant1 {isEn} {isLight} bgVariant={activeBg} {schoolLogoVariant} onToggleLogo={toggleSchoolLogo} />
		{:else if activeVariant === 'variant2'}
			<UartA1Variant2 {isEn} {isLight} bgVariant={activeBg} {schoolLogoVariant} onToggleLogo={toggleSchoolLogo} />
		{:else}
			<UartA1Variant3 {isEn} {isLight} bgVariant={activeBg} {schoolLogoVariant} onToggleLogo={toggleSchoolLogo} />
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

	.toolbar-cluster {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.toolbar-cluster-label {
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.swatch-group {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.swatch-btn {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition: transform 0.12s ease, border-color 0.15s ease, box-shadow 0.15s ease;
		box-sizing: border-box;
		position: relative;
	}

	.swatch-btn:hover {
		transform: scale(1.12);
		border-color: var(--text-title);
	}

	.swatch-btn--active {
		border-color: var(--accent-text, #00b5ec);
		box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 4px var(--accent-text, #00b5ec);
		transform: scale(1.08);
	}

	.swatch-btn--dark {
		border-color: rgba(255, 255, 255, 0.25);
	}
	.swatch-btn--dark.swatch-btn--active {
		border-color: var(--accent-text, #00b5ec);
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
			width: 100% !important;
			height: 100% !important;
			max-height: 100dvh !important;
			overflow: hidden !important;
			box-shadow: none !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
			page-break-after: avoid !important;
			break-after: avoid !important;
		}
		.a1-poster-frame {
			width: 100% !important;
			height: 100dvh !important;
			max-height: 100dvh !important;
			display: flex !important;
			justify-content: center !important;
			align-items: center !important;
			margin: 0 auto !important;
			padding: 0 !important;
			overflow: hidden !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
			page-break-after: avoid !important;
			break-after: avoid !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}
	}
</style>

