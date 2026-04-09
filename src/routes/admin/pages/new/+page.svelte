<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	// Redirect to unified content route
	onMount(() => {
		goto(`${base}/admin/content/new?type=page`, { replaceState: true });
	});
</script>

<section class="container" style="padding: 120px 24px;">
	<p>Redirecting...</p>
</section>
