<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { seo } from '$lib/services/seo.svelte';
	import DOMPurify from 'isomorphic-dompurify';

	interface Props {
		data: { uk: any; en: any };
		testPrefix?: string;
	}

	let { data, testPrefix = 'static' }: Props = $props();

	let content = $derived($locale === 'en' ? data.en : data.uk);

	$effect(() => {
		if (content?.metadata?.seo) {
			seo.update({
				title: content.metadata.seo.title,
				description: content.metadata.seo.description,
				ogImage: content.metadata.seo.ogImage
			});
		}
	});
</script>

<section class="page-content container" style="padding: 160px 24px 6rem;" data-testid="{testPrefix}-page-section">
	{#if content}
		<article class="prose" data-testid="{testPrefix}-page-article">
			{@html DOMPurify.sanitize(content.html)}
		</article>
	{:else}
		<div style="display: flex; justify-content: center; padding: 4rem;" data-testid="{testPrefix}-page-loading-container">
			<p data-testid="{testPrefix}-page-loading-label">{$t('common.loading')}</p>
		</div>
	{/if}
</section>
