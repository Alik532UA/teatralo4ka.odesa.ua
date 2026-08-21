<script lang="ts">
	import { t } from 'svelte-i18n';
	import { X } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import type { GraduateIndexEntry, GraduateProfile } from '$lib/data/graduates';
	import GraduateProfileView from './GraduateProfileView.svelte';

	interface Props {
		graduate: GraduateIndexEntry | null;
		/** Подробиці. `null` — ще вантажаться або людина не заповнила анкету. */
		profile: GraduateProfile | null;
		onclose: () => void;
	}

	let { graduate, profile, onclose }: Props = $props();

	const id = $props.id();

	/**
	 * Escape закриває картку.
	 *
	 * `focusTrap` тримає Tab у межах модалки й повертає фокус після закриття, але
	 * Escape він не обробляє — знайдено прогоном, а не читанням: картка
	 * відкривалася, фокус ішов на кнопку закриття, і Escape не робив нічого. Той
	 * самий обробник у `PhotoLightbox.svelte` — беру ту саму форму, щоб у проєкті
	 * не з'явився другий спосіб закривати вікно.
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (!graduate) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if graduate}
	<!--
		Клік по тлу лише ДУБЛЮЄ кнопку закриття, яка є нижче й доступна з
		клавіатури; Tab тримає `focusTrap`, Escape — обробник у скрипті. Тому
		клавіатурного еквівалента саме для тла не потрібно, і `role="presentation"`
		тут не косметика: саме він і знімає a11y-попередження компілятора.
	-->
	<div class="backdrop" onclick={onclose} role="presentation" data-testid="galaxy-card-backdrop"
	></div>

	<div
		class="card"
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		{@attach focusTrap()}
		data-testid="galaxy-card-modal"
	>
		<button
			type="button"
			class="card__close"
			onclick={onclose}
			aria-label={$t('common.close')}
			data-testid="galaxy-card-close-btn"
		>
			<X size={20} aria-hidden="true" />
		</button>

		<GraduateProfileView {graduate} {profile} headingId="{id}-title" heading="h2" />
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgb(3 6 20 / 0.72);
		backdrop-filter: blur(3px);
	}

	.card {
		position: fixed;
		z-index: 61;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		width: min(1380px, 92vw);
		max-height: min(92dvh, 880px);
		overflow-y: auto;
		padding: clamp(1.25rem, 3dvh, 2.25rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
	}

	.card__close {
		position: sticky;
		top: 0;
		float: right;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.12);
		color: inherit;
		cursor: pointer;
	}

	.card__close:hover {
		background: rgb(255 255 255 / 0.22);
	}
</style>
