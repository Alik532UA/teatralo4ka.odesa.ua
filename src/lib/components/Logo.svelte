<script lang="ts">
	import { ui } from "$lib/states/ui.svelte";
	import { base } from "$app/paths";

	let { size = 'large' }: { size?: 'large' | 'small' } = $props();

	const dimensions = {
		large: { width: 140, height: 140 },
		small: { width: 80, height: 80 }
	};

	const d = $derived(dimensions[size]);
	const logoSrc = `${base}/logo-800px484px.png`;
</script>

<img
	src={logoSrc}
	alt="Логотип Одеської театральної школи"
	class="logo-img"
	width={d.width}
	height={d.height}
/>

<style>
	.logo-img {
		flex-shrink: 0;
		object-fit: contain;
		display: block;
	}
</style>
