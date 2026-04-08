<script lang="ts">
	import DebugSettingsDropdown from "./DebugSettingsDropdown.svelte";
	import { t, locale } from "svelte-i18n";
	import { ui } from "$lib/states/ui.svelte";
	import type { DebugPanelConfig } from "$lib/services/settings";

	interface Props {
		isOpen: boolean;
		mobile?: boolean;
		onChangeLang: (lang: string) => void;
		onToggleTheme: () => void;
		debugPanel?: DebugPanelConfig;
	}

	let { isOpen, mobile = false, onChangeLang, onToggleTheme, debugPanel }: Props = $props();

	const sfx = $derived(mobile ? '-mobile' : '');
	const mobileStyle = 'width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);';
</script>

<div
	class="dropdown-menu-unified header__settings-dropdown"
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
		<div class="dropdown-options-unified" data-testid="settings-theme{sfx}-options">
			<button
				class="dropdown-opt-unified"
				class:active={ui.theme === "light"}
				onclick={() => { if (ui.theme !== "light") onToggleTheme(); }}
				data-testid="theme-light{sfx}-button"
			>{$t("settings.light")}</button>
			<button
				class="dropdown-opt-unified"
				class:active={ui.theme === "dark"}
				onclick={() => { if (ui.theme !== "dark") onToggleTheme(); }}
				data-testid="theme-dark{sfx}-button"
			>{$t("settings.dark")}</button>
		</div>
	</div>
</div>

{#if !debugPanel || debugPanel.visible}
<DebugSettingsDropdown
	{isOpen}
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
</style>
