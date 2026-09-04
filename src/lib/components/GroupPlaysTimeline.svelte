<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';
	import { playPath, type Play } from '$lib/data/plays';
	import { localizedPath } from '$lib/i18n/routing';

	interface Props {
		plays: readonly Play[];
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

	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');
</script>

<!--
	Рядок веде на СТОРІНКУ вистави, а запис відкриває окрема кнопка поруч.

	Доти було навпаки й неповно: вистава із записом була кнопкою плеєра, а без
	запису — мертвою карткою. Тобто натискання на назву або відкривало відео,
	або не робило нічого, а сторінки вистави не давало ніколи.

	Кнопка стоїть ПОРУЧ із посиланням, а не всередині: `<button>` усередині
	`<a>` — невалідна розмітка, і браузери розбирають її по-різному. Тому рядок
	це обгортка з двох сусідів.
-->
<div class="plays-timeline" data-testid="group-plays-list">
	{#each plays as play, idx (play.id)}
		{@const video = videos[idx]}
		<div class="play-row">
			<a
				class="play-card"
				href={localizedPath(playPath(play.id), lang)}
				data-testid="group-play-card-{play.year}"
			>
				<span class="play-card__year-badge">{play.year}</span>
				<span class="play-card__content">
					<h3 class="play-card__title">{play.title}</h3>
				</span>
			</a>

			{#if video}
				<button
					type="button"
					class="play-video-btn"
					onclick={() => (openIndex = idx)}
					aria-label="{$t('galaxy.watchRecording')}: {play.title}"
					title={$t('galaxy.watchRecording')}
					data-testid="group-play-video-btn-{play.year}"
				>
					<img
						src={asset('/social_media/YouTube-se-512px-50q.png')}
						alt=""
						width="24"
						height="24"
						loading="lazy"
					/>
					<span class="play-video-btn__label">{$t('galaxy.watchRecording')}</span>
				</button>
			{/if}
		</div>
	{/each}
</div>

<VideoModal
	video={openIndex >= 0 ? videos[openIndex] : null}
	title={openIndex >= 0 ? plays[openIndex].title : ''}
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

	/*
	 * Рядок — обгортка з двох сусідів: посилання на всю вільну ширину й кнопка
	 * запису праворуч. Тло й рамка лишилися на посиланні, щоб кнопка читалася
	 * як окрема ціль, а не як частина картки.
	 */
	.play-row {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
	}

	.play-card {
		flex: 1 1 auto;
		min-width: 0;
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		padding: 1rem 1.25rem;
		border-radius: 12px;
		background: light-dark(#ffffff, rgba(255, 255, 255, 0.025));
		border: 1px solid light-dark(rgb(0 0 0 / 0.08), rgba(255, 255, 255, 0.06));
		box-shadow: 0 2px 6px light-dark(rgb(0 0 0 / 0.02), transparent);
		color: inherit;
		font: inherit;
		text-align: left;
		transition: all 0.2s ease;
	}

	/*
	 * Світле й темне значення — парою в самій властивості.
	 *
	 * Доти світлі значення стояли окремим правилом під селектором однієї теми
	 * (`light`), а тем шість: дві ЖОВТІ теми теж світлі, але тим селектором не
	 * накривалися й отримували оформлення для темного тла. Розбір і замір — у
	 * докблоці `VerificationNoticeBanner`, з якого почалася ця правка.
	 */
	.play-card:hover {
		background: light-dark(#f8fafc, rgba(255, 255, 255, 0.05));
		border-color: rgba(255, 255, 255, 0.12);
		transform: translateX(4px);
	}

	/* Кнопка запису — власна ціль поруч із рядком, а не частина його. */
	.play-video-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
		padding: 0 1rem;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.06);
		color: var(--text-muted, #94a3b8);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.play-video-btn img {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.play-video-btn:hover,
	.play-video-btn:focus-visible {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 0, 0, 0.35);
		color: var(--text-main, #f1f5f9);
	}

	/*
	 * На телефоні від кнопки лишається сам значок: підпис «Дивитися запис»
	 * забирав у назви вистави половину рядка.
	 */
	@media (max-width: 767px) {
		.play-video-btn__label {
			display: none;
		}
		.play-video-btn {
			padding: 0 0.75rem;
		}
	}

	/*
	 * Колір числа — парою: світло-індиговий читається лише на темному.
	 *
	 * Знайшов це не я, а axe у прогоні по шести темах: контраст 1,61–1,65
	 * (`#a5b4fc` на `#e8e8fd`) у трьох світлих темах — 20 порушень на сторінці
	 * групи. Тобто рік вистави в них був майже невидимий, і в НАЙСВІТЛІШІЙ темі
	 * теж, не лише в жовтих.
	 */
	.play-card__year-badge {
		padding: 0.35rem 0.75rem;
		border-radius: 8px;
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: light-dark(#3730a3, #a5b4fc);
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

	/* Правил під одну тему тут більше немає: колір назви й так приходить
	   токеном `--text-main`, який кожна тема оголошує сама. */

	@media (max-width: 560px) {
		/* На вузькому екрані підпис зайвий — іконки досить. */
	}

	/*
	 * На вузькому екрані значок запису лишається В ОДНОМУ РЯДКУ З РОКОМ, а на
	 * наступний переходить лише назва.
	 *
	 * Колонкою картка ставала втричі вищою: рік, назва й значок ішли трьома
	 * поверхами, і значок опинявся аж під текстом — найдалі від року, з яким він
	 * і пов'язаний. Перенесення самої назви лишає картку у два рядки.
	 *
	 * `order` тут потрібен, бо в розмітці назва стоїть між роком і значком, а в
	 * рядку мають опинитися саме крайні двоє.
	 */
	@media (max-width: 640px) {
		.play-card {
			flex-wrap: wrap;
			gap: 0.5rem 0.75rem;
		}

		.play-card__content {
			order: 1;
			flex-basis: 100%;
		}
	}
</style>
