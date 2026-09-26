<script lang="ts">
	import { locale } from 'svelte-i18n';
	import {
		buildAcademicCalendar,
		type CalendarDay
	} from '$lib/data/academicCalendar';
	import CalendarPoster from '$lib/components/calendar/CalendarPoster.svelte';
	import CalendarDayCard from '$lib/components/calendar/CalendarDayCard.svelte';

	let selectedDay = $state<CalendarDay | null>(null);

	const allMonths = buildAcademicCalendar();
	const currentLocale = $derived($locale ?? 'uk');
	const isEn = $derived(currentLocale === 'en');

	function handleSelectDay(day: CalendarDay) {
		selectedDay = day;
	}

	$effect(() => {
		function onFsChange() {
			document.body.classList.toggle('calendar-fullscreen', !!document.fullscreenElement);
		}
		document.addEventListener('fullscreenchange', onFsChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFsChange);
			document.body.classList.remove('calendar-fullscreen');
		};
	});
</script>

<svelte:head>
	<title>{isEn ? 'Academic Calendar 2025–2026 | Odesa Theatre School' : 'Навчальний календар 2025–2026 | Одеська театральна школа'}</title>
</svelte:head>

<section class="calendar-page" data-testid="calendar-page-section">
	<div class="calendar-page-content">
		<CalendarPoster
			months={allMonths}
			locale={currentLocale}
			selectedDate={selectedDay?.date}
			onSelectDay={handleSelectDay}
		/>
	</div>

	<CalendarDayCard
		day={selectedDay}
		locale={currentLocale}
		onClose={() => (selectedDay = null)}
	/>
</section>

<style>
	.calendar-page {
		width: 100%;
		max-width: 1680px;
		margin: 0 auto;
		padding: clamp(0.75rem, 1.5vw, 1.5rem);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		box-sizing: border-box;
	}

	.calendar-page-content {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	:global(body.calendar-fullscreen) :global(main#main-content),
	:global(body.calendar-fullscreen) :global(main) {
		padding-top: 0 !important;
		height: 100dvh !important;
		min-height: 100dvh !important;
		overflow: hidden !important;
	}

	:global(body.calendar-fullscreen) :global(.header-blur-layer),
	:global(body.calendar-fullscreen) :global(#main-footer),
	:global(body.calendar-fullscreen) :global(.footer-spacer) {
		display: none !important;
	}

	:global(body.calendar-fullscreen) .calendar-page {
		width: 100vw;
		max-width: 100vw;
		height: 100dvh;
		min-height: 100dvh;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
		margin: 0 auto;
		overflow: hidden;
		box-sizing: border-box;
	}

	:global(body.calendar-fullscreen) .calendar-page-content {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.calendar-poster) {
		width: min(calc(100vw - 1rem), calc((100dvh - 1rem) * 297 / 210)) !important;
		height: min(calc(100dvh - 1rem), calc((100vw - 1rem) * 210 / 297)) !important;
		max-width: calc(100vw - 1rem) !important;
		max-height: calc(100dvh - 1rem) !important;
		aspect-ratio: 297 / 210 !important;
		border: none !important;
		border-radius: 0 !important;
		box-shadow: none !important;
		margin: auto !important;
		padding: clamp(14px, 2.5cqi, 44px) !important;
		gap: clamp(4px, 0.8cqi, 12px) !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.poster-header) {
		grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
		display: grid !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.header-pill) {
		grid-column: 1 / span 4 !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.header-masks-wrap) {
		grid-column: 5 !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.poster-grid) {
		grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
		display: grid !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.poster-vacations-panel) {
		grid-column: 5 !important;
		grid-row: 1 / span 2 !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.poster-footer) {
		grid-template-columns: 1fr 1fr !important;
		display: grid !important;
	}

	@media print {
		.calendar-page {
			padding: 0 !important;
			max-width: 100% !important;
		}
	}
</style>
