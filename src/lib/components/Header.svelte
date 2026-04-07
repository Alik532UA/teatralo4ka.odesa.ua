<script lang="ts">
	import Logo from "./Logo.svelte";
	import DebugSettingsDropdown from "./DebugSettingsDropdown.svelte";
	import SettingsIcon from "./icons/SettingsIcon.svelte";
	import { Menu, X } from "lucide-svelte";
	import { fly } from "svelte/transition";
	import { cubicInOut } from "svelte/easing";
	import { ui } from "$lib/states/ui.svelte";
	import { t, locale } from "svelte-i18n";
	import { page } from "$app/state";
	import { base } from "$app/paths";

	let scrolled = $state(false);
	let settingsOpen = $state(false);
	let navOpen = $state(false);
	let settingsRef: HTMLDivElement | null = $state(null);
	let navRef: HTMLDivElement | null = $state(null);

	function toggleSettings() {
		// Toggle logic stays simple
		settingsOpen = !settingsOpen;
	}

	function toggleNav() {
		if (settingsOpen) settingsOpen = false;
		navOpen = !navOpen;
	}

	function closeSettings() {
		settingsOpen = false;
	}

	function closeNav() {
		navOpen = false;
	}

	function toggleTheme() {
		const newTheme = ui.theme === "light" ? "dark" : "light";
		ui.setTheme(newTheme);
	}

	async function changeLanguage(lang: string) {
		if (ui.enableBlurEffect) {
			ui.isLangChanging = true;
			await new Promise((r) => setTimeout(r, 300));
		}

		locale.set(lang);

		if (ui.enableBlurEffect) {
			setTimeout(() => {
				ui.isLangChanging = false;
			}, 300);
		}
	}

	interface NavItem {
		label: string;
		href: string;
		type?: 'cta';
	}

	const navItems: NavItem[] = $derived([
		{ label: $t("nav.home"), href: `${base}/` },
		{ label: $t("nav.about"), href: `${base}/about` },
		{ label: $t("nav.history"), href: `${base}/history` },
		{ label: $t("nav.contacts"), href: `${base}/contacts` },
	]);

	interface NavGroup {
		title?: string;
		items: NavItem[];
	}

	const mobileNavGroups: NavGroup[] = $derived([
		{
			items: [
				{ label: $t("nav.admission"), href: `${base}/admission`, type: 'cta' },
				{ label: $t("nav.home"), href: `${base}/` },
				{ label: $t("nav.contacts"), href: `${base}/contacts` },
				{ label: $t("nav.history"), href: `${base}/history` },
			]
		},
		{
			title: $t("nav.departments"),
			items: [
				{ label: $t("nav.theatre"), href: `${base}/departments/theatre` },
				{ label: $t("nav.aesthetic"), href: `${base}/departments/aesthetic` },
				{ label: $t("nav.music"), href: `${base}/departments/music` },
				{ label: $t("nav.art"), href: `${base}/departments/art` },
			]
		},
		{
			title: $t("nav.residents"),
			items: [
				{ label: $t("nav.adults"), href: `${base}/residents/adults` },
				{ label: $t("nav.kids"), href: `${base}/residents/kids` },
				{ label: $t("nav.graduates"), href: `${base}/residents/graduates` },
			]
		},
		{
			items: [
				{ label: $t("nav.projects"), href: `${base}/projects` },
			]
		}
	]);

	$effect(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 20;
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	});

	$effect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (settingsOpen && settingsRef && !settingsRef.contains(e.target as Node)) {
				closeSettings();
			}
			if (navOpen && navRef && !navRef.contains(e.target as Node)) {
				closeNav();
			}
		};

		if (settingsOpen || navOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	});
</script>

<a href="#main-content" class="skip-link" data-testid="skip-link">
	Перейти до основного контенту
</a>

<header class="header" class:scrolled class:menu-open={ui.isMenuOpen} id="main-header" data-testid="header-container">
	<div class="header__logo-area" data-testid="logo-area">
		<a
			href={`${base}/`}
			class="header__logo-link"
			aria-label="На головну"
			onclick={ui.closeMenu}
			data-testid="logo-link"
		>
			<Logo size="large" />
		</a>
	</div>

	<div class="header__bar" data-testid="header-bar">
		<div class="header__left-placeholder"></div>
		<div class="header__desktop-nav-group">
			<nav class="header__nav" aria-label="Головне меню" id="main-nav" data-testid="main-nav">
				<ul class="header__nav-list" data-testid="nav-list">
					{#each navItems as item, i}
						<li class="header__nav-item" data-testid={`nav-item-${i}`}> 
							<a
								href={item.href}
								class="header__nav-link"
								class:active={page.url.pathname === item.href}
								data-testid={`nav-link-${i}`}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<a
				href={`${base}/admission`}
				class="btn btn-outline header__cta"
				id="header-cta"
				data-testid="admission-cta"
			>
				{$t("nav.admission")}
			</a>

			<div class="header__nav-manager" bind:this={navRef} data-testid="header-nav-manager">
				<button
					class="header__burger header__burger--desktop"
					class:open={navOpen}
					onclick={toggleNav}
					onmouseenter={() => { if (!navOpen) navOpen = true; }}
					aria-label="Відкрити меню"
					aria-expanded={navOpen}
					data-testid="burger-menu-btn"
				>
					<Menu size={24} />
				</button>

				{#if navOpen}
					<div 
						class="header__nav-dropdown" 
						data-testid="nav-dropdown" 
						role="menu"
						tabindex="-1"
						in:fly={{ y: 10, duration: 200 }} 
						out:fly={{ y: 10, duration: 150 }}
						onmouseleave={closeNav}
					>
						{#each mobileNavGroups as group, gIndex}
							<div class="header__nav-dropdown-group" class:header__nav-dropdown-group--hidden={gIndex === 0}>
								{#if group.title}
									<span class="header__nav-dropdown-label">{group.title}</span>
								{/if}
								<ul class="header__nav-dropdown-list">
									{#each group.items as item, i}
										<li>
											<a 
												href={item.href} 
												class="header__nav-dropdown-link" 
												class:header__nav-dropdown-cta={item.type === 'cta'}
												class:active={page.url.pathname === item.href}
												onclick={closeNav}
												data-testid={`nav-dropdown-link-${gIndex}-${i}`}
											>
												{item.label}
											</a>
										</li>
									{/each}
								</ul>
							</div>
							{#if gIndex < mobileNavGroups.length - 1 && gIndex !== 0}
								<div class="header__nav-dropdown-divider"></div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Desktop Settings Button (moved from dropdown) -->
			<div class="header__settings" class:open={settingsOpen} bind:this={settingsRef} data-testid="header-settings">
				<button class="header__settings-btn" aria-label="Налаштування" onclick={toggleSettings} aria-expanded={settingsOpen} data-testid="settings-btn">
					<SettingsIcon size={24} />
				</button>
				{#if settingsOpen}
					<div class="header__settings-popover">
						<div class="header__settings-dropdown" data-testid="settings-dropdown">
							<div class="header__settings-group">
								<span class="header__settings-label">{$t("settings.language")}</span>
								<div class="header__settings-options">
									<button class="header__settings-opt" class:active={$locale === "uk"} onclick={() => changeLanguage("uk")}>UA</button>
									<button class="header__settings-opt" class:active={$locale === "en"} onclick={() => changeLanguage("en")}>EN</button>
								</div>
							</div>
							<div class="header__settings-group">
								<span class="header__settings-label">{$t("settings.theme")}</span>
								<div class="header__settings-options">
									<button class="header__settings-opt" class:active={ui.theme === "light"} onclick={() => { if (ui.theme === "light") return; toggleTheme(); }}>{$t("settings.light")}</button>
									<button class="header__settings-opt" class:active={ui.theme === "dark"} onclick={() => { if (ui.theme === "dark") return; toggleTheme(); }}>{$t("settings.dark")}</button>
								</div>
							</div>
						</div>
						<DebugSettingsDropdown isOpen={settingsOpen} />
					</div>
				{/if}
			</div>
		</div>

		<div class="header__actions-group">
			<button
				class="header__burger header__burger--mobile"
				onclick={() => { settingsOpen = false; ui.toggleMenu(); }}
				aria-label="Відкрити меню"
				aria-expanded={ui.isMenuOpen}
				id="burger-menu"
				data-testid="burger-menu-btn-mobile"
			>
				<span class="header__burger-text">МЕНЮ</span>
				<Menu size={20} />
			</button>
		</div>
	</div>

	{#if ui.isMenuOpen}
		<div
			class="header__mobile-overlay"
			role="dialog"
			aria-modal="true"
			in:fly={{ y: -24, duration: 260, opacity: 0.2, easing: cubicInOut }}
			out:fly={{ y: -24, duration: 220, opacity: 0.2, easing: cubicInOut }}
			data-testid="mobile-overlay"
		>
			<div class="header__mobile-controls">
				<div class="header__settings header__settings--mobile" class:open={settingsOpen} bind:this={settingsRef} data-testid="header-settings">
					<button class="header__settings-btn" aria-label="Налаштування" onclick={toggleSettings} aria-expanded={settingsOpen} data-testid="settings-btn">
						<SettingsIcon size={24} />
					</button>
					{#if settingsOpen}
						<div class="header__settings-popover">
							<div class="header__settings-dropdown">
								<div class="header__settings-group">
									<span class="header__settings-label">{$t("settings.language")}</span>
									<div class="header__settings-options">
										<button class="header__settings-opt" class:active={$locale === "uk"} onclick={() => changeLanguage("uk")}>UA</button>
										<button class="header__settings-opt" class:active={$locale === "en"} onclick={() => changeLanguage("en")}>EN</button>
									</div>
								</div>
								<div class="header__settings-group">
									<span class="header__settings-label">{$t("settings.theme")}</span>
									<div class="header__settings-options">
										<button class="header__settings-opt" class:active={ui.theme === "light"} onclick={() => { if (ui.theme === "dark") toggleTheme(); }}>{$t("settings.light")}</button>
										<button class="header__settings-opt" class:active={ui.theme === "dark"} onclick={() => { if (ui.theme === "light") toggleTheme(); }}>{$t("settings.dark")}</button>
									</div>
								</div>
							</div>
							<DebugSettingsDropdown isOpen={settingsOpen} />
						</div>
					{/if}
				</div>

				<button
					class="header__mobile-close"
					onclick={ui.closeMenu}
					aria-label="Закрити меню"
					data-testid="mobile-close-btn"
				>
					<X size={24} />
				</button>
			</div>

			<nav aria-label="Мобільне меню" data-testid="mobile-nav" class="header__mobile-nav">
				<div class="header__mobile-container">
					<ul class="header__mobile-list" data-testid="mobile-nav-list">
						{#each mobileNavGroups as group, gIndex}
							<li class="header__mobile-group">
								{#if group.title}
									<h3 class="header__mobile-group-title">{group.title}</h3>
								{/if}
								<ul class="header__mobile-sublist">
									{#each group.items as item, i}
										<li data-testid={`mobile-nav-item-${gIndex}-${i}`}>
											<a
												href={item.href}
												class="header__mobile-link"
												class:header__mobile-cta={item.type === 'cta'}
												class:active={page.url.pathname === item.href}
												onclick={ui.closeMenu}
												data-testid={`mobile-nav-link-${gIndex}-${i}`}
											>
												{item.label}
											</a>
										</li>
									{/each}
								</ul>
								{#if gIndex < mobileNavGroups.length - 1}
									<div class="header__mobile-divider"></div>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			</nav>
		</div>
	{/if}
</header>

<style>
	.skip-link {
		position: absolute;
		top: -100%;
		left: var(--space-md);
		background: var(--color-deep-ocean);
		color: var(--color-white);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		z-index: 200;
		font-size: 0.875rem;
		font-weight: 700;
		text-decoration: none;
		transition: top var(--transition-fast);
	}

	.skip-link:focus {
		top: var(--space-sm);
	}

	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		display: flex;
		align-items: flex-start;
		padding: 0;
		transition: all var(--transition-base);
	}

	.header__logo-area {
		position: absolute;
		top: 15px;
		left: 35px;
		z-index: 300;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		transform-origin: top left;
		transform: scale(1.3);
	}

	.header__logo-area:hover {
		transform: scale(1.35);
	}

	.header__logo-link {
		display: block;
		line-height: 0;
	}

	.scrolled .header__logo-area {
		transform: scale(0.85);
		top: 5px;
		left: 20px;
	}

	@keyframes fadeInDown {
		from { opacity: 0; transform: translateY(-30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.header__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-xl);
		width: 100%;
		padding: var(--space-lg) var(--space-xl) var(--space-lg) 0;
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
		position: relative;
		animation: fadeInDown 0.8s ease-out both;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	:global(.dark-theme) .header__bar {
		background: rgba(15, 23, 42, 0.7);
	}

	.header__left-placeholder {
		width: 200px;
		flex-shrink: 0;
	}

	.header__desktop-nav-group {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xl);
		flex: 1;
	}

	.header__actions-group {
		width: 200px;
		flex-shrink: 0;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: var(--space-sm);
	}

	.scrolled .header__bar {
		padding-top: var(--space-md);
		padding-bottom: var(--space-md);
		box-shadow: var(--shadow-md);
	}

	.header__nav-list {
		display: flex;
		align-items: center;
		gap: var(--space-2xl);
	}

	.header__nav-link {
		font-family: var(--font-heading);
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-dark-text);
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-sm);
		transition: color var(--transition-fast);
		position: relative;
	}

	.header__nav-link:hover,
	.header__nav-link.active {
		color: var(--color-sea-blue);
	}

	.header__nav-link.active::after {
		content: "";
		position: absolute;
		bottom: -2px;
		left: var(--space-md);
		right: var(--space-md);
		height: 2px;
		background: var(--color-sea-blue);
		border-radius: 1px;
	}

	.header__nav-manager {
		position: relative;
		z-index: 320;
	}

	.header__nav-dropdown {
		position: absolute;
		top: calc(100% + 15px);
		right: 0;
		width: 280px;
		background: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		z-index: 330;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.header__nav-dropdown-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.header__nav-dropdown-group--hidden {
		display: none;
	}

	.header__nav-dropdown-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-muted-text);
		letter-spacing: 0.05em;
		margin-bottom: 2px;
	}

	.header__nav-dropdown-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.header__nav-dropdown-link {
		display: block;
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-deep-ocean);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.header__nav-dropdown-link:hover,
	.header__nav-dropdown-link.active {
		background: var(--color-ice-blue);
		color: var(--color-sea-blue);
		padding-left: var(--space-md);
	}

	.header__nav-settings-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		border: none;
		background: none;
		cursor: pointer;
		font-family: inherit;
		text-transform: uppercase;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-muted-text);
		letter-spacing: 0.05em;
	}

	.header__nav-settings-toggle:hover {
		color: var(--color-sea-blue);
	}

	.header__nav-dropdown-cta {
		background: var(--color-sea-blue);
		color: var(--color-white) !important;
		text-align: center;
		margin-bottom: var(--space-xs);
	}

	.header__nav-dropdown-divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.05);
		margin: 2px 0;
	}

	.header__settings {
		position: relative;
		margin-left: var(--space-sm);
		z-index: 320;
	}

	.header__settings-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-deep-ocean);
		transition: all var(--transition-base);
		background: var(--color-ice-blue);
		border: none;
		cursor: pointer;
	}

	.header__settings.open .header__settings-btn {
		background: var(--color-sky-blue);
		transform: rotate(45deg);
	}

	.header__settings-popover {
		position: absolute;
		top: 100%;
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		z-index: 330;
		padding-top: 10px;
	}

	.header__settings-dropdown {
		position: static;
		width: 220px;
		background: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: var(--space-md);
		z-index: 331;
	}

	.header__settings-group {
		margin-bottom: var(--space-md);
	}

	.header__settings-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-muted-text);
		text-transform: uppercase;
		margin-bottom: var(--space-xs);
		letter-spacing: 0.05em;
	}

	.header__settings-options {
		display: flex;
		gap: var(--space-xs);
		background: var(--color-ice-blue);
		padding: 4px;
		border-radius: var(--radius-md);
	}

	.header__settings-opt {
		flex: 1;
		padding: 6px;
		font-size: 0.8rem;
		font-weight: 700;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		color: var(--color-deep-ocean);
		border: none;
		cursor: pointer;
		background: transparent;
	}

	.header__settings-opt.active {
		background: var(--color-white);
		box-shadow: var(--shadow-sm);
		color: var(--color-golden);
	}

	.header__cta {
		font-size: 0.8rem;
		padding: 0.6rem 1.5rem;
		transition: all var(--transition-base);
		color: var(--color-deep-ocean);
		border-color: var(--color-deep-ocean);
	}

	.header__cta:hover {
		transform: scale(1.03);
		background: var(--color-deep-ocean);
		color: var(--color-white);
	}

	.header__burger {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-deep-ocean);
		background: var(--color-ice-blue);
		transition: all var(--transition-base);
		border: none;
		cursor: pointer;
	}

	.header__burger--mobile {
		display: none;
		padding: 0 1.2rem;
		width: auto;
		border-radius: var(--radius-full);
		background: var(--color-white);
		box-shadow: 0 4px 15px rgba(0,0,0,0.08);
	}

	.header__burger-text {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 0.85rem;
		letter-spacing: 0.05em;
		margin-right: 0.5rem;
	}

	.header__mobile-overlay {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, var(--color-white), transparent 2%);
		backdrop-filter: blur(20px);
		z-index: 400;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: var(--space-2xl) var(--space-xl);
	}

	.header__mobile-controls {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2xl);
		position: relative;
		z-index: 420;
	}

	.header__mobile-controls .header__settings {
		margin-left: 0;
	}

	.header__mobile-controls .header__settings-dropdown {
		left: 0;
		right: auto;
	}

	.header__mobile-close {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-deep-ocean);
		background: var(--color-ice-blue);
		transition: all var(--transition-base);
		border: none;
		cursor: pointer;
	}

	.header__mobile-nav {
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.header__mobile-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		list-style: none;
		padding: 0;
	}

	.header__mobile-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		align-items: center;
	}

	.header__mobile-group-title {
		font-family: var(--font-heading);
		font-size: 0.9rem;
		text-transform: uppercase;
		opacity: 0.5;
	}

	.header__mobile-sublist {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		list-style: none;
		padding: 0;
		width: 100%;
	}

	.header__mobile-link {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
		transition: all var(--transition-fast);
		text-align: center;
		display: block;
		padding: 0.5rem;
	}

	.header__mobile-link:hover, .header__mobile-link.active {
		color: var(--color-vibrant-blue);
		transform: scale(1.05);
	}

	.header__mobile-cta {
		background: var(--color-sea-blue);
		color: var(--color-white) !important;
		padding: 0.8rem 2rem;
		border-radius: var(--radius-full);
		box-shadow: 0 4px 15px rgba(33, 150, 186, 0.3);
	}

	.header__mobile-divider {
		width: 60px;
		height: 2px;
		background: var(--color-sky-blue);
		opacity: 0.3;
		margin-top: var(--space-md);
	}

	@media (max-width: 1024px) {
		.header__left-placeholder, .header__actions-group { width: 160px; }
		.header__logo-area { left: 15px; }
	}

	@media (max-width: 768px) {
		.header__nav, .header__cta, .header__burger--desktop {
			display: none;
		}
		.header__desktop-nav-group, .header__left-placeholder { display: none; }
		.header__burger--mobile { display: flex; }
		.header__bar { justify-content: flex-end; }
		.header__actions-group { width: auto; }
		.header__logo-area { top: 5px; left: 10px; transform: scale(1); }
		.header__logo-area :global(.logo-svg) { width: 90px; height: 90px; }
		.scrolled .header__logo-area { transform: scale(0.8); top: 0; }
	}
</style>
