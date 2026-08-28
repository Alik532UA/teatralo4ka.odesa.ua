<script lang="ts">
	import { t } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';
	import type { GroupPlay } from '$lib/data/groups';

	interface Props {
		plays: readonly GroupPlay[];
	}

	let { plays }: Props = $props();

	/**
	 * Записи, розібрані ОДИН раз на всі рядки.
	 *
	 * Кнопка з'являється лише там, де посилання справді розпізналося як відео:
	 * інакше вона обіцяла б запис там, де його немає (те саме правило, що й у
	 * `ContentCard`). Розбирає `parseVideoUrl` — той самий, що й для новин, і
	 * він же вирішує, чи можна показати плеєр на сторінці.
	 */
	const videos = $derived(plays.map((play) => parseVideoUrl(play.videoUrl)));

	/** Індекс вистави, чий плеєр відкрито; `-1` — закрито. */
	let openIndex = $state(-1);
</script>

<!--
	Нутрощі рядка однакові для обох випадків, тож лежать у сніпеті: гілки нижче
	відрізняються лише тегом.
-->
{#snippet playRow(play: GroupPlay, hasVideo: boolean)}
	<span class="play-card__year-badge">{play.year}</span>
	<span class="play-card__content">
		<h3 class="play-card__title">{play.text}</h3>
	</span>
	{#if hasVideo}
		<span class="play-card__video" data-testid="group-play-video-badge-{play.year}">
			<img
				src={asset('/social_media/YouTube-se-512px-50q.png')}
				alt=""
				width="24"
				height="24"
				loading="lazy"
			/>
			<span class="play-card__video-label">{$t('galaxy.watchRecording')}</span>
		</span>
	{/if}
{/snippet}

<div class="plays-timeline" data-testid="group-plays-list">
	{#each plays as play, idx (idx)}
		{@const video = videos[idx]}
		<!--
			Вистава із записом — справжній <button>, а не div із обробником:
			запис відкривається плеєром ТУТ, не забираючи людину зі сторінки, і
			рядок при цьому лишається доступним із клавіатури. Без запису це
			звичайна картка, щоб курсор не обіцяв дії, якої немає.
		-->
		{#if video}
			<button
				type="button"
				class="play-card play-card--playable"
				onclick={() => (openIndex = idx)}
				data-testid="group-play-card-{play.year}"
			>
				{@render playRow(play, true)}
			</button>
		{:else}
			<article class="play-card" data-testid="group-play-card-{play.year}">
				{@render playRow(play, false)}
			</article>
		{/if}
	{/each}
</div>

<VideoModal
	video={openIndex >= 0 ? videos[openIndex] : null}
	title={openIndex >= 0 ? plays[openIndex].text : ''}
	onclose={() => {
		openIndex = -1;
	}}
/>

<style>
	.plays-timeline {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.play-card {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		padding: 1rem 1.25rem;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.06);
		color: inherit;
		font: inherit;
		text-align: left;
		transition: all 0.2s ease;
	}

	.play-card:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.12);
		transform: translateX(4px);
	}

	.play-card--playable {
		cursor: pointer;
	}

	.play-card--playable:hover {
		border-color: rgba(255, 0, 0, 0.35);
	}

	/* Значок запису притиснутий до правого краю рядка. */
	.play-card__video {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
		flex-shrink: 0;
		color: var(--text-muted, #94a3b8);
		font-size: 0.85rem;
	}

	.play-card__video img {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.play-card--playable:hover .play-card__video {
		color: var(--text-main, #f1f5f9);
	}

	.play-card__year-badge {
		padding: 0.35rem 0.75rem;
		border-radius: 8px;
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
		font-weight: 700;
		font-size: 0.95rem;
		letter-spacing: 0.02em;
		flex-shrink: 0;
	}

	.play-card__content {
		min-width: 0;
	}

	.play-card__title {
		font-size: 1.05rem;
		font-weight: 600;
		margin: 0;
		line-height: 1.4;
		color: var(--text-main, #f1f5f9);
	}

	:global(.light-theme) .play-card {
		background: #ffffff;
		border-color: rgba(0, 0, 0, 0.08);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
	}

	:global(.light-theme) .play-card:hover {
		background: #f8fafc;
	}

	:global(.light-theme) .play-card__title {
		color: #1e293b;
	}

	@media (max-width: 560px) {
		/* На вузькому екрані підпис зайвий — іконки досить. */
		.play-card__video-label {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.play-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
