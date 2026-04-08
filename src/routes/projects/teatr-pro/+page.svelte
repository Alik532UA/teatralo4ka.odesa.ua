<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';

	let { data } = $props();
</script>

<StaticPage {data} testPrefix="teatr-pro" />
