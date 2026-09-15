<script lang="ts">
	import { t } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { X, Camera, Plus } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { browser } from '$app/environment';
	import ContactMenuBody from './ContactMenuBody.svelte';

	interface Props {
		isOpen: boolean;
		onclose: () => void;
		_graduateName?: string;
		initialAction?: 'replace' | 'add' | null;
		hasPhoto?: boolean;
	}

	let {
		isOpen,
		onclose,
		_graduateName,
		initialAction = null,
		hasPhoto = true
	}: Props = $props();

	let action = $state<'replace' | 'add' | null>(null);

	$effect(() => {
		if (isOpen) {
			if (!hasPhoto) {
				action = 'add';
			} else {
				action = initialAction ?? null;
			}
		}
	});

	$effect(() => {
		if (!browser) return;
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="photo-modal-backdrop"
		transition:fade={{ duration: 180 }}
		onclick={onclose}
		role="presentation"
		data-testid="graduate-photo-backdrop"
	></div>

	<div
		class="photo-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="graduate-photo-modal-title"
		transition:fly={{ y: 20, duration: 220 }}
		{@attach focusTrap()}
		data-testid="graduate-photo-modal"
	>
		<div class="photo-modal__header">
			<h3 class="photo-modal__title" id="graduate-photo-modal-title" data-testid="graduate-photo-modal-title">
				{$t('galaxy.photoModalTitle', { default: 'Фотографія' })}
			</h3>

			<button
				type="button"
				class="photo-modal__close-btn"
				onclick={onclose}
				aria-label={$t('common.close')}
				data-testid="graduate-photo-modal-close-btn"
			>
				<X size={20} aria-hidden="true" />
			</button>
		</div>

		<div class="photo-modal__body">
			<div class="photo-modal__actions" class:photo-modal__actions--single={!hasPhoto}>
				{#if hasPhoto}
					<button
						type="button"
						class="action-choice-btn"
						class:action-choice-btn--active={action === 'replace'}
						onclick={() => (action = 'replace')}
						data-testid="graduate-photo-replace-btn"
					>
						<Camera size={22} aria-hidden="true" />
						<span>{$t('galaxy.replacePhoto', { default: 'Замінити фото' })}</span>
					</button>
				{/if}

				<button
					type="button"
					class="action-choice-btn"
					class:action-choice-btn--active={action === 'add'}
					onclick={() => (action = 'add')}
					data-testid="graduate-photo-add-btn"
				>
					<Plus size={22} aria-hidden="true" />
					<span>{$t('galaxy.addPhoto', { default: 'Додати фото' })}</span>
				</button>
			</div>

			{#if action}
				<div class="photo-modal__contact" transition:fly={{ y: 8, duration: 160 }}>
					<ContactMenuBody
						testIdPrefix="graduate-photo-contact"
						hint={action === 'replace'
							? 'Привіт!) Щоб замінити фото\n— напиши мені'
							: 'Привіт!) Щоб додати фото\n— напиши мені'}
						size="large"
						greetingLayout="row"
					/>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.photo-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgb(3 6 20 / 0.65);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	.photo-modal {
		position: fixed;
		z-index: 1001;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		width: min(420px, 92vw);
		max-height: min(90dvh, 560px);
		display: flex;
		flex-direction: column;
		background: var(--galaxy-card-bg, #071324);
		border: var(--hairline-width) solid rgb(140 190 255 / 0.28);
		border-radius: 1.25rem;
		box-shadow:
			0 24px 64px rgb(0 0 0 / 0.65),
			0 0 0 1px rgb(140 190 255 / 0.1);
		overflow: hidden;
		color: var(--galaxy-text, #e2eeff);
	}

	.photo-modal__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.2rem;
		border-bottom: 1px solid rgb(140 190 255 / 0.15);
		background: color-mix(in srgb, var(--galaxy-card-bg, #071324), #fff 4%);
	}

	.photo-modal__title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #fff;
	}

	.photo-modal__close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: rgb(140 190 255 / 0.08);
		color: rgb(140 190 255 / 0.85);
		cursor: pointer;
	}

	.photo-modal__close-btn:hover {
		background: rgb(140 190 255 / 0.2);
		color: #fff;
	}

	.photo-modal__body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		overflow-y: auto;
	}

	.photo-modal__actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.photo-modal__actions--single {
		grid-template-columns: 1fr;
	}

	.photo-modal__actions--single .action-choice-btn {
		flex-direction: row;
		gap: 0.65rem;
		padding: 0.85rem 1.2rem;
	}

	.action-choice-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		padding: 0.95rem 0.6rem;
		border-radius: 0.85rem;
		border: 1px solid rgb(140 190 255 / 0.2);
		background: rgb(140 190 255 / 0.06);
		color: #e2eeff;
		font-size: 0.92rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-choice-btn:hover {
		background: rgb(140 190 255 / 0.14);
		border-color: rgb(140 190 255 / 0.4);
		color: #fff;
		transform: translateY(-1px);
	}

	.action-choice-btn--active {
		background: rgb(140 190 255 / 0.22);
		border-color: rgb(140 190 255 / 0.65);
		color: #fff;
		box-shadow: 0 0 16px rgb(140 190 255 / 0.2);
	}

	.photo-modal__contact {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.1rem;
		padding-top: 1.1rem;
		border-top: 1px solid rgb(140 190 255 / 0.15);
	}
</style>
