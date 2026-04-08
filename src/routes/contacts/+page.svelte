<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';

	let { data } = $props();

	let content = $derived($locale === 'en' ? data.en : data.uk);

	$effect(() => {
		if (content) {
			seo.update({
				title: content.metadata.seo.title,
				description: content.metadata.seo.description,
				ogImage: content.metadata.seo.ogImage
			});
		}
	});
</script>

<section class="page-content container" style="padding: 160px 24px 6rem;" data-testid="contacts-page-section">
	{#if content}
		<article class="prose" data-testid="contacts-page-article">
			{@html content.html}
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="contacts-page-loading-container">
			<p data-testid="contacts-page-loading-label">{$t('common.loading')}</p>
		</div>
	{/if}
</section>
