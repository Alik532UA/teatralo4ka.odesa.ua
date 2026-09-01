<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { Play as PlayIcon } from 'lucide-svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { coGroupsForPlay, groupProfilePath } from '$lib/data/groups';
	import { getPlayById } from '$lib/data/plays';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';

	/**
	 * Хвіст рядка вистави в анкеті: з ким разом і чи є запис.
	 *
	 * ## Навіщо окремий компонент
	 *
	 * `GraduateProfileView` — найбільший файл проєкту (стеля 1695 SLOC), і два
	 * нових питання в рядку вистави потягли б за собою обчислення груп, розбір
	 * посилання на відео, стан відкритого плеєра та власний CSS. Тут воно все
	 * разом, а в анкеті лишається один рядок розмітки.
	 *
	 * ## Чому плашка, а не текст руками
	 *
	 * Доти «разом з групою ЗТК» стояло просто в тексті однієї анкети. Заміряно:
	 * таких рядків у базі 124, а примітку мав рівно один — тобто 123 рядки про
	 * це молчали. Тепер відповідь приходить із реєстру (`coGroupsForPlay`) і
	 * з'являється в усіх 42 рядках, де вона чесна.
	 *
	 * ## Чому запис не веде на YouTube
	 *
	 * Плеєр відкривається ТУТ — те саме правило, що в `GraduateVideoButton` і в
	 * репертуарі групи: картка вже показує людину, забирати з неї на чужий сайт
	 * заради одного ролика немає причини. Значок той самий `Play`, що й на
	 * великій кнопці запису в цій же картці.
	 */
	interface Props {
		/** Ключ вистави. Немає — немає ні плашки, ні запису. */
		playId?: string;
		/** `id` випускника: від його власних груп залежить, які групи «чужі». */
		memberId: string;
		/** Точковий вимикач плашки для цього рядка (`GraduatePlay.hideCoGroups`). */
		hideCoGroups?: boolean;
		/** Основа для `data-testid`; типи додаються тут. */
		testidBase: string;
	}

	let { playId, memberId, hideCoGroups = false, testidBase }: Props = $props();

	const isEn = $derived($locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	const play = $derived(playId ? getPlayById(playId) : undefined);
	const coGroups = $derived(
		playId && !hideCoGroups ? coGroupsForPlay(playId, memberId) : []
	);

	/**
	 * Кнопка з'являється лише коли посилання СПРАВДІ розпізналося як відео —
	 * інакше вона обіцяла б запис, якого немає (те саме правило, що в
	 * `ContentCard`). Заміряно: записи має 9 вистав із 733, і в анкетах це 43
	 * рядки.
	 */
	const video = $derived(parseVideoUrl(play?.videoUrl));
	let open = $state(false);
</script>

<!--
	ДВА окремих кореня, а не одна обгортка: обоє стають клітинками сітки
	`.play__body` в анкеті. Кнопка запису йде в перший рядок праворуч — там, де
	раніше стояв значок вистави, — а «разом з» рядком нижче, теж праворуч. Одна
	обгортка тримала б їх разом і в один рядок вони б не розійшлися.

	Порядок у розмітці той самий, що на екрані: спершу запис, потім групи.
-->
{#if video}
	<button
		type="button"
		class="extras__video-btn"
		onclick={() => (open = true)}
		title={$t('galaxy.watchRecording')}
		aria-label="{$t('galaxy.watchRecording')}: {play?.title ?? ''}"
		data-testid="{testidBase}-video-btn"
	>
		<PlayIcon size={13} aria-hidden="true" />
	</button>
{/if}

{#if coGroups.length > 0}
	<span class="extras__groups">
		<span class="extras__label">{$t('galaxy.playTogetherWith')}</span>
		{#each coGroups as group (group.slug)}
			<a
				class="extras__group"
				href={localizedPath(groupProfilePath(group.slug), lang)}
				data-testid="{testidBase}-cogroup-link-{group.slug}"
			>
				{group.abbr || (isEn && group.nameEn ? group.nameEn : group.name)}
			</a>
		{/each}
	</span>
{/if}

<!--
	Плеєр рендериться лише коли є що грати (`{#if video}` всередині
	`VideoModal`), тож у сітці він не займає клітинки: відкритий — це
	`position: fixed` поверх сторінки.
-->
<VideoModal video={open ? video : null} title={play?.title ?? ''} onclose={() => (open = false)} />

<style>
	/*
	 * Кнопка запису — друга колонка ПЕРШОГО рядка сітки: тобто праворуч від
	 * назви, там, де в цьому рядку завжди й був значок.
	 *
	 * «Разом з» — окремий рядок на всю ширину, притиснутий праворуч. Праворуч
	 * від тексту в тому ж рядку він стояти не може: у вузькій картці плашка
	 * забирала під себе смугу, і назва з роллю тислася в колонку з двох слів
	 * («Уявно / хворий», / Тома / Діафуарус»).
	 */
	.extras__video-btn {
		grid-column: 2;
		grid-row: 1;
	}

	.extras__groups {
		grid-column: 1 / -1;
		justify-self: end;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.extras__label {
		color: var(--galaxy-muted);
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.extras__group {
		padding: 0.05rem 0.4rem;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 999px;
		color: #cfe4ff;
		font-size: 0.78rem;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}

	.extras__group:hover,
	.extras__group:focus-visible {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}

	/*
	 * 24px — обов'язковий мінімум WCAG 2.2 AA (SC 2.5.8), а не власний стандарт
	 * проєкту в 44: рядків вистав в анкеті буває під тридцять, і 44-піксельна
	 * кнопка в кожному розтягнула б перелік удвічі. Значок усередині 13px, решта
	 * — поле для пальця.
	 */
	.extras__video-btn {
		display: grid;
		place-items: center;
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

	.extras__video-btn:hover,
	.extras__video-btn:focus-visible {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}
</style>
