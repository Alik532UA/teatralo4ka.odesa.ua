<script lang="ts">
	import { resolve, asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Calendar, Clock, Users, Ticket, Drama, ExternalLink } from 'lucide-svelte';
	import UartCreators from '$lib/components/uart/UartCreators.svelte';
	import UartCastChips from '$lib/components/uart/UartCastChips.svelte';

	const isEn = $derived($locale === 'en');
</script>

<section class="uart-showcase" aria-labelledby="uart-showcase-title" data-testid="uart-showcase-section">
	<div class="showcase-header">
		<div class="showcase-badge">
			<Calendar size={14} aria-hidden="true" />
			<span>{isEn ? 'Active Repertoire Premiere' : 'Актуальна прем’єра репертуару'}</span>
		</div>
		<h2 id="uart-showcase-title" class="showcase-title">
			{isEn ? 'Current Production' : 'Актуальна вистава театру'}
		</h2>
	</div>

	<div class="production-card">
		<div class="production-card__poster-box">
			<img
				src={asset('/png/uart-poster.webp')}
				alt={isEn ? 'Poster: Drama "Too Many Secrets"' : 'Афіша: Драма «Дуже багато SEкретів»'}
				class="production-card__poster"
				width="1376"
				height="768"
				loading="lazy"
			/>
			<div class="poster-date-badge">
				<Clock size={14} aria-hidden="true" />
				<span>{isEn ? 'Nov 7 • 18:00' : '7 листопада • 18:00'}</span>
			</div>
		</div>

		<div class="production-card__details">
			<div class="play-meta">
				<span class="play-genre">{isEn ? 'Teen Drama' : 'Підліткова драма'}</span>
				<h3 class="play-title">«Дуже багато SEкретів»</h3>
				<p class="play-author">
					{isEn
						? 'Based on the play "Sex Education" by Nina Zakhozhenko and co-authors'
						: 'за п’єсою Ніни Захоженко та спів­авторок «Статеве виховання»'}
				</p>
			</div>

			<div class="schedule-box">
				<div class="schedule-item">
					<Calendar size={18} class="schedule-icon" aria-hidden="true" />
					<div>
						<div class="schedule-label">{isEn ? 'Date' : 'Дата показу'}</div>
						<div class="schedule-value">{isEn ? 'November 7, 2026' : '7 листопада, 18:00'}</div>
					</div>
				</div>
				<div class="schedule-item">
					<Users size={18} class="schedule-icon" aria-hidden="true" />
					<div>
						<div class="schedule-label">{isEn ? 'Performers' : 'Сцена / Курс'}</div>
						<div class="schedule-value">
							<a
								href={resolve('/projects/galaxy-graduates/groups/[slug]', { slug: 'repete' })}
								class="course-link"
								data-testid="uart-repete-group-link"
							>
								{isEn ? 'Course "RePeTe"' : 'Курс «RePeTe»'}
							</a>
						</div>
					</div>
				</div>
			</div>

			<div class="production-actions">
				<a
					href="https://concert.ua/uk/event/uart-duzhe-bagato-sekretiv"
					target="_blank"
					rel="noopener noreferrer"
					class="btn-ticket"
					data-testid="uart-concert-ticket-btn"
				>
					<Ticket size={18} aria-hidden="true" />
					<span>{isEn ? 'Tickets on Concert.ua' : 'Квитки на Concert.ua'}</span>
					<ExternalLink size={15} aria-hidden="true" />
				</a>

				<a
					href={resolve('/projects/galaxy-graduates/plays/[id]', { id: 'stateve-vykhovannia-2026' })}
					class="btn-galaxy-play"
					data-testid="uart-galaxy-play-btn"
				>
					<Drama size={16} aria-hidden="true" />
					<span>{isEn ? 'Galaxy Play Page' : 'Сторінка вистави в Галактиці'}</span>
				</a>
			</div>

			<UartCreators />
			<UartCastChips />
		</div>
	</div>
</section>

<style>
	.uart-showcase {
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		border-radius: 24px;
		padding: 2.5rem 2rem;
	}
	.showcase-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--accent-text);
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}
	.showcase-title {
		font-size: 1.85rem;
		font-weight: 800;
		color: var(--text-title);
		margin: 0 0 2rem;
	}
	.production-card {
		display: grid;
		grid-template-columns: 1.05fr 1fr;
		gap: 2.25rem;
		align-items: center;
	}
	.production-card__poster-box {
		position: relative;
		border-radius: 18px;
		overflow: hidden;
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
		background: #000;
	}
	.production-card__poster {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
		transition: transform 0.4s ease;
	}
	.production-card__poster-box:hover .production-card__poster {
		transform: scale(1.03);
	}
	.poster-date-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(15, 23, 42, 0.88);
		color: #fff;
		backdrop-filter: blur(8px);
		padding: 0.45rem 0.9rem;
		border-radius: 9999px;
		font-size: 0.85rem;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	.play-genre {
		display: inline-block;
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-text);
		margin-bottom: 0.35rem;
	}
	.play-title {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-title);
		margin: 0 0 0.5rem;
		line-height: 1.25;
	}
	.play-author {
		font-size: 0.95rem;
		color: var(--text-muted);
		margin: 0 0 1.5rem;
		line-height: 1.45;
	}
	.schedule-box {
		display: flex;
		gap: 1.5rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 14px;
		padding: 1rem 1.25rem;
		margin-bottom: 1.5rem;
	}
	.schedule-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	:global(.schedule-icon) {
		color: var(--accent-text);
		flex-shrink: 0;
	}
	.schedule-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		font-weight: 600;
	}
	.schedule-value {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-title);
	}
	.course-link {
		color: var(--accent-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.production-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		margin-bottom: 1.75rem;
	}
	.btn-ticket {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		background: var(--accent-primary);
		color: var(--text-on-accent);
		padding: 0.75rem 1.4rem;
		border-radius: 12px;
		font-weight: 700;
		font-size: 0.95rem;
		text-decoration: none;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
		border: var(--btn-accent-border-width, 2px) solid var(--btn-accent-border, transparent);
		transition: transform 0.2s ease, filter 0.2s ease;
	}
	.btn-ticket:hover {
		transform: translateY(-2px);
		filter: brightness(1.06);
	}
	.btn-galaxy-play {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		padding: 0.75rem 1.25rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
		transition: background 0.2s ease, color 0.2s ease;
	}
	.btn-galaxy-play:hover {
		background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
		color: var(--accent-text);
	}
	@media (max-width: 900px) {
		.production-card { grid-template-columns: 1fr; }
	}
	@media (max-width: 600px) {
		.uart-showcase { padding: 1.5rem 1rem; }
		.schedule-box { flex-direction: column; gap: 0.75rem; }
		.production-actions { flex-direction: column; }
		.btn-ticket, .btn-galaxy-play { width: 100%; justify-content: center; }
	}
</style>
