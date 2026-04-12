<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';

	let { data } = $props();
</script>

<StaticPage {data} testPrefix="teatr-pro" backHref={`${base}/projects`} backLabel={$t('projects.backToProjects')} />
