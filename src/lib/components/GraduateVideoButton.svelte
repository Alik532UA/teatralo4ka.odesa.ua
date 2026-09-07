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
	/*
	 * КОЛЬОРИ ТОКЕНАМИ, а не жорсткою космічною синькою.
	 *
	 * Кнопка народилася в картці випускника, де тло майже чорне, і мала
	 * `background: rgb(3 6 20 / 0.45)` з написом #cfe4ff. Тепер вона стоїть ще й
	 * на сторінці ФЕСТИВАЛЮ, а та живе в темі сайту: у світлій темі та сама
	 * пілюля виходила сірою зі світло-блакитним написом. Це той самий клас, що й
	 * ряд облич і плашки відділень, — розбір у `AGENTS.md`, «У галактиці ДВІ
	 * палітри».
	 *
	 * `--bg-surface` і `--accent-text` підміняються самі: усередині
	 * `body.page-galaxy` вони космічні, поза нею — з теми.
	 */
	.watch-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0 0 0.75rem;
		padding: 0.4rem 0.9rem;
		border: 1px solid color-mix(in srgb, var(--accent-text, #8cb4ff), transparent 65%);
		border-radius: 999px;
		background: color-mix(in srgb, var(--bg-surface), transparent 15%);
		color: var(--accent-text, #8cb4ff);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.watch-btn:hover {
		background: color-mix(in srgb, var(--accent-text, #8cb4ff), transparent 85%);
		border-color: color-mix(in srgb, var(--accent-text, #8cb4ff), transparent 30%);
		color: var(--text-title);
	}

	.watch-btn:focus-visible {
		outline: 2px solid var(--accent-text);
		outline-offset: 3px;
	}
</style>
