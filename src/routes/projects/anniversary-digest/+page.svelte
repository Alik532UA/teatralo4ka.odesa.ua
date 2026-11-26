<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale, t } from 'svelte-i18n';
	import {
		ANNIVERSARY_DIGEST_EPISODES,
		ANNIVERSARY_DIGEST_META
	} from '$lib/data/anniversaryDigest';
	import AnniversaryDigestStage from '$lib/components/projects/AnniversaryDigestStage.svelte';
	import Anniversary30CharityCard from '$lib/components/posters/anniversary-30/Anniversary30CharityCard.svelte';
	import { ArrowLeft, Calendar, Tv } from 'lucide-svelte';

	const isEn = $derived($locale === 'en');
	const meta = ANNIVERSARY_DIGEST_META;
	const episodes = ANNIVERSARY_DIGEST_EPISODES;

	let activeEpisodeNumber = $state(
		[...episodes].reverse().find((e) => e.published)?.number ?? 1
	);
	let loadedVideos = $state<Record<number, boolean>>({});

	const activeEpisode = $derived(
		episodes.find((e) => e.number === activeEpisodeNumber) ?? episodes[0]
	);

	function selectEpisode(num: number) {
		activeEpisodeNumber = num;
	}

	function loadVideo(num: number) {
		loadedVideos = { ...loadedVideos, [num]: true };
	}
</script>

<section class="digest-page" data-testid="anniversary-digest-section">
	<div class="container digest-container">
		<nav class="digest-topbar" aria-label={isEn ? 'Navigation' : 'Навігація'}>
			<a href={resolve('/projects')} class="back-link" data-testid="digest-back-link">
				<ArrowLeft size={16} aria-hidden="true" />
				<span>{$t('projects.allProjects')}</span>
			</a>
			<a href={resolve('/anniversary-30')} class="playbill-link" data-testid="digest-playbill-link">
				<Calendar size={15} aria-hidden="true" />
				<span>{isEn ? '30th Anniversary Playbill' : 'Афіша 30-річчя'}</span>
			</a>
		</nav>

		<header class="digest-hero">
			<div class="digest-hashtags">
				{#each meta.hashtags as tag (tag)}
					<span class="hashtag-pill">{tag}</span>
				{/each}
			</div>
			<h1 class="digest-title">{isEn ? meta.titleEn : meta.titleUk}</h1>
			<p class="digest-lead">{isEn ? meta.greetingEn : meta.greetingUk}</p>
			<p class="digest-sublead">{isEn ? meta.inviteEn : meta.inviteUk}</p>
		</header>

		<div class="episodes-tabs" role="tablist" aria-label={isEn ? 'Digest episodes' : 'Серії дайджесту'}>
			{#each episodes as ep (ep.number)}
				<button
					type="button"
					role="tab"
					aria-selected={ep.number === activeEpisode.number}
					class="episode-tab"
					class:episode-tab--active={ep.number === activeEpisode.number}
					class:episode-tab--upcoming={!ep.published}
					onclick={() => selectEpisode(ep.number)}
					data-testid={`digest-tab-${ep.number}`}
				>
					<span class="episode-tab__num">
						<Tv size={14} aria-hidden="true" />
						{isEn ? `Episode ${ep.number}` : `Серія ${ep.number}`}
					</span>
					<span class="episode-tab__date">{isEn ? ep.dateEn : ep.dateUk}</span>
				</button>
			{/each}
		</div>

		<AnniversaryDigestStage
			episode={activeEpisode}
			{isEn}
			quizCta={isEn ? meta.quizCtaEn : meta.quizCtaUk}
			isVideoLoaded={!!loadedVideos[activeEpisode.number]}
			onLoadVideo={loadVideo}
		/>

		<section
			class="digest-charity"
			id="charity"
			aria-label={isEn ? 'Charity fundraiser' : 'Благодійний збір'}
		>
			<Anniversary30CharityCard {isEn} />
		</section>
	</div>
</section>

<style>
	.digest-page {
		padding: var(--page-pad-top) 0 var(--page-pad-bottom);
		min-height: 85dvh;
	}

	.digest-container {
		max-width: 1080px;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.digest-topbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.back-link,
	.playbill-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--accent-text);
		text-decoration: none;
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		border: var(--hairline-width) solid color-mix(in srgb, var(--text-title), transparent 86%);
		background: var(--bg-card);
		transition: transform 0.15s ease, border-color 0.15s ease;
	}

	.back-link:hover,
	.playbill-link:hover {
		transform: translateY(-1px);
		border-color: var(--accent-text);
	}

	.digest-hero {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.digest-hashtags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.hashtag-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.28rem 0.75rem;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 700;
		background: var(--bg-card);
		color: var(--accent-text);
		border: var(--hairline-width) solid color-mix(in srgb, var(--text-title), transparent 84%);
	}

	.digest-title {
		margin: 0;
		font-size: clamp(1.75rem, 3.5vw, 2.5rem);
		line-height: 1.15;
		color: var(--text-title);
	}

	.digest-lead {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.6;
		color: var(--text-main);
	}

	.digest-sublead {
		margin: 0;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--text-muted);
	}

	.episodes-tabs {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.episode-tab {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 0.75rem 0.9rem;
		border-radius: 14px;
		border: var(--hairline-width) solid color-mix(in srgb, var(--text-title), transparent 86%);
		background: var(--bg-card);
		color: var(--text-main);
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s ease, transform 0.15s ease;
	}

	.episode-tab:hover {
		transform: translateY(-1px);
		border-color: var(--accent-text);
	}

	.episode-tab--active {
		border-color: var(--accent-text);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-text) 22%, transparent);
	}

	.episode-tab--upcoming {
		opacity: 0.72;
	}

	.episode-tab__num {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-weight: 700;
		font-size: 0.92rem;
	}

	.episode-tab__date {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	@media (max-width: 860px) {
		.episodes-tabs {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
