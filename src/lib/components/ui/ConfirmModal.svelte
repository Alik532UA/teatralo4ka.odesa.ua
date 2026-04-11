<script lang="ts">
	import { toast } from '$lib/states/toast.svelte';
	import { HelpCircle, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { t } from 'svelte-i18n';
</script>

{#if toast.isConfirmOpen}
	<div 
		class="modal-backdrop" 
		transition:fade={{ duration: 200 }} 
		role="dialog" 
		aria-modal="true"
		data-testid="confirm-modal-overlay-container"
	>
		<div 
			class="modal-content" 
			transition:fly={{ y: 30, duration: 300 }}
			data-testid="confirm-modal-container"
		>
			<div class="modal-header" data-testid="confirm-modal-header-group">
				<div class="modal-icon" data-testid="confirm-modal-icon-container">
					<HelpCircle size={24} />
				</div>
				<h3 data-testid="confirm-modal-title-label">{$t('common.confirmation')}</h3>
				<button 
					class="btn-close" 
					onclick={() => toast.resolveConfirm(false)} 
					aria-label={$t('common.cancel')}
					data-testid="confirm-modal-close-button"
				>
					<X size={20} />
				</button>
			</div>
			
			<div class="modal-body" data-testid="confirm-modal-body-group">
				<p data-testid="confirm-modal-message-label">{toast.confirmMessage}</p>
			</div>
			
			<div class="modal-footer" data-testid="confirm-modal-footer-group">
				<button 
					class="btn-cancel" 
					onclick={() => toast.resolveConfirm(false)}
					data-testid="confirm-modal-cancel-button"
				>
					{$t('common.cancel')}
				</button>
				<button 
					class="btn-confirm" 
					onclick={() => toast.resolveConfirm(true)}
					data-testid="confirm-modal-confirm-button"
				>
					{$t('common.confirm')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.modal-content {
		background: var(--theme-dynamic-card-bg, #ffffff);
		border-radius: 24px;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
		border: 1px solid rgba(0, 0, 0, 0.05);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 1.5rem 1rem;
	}

	.modal-icon {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		width: 40px; height: 40px;
		border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
	}

	.modal-header h3 {
		margin: 0;
		flex: 1;
		font-size: 1.25rem;
		color: var(--color-deep-ocean, #1a2a3a);
		font-family: var(--font-heading, sans-serif);
	}

	.btn-close {
		background: none; border: none;
		color: var(--color-muted-text, #94a3b8);
		cursor: pointer;
		width: 32px; height: 32px;
		border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		transition: all 0.2s;
	}
	.btn-close:hover {
		background: rgba(0,0,0,0.05);
		color: var(--color-deep-ocean, #1a2a3a);
	}

	.modal-body {
		padding: 0 1.5rem 2rem;
		color: var(--color-dark-text, #475569);
		font-size: 1.05rem;
		line-height: 1.5;
	}

	.modal-body p {
		margin: 0;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.02);
		border-top: 1px solid rgba(0,0,0,0.03);
	}

	.btn-cancel, .btn-confirm {
		flex: 1;
		padding: 0.8rem 1rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-cancel {
		background: transparent;
		color: var(--color-deep-ocean, #1a2a3a);
		border: 1px solid rgba(0,0,0,0.1);
	}
	.btn-cancel:hover {
		background: rgba(0,0,0,0.05);
	}

	.btn-confirm {
		background: var(--color-ocean, #0077be);
		color: white;
	}
	.btn-confirm:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
</style>
