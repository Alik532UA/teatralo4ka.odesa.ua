<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';
	import { resolve } from '$app/paths';
	import { t } from 'svelte-i18n';

	let { data } = $props();
</script>

<StaticPage {data} testPrefix="teatr-pro" backHref={resolve('/projects')} backLabel={$t('projects.backToProjects')} />
