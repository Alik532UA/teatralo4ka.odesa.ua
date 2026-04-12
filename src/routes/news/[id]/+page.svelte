<script lang="ts">
	import { page } from '$app/state';
	import { getArticleById } from '$lib/services/articles';
	import DetailPage from '$lib/components/DetailPage.svelte';
</script>

{#key page.params.id}
<DetailPage
	param={page.params.id}
	fetchFn={getArticleById}
	backHref="/news"
	backLabelKey="news.backToNews"
	loadingKey="news.loadingArticle"
	notFoundKey="news.notFound"
	errorKey="news.errorLoading"
	testIdPrefix="article"
/>
{/key}

