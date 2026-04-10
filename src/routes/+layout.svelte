<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import DynamicBackground from '$lib/components/DynamicBackground.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import '$lib/styles/global.css';
	import '$lib/i18n';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { waitLocale, t, locale } from 'svelte-i18n';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
	import { ui } from '$lib/states/ui.svelte';

	let { children, data } = $props();

	function perf(label: string) {
		if (browser && (window as any).__perf) (window as any).__perf(label);
	}

	perf('+layout.svelte: script init');

	// Debug mode: localStorage.setItem('debug','1') + refresh to show 🐛 button
	const debugMode = browser && localStorage.getItem('debug') === '1';

	// ── Perf debug helpers (active only when debugMode) ───────────────────────
	function showPerfTextarea(text: string) {
		const existing = document.getElementById('perf-debug-textarea');
		if (existing) { existing.remove(); return; }
		const ta = document.createElement('textarea');
		ta.id = 'perf-debug-textarea';
		ta.value = text;
		ta.readOnly = true;
		Object.assign(ta.style, {
			position: 'fixed', bottom: '60px', left: '8px', right: '8px',
			zIndex: '99999', height: '50vh', fontSize: '11px', fontFamily: 'monospace',
			background: '#111', color: '#0f0', border: '2px solid #0f0', borderRadius: '8px',
			padding: '8px', whiteSpace: 'pre', overflow: 'auto'
		});
		ta.onclick = () => { ta.select(); };
		document.body.appendChild(ta);
		ta.focus();
		ta.select();
	}

	function copyPerfLog() {
		const log = (window as any).__perfLog || [];
		const ua = navigator.userAgent;
		const conn = (navigator as any).connection;
		const mem = (performance as any).memory;
		const timing = performance.timing;
		const lines = [
			'=== PERF LOG ===',
			'UA: ' + ua,
			'Time: ' + new Date().toISOString(),
			conn ? 'Connection: ' + conn.effectiveType + ', downlink=' + conn.downlink + 'Mbps, rtt=' + conn.rtt + 'ms, saveData=' + conn.saveData : 'Connection API: N/A',
			mem ? 'JS Heap: ' + Math.round(mem.usedJSHeapSize / 1048576) + '/' + Math.round(mem.jsHeapSizeLimit / 1048576) + ' MB' : 'Memory API: N/A',
			'navTiming.domContentLoaded: ' + Math.round(timing.domContentLoadedEventEnd - timing.navigationStart) + 'ms',
			'navTiming.loadEvent: ' + Math.round(timing.loadEventEnd - timing.navigationStart) + 'ms',
			'navTiming.responseEnd: ' + Math.round(timing.responseEnd - timing.navigationStart) + 'ms',
			'navTiming.domInteractive: ' + Math.round(timing.domInteractive - timing.navigationStart) + 'ms',
			'serviceWorker: ' + ('serviceWorker' in navigator ? 'supported' : 'no'),
			'indexedDB: ' + (typeof indexedDB !== 'undefined' ? 'available' : 'no'),
			'',
			...log.map((e: any) => '+' + e.t + 'ms  ' + e.label),
			'',
			'=== END ==='
		];
		const text = lines.join('\n');
		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(text).then(
				() => alert('Скопійовано в буфер! (' + log.length + ' записів)'),
				() => showPerfTextarea(text)
			);
		} else {
			showPerfTextarea(text);
		}
	}

	let headerScrolled = $state(false);

	$effect(() => {
		if (browser) {
			const onScroll = () => { headerScrolled = window.scrollY > 20; };
			window.addEventListener('scroll', onScroll, { passive: true });
			return () => window.removeEventListener('scroll', onScroll);
		}
	});

	$effect(() => {
		if (browser) {
			document.body.classList.toggle('page-home', page.route.id === '/');
			// Remove the HTML splash on non-home pages (it's only relevant for homepage)
			if (page.route.id !== '/') {
				document.getElementById('app-splash')?.remove();
			}
		}
	});

	const SITE_FALLBACK_ORIGIN = 'https://teatralo4ka.odesa.ua';
	type SeoPageKey = 'home' | 'about' | 'history' | 'contacts' | 'admission';
	type SeoLangKey = 'uk' | 'en';
	const FALLBACK_LANG: SeoLangKey = 'uk';

	const SEO_FALLBACK = {
		uk: {
			brandTitle: 'Одеська театральна школа',
			orgName: 'Одеська театральна школа',
			orgDescription:
				'Одеська театральна школа: музична освіта для дітей та молоді в Одесі, творчий розвиток та концертна діяльність.',
			pages: {
				home: {
					title: 'Одеська театральна школа',
					description:
						'Офіційний сайт Одеської театральної школи. Відділи, галерея, історія, конкурси та умови вступу.'
				},
				about: {
					title: 'Про школу',
					description:
						'Дізнайтеся більше про Одеську театральну школу: творче життя, виступи, викладачі та учні.'
				},
				history: {
					title: 'Історія',
					description: 'Історія Одеської театральної школи від перших згадок до сучасності.'
				},
				contacts: {
					title: 'Конкурси',
					description:
						'Творчі конкурси та фестивалі Одеської театральної школи для підтримки юних талантів.'
				},
				admission: {
					title: 'Для вступу',
					description:
						'Інформація для вступу до Одеської театральної школи: документи, контакти та умови навчання.'
				}
			}
		},
		en: {
			brandTitle: 'Odessa Theatre School',
			orgName: 'Odessa Theatre School',
			orgDescription:
				'Odessa Theatre School: music education for children and youth in Odesa, creative growth, and concert activity.',
			pages: {
				home: {
					title: 'Odessa Theatre School',
					description:
						'Official website of Odessa Theatre School. Departments, gallery, history, contacts, and admission details.'
				},
				about: {
					title: 'About School',
					description:
						'Learn more about Odessa Theatre School: creative life, performances, teachers, and students.'
				},
				history: {
					title: 'History',
					description: 'The history of Odessa Theatre School from early records to the present day.'
				},
				contacts: {
					title: 'contacts',
					description:
						'Creative contacts and festivals of Odessa Theatre School that support young talents.'
				},
				admission: {
					title: 'Admission',
					description:
						'Admission information for Odessa Theatre School: documents, contacts, and study conditions.'
				}
			}
		}
	} as const;

	function safeT(key: string, fallback: string): string {
		try {
			const result = $t(key);
			// $t returns the key itself if translation not found (locale not loaded yet)
			return (result && result !== key) ? result : fallback;
		} catch {
			return fallback;
		}
	}

	function routeToSeoKey(pathname: string): SeoPageKey {
		switch (pathname) {
			case '/':
				return 'home';
			case '/about':
				return 'about';
			case '/history':
				return 'history';
			case '/contacts':
				return 'contacts';
			case '/admission':
				return 'admission';
			default:
				return 'home';
		}
	}

	const seoKey = $derived(routeToSeoKey(page.url.pathname));
	const currentLocale = $derived(($locale as string) || 'uk');
	const activeLang = $derived<SeoLangKey>(currentLocale === 'en' ? 'en' : FALLBACK_LANG);
	const brandTitle = $derived(safeT('seo.brandTitle', SEO_FALLBACK[activeLang].brandTitle));
	const metaTitle = $derived(
		safeT(`seo.pages.${seoKey}.title`, SEO_FALLBACK[activeLang].pages[seoKey].title)
	);
	const metaDescription = $derived(
		safeT(`seo.pages.${seoKey}.description`, SEO_FALLBACK[activeLang].pages[seoKey].description)
	);
	const canonicalUrl = $derived(data.canonicalUrl || `${SITE_FALLBACK_ORIGIN}${page.url.pathname}`);
	const ogImageUrl = $derived(`${SITE_FALLBACK_ORIGIN}${base}/og/og-default-1200x630.jpg`);
	const seoTitle = $derived(`${metaTitle} | ${brandTitle}`);
	const ogLocale = $derived(currentLocale === 'en' ? 'en_US' : 'uk_UA');
	const schemaOrg = $derived({
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: safeT('seo.org.name', SEO_FALLBACK[activeLang].orgName),
		url: SITE_FALLBACK_ORIGIN,
		logo: `${SITE_FALLBACK_ORIGIN}${base}/logo-800px484px.png`,
		description: safeT('seo.org.description', SEO_FALLBACK[activeLang].orgDescription),
		telephone: '+380 48 723 81 10',
		email: 'dmsh-5odesa@ukr.net',
		address: {
			'@type': 'PostalAddress',
			streetAddress: safeT('footer.address', 'вулиця Чорноморського Козацтва, 18, Одеса'),
			addressLocality: 'Odesa',
			addressCountry: 'UA'
		},
		sameAs: [
			'https://www.facebook.com/odesaartschool5',
			'https://www.instagram.com/odesa_art_school_5'
		]
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={`${base}/favicon.png`} />
	<link rel="canonical" href={canonicalUrl} />

	<title>{seoTitle}</title>
	<meta name="description" content={metaDescription} />
	<meta name="robots" content="index, follow" />

	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:site_name" content={brandTitle} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content={ogImageUrl} />

	<script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
</svelte:head>

{#await waitLocale()}
	<div style="height: 100vh; display: flex; align-items: center; justify-content: center;">
		<!-- Simple placeholder or nothing during transition -->
	</div>
{:then}
	<!-- Blur overlay for theme/language changes -->
	<div class="theme-transition-overlay" class:active={ui.isThemeChanging || ui.isLangChanging}></div>

	<div class="app" class:with-dynamic-bg={ui.enableDynamicBackground} class:page-home={page.route.id === '/'}>
		<div class="app__base-bg" aria-hidden="true"></div>

		<!-- Dynamic background -->
		<!-- Dynamic background - ALWAYS mounted for smooth transitions -->
		<DynamicBackground 
			backgroundType={ui.backgroundType} 
			theme={ui.theme}
			enabled={ui.enableDynamicBackground}
		/>

		<Header />
		<div class="header-blur-layer" class:scrolled={headerScrolled} aria-hidden="true"></div>
		<main id="main-content">
			<ErrorBoundary>
				{@render children()}
			</ErrorBoundary>
		</main>
		<Footer />
	</div>

	<Toast />
	<ConfirmModal />

	<!-- Debug perf button: hidden by default. To enable: localStorage.setItem('debug','1') + refresh -->
	{#if browser && debugMode}
		<button
			class="perf-debug-btn"
			onclick={copyPerfLog}
			aria-label="Copy perf log"
		>
			🐛
		</button>
	{/if}
{/await}

<style>
	.theme-transition-overlay {
		position: fixed;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		backdrop-filter: blur(0px);
		transition:
			opacity 0.3s ease-in-out,
			backdrop-filter 0.3s ease-in-out;
		z-index: 9999;
	}

	.theme-transition-overlay.active {
		opacity: 1;
		backdrop-filter: blur(6px);
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		position: relative;
		isolation: isolate;
	}

	:global(html) {
		transition: filter 0.8s ease-in-out;
	}

	:global(html.ticker-active) {
		filter: grayscale(var(--ticker-grayscale, 0.6)) brightness(var(--ticker-brightness, 0.9));
	}

	.app__base-bg {
		position: fixed;
		inset: 0;
		background: var(--color-light-blue);
		z-index: -2;
		pointer-events: none;
	}

	/* Header frosted-glass background — rendered as a sibling of <Header />
	   so dropdowns inside <Header /> can use backdrop-filter without
	   compositing-group conflicts. */
	.header-blur-layer {
		position: fixed;
		top: var(--ticker-height, 0px);
		left: 0;
		right: 0;
		height: calc(var(--header-height, 72px) + 16px); /* un-scrolled: +16px extra padding */
		z-index: 99;
		pointer-events: none;
		background: color-mix(in srgb, var(--color-surface), transparent 15%);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
		transition:
			height var(--transition-base),
			top var(--transition-base),
			background var(--transition-base);
	}

	.header-blur-layer.scrolled {
		height: var(--header-height, 72px);
	}

	:global(.dark-theme) .header-blur-layer {
		background: color-mix(in srgb, var(--color-dark-bg, #0f172a), transparent 15%);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	:global(.app.with-dynamic-bg) .header-blur-layer {
		background: color-mix(in srgb, var(--color-surface), transparent 60%);
	}

	:global(.dark-theme.app.with-dynamic-bg) .header-blur-layer {
		background: color-mix(in srgb, #000, transparent 60%);
	}

	main {
		flex: 1;
		background: transparent;
		position: relative;
		padding-top: calc(var(--header-height, 72px) + var(--ticker-height, 0px));
		transition: padding-top var(--transition-base);
	}

	/* Temporary perf debug button */
	.perf-debug-btn {
		position: fixed;
		bottom: 12px;
		left: 12px;
		z-index: 99998;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid rgba(0, 0, 0, 0.2);
		background: rgba(255, 255, 255, 0.9);
		font-size: 20px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		line-height: 1;
	}
</style>