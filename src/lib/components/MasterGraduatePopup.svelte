<script lang="ts">
	import { t } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { X, FileText } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	interface Props {
		graduate: GraduateIndexEntry | null;
		onclose: () => void;
		onopenform: () => void;
	}

	let { graduate, onclose, onopenform }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (graduate && e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if graduate}
	<div
		class="popup-backdrop"
		transition:fade={{ duration: 200 }}
		onclick={onclose}
		role="presentation"
		data-testid="master-graduate-popup-backdrop"
	></div>

	<div
		class="popup-card"
		role="dialog"
		aria-modal="true"
		aria-labelledby="popup-grad-title"
		{@attach focusTrap()}
		transition:fly={{ y: 40, duration: 300 }}
		data-testid="master-graduate-popup-modal"
	>
		<button
			type="button"
			class="popup-card__close"
			onclick={onclose}
			aria-label={$t('common.close', { default: 'Закрити' })}
			data-testid="master-graduate-popup-close-btn"
		>
			<X size={20} aria-hidden="true" />
		</button>

		<div class="popup-card__star" aria-hidden="true"></div>

		<h2 class="popup-card__name" id="popup-grad-title" data-testid="master-graduate-popup-title">
			{graduate.name}
		</h2>

		{#if graduate.graduationYear}
			<div class="popup-card__years" data-testid="master-graduate-popup-year-text">
				<span>{$t('galaxy.graduation', { default: 'випуск' })} {graduate.graduationYear}</span>
			</div>
		{/if}

		{#if graduate.departments?.length}
			<div class="popup-card__departments" data-testid="master-graduate-popup-dept-list">
				{#each graduate.departments as dept (dept)}
					<span class="popup-card__dept">{$t(`departments.${dept}`, { default: dept })}</span>
				{/each}
			</div>
		{/if}

		<p class="popup-card__hint" data-testid="master-graduate-popup-hint-text">
			{$t('galaxy.noProfile', { default: "Анкету ще не заповнено — тут поки лише ім'я" })}
		</p>

		<button
			type="button"
			class="popup-card__fill-btn"
			onclick={onopenform}
			data-testid="master-graduate-popup-fill-btn"
		>
			<FileText size={16} aria-hidden="true" />
			<span>{$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}</span>
		</button>
	</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.popup-card {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1001;
		width: min(380px, 90vw);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-xl, 20px);
		padding: 2rem 1.5rem 1.5rem;
		box-shadow: var(--shadow-main);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.6rem;
	}

	.popup-card__close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		padding: 0.25rem;
		border-radius: var(--radius-sm, 6px);
	}
	.popup-card__close:hover {
		color: var(--text-title);
	}
	.popup-card__close:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}

	.popup-card__star {
		width: 48px;
		height: 48px;
		background: radial-gradient(
			circle,
			rgba(255, 215, 80, 0.85) 0%,
			rgba(255, 215, 80, 0.35) 45%,
			transparent 72%
		);
		border-radius: 50%;
		filter: blur(2px);
		margin-bottom: 0.2rem;
	}

	.popup-card__name {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.3;
		margin: 0;
	}

	.popup-card__years {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.popup-card__departments {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.popup-card__dept {
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		font-size: 0.8rem;
		color: var(--text-main);
	}

	.popup-card__hint {
		margin: 0.3rem 0 0.5rem;
		font-size: 0.82rem;
		color: var(--text-muted);
		font-style: italic;
		line-height: 1.4;
	}

	.popup-card__fill-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.6rem 1.25rem;
		border-radius: 999px;
		background: linear-gradient(
			135deg,
			rgb(140 190 255 / 0.22) 0%,
			rgb(0 150 255 / 0.38) 100%
		);
		border: 1px solid rgb(140 190 255 / 0.55);
		color: #ffffff;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 16px rgb(0 120 255 / 0.25);
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}
	.popup-card__fill-btn:hover {
		transform: translateY(-2px);
		background: linear-gradient(
			135deg,
			rgb(140 190 255 / 0.38) 0%,
			rgb(0 150 255 / 0.6) 100%
		);
		border-color: rgb(140 190 255 / 0.85);
		box-shadow: 0 6px 20px rgb(0 150 255 / 0.45);
		color: #ffffff;
	}
	.popup-card__fill-btn:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}
</style>
