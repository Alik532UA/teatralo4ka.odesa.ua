<script lang="ts">
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { goto, pushState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { List, Plus } from 'lucide-svelte';
	import GraduateGalaxy from '$lib/components/GraduateGalaxy.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import GraduateRoster from '$lib/components/GraduateRoster.svelte';
	import GraduateFormModal from '$lib/components/GraduateFormModal.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { localeFromPath, withLocale } from '$lib/i18n/routing';
	import {
		WITH_PAGE,
		graduateProfileJson,
		graduateProfilePath,
		type Department,
		type GraduateIndexEntry,
		type GraduateProfile
	} from '$lib/data/graduates';

	let { data } = $props();

	let rosterOpen = $state(false);
	let formModalOpen = $state(false);

	/** Стан фільтрів ростера — живе тут, щоб синхронізувати з URL. */
	let rosterYears = $state<number[]>([]);
	let rosterDepartments = $state<Department[]>([]);
	let rosterPhoto = $state<'all' | 'with' | 'without'>('all');
	let rosterQuery = $state('');

	function syncParamUrl(key: string, value: string | null) {
		if (!browser) return;
		const url = new URL(window.location.href);
		if (value !== null) {
			url.searchParams.set(key, value);
		} else {
			url.searchParams.delete(key);
		}
		window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
	}

	function syncFiltersToUrl() {
		if (!browser) return;
		const url = new URL(window.location.href);

		if (rosterYears.length > 0) {
			url.searchParams.set('year', rosterYears.join(','));
		} else {
			url.searchParams.delete('year');
		}

		if (rosterDepartments.length > 0) {
			url.searchParams.set('dept', rosterDepartments.join(','));
		} else {
			url.searchParams.delete('dept');
		}

		if (rosterPhoto !== 'all') {
			url.searchParams.set('photo', rosterPhoto);
		} else {
			url.searchParams.delete('photo');
		}

		const cleanQuery = rosterQuery.trim();
		if (cleanQuery) {
			url.searchParams.set('q', cleanQuery);
		} else {
			url.searchParams.delete('q');
		}

		window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
	}

	function setYears(years: number[] | number | 'all' | readonly number[]) {
		if (years === 'all') {
			rosterYears = [];
		} else if (typeof years === 'number') {
			rosterYears = [years];
		} else {
			rosterYears = [...years];
		}
		syncFiltersToUrl();
	}

	function setDepartments(departments: Department[]) {
		rosterDepartments = departments;
		syncFiltersToUrl();
	}

	function setPhoto(photo: 'all' | 'with' | 'without') {
		rosterPhoto = photo;
		syncFiltersToUrl();
	}

	function setQuery(query: string) {
		rosterQuery = query;
		syncParamUrl('q', query.trim() || null);
	}

	function openForm() {
		formModalOpen = true;
		syncParamUrl('form', 'open');
	}

	function closeForm() {
		formModalOpen = false;
		syncParamUrl('form', null);
	}

	function openRoster() {
		rosterOpen = true;
		syncParamUrl('roster', 'open');
	}

	function closeRoster() {
		rosterOpen = false;
		if (!browser) return;
		// Очищаємо фільтри з URL при закритті
		const url = new URL(window.location.href);
		url.searchParams.delete('roster');
		url.searchParams.delete('year');
		url.searchParams.delete('dept');
		url.searchParams.delete('photo');
		url.searchParams.delete('q');
		window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
	}

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

		function readUrlParams() {
			const url = new URL(window.location.href);
			const formParam = url.searchParams.get('form');
			formModalOpen = formParam === 'open' || formParam === 'true';

			const rosterParam = url.searchParams.get('roster');
			rosterOpen = rosterParam === 'open' || rosterParam === 'true' || rosterParam === '1';

			if (rosterOpen) {
				const yearParam = url.searchParams.get('year');
				if (yearParam) {
					rosterYears = yearParam
						.split(',')
						.map((y) => parseInt(y.trim(), 10))
						.filter((y) => !isNaN(y));
				} else {
					rosterYears = [];
				}

				const deptParam = url.searchParams.get('dept');
				if (deptParam) {
					rosterDepartments = deptParam.split(',').filter(Boolean) as Department[];
				} else {
					rosterDepartments = [];
				}

				const photoParam = url.searchParams.get('photo');
				if (photoParam === 'with' || photoParam === 'without') {
					rosterPhoto = photoParam;
				} else {
					rosterPhoto = 'all';
				}

				const qParam = url.searchParams.get('q');
				if (qParam) {
					rosterQuery = qParam;
				} else {
					rosterQuery = '';
				}
			}
		}

		readUrlParams();
		window.addEventListener('popstate', readUrlParams);

		return () => {
			document.body.classList.remove('page-galaxy');
			window.removeEventListener('popstate', readUrlParams);
		};
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
	<GraduateGalaxy onselect={openGraduate} />

	<div class="stage__controls">
		<button
			type="button"
			class="stage__roster-btn"
			onclick={openRoster}
			data-testid="galaxy-open-roster-btn"
		>
			<List size={18} aria-hidden="true" />
			<span>{$t('galaxy.all')}</span>
			<span class="stage__total" data-testid="galaxy-roster-total-count">{data.graduates.length}</span>
		</button>

		<button
			type="button"
			class="stage__add-btn"
			onclick={openForm}
			title={$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}
			aria-label={$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}
			data-testid="galaxy-open-form-btn"
		>
			<Plus size={20} aria-hidden="true" />
		</button>
	</div>
</div>

<GraduateRoster
	graduates={data.graduates}
	open={rosterOpen && !selected}
	onclose={closeRoster}
	onselect={openGraduate}
	year={rosterYears}
	departments={rosterDepartments}
	photo={rosterPhoto}
	query={rosterQuery}
	onyearchange={setYears}
	ondepartmentschange={setDepartments}
	onphotochange={setPhoto}
	onquerychange={setQuery}
/>

<GraduateCard
	graduate={selected}
	profile={selectedProfile}
	onclose={() => history.back()}
/>

<GraduateFormModal
	isOpen={formModalOpen}
	onclose={closeForm}
/>

<style>
	.stage {
		position: fixed;
		/* Рівно весь екран. Логотип лежить ПОВЕРХ галактики прозорою шапкою, тому
		   відступати під нього не треба — і зірки літають до самого верху. */
		inset: 0;
		background: var(--galaxy-bg);
	}

	.stage__controls {
		position: absolute;
		z-index: 3;
		right: clamp(0.75rem, 2vw, 1.5rem);
		bottom: clamp(0.75rem, 2vh, 1.5rem);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stage__roster-btn {
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
		transition: background 0.2s ease, border-color 0.2s ease;
	}

	.stage__roster-btn:hover {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}

	.stage__add-btn {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid rgb(140 190 255 / 0.4);
		border-radius: 50%;
		background: rgb(5 10 31 / 0.72);
		color: #cfe4ff;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
	}

	.stage__add-btn:hover {
		background: rgb(12 22 56 / 0.9);
		border-color: rgb(140 190 255 / 0.8);
		color: #fff;
		transform: scale(1.05);
	}

	.stage__total {
		opacity: 0.65;
		font-variant-numeric: tabular-nums;
	}
</style>
