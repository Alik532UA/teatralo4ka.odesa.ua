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
			<div class="toast-content">
				<div class="toast-message">{msg.message}</div>
				{#if msg.actionLabel && msg.onAction}
					<button 
						class="toast-action" 
						onclick={() => {
							msg.onAction?.();
							toast.remove(msg.id);
						}}
					>
						{msg.actionLabel}
					</button>
				{/if}
			</div>
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
		z-index: 10000;
		pointer-events: none;
	}

	.toast-msg {
		pointer-events: auto;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--theme-dynamic-card-bg, #ffffff), transparent 15%);
		backdrop-filter: blur(12px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		min-width: 320px;
		max-width: 450px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.toast-icon {
		margin-top: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.toast-success .toast-icon { color: #22c55e; }
	.toast-error .toast-icon { color: #ef4444; }
	.toast-info .toast-icon { color: #3b82f6; }

	.toast-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.toast-message {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-deep-ocean, #1a2a3a);
		word-break: break-word;
		line-height: 1.4;
	}

	.toast-action {
		background: var(--color-light-blue, #e0f2fe);
		color: var(--color-deep-ocean, #1a2a3a);
		border: 1px solid rgba(0,0,0,0.05);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		align-self: flex-start;
		transition: all 0.2s;
		font-family: var(--font-heading);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.toast-action:hover {
		background: var(--color-sky-blue, #bae6fd);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--color-muted-text, #94a3b8);
		cursor: pointer;
		padding: 0.25rem;
		margin-top: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
		flex-shrink: 0;
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
