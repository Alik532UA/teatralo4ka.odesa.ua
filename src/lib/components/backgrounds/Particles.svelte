<script lang="ts">
	import { onMount } from "svelte";
	import { ParticlesEngine } from "./engine/ParticlesEngine";

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
	let engine: ParticlesEngine;

	$effect(() => {
		if (engine) {
			engine.setTheme(theme, color);
		}
	});

	$effect(() => {
		engine?.setActive(active);
	});

	onMount(() => {
		engine = new ParticlesEngine(theme, color);
		if (canvas) {
			engine.mount(canvas);
			// Стан ОБОВ'ЯЗКОВО і тут, не лише в `$effect` вище: ефект спрацьовує
			// раніше, ніж `onMount` присвоїть `engine`, тож перший його прохід не
			// робить нічого. А якщо `active` далі не змінюється — і не спрацює вже
			// ніколи. Заміряно: без цього рядка чотири рушії крутили rAF і далі,
			// 236 викликів за секунду замість ~60.
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
