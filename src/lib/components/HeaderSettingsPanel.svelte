<script lang="ts">
	import DebugSettingsDropdown from "./DebugSettingsDropdown.svelte";
	import { t, locale } from "svelte-i18n";
	import { ui } from "$lib/controllers/ui.svelte";
	import type { DebugPanelConfig } from "$lib/services/settings";
	import {
		nextTheme,
		themeColumns,
		DEV_THEME_CYCLE,
		PROD_THEME_CYCLE,
	} from "$lib/config/themes";
	import { dev } from "$app/environment";
	import { Sun, Palette, FlaskConical, Moon, Waves, TestTube } from "lucide-svelte";

	interface Props {
		isOpen: boolean;
		mobile?: boolean;
		onChangeLang: (lang: string) => void;
		debugPanel?: DebugPanelConfig;
	}

	let { isOpen, mobile = false, onChangeLang, debugPanel }: Props = $props();

	const sfx = $derived(mobile ? '-mobile' : '');

	/**
	 * Кількість колонок для кнопок тем — щоб остання не лишалася в рядку сама.
	 *
	 * Береться з переліків, а не з рахунку кнопок у розмітці: `dev` додає дві
	 * тестові теми, і копія числа тут розійшлася б із переліком мовчки.
	 */
	const themeCols = themeColumns((dev ? DEV_THEME_CYCLE : PROD_THEME_CYCLE).length);
	const mobileStyle = 'width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);';

	/**
	 * Виявність скорочень для читалки (HOTKEYS-v8 § 5, `HK-DISCOVERABILITY`).
	 *
	 * `aria-keyshortcuts` означає «ця клавіша активує САМЕ цей елемент», тож
	 * вішати `T` на всі чотири кнопки теми було б неправдою: клавіша не вмикає
	 * обрану тему, вона бере НАСТУПНУ в переборі. Тому атрибут стоїть рівно на
	 * тій кнопці, яку `T` натисне зараз, — і переїжджає разом із перебором.
	 * Порядок береться з `config/themes`, того самого, з якого рахує обробник:
	 * копія тут розійшлася б із ним мовчки, і підказка вказувала б не туди.
	 *
	 * Мов дві, тож `L` завжди веде на ту, що не активна.
	 *
	 * `undefined` замість рядка, коли скорочення вимкнені: атрибут із порожнім
	 * значенням читалка все одно оголошує, і людина чула б про клавішу, якої
	 * зараз немає.
	 */
	const themeShortcut = $derived(nextTheme(ui.theme));
	const langShortcut = $derived($locale === 'en' ? 'uk' : 'en');

	/** `key` на елементі, який ця клавіша натисне зараз, — і нічого на решті. */
	function keyshortcut(key: 'T' | 'L', mine: boolean): string | undefined {
		return ui.hotkeysEnabled && mine ? key : undefined;
	}
</script>

<div
	class="dropdown-menu-unified header__settings-dropdown"
	class:mobile
	style={mobile ? mobileStyle : ''}
	data-testid={mobile ? 'settings-dropdown-mobile-menu' : 'header-settings-dropdown-menu'}
>
	<div class="dropdown-group-unified" data-testid="settings-lang{sfx}-fieldset">
		<span class="dropdown-label-unified">{$t("settings.language")}</span>
		<div class="dropdown-options-unified" data-testid="settings-lang{sfx}-options-list">
			<button
				class="dropdown-opt-unified"
				class:active={$locale === "uk"}
				onclick={() => onChangeLang("uk")}
				aria-keyshortcuts={keyshortcut('L', langShortcut === 'uk')}
				data-testid="lang-ua{sfx}-btn"
			>{$t("settings.langUA")}</button>
			<button
				class="dropdown-opt-unified"
				class:active={$locale === "en"}
				onclick={() => onChangeLang("en")}
				aria-keyshortcuts={keyshortcut('L', langShortcut === 'en')}
				data-testid="lang-en{sfx}-btn"
			>{$t("settings.langEN")}</button>
		</div>
	</div>
	<div class="dropdown-group-unified" data-testid="settings-theme{sfx}-fieldset">
		<span class="dropdown-label-unified">{$t("settings.theme")}</span>
		<!--
			Сітка, а не flex-wrap: перенос сам вирішував, скільки кнопок влізе, і
			на чотирьох темах давав 3+1 — одинока кнопка під рядком читається як
			«щось не вмістилося». Кількість колонок рахує `themeColumns`.
		-->
		<div
			class="dropdown-options-unified theme-options"
			style="--theme-cols: {themeCols}"
			data-testid="settings-theme{sfx}-options-list"
		>
			<button
				class="dropdown-opt-unified theme-opt"
				class:active={ui.theme === "light"}
				onclick={() => ui.setTheme("light")}
				aria-label={$t("settings.light")}
				aria-keyshortcuts={keyshortcut('T', themeShortcut === 'light')}
				data-theme-key="light"
				data-testid="theme-light{sfx}-btn"
			><Palette size={20} /></button>
			<button
				class="dropdown-opt-unified theme-opt"
				class:active={ui.theme === "light-yellow"}
				onclick={() => ui.setTheme("light-yellow")}
				aria-label={$t("settings.lightYellow") || "Light Yellow"}
				aria-keyshortcuts={keyshortcut('T', themeShortcut === 'light-yellow')}
				data-theme-key="light-yellow"
				data-testid="theme-light-yellow{sfx}-btn"
			><Sun size={20} /></button>
			{#if dev}
				<button
					class="dropdown-opt-unified theme-opt"
					class:active={ui.theme === "yellow"}
					onclick={() => ui.setTheme("yellow")}
					aria-label={$t("settings.yellow") || "dev-test-light-01"}
					title="dev-test-light-01"
					aria-keyshortcuts={keyshortcut('T', themeShortcut === 'yellow')}
					data-theme-key="yellow"
					data-testid="theme-yellow{sfx}-btn"
				><FlaskConical size={20} /></button>
			{/if}
			<button
				class="dropdown-opt-unified theme-opt"
				class:active={ui.theme === "dark"}
				onclick={() => ui.setTheme("dark")}
				aria-label={$t("settings.dark")}
				aria-keyshortcuts={keyshortcut('T', themeShortcut === 'dark')}
				data-theme-key="dark"
				data-testid="theme-dark{sfx}-btn"
			><Moon size={20} /></button>
			<button
				class="dropdown-opt-unified theme-opt"
				class:active={ui.theme === "dark-cyan"}
				onclick={() => ui.setTheme("dark-cyan")}
				aria-label={$t("settings.darkCyan") || "Dark Cyan"}
				aria-keyshortcuts={keyshortcut('T', themeShortcut === 'dark-cyan')}
				data-theme-key="dark-cyan"
				data-testid="theme-dark-cyan{sfx}-btn"
			><Waves size={20} /></button>
			{#if dev}
				<button
					class="dropdown-opt-unified theme-opt"
					class:active={ui.theme === "dark-blue"}
					onclick={() => ui.setTheme("dark-blue")}
					aria-label={$t("settings.darkBlue") || "dev-test-dark-01"}
					title="dev-test-dark-01"
					aria-keyshortcuts={keyshortcut('T', themeShortcut === 'dark-blue')}
					data-theme-key="dark-blue"
					data-testid="theme-dark-blue{sfx}-btn"
				><TestTube size={20} /></button>
			{/if}
		</div>
	</div>
	<!--
		WCAG SC 2.1.4 «Character Key Shortcuts», рівень A (HOTKEYS-v8 § 3).

		ПОЗА блоком `debugPanel` навмисно: той блок адміністратор може сховати
		налаштуванням, а разом із ним зник би єдиний спосіб вимкнути скорочення —
		тобто виконання критерію залежало б від чужого перемикача.

		Дві кнопки, кожна зі СВОЇМ значенням, а не одна на `toggle()`: пара в формі
		радіо, де обидві кнопки гортають прапорець, вимикає його при натисканні на
		вже активну — контрол робить протилежне своєму підпису.
	-->
	<div class="dropdown-group-unified" data-testid="settings-hotkeys{sfx}-fieldset">
		<span class="dropdown-label-unified">{$t("settings.hotkeys")}</span>
		<div class="dropdown-options-unified" data-testid="settings-hotkeys{sfx}-options-list">
			<button
				class="dropdown-opt-unified"
				class:active={!ui.hotkeysEnabled}
				onclick={() => ui.setHotkeysEnabled(false)}
				aria-pressed={!ui.hotkeysEnabled}
				data-testid="hotkeys-off{sfx}-btn"
			>{$t("settings.off")}</button>
			<button
				class="dropdown-opt-unified"
				class:active={ui.hotkeysEnabled}
				onclick={() => ui.setHotkeysEnabled(true)}
				aria-pressed={ui.hotkeysEnabled}
				data-testid="hotkeys-on{sfx}-btn"
			>{$t("settings.on")}</button>
		</div>
		<span class="dropdown-hint-unified" data-testid="settings-hotkeys{sfx}-hint">
			{$t("settings.hotkeysHint")}
		</span>
	</div>
</div>

{#if !debugPanel || debugPanel.visible}
<DebugSettingsDropdown
	{isOpen}
	{mobile}
	showBackground={debugPanel?.showBackground ?? true}
	showBlur={debugPanel?.showBlur ?? true}
	showScrollbar={debugPanel?.showScrollbar ?? true}
	testId={mobile ? "debug-settings-dropdown-menu-mobile" : undefined}
/>
{/if}

<style>
	/*
	 * Перекриває `display: flex` глобального `.dropdown-options-unified`:
	 * у мовної пари перенос не потрібен, а тут число колонок мусить бути задане
	 * явно, інакше рядок ділиться так, як влізе.
	 */
	.theme-options {
		display: grid;
		grid-template-columns: repeat(var(--theme-cols, 3), 1fr);
	}

	/* `flex: 1` із глобальних стилів у сітці зайвий: ширину задає колонка, а
	   `min-width: 0` не дає іконці розсунути її. */
	.theme-options :global(.dropdown-opt-unified) {
		flex: none;
		min-width: 0;
	}

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
