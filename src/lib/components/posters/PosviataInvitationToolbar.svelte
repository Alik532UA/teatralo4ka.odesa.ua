<script lang="ts">
	import type { PosviataSlotTime } from '$lib/data/posviataInvitations';
	import { Clock, Layers, FileText, Image, Palette, Printer } from 'lucide-svelte';

	export type InvitationMode = 'named' | 'template' | 'cover-color' | 'cover-bw' | 'duplex';

	interface Props {
		selectedTime: PosviataSlotTime;
		selectedMode: InvitationMode;
		duplexCoverType: 'color' | 'bw';
		isEn?: boolean;
		onSelectTime: (time: PosviataSlotTime) => void;
		onSelectMode: (mode: InvitationMode) => void;
		onSelectDuplexCover: (type: 'color' | 'bw') => void;
	}

	let {
		selectedTime,
		selectedMode,
		duplexCoverType,
		isEn = false,
		onSelectTime,
		onSelectMode,
		onSelectDuplexCover
	}: Props = $props();
</script>

<div class="posviata-toolbar" data-testid="posviata-controls-toolbar">
	<!-- Час показу -->
	<div class="control-group">
		<span class="group-label">
			<Clock size={14} aria-hidden="true" />
			<span>{isEn ? 'Time Slot' : 'Час заходу'}</span>
		</span>
		<div class="pill-toggle">
			<button
				type="button"
				class="pill-btn"
				class:pill-btn--active={selectedTime === '10:00'}
				onclick={() => onSelectTime('10:00')}
				data-testid="posviata-time-10-btn"
			>
				10:00 <small>({isEn ? '36 students' : '36 учнів'})</small>
			</button>
			<button
				type="button"
				class="pill-btn"
				class:pill-btn--active={selectedTime === '12:00'}
				onclick={() => onSelectTime('12:00')}
				data-testid="posviata-time-12-btn"
			>
				12:00 <small>({isEn ? '42 students' : '42 учні'})</small>
			</button>
		</div>
	</div>

	<!-- Тип документа -->
	<div class="control-group">
		<span class="group-label">
			<Layers size={14} aria-hidden="true" />
			<span>{isEn ? 'Document Mode' : 'Режим документа'}</span>
		</span>
		<div class="pill-toggle pill-toggle--modes">
			<button
				type="button"
				class="pill-btn"
				class:pill-btn--active={selectedMode === 'named'}
				onclick={() => onSelectMode('named')}
				data-testid="posviata-mode-named-btn"
			>
				<FileText size={14} aria-hidden="true" />
				<span>{isEn ? 'Personalized' : 'Іменні'}</span>
			</button>
			<button
				type="button"
				class="pill-btn"
				class:pill-btn--active={selectedMode === 'template'}
				onclick={() => onSelectMode('template')}
				data-testid="posviata-mode-template-btn"
			>
				<span>{isEn ? 'Blank Template' : 'Шаблон'}</span>
			</button>
			<button
				type="button"
				class="pill-btn"
				class:pill-btn--active={selectedMode === 'cover-color'}
				onclick={() => onSelectMode('cover-color')}
				data-testid="posviata-mode-cover-color-btn"
			>
				<Palette size={14} aria-hidden="true" />
				<span>{isEn ? 'Color Cover' : 'Сорочка (колір)'}</span>
			</button>
			<button
				type="button"
				class="pill-btn"
				class:pill-btn--active={selectedMode === 'cover-bw'}
				onclick={() => onSelectMode('cover-bw')}
				data-testid="posviata-mode-cover-bw-btn"
			>
				<Image size={14} aria-hidden="true" />
				<span>{isEn ? 'B&W Cover' : 'Сорочка (ч/б)'}</span>
			</button>
			<button
				type="button"
				class="pill-btn pill-btn--duplex"
				class:pill-btn--active={selectedMode === 'duplex'}
				onclick={() => onSelectMode('duplex')}
				data-testid="posviata-mode-duplex-btn"
			>
				<Printer size={14} aria-hidden="true" />
				<span>{isEn ? 'Duplex Print' : 'Двосторонній'}</span>
			</button>
		</div>
	</div>

	<!-- Налаштування сорочки для Duplex -->
	{#if selectedMode === 'duplex'}
		<div class="control-group">
			<span class="group-label">
				<span>{isEn ? 'Cover Style' : 'Герб сорочки'}</span>
			</span>
			<div class="pill-toggle">
				<button
					type="button"
					class="pill-btn"
					class:pill-btn--active={duplexCoverType === 'color'}
					onclick={() => onSelectDuplexCover('color')}
					data-testid="posviata-duplex-color-btn"
				>
					{isEn ? 'Color' : 'Кольоровий'}
				</button>
				<button
					type="button"
					class="pill-btn"
					class:pill-btn--active={duplexCoverType === 'bw'}
					onclick={() => onSelectDuplexCover('bw')}
					data-testid="posviata-duplex-bw-btn"
				>
					{isEn ? 'B&W' : 'Ч/б'}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.posviata-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		background: var(--bg-surface);
		border: 1px solid var(--color-border);
		border-radius: 16px;
		padding: 12px 16px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.group-label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
	}

	.pill-toggle {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 4px;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 3px;
	}

	.pill-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 9px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-main);
		background: transparent;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.pill-btn small {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.pill-btn:hover {
		background: color-mix(in srgb, var(--bg-surface), var(--text-main) 6%);
	}

	.pill-btn--active {
		background: var(--accent-primary, #00b5ec) !important;
		color: var(--text-on-accent, #0f172a) !important;
		border-color: var(--accent-primary, #00b5ec) !important;
		font-weight: 700;
	}

	@media print {
		.posviata-toolbar {
			display: none !important;
		}
	}
</style>
