<script lang="ts">
	import { Calendar } from 'lucide-svelte';
	import GroupPhotoBanner from '$lib/components/GroupPhotoBanner.svelte';
	import GraduateVideoButton from '$lib/components/GraduateVideoButton.svelte';
	import FestivalVideoPreview from '$lib/components/galaxy/FestivalVideoPreview.svelte';
	import EditContactButton from '$lib/components/EditContactButton.svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';
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
	 * ## Запис і знімки / афіша — поруч, як на сторінці фестивалю
	 *
	 * Коли запис має статичний кадр (YouTube), він ділить верхній рядок із
	 * банером афіші/знімків (приклад — `slovianskyi-vinok`), а не ховається
	 * маленькою кнопкою внизу.
	 */
	interface Props {
		play: Play;
	}

	let { play }: Props = $props();

	/** Уривки з власним записом, у порядку програми. */
	const clips = $derived((play.programme ?? []).filter((item) => item.videoUrl));

	/** Серії того самого запису, у порядку викладення. */
	const parts = $derived(play.videoParts ?? []);

	const hasPhotos = $derived((play.photos ?? []).length > 0);

	/**
	 * Відео для шапки — основний запис показу.
	 */
	const headerVideo = $derived(
		play.videoUrl
			? { url: play.videoUrl, title: play.title }
			: parts.length === 1 && !clips.length
				? { url: parts[0].url, title: `${play.title}: ${parts[0].label}` }
				: null
	);

	const headerVideoPreview = $derived(Boolean(parseVideoUrl(headerVideo?.url)?.posterUrl));
</script>

<header class="play-header">
	{#if headerVideo && headerVideoPreview}
		<div class="play-media" class:play-media--video-only={!hasPhotos}>
			<div class="play-media__video">
				<FestivalVideoPreview
					fill={hasPhotos}
					videoUrl={headerVideo.url}
					title={headerVideo.title}
					testid="play-header-video-btn"
				/>
			</div>
			{#if hasPhotos}
				<div class="play-media__photos">
					<GroupPhotoBanner photos={play.photos ?? []} title={play.title} />
				</div>
			{/if}
		</div>
	{:else if hasPhotos}
		<GroupPhotoBanner photos={play.photos ?? []} title={play.title} />
	{/if}

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

	{#if play.note}
		<p class="play-header__note" data-testid="play-note-text">{play.note}</p>
	{/if}

	{#if (!headerVideoPreview && play.videoUrl) || clips.length > 0}
		<div class="play-header__video" data-testid="play-recordings-list">
			{#if !headerVideoPreview && play.videoUrl}
				<GraduateVideoButton videoUrl={play.videoUrl} title={play.title} />
			{/if}
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

	{#if parts.length > 0 && !(parts.length === 1 && !clips.length && headerVideoPreview)}
		<ul class="play-header__parts" data-testid="play-recording-parts-list">
			{#each parts as part, i (part.url)}
				<li class="play-part">
					<GraduateVideoButton
						videoUrl={part.url}
						title="{play.title}: {part.label}"
						label={part.label}
						testid="play-video-part-btn-{i + 1}"
					/>
					{#if part.note}
						<span class="play-part__note">{part.note}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</header>

<style>
	.play-header__parts {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.play-part {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	/* Курси вечора — поруч із кнопкою, а не під нею: рядок читається як один
	   пункт «коли й хто», а не як два незалежні. */
	.play-part__note {
		flex: 1 1 18ch;
		min-width: 0;
		font-size: 0.82rem;
		line-height: 1.35;
		color: var(--text-muted);
	}

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
		border: var(--hairline-width) solid var(--border-main);
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
	.play-header__note {
		margin: 0.4rem 0 0;
		color: var(--text-muted);
		font-size: 0.9rem;
		font-style: italic;
		line-height: 1.45;
	}
	/* Записів буває кілька — вечір і окремі уривки: рядком із переносом, а не стовпчиком. */
	.play-header__video {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.9rem;
	}

	.play-media {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 1.25rem;
		align-items: stretch;
		margin-bottom: 1rem;
	}

	.play-media--video-only {
		grid-template-columns: 1fr;
		max-width: 720px;
		margin: 0 auto 1.5rem;
	}

	.play-media__video {
		display: grid;
	}

	.play-media__photos {
		display: grid;
		grid-template-rows: auto;
		grid-auto-rows: 0;
		--banner-gap: 0;
		--banner-dots-gap: 0;
	}

	@media (max-width: 860px) {
		.play-media {
			grid-template-columns: 1fr;
		}
	}

	.play-media__photos :global(.banner) {
		max-width: 100%;
		margin: 0;
	}
</style>
