<script lang="ts">
	import { resolve, asset } from '$app/paths';
	import { Calendar, Clock, Users, Ticket, Drama, ExternalLink, Sparkles, Play } from 'lucide-svelte';
	import type { UartRepertoireEvent } from '$lib/data/uartRepertoireEvents';
	import UartCreators from '$lib/components/uart/UartCreators.svelte';
	import UartCastChips from '$lib/components/uart/UartCastChips.svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';

	interface Props {
		event: UartRepertoireEvent;
		isEn: boolean;
	}

	let { event, isEn }: Props = $props();

	const video = $derived(event.videoUrl ? parseVideoUrl(event.videoUrl) : null);
	let videoModalOpen = $state(false);
</script>

<article
	id={`event-${event.id}`}
	class="production-card"
	data-testid={`uart-showcase-card-${event.id}`}
>
	<div class="production-card__media">
		{#if video}
			<button
				type="button"
				class="production-card__poster-box production-card__poster-btn"
				onclick={() => (videoModalOpen = true)}
				aria-label={isEn
					? (event.videoLabelEn ? `${event.videoLabelEn} — ${event.videoTitleEn ?? event.titleEn}` : `Watch video: ${event.titleEn}`)
					: (event.videoLabelUk ? `${event.videoLabelUk} — ${event.videoTitleUk ?? event.titleUk}` : `Дивитися запис: ${event.titleUk}`)}
				data-testid={`uart-poster-video-${event.id}-btn`}
			>
				<img
					src={asset(event.posterUrl)}
					alt={isEn ? event.posterAltEn : event.posterAltUk}
					class="production-card__poster"
					width="1376"
					height="768"
					loading="lazy"
				/>
				<div class="poster-play-overlay" aria-hidden="true">
					<div class="poster-play-badge">
						<Play size={28} />
					</div>
				</div>
			</button>
		{:else}
			<div class="production-card__poster-box">
				<img
					src={asset(event.posterUrl)}
					alt={isEn ? event.posterAltEn : event.posterAltUk}
					class="production-card__poster"
					width="1376"
					height="768"
					loading="lazy"
				/>
			</div>
		{/if}

		<div class="poster-badges-bar">
			{#if event.tagUk}
				<div class="poster-tag-badge" data-testid={`uart-event-${event.id}-tag-badge`}>
					<Sparkles size={12} aria-hidden="true" />
					<span>{isEn ? event.tagEn : event.tagUk}</span>
				</div>
			{/if}
			<div class="poster-date-badge" data-testid={`uart-event-${event.id}-date-badge`}>
				<Clock size={14} class="poster-date-icon" aria-hidden="true" />
				<span>{isEn ? event.dateBadgeEn : event.dateBadgeUk}</span>
			</div>
		</div>

		<div class="production-actions">
			<a
				href={event.ticketUrl}
				target="_blank"
				rel="external noopener noreferrer"
				class="btn-ticket"
				data-testid={event.id === 'secrets' ? 'uart-concert-ticket-btn' : `uart-concert-ticket-${event.id}-btn`}
			>
				<Ticket size={18} aria-hidden="true" />
				<span>{isEn ? 'Tickets on Concert.ua' : 'Квитки на Concert.ua'}</span>
				<ExternalLink size={15} aria-hidden="true" />
			</a>

			{#if video}
				<div class="video-action-group">
					<button
						type="button"
						class="btn-video"
						onclick={() => (videoModalOpen = true)}
						data-testid={`uart-${event.id}-video-btn`}
					>
						<Play size={17} aria-hidden="true" />
						<span>{isEn ? (event.videoLabelEn ?? 'Watch Interview') : (event.videoLabelUk ?? "Інтерв'ю про виставу")}</span>
					</button>
					{#if isEn ? event.videoDescriptionEn : event.videoDescriptionUk}
						<p class="video-action-caption" data-testid={`uart-${event.id}-video-text`}>
							{isEn ? event.videoDescriptionEn : event.videoDescriptionUk}
						</p>
					{/if}
				</div>
			{/if}

			{#if event.id === 'secrets'}
				<a
					href={resolve('/projects/galaxy-graduates/plays/[id]', { id: 'stateve-vykhovannia-2026' })}
					class="btn-galaxy-play"
					data-testid="uart-galaxy-play-btn"
				>
					<Drama size={16} aria-hidden="true" />
					<span>{isEn ? 'Galaxy Play Page' : 'Сторінка вистави в Галактиці'}</span>
				</a>
			{:else if event.id === 'syrnyk'}
				<a
					href={resolve('/projects/galaxy-graduates/plays/[id]', { id: 'pryhody-pana-syrnyka-2025' })}
					class="btn-galaxy-play"
					data-testid="uart-galaxy-play-syrnyk-btn"
				>
					<Drama size={16} aria-hidden="true" />
					<span>{isEn ? 'Galaxy Play Page' : 'Сторінка вистави в Галактиці'}</span>
				</a>
			{:else if event.id === 'dosvid'}
				<a
					href={resolve('/projects/galaxy-graduates/plays/[id]', { id: 'dosvid-2026' })}
					class="btn-galaxy-play"
					data-testid="uart-galaxy-play-dosvid-btn"
				>
					<Drama size={16} aria-hidden="true" />
					<span>{isEn ? 'Galaxy Play Page' : 'Сторінка вистави в Галактиці'}</span>
				</a>
			{/if}
		</div>
	</div>

	<div class="production-card__details">
		<div class="play-meta">
			<div class="meta-badges">
				<span class="play-genre">{isEn ? event.genreEn : event.genreUk}</span>
				<span class="age-badge">{event.ageBadge}</span>
			</div>
			<h3 class="play-title">{isEn ? event.titleEn : event.titleUk}</h3>
			<p class="play-author">{isEn ? event.authorEn : event.authorUk}</p>
		</div>

		<div class="schedule-box">
			<div class="schedule-item">
				<Calendar size={18} class="schedule-icon" aria-hidden="true" />
				<div>
					<div class="schedule-label">{isEn ? 'Date' : 'Дата показу'}</div>
					<div class="schedule-value">{isEn ? event.scheduleDateEn : event.scheduleDateUk}</div>
				</div>
			</div>
			<div class="schedule-item">
				<Users size={18} class="schedule-icon" aria-hidden="true" />
				<div>
					<div class="schedule-label">{isEn ? 'Stage / Course' : 'Сцена / Курс'}</div>
					<div class="schedule-value">
						{#if event.id === 'secrets'}
							<a
								href={resolve('/projects/galaxy-graduates/groups/[slug]', { slug: 'repete' })}
								class="course-link"
								data-testid="uart-repete-group-link"
							>
								{isEn ? 'Course "RePeTe"' : 'Курс «RePeTe»'}
							</a>
						{:else if event.directorSlug}
							<a
								href={resolve('/residents/adults/[slug]', { slug: event.directorSlug })}
								class="course-link"
								data-testid={`uart-event-${event.id}-director-link`}
							>
								{isEn ? event.directorEn : event.directorUk}
							</a>
						{:else}
							<span>{isEn ? event.directorEn : event.directorUk}</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		{#if event.id === 'secrets'}
			<div class="team-section">
				<UartCreators />
				<UartCastChips />
			</div>
		{:else if event.directorRoleUk}
			<div class="team-section">
				<div class="team-group">
					<h4 class="team-title">{isEn ? 'Directors' : 'Постановники'}</h4>
					<div class="team-item">
						{#if event.directorSlug}
							<a
								href={resolve('/residents/adults/[slug]', { slug: event.directorSlug })}
								class="creator-link"
								data-testid={`uart-event-${event.id}-extra-director-link`}
							>
								<strong>{isEn ? event.directorEn : event.directorUk}</strong>
							</a>
						{:else}
							<strong>{isEn ? event.directorEn : event.directorUk}</strong>
						{/if}
						<span class="team-role">— {isEn ? event.directorRoleEn : event.directorRoleUk}</span>
					</div>
				</div>
				{#if event.performersUk}
					<div class="team-group">
						<h4 class="team-title">{isEn ? 'Performers' : 'Виконавці'}</h4>
						<p class="team-performers">{isEn ? event.performersEn : event.performersUk}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</article>

{#if video}
	<VideoModal
		video={videoModalOpen ? video : null}
		title={isEn ? (event.videoTitleEn ?? event.titleEn) : (event.videoTitleUk ?? event.titleUk)}
		onclose={() => (videoModalOpen = false)}
	/>
{/if}

<style>
	.production-card { display: grid; grid-template-columns: minmax(320px, 1fr) 1.2fr; gap: 2.5rem; align-items: start; padding-bottom: 2.75rem; border-bottom: 1px solid var(--border-main); }
	.production-card:last-child { padding-bottom: 0; border-bottom: none; }
	.production-card__media { display: flex; flex-direction: column; gap: 0.75rem; }
	.production-card__poster-box { position: relative; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15); background: #000; }
	.production-card__poster-btn { display: block; width: 100%; padding: 0; border: none; background: #000; cursor: pointer; font: inherit; text-align: inherit; }
	.production-card__poster { width: 100%; height: auto; display: block; object-fit: cover; transition: transform 0.4s ease; }
	.production-card__poster-box:hover .production-card__poster { transform: scale(1.03); }
	.poster-play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.25); transition: background 0.25s ease; }
	.production-card__poster-box:hover .poster-play-overlay { background: rgba(0, 0, 0, 0.4); }
	.poster-play-badge { width: 58px; height: 58px; border-radius: 50%; background: rgba(0, 0, 0, 0.72); border: 2px solid rgba(255, 255, 255, 0.85); color: #fff; display: flex; align-items: center; justify-content: center; padding-left: 3px; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease; }
	.production-card__poster-box:hover .poster-play-badge { transform: scale(1.12); background: var(--accent-primary); border-color: var(--accent-primary); color: var(--text-on-accent); }
	.poster-badges-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
	.poster-tag-badge { background: #e11d48; color: #fff; padding: 0.35rem 0.8rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 0.35rem; box-shadow: 0 2px 8px rgba(225, 29, 72, 0.3); }
	.poster-date-badge { background: var(--bg-card); color: var(--text-title); border: 1px solid var(--border-main); padding: 0.35rem 0.8rem; border-radius: 9999px; font-size: 0.825rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.45rem; margin-left: auto; }
	:global(.poster-date-icon) { color: var(--accent-text); flex-shrink: 0; }
	.production-actions { display: flex; flex-direction: column; gap: 0.65rem; width: 100%; }
	.btn-ticket { display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; background: var(--accent-primary); color: var(--text-on-accent); padding: 0.85rem 1.25rem; border-radius: 12px; font-weight: 700; font-size: 0.95rem; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); border: var(--btn-accent-border-width, 2px) solid var(--btn-accent-border, transparent); transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease; width: 100%; box-sizing: border-box; }
	.btn-ticket:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); }
	.btn-video { display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem; background: color-mix(in srgb, var(--accent-primary) 14%, transparent); border: 1px solid color-mix(in srgb, var(--accent-primary) 36%, transparent); color: var(--accent-text); padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; font-size: 0.95rem; font-family: inherit; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease; width: 100%; box-sizing: border-box; }
	.btn-video:hover { background: color-mix(in srgb, var(--accent-primary) 24%, transparent); border-color: var(--accent-text); transform: translateY(-1px); }
	.video-action-group { display: flex; flex-direction: column; gap: 0.45rem; width: 100%; }
	.video-action-caption { margin: 0; padding: 0.6rem 0.85rem; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-main); font-size: 0.8rem; line-height: 1.45; color: var(--text-muted); }
	.btn-galaxy-play { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--bg-card); border: 1px solid var(--border-main); color: var(--text-title); padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.95rem; text-decoration: none; transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease; width: 100%; box-sizing: border-box; }
	.btn-galaxy-play:hover { background: color-mix(in srgb, var(--accent-primary) 12%, transparent); border-color: var(--accent-text); color: var(--accent-text); transform: translateY(-1px); }
	.production-card__details { display: flex; flex-direction: column; }
	.meta-badges { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem; }
	.play-genre { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text); }
	.age-badge { font-size: 0.75rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 6px; background: rgba(255, 255, 255, 0.08); color: var(--text-muted); border: 1px solid var(--border-main); }
	.play-title { font-size: 1.75rem; font-weight: 800; color: var(--text-title); margin: 0 0 0.4rem; line-height: 1.25; white-space: pre-line; }
	.play-author { font-size: 0.95rem; color: var(--text-muted); margin: 0 0 1.25rem; line-height: 1.45; }
	.schedule-box { display: flex; gap: 1.5rem; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
	.schedule-item { display: flex; align-items: center; gap: 0.75rem; }
	:global(.schedule-icon) { color: var(--accent-text); flex-shrink: 0; }
	.schedule-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; }
	.schedule-value { font-size: 0.95rem; font-weight: 700; color: var(--text-title); }
	.course-link, .creator-link { color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
	.team-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.team-group { border-top: 1px solid var(--border-main); padding-top: 1rem; }
	.team-title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 0.45rem; }
	.team-item { font-size: 0.925rem; line-height: 1.4; }
	.team-role, .team-performers { color: var(--text-muted); }
	.team-performers { margin: 0; font-size: 0.925rem; line-height: 1.4; }
	@media (max-width: 900px) {
		.production-card { display: flex; flex-direction: column; gap: 1.25rem; }
		.production-card__media, .production-card__details { display: contents; }
		.production-card__poster-box { order: 1; }
		.poster-badges-bar { order: 2; }
		.play-meta { order: 3; }
		.schedule-box { order: 4; }
		.production-actions { order: 5; }
		.team-section { order: 6; }
	}
	@media (max-width: 600px) {
		.schedule-box { flex-direction: column; gap: 0.75rem; }
	}
</style>
