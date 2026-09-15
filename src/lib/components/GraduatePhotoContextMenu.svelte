<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Camera, Plus } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		isOpen: boolean;
		x: number;
		y: number;
		hasPhoto?: boolean;
		onclose: () => void;
		onreplace: () => void;
		onadd: () => void;
	}

	let { isOpen, x, y, hasPhoto = true, onclose, onreplace, onadd }: Props = $props();

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
		class="photo-ctx-backdrop"
		role="presentation"
		onpointerdown={onclose}
		oncontextmenu={(e) => {
			e.preventDefault();
			onclose();
		}}
	></div>

	<div
		class="photo-ctx-menu"
		role="menu"
		tabindex="-1"
		style="left: {x}px; top: {y}px;"
		transition:fade={{ duration: 120 }}
		data-testid="photo-context-menu"
	>
		{#if hasPhoto}
			<button
				type="button"
				class="photo-ctx-menu__item"
				role="menuitem"
				onclick={() => {
					onclose();
					onreplace();
				}}
				data-testid="photo-context-replace-btn"
			>
				<Camera size={17} aria-hidden="true" />
				<span>{$t('galaxy.replacePhoto', { default: 'Замінити фото' })}</span>
			</button>
		{/if}

		<button
			type="button"
			class="photo-ctx-menu__item"
			role="menuitem"
			onclick={() => {
				onclose();
				onadd();
			}}
			data-testid="photo-context-add-btn"
		>
			<Plus size={17} aria-hidden="true" />
			<span>{$t('galaxy.addPhoto', { default: 'Додати фото' })}</span>
		</button>
	</div>
{/if}

<style>
	.photo-ctx-backdrop {
		position: fixed;
		inset: -100vmax;
		z-index: 9600;
	}

	.photo-ctx-menu {
		position: absolute;
		z-index: 9601;
		width: 190px;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.35rem;
		border-radius: 0.75rem;
		background: var(--galaxy-card-bg, #071324);
		border: var(--hairline-width) solid rgb(140 190 255 / 0.3);
		box-shadow:
			0 12px 36px rgba(0, 0, 0, 0.55),
			0 0 0 1px rgb(140 190 255 / 0.12);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.photo-ctx-menu__item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.65rem;
		border: none;
		border-radius: 0.5rem;
		background: none;
		color: var(--galaxy-text, #e2eeff);
		font-size: 0.88rem;
		font-weight: 500;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.photo-ctx-menu__item:hover,
	.photo-ctx-menu__item:focus-visible {
		background: rgb(140 190 255 / 0.18);
		color: #fff;
		outline: none;
	}
</style>
