<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';
	import ProsePeopleLinks from '$lib/components/ProsePeopleLinks.svelte';

	let { data } = $props();
</script>

<StaticPage {data} testPrefix="art" />
<ProsePeopleLinks />
