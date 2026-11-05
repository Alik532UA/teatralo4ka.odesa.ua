<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Calendar, ChevronRight } from 'lucide-svelte';
	import { UART_REPERTOIRE_EVENTS } from '$lib/data/uartRepertoireEvents';
	import UartEventCard from './UartEventCard.svelte';

	const isEn = $derived($locale === 'en');
	const events = UART_REPERTOIRE_EVENTS;
</script>

<section class="uart-showcase" aria-labelledby="uart-showcase-title" data-testid="uart-showcase-section">
	<div class="showcase-header">
		<div class="showcase-header__top">
			<div class="showcase-badge">
				<Calendar size={14} aria-hidden="true" />
				<span>{isEn ? 'Active Repertoire · November 2026' : 'Актуальний репертуар · Листопад 2026'}</span>
			</div>
			<a
				href={resolve('/posters')}
				class="repertoire-poster-link"
				data-testid="uart-repertoire-poster-link"
			>
				<span>{isEn ? 'Repertoire A1 Poster' : 'Афіша репертуару A1'}</span>
				<ChevronRight size={15} aria-hidden="true" />
			</a>
		</div>

		<h2 id="uart-showcase-title" class="showcase-title">
			{isEn ? 'Repertoire Productions & Events (4)' : 'Афіша та репертуар театру (4 події)'}
		</h2>

		<nav class="events-nav" aria-label={isEn ? 'Events navigation' : 'Навігація по подіях репертуару'}>
			{#each events as ev (ev.id)}
				<a href={`#event-${ev.id}`} class="event-nav-chip" data-testid={`uart-event-${ev.id}-nav-link`}>
					<span class="chip-date">{isEn ? ev.dateBadgeEn : ev.dateBadgeUk}</span>
					<span class="chip-title">{isEn ? ev.titleEn : ev.titleUk}</span>
				</a>
			{/each}
		</nav>
	</div>

	<div class="showcase-events-list">
		{#each events as event (event.id)}
			<UartEventCard {event} {isEn} />
		{/each}
	</div>
</section>

<style>
	.uart-showcase {
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		border-radius: 24px;
		padding: 2.5rem 2rem;
	}
	.showcase-header {
		margin-bottom: 2.5rem;
		border-bottom: 1px solid var(--border-main);
		padding-bottom: 1.75rem;
	}
	.showcase-header__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
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
	}
	.repertoire-poster-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent-text);
		text-decoration: none;
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent);
		transition: background 0.2s ease, transform 0.2s ease;
	}
	.repertoire-poster-link:hover {
		background: color-mix(in srgb, var(--accent-primary) 20%, transparent);
		transform: translateY(-1px);
	}
	.showcase-title {
		font-size: 1.85rem;
		font-weight: 800;
		color: var(--text-title);
		margin: 0 0 1.25rem;
	}
	.events-nav {
		display: flex;
		gap: 0.65rem;
		overflow-x: auto;
		scrollbar-width: none;
		padding-bottom: 0.25rem;
	}
	.events-nav::-webkit-scrollbar {
		display: none;
	}
	.event-nav-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 9999px;
		padding: 0.4rem 0.85rem;
		font-size: 0.825rem;
		color: var(--text-main);
		text-decoration: none;
		white-space: nowrap;
		flex-shrink: 0;
		transition: all 0.2s ease;
	}
	.event-nav-chip:hover {
		border-color: var(--accent-text);
		color: var(--accent-text);
		transform: translateY(-1px);
	}
	.chip-date {
		font-weight: 700;
		color: var(--accent-text);
	}
	.chip-title {
		font-weight: 500;
	}
	.showcase-events-list {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}
	@media (max-width: 600px) {
		.uart-showcase { padding: 1.5rem 1rem; }
		.showcase-title { font-size: 1.45rem; }
	}
</style>
