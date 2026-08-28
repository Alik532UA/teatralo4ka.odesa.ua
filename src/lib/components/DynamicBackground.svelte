<script lang="ts">
	import Particles from "./backgrounds/Particles.svelte";
	import Waves from "./backgrounds/Waves.svelte";
	import FloatingShapes from "./backgrounds/FloatingShapes.svelte";
	import MiniIcons from "./backgrounds/MiniIcons.svelte";
	import { onMount } from "svelte";
	import type { Theme } from "$lib/config/themes";

	let { backgroundType = 0, theme = "light", enabled = false } = $props<{
		backgroundType?: 0 | 1 | 2 | 3 | 4;
		theme?: Theme;
		enabled?: boolean;
	}>();

	let fixedHeight = $state("100vh");
	let lastWidth = 0;
	let isVisible = $derived(enabled && backgroundType !== 0);

	onMount(() => {
		const updateHeight = () => {
			const isMobile = window.innerWidth <= 1024;
			const buffer = isMobile ? 300 : 0;
			fixedHeight = window.innerHeight + buffer + "px";
			lastWidth = window.innerWidth;
		};

		updateHeight();

		const handleResize = () => {
			if (window.innerWidth === lastWidth) return;
			updateHeight();
		};

		window.addEventListener("resize", handleResize);

		return () => {
			if (typeof window !== "undefined") {
				window.removeEventListener("resize", handleResize);
			}
		};
	});
</script>

<!--
	Усі чотири шари лишаються змонтованими заради плавного перетікання між
	фонами — але тепер лише ВИДИМИЙ малює. Раніше «змонтовані» означало ще й
	«чотири цикли requestAnimationFrame завжди», зокрема коли фон вибрано
	«немає»: там змінювалася тільки прозорість.
-->
<div
	class="bg-container"
	style="height: {fixedHeight}; opacity: {isVisible ? 1 : 0};"
	data-type={backgroundType}
	data-visible={isVisible ? 'true' : 'false'}
>
	<div class="bg-layer" class:active={backgroundType === 1}>
		<Particles {theme} active={isVisible && backgroundType === 1} />
	</div>
	<div class="bg-layer" class:active={backgroundType === 2}>
		<Waves {theme} active={isVisible && backgroundType === 2} />
	</div>
	<div class="bg-layer" class:active={backgroundType === 3}>
		<FloatingShapes {theme} active={isVisible && backgroundType === 3} />
	</div>
	<div class="bg-layer" class:active={backgroundType === 4}>
		<MiniIcons {theme} active={isVisible && backgroundType === 4} />
	</div>
</div>

<style>
	.bg-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 0;
		background: transparent;
		pointer-events: none;
		transition: opacity 800ms ease-in-out;
	}

	.bg-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		pointer-events: none;
		opacity: 0;
		transition: opacity 800ms ease-in-out;
	}

	.bg-layer.active {
		opacity: 1;
	}
</style>
