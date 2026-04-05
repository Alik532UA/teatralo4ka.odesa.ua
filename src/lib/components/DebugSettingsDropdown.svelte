<script lang="ts">
	import { ui } from '$lib/states/ui.svelte';
	import { t } from 'svelte-i18n';

	let { isOpen = false } = $props<{ isOpen: boolean }>();

	type BackgroundOption = {
		id: 0 | 1 | 2 | 3 | 4;
		label: () => string;
	};

	const selectDynamicBackground = (type: 0 | 1 | 2 | 3 | 4) => {
		console.log("[DebugSettingsDropdown] Selecting background:", {
			type,
			currentType: ui.backgroundType,
			wasEnabled: ui.enableDynamicBackground,
			timestamp: new Date().toISOString(),
		});

		ui.setBackgroundType(type);

		if (type === 0 && ui.enableDynamicBackground) {
			console.log("[DebugSettingsDropdown] Disabling dynamic background (type=0)");
			ui.toggleDynamicBackground();
		}

		if (type !== 0 && !ui.enableDynamicBackground) {
			console.log("[DebugSettingsDropdown] Enabling dynamic background (type!=0)");
			ui.toggleDynamicBackground();
		}

		console.log("[DebugSettingsDropdown] After selection:", {
			newType: ui.backgroundType,
			isEnabled: ui.enableDynamicBackground,
		});
	};

	const backgrounds: BackgroundOption[] = [
		{ id: 0, label: () => $t('settings.bgNone') },
		{ id: 1, label: () => $t('settings.bgParticles') },
		{ id: 2, label: () => $t('settings.bgWaves') },
		{ id: 3, label: () => $t('settings.bgShapes') },
		{ id: 4, label: () => $t('settings.bgMiniIcon') },
	];
</script>

<div class="header__settings-dropdown header__settings-dropdown-debug" data-testid="debug-settings-dropdown">
	<div class="header__settings-group" data-testid="debug-bg-group">
	   <span class="header__settings-label">{$t('settings.dynamicBg')}</span>
	   <div class="header__settings-options" style="flex-direction: column;" data-testid="debug-bg-options">
		   {#each backgrounds as bg, i}
			   <button
				   class="header__settings-opt"
				   class:active={(bg.id === 0 && !ui.enableDynamicBackground) ||
					   (bg.id !== 0 && ui.enableDynamicBackground && ui.backgroundType === bg.id)}
				   onclick={() => selectDynamicBackground(bg.id)}
				   style="text-align: left;"
				   data-testid={`debug-bg-btn-${i}`}
			   >
				   {bg.label()}
			   </button>
		   {/each}
	   </div>
	</div>

	<div class="header__settings-group" data-testid="debug-blur-group">
	   <span class="header__settings-label">{$t('settings.blur')}</span>
	   <div class="header__settings-options" data-testid="debug-blur-options">
		   <button
			   class="header__settings-opt"
			   class:active={!ui.enableBlurEffect}
			   onclick={() => ui.toggleBlurEffect()}
			   data-testid="debug-blur-off-btn"
		   >
			   Вимк
		   </button>
		   <button
			   class="header__settings-opt"
			   class:active={ui.enableBlurEffect}
			   onclick={() => ui.toggleBlurEffect()}
			   data-testid="debug-blur-on-btn"
		   >
			   Вкл
		   </button>
	   </div>
	</div>

</div>

<style>
</style>
