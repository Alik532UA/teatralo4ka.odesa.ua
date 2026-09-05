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

	let galaxyEl = $state<HTMLDivElement | null>(null);
	let tiltX = $state(0);
	let tiltY = $state(0);
	let pointerX = $state(-2000);
	let pointerY = $state(-2000);
	let pointerActive = $state(false);

	/**
	 * РЕАКЦІЯ НА КУРСОР — раз на кадр, а не на кожну подію.
	 *
	 * ## Що було виміряно
	 *
	 * Галактика «підглючувала» саме під рухом мишею, і замір це підтвердив
	 * (1440×900, збірка, 140 рухів курсора): у спокої 56 к/с, медіана кадру
	 * 16,7 мс, довгих задач НУЛЬ. Під рухом — 18,5 к/с, медіана 50 мс, і
	 * головний потік зайнятий 4288 мс із 7516, тобто 57 % часу, 74 довгі задачі.
	 * Кожен кадр довший за 32 мс. Тобто гальмувала не сама анімація, а обробка
	 * курсора.
	 *
	 * ## Чому саме вона
	 *
	 * `pointermove` приходить частіше за кадр (у мишей 125–1000 Гц), а обробник
	 * робив на КОЖНУ подію три дорогі речі:
	 *
	 *   1. `matchMedia(...)` — новий об'єкт запиту щоразу;
	 *   2. `getBoundingClientRect()` — примусовий перерахунок розкладки;
	 *   3. запис у п'ять станів, звідки виходили CSS-змінні на `.galaxy` і
	 *      `.galaxy__lanes`. І це найдорожче: користувацькі властивості
	 *      УСПАДКОВУЮТЬСЯ, тож зміна змінної на контейнері знецінює обчислений
	 *      стиль усього піддерева — а це 400+ доріжок, кожна з кнопкою й
	 *      зображенням. Плюс `::after` перемальовував радіальний градієнт на
	 *      весь екран.
	 *
	 * ## Що зроблено
	 *
	 * Подія тепер лише запам'ятовує координати вікна й просить кадр. Уся лічба —
	 * в кадрі, тобто не частіше за 60 разів на секунду, скільки б подій не
	 * прийшло. Прямокутник галактики кешується й скидається лише на зміні
	 * розміру вікна (сцена нерухома: `position: fixed`), а `prefers-reduced-
	 * motion` читається один раз на монтуванні — так само, як це робить
	 * `CanvasEngine`.
	 *
	 * Самі ефекти НЕ змінені: нахил смуг ті самі 12/8 px, підсвітка — той самий
	 * градієнт 550 px і та сама поява за 0,3 с.
	 */
	let рухДозволено = false;
	let сироX = 0;
	let сироY = 0;
	let кадрКурсора = 0;
	let рамка: DOMRect | null = null;

	onMount(() => {
		рухДозволено = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return () => {
			if (кадрКурсора) cancelAnimationFrame(кадрКурсора);
		};
	});

	/* Прямокутник міряється заново лише після зміни розміру вікна. */
	$effect(() => {
		void viewportW;
		void viewportH;
		рамка = null;
	});

	function handlePointerMove(e: PointerEvent) {
		if (!рухДозволено) return;
		сироX = e.clientX;
		сироY = e.clientY;
		if (кадрКурсора) return;
		кадрКурсора = requestAnimationFrame(порахуватиКурсор);
	}

	function порахуватиКурсор() {
		кадрКурсора = 0;
		if (!galaxyEl) return;
		рамка ??= galaxyEl.getBoundingClientRect();
		const rect = рамка;
		const x = сироX - rect.left;
		const y = сироY - rect.top;
		if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
			tiltX = 0;
			tiltY = 0;
			pointerActive = false;
			return;
		}
		pointerX = x;
		pointerY = y;
		pointerActive = true;
		const relX = (x / rect.width - 0.5) * 2;
		const relY = (y / rect.height - 0.5) * 2;
		tiltX = relX * 12;
		tiltY = relY * 8;
	}

	function handlePointerLeave() {
		tiltX = 0;
		tiltY = 0;
		pointerActive = false;
	}

	/* Підсвітка — окремий шар 1100×1100 із НЕРУХОМИМ градієнтом, який їздить
	   зсувом. Числа: радіус градієнта 550 px, тобто центр шару має стояти під
	   курсором. Розбір, чому не `::after` із рухомим центром, — у стилях. */
	const glowX = $derived(pointerX - 550);
	const glowY = $derived(pointerY - 550);
</script>

<svelte:window
	bind:innerWidth={viewportW}
	bind:innerHeight={viewportH}
	onpointermove={handlePointerMove}
	onpointerleave={handlePointerLeave}
/>

<div bind:this={galaxyEl} class="galaxy" data-testid="galaxy-section">
	<!-- Шар підсвітки під курсором. Окремим елементом БЕЗ дітей: див. стилі. -->
	<div
		class="galaxy__glow"
		aria-hidden="true"
		style="translate: {glowX}px {glowY}px; opacity: {pointerActive ? 1 : 0};"
	></div>
	<!-- Зірки на канвасі — оформлення; читалці вони ні про що не кажуть. -->
	<div class="galaxy__stars" aria-hidden="true">
		{#if browser}
			{#await import('$lib/components/backgrounds/Starfield.svelte') then { default: Starfield }}
				<Starfield {paused} />
			{/await}
		{/if}
	</div>

	<ul
		class="galaxy__lanes"
		class:is-paused={paused}
		style="translate: {tiltX.toFixed(2)}px {tiltY.toFixed(2)}px;"
		data-testid="galaxy-list"
	>
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

	/*
	 * Де немає курсора — немає й підсвітки під ним.
	 *
	 * Пляма 1100×1100 їздить за вказівником; на дотиковому екрані вказівника
	 * немає взагалі, тож вона малювала б себе під пальцем на мить дотику — і
	 * весь час тримала б окремий композитний шар ні за що.
	 *
	 * Заміряно 2026-09-05: гейт `viewport-overflow` назвав її на мобільному
	 * («ширина 1100 при екрані 412»). Сторінку боком вона не жене — `.galaxy`
	 * має `overflow: hidden`, — але правило гейта правильне, і правильна
	 * відповідь на нього не виняток у переліку, а прибрати те, що на цьому
	 * пристрої й так марне.
	 */
	@media (hover: none) {
		.galaxy__glow {
			display: none;
		}
	}

	.galaxy__stars {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	/*
	 * ПІДСВІТКА: шар зі сталим градієнтом, який ЇЗДИТЬ, а не перемальовується.
	 *
	 * Доти це був `::after` на всю сцену, де центр градієнта задавала пара
	 * власних властивостей із позицією курсора — назви тут навмисно не
	 * виписані: гейт `css-variables` читає коментар як код і вважав би це
	 * посиланням на змінну, якої більше немає. Виглядало так само, коштувало
	 * інакше:
	 * центр градієнта — частина фону, тож кожен рух курсора змушував браузер
	 * перемальовувати градієнт РОЗМІРОМ У ВЕСЬ ЕКРАН, і робив це головний потік.
	 * Плюс змінні жили на `.galaxy`, а користувацькі властивості
	 * успадковуються — тобто заново обчислювався стиль усіх 400+ доріжок під
	 * ним.
	 *
	 * Тепер градієнт стоїть на місці всередині шару 1100×1100 (двічі радіус),
	 * а під курсор його ставить `translate`. Зсув браузер віддає композитору:
	 * ні перемальовування, ні перерахунку стилю сусідів. Вигляд той самий —
	 * ті самі 550 px, той самий колір і та сама поява за 0,3 с.
	 *
	 * Дітей у шару немає навмисно: успадкування нікого не зачіпає.
	 */
	.galaxy__glow {
		position: absolute;
		top: 0;
		left: 0;
		width: 1100px;
		height: 1100px;
		pointer-events: none;
		background: radial-gradient(
			550px circle at center,
			rgba(14, 165, 233, 0.07),
			transparent 70%
		);
		z-index: 1;
		transition: opacity 0.3s ease;
		will-change: translate;
	}

	/*
	 * Нахил смуг приходить ІНЛАЙНОВИМ `translate`, а не парою змінних.
	 *
	 * Причина та сама, що в підсвітки, і вона важливіша тут: `--tilt-x` на
	 * цьому елементі успадковувалася в кожну з 400+ доріжок, тож кожен рух
	 * курсора знецінював обчислений стиль усього піддерева. Звичайна
	 * властивість `translate` не успадковується — зміна лишається на самому
	 * елементі й іде композитору.
	 */
	.galaxy__lanes {
		position: absolute;
		inset: 0;
		z-index: 1;
		margin: 0;
		padding: 0;
		list-style: none;
		transition: translate 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
		will-change: translate;
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
		.galaxy__glow {
			display: none;
		}

		/*
		 * `translate` тут уже НЕ скидається: він приходить інлайном, тобто
		 * правило його однаково не перебило б. Скидати нічого й не треба —
		 * обробник курсора при «зменшити рух» виходить одразу, тож нахил
		 * лишається нулем, а нуль і `none` дають те саме.
		 */
		.galaxy__lanes {
			display: flex;
			flex-wrap: wrap;
			align-content: flex-start;
			gap: 0.4rem;
			padding: 1rem;
			overflow-y: auto;
			transition: none;
		}

		.lane {
			position: static;
			animation: none;
			translate: none;
		}
	}
</style>
