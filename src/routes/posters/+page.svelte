<script lang="ts">
	import { onMount } from 'svelte';
	import { locale, t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { replaceState } from '$app/navigation';
	import { seo } from '$lib/services/seo.svelte';
	import { fullscreen } from '$lib/services/fullscreen.svelte';
	import { POSTERS_LIST, DEFAULT_POSTER_THEME, type PosterId } from '$lib/data/posters';
	import DanceStudioPoster from '$lib/components/posters/DanceStudioPoster.svelte';
	import DigitalAnniversaryPoster from '$lib/components/posters/DigitalAnniversaryPoster.svelte';
	import PosterThemePicker from '$lib/components/posters/PosterThemePicker.svelte';
	import { Printer, Expand, Shrink, Sparkles, LayoutList } from 'lucide-svelte';

	const lang = $derived($locale === 'en' ? 'en' : 'uk');
	const isEn = $derived(lang === 'en');

	let activePoster = $state<PosterId>('dance-studio');
	let selectedTheme = $state<string>(DEFAULT_POSTER_THEME);
	let fullscreenButton = $state<HTMLButtonElement | null>(null);

	onMount(() => {
		const param = page.url.searchParams.get('poster') as PosterId | null;
		if (param && (param === 'dance-studio' || param === 'anniversary-28')) {
			activePoster = param;
		}
		const themeParam = page.url.searchParams.get('theme');
		if (themeParam) {
			selectedTheme = themeParam;
		}
	});

	function selectPoster(id: PosterId) {
		activePoster = id;
		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.set('poster', id);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(resolve('/posters') + nextUrl.search + nextUrl.hash, page.state);
	}

	function selectTheme(themeId: string) {
		selectedTheme = themeId;
		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.set('theme', themeId);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(resolve('/posters') + nextUrl.search + nextUrl.hash, page.state);
	}

	function handlePrint() {
		window.print();
	}

	// Повний екран через сервіс fullscreen
	$effect(() => {
		const stopWatching = fullscreen.watch();
		return () => {
			stopWatching();
			if (fullscreen.active) fullscreen.toggle();
			document.body.classList.remove('posters-fullscreen');
		};
	});

	$effect(() => {
		document.body.classList.toggle('posters-fullscreen', fullscreen.active);
	});

	let lastFullscreen = false;
	$effect(() => {
		const active = fullscreen.active;
		const button = fullscreenButton;
		if (active === lastFullscreen) return;
		lastFullscreen = active;
		if (button && (!document.activeElement || document.activeElement === document.body)) {
			button.focus();
		}
	});

	$effect(() => {
		seo.update({
			title: isEn
				? `School Posters - ${$t('seo.brandTitle')}`
				: `Афіші школи - Цифрові плакати та роздруківка - ${$t('seo.brandTitle')}`,
			description: isEn
				? 'Official digital posters and playbills of Odesa Children’s Theatre School: dance collective enrollment, interactive view, and A4 print.'
				: 'Офіційні цифрові афіші Одеської дитячої театральної школи: набір у танцювальний колектив, цифровий перегляд та роздруківка у форматі A4.'
		});
	});
</script>

<div class="posters-page" data-testid="posters-page-section">
	<div class="container posters-container">
		<!-- Панель управління та перемикач афіш -->
		<header class="posters-header">
			<div class="header-intro">
				<div class="header-badge">
					<Sparkles size={14} aria-hidden="true" />
					<span>{isEn ? 'Digital Playbills & Posters' : 'Цифрові афіші та плакати'}</span>
				</div>
				<h1 class="header-title" data-testid="posters-page-title">
					{isEn ? 'School Posters' : 'Афіші школи'}
				</h1>
				<p class="header-lead">
					{isEn
						? 'Interactive vector posters with high-quality A4 printing support.'
						: 'Цифрові фірмові афіші Одеської дитячої театральної школи з підтримкою якісного друку формату A4.'}
				</p>
			</div>

			<!-- Панель дій та вкладок -->
			<div class="posters-toolbar" data-testid="posters-toolbar">
				<!-- Перемикач афіш -->
				<div class="poster-tabs" role="tablist" aria-label={isEn ? 'Choose poster' : 'Оберіть афішу'}>
					{#each POSTERS_LIST as item (item.id)}
						<button
							type="button"
							role="tab"
							aria-selected={activePoster === item.id}
							class="tab-btn"
							class:tab-btn--active={activePoster === item.id}
							onclick={() => selectPoster(item.id)}
							data-testid={`poster-tab-${item.id}-btn`}
						>
							<LayoutList size={16} aria-hidden="true" />
							<span class="tab-label">{isEn ? item.titleEn : item.titleUk}</span>
							{#if item.dateBadgeUk}
								<span class="tab-badge">{isEn ? item.dateBadgeEn : item.dateBadgeUk}</span>
							{/if}
						</button>
					{/each}
				</div>

				<!-- Дії: Вибір фону, Друк та Повний екран -->
				<div class="poster-actions">
					{#if activePoster === 'dance-studio'}
						<PosterThemePicker
							{selectedTheme}
							{isEn}
							onSelect={selectTheme}
						/>
					{/if}

					<button
						type="button"
						class="action-btn action-btn--print"
						onclick={handlePrint}
						title={isEn ? 'Print A4 poster or save as PDF' : 'Роздрукувати афішу A4 або зберегти у PDF'}
						data-testid="posters-print-btn"
					>
						<Printer size={16} aria-hidden="true" />
						<span>{isEn ? 'Print A4' : 'Роздрукувати A4'}</span>
					</button>

					<button
						type="button"
						bind:this={fullscreenButton}
						class="action-btn action-btn--fullscreen"
						onclick={() => fullscreen.toggle()}
						title={fullscreen.active
							? (isEn ? 'Exit fullscreen' : 'Вийти з повного екрана')
							: (isEn ? 'Fullscreen mode' : 'На весь екран')}
						data-testid="posters-fullscreen-btn"
					>
						{#if fullscreen.active}
							<Shrink size={16} aria-hidden="true" />
							<span>{isEn ? 'Exit' : 'Згорнути'}</span>
						{:else}
							<Expand size={16} aria-hidden="true" />
							<span>{isEn ? 'Fullscreen' : 'На весь екран'}</span>
						{/if}
					</button>
				</div>
			</div>
		</header>

		<!-- Основний слот плаката -->
		<section class="poster-viewport" data-testid="poster-active-container">
			{#if activePoster === 'dance-studio'}
				<DanceStudioPoster {isEn} themeId={selectedTheme} />
			{:else}
				<DigitalAnniversaryPoster {isEn} />
			{/if}
		</section>
	</div>
</div>

<style>
	.posters-page {
		padding: var(--page-pad-top) 0 var(--page-pad-bottom);
		min-height: 85dvh;
	}

	.posters-container {
		display: flex;
		flex-direction: column;
		gap: clamp(16px, 3cqi, 32px);
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 16px;
	}

	.posters-header {
		position: relative;
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: clamp(16px, 2.5cqi, 24px);
	}

	.header-intro {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 8px;
	}

	.header-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--bg-surface);
		color: var(--accent-text, #b45309);
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 4px 12px;
		border-radius: 999px;
		border: 1px solid var(--color-border);
	}

	.header-title {
		margin: 0;
		font-size: clamp(1.8rem, 4.5vw, 2.8rem);
		font-weight: 900;
		color: var(--text-title);
		letter-spacing: -0.02em;
	}

	.header-lead {
		margin: 0;
		max-width: 620px;
		font-size: clamp(0.95rem, 1.8vw, 1.15rem);
		color: var(--text-muted);
		line-height: 1.45;
	}

	/* Панель інструментів */
	.posters-toolbar {
		position: relative;
		z-index: 20;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: var(--bg-card);
		backdrop-filter: blur(12px);
		border: 1px solid var(--color-border);
		border-radius: 18px;
		padding: 8px 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
	}

	.poster-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-main);
		background: transparent;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.18s ease;
	}

	.tab-btn:hover {
		background: color-mix(in srgb, var(--bg-surface), var(--text-main) 8%);
	}

	.tab-btn--active {
		background: #ffed00 !important;
		color: #111827 !important;
		border-color: rgba(0, 0, 0, 0.12) !important;
		font-weight: 700;
		box-shadow: 0 2px 8px rgba(255, 237, 0, 0.4);
	}

	.tab-badge {
		font-size: 0.72rem;
		padding: 2px 6px;
		border-radius: 6px;
		background: rgba(0, 0, 0, 0.08);
		color: inherit;
		font-weight: 700;
	}

	.poster-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border-radius: 12px;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid var(--color-border);
		background: var(--bg-card);
		color: var(--text-main);
		transition: all 0.18s ease;
	}

	.action-btn:hover {
		border-color: var(--accent-primary, #00b5ec);
		color: var(--accent-text, #0077c8);
		transform: translateY(-1px);
	}

	.action-btn--print {
		background: var(--accent-primary, #00b5ec);
		color: var(--text-on-accent, #0f172a);
		border-color: var(--accent-primary, #00b5ec);
		font-weight: 700;
	}

	.action-btn--print:hover {
		filter: brightness(1.06);
		color: var(--text-on-accent, #0f172a);
	}

	/* Слот відображення */
	.poster-viewport {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: center;
		width: 100%;
		padding: clamp(8px, 2cqi, 20px) 0;
	}

	/* Повноекранний режим */
	:global(body.posters-fullscreen) .posters-header {
		display: none !important;
	}

	:global(body.posters-fullscreen) .posters-page {
		padding: 0 !important;
		min-height: 100dvh !important;
		background: #111827 !important;
	}

	:global(body.posters-fullscreen) .poster-viewport {
		height: 100dvh !important;
		padding: 0 !important;
		align-items: center !important;
	}

	/* Друк: на одному аркуші A4 */
	@page {
		size: A4 portrait;
		margin: 0;
	}

	@media print {
		:global(body) {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			background: transparent !important;
		}

		:global(#main-header),
		:global(.header-blur-layer),
		:global(#main-footer),
		:global(.footer-spacer),
		:global(.skip-link),
		:global(.page-scrollbar),
		:global(.minimap),
		.posters-header {
			display: none !important;
		}

		:global(.app),
		:global(main#main-content),
		.posters-page,
		.posters-container,
		.poster-viewport {
			min-height: 0 !important;
			padding: 0 !important;
			margin: 0 !important;
			width: 100% !important;
			max-width: none !important;
			box-shadow: none !important;
		}
	}
</style>
