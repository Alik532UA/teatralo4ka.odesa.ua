<script lang="ts">
	import { tick } from 'svelte';
	import { Palette, X } from 'lucide-svelte';
	import {
		BLUR_PX,
		FILTER_DENSITY,
		FILTER_MODES,
		type CalendarView,
		type FilterMode
	} from '$lib/data/calendarView';
	import type { Locale } from '$lib/i18n/routing';
	import CalendarThemeGrid from './CalendarThemeGrid.svelte';

	/**
	 * Панель вигляду плаката: фон, розмиття, фільтр поверх фону.
	 *
	 * Стану тут немає — лише розмітка. Значення приходять `view` з адреси
	 * сторінки, а кожна зміна йде назад через `onChange`, і сторінка записує її в
	 * адресу. Друга редакція тримала те саме в `localStorage` плюс п'ять `bind:`,
	 * і однакове посилання в різних людей показувало різний фон.
	 *
	 * ## Де стоїть
	 *
	 * Кнопка — у блоці керування праворуч від плаката: ліворуч від кнопки повного
	 * екрана, а в самому повному екрані — під нею (прохання автора 2026-09-26).
	 * Панель випадає ПІД кнопкою і тягнеться ліворуч, поверх краю плаката. Доти
	 * панель висіла окремо біля лівого краю вікна й закривала лівий стовпець
	 * місяців.
	 *
	 * `compact` — повний екран: там панель вужча, а фони й тони фільтра йдуть
	 * ОДНІЄЮ колонкою, щоб поміститися в поле збоку від аркуша A4.
	 *
	 * Згорнута за замовчуванням, і мініатюри фонів не вантажаться, доки панель не
	 * відкрили, — це вісім повнорозмірних файлів.
	 */
	interface Props {
		view: CalendarView;
		locale?: Locale;
		compact?: boolean;
		onChange: (patch: Partial<CalendarView>) => void;
	}

	let { view, locale = 'uk', compact = false, onChange }: Props = $props();
	const isEn = $derived(locale === 'en');

	let open = $state(false);
	let toggleButton = $state<HTMLButtonElement | null>(null);

	/* Закриття хрестиком чи Escape повертає фокус на кнопку палітри: інакше він
	   падав би на початок сторінки разом зі зниклою панеллю. */
	async function close() {
		open = false;
		await tick();
		toggleButton?.focus();
	}

	/* Escape закриває панель, де б не стояв фокус; слухач живе лише поки вона відкрита. */
	function onWindowKeydown(event: KeyboardEvent) {
		if (!open || event.key !== 'Escape') return;
		void close();
	}

	const MODE_NAMES: Record<FilterMode, { uk: string; en: string }> = {
		none: { uk: 'Ні', en: 'None' },
		light: { uk: 'Світлий', en: 'Light' },
		dark: { uk: 'Темний', en: 'Dark' }
	};
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="calendar-theme-picker" data-testid="calendar-theme-picker-container">
	<button
		type="button"
		class="picker-toggle-btn"
		class:active={open}
		bind:this={toggleButton}
		onclick={() => (open ? close() : (open = true))}
		aria-expanded={open}
		aria-controls="calendar-theme-panel"
		aria-label={isEn ? 'Background and blur' : 'Фон і розмиття'}
		title={isEn ? 'Background and blur' : 'Фон і розмиття'}
		data-testid="calendar-theme-open-btn"
	>
		<Palette size={22} aria-hidden="true" />
	</button>

	{#if open}
		<div
			class="picker-panel"
			class:compact
			id="calendar-theme-panel"
			role="group"
			aria-label={isEn ? 'Poster appearance' : 'Вигляд плаката'}
			data-testid="calendar-theme-panel"
		>
			<div class="panel-header">
				<span class="panel-title">{isEn ? 'Background' : 'Фон плаката'}</span>
				<button
					type="button"
					class="panel-close-btn"
					onclick={close}
					aria-label={isEn ? 'Collapse' : 'Згорнути'}
					data-testid="calendar-theme-close-btn"
				>
					<X size={15} aria-hidden="true" />
				</button>
			</div>

			<CalendarThemeGrid
				selected={view.bg}
				{locale}
				columns={compact ? 1 : 2}
				onSelect={(bg) => onChange({ bg })}
			/>

			<div class="ctrl-section">
				<div class="ctrl-row">
					<label for="calendar-blur-slider" class="ctrl-label">
						{isEn ? 'Blur:' : 'Розмиття:'}
						<strong class="ctrl-val">{view.blur}px</strong>
					</label>
					{#if view.blur !== BLUR_PX.default}
						<button
							type="button"
							class="reset-btn"
							onclick={() => onChange({ blur: BLUR_PX.default })}
							title={isEn ? `Reset to ${BLUR_PX.default}px` : `Скинути на ${BLUR_PX.default}px`}
							data-testid="calendar-blur-reset-btn"
						>
							{BLUR_PX.default}px
						</button>
					{/if}
				</div>
				<input
					id="calendar-blur-slider"
					type="range"
					min={BLUR_PX.min}
					max={BLUR_PX.max}
					step="1"
					value={view.blur}
					oninput={(event) => onChange({ blur: Number(event.currentTarget.value) })}
					class="ctrl-slider"
					data-testid="calendar-blur-slider"
				/>
			</div>

			<div class="ctrl-section">
				<div class="ctrl-row">
					<span class="ctrl-label">{isEn ? 'Tint over the background:' : 'Фільтр поверх фону:'}</span>
				</div>
				<div class="filter-btn-group" role="group" aria-label={isEn ? 'Tint' : 'Тон фільтра'}>
					{#each FILTER_MODES as mode (mode)}
						<button
							type="button"
							class="filter-mode-btn"
							class:active={view.filter === mode}
							aria-pressed={view.filter === mode}
							onclick={() => onChange({ filter: mode })}
							data-testid={`calendar-filter-${mode}-btn`}
						>
							{isEn ? MODE_NAMES[mode].en : MODE_NAMES[mode].uk}
						</button>
					{/each}
				</div>
				{#if view.filter !== 'none'}
					<div class="ctrl-row opacity-row">
						<label for="calendar-opacity-slider" class="ctrl-label">
							{isEn ? 'Density:' : 'Густина:'}
							<strong class="ctrl-val">{view.density}%</strong>
						</label>
					</div>
					<input
						id="calendar-opacity-slider"
						type="range"
						min={FILTER_DENSITY.min}
						max={FILTER_DENSITY.max}
						step={FILTER_DENSITY.step}
						value={view.density}
						oninput={(event) => onChange({ density: Number(event.currentTarget.value) })}
						class="ctrl-slider"
						data-testid="calendar-opacity-slider"
					/>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.calendar-theme-picker {
		position: relative;
		font-family: inherit;
	}

	.picker-toggle-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--bg-card);
		border: var(--hairline-width) solid var(--border-main);
		box-shadow: var(--shadow-main);
		color: var(--text-title);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.picker-toggle-btn:hover,
	.picker-toggle-btn.active {
		border-color: var(--accent-primary);
	}

	/*
	 * Випадає ПІД кнопкою, правим краєм по ній — отже тягнеться ліворуч, поверх
	 * краю плаката, а не за край екрана. Кольори — токени теми сайту, як і в решти
	 * календаря.
	 */
	.picker-panel {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 20;
		width: 224px;
		max-height: calc(100dvh - var(--header-height, 72px) - 6rem);
		background: var(--bg-card);
		color: var(--text-main);
		border: var(--hairline-width) solid var(--border-main);
		border-radius: 18px;
		padding: 0.75rem;
		box-shadow: var(--shadow-main);
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		overflow-y: auto;
		box-sizing: border-box;
	}

	/* Повний екран: поле збоку від аркуша A4 вузьке — панель теж. */
	.picker-panel.compact {
		width: 156px;
		max-height: calc(100dvh - 8rem);
	}

	.picker-panel.compact .filter-btn-group {
		grid-template-columns: 1fr;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.25rem;
		border-bottom: var(--hairline-width) solid var(--border-main);
	}

	.panel-title {
		color: var(--text-title);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.panel-close-btn {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.panel-close-btn:hover {
		background: var(--bg-surface);
		color: var(--text-title);
	}

	.ctrl-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-top: 0.3rem;
		border-top: var(--hairline-width) solid var(--border-main);
	}

	.ctrl-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.74rem;
		color: var(--text-main);
	}

	.opacity-row {
		margin-top: 0.2rem;
	}

	.ctrl-val {
		font-weight: 700;
		color: var(--text-title);
	}

	.reset-btn {
		font-size: 0.68rem;
		color: var(--text-title);
		background: var(--bg-surface);
		border: var(--hairline-width) solid var(--border-main);
		border-radius: 5px;
		padding: 1px 5px;
		cursor: pointer;
	}

	.ctrl-slider {
		width: 100%;
		accent-color: var(--accent-primary);
		cursor: pointer;
		margin: 0;
	}

	.filter-btn-group {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.25rem;
	}

	.filter-mode-btn {
		/* 24 px — мінімум WCAG 2.2 для цілі дотику; без нього кнопка мала 19. */
		min-height: 24px;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 4px 2px;
		border-radius: 6px;
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-title);
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.filter-mode-btn.active {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		border-color: var(--accent-primary);
	}

	@media print {
		.calendar-theme-picker {
			display: none !important;
		}
	}
</style>
