<script lang="ts">
	import { resolve } from '$app/paths';
	import type { DigestEpisode } from '$lib/data/anniversaryDigest';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';
	import { ExternalLink, HelpCircle, Play, Sparkles } from 'lucide-svelte';

	interface Props {
		episode: DigestEpisode;
		isEn: boolean;
		quizCta: string;
		isVideoLoaded: boolean;
		onLoadVideo: (num: number) => void;
	}

	let { episode, isEn, quizCta, isVideoLoaded, onLoadVideo }: Props = $props();

	const videoInfo = $derived(episode.youtubeUrl ? parseVideoUrl(episode.youtubeUrl) : null);
</script>

<article class="episode-stage" data-testid="digest-episode-card">
	{#if episode.published}
		<div class="episode-grid">
			<div class="video-col">
				<div class="shorts-frame">
					{#if videoInfo?.embeddable && videoInfo.embedUrl}
						{#if isVideoLoaded}
							<iframe
								src={`${videoInfo.embedUrl}?autoplay=1&rel=0`}
								title={isEn ? episode.titleEn : episode.titleUk}
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								class="shorts-iframe"
							></iframe>
						{:else}
							<button
								type="button"
								class="shorts-facade"
								onclick={() => onLoadVideo(episode.number)}
								aria-label={isEn ? 'Play episode video' : 'Відтворити відео серії'}
								data-testid={`digest-play-${episode.number}-btn`}
							>
								{#if videoInfo.posterUrl}
									<img
										src={videoInfo.posterUrl}
										alt={isEn ? episode.titleEn : episode.titleUk}
										width="480"
										height="360"
										class="shorts-poster"
										loading="eager"
									/>
								{/if}
								<span class="shorts-play-btn" aria-hidden="true">
									<Play size={28} />
								</span>
								<span class="shorts-badge">YouTube Shorts</span>
							</button>
						{/if}
					{/if}
				</div>

				{#if episode.youtubeUrl}
					<div class="video-external-row">
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={episode.youtubeUrl} target="_blank" rel="noopener noreferrer" class="external-video-link" data-testid={`digest-yt-${episode.number}-link`}>
							<ExternalLink size={14} aria-hidden="true" />
							<span>
								{isEn
									? 'Open on YouTube & leave a comment'
									: 'Відкрити на YouTube і написати коментар'}
							</span>
						</a>
					</div>
				{/if}
			</div>

			<div class="quiz-col">
				<div class="episode-head">
					<span class="episode-date-pill">{isEn ? episode.dateEn : episode.dateUk}</span>
					<h2 class="episode-title">{isEn ? episode.titleEn : episode.titleUk}</h2>
					<p class="episode-subtitle">{isEn ? episode.subtitleEn : episode.subtitleUk}</p>
				</div>

				{#if episode.questions.length > 0}
					<div class="quiz-box">
						<h3 class="quiz-heading">
							<HelpCircle size={18} aria-hidden="true" />
							<span>{isEn ? 'History Quiz Questions' : 'Питання вікторини'}</span>
						</h3>

						<ol class="quiz-list">
							{#each episode.questions as q, i (q.id)}
								<li class="quiz-item" data-testid={`quiz-question-${q.id}-item`}>
									<p class="quiz-question">
										<span class="quiz-num">{i + 1}.</span>
										{isEn ? q.questionEn : q.questionUk}
									</p>
									{#if q.isInternalHint}
										<a
											href={resolve('/history')}
											class="quiz-hint"
											data-testid={`quiz-hint-${q.id}-link`}
										>
											<span>💡 {isEn ? q.hintLabelEn : q.hintLabelUk}</span>
										</a>
									{:else}
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
										<a href={q.hintUrl} target="_blank" rel="noopener noreferrer" class="quiz-hint" data-testid={`quiz-hint-${q.id}-link`}>
											<span>💡 {isEn ? q.hintLabelEn : q.hintLabelUk}</span>
											<ExternalLink size={13} aria-hidden="true" />
										</a>
									{/if}
								</li>
							{/each}
						</ol>

						<p class="quiz-cta">
							<Sparkles size={16} aria-hidden="true" />
							<span>{quizCta}</span>
						</p>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="upcoming-card">
			<Sparkles size={28} aria-hidden="true" />
			<h2 class="upcoming-title">{isEn ? episode.titleEn : episode.titleUk}</h2>
			<p class="upcoming-desc">{isEn ? episode.subtitleEn : episode.subtitleUk}</p>
		</div>
	{/if}
</article>

<style>
	.episode-stage {
		container-type: inline-size;
		background: var(--bg-card);
		border: var(--hairline-width) solid color-mix(in srgb, var(--text-title), transparent 86%);
		border-radius: 22px;
		padding: 1.5rem;
	}
	.episode-grid { display: grid; grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); gap: 1.75rem; align-items: start; }
	.video-col { display: flex; flex-direction: column; gap: 0.75rem; }
	.shorts-frame { position: relative; width: 100%; aspect-ratio: 9 / 16; border-radius: 18px; overflow: hidden; background: #121212; border: var(--hairline-width) solid color-mix(in srgb, var(--text-title), transparent 86%); }
	.shorts-iframe, .shorts-facade, .shorts-poster { width: 100%; height: 100%; display: block; border: 0; }
	.shorts-facade { position: relative; padding: 0; cursor: pointer; background: #121212; }
	.shorts-poster { object-fit: cover; }
	.shorts-play-btn { position: absolute; inset: 0; margin: auto; width: 68px; height: 68px; border-radius: 50%; background: rgba(255, 237, 0, 0.94); color: #1d1d1d; display: grid; place-items: center; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); transition: transform 0.15s ease; }
	.shorts-facade:hover .shorts-play-btn { transform: scale(1.07); }
	.shorts-badge { position: absolute; left: 0.75rem; bottom: 0.75rem; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: rgba(0, 0, 0, 0.78); color: #fff; }
	.video-external-row { display: flex; justify-content: center; }
	.external-video-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; font-weight: 600; color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
	.quiz-col, .episode-head { display: flex; flex-direction: column; gap: 1.25rem; }
	.episode-head { gap: 0.4rem; }
	.episode-date-pill { align-self: flex-start; font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; background: color-mix(in srgb, var(--text-title), transparent 92%); color: var(--accent-text); }
	.episode-title { margin: 0; font-size: 1.5rem; color: var(--text-title); }
	.episode-subtitle { margin: 0; color: var(--text-muted); }
	.quiz-box { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; border-radius: 16px; background: color-mix(in srgb, var(--text-title), transparent 95%); border: var(--hairline-width) solid color-mix(in srgb, var(--text-title), transparent 88%); }
	.quiz-heading { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem; color: var(--text-title); }
	.quiz-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.95rem; }
	.quiz-item { display: flex; flex-direction: column; gap: 0.35rem; padding-bottom: 0.85rem; border-bottom: var(--hairline-width) solid color-mix(in srgb, var(--text-title), transparent 88%); }
	.quiz-item:last-child { padding-bottom: 0; border-bottom: 0; }
	.quiz-question { margin: 0; font-size: 1.02rem; line-height: 1.45; font-weight: 600; color: var(--text-main); }
	.quiz-num { color: var(--accent-text); margin-right: 0.25rem; }
	.quiz-hint { align-self: flex-start; display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.9rem; font-weight: 600; color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
	.quiz-cta { margin: 0; display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.96rem; line-height: 1.5; color: var(--text-main); padding-top: 0.25rem; }
	.upcoming-card { padding: 3rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; color: var(--text-muted); }
	.upcoming-title, .upcoming-desc { margin: 0; }
	.upcoming-title { color: var(--text-title); }
	@container (max-width: 720px) {
		.episode-grid { grid-template-columns: 1fr; }
		.shorts-frame { max-width: 340px; margin: 0 auto; }
	}
</style>
