<script lang="ts">
	import { t } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { X, ExternalLink } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { portalToBody } from '$lib/utils/portalToBody';
	import type { VideoInfo } from '$lib/utils/videoEmbed';

	interface Props {
		/** Розібране посилання. `null` — плеєр закритий. */
		video: VideoInfo | null;
		/** Назва вистави: йде в заголовок вікна і в `title` кадру. */
		title: string;
		onclose: () => void;
	}

	let { video, title, onclose }: Props = $props();

	/**
	 * Плеєр монтується РАЗОМ із вікном, а не заздалегідь.
	 *
	 * `<iframe>` YouTube тягне кількасот кілобайт і ставить cookie ще до того,
	 * як відвідувач вирішив дивитися (та сама причина, що й у `DetailPage`).
	 * Тут вікно і є тим кліком, тож `autoplay=1` доречний: людина щойно
	 * натиснула «дивитися», і просити її натиснути вдруге — зайве.
	 */
	const src = $derived(video?.embedUrl ? `${video.embedUrl}?autoplay=1&rel=0` : null);

	$effect(() => {
		if (!browser || !video) return;
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = original;
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		if (video && e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if video}
	<div
		class="video-backdrop"
		{@attach portalToBody()}
		transition:fade={{ duration: 180 }}
		onclick={onclose}
		role="presentation"
		data-testid="video-modal-backdrop"
	></div>

	<div
		class="video-modal"
		{@attach portalToBody()}
		role="dialog"
		aria-modal="true"
		aria-label={title}
		{@attach focusTrap()}
		transition:fly={{ y: 24, duration: 240 }}
		data-testid="video-modal-panel"
	>
		<div class="video-modal__bar">
			<h2 class="video-modal__title" data-testid="video-modal-title">{title}</h2>

			<!-- rel="external" — за ним правило проєкту визнає посилання зовнішнім. -->
			<a
				href={video.url}
				target="_blank"
				rel="external noopener noreferrer"
				class="video-modal__action"
				title={$t('galaxy.openInNewTab', { default: 'Відкрити в новій вкладці' })}
				aria-label={$t('galaxy.openInNewTab', { default: 'Відкрити в новій вкладці' })}
				data-testid="video-modal-external-link"
			>
				<ExternalLink size={18} aria-hidden="true" />
			</a>

			<button
				type="button"
				class="video-modal__action"
				onclick={onclose}
				aria-label={$t('common.close')}
				data-testid="video-modal-close-btn"
			>
				<X size={20} aria-hidden="true" />
			</button>
		</div>

		<div class="video-modal__frame">
			{#if src}
				<iframe
					{src}
					{title}
					class="video-modal__player"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
					referrerpolicy="strict-origin-when-cross-origin"
					data-testid="video-modal-frame-container"
				></iframe>
			{:else}
				<!-- Instagram і Facebook `videoEmbed` навмисно позначає як
				     невбудовувані: вбудовування ламалося б мовчки, порожньою
				     рамкою. Тут це чесне посилання замість неї. -->
				<p class="video-modal__fallback" data-testid="video-modal-fallback-text">
					<a
						href={video.url}
						target="_blank"
						rel="external noopener noreferrer"
						data-testid="video-modal-fallback-link"
					>
						{$t('galaxy.openInNewTab', { default: 'Відкрити в новій вкладці' })}
					</a>
				</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.video-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgb(3 6 20 / 0.78);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	.video-modal {
		position: fixed;
		z-index: 1001;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		width: min(1100px, 94vw);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.video-modal__bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.video-modal__title {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
		color: #f1f5f9;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/*
	 * Без власного `transition`: оберт хрестика оголошує лише global.css.
	 * Локальний переважив би його через scoping Svelte, і без `transform`
	 * у переліку оберт стався б миттєво — тобто його не було б видно взагалі.
	 */
	.video-modal__action {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 50%;
		background: rgb(3 6 20 / 0.75);
		color: #cfe4ff;
		cursor: pointer;
		text-decoration: none;
	}

	.video-modal__action:hover {
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.7);
		color: #fff;
	}

	.video-modal__frame {
		position: relative;
		aspect-ratio: 16 / 9;
		width: 100%;
		overflow: hidden;
		border-radius: 14px;
		background: #000;
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.55);
	}

	.video-modal__player {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.video-modal__fallback {
		display: grid;
		place-items: center;
		height: 100%;
		margin: 0;
		color: #cfe4ff;
	}

	@media (max-width: 768px) {
		.video-modal {
			width: calc(100vw - 1.5rem);
		}
		.video-modal__title {
			font-size: 0.95rem;
		}
	}
</style>
