<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import {
		ANNIVERSARY_30_POSTER,
		ANNIVERSARY_30_LEFT_PARTICLES,
		ANNIVERSARY_30_RIGHT_PARTICLES
	} from '$lib/data/anniversary30';
	import Anniversary30CharityCard from './anniversary-30/Anniversary30CharityCard.svelte';
	import {
		Calendar,
		ExternalLink,
		Video,
		Palette,
		Music,
		Sparkles,
		Globe,
		PartyPopper,
		Tv
	} from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
		printMode?: 'digital' | 'paper';
	}

	let { isEn = false, themeId = 'yellow-brand', printMode = 'digital' }: Props = $props();

	const poster = ANNIVERSARY_30_POSTER;

	function getEventIcon(id: string) {
		switch (id) {
			case 'video-digest': return Tv;
			case 'art-exhibition': return Palette;
			case 'festive-concert': return Music;
			case 'cinema-zoom': return Video;
			case 'tiktok-video': return Sparkles;
			case 'graduates-interview': return Globe;
			case 'children-holiday': return PartyPopper;
			case 'anniversary-show': return Sparkles;
			case 'admission-conference': return Video;
			default: return Calendar;
		}
	}
</script>

<div class="poster-frame" data-testid="anniversary-30-poster-container">
	<article
		class="anniversary-poster"
		class:anniversary-poster--dark={themeId === 'uart-dark'}
		class:anniversary-poster--white={themeId === 'paper-white'}
		class:anniversary-poster--cream={themeId === 'warm-cream'}
		class:anniversary-poster--gold={themeId === 'theatre-gold'}
		data-testid="anniversary-30-poster-card"
	>
		<!-- Бічні іконки айдентики ліворуч -->
		<aside class="side-icons side-icons--left" aria-hidden="true">
			{#each ANNIVERSARY_30_LEFT_PARTICLES as p, i (i)}
				<img
					src={asset(p.iconFile)}
					alt={isEn ? p.nameEn : p.nameUk}
					width={p.size}
					height={p.size}
					class="side-particle"
					style="top: {p.top}%; left: {p.x}%; width: {p.size}px; transform: translate(-50%, -50%) rotate({p.rot}deg); opacity: {p.opacity};"
					loading="eager"
					decoding="async"
				/>
			{/each}
		</aside>

		<!-- Бічні іконки айдентики праворуч -->
		<aside class="side-icons side-icons--right" aria-hidden="true">
			{#each ANNIVERSARY_30_RIGHT_PARTICLES as p, i (i)}
				<img
					src={asset(p.iconFile)}
					alt={isEn ? p.nameEn : p.nameUk}
					width={p.size}
					height={p.size}
					class="side-particle"
					style="top: {p.top}%; right: {p.x}%; width: {p.size}px; transform: translate(50%, -50%) rotate({p.rot}deg); opacity: {p.opacity};"
					loading="eager"
					decoding="async"
				/>
			{/each}
		</aside>

		<!-- Центральний вміст ювілейної афіші -->
		<div class="poster-content">
			<!-- Шапка: герб та заголовок 30-річчя -->
			<header class="poster-header">
				<div class="emblem-wrap">
					<img
						src={asset('/logo/svg/t4_logo_IndividualParticles_MasksTwo_2026.svg')}
						alt={isEn ? 'Odesa Theatre School Crest' : 'Герб Одеської театральної школи'}
						width="160"
						height="97"
						class="emblem-img"
						loading="eager"
						decoding="async"
					/>
				</div>

				<div class="header-jubilee-badge">
					<Sparkles size={13} aria-hidden="true" />
					<span>{isEn ? poster.headerBadgeEn : poster.headerBadgeUk}</span>
				</div>

				<p class="anniversary-subtitle">
					{isEn ? poster.subtitleEn : poster.subtitleUk}
				</p>

				<h1 class="anniversary-title">
					<span class="anniversary-title-text">
						{#if isEn}
							Odesa Theatre School<br /><span class="anniversary-title-highlight">is 30 Years Old!</span>
						{:else}
							Одеській театральній школі&nbsp;–<br /><span class="anniversary-title-highlight">30&nbsp;років!!!</span>
						{/if}
					</span>
				</h1>

				<div class="dates-range-pill">
					<Calendar size={14} aria-hidden="true" />
					<span>{isEn ? poster.datesRangeEn : poster.datesRangeUk}</span>
				</div>
			</header>

			<!-- Список святкових заходів -->
			<section class="events-section" aria-label={isEn ? 'Anniversary Events Schedule' : 'Програма святкових заходів'}>
				<div class="events-grid">
					{#each poster.events as item (item.id)}
						{@const IconComponent = getEventIcon(item.id)}
						<article
							class="event-card"
							class:event-card--highlight={item.id === 'festive-concert'}
							data-testid={`event-card-${item.id}`}
						>
							<div class="event-meta">
								<span class="event-date">{isEn ? item.dateEn : item.dateUk}</span>
								<span class="event-badge">{isEn ? item.badgeEn : item.badgeUk}</span>
							</div>

							<div class="event-main">
								<div class="event-icon-col" aria-hidden="true">
									<IconComponent size={item.id === 'festive-concert' ? 20 : 16} class="event-icon" />
								</div>
								<div class="event-info">
									<h2 class="event-title">
										{isEn ? item.titleEn : item.titleUk}
										{#if item.subtitleUk}
											<span class="event-subtitle">{isEn ? item.subtitleEn : item.subtitleUk}</span>
										{/if}
									</h2>

									<div class="event-channel-row">
										{#if printMode === 'paper'}
											<span class="channel-text channel-text--paper">
												{isEn ? item.noteEn : item.noteUk}
											</span>
										{:else if item.id === 'graduates-interview'}
											<a href={resolve('/projects/galaxy-graduates')} class="channel-link channel-link--site" data-testid="event-graduates-link">
												<ExternalLink size={12} aria-hidden="true" />
												<span>{isEn ? item.noteEn : item.noteUk}</span>
											</a>
										{:else if item.id === 'festive-concert'}
											<a
												href="https://concert.ua/uk/event/muzichnii-koncert"
												target="_blank"
												rel="noopener noreferrer"
												class="channel-link channel-link--concert"
												data-testid="event-concert-link"
											>
												<ExternalLink size={12} aria-hidden="true" />
												<span>{isEn ? item.noteEn : item.noteUk}</span>
											</a>
										{:else if item.id === 'video-digest'}
											<a
												href="https://www.instagram.com/teatralo4ka_official_/"
												target="_blank"
												rel="noopener noreferrer"
												class="channel-link"
												data-testid="event-instagram-link"
											>
												<ExternalLink size={12} aria-hidden="true" />
												<span>{isEn ? item.noteEn : item.noteUk}</span>
											</a>
										{:else if item.id === 'cinema-zoom'}
											<a
												href="https://www.youtube.com/@teatralo4ka_odesa"
												target="_blank"
												rel="noopener noreferrer"
												class="channel-link"
												data-testid="event-youtube-link"
											>
												<ExternalLink size={12} aria-hidden="true" />
												<span>{isEn ? item.noteEn : item.noteUk}</span>
											</a>
										{:else if item.id === 'tiktok-video'}
											<a
												href="https://www.tiktok.com/@teatralo4ka_official/"
												target="_blank"
												rel="noopener noreferrer"
												class="channel-link"
												data-testid="event-tiktok-link"
											>
												<ExternalLink size={12} aria-hidden="true" />
												<span>{isEn ? item.noteEn : item.noteUk}</span>
											</a>
										{:else}
											<span class="channel-text">
												{isEn ? item.noteEn : item.noteUk}
											</span>
										{/if}
									</div>
								</div>
							</div>
						</article>
					{/each}
				</div>
			</section>

			<!-- Блок благодійного збору на ЗСУ для 14 ОРБ -->
			<div class="charity-wrapper">
				<Anniversary30CharityCard {isEn} {themeId} {printMode} />
			</div>

			<!-- Нижній колонтитул -->
			<footer class="poster-footer">
				<p class="poster-season">
					{isEn ? poster.schoolEn : poster.schoolUk}
				</p>
			</footer>
		</div>
	</article>
</div>

<style>
	.poster-frame {
		container-type: inline-size;
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
	}

	.anniversary-poster {
		position: relative;
		width: 100%;
		background-color: #ffed00;
		background-image:
			radial-gradient(circle at 10% 15%, rgba(255, 255, 255, 0.45) 0%, transparent 40%),
			radial-gradient(circle at 90% 85%, rgba(254, 218, 0, 0.6) 0%, transparent 45%);
		border-radius: clamp(14px, 2.2cqi, 28px);
		box-shadow:
			0 20px 45px -10px rgba(0, 0, 0, 0.22),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		color: #111827;
		overflow: hidden;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: clamp(14px, 2.5cqi, 30px) clamp(16px, 3cqi, 36px);
		user-select: text;
		transition: background-color 0.2s ease, color 0.2s ease;
	}

	.anniversary-poster--dark {
		background-color: #171118;
		background-image:
			radial-gradient(circle at 15% 15%, rgba(120, 53, 15, 0.35) 0%, transparent 45%),
			radial-gradient(circle at 85% 85%, rgba(180, 83, 9, 0.2) 0%, transparent 50%);
		color: #f8fafc;
	}

	.anniversary-poster--white {
		background-color: #ffffff;
		background-image: none;
		border: 1px solid rgba(0, 0, 0, 0.12);
	}

	.anniversary-poster--cream {
		background-color: #fffbeb;
		background-image: radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.5) 0%, transparent 60%);
	}

	.anniversary-poster--gold {
		background-color: #fef08a;
		background-image: radial-gradient(circle at 50% 20%, rgba(253, 224, 71, 0.6) 0%, transparent 50%);
	}

	.side-icons {
		position: absolute;
		top: 0;
		bottom: 0;
		width: clamp(72px, 11cqi, 112px);
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
	}

	.side-icons--left { left: 0; }
	.side-icons--right { right: 0; }

	.side-particle {
		position: absolute;
		height: auto;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
		pointer-events: none;
		transition: opacity 0.2s ease;
	}

	.poster-content {
		position: relative;
		z-index: 2;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: clamp(12px, 2cqi, 20px);
		max-width: 81%;
		margin: 0 auto;
		text-align: center;
	}

	.poster-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(3px, 0.7cqi, 6px);
	}

	.emblem-wrap { display: flex; justify-content: center; }

	.emblem-img {
		width: clamp(88px, 14cqi, 140px);
		height: auto;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
	}

	.header-jubilee-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #0369a1;
		color: #ffffff;
		padding: 3px 10px;
		border-radius: 999px;
		font-size: clamp(10px, 1.3cqi, 12.5px);
		font-weight: 800;
		letter-spacing: 0.05em;
		box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
	}

	.anniversary-poster--dark .header-jubilee-badge {
		background: #0369a1;
	}

	.anniversary-subtitle {
		margin: 0;
		font-size: clamp(13px, 1.8cqi, 20px);
		font-weight: 800;
		color: #0369a1;
	}

	.anniversary-poster--dark .anniversary-subtitle {
		color: #38bdf8;
	}

	.anniversary-title {
		margin: 0;
		font-size: clamp(20px, 3.8cqi, 40px);
		font-weight: 900;
		line-height: 1.15;
		color: #00242f;
		text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
	}

	.anniversary-title-highlight {
		white-space: nowrap;
	}

	.anniversary-poster--dark .anniversary-title {
		color: #f8fafc;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
	}

	.dates-range-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(0, 0, 0, 0.06);
		color: #1e293b;
		padding: 3px 10px;
		border-radius: 999px;
		font-size: clamp(11px, 1.4cqi, 13px);
		font-weight: 700;
	}

	.anniversary-poster--dark .dates-range-pill {
		background: rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
	}

	/* Сітка подій */
	.events-section {
		width: 100%;
	}

	.events-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(min(280px, 100%), 1fr));
		gap: clamp(8px, 1.3cqi, 12px);
	}

	.event-card {
		background: rgba(255, 255, 255, 0.92);
		border-radius: clamp(10px, 1.6cqi, 16px);
		padding: clamp(8px, 1.3cqi, 14px) clamp(10px, 1.6cqi, 16px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
		display: flex;
		flex-direction: column;
		gap: 6px;
		text-align: left;
		border: 1px solid rgba(0, 0, 0, 0.05);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.event-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
	}

	.anniversary-poster--dark .event-card {
		background: rgba(30, 24, 32, 0.85);
		color: #f1f5f9;
		border-color: rgba(255, 255, 255, 0.08);
	}

	.event-card--highlight {
		grid-column: span 2;
		border: 2px solid #0284c7;
		background: linear-gradient(135deg, rgba(240, 249, 255, 0.98) 0%, rgba(224, 242, 254, 0.95) 100%);
		padding: clamp(10px, 1.6cqi, 16px) clamp(12px, 2cqi, 20px);
		box-shadow: 0 6px 16px rgba(2, 132, 199, 0.12);
	}

	.anniversary-poster--dark .event-card--highlight {
		background: linear-gradient(135deg, rgba(12, 74, 110, 0.45) 0%, rgba(3, 105, 161, 0.25) 100%);
		border-color: #38bdf8;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
	}

	.event-card--highlight .event-date {
		font-size: clamp(11.5px, 1.5cqi, 14px);
	}

	.event-card--highlight .event-title {
		font-size: clamp(12px, 1.6cqi, 15px);
		font-weight: 900;
	}

	.event-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
	}

	.event-date {
		font-size: clamp(10.5px, 1.35cqi, 13px);
		font-weight: 800;
		color: #0369a1;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.anniversary-poster--dark .event-date { color: #fbbf24; }

	.event-badge {
		font-size: 9.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: #f1f5f9;
		color: #475569;
		padding: 2px 6px;
		border-radius: 999px;
	}

	.anniversary-poster--dark .event-badge {
		background: #334155;
		color: #cbd5e1;
	}

	.event-card--highlight .event-badge {
		background: #0369a1;
		color: #ffffff;
	}

	.event-main {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.event-icon-col {
		flex-shrink: 0;
		margin-top: 2px;
		color: #0284c7;
	}

	.anniversary-poster--dark .event-icon-col {
		color: #38bdf8;
	}

	.event-info {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.event-title {
		margin: 0;
		font-size: clamp(11px, 1.4cqi, 13.5px);
		font-weight: 800;
		color: #0f172a;
		line-height: 1.3;
	}

	.event-subtitle {
		display: block;
		font-size: 0.85em;
		font-weight: 500;
		color: #475569;
		margin-top: 1px;
	}

	.anniversary-poster--dark .event-title { color: #f8fafc; }
	.anniversary-poster--dark .event-subtitle { color: #94a3b8; }

	.event-channel-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.channel-text {
		font-size: clamp(9.5px, 1.25cqi, 11.5px);
		font-weight: 600;
		color: #64748b;
	}

	.anniversary-poster--dark .channel-text { color: #94a3b8; }

	.event-card--highlight .channel-text--paper {
		color: #1e3a8a;
		font-weight: 700;
	}
	.anniversary-poster--dark .event-card--highlight .channel-text--paper {
		color: #93c5fd;
	}

	.channel-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: clamp(9.5px, 1.25cqi, 11.5px);
		font-weight: 700;
		color: #0284c7;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.anniversary-poster--dark .channel-link { color: #38bdf8; }

	.channel-link--concert {
		color: #0369a1;
		font-weight: 800;
	}

	.anniversary-poster--dark .channel-link--concert { color: #38bdf8; }

	.charity-wrapper {
		width: 100%;
	}

	.poster-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		margin-top: auto;
		padding-top: 4px;
	}

	.poster-season {
		margin: 0;
		font-size: clamp(9px, 1.2cqi, 12px);
		font-weight: 600;
		color: #475569;
	}

	.anniversary-poster--dark .poster-season { color: #94a3b8; }

	@container (max-width: 580px) {
		.side-icons { display: none; }
		.poster-content { max-width: 100%; }
		.events-grid { grid-template-columns: 1fr; }
		.event-card--highlight { grid-column: span 1; }
	}

	@media print {
		.poster-frame {
			width: 100% !important;
			max-width: none !important;
			margin: 0 !important;
		}

		.anniversary-poster {
			width: 210mm !important;
			min-height: 297mm !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			padding: 12mm 14mm !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
		}
	}
</style>
