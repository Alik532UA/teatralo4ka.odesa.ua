<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Departments from '$lib/components/Departments.svelte';
	import News from '$lib/components/News.svelte';
	import Projects from '$lib/components/Projects.svelte';
	import Wave from '$lib/components/Wave.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { t, locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { getHomeSettings, getCachedHomeSettings, DEFAULT_BLOCKS, DEFAULT_NEWS_WIDGET_HOME, DEFAULT_NEWS_WIDGET_HOME_MOBILE, DEFAULT_PROJECTS_WIDGET_HOME, DEFAULT_PROJECTS_WIDGET_HOME_MOBILE, type BlockConfig, type NewsWidgetConfig, type ProjectsWidgetConfig } from '$lib/services/settings';
	import { getArticles, getAllProjects, getDisplayDate, mapArticleToWidgetItem, type Article } from '$lib/services/articles';
	import { getStaticProjects } from '$lib/config/static-projects';

	// ── SWR: instant from cache, then revalidate ──────────────────────────────
	const cachedHome = browser ? getCachedHomeSettings() : null;
	const isMobile = browser ? window.matchMedia('(max-width: 1024px)').matches : false;

	function pickBlocks(desktop?: BlockConfig[], mobile?: BlockConfig[]): BlockConfig[] {
		const source = (isMobile && mobile?.length) ? mobile : (desktop?.length ? desktop : DEFAULT_BLOCKS.map(b => ({ ...b })));
		return [...source].sort((a, b) => a.order - b.order);
	}

	function pickNewsWidget(desktop?: NewsWidgetConfig, mobile?: NewsWidgetConfig): NewsWidgetConfig {
		if (isMobile) return mobile ?? { ...DEFAULT_NEWS_WIDGET_HOME_MOBILE };
		return desktop ?? { ...DEFAULT_NEWS_WIDGET_HOME };
	}

	function pickProjectsWidget(desktop?: ProjectsWidgetConfig, mobile?: ProjectsWidgetConfig): ProjectsWidgetConfig {
		if (isMobile) return mobile ?? { ...DEFAULT_PROJECTS_WIDGET_HOME_MOBILE };
		return desktop ?? { ...DEFAULT_PROJECTS_WIDGET_HOME };
	}

	let blocks = $state<BlockConfig[]>(pickBlocks(cachedHome?.blocks, cachedHome?.mobileBlocks));
	let blocksReady = $state(!!cachedHome);

	// News data — loaded in parallel, NOT sequentially after blocksReady
	let rawNewsArticles = $state<Article[]>([]);
	let newsWidgetConfig = $state<NewsWidgetConfig>(pickNewsWidget(cachedHome?.newsWidget, cachedHome?.mobileNewsWidget));
	let newsReady = $state(false);
	let newsError = $state(false);

	// Projects data — loaded in parallel
	let rawProjectArticles = $state<Article[]>([]);
	let projectsWidgetConfig = $state<ProjectsWidgetConfig>(pickProjectsWidget(cachedHome?.projectsWidget, cachedHome?.mobileProjectsWidget));
	let projectsReady = $state(false);
	let projectsError = $state(false);

	// Reactive locale for widget re-mapping
	const activeLang = $derived((($locale as string) || 'uk') as 'uk' | 'en');

	// Derived: re-map when locale changes (no re-fetch needed, articles contain both translations)
	let newsItems = $derived.by(() => {
		return rawNewsArticles
			.filter(a => a.translations?.[activeLang]?.isPublished)
			.map((item, index) => mapArticleToWidgetItem(item, activeLang, index));
	});

	let projectItems = $derived.by(() => {
		const firebaseItems = rawProjectArticles
			.filter(a => a.translations?.[activeLang]?.isPublished)
			.map((item, index) => mapArticleToWidgetItem(item, activeLang, index));
		const firebaseSlugs = new Set(firebaseItems.map(p => p.slug).filter(Boolean));
		return [...firebaseItems, ...getStaticProjects(activeLang, firebaseSlugs)];
	});

	// Splash screen: the HTML splash in app.html is visible on cold start.
	// On warm start (cache exists), it was hidden by inline script in app.html.
	let splashDismissed = $state(!!cachedHome);

	let showDepartments = $state(false);
	let departmentsRef: HTMLElement | null = $state(null);

	const NEWS_LIMIT_HOME = 12;
	const PROJECTS_LIMIT_HOME = 12;

	function perf(label: string) {
		if (browser && (window as any).__perf) (window as any).__perf(label);
	}

	// ── Parallel loading: all Firebase requests fire at once ───────────────────
	onMount(() => {
		perf('+page.svelte: onMount fired');
		const lang = (($locale as string) || 'uk') as 'uk' | 'en';

		// Fire ALL requests in parallel
		const settingsPromise = getHomeSettings()
			.then(settings => {
				perf('+page.svelte: getHomeSettings resolved');
				if (settings) {
					blocks = pickBlocks(settings.blocks, settings.mobileBlocks);
					newsWidgetConfig = pickNewsWidget(settings.newsWidget, settings.mobileNewsWidget);
					projectsWidgetConfig = pickProjectsWidget(settings.projectsWidget, settings.mobileProjectsWidget);
				}
			})
			.catch((e) => { perf('+page.svelte: getHomeSettings ERROR: ' + e?.message); })
			.finally(() => { blocksReady = true; });

		const articlesPromise = getArticles(lang, true, undefined, NEWS_LIMIT_HOME)
			.then(articles => {
				perf('+page.svelte: getArticles resolved (' + articles.length + ' items)');
				const onlyNews = articles.filter(a => a.type !== 'page' && a.type !== 'page_project');
				rawNewsArticles = [...onlyNews].sort((a, b) => {
					const timeA = getDisplayDate(a)?.toDate?.()?.getTime() ?? 0;
					const timeB = getDisplayDate(b)?.toDate?.()?.getTime() ?? 0;
					return timeB - timeA;
				});
			})
			.catch((e) => { newsError = true; perf('+page.svelte: getArticles ERROR: ' + e?.message); })
			.finally(() => { newsReady = true; });

		const projectsPromise = getAllProjects(lang)
			.then(projects => {
				perf('+page.svelte: getAllProjects resolved (' + projects.length + ' items)');
				rawProjectArticles = projects.slice(0, PROJECTS_LIMIT_HOME);
			})
			.catch((e) => { projectsError = true; perf('+page.svelte: getAllProjects ERROR: ' + e?.message); })
			.finally(() => { projectsReady = true; });

		// Race: dismiss splash when Firebase responds OR after 2s timeout.
		// На десктопі/iPhone Firebase виграє за ~0.5-1s — таймаут не спрацьовує.
		// На Android Chrome перший Firestore запит займає 3-6с (WebChannel init),
		// тому таймаут виграє — splash зникає, Hero + skeleton видно одразу,
		// Firebase дані підвантажуються реактивно у фоні.
		// Детальніше: firebase-admin/performance-optimization.md
		const SPLASH_TIMEOUT_MS = 2000;
		const timeoutPromise = new Promise<void>(resolve => {
			setTimeout(() => { perf('+page.svelte: splash timeout (2s) fired'); resolve(); }, SPLASH_TIMEOUT_MS);
		});

		Promise.race([
			Promise.all([settingsPromise, articlesPromise, projectsPromise]),
			timeoutPromise,
		]).then(() => {
			perf('+page.svelte: race settled → dismissSplash');
			dismissSplash();
		});
	});

	function dismissSplash() {
		if (splashDismissed) return;
		// Clean up splash timers (slow-internet message, facts rotation)
		if (typeof (window as any).__splashCleanup === 'function') {
			(window as any).__splashCleanup();
		}
		const el = document.getElementById('app-splash');
		if (!el) { splashDismissed = true; return; }
		el.classList.add('splash-exit');
		window.dispatchEvent(new CustomEvent('splash-exit'));
		setTimeout(() => window.dispatchEvent(new CustomEvent('splash-logo-start')), 600);
		setTimeout(() => {
			el.remove();
			splashDismissed = true;
			window.dispatchEvent(new CustomEvent('splash-removed'));
		}, 900);
	}

	// Lazy-load Departments via IntersectionObserver — reactive to departmentsRef
	$effect(() => {
		const el = departmentsRef;
		if (!el) return;
		if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
			showDepartments = true;
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				showDepartments = true;
				observer.disconnect();
			}
		}, { rootMargin: '200px' });
		observer.observe(el);
		return () => observer.disconnect();
	});

	const galleryItems = $derived([
		{ src: `${base}/photo/013.jpg`, alt: 'School Life 1', title: $t('gallery.items.process') },
		{ src: `${base}/photo/035.jpg`, alt: 'School Life 2', title: $t('gallery.items.talents') },
		{ src: `${base}/photo/059.jpg`, alt: 'School Life 3', title: $t('gallery.items.atmosphere') },
		{ src: `${base}/photo/125.jpg`, alt: 'School Life 4', title: $t('gallery.items.evenings') },
		{ src: `${base}/photo/495.jpg`, alt: 'School Life 5', title: $t('gallery.items.virtuosos') },
		{ src: `${base}/photo/5.jpg`, alt: 'School Life 6', title: $t('gallery.items.harmony') },
	]);

	const visibleBlocks = $derived(blocks.filter(b => b.visible));
</script>

<!-- ── Progressive page content ────────────────────────────────────────────── -->
<div class="home-content">
	{#each visibleBlocks as block (block.id)}
		{#if block.id === 'hero'}
			<!-- Hero renders IMMEDIATELY — no Firebase dependency -->
			<ErrorBoundary>
				<Hero />
			</ErrorBoundary>

		{:else if block.id === 'news'}
			{#if newsReady}
				<ErrorBoundary>
					<News items={newsItems} config={newsWidgetConfig} error={newsError} />
				</ErrorBoundary>
			{:else}
				<!-- Skeleton: news section placeholder -->
				<section class="news-skeleton" aria-hidden="true" data-testid="news-skeleton">
					<div class="container">
						<div class="skeleton-header">
							<div class="skeleton-line skeleton-line--title"></div>
							<div class="skeleton-line skeleton-line--subtitle"></div>
						</div>
						<div class="skeleton-cards">
							{#each { length: 3 } as _, i}
								<div class="skeleton-card" data-testid="news-skeleton-card-{i}">
									<div class="skeleton-card__image"></div>
									<div class="skeleton-card__body">
										<div class="skeleton-line skeleton-line--md"></div>
										<div class="skeleton-line skeleton-line--sm"></div>
										<div class="skeleton-line skeleton-line--lg"></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

		{:else if block.id === 'departments'}
			<div bind:this={departmentsRef} class="lazy-section" data-testid="home-lazy-section">
				{#if showDepartments}
					<ErrorBoundary>
						<Departments />
					</ErrorBoundary>
				{:else}
					<div class="lazy-placeholder" data-testid="home-lazy-placeholder">
						{$t('common.loading')}
					</div>
				{/if}
			</div>

		{:else if block.id === 'projects'}
			{#if projectsReady}
				<ErrorBoundary>
					<Projects items={projectItems} config={projectsWidgetConfig} error={projectsError} />
				</ErrorBoundary>
			{:else}
				<!-- Skeleton: projects section placeholder -->
				<section class="news-skeleton" aria-hidden="true" data-testid="projects-skeleton">
					<div class="container">
						<div class="skeleton-header">
							<div class="skeleton-line skeleton-line--title"></div>
							<div class="skeleton-line skeleton-line--subtitle"></div>
						</div>
						<div class="skeleton-cards">
							{#each { length: 3 } as _, i}
								<div class="skeleton-card" data-testid="projects-skeleton-card-{i}">
									<div class="skeleton-card__image"></div>
									<div class="skeleton-card__body">
										<div class="skeleton-line skeleton-line--md"></div>
										<div class="skeleton-line skeleton-line--sm"></div>
										<div class="skeleton-line skeleton-line--lg"></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

		{:else if block.id === 'gallery'}
			<section class="gallery-bento" id="gallery-bento" aria-labelledby="gallery-title" data-testid="gallery-section">
				<div class="container" data-testid="gallery-container">
					<div class="gallery-bento__header" data-testid="gallery-header-group">
						<h2 class="gallery-bento__title" id="gallery-title" data-testid="gallery-title-label">{$t('gallery.title')}</h2>
						<p class="gallery-bento__subtitle" data-testid="gallery-subtitle-label">{$t('gallery.subtitle')}</p>
					</div>

					<div class="g-bento-4x3" data-testid="gallery-grid">
						{#each galleryItems as img, i (img.src)}
							<div class="g-bento-4x3__item" data-testid="gallery-item-{i}">
								<img src={img.src} alt={img.alt} width="1200" height="900" loading="lazy" decoding="async" data-testid="gallery-img-{i}" />
								<div class="g-bento-4x3__overlay" data-testid="gallery-overlay-{i}">
									<span class="g-bento-4x3__caption" data-testid="gallery-caption-{i}">{img.title}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	{/each}
</div>

<style>
	/* ── Skeleton UI ─────────────────────────────────────────────────────── */
	.news-skeleton {
		padding: var(--space-2xl) 0;
	}

	.skeleton-header {
		margin-bottom: var(--space-2xl);
		padding: 0 var(--space-xl);
	}

	.skeleton-line {
		border-radius: 8px;
		background: linear-gradient(90deg, var(--color-light-blue) 25%, var(--color-ice-blue, #e8f4f8) 50%, var(--color-light-blue) 75%);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-line--title {
		width: 220px;
		height: 36px;
		margin-bottom: 12px;
	}

	.skeleton-line--subtitle {
		width: 320px;
		height: 20px;
	}

	.skeleton-line--md { width: 70%; height: 18px; margin-bottom: 8px; }
	.skeleton-line--sm { width: 40%; height: 14px; margin-bottom: 8px; }
	.skeleton-line--lg { width: 90%; height: 14px; }

	.skeleton-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		padding: 0 var(--space-xl);
	}

	.skeleton-card {
		border-radius: 24px;
		overflow: hidden;
		background: var(--color-surface, #fff);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	}

	.skeleton-card__image {
		aspect-ratio: 16 / 9;
		background: linear-gradient(90deg, var(--color-light-blue) 25%, var(--color-ice-blue, #e8f4f8) 50%, var(--color-light-blue) 75%);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-card__body {
		padding: 20px;
	}

	@keyframes skeleton-shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@media (max-width: 1024px) {
		.skeleton-cards { grid-template-columns: repeat(2, 1fr); }
	}

	@media (max-width: 600px) {
		.skeleton-cards { grid-template-columns: 1fr; }
	}

	/* ── Existing styles ─────────────────────────────────────────────────── */
	.lazy-placeholder {
		height: 600px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-light-blue);
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .lazy-placeholder {
		background: transparent;
	}

	.gallery-bento {
		background: var(--color-light-blue);
		padding: 4rem 0 6rem;
		overflow: hidden;
		position: relative;
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .gallery-bento {
		background: transparent;
	}

	.gallery-bento__header {
		margin-bottom: 4rem;
		text-align: center;
	}

	.gallery-bento__title {
		font-family: var(--font-heading);
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-deep-ocean);
		margin-bottom: 1rem;
		text-transform: uppercase;
	}

	.gallery-bento__subtitle {
		font-size: 1.2rem;
		color: var(--color-body-text);
		opacity: 0.7;
	}

	.g-bento-4x3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.g-bento-4x3__item {
		position: relative;
		border-radius: 40px;
		overflow: hidden;
		box-shadow: 0 15px 30px rgba(0,0,0,0.08);
		cursor: pointer;
		aspect-ratio: 4 / 3;
	}

	.g-bento-4x3__item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.g-bento-4x3__item:hover img {
		transform: scale(1.08);
	}

	.g-bento-4x3__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, var(--theme-gallery-overlay-from), transparent 60%);
		display: flex;
		align-items: flex-end;
		padding: 2.5rem;
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.g-bento-4x3__item:hover .g-bento-4x3__overlay {
		opacity: 1;
	}

	.g-bento-4x3__caption {
		display: block;
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-white);
		transform: translateY(20px);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.g-bento-4x3__item:hover .g-bento-4x3__caption {
		transform: translateY(0);
	}

	@media (max-width: 1024px) {
		.g-bento-4x3 {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 1024px) {
		.gallery-bento__title {
			font-size: 2.2rem;
		}
		.g-bento-4x3 {
			grid-template-columns: repeat(2, 1fr);
			gap: 16px;
		}
		.g-bento-4x3__item {
			border-radius: 32px;
		}
	}

	@media (max-width: 480px) {
		.g-bento-4x3 {
			grid-template-columns: 1fr;
		}
	}
</style>
