<script lang="ts">
	import type { CalendarDay } from '$lib/data/academicCalendar';
	import { Calendar as CalendarIcon, Sparkles, X } from 'lucide-svelte';

	interface Props {
		day: CalendarDay | null;
		locale?: string;
		onClose: () => void;
	}

	let { day, locale = 'uk', onClose }: Props = $props();
	const isEn = $derived(locale === 'en');
</script>

{#if day}
	<div class="day-details-overlay" role="region" aria-label={isEn ? 'Day Details' : 'Деталі дня'}>
		<div class="day-details-card" data-testid="calendar-day-card">
			<div class="day-details-card__header">
				<div class="day-details-date">
					<CalendarIcon size={20} aria-hidden="true" />
					<strong>{day.day}.{String(day.month).padStart(2, '0')}.{day.year}</strong>
				</div>
				<button
					type="button"
					class="day-details-close-btn"
					onclick={onClose}
					data-testid="calendar-day-card-close-btn"
					aria-label={isEn ? 'Close details' : 'Закрити деталі'}
				>
					<X size={18} aria-hidden="true" />
				</button>
			</div>

			<div class="day-details-content">
				{#if day.isUaHoliday}
					<div class="detail-badge badge-ua">
						<span>{isEn ? 'State Holiday of Ukraine 🇺🇦' : 'Державне свято України 🇺🇦'}</span>
					</div>
				{/if}

				{#if day.vacation}
					<div class="detail-badge badge-{day.vacation.season}">
						<Sparkles size={16} aria-hidden="true" />
						<span>{isEn ? day.vacation.nameEn : day.vacation.nameUk}</span>
					</div>
				{/if}

				{#if day.specialEvent}
					<p class="detail-event-title">
						{isEn ? day.specialEvent.titleEn : day.specialEvent.titleUk}
					</p>
				{:else if !day.vacation && !day.isUaHoliday}
					<p class="detail-neutral">
						{day.isWeekend
							? (isEn ? 'Weekend' : 'Вихідний день')
							: (isEn ? 'Regular school day' : 'Звичайний навчальний день')}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.day-details-overlay {
		--card-bg: rgba(255, 255, 255, 0.85);
		--card-border: rgba(0, 0, 0, 0.1);
		--card-text: #111827;
		--card-muted: #6b7280;

		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 10001;
	}

	:global(html.dark-theme) .day-details-overlay,
	:global(html[data-theme='dark']) .day-details-overlay,
	:global(html.dark-cyan-theme) .day-details-overlay,
	:global(html[data-theme='dark-cyan']) .day-details-overlay,
	:global(html.dark-blue-theme) .day-details-overlay,
	:global(html[data-theme='dark-blue']) .day-details-overlay {
		--card-bg: rgba(17, 24, 39, 0.88);
		--card-border: rgba(255, 255, 255, 0.15);
		--card-text: #f9fafb;
		--card-muted: #9ca3af;
	}

	.day-details-card {
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		border-radius: 20px;
		padding: 1.25rem;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		min-width: 280px;
		max-width: 380px;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.day-details-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.day-details-date {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.1rem;
		color: var(--card-text);
	}

	.day-details-close-btn {
		border: none;
		background: transparent;
		color: var(--card-muted);
		cursor: pointer;
		display: flex;
		padding: 4px;
		border-radius: 50%;
	}

	.day-details-close-btn:hover {
		color: var(--card-text);
		background: rgba(0, 0, 0, 0.05);
	}

	.day-details-close-btn:focus-visible {
		outline: 2px solid #4472e1;
	}

	.detail-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 700;
		color: #ffffff;
		margin-bottom: 0.35rem;
	}

	.badge-autumn { background: #f7941e; }
	.badge-winter { background: #4472e1; }
	.badge-spring { background: #2e8739; }
	.badge-summer { background: #eb9900; }
	.badge-ua { background: linear-gradient(180deg, #0066cc 49%, #ffcc00 50%); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8); }

	.detail-event-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--card-text);
		margin: 0;
	}

	.detail-neutral {
		font-size: 0.88rem;
		color: var(--card-muted);
		margin: 0;
	}
</style>
