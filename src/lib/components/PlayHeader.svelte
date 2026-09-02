<script lang="ts">
	import { Calendar } from 'lucide-svelte';
	import GroupPhotoBanner from '$lib/components/GroupPhotoBanner.svelte';
	import GraduateVideoButton from '$lib/components/GraduateVideoButton.svelte';
	import EditContactButton from '$lib/components/EditContactButton.svelte';
	import type { Play } from '$lib/data/plays';

	/**
	 * Шапка сторінки вистави: афіша, значки, назва, автори й записи.
	 *
	 * ## Чому окремий компонент
	 *
	 * Сторінка вистави стояла на 396 рядках із 400 дозволених, а сюди прийшли
	 * афіша й записи окремих уривків. Шапка — цілісний шматок з однією
	 * відповідальністю («що це за показ і що з нього можна побачити»), тож вона
	 * виноситься цілком, зі своїми стилями: Svelte скоупить їх по компоненту
	 * (гейт `component-styles`).
	 *
	 * ## Афіша — тим самим банером, що знімки групи
	 *
	 * `GroupPhotoBanner` уже вміє стопку знімків і лайтбокс, і сторінки групи й
	 * фестивалю ставлять його першим у шапці — тут так само. Різниця одна:
	 * афішу не можна кадрувати, по краях у неї текст, — тому банер у режимі
	 * `whole` і бере пропорцію самого зображення.
	 *
	 * ## Запис вечора й записи уривків — поруч, але це різні кнопки
	 *
	 * Вечір буває записаний цілком (`Play.videoUrl`), а буває — окремими
	 * уривками (`PlayProgrammeItem.videoUrl`), і трапляється обидва разом. Тому
	 * кнопок може бути кілька: перша — «Дивитися запис» усього вечора, решта
	 * підписані назвою уривка. Той самий запис уривка стоїть і в анкеті
	 * учасника, у рядку цього уривка (`PlayRowExtras`).
	 */
	interface Props {
		play: Play;
	}

	let { play }: Props = $props();

	/** Уривки з власним записом, у порядку програми. */
	const clips = $derived((play.programme ?? []).filter((item) => item.videoUrl));
</script>

<header class="play-header">
	<GroupPhotoBanner photos={play.photos ?? []} title={play.title} fit="whole" />

	<div class="play-header__badges">
		<span class="play-badge" data-testid="play-year-badge">
			<Calendar size={14} aria-hidden="true" />
			{play.year}{#if play.dateNote}, {play.dateNote}{/if}
		</span>
		{#if play.number}
			<span class="play-badge" data-testid="play-number-badge">№{play.number}</span>
		{/if}
		{#if play.institution}
			<span class="play-badge" data-testid="play-institution-badge">{play.institution}</span>
		{/if}

		<!-- Кнопка правок — у рядку значків, розкривається ВНИЗ: над шапкою екрана вже немає. -->
		<span class="play-header__edit">
			<EditContactButton
				testIdPrefix="play-page-contact"
				openTo="down"
				hasPhoto={(play.photos ?? []).length > 0}
			/>
		</span>
	</div>

	<h1 class="play-header__title" data-testid="play-title">{play.title}</h1>

	{#if play.author}
		<p class="play-header__author" data-testid="play-author-text">{play.author}</p>
	{/if}

	{#if play.videoUrl || clips.length > 0}
		<div class="play-header__video" data-testid="play-recordings-list">
			<GraduateVideoButton videoUrl={play.videoUrl} title={play.title} />
			{#each clips as item (item.id)}
				<GraduateVideoButton
					videoUrl={item.videoUrl}
					title="{play.title}: {item.title}"
					label={item.title}
					testid="play-programme-video-btn-{item.id}"
				/>
			{/each}
		</div>
	{/if}
</header>

<style>
	.play-header {
		margin-bottom: var(--space-2xl);
	}
	.play-header__badges {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.play-header__edit {
		display: inline-flex;
		margin-left: auto;
	}
	.play-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.7rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 600;
	}
	.play-header__title {
		margin: 0;
		font-size: clamp(1.5rem, 4vw, 2.2rem);
		font-weight: 700;
		color: var(--text-title);
		text-wrap: balance;
	}
	.play-header__author {
		margin: 0.4rem 0 0;
		color: var(--text-muted);
		font-size: 0.95rem;
	}
	/* Записів буває кілька — вечір і окремі уривки: рядком із переносом, а не стовпчиком. */
	.play-header__video {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.9rem;
	}
</style>
