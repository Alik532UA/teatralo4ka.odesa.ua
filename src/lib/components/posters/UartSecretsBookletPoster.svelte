<script lang="ts">
	import UartSecretsCoverSheet from './UartSecretsCoverSheet.svelte';
	import UartSecretsInsideSheet from './UartSecretsInsideSheet.svelte';
	import { BookOpen, Layers, Printer, FileText } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'uart-dark' }: Props = $props();

	type SheetViewMode = 'side1' | 'side2' | 'both';
	let viewMode = $state<SheetViewMode>('side1');

	type SchoolLogoVariant = 'crest' | 'logo2026';
	let schoolLogoVariant = $state<SchoolLogoVariant>('crest');

	function toggleSchoolLogo() {
		schoolLogoVariant = schoolLogoVariant === 'crest' ? 'logo2026' : 'crest';
	}
</script>

<div class="booklet-container" data-testid="uart-booklet-container">
	<!-- Внутрішня панель перемикання сторін буклету -->
	<div class="booklet-toolbar" data-testid="uart-booklet-toolbar">
		<div class="view-tabs" role="tablist" aria-label={isEn ? 'Booklet page selection' : 'Вибір сторони буклету'}>
			<button
				type="button"
				role="tab"
				aria-selected={viewMode === 'side1'}
				class="mode-tab-btn"
				class:mode-tab-btn--active={viewMode === 'side1'}
				onclick={() => (viewMode = 'side1')}
				data-testid="uart-booklet-side1-btn"
			>
				<FileText size={15} aria-hidden="true" />
				<span>{isEn ? 'Side 1 (Cover)' : '1 сторона (Обкладинка)'}</span>
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={viewMode === 'side2'}
				class="mode-tab-btn"
				class:mode-tab-btn--active={viewMode === 'side2'}
				onclick={() => (viewMode = 'side2')}
				data-testid="uart-booklet-side2-btn"
			>
				<BookOpen size={15} aria-hidden="true" />
				<span>{isEn ? 'Side 2 (Inside Spread)' : '2 сторона (Розворот)'}</span>
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={viewMode === 'both'}
				class="mode-tab-btn"
				class:mode-tab-btn--active={viewMode === 'both'}
				onclick={() => (viewMode = 'both')}
				data-testid="uart-booklet-both-btn"
			>
				<Layers size={15} aria-hidden="true" />
				<span>{isEn ? 'Both Sides (Duplex Print)' : 'Обидві сторони (Друк)'}</span>
			</button>
		</div>

		<div class="toolbar-extras">
			{#if viewMode === 'side1' || viewMode === 'both'}
				<div class="logo-picker" role="group" aria-label={isEn ? 'School logo' : 'Логотип школи'}>
					<span class="logo-picker-label">{isEn ? 'Logo:' : 'Лого школи:'}</span>
					<div class="logo-toggle-group">
						<button
							type="button"
							class="logo-sub-tab"
							class:logo-sub-tab--active={schoolLogoVariant === 'crest'}
							onclick={() => (schoolLogoVariant = 'crest')}
							data-testid="uart-logo-crest-btn"
							title={isEn ? 'Traditional crest emblem' : 'Традиційний герб школи'}
						>
							{isEn ? 'Crest' : 'Герб'}
						</button>
						<button
							type="button"
							class="logo-sub-tab"
							class:logo-sub-tab--active={schoolLogoVariant === 'logo2026'}
							onclick={() => (schoolLogoVariant = 'logo2026')}
							data-testid="uart-logo-2026-btn"
							title={isEn ? 'Master logo 2026 on yellow oval' : 'Основний логотип 2026 на жовтому овалі'}
						>
							{isEn ? 'Logo 2026' : 'Логотип 2026'}
						</button>
					</div>
				</div>
			{/if}

			<div class="booklet-hint">
				<Printer size={13} aria-hidden="true" />
				<span>
					{isEn
						? 'A4 Landscape · folds in half into A5 program booklet'
						: 'Формат A4 альбомний · згинається навпіл у програмку A5'}
				</span>
			</div>
		</div>
	</div>

	<!-- Робоча область відображення аркушів -->
	<div class="sheets-wrapper sheets-wrapper--{viewMode}">
		{#if viewMode === 'side1' || viewMode === 'both'}
			<div class="sheet-entry sheet-entry--side1">
				<UartSecretsCoverSheet {isEn} {themeId} {schoolLogoVariant} onToggleLogo={toggleSchoolLogo} />
			</div>
		{/if}

		{#if viewMode === 'side2' || viewMode === 'both'}
			<div class="sheet-entry sheet-entry--side2">
				<UartSecretsInsideSheet {isEn} {themeId} />
			</div>
		{/if}
	</div>
</div>

<style>
	.booklet-container {
		display: flex;
		flex-direction: column;
		gap: clamp(14px, 2.5cqi, 24px);
		width: 100%;
		max-width: 1160px;
		margin: 0 auto;
	}

	.booklet-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 16px;
		background: rgba(22, 18, 23, 0.7);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 237, 0, 0.2);
		border-radius: 12px;
	}

	.view-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}

	.mode-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 13px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.05);
		color: #e2e8f0;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.mode-tab-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border-color: rgba(255, 237, 0, 0.35);
	}

	.mode-tab-btn--active {
		background: #ffed00;
		color: #161217;
		font-weight: 700;
		border-color: #ffed00;
		box-shadow: 0 2px 8px rgba(255, 237, 0, 0.25);
	}

	.toolbar-extras {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}

	.logo-picker {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.logo-picker-label {
		font-size: 12px;
		color: #94a3b8;
		font-weight: 500;
	}

	.logo-toggle-group {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		padding: 2px;
	}

	.logo-sub-tab {
		border: none;
		background: transparent;
		color: #cbd5e1;
		font-size: 12px;
		font-weight: 600;
		padding: 4px 9px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: inherit;
	}

	.logo-sub-tab:hover {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.08);
	}

	.logo-sub-tab--active {
		background: #ffed00;
		color: #161217;
		font-weight: 700;
	}

	.booklet-hint {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #94a3b8;
		padding: 4px 10px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.sheets-wrapper {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
	}

	.sheet-entry {
		width: 100%;
	}

	/* Стилі для друку: приховуємо навігацію, розриваємо сторінки при двосторонньому друку */
	@media print {
		.booklet-toolbar {
			display: none !important;
		}

		.sheets-wrapper {
			gap: 0 !important;
		}

		.sheet-entry--side1 {
			page-break-after: always !important;
			break-after: page !important;
		}

		:global(.sheet-fold-line),
		:global(.fold-badge) {
			display: none !important;
		}

		.sheets-wrapper--side1 .sheet-entry--side1 {
			page-break-after: auto !important;
			break-after: auto !important;
		}
	}
</style>
