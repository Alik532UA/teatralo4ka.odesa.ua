<script lang="ts">
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { goto, pushState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { List } from 'lucide-svelte';
	import GraduateGalaxy from '$lib/components/GraduateGalaxy.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import GraduateRoster from '$lib/components/GraduateRoster.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { localeFromPath, withLocale } from '$lib/i18n/routing';
	import {
		WITH_PAGE,
		graduateProfileJson,
		graduateProfilePath,
		type GraduateIndexEntry,
		type GraduateProfile
	} from '$lib/data/graduates';

	let { data } = $props();

	let rosterOpen = $state(false);

	/**
	 * Профілі, які вже прочитані: людину можна відкрити вдруге, а файл читається
	 * з мережі.
	 *
	 * `SvelteMap`, а не звичайна `Map`: у звичайної руни не бачать `set()`, і
	 * картка лишалася б із порожніми подробицями, доки щось інше не перемалює
	 * компонент. Правило `svelte/prefer-svelte-reactivity` ловить саме це.
	 */
	const profiles = new SvelteMap<string, GraduateProfile>();

	const locale = $derived(localeFromPath(page.url.pathname));

	const profileHref = (code: string) => withLocale(graduateProfilePath(code), locale);

	/**
	 * Відкрита картка живе в СТАНІ СТОРІНКИ, а не в змінній компонента.
	 *
	 * Причина проста: у картки має бути власна адреса (`/projects/galaxy-graduates/15K`
	 * — рівно та, що була на старому сайті), і тоді кнопка «назад» мусить її
	 * закривати. `pushState` дає обидві половини задарма: браузер сам знімає стан
	 * на `popstate`, тож окремого обробника історії не потрібно.
	 *
	 * Хто анкети не заповнював, адреси не отримує — показувати за нею нічого, крім
	 * імені. Для них стан теж є, але без зміни адреси (`pushState('')`).
	 */
	const selected = $derived(
		data.graduates.find((graduate) =>
			page.state.graduateCode
				? graduate.code === page.state.graduateCode
				: graduate.slug === page.state.graduateSlug
		) ?? null
	);

	const selectedProfile = $derived(
		page.state.graduateCode ? (profiles.get(page.state.graduateCode) ?? null) : null
	);

	async function openGraduate(graduate: GraduateIndexEntry) {
		rosterOpen = false;

		if (!graduate.code) {
			pushState('', { graduateSlug: graduate.slug });
			return;
		}

		if (browser && window.matchMedia('(max-width: 768px)').matches) {
			await goto(profileHref(graduate.code));
			return;
		}

		// `resolve()` тут немає й бути не може: під SSR він віддає ВІДНОСНИЙ шлях, і
		// мовний префікс поверх нього дає `/en../../../projects/…` — замір і наслідки
		// в докблоці `graduateProfilePath` у `$lib/data/graduates`. Тому адреса
		// складається вручну, а правило бачить лише прямий виклик `resolve()`.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		pushState(profileHref(graduate.code), { graduateCode: graduate.code });
		if (profiles.has(graduate.code)) return;

		const response = await fetch(graduateProfileJson(graduate.code));
		if (!response.ok) return;
		profiles.set(graduate.code, (await response.json()) as GraduateProfile);
	}

	/**
	 * Клас на `<body>`, а не правки в layout.
	 *
	 * Галактика займає весь екран, тож шапка й підвал тут зайві — але прибирати їх
	 * із `+layout.svelte` умовою означало б зачепити всі 40 сторінок заради однієї.
	 * Клас на `body` робить те саме локально, а `display: none` прибирає елементи й
	 * із дерева доступності, не лише з очей.
	 *
	 * Знімається при виході зі сторінки: без цього шапка зникла б і на наступній.
	 */
	onMount(() => {
		document.body.classList.add('page-galaxy');
		return () => document.body.classList.remove('page-galaxy');
	});
</script>

<svelte:head>
	<title>{$t('galaxy.title')} — {$t('seo.brandTitle')}</title>
</svelte:head>

<!--
	Заголовок і опис лишаються в розмітці, але не на екрані.

	Прибрати їх зовсім означало б віддати сторінку пошуку без жодного тексту: у
	галактиці немає нічого, крім імен, а `<h1>` потрібен і читалці, і індексу.
	`.sr-only` — той самий клас, що вже вживається в проєкті.
-->
<h1 class="sr-only" data-testid="galaxy-page-title">{$t('galaxy.title')}</h1>
<p class="sr-only" data-testid="galaxy-page-text">{$t('galaxy.description')}</p>

<!--
	Перелік посилань на сторінки випускників — не на екрані, але в розмітці.

	Три причини, і жодна не про красу:
	  • зірки з'являються лише після монтування (розкладка випадкова), тож у
	    прередереному HTML посилань не було б ЖОДНОГО — ані для читалки, ані для
	    людини без JS;
	  • краулер prerender ходить саме за посиланнями, і саме так англійські
	    адреси профілів потрапляють у збірку, не переписуючи `svelte.config.js`;
	  • пошук знаходить сторінку випускника через сторінку галактики, а не лише
	    через мапу сайту.
-->
<nav class="sr-only" aria-label={$t('galaxy.profilesNav')} data-testid="galaxy-profiles-nav">
	<ul>
		{#each WITH_PAGE as graduate (graduate.slug)}
			<li>
				<!-- Адреса складена вручну (`graduateProfilePath` + мовний префікс), тож
				     прямого виклику `resolve()` в атрибуті немає — див. `openGraduate`. -->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={profileHref(graduate.code as string)}>{graduate.name}</a>
			</li>
		{/each}
	</ul>
</nav>

<div class="stage">
	<GraduateGalaxy onselect={openGraduate} paused={rosterOpen || selected !== null} />

	<button
		type="button"
		class="stage__roster-btn"
		onclick={() => (rosterOpen = true)}
		data-testid="galaxy-open-roster-btn"
	>
		<List size={18} aria-hidden="true" />
		<span>{$t('galaxy.all')}</span>
		<span class="stage__total" data-testid="galaxy-roster-total-count">{data.graduates.length}</span
		>
	</button>
</div>

<GraduateRoster
	graduates={data.graduates}
	open={rosterOpen}
	onclose={() => (rosterOpen = false)}
	onselect={openGraduate}
/>

<GraduateCard
	graduate={selected}
	profile={selectedProfile}
	onclose={() => history.back()}
/>

<style>
	.stage {
		position: fixed;
		/* Рівно весь екран. Логотип лежить ПОВЕРХ галактики прозорою шапкою, тому
		   відступати під нього не треба — і зірки літають до самого верху. */
		inset: 0;
		background: var(--galaxy-bg);
	}

	.stage__roster-btn {
		position: absolute;
		z-index: 3;
		right: clamp(0.75rem, 2vw, 1.5rem);
		bottom: clamp(0.75rem, 2vh, 1.5rem);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: 999px;
		background: rgb(5 10 31 / 0.72);
		color: var(--galaxy-text);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		backdrop-filter: blur(4px);
	}

	.stage__roster-btn:hover {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}

	.stage__total {
		opacity: 0.65;
		font-variant-numeric: tabular-nums;
	}
</style>
