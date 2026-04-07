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

{#if isOpen}
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
{/if}

<style>
	.header__settings-dropdown-debug {
		position: static;
		width: 220px;
		background: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: var(--space-md);
		z-index: 331;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	:global(.dark-theme) .header__settings-dropdown-debug {
		background: var(--color-white); 
	}

	.header__settings-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.header__settings-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-muted-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.header__settings-options {
		display: flex;
		gap: var(--space-xs);
		background: var(--color-ice-blue);
		padding: 4px;
		border-radius: var(--radius-md);
	}

	:global(.dark-theme) .header__settings-options {
		background: rgba(255,255,255,0.05);
	}

	.header__settings-opt {
		flex: 1;
		padding: 6px 10px;
		font-size: 0.8rem;
		font-weight: 700;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		color: var(--color-deep-ocean);
		border: none;
		cursor: pointer;
		background: transparent;
		text-align: left;
	}

	:global(.dark-theme) .header__settings-opt {
		color: var(--color-dark-text);
	}

	.header__settings-opt:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	.header__settings-opt.active {
		background: var(--color-white);
		box-shadow: var(--shadow-sm);
		color: var(--color-golden);
	}

	:global(.dark-theme) .header__settings-opt.active {
		background: rgba(255,255,255,0.1);
		color: var(--color-accent);
	}

	@media (max-width: 768px) {
		.header__settings-dropdown-debug {
			width: 100%;
			box-shadow: var(--shadow-lg); /* Restore shadow for mobile card look */
			padding: var(--space-md);
			border-radius: var(--radius-lg);
			background: var(--color-white);
			transform: none;
		}
	}
</style>
