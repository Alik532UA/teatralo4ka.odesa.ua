<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props<{ children: any }>();
	let error: Error | null = $state(null);

	function reset() {
		error = null;
	}

	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			error = event.error;
		};
		window.addEventListener('error', handleError);
		return () => window.removeEventListener('error', handleError);
	});
</script>

{#if error}
	<div class="error-boundary" data-testid="error-boundary-container">
		<div class="error-boundary__content" data-testid="error-boundary-content-group">
			<h2 data-testid="error-boundary-title">Ой! Щось пішло не так</h2>
			<p data-testid="error-boundary-message">{error.message}</p>
			<div class="error-boundary__actions" data-testid="error-boundary-actions-group">
				<button onclick={reset} data-testid="error-boundary-reset-button">Спробувати знову</button>
				<button onclick={() => location.reload()} data-testid="error-boundary-reload-button">Оновити сторінку</button>
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

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
		border: 1px solid var(--color-sea-blue);
		background: var(--color-surface);
		color: var(--color-sea-blue);
		cursor: pointer;
		font-weight: 700;
		transition: all var(--transition-fast);
	}

	button:hover {
		background: var(--color-sea-blue);
		color: var(--color-white);
	}
</style>
