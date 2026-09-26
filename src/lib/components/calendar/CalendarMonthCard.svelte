<script lang="ts">
	import { tick } from 'svelte';
	import type { CalendarDay, CalendarMonth } from '$lib/data/academicCalendar';
	import { dayLabel, pick, VACATION_NAMES, WEEKDAYS } from '$lib/data/calendarText';
	import type { Locale } from '$lib/i18n/routing';
	import { monthGridStep } from '$lib/utils/monthGridStep';

	/**
	 * Картка місяця — сітка за шаблоном WAI-ARIA APG «Grid».
	 *
	 * ## Хвости сусідніх місяців — не кнопки
	 *
	 * Сітка завжди має 42 клітинки, тож 1 жовтня стоїть і в жовтні, і хвостом у
	 * вересні. Перша редакція робила кнопкою кожну клітинку: той самий день мав
	 * дві кнопки з однаковим `data-testid`, а на плакаті їх було 546 — стільки
	 * зупинок Tab до підвалу сторінки. Хвіст тепер лише малюнок (`aria-hidden`).
	 *
	 * ## Одна зупинка Tab на місяць
	 *
	 * Усередині сітки ходять стрілки (Home/End — до краю тижня), у порядку Tab
	 * стоїть одна клітинка: остання, на якій був фокус, або вибраний день, або
	 * перше число. Обробник — на самих кнопках, а не на сітці: інтерактивна роль
	 * без `tabindex` на контейнері дала б попередження `svelte-check`.
	 */
	interface Props {
		month: CalendarMonth;
		locale?: Locale;
		selectedDate?: string | null;
		onSelectDay?: (day: CalendarDay) => void;
	}

	let { month, locale = 'uk', selectedDate = null, onSelectDay }: Props = $props();

	const monthTitle = $derived(pick(month.name, locale));
	const monthKey = $derived(`${month.year}-${String(month.month).padStart(2, '0')}`);
	const titleId = $derived(`calendar-month-${monthKey}-title`);
	const weeks = $derived(Array.from({ length: 6 }, (_, w) => month.days.slice(w * 7, w * 7 + 7)));
	const ownDays = $derived(month.days.filter((d) => d.isCurrentMonth));
	/** Скільки клітинок першого тижня займає хвіст попереднього місяця. */
	const leading = $derived(month.days.findIndex((d) => d.isCurrentMonth));

	let focusDate = $state<string | null>(null);
	let grid = $state<HTMLElement | null>(null);

	const tabbableDate = $derived(
		[focusDate, selectedDate].find((date) => date && ownDays.some((d) => d.date === date)) ??
			ownDays[0]?.date
	);

	function ariaLabel(day: CalendarDay): string {
		const parts = [dayLabel(day.date, locale)];
		if (day.vacation) parts.push(pick(VACATION_NAMES[day.vacation], locale));
		for (const event of day.events) parts.push(pick(event, locale));
		return parts.join(', ');
	}

	async function handleKey(day: CalendarDay, event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		const index = ownDays.findIndex((d) => d.date === day.date);
		const next = monthGridStep(index, event.key, leading, ownDays.length);
		if (next === null) return;
		event.preventDefault();
		const date = ownDays[next].date;
		focusDate = date;
		await tick();
		grid?.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)?.focus();
	}
</script>

<article
	class="calendar-month-card"
	class:next-year-preview={month.isNextYearPreview}
	data-testid={`calendar-month-${monthKey}-card`}
>
	<header class="month-card__header">
		<h3 class="month-card__title" id={titleId}>{monthTitle}</h3>
	</header>

	<div class="month-card__table" role="grid" aria-labelledby={titleId} bind:this={grid}>
		<div class="month-card__weekdays" class:weekdays-preview={month.isNextYearPreview} role="row">
			{#each WEEKDAYS as weekday (weekday.full.en)}
				<span class="weekday-cell" role="columnheader" aria-label={pick(weekday.full, locale)}>
					{pick(weekday.short, locale)}
				</span>
			{/each}
		</div>

		{#each weeks as week, w (w)}
			<div class="month-card__week" role="row">
				{#each week as day (day.date)}
					<div class="day-slot" role="gridcell">
						{#if day.isCurrentMonth}
							{@const isSelected = selectedDate === day.date}
							<button
								type="button"
								class="day-cell day-current"
								class:day-summer={day.status === 'summer' && !day.badge}
								class:day-selected={isSelected}
								class:badge-flag={day.badge === 'flag'}
								class:badge-autumn={day.badge === 'autumn'}
								class:badge-winter={day.badge === 'winter'}
								class:badge-spring={day.badge === 'spring'}
								tabindex={day.date === tabbableDate ? 0 : -1}
								aria-label={ariaLabel(day)}
								aria-pressed={isSelected}
								data-date={day.date}
								data-testid={`calendar-day-${day.date}-btn`}
								onclick={() => onSelectDay?.(day)}
								onkeydown={(event) => handleKey(day, event)}
								onfocus={() => (focusDate = day.date)}
							>
								<span class="day-number">{day.day}</span>
							</button>
						{:else}
							<!-- Хвіст сусіднього місяця — прикраса: число малює CSS (розбір у стилях). -->
							<span class="day-cell day-other" aria-hidden="true" data-day={day.day}></span>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</article>

<style>
	.calendar-month-card {
		/* Палітра — спільна з рештою плаката (`CalendarPoster`), тут лише читається. */
		--weekday-bg: var(--calendar-weekday-bg, #47a3ff);
		--weekday-text: var(--calendar-weekday-text, #ffffff);

		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: var(--poster-card-bg);
		border: 1px solid var(--poster-card-border);
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
		color: var(--poster-text);
		text-align: center;
		letter-spacing: -0.01em;
	}

	.month-card__table {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
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

	.month-card__week {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		column-gap: 2px;
		flex: 1 1 0;
		min-height: 0;
	}

	.month-card__week + .month-card__week {
		margin-top: 2px;
	}

	.day-slot {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		min-height: 0;
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
		font-family: inherit;
		border-radius: 8px;
	}

	button.day-cell {
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	button.day-cell:hover {
		transform: scale(1.1);
		z-index: 2;
	}

	button.day-cell:focus-visible {
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
		color: var(--poster-text);
		font-weight: 700;
	}

	/*
	 * Літні канікули — не жирним і сірим (прохання автора 2026-09-26): навчання
	 * немає, і день мусить читатися тихіше за навчальний. Сірий — не блідий:
	 * світлий варіант (#4b5563) на світлій картці дає 5.4 : 1.
	 */
	.day-current.day-summer .day-number {
		color: var(--poster-text-summer);
		font-weight: 400;
	}

	/*
	 * Число хвоста сусіднього місяця — вміст CSS, а не текст сторінки.
	 *
	 * Воно навмисно бліде: показує, що день належить іншому місяцю. Це чиста
	 * прикраса, яку WCAG 1.4.3 з вимоги контрасту виключає, а читалка й так не
	 * чує (`aria-hidden`). axe цього знати не може: доки число було текстом, він
	 * рахував контраст ~2 : 1 щойно розбирав фон. Заодно хвіст не копіюється
	 * разом із днями місяця.
	 */
	.day-other::after {
		content: attr(data-day);
		font-size: clamp(0.78rem, 1.25cqi, 1.35rem);
		line-height: 1;
		color: var(--poster-text-muted);
		font-weight: 500;
		opacity: 0.6;
	}

	/* Державні свята — прапор */
	.day-cell.badge-flag::before {
		content: '';
		position: absolute;
		inset: -8%;
		background: url('/calendar/badge-flag-ua.svg') center / contain no-repeat;
		border-radius: 12px;
		pointer-events: none;
	}

	/* Осінні канікули — листок */
	.day-cell.badge-autumn::before {
		content: '';
		position: absolute;
		inset: -10% -12%;
		background: url('/calendar/badge-leaf-autumn.svg') center / contain no-repeat;
		pointer-events: none;
	}

	/* Зимові канікули й Різдво — сніжинка */
	.day-cell.badge-winter::before {
		content: '';
		position: absolute;
		inset: -12% -12%;
		background: url('/calendar/badge-snowflake-winter.svg') center / contain no-repeat;
		pointer-events: none;
	}

	/* Весняні канікули — паросток */
	.day-cell.badge-spring::before {
		content: '';
		position: absolute;
		inset: -18% -22%;
		background: url('/calendar/badge-leaf-spring.svg') center / contain no-repeat;
		pointer-events: none;
	}

	.day-cell.badge-flag .day-number {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
	}

	.day-cell.badge-autumn .day-number,
	.day-cell.badge-winter .day-number,
	.day-cell.badge-spring .day-number {
		color: #ffffff;
		font-weight: 700;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
	}

	/* Колір тексту дня, а не чорний: на темній картці чорне кільце зникало. */
	.day-cell.day-selected {
		box-shadow: 0 0 0 2px var(--poster-text);
	}
</style>
