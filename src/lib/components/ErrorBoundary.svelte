<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from 'svelte-i18n';
	import { errorLogger } from '$lib/services/errorLogger';

	let { children }: { children: Snippet } = $props();

	/**
	 * Помилка йде в логер, а не на екран (ERROR-HANDLING-v8, анти-патерн
	 * CRITICAL «показ raw error message користувачу»). Раніше сюди виводився
	 * `error.message` — тобто відвідувач бачив англійський текст рантайму на
	 * кшталт «Cannot read properties of undefined (reading 'blocks')» посеред
	 * української сторінки, а розробник не отримував нічого: запис нікуди не йшов.
	 *
	 * `onerror` спрацьовує ДО `failed`, тож у момент показу запис уже є.
	 */
	function report(error: unknown) {
		errorLogger.logError(error instanceof Error ? error : new Error(String(error)), {
			component: 'error-boundary'
		});
	}
</script>

<svelte:boundary onerror={report}>
	{@render children()}

	{#snippet failed(_error, reset)}
		<div class="error-boundary" data-testid="error-boundary-container">
			<div class="error-boundary__content" data-testid="error-boundary-panel">
				<h2 data-testid="error-boundary-title">{$t('common.errorTitle')}</h2>
				<p data-testid="error-boundary-message">{$t('common.errorDescription')}</p>
				<div class="error-boundary__actions" data-testid="error-boundary-toolbar">
					<button onclick={reset} data-testid="error-boundary-reset-btn">{$t('common.tryAgain')}</button>
					<button onclick={() => location.reload()} data-testid="error-boundary-reload-btn">{$t('common.reloadPage')}</button>
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
