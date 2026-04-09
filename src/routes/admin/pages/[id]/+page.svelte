<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const id = $derived(page.params.id);

	// Redirect to unified content route
	onMount(() => {
		goto(`${base}/admin/content/${id}`, { replaceState: true });
	});
</script>

<section class="container" style="padding: 120px 24px;">
	<p>Redirecting...</p>
</section>
