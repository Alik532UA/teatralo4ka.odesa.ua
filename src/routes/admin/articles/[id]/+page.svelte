<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const id = $derived(page.params.id);

	// Redirect to unified content route
	onMount(() => {
		// Раніше було `${base}/admin/content/${id}`, і без id виходила адреса
		// «.../undefined». resolve() вимагає рядок, тож випадок довелося назвати.
		goto(id ? resolve('/admin/content/[id]', { id }) : resolve('/admin/content'), {
			replaceState: true
		});
	});
</script>

<section class="container" style="padding: 120px 24px;">
	<p>Redirecting...</p>
</section>
