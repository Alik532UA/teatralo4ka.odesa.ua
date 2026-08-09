<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';
	import { resolve } from '$app/paths';
	import { t } from 'svelte-i18n';

	let { data } = $props();
</script>

<StaticPage {data} testPrefix="photo-archive" backHref={resolve('/projects')} backLabel={$t('projects.backToProjects')} />
