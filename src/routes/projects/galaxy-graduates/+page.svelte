<script lang="ts">
	import { t } from 'svelte-i18n';
	import { onMount, getAbortSignal } from 'svelte';
	import { goto, pushState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import GalaxyStageControls from '$lib/components/GalaxyStageControls.svelte';
	import GraduateGalaxy from '$lib/components/GraduateGalaxy.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import GraduateRoster from '$lib/components/GraduateRoster.svelte';
	import GraduateFormModal from '$lib/components/GraduateFormModal.svelte';
	import {
		cachedGraduateProfile,
		ensureGraduateProfile
	} from '$lib/services/graduateProfiles.svelte';
	import { localeFromPath, localizedPath } from '$lib/i18n/routing';
	import {
		WITH_PAGE,
		graduateAddress,
		graduateProfilePath,
		type Department,
		type GraduateIndexEntry,
		hasProfile
	} from '$lib/data/graduates';

	let { data } = $props();

	let rosterOpen = $state(false);
	let formModalOpen = $state(false);

	/** Стан фільтрів ростера — живе тут, щоб синхронізувати з URL. */
	let rosterYears = $state<number[]>([]);
	let rosterDepartments = $state<Department[]>([]);
	let rosterMasters = $state<string[]>([]);
	let rosterPhoto = $state<'all' | 'with' | 'without'>('all');
	let rosterQuery = $state('');
	/**
	 * Вітальне вікно про переїзд: `?update=open`.
	 *
	 * Окремим параметром, а не автопоказом новачкам: посилання роздають руками
	 * тим, хто ще не бачив нової галактики. Показувати його всім поспіль було б
	 * тим самим оголошенням, що затуляє сторінку людям, які й так тут щодня.
	 */
	let updateOpen = $state(false);
	/**
	 * Рік, на якому стоїть список — це ГОРТАННЯ, а не фільтр.
	 *
	 * Доти адреса тримала самі фільтри, тож перший клік по року (він гортає, а
	 * не фільтрує) нікуди не записувався: посилання відкривалося на початку
	 * списку, і показати комусь потрібне місце було нічим.
	 */
	let rosterScrolledYear = $state<number | null>(null);
	/**
	 * Картка, відкрита ПАРАМЕТРОМ адреси `?g=<slug>`.
	 *
	 * ## Навіщо параметр узагалі
	 *
	 * Адреси в картки не було: власну сторінку мають 90 із 530, а решті
	 * `openGraduate` робить `pushState('')`, тобто лишає поточну. Поки картку
	 * відкривали лише кліком по зірці, цього було досить; кнопці «сторінка
	 * випускника» на сторінці працівника — уже ні: шість із одинадцяти таких людей
	 * коду не мають. Адресу будує `graduateCardHref` у `$lib/data/graduates`.
	 *
	 * ## Чому ЛОКАЛЬНИЙ стан, а не `pushState`, як у кліку по зірці
	 *
	 * Заміряно, а не вирішено. Обидві спроби зробити це станом сторінки падали з
	 * «Cannot call pushState(...) before router is initialized» — і в `onMount`, і
	 * в `afterNavigate`: на першому переході роутер ще не готовий. Падало ТИХО, у
	 * необроблену обіцянку, тож зовні це виглядало як «параметр не працює» — і
	 * лише на прямому заході за адресою, тобто рівно там, для чого параметр і
	 * потрібен. Через клік по посиланню все працювало, бо там роутер уже готовий.
	 *
	 * Так само влаштовані сусідні параметри цієї ж сторінки — `?form=`, `?update=`,
	 * `?roster=`: вони теж відкривають накладку локальним станом. Тобто це не
	 * виняток, а той самий спосіб.
	 *
	 * Параметр із адреси НЕ знімається, доки картка відкрита: так посилання
	 * лишається чинним і його можна переслати далі. Знімає його закриття
	 * (`closeCard`).
	 */
	let paramGraduate = $state<GraduateIndexEntry | null>(null);

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

		if (rosterMasters.length > 0) {
			url.searchParams.set('master', rosterMasters.join(','));
		} else {
			url.searchParams.delete('master');
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

	function setMasters(masters: string[]) {
		rosterMasters = masters;
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

	function setScrolledYear(year: number | null) {
		rosterScrolledYear = year;
		syncParamUrl('at', year === null ? null : String(year));
	}

	/*
	 * Пари `openUpdate` тут немає навмисно: вікно відкриває САМА АДРЕСА —
	 * `readUrlParams` нижче бачить `?update=open` і піднімає прапорець. Кнопки
	 * «показати оголошення» на сторінці немає, бо посилання роздають руками.
	 */
	function closeUpdate() {
		updateOpen = false;
		syncParamUrl('update', null);
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
		url.searchParams.delete('at');
		window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
		rosterScrolledYear = null;
	}

	const locale = $derived(localeFromPath(page.url.pathname));

	/* Адресу дає `graduateAddress`, а не поле `code`: у 440 із 530 коду немає, і
	   раніше саме тут народжувалося `/projects/galaxy-graduates/undefined`. */
	const profileHref = (graduate: { code?: string; slug: string }) =>
		localizedPath(graduateProfilePath(graduateAddress(graduate)), locale);

	/**
	 * Відкрита картка живе в СТАНІ СТОРІНКИ, а не в змінній компонента.
	 *
	 * Причина проста: у картки має бути власна адреса (`/projects/galaxy-graduates/15K`
	 * — рівно та, що була на старому сайті), і тоді кнопка «назад» мусить її
	 * закривати. `pushState` дає обидві половини задарма: браузер сам знімає стан
	 * на `popstate`, тож окремого обробника історії не потрібно.
	 *
	 * Ключ стану ОДИН — адреса (`code`, якщо є, інакше `slug`). Доти їх було два,
	 * бо власної сторінки в 440 випускників не існувало; подробиці в `app.d.ts`.
	 */
	const selected = $derived(
		data.graduates.find(
			(graduate) => graduateAddress(graduate) === page.state.graduateAddress
		) ??
			/* Стан сторінки ПЕРЕВАЖАЄ параметр: відкрив картку за посиланням,
			   клацнув іншу зірку — показати треба другу. */
			paramGraduate ??
			null
	);

	/**
	 * Кеш і читання анкети живуть у `$lib/services/graduateProfiles` — тим самим
	 * місцем користується картка на сторінках майстра й навчальної групи. Доти
	 * ця логіка була тут, і решті сайту лишався спрощений вигляд без подробиць.
	 *
	 * Сигнал приходить ЗЗОВНІ, а не береться всередині: `getAbortSignal()` читає
	 * поточну реакцію, тож викликати його треба в тілі ефекту, доки та реакція
	 * ще та сама. Досить швидко клацнути дві зірки поспіль — і перший запит
	 * перестає бути потрібним ще до відповіді.
	 */
	const selectedProfile = $derived(cachedGraduateProfile(page.state.graduateAddress));

	$effect(() => {
		const адреса = page.state.graduateAddress;
		/* Питаємо файл лише в того, у кого він є: сторінка тепер у всіх 530, а
		   анкета — у 93. Без цієї перевірки 437 карток летіли б по 404. */
		const запис = адреса
			? data.graduates.find((g) => graduateAddress(g) === адреса)
			: undefined;
		if (адреса && запис && hasProfile(запис) && browser) {
			ensureGraduateProfile(адреса, getAbortSignal());
		}
	});

	/**
	 * Закриття картки — двома різними шляхами, бо відкрили її двома різними.
	 *
	 * Клік по зірці поклав запис в історію (`pushState`), тож зняти його має саме
	 * історія — інакше в ній лишиться запис, з якого «назад» відкриє картку знову.
	 *
	 * Параметр адреси запису в історію не додавав, і `history.back()` тут був би
	 * помилкою: на прямому заході за посиланням позаду немає нічого, тобто хрестик
	 * просто не працював би. Тому параметр знімається — `replaceState` не додає
	 * запису, тож «назад» веде туди, звідки прийшли (наприклад, на сторінку
	 * працівника).
	 */
	function closeCard() {
		if (paramGraduate && !page.state.graduateAddress) {
			paramGraduate = null;
			syncParamUrl('g', null);
			return;
		}
		history.back();
	}

	async function openGraduate(graduate: GraduateIndexEntry) {
		/*
		 * Розвилки «є код / немає коду» тут БІЛЬШЕ НЕМА.
		 *
		 * Доти в кого коду не було, той отримував `pushState('')` — стан
		 * кладеться, адреса лишається чужою. Тому Ілля Трифонов, відкритий із
		 * реєстру, показувався за адресою `/?roster=open&q=триф`, хоч власна
		 * сторінка в нього вже була.
		 */
		if (browser && window.matchMedia('(max-width: 768px)').matches) {
			await goto(profileHref(graduate));
			return;
		}

		// `resolve()` тут немає й бути не може: під SSR він віддає ВІДНОСНИЙ шлях, і
		// мовний префікс поверх нього дає `/en../../../projects/…` — замір і наслідки
		// в докблоці `graduateProfilePath` у `$lib/data/graduates`. Замість вимкнення
		// правила адреса тепер ТИПІЗОВАНА: `graduateProfilePath` віддає `Pathname`,
		// `localizedPath` — `ResolvedPathname`, і саме за цим типом правило визнає її
		// перевіреною. Описка в шляху знову ловиться компіляцією.
		// Завантаження НЕ викликається тут: `pushState` міняє
		// `page.state.graduateCode`, а від нього залежить ефект нижче — він і
		// піде по профіль. Доти виклик стояв і тут, і в ефекті, тож на кожен
		// клік летіли ДВА запити за той самий файл: `profiles.has(code)` ще
		// порожній, поки перший не відповів.
		pushState(profileHref(graduate), { graduateAddress: graduateAddress(graduate) });
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

			const updateParam = url.searchParams.get('update');
			updateOpen = updateParam === 'open' || updateParam === 'true';

			const gParam = url.searchParams.get('g');
			/* Приймає і `slug`, і `code`: посилання ходять по руках, і людині
			   різниці між ними не видно. */
			paramGraduate = gParam
				? (data.graduates.find((g) => g.slug === gParam || g.code === gParam) ?? null)
				: null;

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

				const masterParam = url.searchParams.get('master');
				rosterMasters = masterParam ? masterParam.split(',').filter(Boolean) : [];

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

					const atParam = url.searchParams.get('at');
				const atYear = atParam ? Number.parseInt(atParam, 10) : NaN;
				rosterScrolledYear = Number.isNaN(atYear) ? null : atYear;
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
				<a href={profileHref(graduate)}>{graduate.name}</a>
			</li>
		{/each}
	</ul>
</nav>

<div class="stage">
	<GraduateGalaxy onselect={openGraduate} />


	<GalaxyStageControls
		total={data.graduates.length}
		{locale}
		onopenroster={openRoster}
		onopenform={openForm}
	/>
</div>

<GraduateRoster
	graduates={data.graduates}
	open={rosterOpen && !selected && !updateOpen}
	onclose={closeRoster}
	onselect={openGraduate}
	onopenform={openForm}
	year={rosterYears}
	departments={rosterDepartments}
	masters={rosterMasters}
	photo={rosterPhoto}
	query={rosterQuery}
	onyearchange={setYears}
	ondepartmentschange={setDepartments}
	onmasterschange={setMasters}
	onphotochange={setPhoto}
	onquerychange={setQuery}
	initialScrolledYear={rosterScrolledYear}
	onscrolledyearchange={setScrolledYear}
/>

<GraduateCard
	graduate={selected}
	profile={selectedProfile}
	onclose={closeCard}
/>

<!--
	Вікно вантажиться лише тоді, коли його попросили: більшість відвідувачів
	приходить у галактику, а не по оголошення, і платити за нього завантаженням
	вони не мусять.
-->
{#if updateOpen}
	{#await import('$lib/components/GalaxyUpdateModal.svelte') then { default: GalaxyUpdateModal }}
		<GalaxyUpdateModal onclose={closeUpdate} />
	{/await}
{/if}

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

	/*
	 * Переноситься, а не тягнеться в один рядок.
	 *
	 * Доти тут стояв `inline-flex` без переносу, і поки кнопок було дві, це
	 * тримало. З двома входами — у групи й фестивалі — рядок став 566 px на
	 * екрані 412, тобто поїхав за край; спіймав це `viewport-overflow`, а не око.
	 *
	 * `left` разом із `right` і `justify-content: flex-end` — щоб перенесені
	 * кнопки лишалися притиснутими до правого краю, а не розповзалися.
	 */







</style>
