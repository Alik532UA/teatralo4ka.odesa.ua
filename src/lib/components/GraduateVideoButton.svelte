<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Play } from 'lucide-svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';

	interface Props {
		/** Посилання на запис. Порожнє або нерозпізнане — кнопки немає. */
		videoUrl?: string;
		/** Ім'я випускника: йде в заголовок плеєра. */
		title: string;
		/**
		 * Напис на кнопці замість типового «Дивитися запис» — коли кнопок поруч
		 * кілька і їх треба розрізняти: записи окремих уривків вечора підписані
		 * назвою уривка.
		 */
		label?: string;
		/** Свій `data-testid`, коли на сторінці кілька таких кнопок. */
		testid?: string;
	}

	let { videoUrl, title, label, testid = 'galaxy-card-video-btn' }: Props = $props();

	/**
	 * Кнопка з'являється лише коли посилання СПРАВДІ розпізналося як відео —
	 * інакше вона обіцяла б запис, якого немає (те саме правило, що в
	 * `ContentCard`). Розбирає `parseVideoUrl` — той самий, що для новин і
	 * репертуару груп.
	 */
	const video = $derived(parseVideoUrl(videoUrl));
	let open = $state(false);
</script>

{#if video}
	<!--
		Запис відкривається плеєром ТУТ, а не переходом на YouTube: картка вже
		показує людину, і забирати з неї на чужий сайт заради одного ролика
		немає причини.
	-->
	<button
		type="button"
		class="watch-btn"
		onclick={() => (open = true)}
		data-testid={testid}
	>
		<Play size={16} aria-hidden="true" />
		<span>{label ?? $t('galaxy.watchRecording')}</span>
	</button>

	<VideoModal video={open ? video : null} {title} onclose={() => (open = false)} />
{/if}

<style>
	.watch-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0 0 0.75rem;
		padding: 0.4rem 0.9rem;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 999px;
		background: rgb(3 6 20 / 0.45);
		color: #cfe4ff;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.watch-btn:hover {
		background: rgb(140 190 255 / 0.2);
		border-color: rgb(140 190 255 / 0.7);
		color: #fff;
	}

	.watch-btn:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 3px;
	}
</style>
