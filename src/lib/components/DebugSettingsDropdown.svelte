<script lang="ts">
	import { ui } from '$lib/controllers/ui.svelte';
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
	</div>
{/if}

<style>
	.debug-dropdown {
		width: 220px;
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
</style>
