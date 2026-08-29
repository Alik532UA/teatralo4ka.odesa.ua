<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { WITH_PHOTO, WITHOUT_PHOTO, type GraduateIndexEntry } from '$lib/data/graduates';
	import { galaxyShare, makeLanes, shuffled, type Lane } from '$lib/utils/graduateGalaxy';
	import GraduateStar from './GraduateStar.svelte';

	interface Props {
		onselect: (graduate: GraduateIndexEntry) => void;
		paused?: boolean;
	}

	let { onselect, paused = false }: Props = $props();

	/**
	 * Скільки зірок летить — залежить від ПЛОЩІ екрана.
	 *
	 * Доти летіли всі 514, скільки б місця не було. На широкому це виглядало
	 * задумано, на телефоні — суцільним килимом облич: та сама кількість на
	 * шосту частину площі. Тепер частку рахує `galaxyShare`, і на великому
	 * екрані вона однаково дорівнює одиниці, тобто там летять усі, як і раніше.
	 *
	 * Ротації, яку колись прибрали, це не повертає: підміни зірок на льоту
	 * немає. Порядок перемішується РАЗ на завантаження, і на малому екрані
	 * щоразу видно інших людей; повний перелік нікуди не дівається — він у
	 * реєстрі за кнопкою «Усі випускники».
	 *
	 * Ціна лишається тією ж: елементи з `translate`-анімацією лежать на
	 * композиторі, а не на головному потоці, тож малює їх GPU.
	 */
	let photoLanes = $state<Lane[]>([]);
	let plainLanes = $state<Lane[]>([]);
	let started = $state(false);
	let viewportW = $state(0);
	let viewportH = $state(0);

	/** Порядок фіксується на завантаження: при зміні розміру люди не стрибають. */
	let photoOrder = $state<GraduateIndexEntry[]>([]);
	let plainOrder = $state<GraduateIndexEntry[]>([]);

	const share = $derived(galaxyShare(viewportW, viewportH));
	/**
	 * Нижня межа — щоб у вузькому вікні галактика не спорожніла зовсім:
	 * шість портретів і два десятки цяток ще читаються як зоряне небо.
	 */
	const photoCount = $derived(Math.max(6, Math.round(photoOrder.length * share)));
	const plainCount = $derived(Math.max(20, Math.round(plainOrder.length * share)));

	const photoShown = $derived(photoOrder.slice(0, photoCount));
	const plainShown = $derived(plainOrder.slice(0, plainCount));

	onMount(() => {
		// Значення випадкові, тому з'являються лише після монтування: випадковість
		// під час prerender дала б HTML, який не збігається з першим кадром у
		// браузері, і гідрація «полагодила» б це стрибком усіх зірок.
		photoOrder = shuffled(WITH_PHOTO, Math.random);
		plainOrder = shuffled(WITHOUT_PHOTO, Math.random);
		started = true;
	});

	/**
	 * Доріжки перераховуються, лише коли зміниться САМА КІЛЬКІСТЬ.
	 *
	 * Крок по висоті — `100 / count`, тож при іншій кількості зірки мусять
	 * стати інакше. Але прив'язати це до ширини вікна означало б розкидати всю
	 * галактику наново на кожному пікселі перетягування рамки.
	 */
	$effect(() => {
		const photos = photoCount;
		const plains = plainCount;
		if (!started) return;
		untrack(() => {
			photoLanes = makeLanes(photos, 34, Math.random);
			plainLanes = makeLanes(plains, 26, Math.random);
		});
	});

	/** Обидві смуги одним переліком — щоб зірка описувалася в розмітці один раз. */
	const flying = $derived(
		started
			? [
					...plainShown.map((graduate, lane) => ({
						kind: 'plain' as const,
						lane,
						graduate,
						geometry: plainLanes[lane]
					})),
					...photoShown.map((graduate, lane) => ({
						kind: 'photo' as const,
						lane,
						graduate,
						geometry: photoLanes[lane]
					}))
				]
			: []
	);
</script>

<svelte:window bind:innerWidth={viewportW} bind:innerHeight={viewportH} />

<div class="galaxy" data-testid="galaxy-section">
	<!-- Зірки на канвасі — оформлення; читалці вони ні про що не кажуть. -->
	<div class="galaxy__stars" aria-hidden="true">
		{#if browser}
			{#await import('$lib/components/backgrounds/Starfield.svelte') then { default: Starfield }}
				<Starfield {paused} />
			{/await}
		{/if}
	</div>

	<ul class="galaxy__lanes" class:is-paused={paused} data-testid="galaxy-list">
		{#each flying as item (item.kind + item.lane)}
			<li
				class="lane"
				style="--top: {item.geometry?.top ?? 0}; --duration: {item.geometry?.duration ??
					30}s; --delay: {item.geometry?.delay ?? 0}s"
				data-testid="galaxy-list-item-{item.graduate.slug}"
			>
				<GraduateStar
					graduate={item.graduate}
					kind={item.kind}
					onselect={() => onselect(item.graduate)}
				/>
			</li>
		{/each}
	</ul>
</div>

<style>
	.galaxy {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--galaxy-bg);
		isolation: isolate;
	}

	.galaxy__stars {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.galaxy__lanes {
		position: absolute;
		inset: 0;
		z-index: 1;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.galaxy__lanes.is-paused .lane {
		animation-play-state: paused;
	}

	.lane {
		position: absolute;
		/*
		 * `--top` — число 0..100, а множник — висота галактики МІНУС висота зірки.
		 * З простими відсотками зірки з `top` під сотнею обрізало нижнім краєм:
		 * заміряно 27 із 402. Так само знято й ризик обрізання зверху.
		 */
		top: calc((100% - 56px) * var(--top) / 100);
		left: 0;
		/* `translate` окремою властивістю, а не в `transform`: збільшення зірки
		   живе саме в `transform`, і одне затирало б інше кадром анімації. */
		animation: drift var(--duration) linear var(--delay) infinite;
	}

	@keyframes drift {
		from {
			translate: -12vw 16.6vw;
		}
		to {
			translate: 112vw -16.6vw;
		}
	}

	/*
	 * Зупиняється ЛИШЕ та зірка, на яку навели — решта летить далі.
	 *
	 * `:has()` тут обов'язковий: сам `:hover` живе на кнопці всередині дочірнього
	 * компонента, а пауза потрібна доріжці, яка ту кнопку везе.
	 *
	 * `:global()` — теж обов'язковий, і це рівно пастка SVELTE-UI-v8 § 3.5:
	 * скоуп Svelte не дістає в дочірній компонент, тож без нього компілятор
	 * вважає селектор невживаним і ВИКИДАЄ його. Тобто пауза мовчки перестала б
	 * працювати; спіймав це `svelte-check` двома попередженнями
	 * `Unused CSS selector`, а не око.
	 */
	.lane:has(:global(button:hover)),
	.lane:has(:global(button:focus-visible)) {
		animation-play-state: paused;
		z-index: 2;
	}

	/*
	 * ACCESSIBILITY-v8 § 7. Зірки перестають літати й вишиковуються сіткою, яку
	 * можна спокійно розглянути. Прибрати їх зовсім було б гірше: сторінка
	 * втратила б головне, а вимога стосується руху, не вмісту.
	 */
	@media (prefers-reduced-motion: reduce) {
		.galaxy__lanes {
			display: flex;
			flex-wrap: wrap;
			align-content: flex-start;
			gap: 0.4rem;
			padding: 1rem;
			overflow-y: auto;
		}

		.lane {
			position: static;
			animation: none;
			translate: none;
		}
	}
</style>
