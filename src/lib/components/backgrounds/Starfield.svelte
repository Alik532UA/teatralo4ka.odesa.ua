<script lang="ts">
	import { onMount } from 'svelte';
	import { StarfieldEngine } from './engine/StarfieldEngine';

	let {
		theme = 'dark',
		color = '#cfe4ff',
		paused = false
	}: {
		theme?: 'light' | 'dark';
		color?: string;
		paused?: boolean;
	} = $props();

	let canvas: HTMLCanvasElement;
	let engine: StarfieldEngine;

	$effect(() => {
		engine?.setTheme(theme, color);
	});

	$effect(() => {
		if (engine) {
			engine.setActive(!paused);
		}
	});

	onMount(() => {
		engine = new StarfieldEngine(theme, color);
		if (canvas) {
			engine.mount(canvas);
			// Див. Particles.svelte: `$effect` спрацьовує до присвоєння `engine`.
			engine.setActive(!paused);
		}

		return () => {
			engine?.unmount();
		};
	});
</script>

<canvas bind:this={canvas} class="starfield"></canvas>

<style>
	.starfield {
		display: block;
		width: 100%;
		height: 100%;
		/* Зірки — оформлення: кліки мусять доходити до портретів під ними. */
		pointer-events: none;
		background: transparent;
	}
</style>
