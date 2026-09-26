<script lang="ts">
	import type { CalendarDay } from '$lib/data/academicCalendar';
	import { dayLabel, pick, VACATION_NAMES } from '$lib/data/calendarText';
	import type { Locale } from '$lib/i18n/routing';
	import { Calendar as CalendarIcon, Sparkles, X } from 'lucide-svelte';

	interface Props {
		day: CalendarDay | null;
		locale?: Locale;
		onClose: () => void;
	}

	let { day, locale = 'uk', onClose }: Props = $props();
	const isEn = $derived(locale === 'en');

	/**
	 * Рядок для дня, про який більше нічого не сказано.
	 *
	 * Перша редакція називала «звичайним навчальним днем» будь-який будній без
	 * подій — тобто й 10 липня. Тепер статус береться з дат року: літо має
	 * власну позначку вище, а рік, якого ще немає в реєстрі, так і названо.
	 */
	const neutral = $derived.by(() => {
		if (!day || day.isFlagDay || day.vacation || day.status === 'summer' || day.events.length) {
			return null;
		}
		if (day.isWeekend) return isEn ? 'Weekend' : 'Вихідний день';
		if (day.status === 'school') return isEn ? 'School day' : 'Навчальний день';
		return isEn
			? 'Dates of this academic year are not announced yet'
			: 'Дати цього навчального року ще не оголошені';
	});
</script>

{#if day}
	<div class="day-details-overlay" role="region" aria-label={isEn ? 'Day details' : 'Деталі дня'}>
		<div class="day-details-card" data-testid="calendar-day-card">
			<div class="day-details-card__header">
				<div class="day-details-date">
					<CalendarIcon size={20} aria-hidden="true" />
					<strong data-testid="calendar-day-card-title">{dayLabel(day.date, locale)}</strong>
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
				{#if day.isFlagDay}
					<div class="detail-badge badge-ua">
						<span>{isEn ? 'State Holiday of Ukraine 🇺🇦' : 'Державне свято України 🇺🇦'}</span>
					</div>
				{/if}

				{#if day.vacation}
					<div class="detail-badge badge-{day.vacation}">
						<Sparkles size={16} aria-hidden="true" />
						<span>{pick(VACATION_NAMES[day.vacation], locale)}</span>
					</div>
				{:else if day.status === 'summer'}
					<div class="detail-badge badge-summer">
						<Sparkles size={16} aria-hidden="true" />
						<span>{isEn ? 'Summer holidays' : 'Літні канікули'}</span>
					</div>
				{/if}

				{#each day.events as event (event.uk)}
					<p class="detail-event-title">{pick(event, locale)}</p>
				{/each}

				{#if neutral}
					<p class="detail-neutral">{neutral}</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.day-details-overlay {
		/* За темою сайту — тим самим `light-dark()`, що й плакат. */
		--card-bg: light-dark(rgba(255, 255, 255, 0.85), rgba(17, 24, 39, 0.88));
		--card-border: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.15));
		--card-text: light-dark(#111827, #f9fafb);
		--card-muted: light-dark(#6b7280, #9ca3af);

		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		/* Як панель фону: над підвалом, але під мобільним меню й модалками. */
		z-index: calc(var(--z-footer) + 1);
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

	.day-details-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
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
	}

	/* Темніші за кольори плаката: білий текст на #f7941e і #eb9900 першої
	   редакції мав контраст 2.3 : 1 при потрібних 4.5. */
	.badge-autumn {
		background: #b45309;
	}
	.badge-winter {
		background: #2f5bc4;
	}
	.badge-spring {
		background: #2e8739;
	}
	.badge-summer {
		background: #a16207;
	}
	.badge-ua {
		background: linear-gradient(180deg, #0066cc 49%, #ffcc00 50%);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

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

	@media print {
		.day-details-overlay {
			display: none;
		}
	}
</style>
