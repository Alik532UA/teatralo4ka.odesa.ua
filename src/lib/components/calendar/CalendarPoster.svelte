<script lang="ts">
	import { asset } from '$app/paths';
	import { getCalendarThemeById } from '$lib/config/calendarThemes';
	import { imageSize, type LocalImage } from '$lib/config/localImages';
	import { ACADEMIC_YEARS } from '$lib/data/academicYears';
	import type { CalendarDay, CalendarMonth } from '$lib/data/academicCalendar';
	import { academicYearLabel, pick, rangeText } from '$lib/data/calendarText';
	import type { CalendarView } from '$lib/data/calendarView';
	import type { Locale } from '$lib/i18n/routing';
	import CalendarMonthCard from './CalendarMonthCard.svelte';
	import CalendarVacationsPanel from './CalendarVacationsPanel.svelte';

	/**
	 * Плакат навчального року у форматі A4 альбомом.
	 *
	 * Усі дати й підписи виводяться з `ACADEMIC_YEARS` — у розмітці немає жодного
	 * числа. Перша редакція вписувала «з 27 жовтня», «Навчальний рік 2025-2026» і
	 * семестри текстом прямо сюди, тож плакат не міг показати інший рік.
	 *
	 * Рік, фон і його налаштування приходять одним `view` — тим самим, що лежить
	 * в адресі сторінки (`data/calendarView.ts`).
	 */
	interface Props {
		months: CalendarMonth[];
		view: CalendarView;
		locale?: Locale;
		selectedDate?: string | null;
		onSelectDay?: (day: CalendarDay) => void;
	}

	let { months, view, locale = 'uk', selectedDate = null, onSelectDay }: Props = $props();

	const isEn = $derived(locale === 'en');
	const year = $derived(ACADEMIC_YEARS[view.year]);
	const theme = $derived(getCalendarThemeById(view.bg));
	/** Шар поверх фону лишається в розмітці й без фільтра — прозорим. */
	const filterAlpha = $derived(view.filter === 'none' ? 0 : view.density / 100);

	const firstRowMonths = $derived(months.slice(0, 4));
	const remainingMonths = $derived(months.slice(4, 12));
	const previewMonth = $derived(months[12] ?? null);

	const MASKS: LocalImage = '/calendar/calendar-masks-logo.png';
	const masksSize = imageSize(MASKS);

	const SEMESTER_NAMES = [
		{ uk: '1-й семестр', en: '1st semester' },
		{ uk: '2-й семестр', en: '2nd semester' }
	];
</script>

<!--
	Шлях фону — без `asset()`, і це свідомо. Під prerender `asset()` віддає
	ВІДНОСНИЙ шлях, а `url()` у CSS-змінній браузер може розвʼязати від таблиці
	стилів, де змінну прочитано, а не від сторінки. Сайт живе в корені домену
	(`base = ''`), тож абсолютний шлях правильний завжди.
-->
<div class="poster-frame">
	<div
		class="calendar-poster"
		data-testid="calendar-poster-container"
		style:--poster-bg="url('{theme.bgUrl}')"
		style:--poster-blur="{view.blur}px"
		style:--calendar-weekday-bg={theme.weekdayBg}
		style:--calendar-weekday-text={theme.weekdayText}
	>
		<div class="poster-bg-layer" aria-hidden="true"></div>
		<div
			class="poster-overlay-layer"
			class:overlay-dark={view.filter === 'dark'}
			style:opacity={filterAlpha}
			aria-hidden="true"
		></div>

		<header class="poster-header" data-testid="calendar-poster-header">
			<div class="header-pill">
				<h2 class="header-title">{isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}</h2>
			</div>
			<div class="header-masks-wrap">
				<img
					src={asset(MASKS)}
					alt={isEn ? 'Theatrical masks' : 'Театральні маски'}
					class="header-masks"
					width={masksSize.width}
					height={masksSize.height}
				/>
			</div>
		</header>

		<div class="poster-grid" data-testid="calendar-poster-list">
			{#each firstRowMonths as m (m.year + '-' + m.month)}
				<div class="grid-slot">
					<CalendarMonthCard month={m} {locale} {selectedDate} {onSelectDay} />
				</div>
			{/each}

			<CalendarVacationsPanel {year} {locale} />

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
				<h3 class="year-card-title" data-testid="calendar-year-title">
					{academicYearLabel(view.year, locale)}
				</h3>
			</div>

			<div class="bottom-card semesters-card" data-testid="calendar-semesters-panel">
				{#each year.semesters as semester, i (i)}
					{@const name = SEMESTER_NAMES[i]}
					<p class="semester-line">
						<strong>{pick(name, locale)}</strong> — {rangeText(semester, locale)}
					</p>
				{/each}
			</div>
		</footer>
	</div>
</div>

<style>
	/*
	 * Контейнер — обгортка, а не сам плакат: контейнерний запит не стилізує
	 * елемент, що його задає, а на вузькому екрані плакат мусить позбутися
	 * пропорції A4. Доти з нею на телефоні тринадцять місяців стискалися в
	 * смужки заввишки кілька пікселів (заміряно знімком E2E на Pixel 7).
	 * `cqi` при цьому рахуються від тієї самої ширини, що й раніше.
	 */
	.poster-frame {
		container-type: inline-size;
		width: 100%;
		max-width: 1600px;
		margin: 0 auto;
	}

	.calendar-poster {
		position: relative;
		overflow: hidden;
		/*
		 * ОДНА палітра на всі контейнери плаката — шапку, місяці, канікули, підпис
		 * року й семестри. Доти темний варіант мали лише картки місяців, і в
		 * темній темі сайту темнішали тільки вони (скарга автора 2026-09-26).
		 * `light-dark()` іде за темою сайту: `global.css` ставить `color-scheme`
		 * кожній темі, як і для решти токенів.
		 */
		--poster-card-bg: light-dark(rgba(217, 217, 217, 0.77), rgba(26, 38, 62, 0.85));
		--poster-card-border: light-dark(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.16));
		--poster-text: light-dark(#000000, #ffffff);
		--poster-text-muted: light-dark(#a0a0a0, #6b7f9d);
		--poster-text-summer: light-dark(#4b5563, #b6c2d4);
		/* Типові значення; справжні ставить інлайновий стиль із сервісу вигляду. */
		--poster-bg: url('/calendar/calendar-bg-geometry.webp');
		--poster-blur: 4px;
		--calendar-weekday-bg: #1d4ed8;
		--calendar-weekday-text: #ffffff;

		width: 100%;
		aspect-ratio: 297 / 210;
		padding: clamp(14px, 2.8cqi, 48px);
		border-radius: clamp(24px, 3vw, 40px);
		border: 3px solid #141414;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: clamp(4px, 0.7cqi, 10px);
		box-sizing: border-box;
	}

	/*
	 * Розмите зображення — у ПСЕВДОЕЛЕМЕНТІ, а шар рівно з плакат.
	 *
	 * `blur()` робить край прозорим, тому зображення мусить виступати за плакат
	 * (той його й обрізає). Доки виступав сам шар, він був ширшим за екран
	 * телефона на 50 px, і `e2e/viewport-overflow.spec.ts` чесно називав його:
	 * гейт міряє ширину кожного ЕЛЕМЕНТА й обрізання не прощає — обрізаний текст
	 * і є той дефект, який він ловить. Прикраса ж елементом не є, як і значки
	 * днів у `::before` карток місяців.
	 */
	.poster-bg-layer {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.poster-bg-layer::before {
		content: '';
		position: absolute;
		inset: -24px;
		background: #8bc5ff var(--poster-bg) center / cover no-repeat;
		filter: blur(var(--poster-blur));
		transform: scale(1.06);
		will-change: filter;
	}

	.poster-overlay-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		background: #ffffff;
	}

	.poster-overlay-layer.overlay-dark {
		background: #000000;
	}

	.poster-header,
	.poster-grid,
	.poster-footer {
		position: relative;
		z-index: 1;
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
		background: var(--poster-card-bg);
		border: 1px solid var(--poster-card-border);
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
		color: var(--poster-text);
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

	.poster-footer {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}

	.bottom-card {
		background: var(--poster-card-bg);
		border: 1px solid var(--poster-card-border);
		border-radius: 28px;
		padding: 0.5rem 1.25rem;
		backdrop-filter: blur(12px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.year-card {
		align-items: center;
		text-align: center;
		padding: 0.4rem 0.75rem;
	}

	.year-card-title {
		margin: 0;
		font-size: clamp(1.2rem, 2.7cqi, 3.4rem);
		font-weight: 700;
		color: var(--poster-text);
		text-align: center;
		white-space: nowrap;
	}

	.semesters-card {
		justify-content: center;
		gap: 0.25rem;
		padding: 0.75rem 1.5rem;
	}

	.semester-line {
		margin: 0;
		font-size: clamp(0.85rem, 1.35cqi, 1.55rem);
		color: var(--poster-text);
		line-height: 1.35;
	}

	@container (max-width: 900px) {
		/* Висоту дає вміст: місяці стоять стовпчиком, а не в аркуші A4. */
		.calendar-poster {
			aspect-ratio: auto;
		}
		.poster-header,
		.poster-footer {
			grid-template-columns: 1fr;
		}
		.header-pill,
		.header-masks-wrap {
			grid-column: 1;
		}
		.header-masks-wrap {
			height: auto;
		}
		.header-masks {
			position: static;
			transform: none;
			max-height: 90px;
		}
		.poster-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-template-rows: none;
		}
		/* Картка місяця тягнеться на всю висоту клітинки — висоту дає пропорція. */
		.grid-slot {
			aspect-ratio: 1 / 1;
		}
	}

	@container (max-width: 520px) {
		.poster-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
