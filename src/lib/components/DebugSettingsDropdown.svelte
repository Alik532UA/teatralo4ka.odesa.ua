<script lang="ts">
	import { ui } from '$lib/controllers/ui.svelte';
	import { scrollbar } from '$lib/controllers/scrollbar.svelte';
	import { SCROLLBAR_MODES } from '$lib/config/scrollbarModes';
	import { BACKGROUND_OPTIONS, type BackgroundType } from '$lib/config/backgroundOptions';
	import { t } from 'svelte-i18n';

	let { 
		isOpen = false, 
		testId = "debug-settings-dropdown-menu", 
		showBackground = true, 
		showBlur = true,
		showScrollbar = true,
		mobile = false
	} = $props<{ 
		isOpen: boolean; 
		testId?: string; 
		showBackground?: boolean; 
		showBlur?: boolean;
		showScrollbar?: boolean;
		mobile?: boolean;
	}>();

	/**
	 * «Немає» — це нульовий тип І вимкнений фон; будь-який інший — увімкнений.
	 *
	 * Раніше тут стояли два `if`, які звіряли поточний стан із бажаним і кликали
	 * `toggle()`. Тобто сеттер відтворювався довшим шляхом — і саме тому сеттера
	 * довго не існувало, а пара кнопок «Вимк / Увімк» гортала прапорець і
	 * вимикала його при натисканні на вже активну кнопку.
	 */
	const selectDynamicBackground = (type: BackgroundType) => {
		ui.setBackgroundType(type);
		ui.setDynamicBackground(type !== 0);
	};

	// Обидва переліки живуть у `$lib/config`: ті самі потрібні в адмінці, де
	// задають типове значення. Дві копії розійшлися б при додаванні варіанта.
	const scrollbarModes = SCROLLBAR_MODES;
	const backgrounds = BACKGROUND_OPTIONS;
</script>

{#if isOpen}
	<div class="dropdown-menu-unified debug-dropdown" class:mobile data-testid={testId}>
		{#if showBackground}
		<div class="dropdown-group-unified" data-testid="debug-bg-fieldset">
			<span class="dropdown-label-unified">{$t('settings.dynamicBg')}</span>
			<div class="dropdown-options-unified" style="flex-direction: column;" data-testid="debug-bg-options-fieldset">
				{#each backgrounds as bg, i (bg.id)}
					<button
						class="dropdown-opt-unified"
						class:active={(bg.id === 0 && !ui.enableDynamicBackground) ||
							(bg.id !== 0 && ui.enableDynamicBackground && ui.backgroundType === bg.id)}
						onclick={() => selectDynamicBackground(bg.id)}
						style="text-align: left;"
						data-testid={`debug-bg-${i}-btn`}
					>
						{$t(bg.key)}
					</button>
				{/each}
			</div>
		</div>
		{/if}

		{#if showBlur}
		<div class="dropdown-group-unified" data-testid="debug-blur-fieldset">
			<span class="dropdown-label-unified">{$t('settings.blur')}</span>
			<div class="dropdown-options-unified" data-testid="debug-blur-options-fieldset">
				<button
					class="dropdown-opt-unified"
					class:active={!ui.enableBlurEffect}
					onclick={() => ui.setBlurEffect(false)}
					aria-pressed={!ui.enableBlurEffect}
					data-testid="debug-blur-off-btn"
				>
					{$t('settings.off')}
				</button>
				<button
					class="dropdown-opt-unified"
					class:active={ui.enableBlurEffect}
					onclick={() => ui.setBlurEffect(true)}
					aria-pressed={ui.enableBlurEffect}
					data-testid="debug-blur-on-btn"
				>
					{$t('settings.on')}
				</button>
			</div>
		</div>
		{/if}

		{#if showScrollbar}
		<div class="dropdown-group-unified" data-testid="debug-scrollbar-fieldset">
			<span class="dropdown-label-unified">{$t('settings.scrollbar')}</span>
			<div class="dropdown-options-unified" style="flex-direction: column;" data-testid="debug-scrollbar-options-fieldset">
				{#each scrollbarModes as mode (mode.id)}
					<button
						class="dropdown-opt-unified"
						class:active={ui.scrollbarMode === mode.id}
						onclick={() => ui.setScrollbarMode(mode.id)}
						style="text-align: left;"
						data-testid={`debug-scrollbar-${mode.id}-btn`}
					>
						{$t(mode.key)}
					</button>
				{/each}
			</div>
		</div>
		{/if}

		<!-- Доводка наведенням — ОКРЕМА група, а не п'ятий рядок у переліку
			 режимів: там вибір одного з чотирьох, тут незалежна настройка.
			 Вона тут, а не лише в контекстному меню смуги, бо два переліки, які
			 розходяться, — рівно те, від чого застерігає SCROLLBAR § 2.2.

			 Умова на `scrollbar.active`, не на `ui.scrollbarMode`: поки малює
			 нативна смуга — сенсорний екран, вузьке вікно під мінімапу —
			 наводити нема на що (HOLD-SCROLL § 1.3). -->
		{#if showScrollbar && scrollbar.active !== 'native'}
		<div class="dropdown-group-unified" data-testid="debug-hold-fieldset">
			<label class="switch-label debug-hold__label" data-testid="debug-hold-label">
				<span>{$t('settings.scrollbarHold')}</span>
				<input
					type="checkbox"
					class="switch-input"
					checked={ui.holdScroll}
					onchange={() => ui.setHoldScroll(!ui.holdScroll)}
					data-testid="debug-hold-toggle"
				/>
				<span class="switch-slider"></span>
			</label>
		</div>
		{/if}
	</div>
{/if}

<style>
	/*
	 * 260, а не 220, і число заміряне: рядок тумблера бере 175 px під «Доводка
	 * наведенням» плюс 44 на сам тумблер, 8 на проміжок і 32 на падінги — 259.
	 * На 220 переносився і він, і «Мінімапа мінімальна» (163 px при 156
	 * доступних). Стільки ж у контекстного меню смуги: те саме показане двічі
	 * не має бути двох різних ширин.
	 */
	.debug-dropdown {
		width: 260px;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	.debug-dropdown.mobile {
		width: 100%;
		padding: var(--space-md);
		gap: var(--space-lg);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	}

	.debug-dropdown.mobile .dropdown-opt-unified {
		padding: 14px 20px;
		font-size: 1.15rem;
	}

	.debug-dropdown.mobile .dropdown-label-unified {
		font-size: 1rem;
		margin-bottom: var(--space-xs);
	}

	/* Підпис ліворуч, тумблер праворуч — як у рядках адмінки. */
	.debug-hold__label {
		justify-content: space-between;
		width: 100%;
		gap: var(--space-sm);
	}

	.debug-dropdown.mobile .debug-hold__label {
		font-size: 1.15rem;
	}

	/* Обведення на тумблері: сам `input` 0×0 і не видно, де фокус. */
	.debug-hold__label:focus-within .switch-slider {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}
</style>
