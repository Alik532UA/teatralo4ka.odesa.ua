<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Play as PlayIcon } from 'lucide-svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { getPlayById } from '$lib/data/plays';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';

	/**
	 * Кнопка запису в рядку вистави анкети — маленька, кругла, одразу за назвою.
	 *
	 * ## Чому запис не веде на YouTube
	 *
	 * Плеєр відкривається ТУТ — те саме правило, що в `GraduateVideoButton` і в
	 * репертуарі групи: картка вже показує людину, забирати з неї на чужий сайт
	 * заради одного ролика немає причини. Значок той самий `Play`, що й на
	 * великій кнопці запису в цій же картці. Кнопка з'являється лише коли
	 * посилання СПРАВДІ розпізналося як відео — інакше вона обіцяла б запис,
	 * якого немає.
	 *
	 * ## Запис уривка головніший за запис вечора
	 *
	 * Вечір буває записаний цілком (`Play.videoUrl`), а буває — окремими
	 * уривками (`PlayProgrammeItem.videoUrl`), і трапляється обидва разом. Рядок
	 * про уривок веде на запис уривка; коли такого немає — на запис вечора, щоб
	 * не губити його там, де уривок у людини один і шапки вечора над ним нема.
	 * Під шапкою вечора запис вечора уже стоїть рядком вище — тоді `itemsOnly`.
	 *
	 * ## Чому окремо від плашки «разом з»
	 *
	 * Доти кнопка й плашка жили в одному компоненті двома коренями — клітинками
	 * сітки рядка. Тепер рядок — флекс із переносом (`GraduatePlayRow`): назва з
	 * кнопкою мусять бути ОДНИМ нерозривним шматком, а плашка — окремим, щоб
	 * переноситися сама. Два різних місця в розмітці — два компоненти.
	 */
	interface Props {
		/** Ключ вистави. Немає — немає й запису. */
		playId?: string;
		/** Номери програми з цього рядка анкети: запис уривка головніший за запис вечора. */
		items?: readonly string[];
		/** Лише запис уривка, без запасного запису вечора. */
		itemsOnly?: boolean;
		/** Основа для `data-testid`; тип додається тут. */
		testidBase: string;
	}

	let { playId, items, itemsOnly = false, testidBase }: Props = $props();

	const play = $derived(playId ? getPlayById(playId) : undefined);

	/** Уривок із цього рядка, у якого є запис, — перший у порядку програми. */
	const itemWithVideo = $derived(
		(play?.programme ?? []).find((item) => items?.includes(item.id) && parseVideoUrl(item.videoUrl))
	);
	const video = $derived(
		itemWithVideo
			? parseVideoUrl(itemWithVideo.videoUrl)
			: itemsOnly
				? null
				: parseVideoUrl(play?.videoUrl)
	);
	/** Заголовок плеєра: вечір, а для уривка — вечір і уривок. */
	const title = $derived(
		itemWithVideo ? `${play?.title ?? ''}: ${itemWithVideo.title}` : (play?.title ?? '')
	);
	let open = $state(false);
</script>

{#if video}
	<button
		type="button"
		class="video-btn"
		onclick={() => (open = true)}
		title={$t('galaxy.watchRecording')}
		aria-label="{$t('galaxy.watchRecording')}: {title}"
		data-testid="{testidBase}-video-btn"
	>
		<PlayIcon size={13} aria-hidden="true" />
	</button>

	<!-- Відкритий плеєр — `position: fixed` поверх сторінки, у рядку місця не займає. -->
	<VideoModal video={open ? video : null} {title} onclose={() => (open = false)} />
{/if}

<style>
	/*
	 * 24px — обов'язковий мінімум WCAG 2.2 AA (SC 2.5.8), а не власний стандарт
	 * проєкту в 44: рядків вистав в анкеті буває під тридцять, і 44-піксельна
	 * кнопка в кожному розтягнула б перелік удвічі. Значок усередині 13px, решта
	 * — поле для пальця. `flex-shrink: 0` — щоб довга назва не сплющила кнопку.
	 */
	.video-btn {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		min-width: 24px;
		min-height: 24px;
		padding: 0;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 50%;
		background: rgb(3 6 20 / 0.45);
		color: #cfe4ff;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}

	.video-btn:hover,
	.video-btn:focus-visible {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}
</style>
