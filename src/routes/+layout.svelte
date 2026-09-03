<script lang="ts">
	import HeaderSection from '$lib/components/HeaderSection.svelte';
	import FooterSection from '$lib/components/FooterSection.svelte';
	import DynamicBackground from '$lib/components/DynamicBackground.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import HotNews from '$lib/components/HotNews.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import ServiceLayer from '$lib/components/ui/ServiceLayer.svelte';
	import '$lib/styles/global.css';
	import '$lib/i18n';
	import { stripLocale } from '$lib/i18n/routing';
	import {
		FALLBACK_LANG,
		SEO_FALLBACK,
		routeToSeoKey,
		type SeoLangKey
	} from '$lib/config/seoPages';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { asset } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { installMailtoToast } from '$lib/utils/emailCopy';
	import { dismissSplash } from '$lib/utils/splash';
	import Minimap from '$lib/components/Minimap.svelte';
	import PageScrollbar from '$lib/components/PageScrollbar.svelte';
	import ScrollToTopButton from '$lib/components/ScrollToTopButton.svelte';
	import ScrollbarContextMenu from '$lib/components/ScrollbarContextMenu.svelte';
	import { ui } from '$lib/controllers/ui.svelte';
	import { scrollbar } from '$lib/controllers/scrollbar.svelte';
	import { checkForUpdates } from '$lib/services/version';
	import { SITE_ORIGIN } from '$lib/config/site';
	import { trackPageView } from '$lib/services/analytics';
	import { webVitals } from '$lib/controllers/webVitals.svelte';
	import { afterNavigate } from '$app/navigation';
	import { installViewTransitions } from '$lib/utils/viewTransition';

	let { children, data } = $props();

	// Start RUM Core Web Vitals collection (OBSERVABILITY-v8 § 2.1)
	$effect(() => webVitals.start());

	// Fires on the initial load too, so this covers the first view and every
	// client-side move between the site's pages. trackPageView initialises
	// analytics itself, so there is no separate onMount call to order against.
	afterNavigate(() => trackPageView());
	installViewTransitions();

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
		}
	});

	/**
	 * Заставка ЗАВЕРШУЄТЬСЯ і на внутрішніх сторінках, а не виривається з документа.
	 *
	 * Доти тут стояло `document.getElementById('app-splash')?.remove()` для всіх
	 * маршрутів, крім головної. Заставка ж лежить в `app.html`, тобто в розмітці
	 * КОЖНОЇ сторінки, і починає анімацію входу всюди. Наслідок: заходиш прямо на
	 * `/contacts/`, заставка стартує — і посеред анімації елемент зникає. Виглядає
	 * як збій рендера, хоча це два різних кінці однієї анімації, і другий не був
	 * кінцем.
	 *
	 * Чому тут не треба нічого чекати. На головній вихід заставки — це ГОНКА між
	 * відповіддю Firestore і таймаутом 2 с (`routes/+page.svelte`): сторінка без
	 * даних порожня, тож заставка прикриває саме це очікування. Внутрішні сторінки
	 * prerendered, їхній вміст уже в HTML — чекати нема на що, тож вихід
	 * починається одразу, а тривалість йому дає CSS.
	 *
	 * Виклик ПРЯМИЙ, без `requestAnimationFrame`, і це не спрощення. Перша редакція
	 * цієї правки обгортала виклик у `rAF` «щоб клас ліг окремим кадром» — і це
	 * додало б рівно той дефект, який щойно виправляли в сусідньому проєкті: у
	 * ПРИХОВАНІЙ вкладці `requestAnimationFrame` не спрацьовує, тож заставка висіла
	 * б там до моменту, коли вкладку відкриють.
	 *
	 * Окремий кадр тут і не потрібен: вихід зроблений CSS-АНІМАЦІЯМИ
	 * (`sp-curtain-left`, `sp-splash-down`), а вони починаються від самого факту
	 * появи класу. Окремий кадр був би обов'язковий для `transition`, де браузер
	 * мусить побачити два різних обчислених значення.
	 */
	$effect(() => {
		if (!browser || page.route.id === '/') return;
		dismissSplash();
	});


	function safeT(key: string, fallback: string): string {
		try {
			const result = $t(key);
			// $t returns the key itself if translation not found (locale not loaded yet)
			return (result && result !== key) ? result : fallback;
		} catch {
			return fallback;
		}
	}


	const seoKey = $derived(routeToSeoKey(page.url.pathname));
	const currentLocale = $derived(($locale as string) || 'uk');
	const activeLang = $derived<SeoLangKey>(currentLocale === 'en' ? 'en' : FALLBACK_LANG);
	const brandTitle = $derived(safeT('seo.brandTitle', SEO_FALLBACK[activeLang].brandTitle));
	const metaTitle = $derived(
		safeT(`seo.pages.${seoKey}.title`, SEO_FALLBACK[activeLang].pages[seoKey].title)
	);
	// Опис зі сторінки старший за карту SEO — чому саме так, у `App.PageData`.
	const metaDescription = $derived(
		page.data.seoDescription ||
			safeT(`seo.pages.${seoKey}.description`, SEO_FALLBACK[activeLang].pages[seoKey].description)
	);
	const canonicalUrl = $derived(data.canonicalUrl || `${SITE_ORIGIN}${page.url.pathname}`);
	// Not `base` from $app/paths: it is relative here, so on a nested page it
	// resolved to ".." and produced "https://teatralo4ka.odesa.ua../og/...".
	// This site is served from the domain root, so there is no prefix to add.
	const ogImageUrl = $derived(
		page.data.ogImageUrl ||
			`${SITE_ORIGIN}/og/${stripLocale(page.url.pathname).startsWith('/projects/galaxy-graduates') ? 'og-gg-1200x630.jpg' : 'og-default-1200x630.jpg'}`
	);
	// The home page's own title is already the brand, so appending it produced
	// "Одеська театральна школа | Одеська театральна школа".
	const seoTitle = $derived(metaTitle === brandTitle ? brandTitle : `${metaTitle} | ${brandTitle}`);
	const ogLocale = $derived(currentLocale === 'en' ? 'en_US' : 'uk_UA');
	const schemaOrg = $derived({
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: safeT('seo.org.name', SEO_FALLBACK[activeLang].orgName),
		url: SITE_ORIGIN,
		// Без `base`: він відносний, і в JSON-LD виходило
		// "https://teatralo4ka.odesa.ua../logo/…" на кожній вкладеній сторінці.
		// Той самий випадок, що й ogImageUrl вище.
		logo: `${SITE_ORIGIN}/logo/png/logo-800px484px.png`,
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

	<!-- Службова сторінка не отримує ні canonical, ні hreflang, зате отримує
	     noindex (BETA-CHECKLIST-v8 § 4). Прапорець приходить із `+layout.ts` —
	     один перелік на всі чотири вимоги, див. `config/hiddenRoutes.ts`.

	     Спокуса натомість прирівняти таку сторінку до 404-фолбека дешевша на два
	     рядки й неправильна: разом із canonical сторінка перестала б
	     перевірятися на порожнє тіло й на <title>, і найслабше покритою стала б
	     саме та сторінка, якою користуються тестувальники. -->
	{#if !data.hidden}
		<link rel="canonical" href={canonicalUrl} />

		<!-- hreflang (SEO-v8 § 2.1, I18N-v8 § 3.1).
		     Набір альтернатив однаковий для обох мовних версій — це властивість,
		     перевірена в `routing.test.ts`. Якби версії оголошували різні набори,
		     Google вважав би розмітку суперечливою і не брав до уваги жодну.
		     x-default вказує на українську: це мова школи й типова мова сайту. -->
		{#each data.alternates as alt (alt.locale)}
			<link rel="alternate" hreflang={alt.locale} href={alt.url} />
		{/each}
		<link rel="alternate" hreflang="x-default" href={`${SITE_ORIGIN}/`} />
	{/if}

	<title>{seoTitle}</title>
	<meta name="description" content={metaDescription} />
	<meta name="robots" content={data.hidden ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />

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

<!-- У корені, а не на сторінці: довгих сторінок на сайті більше ніж одна, і
     кнопка мусить бути на кожній. -->
<ScrollToTopButton />

<!-- Меню смуги живе в корені: мінімапа з `overflow: hidden` обрізала б його. -->
<ScrollbarContextMenu />

<!-- Типово вимкнена; вмикається в налаштуваннях. -->
<Minimap />

<!-- Клавіші сайту й табло версії. ПОЗА `ErrorBoundary` вище: межа при падінні
     замінює дітей своєю сторінкою, тобто забрала б і те, чим збирають звіт про це
     падіння. -->
<ServiceLayer />

<Toast />
<ConfirmModal />

<!-- Нічого не малює: лише вирішує, які новини показати тостами (лівий низ). -->
<HotNews />

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
		min-height: 100dvh;
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
		/* `--logo-bleed` — запас під логотип, що звисає нижче шапки; див. global.css. */
		padding-top: calc(var(--header-height, 72px) + var(--ticker-height, 0px) + var(--logo-bleed, 0px));
		transition: padding-top var(--transition-base);
	}

</style>