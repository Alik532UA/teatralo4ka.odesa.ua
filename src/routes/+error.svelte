<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';
</script>

<section class="error-page container" style="padding: 160px 24px; min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;" data-testid="error-page-section">
	<h1 style="font-family: var(--font-heading); font-size: 6rem; color: var(--color-deep-ocean); margin-bottom: 1rem;" data-testid="error-page-status">{page.status}</h1>
	<p style="font-size: 1.3rem; color: var(--color-muted-text); margin-bottom: 3rem; max-width: 500px;" data-testid="error-page-message">
		{#if page.status === 404}
			{$t('error.notFound')}
		{:else}
			{page.error?.message || $t('error.generic')}
		{/if}
	</p>
	<a href={`${base}/`} class="btn btn-primary" data-testid="error-page-home-link">{$t('error.backHome')}</a>
</section>
