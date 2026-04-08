<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';
</script>

<section class="error-page container" style="padding: 160px 24px; min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;" data-testid="admin-error-page-section">
	<h1 style="font-family: var(--font-heading); font-size: 4rem; color: var(--color-deep-ocean); margin-bottom: 1rem;" data-testid="admin-error-page-status">{page.status}</h1>
	<p style="font-size: 1.1rem; color: var(--color-muted-text); margin-bottom: 2rem;" data-testid="admin-error-page-message">
		{page.error?.message || $t('error.generic')}
	</p>
	<a href={`${base}/admin`} class="btn btn-primary" data-testid="admin-error-page-back-link">{$t('error.backAdmin')}</a>
</section>
