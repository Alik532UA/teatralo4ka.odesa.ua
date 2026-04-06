<script lang="ts">
	import { toast } from '$lib/states/toast.svelte';
	import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';
</script>

<div class="toast-container">
	{#each toast.messages as msg (msg.id)}
		<div
			class="toast-msg toast-{msg.type}"
			in:fly={{ y: 20, duration: 300 }}
			out:fade={{ duration: 200 }}
			role="alert"
		>
			<div class="toast-icon">
				{#if msg.type === 'success'}
					<CheckCircle2 size={20} />
				{:else if msg.type === 'error'}
					<AlertCircle size={20} />
				{:else}
					<Info size={20} />
				{/if}
			</div>
			<div class="toast-content">{msg.message}</div>
			<button class="toast-close" onclick={() => toast.remove(msg.id)} aria-label="Закрити">
				<X size={16} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 9999;
		pointer-events: none;
	}

	.toast-msg {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 16px;
		background: var(--theme-dynamic-card-bg, #ffffff);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		min-width: 300px;
		max-width: 450px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toast-success .toast-icon { color: #22c55e; }
	.toast-error .toast-icon { color: #ef4444; }
	.toast-info .toast-icon { color: #3b82f6; }

	.toast-content {
		flex: 1;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-deep-ocean, #1a2a3a);
		word-break: break-word;
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--color-muted-text, #94a3b8);
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.toast-close:hover {
		background: rgba(0, 0, 0, 0.05);
		color: var(--color-deep-ocean, #1a2a3a);
	}
	
	@media (max-width: 600px) {
		.toast-container {
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
			align-items: stretch;
		}
		.toast-msg {
			min-width: 0;
			max-width: 100%;
		}
	}
</style>
