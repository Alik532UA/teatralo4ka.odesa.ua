<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { WITH_PHOTO, WITHOUT_PHOTO, type GraduateIndexEntry } from '$lib/data/graduates';
	import { makeLanes, type Lane } from '$lib/utils/graduateGalaxy';
	import GraduateStar from './GraduateStar.svelte';

	interface Props {
		onselect: (graduate: GraduateIndexEntry) => void;
		paused?: boolean;
	}

	let { onselect, paused = false }: Props = $props();

	/**
	 * Летять УСІ 482 випускники, без винятку й без ротації.
	 *
	 * Перша версія тримала на екрані тридцять і підмінювала їх, коли зірка
	 * доїжджала до краю. Це економило роботу композитора й водночас означало, що
	 * більшості людей у галактиці просто немає — а сторінка про те, що вони є.
	 *
	 * Ціна відома й заміряна (див. коміт): 482 елементи з `translate`-анімацією
	 * лежать на композиторі, а не на головному потоці, тож малює їх GPU. Разом із
	 * ротацією пішла й потреба в `pickFree`.
	 */
	let photoLanes = $state<Lane[]>([]);
	let plainLanes = $state<Lane[]>([]);
	let started = $state(false);

	onMount(() => {
		// Значення випадкові, тому з'являються лише після монтування: випадковість
		// під час prerender дала б HTML, який не збігається з першим кадром у
		// браузері, і гідрація «полагодила» б це стрибком усіх зірок.
		photoLanes = makeLanes(WITH_PHOTO.length, 34, Math.random);
		plainLanes = makeLanes(WITHOUT_PHOTO.length, 26, Math.random);
		started = true;
	});

	/** Обидві смуги одним переліком — щоб зірка описувалася в розмітці один раз. */
	const flying = $derived(
		started
			? [
					...WITHOUT_PHOTO.map((graduate, lane) => ({
						kind: 'plain' as const,
						lane,
						graduate,
						geometry: plainLanes[lane]
					})),
					...WITH_PHOTO.map((graduate, lane) => ({
						kind: 'photo' as const,
						lane,
						graduate,
						geometry: photoLanes[lane]
					}))
				]
			: []
	);
</script>

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
			translate: -8vw 0;
		}
		to {
			translate: 108vw 0;
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
