<script lang="ts">
	import { ui } from '$lib/states/ui.svelte';
	import { t } from 'svelte-i18n';

	let { 
		isOpen = false, 
		testId = "debug-settings-dropdown-menu", 
		showBackground = true, 
		showBlur = true,
		mobile = false
	} = $props<{ 
		isOpen: boolean; 
		testId?: string; 
		showBackground?: boolean; 
		showBlur?: boolean;
		mobile?: boolean;
	}>();

	type BackgroundOption = {
		id: 0 | 1 | 2 | 3 | 4;
		label: () => string;
	};

	const selectDynamicBackground = (type: 0 | 1 | 2 | 3 | 4) => {
		ui.setBackgroundType(type);

		if (type === 0 && ui.enableDynamicBackground) {
			ui.toggleDynamicBackground();
		}

		if (type !== 0 && !ui.enableDynamicBackground) {
			ui.toggleDynamicBackground();
		}
	};

	const backgrounds: BackgroundOption[] = [
		{ id: 0, label: () => $t('settings.bgNone') },
		{ id: 1, label: () => $t('settings.bgParticles') },
		{ id: 2, label: () => $t('settings.bgWaves') },
		{ id: 3, label: () => $t('settings.bgShapes') },
		{ id: 4, label: () => $t('settings.bgMiniIcon') },
	];
</script>

{#if isOpen}
	<div class="dropdown-menu-unified debug-dropdown" class:mobile data-testid={testId}>
		{#if showBackground}
		<div class="dropdown-group-unified" data-testid="debug-bg-group">
			<span class="dropdown-label-unified">{$t('settings.dynamicBg')}</span>
			<div class="dropdown-options-unified" style="flex-direction: column;" data-testid="debug-bg-options-group">
				{#each backgrounds as bg, i}
					<button
						class="dropdown-opt-unified"
						class:active={(bg.id === 0 && !ui.enableDynamicBackground) ||
							(bg.id !== 0 && ui.enableDynamicBackground && ui.backgroundType === bg.id)}
						onclick={() => selectDynamicBackground(bg.id)}
						style="text-align: left;"
						data-testid={`debug-bg-${i}-button`}
					>
						{bg.label()}
					</button>
				{/each}
			</div>
		</div>
		{/if}

		{#if showBlur}
		<div class="dropdown-group-unified" data-testid="debug-blur-group">
			<span class="dropdown-label-unified">{$t('settings.blur')}</span>
			<div class="dropdown-options-unified" data-testid="debug-blur-options-group">
				<button
					class="dropdown-opt-unified"
					class:active={!ui.enableBlurEffect}
					onclick={() => ui.toggleBlurEffect()}
					data-testid="debug-blur-off-button"
				>
					{$t('settings.off')}
				</button>
				<button
					class="dropdown-opt-unified"
					class:active={ui.enableBlurEffect}
					onclick={() => ui.toggleBlurEffect()}
					data-testid="debug-blur-on-button"
				>
					{$t('settings.on')}
				</button>
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

	@media (max-width: 768px) {
		.debug-dropdown {
			width: 100%;
		}
	}

	.debug-dropdown.mobile {
		padding: var(--space-md);
		gap: var(--space-lg);
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
