<script lang="ts">
	import Logo from "./Logo.svelte";
	import Ticker from "./Ticker.svelte";
	import HeaderSettingsPanel from "./HeaderSettingsPanel.svelte";
	import SettingsIcon from "./icons/SettingsIcon.svelte";
	import { Menu, X } from "lucide-svelte";
	import { fly, fade } from "svelte/transition";
	import { cubicInOut } from "svelte/easing";
	import { ui } from "$lib/states/ui.svelte";
	import { t, locale } from "svelte-i18n";
	import { page } from "$app/state";
	import { base } from "$app/paths";
	import { getHeaderSettings, getCachedHeaderSettings, DEFAULT_HEADER_SETTINGS, type HeaderSettings, type MenuConfig } from "$lib/services/settings";
	import { browser } from "$app/environment";
	import { untrack } from "svelte";

	let scrolled = $state(false);
	let settingsOpen = $state(false);
	let navOpen = $state(false);
	let settingsRef: HTMLDivElement | null = $state(null);
	let navRef: HTMLDivElement | null = $state(null);
	let showTicker = $state(false);

	$effect(() => {
		if (browser) {
			if (showTicker) {
				document.documentElement.style.setProperty('--ticker-height', '65px');
				document.documentElement.classList.add('ticker-active');
				
				const ticker = headerSettings.ticker;
				if (ticker?.enableGrayscale) {
					const strength = (ticker.grayscaleStrength ?? 60) / 100;
					const brightness = 1 - (strength * 0.2); // Dim slightly based on strength
					document.documentElement.style.setProperty('--ticker-grayscale', `${strength}`);
					document.documentElement.style.setProperty('--ticker-brightness', `${brightness}`);
				} else {
					document.documentElement.style.setProperty('--ticker-grayscale', '0');
					document.documentElement.style.setProperty('--ticker-brightness', '1');
				}
			} else {
				document.documentElement.style.setProperty('--ticker-height', '0px');
				document.documentElement.classList.remove('ticker-active');
			}
		}
	});

	// Try to load from localStorage cache first for instant render (no FOUC)
	const cached = browser ? getCachedHeaderSettings() : null;
	let headerSettings = $state<Omit<HeaderSettings, 'updatedAt'>>(cached ?? { ...DEFAULT_HEADER_SETTINGS });
	let headerReady = $state(!!cached);

	$effect(() => {
		getHeaderSettings().then(result => {
			if (result) {
				headerSettings = {
					cta:           result.cta           ?? DEFAULT_HEADER_SETTINGS.cta,
					headerBar:     result.headerBar     ?? DEFAULT_HEADER_SETTINGS.headerBar,
					navDropdown:   result.navDropdown   ?? DEFAULT_HEADER_SETTINGS.navDropdown,
					mobileOverlay: result.mobileOverlay ?? DEFAULT_HEADER_SETTINGS.mobileOverlay,
					debugPanel:    result.debugPanel    ?? DEFAULT_HEADER_SETTINGS.debugPanel,
					ticker:        result.ticker        ?? DEFAULT_HEADER_SETTINGS.ticker,
				};
			}
		}).catch(console.error).finally(() => {
			headerReady = true;
		});
	});

	$effect(() => {
		const handlePreview = (e: CustomEvent) => {
			untrack(() => {
				if (headerSettings) {
					headerSettings.ticker = { ...headerSettings.ticker, ...e.detail };
				}
			});
		};
		window.addEventListener('ticker-preview', handlePreview as EventListener);
		return () => window.removeEventListener('ticker-preview', handlePreview as EventListener);
	});

	// Smart interaction state: ignore click for 1s after hover open
	let lastNavHoverTime = 0;
	let lastSettingsHoverTime = 0;
	const CLICK_IGNORE_MS = 1000;

	function handleNavMouseEnter() {
		if (!navOpen) {
			if (settingsOpen) settingsOpen = false;
			navOpen = true;
			lastNavHoverTime = Date.now();
		}
	}

	function handleNavClick() {
		const now = Date.now();
		if (now - lastNavHoverTime < CLICK_IGNORE_MS) return;
		toggleNav();
	}

	function handleSettingsMouseEnter() {
		if (!settingsOpen) {
			if (navOpen) navOpen = false;
			settingsOpen = true;
			lastSettingsHoverTime = Date.now();
		}
	}

	function handleSettingsClick() {
		const now = Date.now();
		if (now - lastSettingsHoverTime < CLICK_IGNORE_MS) return;
		toggleSettings();
	}

	function toggleSettings() {
		if (navOpen) navOpen = false;
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
		itemType?: 'cta';
	}

	interface NavGroup {
		title?: string;
		titleHref?: string;
		items: NavItem[];
	}

	function resolvedHref(href: string | undefined, linkType: string): string {
		if (!href) return '#';
		if (linkType === 'url' || href.startsWith('http')) return href;
		if (linkType === 'article') return `${base}/news/${href}`;
		return `${base}${href}`;
	}

	function menuConfigToFlatItems(cfg: MenuConfig, lang: string): NavItem[] {
		return [
			...cfg.items
				.filter(it => it.visible)
				.sort((a, b) => a.order - b.order)
				.map(it => ({
					label: lang === 'uk' ? it.labelUk : it.labelEn,
					href: resolvedHref(it.href, it.linkType),
					itemType: it.itemType,
				})),
			...cfg.sections
				.filter(s => s.visible)
				.sort((a, b) => a.order - b.order)
				.flatMap(s =>
					s.items
						.filter(it => it.visible)
						.sort((a, b) => a.order - b.order)
						.map(it => ({
							label: lang === 'uk' ? it.labelUk : it.labelEn,
							href: resolvedHref(it.href, it.linkType),
							itemType: it.itemType,
						}))
				),
		];
	}

	function menuConfigToGroups(cfg: MenuConfig, lang: string): NavGroup[] {
		const groups: NavGroup[] = [];

		// flat root items → one headingless group (if any)
		const rootItems = cfg.items
			.filter(it => it.visible)
			.sort((a, b) => a.order - b.order)
			.map(it => ({
				label: lang === 'uk' ? it.labelUk : it.labelEn,
				href: resolvedHref(it.href, it.linkType),
				itemType: it.itemType,
			}));
		if (rootItems.length) groups.push({ items: rootItems });

		// sections
		cfg.sections
			.filter(s => s.visible)
			.sort((a, b) => a.order - b.order)
			.forEach(s => {
				groups.push({
					title: s.labelUk ? (lang === 'uk' ? s.labelUk : s.labelEn) : undefined,
					titleHref: s.href ? resolvedHref(s.href, s.linkType ?? 'page') : undefined,
					items: s.items
						.filter(it => it.visible)
						.sort((a, b) => a.order - b.order)
						.map(it => ({
							label: lang === 'uk' ? it.labelUk : it.labelEn,
							href: resolvedHref(it.href, it.linkType),
							itemType: it.itemType,
						})),
				});
			});

		return groups;
	}

	const navItems = $derived(menuConfigToFlatItems(headerSettings.headerBar, $locale ?? 'uk'));

	const navDropdownGroups = $derived(menuConfigToGroups(headerSettings.navDropdown, $locale ?? 'uk'));

	const mobileNavGroups = $derived(menuConfigToGroups(headerSettings.mobileOverlay, $locale ?? 'uk'));

	const ctaHref = $derived(resolvedHref(headerSettings.cta.href, headerSettings.cta.linkType));

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

<a href="#main-content" class="skip-link" data-testid="skip-content-link">
	Перейти до основного контенту
</a>

<header class="header" class:scrolled class:menu-open={ui.isMenuOpen} id="main-header" data-testid="header-container">
	{#if headerReady}
		<Ticker
			visible={headerSettings.ticker?.visible ?? true}
			mode={headerSettings.ticker?.mode ?? 'time'}
			startTime={headerSettings.ticker?.startTime ?? '09:00'}
			endTime={headerSettings.ticker?.endTime ?? '09:03'}
			preview={headerSettings.ticker?.preview ?? false}
			enableSound={headerSettings.ticker?.enableSound ?? false}
			bind:show={showTicker}
		/>
	{/if}
	<div class="header__inner">
		<div class="header__logo-area" data-testid="logo-area-container">
			<a
				href={`${base}/`}
				class="header__logo-link"
				aria-label="На головну"
				onclick={ui.closeMenu}
				data-testid="logo-home-link"
			>
				<Logo size="large" />
			</a>
		</div>

		<div class="header__bar" data-testid="header-bar-container">
			{#if headerReady}
		<div class="header__desktop-nav-group" data-testid="header-desktop-nav-group">
			<nav class="header__nav" aria-label="Головне меню" id="main-nav" data-testid="header-nav-menu">
				<ul class="header__nav-list" data-testid="nav-list-menu">
					{#each navItems as item, i}
						<li class="header__nav-item" data-testid={`nav-item-${i}-group`}> 
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

			{#if headerSettings.cta.visible}
			<a
				href={ctaHref}
				class="btn btn-outline header__cta"
				id="header-cta"
				data-testid="admission-cta-button"
			>
				{$locale === 'uk' ? headerSettings.cta.labelUk : headerSettings.cta.labelEn}
			</a>
			{/if}

			<!-- Desktop Nav Manager (Burger) -->
			<div 
				class="header__nav-manager" 
				bind:this={navRef} 
				data-testid="header-nav-manager-group"
				onmouseenter={handleNavMouseEnter}
				role="group"
			>
				<button
					class="header__burger header__burger--desktop"
					class:open={navOpen}
					onclick={handleNavClick}
					aria-label="Відкрити меню"
					aria-expanded={navOpen}
					data-testid="burger-menu-button"
				>
					<Menu size={24} />
				</button>

				{#if navOpen}
					<div 
						class="dropdown-menu-unified header__nav-dropdown" 
						data-testid="nav-dropdown-menu" 
						in:fly={{ y: 10, duration: 200 }} 
						out:fly={{ y: 10, duration: 150 }}
						onmouseleave={closeNav}
						role="menu"
						tabindex="-1"
					>
					{#each navDropdownGroups as group, gIndex}
						<div class="header__nav-dropdown-group" data-testid={`nav-dropdown-group-${gIndex}`}>
							{#if group.title}
								{#if group.titleHref}
									<a href={group.titleHref} class="dropdown-label-unified header__nav-dropdown-label header__nav-dropdown-label--link">{group.title}</a>
								{:else}
									<span class="dropdown-label-unified header__nav-dropdown-label">{group.title}</span>
								{/if}
							{/if}
							<ul class="header__nav-dropdown-list">
								{#each group.items as item, i}
									<li>
										<a 
											href={item.href} 
											class="header__nav-dropdown-link" 
											class:header__nav-dropdown-cta={item.itemType === 'cta'}
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
							{#if gIndex < navDropdownGroups.length - 1}
								<div class="header__nav-dropdown-divider"></div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Desktop Settings -->
			<div 
				class="header__settings header__settings--desktop" 
				class:open={settingsOpen} 
				bind:this={settingsRef} 
				data-testid="header-settings-container"
				onmouseenter={handleSettingsMouseEnter}
				role="group"
				aria-label="Налаштування"
			>
				<button 
					class="header__burger" 
					aria-label="Налаштування" 
					onclick={handleSettingsClick} 
					aria-expanded={settingsOpen} 
					data-testid="header-settings-button"
				>
					<SettingsIcon size={24} />
				</button>
				{#if settingsOpen}
					<div 
						class="header__settings-popover" 
						onmouseleave={closeSettings} 
						role="presentation" 
						data-testid="settings-popover-menu"
					>
						<HeaderSettingsPanel
							isOpen={settingsOpen}
							onChangeLang={changeLanguage}
							onToggleTheme={toggleTheme}
							debugPanel={headerSettings.debugPanel}
						/>
					</div>
				{/if}
			</div>
		</div>

		<button
			class="header__burger header__burger--mobile"
			onclick={() => { settingsOpen = false; ui.toggleMenu(); }}
			aria-label="Відкрити меню"
			aria-expanded={ui.isMenuOpen}
			id="burger-menu"
			data-testid="burger-menu-mobile-button"
		>
			<span class="header__burger-text">МЕНЮ</span>
			<Menu size={20} />
		</button>
		{/if}
	</div>
	</div>

	{#if ui.isMenuOpen}
		<div
			class="header__mobile-backdrop"
			in:fade={{ duration: 150, easing: cubicInOut }}
			out:fade={{ duration: 200, delay: 100, easing: cubicInOut }}
			data-testid="mobile-backdrop"
		></div>
		<div
			class="header__mobile-overlay"
			role="dialog"
			aria-modal="true"
			in:fly={{ y: -24, duration: 260, opacity: 0.2, easing: cubicInOut, delay: 100 }}
			out:fly={{ y: -24, duration: 220, opacity: 0.2, easing: cubicInOut }}
			data-testid="mobile-overlay-container"
		>
			<div class="header__mobile-controls" data-testid="mobile-controls-group">
				<div class="header__settings header__settings--mobile" class:open={settingsOpen} bind:this={settingsRef} data-testid="header-settings-mobile-container">
					<button class="header__settings-btn" aria-label="Налаштування" onclick={toggleSettings} aria-expanded={settingsOpen} data-testid="settings-mobile-button">
						<SettingsIcon size={24} />
					</button>
					{#if settingsOpen}
						<div class="header__settings-popover header__settings-popover--mobile" data-testid="settings-popover-mobile-menu">
							<HeaderSettingsPanel
								isOpen={settingsOpen}
								mobile
								onChangeLang={changeLanguage}
								onToggleTheme={toggleTheme}
								debugPanel={headerSettings.debugPanel}
							/>
						</div>
					{/if}
				</div>

				<button
					class="header__mobile-close"
					onclick={ui.closeMenu}
					aria-label="Закрити меню"
					data-testid="mobile-close-button"
				>
					<X size={24} />
				</button>
			</div>

			<nav aria-label="Мобільне меню" data-testid="mobile-nav-menu" class="header__mobile-nav">
				<div class="header__mobile-container" data-testid="mobile-nav-container">
					<ul class="header__mobile-list" data-testid="mobile-nav-list-menu">
						{#each mobileNavGroups as group, gIndex}
							<li class="header__mobile-group" data-testid={`mobile-nav-group-${gIndex}`}>
								{#if group.title}
									{#if group.titleHref}
										<a href={group.titleHref} class="header__mobile-group-title header__mobile-group-title--link">{group.title}</a>
									{:else}
										<h3 class="header__mobile-group-title">{group.title}</h3>
									{/if}
								{/if}
								<ul class="header__mobile-sublist">
									{#each group.items as item, i}
										<li data-testid={`mobile-nav-item-${gIndex}-${i}-group`}>
											<a
												href={item.href}
												class="header__mobile-link"
												class:header__mobile-cta={item.itemType === 'cta'}
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
		flex-direction: column;
		align-items: stretch;
		padding: 0;
		transition: all var(--transition-base);
	}

	.header__inner {
		position: relative;
		width: 100%;
		display: flex;
		align-items: flex-start;
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
		to { opacity: 1; }
	}

	.header__bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-xl);
		width: 100%;
		padding: var(--space-lg) var(--space-xl) var(--space-lg) 200px;
		transition: all var(--transition-base);
		position: relative;
		animation: fadeInDown 0.8s ease-out backwards;
		box-shadow: 0 1px 2px rgba(0,0,0,0.03);
	}

	.header__bar::before {
		content: "";
		position: absolute;
		inset: 0;
		z-index: -1;
		/* background and blur moved to .header-blur-layer in +layout.svelte
		   so child dropdowns can use backdrop-filter without compositing conflicts */
	}

	.header__desktop-nav-group {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xl);
		flex: 1;
		margin-right: 0;
	}

	.scrolled .header__bar {
		padding-top: var(--space-md);
		padding-bottom: var(--space-md);
		box-shadow: var(--shadow-sm);
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
	}

	.header__nav-dropdown {
		position: absolute;
		top: calc(100% + 25px);
		right: 0;
		width: 280px;
	}

	.header__nav-dropdown-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}



	.header__nav-dropdown-label {
		margin-bottom: 2px;
	}

	.header__nav-dropdown-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.header__nav-dropdown-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-deep-ocean);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		text-transform: none;
	}

	:global(.dark-theme) .header__nav-dropdown-link {
		color: var(--color-dark-text);
	}

	.header__nav-dropdown-link:hover,
	.header__nav-dropdown-link.active {
		background: var(--color-ice-blue);
		color: var(--color-sea-blue);
		padding-left: var(--space-md);
	}

	:global(.dark-theme) .header__nav-dropdown-link:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.header__nav-dropdown-cta {
		background: var(--color-sea-blue);
		color: var(--color-white) !important;
		justify-content: center;
		text-align: center;
		margin-bottom: var(--space-xs);
	}

	.header__nav-dropdown-divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.05);
		margin: 2px 0;
	}

	:global(.dark-theme) .header__nav-dropdown-divider {
		background: rgba(255, 255, 255, 0.1);
	}

	.header__settings {
		position: relative;
		margin-left: var(--space-sm);
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

	:global(.dark-theme) .header__settings-btn {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-dark-text);
	}

	.header__settings.open .header__settings-btn {
		background: var(--color-sky-blue);
		transform: rotate(45deg);
	}

	.header__settings-popover {
		position: absolute;
		top: 100%;
		right: 0;
		padding-top: 25px;
		/* z-index removed: it was creating an intermediate stacking context that
		   prevented backdrop-filter on child dropdowns from seeing page content */
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.header__cta {
		font-size: 0.8rem;
		padding: 0.6rem 1.5rem;
		transition: all var(--transition-base);
		color: var(--color-deep-ocean);
		border-color: var(--color-deep-ocean);
	}

	:global(.dark-theme) .header__cta {
		color: var(--color-dark-text);
		border-color: var(--color-dark-text);
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
		background: var(--color-surface);
		box-shadow: 0 4px 15px rgba(0,0,0,0.08);
	}

	:global(.dark-theme) .header__burger--mobile {
		background: var(--color-dark-card);
		color: var(--color-dark-text);
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
		z-index: 400;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: var(--space-2xl) var(--space-xl);
		background: transparent;
	}

	.header__mobile-backdrop {
		position: fixed;
		inset: 0;
		z-index: 390;
		background: color-mix(in srgb, var(--color-surface), transparent 2%);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	:global(.dark-theme) .header__mobile-backdrop {
		background: color-mix(in srgb, var(--color-dark-bg), transparent 5%);
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

	.header__settings-popover--mobile {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		margin: auto;
		height: fit-content;
		width: 90%;
		max-width: 320px;
		padding: 0;
		z-index: 500;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
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

	:global(.dark-theme) .header__mobile-close {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-dark-text);
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

	:global(.dark-theme) .header__mobile-link {
		color: var(--color-dark-text);
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
		.header__bar { padding-left: 160px; }
		.header__logo-area { left: 15px; }
	}

	@media (max-width: 768px) {
		.header__nav, .header__cta, .header__burger--desktop, .header__settings--desktop {
			display: none;
		}
		.header__desktop-nav-group { display: none; }
		.header__burger--mobile { display: flex; }
		.header__bar { padding-left: 120px; }
		.header__logo-area { top: 5px; left: 10px; transform: scale(1); }
		.header__logo-area :global(.logo-svg) { width: 90px; height: 90px; }
		.scrolled .header__logo-area { transform: scale(0.8); top: 0; }
	}
</style>
