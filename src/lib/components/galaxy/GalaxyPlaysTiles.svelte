<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { Users, Trophy, Video } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { playPath, type Play } from '$lib/data/plays';

	/**
	 * Плитки вистав, розкладені по роках.
	 *
	 * ## Чому окремий компонент, а не розмітка в сторінці
	 *
	 * Розділів на сторінці стало ТРИ — вистави курсів, «Посвята в Мистецтво» й
	 * «Новий рік», — і кожен малює ті самі плитки. Три копії цієї сітки означали
	 * б, що правка картки, зроблена в одному розділі, тихо не діє в двох інших:
	 * рівно так на сторінці груп розійшлися підписи в переліку й у плитках.
	 *
	 * Другою причиною є храповик розміру (`src/structure.test.ts`): сторінка вже
	 * стояла на 400 SLOC, і три розділи в ній не помістилися б без підняття межі.
	 *
	 * ## Що цей компонент НЕ робить
	 *
	 * Не фільтрує й не сортує. Порядок років і склад кожного року задає сторінка
	 * — там, де живуть пошук і область показу. Тут лише вигляд.
	 */
	interface Tile {
		play: Play;
		/** Скільки людей назвали виставу своєю — з анкет, не з групи. */
		cast: number;
		/** Готові назви груп: рахувати їх у компоненті нічим. */
		groups: string[];
	}

	interface Props {
		/** Роки згори донизу, у кожному — плитки цього року. */
		byYear: [number, Tile[]][];
		/** `galaxy-plays`, `galaxy-posviata`, `galaxy-new-year` — розділ, а не режим. */
		testIdPrefix: string;
	}

	let { byYear, testIdPrefix }: Props = $props();

	const currentLang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');
</script>

<div class="plays-years" data-testid="{testIdPrefix}-list">
	{#each byYear as [year, items] (year)}
		<section class="plays-year" data-testid="{testIdPrefix}-year-section-{year}">
			<div class="plays-year__head">
				<h3 class="plays-year__title">{year}</h3>
				<span class="plays-year__count">{items.length}</span>
			</div>

			<ul class="plays-grid">
				{#each items as { play, cast, groups } (play.id)}
					<li>
						<a
							class="play-card"
							href={localizedPath(playPath(play.id), currentLang)}
							data-testid="{testIdPrefix}-card-{play.id}"
						>
							<span class="play-card__title">{play.title}</span>
							{#if play.author}
								<span class="play-card__author">{play.author}</span>
							{/if}

							<span class="play-card__meta">
								{#each groups as group (group)}
									<span class="play-card__badge play-card__badge--group">{group}</span>
								{/each}
								<!--
									Нуль не показується: «0 в анкетах» повідомляв би не про
									виставу, а про те, що анкети ще не заповнені. Вистав без
									жодної згадки 89 — рядок «0» стояв би в кожній четвертій
									картці й не означав нічого.
								-->
								{#if cast > 0}
									<span class="play-card__badge">
										<Users size={12} aria-hidden="true" />
										{cast}
									</span>
								{/if}
								{#if play.awards?.length}
									<span class="play-card__badge play-card__badge--award">
										<Trophy size={12} aria-hidden="true" />
										{play.awards.length}
									</span>
								{/if}
								<!-- `videoParts` теж запис: у «Підкови на щастя» власного
								     `videoUrl` немає — там три вечори різними курсами. -->
								{#if play.videoUrl || play.videoParts?.length}
									<span class="play-card__badge play-card__badge--video">
										<Video size={12} aria-hidden="true" />
									</span>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.plays-years {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.plays-year__head {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding-bottom: 0.4rem;
		margin-bottom: 0.9rem;
		border-bottom: 2px solid var(--border-main);
	}
	.plays-year__title {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 800;
		color: var(--text-title);
		font-variant-numeric: tabular-nums;
	}
	.plays-year__count {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.plays-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
		gap: 0.9rem;
	}
	.play-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		height: 100%;
		padding: 0.9rem 1.05rem;
		border-radius: var(--radius-lg, 16px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: var(--shadow-sm);
		color: inherit;
		text-decoration: none;
		transition:
			transform var(--transition-base),
			border-color var(--transition-base),
			box-shadow var(--transition-base);
	}
	.play-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-main);
	}
	.play-card__title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.3;
	}
	.play-card__author {
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.35;
	}
	.play-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		/* Плашки притиснуті до низу: назви різної довжини, інакше вони стрибали б. */
		margin-top: auto;
		padding-top: 0.5rem;
	}
	.play-card__badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.12rem 0.45rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.74rem;
		font-weight: 600;
	}
	.play-card__badge--group {
		color: #a5b4fc;
		border-color: rgba(99, 102, 241, 0.3);
		background: rgba(99, 102, 241, 0.12);
	}
	.play-card__badge--award {
		color: #fbbf24;
		border-color: rgba(251, 191, 36, 0.3);
		background: rgba(251, 191, 36, 0.1);
	}
	.play-card__badge--video {
		color: #f87171;
		border-color: rgba(248, 113, 113, 0.3);
		background: rgba(248, 113, 113, 0.1);
	}
</style>
