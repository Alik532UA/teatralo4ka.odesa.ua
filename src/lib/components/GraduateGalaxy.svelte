<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { WITH_PHOTO, WITHOUT_PHOTO, type GraduateIndexEntry } from '$lib/data/graduates';
	import { makeLanes, pickFree, type Lane } from '$lib/utils/graduateGalaxy';
	import GraduateStar from './GraduateStar.svelte';

	interface Props {
		/** Скільки портретів летить одночасно. Решта чекає в пулі. */
		photos?: number;
		/** Скільки зірок без обличчя летить одночасно. */
		plain?: number;
		onselect: (graduate: GraduateIndexEntry) => void;
	}

	// Тридцять анімованих елементів — удвічі менше роботи композитора на слабкому
	// телефоні. Відчуття галактики тримає не їх кількість: справжніх зірок кілька
	// сотень, і їх малює canvas одним шаром.
	let { photos = 10, plain = 20, onselect }: Props = $props();

	/**
	 * Дві смуги: з обличчями й без.
	 *
	 * Без обличчя — це 402 випускники, які ще не заповнили анкету. Вони не
	 * заглушка й не «менш важливі»: у переліку школи вони є, і в галактиці мусять
	 * летіти теж — зіркою, схожою на фонову, з іменем при наведенні.
	 *
	 * Обидві смуги рендеряться підмножинами й ротуються: 482 елементи з власною
	 * анімацією поклали б слабкий телефон, а на екрані все одно видно тридцять.
	 */
	let photoLanes = $state<Lane[]>([]);
	let plainLanes = $state<Lane[]>([]);
	let photoAssigned = $state<number[]>([]);
	let plainAssigned = $state<number[]>([]);

	onMount(() => {
		// Значення випадкові, тому з'являються лише після монтування: випадковість
		// під час prerender дала б HTML, який не збігається з першим кадром у
		// браузері, і гідрація «полагодила» б це стрибком усіх зірок.
		const photoCount = Math.min(photos, WITH_PHOTO.length);
		const plainCount = Math.min(plain, WITHOUT_PHOTO.length);

		photoLanes = makeLanes(photoCount, 34, Math.random);
		plainLanes = makeLanes(plainCount, 26, Math.random);
		photoAssigned = Array.from({ length: photoCount }, (_, i) => i);
		plainAssigned = Array.from({ length: plainCount }, (_, i) => i);
	});

	/** Обидві смуги одним переліком — щоб зірка описувалася в розмітці один раз. */
	const flying = $derived([
		...plainAssigned.map((index, lane) => ({
			kind: 'plain' as const,
			lane,
			graduate: WITHOUT_PHOTO[index],
			geometry: plainLanes[lane]
		})),
		...photoAssigned.map((index, lane) => ({
			kind: 'photo' as const,
			lane,
			graduate: WITH_PHOTO[index],
			geometry: photoLanes[lane]
		}))
	]);

	/** Доїхала до краю — беремо в доріжку іншого випускника з того самого пулу. */
	function rotate(kind: 'plain' | 'photo', lane: number) {
		const assigned = kind === 'photo' ? photoAssigned : plainAssigned;
		const size = kind === 'photo' ? WITH_PHOTO.length : WITHOUT_PHOTO.length;
		const next = pickFree(size, assigned, Math.random);
		if (next !== null) assigned[lane] = next;
	}
</script>

<div class="galaxy" data-testid="galaxy-section">
	<!-- Зірки на канвасі — оформлення; читалці вони ні про що не кажуть. -->
	<div class="galaxy__stars" aria-hidden="true">
		{#if browser}
			{#await import('$lib/components/backgrounds/Starfield.svelte') then { default: Starfield }}
				<Starfield />
			{/await}
		{/if}
	</div>

	<ul class="galaxy__lanes" data-testid="galaxy-list">
		{#each flying as item (item.kind + item.lane)}
			<li
				class="lane"
				style="--top: {item.geometry?.top ?? 0}%; --duration: {item.geometry?.duration ??
					30}s; --delay: {item.geometry?.delay ?? 0}s"
				data-testid="galaxy-list-item-{item.graduate.slug}"
			>
				<GraduateStar
					graduate={item.graduate}
					kind={item.kind}
					onselect={() => onselect(item.graduate)}
					onlap={() => rotate(item.kind, item.lane)}
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

	.lane {
		position: absolute;
		top: var(--top);
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
