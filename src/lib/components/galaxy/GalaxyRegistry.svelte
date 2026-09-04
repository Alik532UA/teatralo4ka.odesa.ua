<script lang="ts">
	import { t } from 'svelte-i18n';
	import { untrack, type Snippet } from 'svelte';
	import { CalendarRange, List, LayoutGrid } from 'lucide-svelte';
	import GalaxyRegistryHeader from '$lib/components/galaxy/GalaxyRegistryHeader.svelte';
	import type { ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import GraduateCardOnPage from '$lib/components/GraduateCardOnPage.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';
	import { createGalaxyView, type GalaxyView } from '$lib/services/galaxyViewMode.svelte';

	/**
	 * Сторінка-перелік галактики: пошук, три режими показу, обличчя, картка на місці.
	 *
	 * ## ЧОМУ ЦЕЙ КОМПОНЕНТ Є
	 *
	 * Прохання автора, дослівно: «але ремонтували костилем, а по ремонтувати так
	 * щоб при створенні наступних подібних сторінок ці відсутні елементи були,
	 * бо кожен раз створюється сторінка на подобі існуючої і саме ці елементи
	 * чомусь не створюються».
	 *
	 * Так і було. Вистави, групи й фестивалі мали пошук, перемикач режимів і
	 * мініатюри випускників; заклади освіти й театри — ні. І не тому, що хтось
	 * вирішив інакше: обидві нові сторінки я писав, дивлячись на сусідню, а всі
	 * ці речі жили не в ній, а в ста п'ятдесяти рядках ОДНАКОВОГО ЗВ'ЯЗУВАННЯ —
	 * стан режиму, стан запиту, звуження, три гілки розкладки, стан картки. Те,
	 * що переписують руками, копіюють не повністю.
	 *
	 * Тепер зв'язування тут. Сторінка перекладає свої дані у `GalaxyRow[]` і
	 * каже, що вважати збігом; решта приходить сама. Що це не забудеться і в
	 * наступний раз, стежить `src/galaxy-registry.test.ts`: перелік без пошуку
	 * або без режимів показу не пройде гейт.
	 *
	 * ## Чого тут навмисно немає
	 *
	 * Плитки. У кожного переліку картка справді своя — у театру місто й сайт, у
	 * закладу повна назва, у вистави автор і нагороди, — і зводити їх до
	 * спільної означало б або п'ять гілок усередині, або втратити те, чим вони
	 * різні. Тому плитка приходить сніпетом: спільне зв'язування, власна картка.
	 *
	 * Так само немає ані звуження за роками, ані «області показу»
	 * (`GalaxyScope`): це потрібно двом переліком із п'яти, і кожному по-своєму.
	 */
	interface Props {
		/** Рядки вже перекладені сторінкою: `memberIds` тут і дають обличчя. */
		rows: readonly GalaxyRow[];
		/**
		 * Ключ у сховищі для режиму показу — свій на кожен перелік.
		 *
		 * Спільний означав би, що перемикач на театрах тихо міняє вигляд
		 * закладів; розбір — у докблоці `services/galaxyViewMode.svelte.ts`.
		 */
		storageKey: string;
		/** Початок `data-testid`: `e2e/testid.spec.ts` вимагає унікальності в межах сторінки. */
		testIdPrefix: string;
		/**
		 * Що вважати збігом із запитом.
		 *
		 * Вирішує сторінка, а не перелік: у театру шукають ще й місто, у закладу
		 * — повну назву, і рядок нічого з цього не знає. Немає функції — пошук
		 * іде по назві й підпису, тобто по тому, що видно на екрані.
		 */
		matches?: (row: GalaxyRow, query: string) => boolean;
		/** Плитка — власна розмітка сторінки. Немає сніпета — режиму плитки не буде. */
		tiles?: Snippet<[readonly GalaxyRow[]]>;
		/**
		 * Звернення «Додати …» — МІЖ пошуком і переліком.
		 *
		 * Сніпетом, бо текст і значки в нього свої, а місце — спільне. Саме місце
		 * й було половиною скарги автора: на закладах і театрах це звернення
		 * стояло ВИЩЕ за назву розділу, тож уся шапка з'їжджала на сімдесят
		 * пікселів проти трьох старших сторінок (заміряно: h1 на 315 замість
		 * 241). Тепер порядок один: назва з перемикачем, пошук, звернення,
		 * перелік.
		 */
		addCard?: Snippet;
		/** Ключі словника для поля пошуку — свої в кожного переліку. */
		placeholderKey: string;
		nothingKey: string;
		/** Назва розділу, число поруч із нею й рядок-пояснення — усе в шапці. */
		title: string;
		titleTestId: string;
		count: number;
		countTestId?: string;
		hint?: string;
		hintTestId?: string;
		/** Скільком обличчям бути в рядку. Типове — як у фестивалів. */
		maxFaces?: number;
		/**
		 * Яким режимом відкривається перелік, поки людина не вибрала свій.
		 *
		 * Типове — хронологія, як у трьох старших сторінок. Заклади освіти й
		 * театри відкриваються плиткою: розбір, чому саме там рік слабка вісь, —
		 * у докблоці `services/galaxyViewMode.svelte.ts`.
		 */
		defaultView?: GalaxyView;
	}

	let {
		rows,
		storageKey,
		testIdPrefix,
		matches,
		tiles,
		addCard,
		placeholderKey,
		nothingKey,
		title,
		titleTestId,
		count,
		countTestId,
		hint,
		hintTestId,
		maxFaces = 10,
		defaultView = 'timeline'
	}: Props = $props();

	/*
	 * Ключ сховища читається ОДИН раз — і саме так і треба.
	 *
	 * `svelte-check` попереджав тут («This reference only captures the initial
	 * value»), і попередження слушне за формою, але не за суттю: перелік не
	 * міняє свого ключа за життя сторінки, а створити стан наново означало б
	 * скинути обраний режим. Тому читання загорнуте в `untrack` — це той самий
	 * «один раз», але сказаний уголос, а не приховане ігнорування.
	 */
	const view = createGalaxyView(
		untrack(() => storageKey),
		untrack(() => defaultView)
	);

	/*
	 * Режим плитки з'являється ЛИШЕ коли сторінка дала сніпет. Інакше перемикач
	 * показував би третю кнопку, яка нічого не робить — гірше за її відсутність.
	 */
	const РЕЖИМИ = $derived<ViewOption[]>([
		{ value: 'timeline', label: $t('galaxy.viewModes.timeline'), icon: CalendarRange },
		{ value: 'list', label: $t('galaxy.viewModes.list'), icon: List },
		...(tiles ? [{ value: 'tiles', label: $t('galaxy.viewModes.tiles'), icon: LayoutGrid }] : [])
	]);

	let запит = $state('');

	const типовийЗбіг = (row: GalaxyRow, q: string) =>
		`${row.title} ${row.subtitle ?? ''}`.toLowerCase().includes(q);

	const знайдені = $derived.by(() => {
		const q = запит.trim().toLowerCase();
		if (!q) return rows;
		const збіг = matches ?? типовийЗбіг;
		return rows.filter((row) => збіг(row, q));
	});

	/*
	 * Якщо сніпета плитки немає, а в сховищі лежить `tiles` від іншого разу —
	 * показуємо хронологію. Без цього перелік був би порожнім, і виглядало б це
	 * як зламана сторінка, а не як забутий стан.
	 */
	const режим = $derived(view.current === 'tiles' && !tiles ? 'timeline' : view.current);
</script>

<GalaxyRegistryHeader
	{title}
	{titleTestId}
	{count}
	{countTestId}
	{hint}
	{hintTestId}
	searchValue={запит}
	onSearch={(v) => (запит = v)}
	found={знайдені.length}
	{placeholderKey}
	{nothingKey}
	searchTestId="{testIdPrefix}-search"
	viewMode={режим}
	onView={(mode) => view.set(mode)}
	viewOptions={РЕЖИМИ}
	viewTestId="{testIdPrefix}-view"
/>

{#if addCard}{@render addCard()}{/if}

<div class="registry">
	{#if режим === 'tiles' && tiles}
		{@render tiles(знайдені)}
	{:else}
		<GalaxyRows rows={знайдені} grouped={режим === 'timeline'} {testIdPrefix} {maxFaces} />
	{/if}
</div>

<!--
	Картка випускника відкривається НА ЦІЙ сторінці — інакше натискання на
	обличчя в рядку забирало б читача в галактику, тобто зі сторінки, з якої він
	щойно почав. Те саме правило й та сама причина, що на сторінках вистав, груп
	і фестивалів; тут воно просто перестало бути тим, що забувають скопіювати.
-->
<GraduateCardOnPage />

<style>
	.registry {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	/*
	 * Шапка ЗОВНІ цього контейнера — і це не дрібниця розкладки. Вона мусить
	 * стояти в тому самому потоці, що на трьох старших сторінках: назва з
	 * перемикачем, під нею пошук, а вже потім звернення «Додати» і сам перелік.
	 * Усередині `.registry` вона отримала б чужий `gap` і поїхала б на 1,1 rem.
	 */
</style>
