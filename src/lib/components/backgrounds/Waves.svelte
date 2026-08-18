<script lang="ts">
	import { onMount } from "svelte";
	import { WavesEngine } from "./engine/WavesEngine";

	let {
		theme = "light",
		color = "#0071e3",
		// Невидимий шар не малює: до 2026-08-16 усі чотири рушії крутили
		// requestAnimationFrame завжди, зокрема коли фон вибрано «немає».
		active = true
	} = $props<{
		theme?: "light" | "dark";
		color?: string;
		active?: boolean;
	}>();

	let canvas: HTMLCanvasElement;
	let engine: WavesEngine;

	$effect(() => {
		if (engine) {
			engine.setTheme(theme, color);
		}
	});

	$effect(() => {
		engine?.setActive(active);
	});

	onMount(() => {
		engine = new WavesEngine(theme, color);
		if (canvas) {
			engine.mount(canvas);
			// Див. Particles.svelte: `$effect` спрацьовує до присвоєння `engine`.
			engine.setActive(active);
		}

		return () => {
			engine?.unmount();
		};
	});
</script>

<canvas bind:this={canvas} class="bg-canvas" style="background: transparent;"></canvas>

<style>
	.bg-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
		background: transparent;
	}
</style>
