<script lang="ts">
	import DebugSettingsDropdown from "./DebugSettingsDropdown.svelte";
	import { t, locale } from "svelte-i18n";
	import { ui } from "$lib/states/ui.svelte";
	import type { DebugPanelConfig } from "$lib/services/settings";
	import { Sun, SunDim, Citrus, Moon } from "lucide-svelte";

	interface Props {
		isOpen: boolean;
		mobile?: boolean;
		onChangeLang: (lang: string) => void;
		debugPanel?: DebugPanelConfig;
	}

	let { isOpen, mobile = false, onChangeLang, debugPanel }: Props = $props();

	const sfx = $derived(mobile ? '-mobile' : '');
	const mobileStyle = 'width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);';
</script>

<div
	class="dropdown-menu-unified header__settings-dropdown"
	class:mobile
	style={mobile ? mobileStyle : ''}
	data-testid={mobile ? 'settings-dropdown-mobile-menu' : 'header-settings-dropdown-menu'}
>
	<div class="dropdown-group-unified" data-testid="settings-lang{sfx}-group">
		<span class="dropdown-label-unified">{$t("settings.language")}</span>
		<div class="dropdown-options-unified" data-testid="settings-lang{sfx}-options">
			<button
				class="dropdown-opt-unified"
				class:active={$locale === "uk"}
				onclick={() => onChangeLang("uk")}
				data-testid="lang-ua{sfx}-button"
			>{$t("settings.langUA")}</button>
			<button
				class="dropdown-opt-unified"
				class:active={$locale === "en"}
				onclick={() => onChangeLang("en")}
				data-testid="lang-en{sfx}-button"
			>{$t("settings.langEN")}</button>
		</div>
	</div>
	<div class="dropdown-group-unified" data-testid="settings-theme{sfx}-group">
		<span class="dropdown-label-unified">{$t("settings.theme")}</span>
		<div class="dropdown-options-unified" data-testid="settings-theme{sfx}-options" style="flex-wrap: wrap;">
			<button
				class="dropdown-opt-unified"
				class:active={ui.theme === "light"}
				onclick={() => ui.setTheme("light")}
				aria-label={$t("settings.light")}
				data-testid="theme-light{sfx}-button"
			><Sun size={20} /></button>
			<button
				class="dropdown-opt-unified"
				class:active={ui.theme === "light-yellow"}
				onclick={() => ui.setTheme("light-yellow")}
				aria-label={$t("settings.lightYellow") || "Light Yellow"}
				data-testid="theme-light-yellow{sfx}-button"
			><SunDim size={20} /></button>
			<button
				class="dropdown-opt-unified"
				class:active={ui.theme === "yellow"}
				onclick={() => ui.setTheme("yellow")}
				aria-label={$t("settings.yellow") || "Yellow"}
				data-testid="theme-yellow{sfx}-button"
			><Citrus size={20} /></button>
			<button
				class="dropdown-opt-unified"
				class:active={ui.theme === "dark"}
				onclick={() => ui.setTheme("dark")}
				aria-label={$t("settings.dark")}
				data-testid="theme-dark{sfx}-button"
			><Moon size={20} /></button>
		</div>
	</div>
</div>

{#if !debugPanel || debugPanel.visible}
<DebugSettingsDropdown
	{isOpen}
	{mobile}
	showBackground={debugPanel?.showBackground ?? true}
	showBlur={debugPanel?.showBlur ?? true}
	testId={mobile ? "debug-settings-dropdown-menu-mobile" : undefined}
/>
{/if}

<style>
	.header__settings-dropdown {
		width: 220px;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	.header__settings-dropdown.mobile {
		padding: var(--space-md);
		gap: var(--space-lg);
	}

	.header__settings-dropdown.mobile .dropdown-opt-unified {
		padding: 14px 20px;
		font-size: 1.15rem;
	}

	.header__settings-dropdown.mobile .dropdown-label-unified {
		font-size: 1rem;
		margin-bottom: var(--space-xs);
	}
</style>
