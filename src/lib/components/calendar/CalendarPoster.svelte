<script lang="ts">
	import type { CalendarDay, CalendarMonth } from '$lib/data/academicCalendar';
	import CalendarMonthCard from './CalendarMonthCard.svelte';

	interface Props {
		months: CalendarMonth[];
		locale?: string;
		selectedDate?: string | null;
		onSelectDay?: (day: CalendarDay) => void;
	}

	let { months, locale = 'uk', selectedDate = null, onSelectDay }: Props = $props();
	const isEn = $derived(locale === 'en');

	const firstRowMonths = $derived(months.slice(0, 4));
	const remainingMonths = $derived(months.slice(4, 12));
	const previewMonth = $derived(months[12] ?? null);
</script>

<div class="calendar-poster" data-testid="calendar-poster-container">
	<header class="poster-header" data-testid="calendar-poster-header">
		<div class="header-pill">
			<h2 class="header-title">
				{isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}
			</h2>
		</div>
		<div class="header-masks-wrap">
			<img
				src="/calendar/calendar-masks-logo.png"
				alt={isEn ? 'Theatrical Masks' : 'Театральні маски'}
				class="header-masks"
				width="145"
				height="100"
			/>
		</div>
	</header>

	<div class="poster-grid" data-testid="calendar-poster-list">
		{#each firstRowMonths as m (m.year + '-' + m.month)}
			<div class="grid-slot">
				<CalendarMonthCard month={m} {locale} {selectedDate} {onSelectDay} />
			</div>
		{/each}

		<aside class="poster-vacations-panel" data-testid="calendar-poster-panel">
			<h3 class="vacations-title">{isEn ? 'Vacations' : 'Канікули'}</h3>

			<div class="vacation-block block-autumn">
				<img src="/calendar/dec-maple-orange.svg" alt="" class="dec-icon dec-maple-orange" width="62" height="62" />
				<img src="/calendar/dec-leaf-yellow.svg" alt="" class="dec-icon dec-leaf-yellow" width="54" height="42" />
				<img src="/calendar/dec-maple-red.svg" alt="" class="dec-icon dec-maple-red" width="60" height="58" />
				<img src="/calendar/dec-leaf-lime.svg" alt="" class="dec-icon dec-leaf-lime" width="46" height="38" />
				<img src="/calendar/dec-leaf-drop.svg" alt="" class="dec-icon dec-leaf-drop" width="20" height="18" />
				<div class="vac-text-wrap">
					<span class="vac-type-name">{isEn ? 'autumn' : 'осінні'}</span>
					<span class="vac-date-line">{isEn ? 'from Oct 27' : 'з 27 жовтня'}</span>
					<span class="vac-date-line">{isEn ? 'to Nov 2' : 'по 2 листопада'}</span>
				</div>
			</div>

			<div class="vacation-block block-winter">
				<img src="/calendar/dec-snow-top.svg" alt="" class="dec-icon dec-snow-top" width="44" height="38" />
				<img src="/calendar/dec-snow-mid.svg" alt="" class="dec-icon dec-snow-mid" width="44" height="38" />
				<img src="/calendar/dec-snow-bot.svg" alt="" class="dec-icon dec-snow-bot" width="44" height="38" />
				<div class="vac-text-wrap">
					<span class="vac-type-name">{isEn ? 'winter' : 'зимові'}</span>
					<span class="vac-date-line">{isEn ? 'from Dec 27' : 'з 27 грудня'}</span>
					<span class="vac-date-line">{isEn ? 'to Jan 11' : 'по 11 січня'}</span>
				</div>
			</div>

			<div class="vacation-block block-spring">
				<img src="/calendar/dec-leaf-green.svg" alt="" class="dec-icon dec-green-top" width="46" height="46" />
				<img src="/calendar/dec-green-mid.svg" alt="" class="dec-icon dec-green-mid" width="42" height="58" />
				<img src="/calendar/dec-green-bot.svg" alt="" class="dec-icon dec-green-bot" width="44" height="50" />
				<div class="vac-text-wrap">
					<span class="vac-type-name">{isEn ? 'spring' : 'весняні'}</span>
					<span class="vac-date-line">{isEn ? 'from Mar 23' : 'з 23 березня'}</span>
					<span class="vac-date-line">{isEn ? 'to Mar 29' : 'по 29 березня'}</span>
				</div>
			</div>
		</aside>

		{#each remainingMonths as m (m.year + '-' + m.month)}
			<div class="grid-slot">
				<CalendarMonthCard month={m} {locale} {selectedDate} {onSelectDay} />
			</div>
		{/each}

		{#if previewMonth}
			<div class="grid-slot">
				<CalendarMonthCard month={previewMonth} {locale} {selectedDate} {onSelectDay} />
			</div>
		{/if}
	</div>

	<footer class="poster-footer" data-testid="calendar-poster-footer">
		<div class="bottom-card year-card">
			<h3 class="year-card-title">
				{isEn ? 'Academic Year 2025–2026' : 'Навчальний рік 2025-2026'}
			</h3>
		</div>

		<div class="bottom-card semesters-card">
			<p class="semester-line">
				<strong>{isEn ? '1st semester' : '1-й семестр'}</strong> — {isEn ? 'from Sep 1 to Dec 26, 2025' : 'з 1 вересня по 26 грудня 2025 р.'}
			</p>
			<p class="semester-line">
				<strong>{isEn ? '2nd semester' : '2-й семестр'}</strong> — {isEn ? 'from Jan 12 to May 31, 2026' : 'з 12 січня по 31 травня 2026 р.'}
			</p>
		</div>
	</footer>
</div>

<style>
	.calendar-poster {
		container-type: inline-size;
		--card-bg: rgba(217, 217, 217, 0.77);
		--card-border: rgba(255, 255, 255, 0.45);
		--text-dark: #000000;

		width: 100%;
		max-width: 1600px;
		aspect-ratio: 297 / 210;
		margin: 0 auto;
		padding: clamp(14px, 2.8cqi, 48px);
		border-radius: clamp(24px, 3vw, 40px);
		border: 3px solid #141414;
		background: #8bc5ff url('/calendar/calendar-poster-bg.jpg') center / cover no-repeat;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: clamp(4px, 0.7cqi, 10px);
		box-sizing: border-box;
	}

	.poster-header {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: clamp(4px, 0.6cqi, 8px);
		align-items: center;
		flex-shrink: 0;
	}

	.header-pill {
		grid-column: 1 / span 4;
		width: 100%;
		box-sizing: border-box;
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		border-radius: clamp(16px, 2.5cqi, 48px);
		padding: clamp(0.35rem, 0.7cqi, 0.85rem) 1.5rem;
		backdrop-filter: blur(12px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		margin: 0;
		font-size: clamp(1.6rem, 4.2cqi, 5rem);
		font-weight: 700;
		color: var(--text-dark);
		letter-spacing: -0.01em;
		line-height: 1.2;
		text-align: center;
	}

	.header-masks-wrap {
		grid-column: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		position: relative;
	}

	.header-masks {
		width: 100%;
		max-width: clamp(110px, 15cqi, 190px);
		height: auto;
		max-height: clamp(65px, 10cqi, 125px);
		object-fit: contain;
		filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.18));
		position: absolute;
		top: 50%;
		transform: translateY(-35%);
	}

	.poster-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		grid-template-rows: repeat(3, minmax(0, 1fr));
		gap: clamp(4px, 0.6cqi, 8px);
		align-items: stretch;
		flex: 1;
		min-height: 0;
	}

	.grid-slot {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.poster-vacations-panel {
		grid-column: 5;
		grid-row: 1 / span 2;
		align-self: end;
		height: calc(100% - clamp(16px, 3.2cqi, 48px));
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		border-radius: clamp(14px, 2cqi, 28px);
		padding: clamp(0.35rem, 0.8cqi, 0.75rem);
		backdrop-filter: blur(16px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		overflow: hidden;
	}

	.vacations-title {
		margin: 0 0 0.35rem;
		font-size: clamp(1.2rem, 2.2cqi, 2.8rem);
		font-weight: 400;
		color: var(--text-dark);
		text-align: center;
	}

	.vacation-block {
		position: relative;
		padding: 0.5rem 0.5rem;
	}

	.dec-icon {
		position: absolute;
		pointer-events: none;
		z-index: 1;
		object-fit: contain;
	}

	.dec-maple-orange { top: -8px; left: 4px; width: clamp(26px, 3.2cqi, 44px); height: clamp(26px, 3.2cqi, 44px); }
	.dec-leaf-lime { top: 36px; left: 2px; width: clamp(18px, 2.3cqi, 30px); height: clamp(15px, 1.9cqi, 25px); }
	.dec-leaf-yellow { top: -4px; right: 20px; width: clamp(20px, 2.5cqi, 34px); height: clamp(16px, 2cqi, 26px); }
	.dec-maple-red { top: 26px; right: 4px; width: clamp(26px, 3.2cqi, 42px); height: clamp(26px, 3.2cqi, 42px); }
	.dec-leaf-drop { bottom: -6px; left: 50%; transform: translateX(-50%); width: clamp(10px, 1.2cqi, 16px); height: clamp(9px, 1.1cqi, 14px); }

	.dec-snow-top { top: 2px; right: 24px; width: clamp(20px, 2.4cqi, 32px); height: clamp(18px, 2.1cqi, 28px); }
	.dec-snow-mid { top: 22px; left: 10px; width: clamp(20px, 2.4cqi, 32px); height: clamp(18px, 2.1cqi, 28px); }
	.dec-snow-bot { bottom: 2px; right: 16px; width: clamp(20px, 2.4cqi, 32px); height: clamp(18px, 2.1cqi, 28px); }

	.dec-green-top { top: 2px; right: 22px; width: clamp(22px, 2.6cqi, 34px); height: clamp(22px, 2.6cqi, 34px); }
	.dec-green-mid { top: 22px; left: 10px; width: clamp(20px, 2.4cqi, 30px); height: clamp(26px, 3.2cqi, 40px); }
	.dec-green-bot { bottom: 0px; right: 14px; width: clamp(22px, 2.6cqi, 34px); height: clamp(24px, 3cqi, 38px); }

	.vac-text-wrap {
		position: relative; z-index: 2;
		display: flex; flex-direction: column; align-items: center;
		gap: 0.15rem; text-align: center;
		max-width: 250px; margin: 0 auto;
	}

	.vac-type-name {
		font-size: clamp(1.05rem, 1.95cqi, 2.4rem);
		font-weight: 400;
		color: var(--text-dark);
		line-height: 1.2;
	}

	.vac-date-line {
		font-size: clamp(0.9rem, 1.55cqi, 1.9rem);
		font-weight: 400;
		color: var(--text-dark);
		line-height: 1.25;
	}

	.poster-footer {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}

	.bottom-card {
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		border-radius: 28px;
		padding: 0.5rem 1.25rem;
		backdrop-filter: blur(12px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.year-card { align-items: center; text-align: center; padding: 0.4rem 0.75rem; }

	.year-card-title {
		margin: 0;
		font-size: clamp(1.2rem, 2.7cqi, 3.4rem);
		font-weight: 700;
		color: var(--text-dark);
		text-align: center;
		white-space: nowrap;
	}

	.semesters-card { justify-content: center; gap: 0.25rem; padding: 0.75rem 1.5rem; }

	.semester-line {
		margin: 0;
		font-size: clamp(0.85rem, 1.35cqi, 1.55rem);
		color: var(--text-dark);
		line-height: 1.35;
	}

	@container (max-width: 900px) {
		.poster-header, .poster-footer { grid-template-columns: 1fr; }
		.header-pill, .header-masks-wrap { grid-column: 1; }
		.header-masks-wrap { height: auto; }
		.header-masks { position: static; transform: none; max-height: 90px; }
		.poster-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.poster-vacations-panel { grid-column: span 2; grid-row: auto; height: auto; align-self: stretch; }
	}

	@container (max-width: 520px) {
		.poster-grid { grid-template-columns: 1fr; }
		.poster-vacations-panel { grid-column: span 1; }
	}
</style>
