<script lang="ts">
	import type { CalendarDay, CalendarMonth } from '$lib/data/academicCalendar';

	interface Props {
		month: CalendarMonth;
		locale?: string;
		selectedDate?: string | null;
		onSelectDay?: (day: CalendarDay) => void;
	}

	let { month, locale = 'uk', selectedDate = null, onSelectDay }: Props = $props();

	const WEEKDAYS_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
	const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const weekdays = $derived(locale === 'en' ? WEEKDAYS_EN : WEEKDAYS_UK);
	const monthTitle = $derived(locale === 'en' ? month.nameEn : month.nameUk);

	function getDayAriaLabel(day: CalendarDay): string {
		const parts: string[] = [`${day.day} ${monthTitle} ${day.year}`];
		if (day.isCurrentMonth && day.isUaHoliday) {
			parts.push(locale === 'en' ? 'State Holiday of Ukraine' : 'Державне свято України');
		}
		if (day.isCurrentMonth && day.vacation) {
			parts.push(locale === 'en' ? day.vacation.nameEn : day.vacation.nameUk);
		}
		if (day.specialEvent) {
			parts.push(locale === 'en' ? day.specialEvent.titleEn : day.specialEvent.titleUk);
		}
		return parts.join(', ');
	}
</script>

<article
	class="calendar-month-card"
	class:next-year-preview={month.isNextYearPreview}
	data-testid={`calendar-month-${month.year}-${String(month.month).padStart(2, '0')}-card`}
>
	<header class="month-card__header">
		<h3 class="month-card__title">{monthTitle}</h3>
	</header>

	<div
		class="month-card__weekdays"
		class:weekdays-preview={month.isNextYearPreview}
		role="row"
		aria-label={locale === 'en' ? 'Days of the week' : 'Дні тижня'}
	>
		{#each weekdays as dayName (dayName)}
			<span class="weekday-cell">{dayName}</span>
		{/each}
	</div>

	<div class="month-card__days-grid" role="grid">
		{#each month.days as day (day.date + '-' + day.isCurrentMonth)}
			{@const isSelected = selectedDate === day.date}
			{@const isAutumnVac = day.isCurrentMonth && day.vacation?.id === 'autumn'}
			{@const isWinterVac = day.isCurrentMonth && day.vacation?.id === 'winter'}
			{@const isSpringVac = day.isCurrentMonth && day.vacation?.id === 'spring'}
			{@const isUaFlag = day.isCurrentMonth && Boolean(day.isUaHoliday)}
			<button
				type="button"
				class="day-cell"
				class:day-current={day.isCurrentMonth}
				class:day-other={!day.isCurrentMonth}
				class:day-selected={isSelected}
				class:ua-flag-badge={isUaFlag}
				class:vacation-autumn={isAutumnVac}
				class:vacation-winter={isWinterVac}
				class:vacation-spring={isSpringVac}
				aria-label={getDayAriaLabel(day)}
				aria-pressed={isSelected}
				data-testid={`calendar-day-${day.date}-btn`}
				onclick={() => onSelectDay?.(day)}
			>
				<span class="day-number">{day.day}</span>
			</button>
		{/each}
	</div>
</article>

<style>
	.calendar-month-card {
		--card-bg: rgba(217, 217, 217, 0.77);
		--card-border: rgba(255, 255, 255, 0.45);
		--text-day: #000000;
		--text-muted: #a0a0a0;
		--weekday-bg: #47a3ff;
		--weekday-text: #ffffff;

		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		border-radius: clamp(14px, 2cqi, 28px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.05);
		padding: clamp(0.25rem, 0.6cqi, 0.75rem) clamp(0.25rem, 0.5cqi, 0.65rem);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		position: relative;
		user-select: none;
		height: 100%;
		box-sizing: border-box;
	}

	:global(html.dark-theme) .calendar-month-card,
	:global(html[data-theme='dark']) .calendar-month-card,
	:global(html.dark-cyan-theme) .calendar-month-card,
	:global(html[data-theme='dark-cyan']) .calendar-month-card,
	:global(html.dark-blue-theme) .calendar-month-card,
	:global(html[data-theme='dark-blue']) .calendar-month-card {
		--card-bg: rgba(26, 38, 62, 0.85);
		--card-border: rgba(255, 255, 255, 0.16);
		--text-day: #ffffff;
		--text-muted: #6b7f9d;
	}

	.month-card__header {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0 0.15rem;
		flex-shrink: 0;
	}

	.month-card__title {
		margin: 0;
		font-size: clamp(0.95rem, 1.75cqi, 1.7rem);
		font-weight: 700;
		color: var(--text-day);
		text-align: center;
		letter-spacing: -0.01em;
	}

	.month-card__weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: var(--weekday-bg);
		border-radius: 8px;
		padding: clamp(0.12rem, 0.25cqi, 0.3rem) 0.1rem;
		margin-bottom: clamp(0.1rem, 0.2cqi, 0.2rem);
		flex-shrink: 0;
	}

	.month-card__weekdays.weekdays-preview {
		background: #2e8739;
	}

	.weekday-cell {
		text-align: center;
		font-size: clamp(0.7rem, 1.05cqi, 1.1rem);
		font-weight: 700;
		color: var(--weekday-text);
		line-height: 1.15;
	}

	.month-card__days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-template-rows: repeat(6, 1fr);
		row-gap: 2px;
		column-gap: 2px;
		flex: 1;
		min-height: 0;
		align-content: stretch;
	}

	.day-cell {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 0;
		aspect-ratio: 1 / 1;
		max-height: 36px;
		max-width: 36px;
		margin: 0 auto;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		font-family: inherit;
		border-radius: 8px;
		transition: transform 0.15s ease;
	}

	.day-cell:hover {
		transform: scale(1.1);
		z-index: 2;
	}

	.day-cell:focus-visible {
		outline: 2px solid var(--weekday-bg);
		outline-offset: 1px;
		z-index: 3;
	}

	.day-number {
		font-size: clamp(0.78rem, 1.25cqi, 1.35rem);
		line-height: 1;
		position: relative;
		z-index: 1;
	}

	.day-current .day-number {
		color: var(--text-day);
		font-weight: 700;
	}

	.day-other .day-number {
		color: var(--text-muted);
		font-weight: 500;
		opacity: 0.6;
	}

	/* Ukrainian State Holidays */
	.day-cell.ua-flag-badge::before {
		content: '';
		position: absolute;
		inset: -8%;
		background: url('/calendar/badge-flag-ua.svg') center / contain no-repeat;
		border-radius: 12px;
		pointer-events: none;
	}

	.day-cell.ua-flag-badge .day-number {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
	}

	/* Autumn Vacation - Leaf badge */
	.day-cell.vacation-autumn::before {
		content: '';
		position: absolute;
		inset: -10% -12%;
		background: url('/calendar/badge-leaf-autumn.svg') center / contain no-repeat;
		pointer-events: none;
	}

	.day-cell.vacation-autumn .day-number {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
	}

	/* Winter Vacation - Snowflake badge */
	.day-cell.vacation-winter::before {
		content: '';
		position: absolute;
		inset: -12% -12%;
		background: url('/calendar/badge-snowflake-winter.svg') center / contain no-repeat;
		pointer-events: none;
	}

	.day-cell.vacation-winter .day-number {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
	}

	/* Spring Vacation - Sprout leaf badge */
	.day-cell.vacation-spring::before {
		content: '';
		position: absolute;
		inset: -18% -22%;
		background: url('/calendar/badge-leaf-spring.svg') center / contain no-repeat;
		pointer-events: none;
	}

	.day-cell.vacation-spring .day-number {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
	}

	.day-cell.day-selected {
		box-shadow: 0 0 0 2px #000000;
	}
</style>
