<script lang="ts">
	import { t } from 'svelte-i18n';
	import { untrack, type Snippet } from 'svelte';
	import { CalendarRange, List, LayoutGrid } from 'lucide-svelte';
	import SearchField from '$lib/components/SearchField.svelte';
	import MasterViewToggle, { type ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import GraduateCardOnPage from '$lib/components/GraduateCardOnPage.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';
	import { createGalaxyView } from '$lib/services/galaxyViewMode.svelte';

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
		/** Ключі словника для поля пошуку — свої в кожного переліку. */
		placeholderKey: string;
		nothingKey: string;
		/** Скільком обличчям бути в рядку. Типове — як у фестивалів. */
		maxFaces?: number;
	}

	let {
		rows,
		storageKey,
		testIdPrefix,
		matches,
		tiles,
		placeholderKey,
		nothingKey,
		maxFaces = 10
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
	const view = createGalaxyView(untrack(() => storageKey));

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

<div class="registry">
	<div class="registry__controls">
		<SearchField
			value={запит}
			onchange={(v) => (запит = v)}
			found={знайдені.length}
			{placeholderKey}
			{nothingKey}
			testid="{testIdPrefix}-search"
		/>
		<MasterViewToggle
			viewMode={режим}
			onchange={(mode) => view.set(mode)}
			options={РЕЖИМИ}
			testIdPrefix="{testIdPrefix}-view"
		/>
	</div>

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
	/* Пошук і перемикач одним рядком, а на вузькому — стовпчиком: та сама
	   розкладка, що в переліках вистав і груп. */
	.registry__controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
</style>
