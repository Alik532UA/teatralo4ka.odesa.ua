<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import {
		graduateProfilePath,
		type GraduateIndexEntry
	} from '$lib/data/graduates';
	import GraduateStar from '$lib/components/GraduateStar.svelte';

	interface Props {
		graduates: GraduateIndexEntry[];
		masterName: string;
	}

	let { graduates, masterName }: Props = $props();

	let started = $state(false);
	let photoLanes = $state<{ left: number; duration: number; delay: number }[]>([]);
	let plainLanes = $state<{ left: number; duration: number; delay: number }[]>([]);

	const withPhoto = $derived(graduates.filter((g) => g.hasPhoto));
	const withoutPhoto = $derived(graduates.filter((g) => !g.hasPhoto));

	function makeVerticalLanes(count: number, minSeconds: number, random: () => number) {
		if (count <= 0) return [];
		const step = 100 / count;
		return Array.from({ length: count }, (_, index) => ({
			left: count === 1 ? 50 : Math.min(80, Math.max(20, index * step + (random() - 0.5) * step * 0.6)),
			duration: minSeconds + random() * minSeconds * 0.5,
			delay: -random() * minSeconds * 2
		}));
	}

	onMount(() => {
		photoLanes = makeVerticalLanes(withPhoto.length, 22, Math.random);
		plainLanes = makeVerticalLanes(withoutPhoto.length, 18, Math.random);
		started = true;
	});

	const flying = $derived(
		started
			? [
					...withoutPhoto.map((graduate, lane) => ({
						kind: 'plain' as const,
						lane,
						graduate,
						geometry: plainLanes[lane]
					})),
					...withPhoto.map((graduate, lane) => ({
						kind: 'photo' as const,
						lane,
						graduate,
						geometry: photoLanes[lane]
					}))
				]
			: []
	);

	function handleSelectGraduate(graduate: GraduateIndexEntry) {
		if (graduate.code) {
			const path = graduateProfilePath(graduate.code);
			goto(path);
		} else {
			// If graduate only has name, navigate to Galaxy search
			const searchUrl = `${resolve('/projects/galaxy-graduates')}?search=${encodeURIComponent(graduate.name)}`;
			goto(searchUrl);
		}
	}
</script>

<aside
	class="flow-stream"
	aria-label={$t('galaxy.graduatesOfMaster', { default: `Випускники майстра: ${masterName}` })}
	data-testid="master-graduate-flow-section"
>
	{#if graduates.length > 0}
		<ul class="flow-lanes" data-testid="master-graduate-flow-list">
			{#each flying as item (item.kind + item.lane + item.graduate.slug)}
				<li
					class="lane"
					style="--left: {item.geometry?.left ?? 50}; --duration: {item.geometry?.duration ?? 22}s; --delay: {item.geometry?.delay ?? 0}s"
					data-testid="master-graduate-flow-item-{item.graduate.slug}"
				>
					<GraduateStar
						graduate={item.graduate}
						kind={item.kind}
						onselect={() => handleSelectGraduate(item.graduate)}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<style>
	.flow-stream {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 480px;
		pointer-events: none;
		overflow: visible;
	}

	@media (min-width: 860px) {
		.flow-stream {
			position: fixed;
			right: 0;
			top: 0;
			bottom: 0;
			width: clamp(280px, 34vw, 480px);
			height: auto;
			min-height: 0;
			z-index: 5;
		}
	}

	.flow-lanes {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		overflow: visible;
	}

	.lane {
		position: absolute;
		top: 0;
		width: 56px;
		height: 56px;
		left: calc((100% - 56px) * var(--left) / 100);
		pointer-events: auto;
		animation: streamUp var(--duration) linear var(--delay) infinite;
	}

	@keyframes streamUp {
		from {
			translate: 0 105vh;
		}
		to {
			translate: 0 -15vh;
		}
	}

	@media (max-width: 859px) {
		@keyframes streamUp {
			from {
				translate: 0 520px;
			}
			to {
				translate: 0 -70px;
			}
		}
	}

	.lane:has(:global(button:hover)),
	.lane:has(:global(button:focus-visible)) {
		animation-play-state: paused;
		z-index: 50;
	}

	@media (prefers-reduced-motion: reduce) {
		.flow-stream {
			position: static;
			height: auto;
			min-height: 0;
			pointer-events: auto;
		}

		.flow-lanes {
			position: static;
			display: flex;
			flex-wrap: wrap;
			align-content: flex-start;
			gap: 0.5rem;
			padding: 1rem 0;
			mask-image: none;
			-webkit-mask-image: none;
		}

		.lane {
			position: static;
			animation: none;
			translate: none;
			height: auto;
		}
	}
</style>
