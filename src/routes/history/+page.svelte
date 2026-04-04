<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { loadPageContent } from '$lib/i18n/loader';
	import type { PageContent } from '$lib/i18n/types';

	import { seo } from '$lib/services/seo.svelte';

	let content = $state<PageContent | null>(null);

	$effect(() => {
		const lang = $locale || 'uk';
		loadPageContent(lang, 'history').then(res => {
			content = res;
			if (res) {
				seo.update({
					title: res.metadata.seo.title,
					description: res.metadata.seo.description,
					ogImage: res.metadata.seo.ogImage
				});
			}
		});
	});
</script>

<section class="page-content container" style="padding: 160px 24px 6rem;">
	{#if content}
		<article class="prose">
			{@html content.html}
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;">
			<p>Завантаження...</p>
		</div>
	{/if}
</section>
