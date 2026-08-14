<script lang="ts">
	import HeaderSection from '$lib/components/HeaderSection.svelte';
	import FooterSection from '$lib/components/FooterSection.svelte';
	import DynamicBackground from '$lib/components/DynamicBackground.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import HotNews from '$lib/components/HotNews.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import '$lib/styles/global.css';
	import '$lib/i18n';
	import { stripLocale } from '$lib/i18n/routing';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { asset } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { installMailtoToast } from '$lib/utils/emailCopy';
	import Minimap from '$lib/components/Minimap.svelte';
	import PageScrollbar from '$lib/components/PageScrollbar.svelte';
	import ScrollbarContextMenu from '$lib/components/ScrollbarContextMenu.svelte';
	import { ui } from '$lib/controllers/ui.svelte';
	import { scrollbar } from '$lib/controllers/scrollbar.svelte';
	import { checkForUpdates } from '$lib/services/version';
	import { storage } from '$lib/services/storage';
	import { trackPageView } from '$lib/services/analytics';
	import { afterNavigate } from '$app/navigation';

	let { children, data } = $props();

	// Fires on the initial load too, so this covers the first view and every
	// client-side move between the site's pages. trackPageView initialises
	// analytics itself, so there is no separate onMount call to order against.
	afterNavigate(() => trackPageView());

	/**
	 * Клас, що ховає нативну смугу, має рівно одного власника — цей ефект.
	 *
	 * Коли його ставили самі компоненти, перемикання режиму давало гонку:
	 * новий компонент клас додавав, а прибиральник старого спрацьовував після
	 * нього й одразу знімав. На екрані було видно дві смуги — власну й системну.
	 */
	$effect(() => {
		if (!browser) return;
		document.documentElement.classList.toggle('has-custom-scrollbar', scrollbar.hidesNative);
	});

	$effect(() => {
		if (browser) {
			checkForUpdates();
		}
	});

	function perf(label: string) {
		if (browser && window.__perf) window.__perf(label);
	}

	perf('+layout.svelte: script init');

	// Debug mode: localStorage.setItem('teatralo4ka_debug','1') + refresh to show 🐛 button
	const debugMode = browser && storage.get('debug') === '1';

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
		const log = window.__perfLog ?? [];
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
				() => alert($t('admin.debug.copiedToClipboard')),
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

	/**
	 * Патерн email — один на весь сайт (NOTIFICATIONS-v8 § 4).
	 *
	 * Тут, а не в компонентах: до цього обробник був у `FooterSection` і
	 * `HeroSection` двома копіями, а email у ТІЛІ сторінки (markdown
	 * `teatr-pro`) лишався голим `mailto:`. Поведінка залежала від того, у якій
	 * частині сторінки опинилося посилання. Сторінковий вміст приходить із
	 * markdown і власних обробників мати не може в принципі, тож делегування —
	 * єдине місце, де правило справді стає спільним.
	 */
	$effect(() => {
		if (browser) return installMailtoToast();
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
			brandTitle: 'Odesa Theatre School',
			orgName: 'Odesa Theatre School',
			orgDescription:
				'Odesa Theatre School: music education for children and youth in Odesa, creative growth, and concert activity.',
			pages: {
				home: {
					title: 'Odesa Theatre School',
					description:
						'Official website of Odesa Theatre School. Departments, gallery, history, contacts, and admission details.'
				},
				about: {
					title: 'About School',
					description:
						'Learn more about Odesa Theatre School: creative life, performances, teachers, and students.'
				},
				history: {
					title: 'History',
					description: 'The history of Odesa Theatre School from early records to the present day.'
				},
				contacts: {
					title: 'contacts',
					description:
						'Creative contacts and festivals of Odesa Theatre School that support young talents.'
				},
				admission: {
					title: 'Admission',
					description:
						'Admission information for Odesa Theatre School: documents, contacts, and study conditions.'
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
		// This site serves trailing slashes, so pathname arrives as "/about/"
		// while the cases below are written without one. Every page was falling
		// through to the default and inheriting the home page's title and
		// description — the per-page SEO underneath was never reached.
		//
		// Мовний префікс знімається ПЕРЕД зіставленням: сюди приходить
		// `/en/about/`, а кейси написані без префікса. Без цього рядка кожна
		// англійська сторінка провалювалася в `default` і брала заголовок
		// головної — та сама помилка, що й із хвостовою рискою вище, лише
		// повторена через мову. Видно її було лише в зібраному HTML: у
		// `build/en/about/index.html` стояв `<title>Odesa Theatre School</title>`
		// замість «About the school | …».
		const bare = stripLocale(pathname);
		const normalized = bare !== '/' ? bare.replace(/\/+$/, '') : bare;
		switch (normalized) {
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
	// Not `base` from $app/paths: it is relative here, so on a nested page it
	// resolved to ".." and produced "https://teatralo4ka.odesa.ua../og/...".
	// This site is served from the domain root, so there is no prefix to add.
	const ogImageUrl = $derived(`${SITE_FALLBACK_ORIGIN}/og/og-default-1200x630.jpg`);
	// The home page's own title is already the brand, so appending it produced
	// "Одеська театральна школа | Одеська театральна школа".
	const seoTitle = $derived(metaTitle === brandTitle ? brandTitle : `${metaTitle} | ${brandTitle}`);
	const ogLocale = $derived(currentLocale === 'en' ? 'en_US' : 'uk_UA');
	const schemaOrg = $derived({
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: safeT('seo.org.name', SEO_FALLBACK[activeLang].orgName),
		url: SITE_FALLBACK_ORIGIN,
		// Без `base`: він відносний, і в JSON-LD виходило
		// "https://teatralo4ka.odesa.ua../logo/…" на кожній вкладеній сторінці.
		// Той самий випадок, що й ogImageUrl вище.
		logo: `${SITE_FALLBACK_ORIGIN}/logo/png/logo-800px484px.png`,
		description: safeT('seo.org.description', SEO_FALLBACK[activeLang].orgDescription),
		telephone: '+380 48 723 81 10',
		email: 'dmsh-5odesa@ukr.net',
		address: {
			'@type': 'PostalAddress',
			streetAddress: safeT('footer.address', '24 Sofiivska St, Odesa'),
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
	<link rel="icon" type="image/png" href={asset('/favicon.png')} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- hreflang (SEO-v8 § 2.1, I18N-v8 § 3.1).
	     Набір альтернатив однаковий для обох мовних версій — це властивість,
	     перевірена в `routing.test.ts`. Якби версії оголошували різні набори,
	     Google вважав би розмітку суперечливою і не брав до уваги жодну.
	     x-default вказує на українську: це мова школи й типова мова сайту. -->
	{#each data.alternates as alt (alt.locale)}
		<link rel="alternate" hreflang={alt.locale} href={alt.url} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={`${SITE_FALLBACK_ORIGIN}/`} />

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

	<!-- Svelte does not evaluate expressions inside a <script> element, so the
	     previous form shipped the literal text "{JSON.stringify(schemaOrg)}" as
	     the structured data. It has to go through {@html}.

	     Виняток за SECURITY-v8 § 5.3: дані сюди приходять лише зі словників
	     перекладу в репозиторії, не від користувача. Але `<` усе одно
	     екранується: JSON.stringify не чіпає косу риску, тож рядок "</script>"
	     у перекладі закрив би тег і перетворив статичні дані на XSS. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${JSON.stringify(schemaOrg).replace(/</g, '\\u003c')}</` + `script>`}
</svelte:head>

<!-- Rendered unconditionally: the locale is awaited in +layout.ts now. As an
     {#await} block this rendered its pending branch during prerendering, so
     every page shipped an empty placeholder instead of its content. -->
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

	<HeaderSection />
	<div class="header-blur-layer" class:scrolled={headerScrolled} aria-hidden="true"></div>
	<main id="main-content">
		<ErrorBoundary>
			{@render children()}
		</ErrorBoundary>
	</main>
	<FooterSection />
</div>

<PageScrollbar />

<!-- Меню смуги живе в корені: мінімапа з `overflow: hidden` обрізала б його. -->
<ScrollbarContextMenu />

<!-- Типово вимкнена; вмикається в налаштуваннях. -->
<Minimap />

<Toast />
<ConfirmModal />

<!-- Нічого не малює: лише вирішує, які новини показати тостами (лівий низ). -->
<HotNews />

<!-- Debug perf button: hidden by default. To enable: localStorage.setItem('teatralo4ka_debug','1') + refresh -->
{#if browser && debugMode}
	<button
		class="perf-debug-btn"
		onclick={copyPerfLog}
		aria-label="Copy perf log"
	>
		🐛
	</button>
{/if}

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
		background: var(--bg-page);
		z-index: -2;
		pointer-events: none;
	}

	/* Header frosted-glass background — rendered as a sibling of <HeaderSection />
	   so dropdowns inside <HeaderSection /> can use backdrop-filter without
	   compositing-group conflicts. */
	.header-blur-layer {
		position: fixed;
		top: var(--ticker-height, 0px);
		left: 0;
		right: 0;
		height: calc(var(--header-height, 72px) + 16px); /* un-scrolled: +16px extra padding */
		z-index: 99;
		pointer-events: none;
		background: var(--bg-header);
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
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	:global(.app.with-dynamic-bg) .header-blur-layer {
		background: color-mix(in srgb, var(--bg-header), transparent 20%);
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