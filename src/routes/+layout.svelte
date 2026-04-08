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
					title: 'Про школу',
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
					title: 'About School',
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
		top: 0;
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
		padding-top: var(--header-height, 72px);
	}
</style>