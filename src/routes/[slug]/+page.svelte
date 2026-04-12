<script lang="ts">
	import { page } from '$app/state';
	import { getPageBySlug } from '$lib/services/articles';
	import DetailPage from '$lib/components/DetailPage.svelte';
</script>

{#key page.params.slug}
<DetailPage
	param={page.params.slug}
	fetchFn={getPageBySlug}
	backHref="/"
	backLabelKey="news.backToHome"
	loadingKey="common.loading"
	notFoundKey="pages.notFound"
	errorKey="pages.errorLoading"
	testIdPrefix="dynamic-page"
/>
{/key}
