<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from 'svelte-i18n';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:boundary>
	{@render children()}

	{#snippet failed(error, reset)}
		<div class="error-boundary" data-testid="error-boundary-container">
			<div class="error-boundary__content" data-testid="error-boundary-content-group">
				<h2 data-testid="error-boundary-title">{$t('common.errorTitle')}</h2>
				<p data-testid="error-boundary-message">{error instanceof Error ? error.message : String(error)}</p>
				<div class="error-boundary__actions" data-testid="error-boundary-actions-group">
					<button onclick={reset} data-testid="error-boundary-reset-button">{$t('common.tryAgain')}</button>
					<button onclick={() => location.reload()} data-testid="error-boundary-reload-button">{$t('common.reloadPage')}</button>
				</div>
			</div>
		</div>
	{/snippet}
</svelte:boundary>

<style>
	.error-boundary {
		padding: var(--space-2xl);
		text-align: center;
		background: var(--color-ice-blue);
		border-radius: var(--radius-lg);
		margin: var(--space-xl) 0;
	}

	.error-boundary__actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		margin-top: var(--space-lg);
	}

	button {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--accent-primary);
		background: var(--color-surface);
		color: var(--accent-primary);
		cursor: pointer;
		font-weight: 700;
		transition: all var(--transition-fast);
	}

	button:hover {
		background: var(--accent-primary);
		color: var(--color-white);
	}
</style>
