<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from 'svelte-i18n';
	let { children, fallback }: { children: Snippet, fallback?: Snippet } = $props();
	let error = $state<Error | null>(null);

	function handleError(e: any, reset: () => void) {
		console.error("ErrorBoundary caught:", e);
		error = e;
	}
</script>

<svelte:boundary onerror={handleError}>
	{#if error}
		{#if fallback}
			{@render fallback()}
		{:else}
			<div class="error-container" data-testid="error-boundary-container">
				<h2>{$t('common.errorTitle')}</h2>
				<p>{$t('common.errorDescription')}</p>
				<button onclick={() => error = null} data-testid="error-boundary-retry">{$t('common.tryAgain')}</button>
			</div>
		{/if}
	{:else}
		{@render children()}
	{/if}
</svelte:boundary>

<style>
	.error-container {
		padding: 2rem;
		text-align: center;
		background: #fee2e2;
		color: #991b1b;
		border-radius: 12px;
		margin: 1rem 0;
	}
	button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
</style>