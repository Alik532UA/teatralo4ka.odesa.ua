<script lang="ts">
	import { page } from '$app/state';
	import { getProjectPageBySlug } from '$lib/services/articles';
	import DetailPage from '$lib/components/DetailPage.svelte';
</script>

{#key page.params.slug}
<DetailPage
	param={page.params.slug}
	fetchFn={getProjectPageBySlug}
	backHref="/projects"
	backLabelKey="projects.backToProjects"
	loadingKey="projects.loadingProject"
	notFoundKey="projects.notFound"
	errorKey="projects.errorLoading"
	testIdPrefix="project-page"
/>
{/key}
