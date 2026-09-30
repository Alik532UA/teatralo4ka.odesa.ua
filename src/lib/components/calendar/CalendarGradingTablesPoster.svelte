<script lang="ts">
	import { asset } from '$app/paths';
	import { getCalendarThemeById } from '$lib/config/calendarThemes';
	import { imageSize, type LocalImage } from '$lib/config/localImages';
	import type { CalendarView } from '$lib/data/calendarView';
	import type { Locale } from '$lib/i18n/routing';
	import {
		GRADING_TEXTS,
		ONE_LESSON_WEEK_TABLE,
		PERCENTAGE_GRADE_TABLE,
		THREE_LESSONS_WEEK_TABLE,
		TWO_LESSONS_WEEK_TABLE
	} from '$lib/data/gradingTables';

	/**
	 * Плакат розрахунків для виставлення рейтингової оцінки.
	 *
	 * Точна геометрія з референсу Figma (.private/notes/notes-2026-09-30.txt):
	 * - Полотно A4 альбомом (2500 x 1765, aspect-ratio: 2500 / 1765);
	 * - Підтримка тем і фонів через poster-bg-layer та poster-overlay-layer як у CalendarPoster;
	 * - Маски ліворуч над 1-ю колонкою;
	 * - Велика темна плашка заголовка праворуч над 3-ю та 4-ю колонками;
	 * - Східчасте розташування (жоден рядок не обрізається, 17-й рядок 4-ї колонки 100% видно):
	 *   - Колонка 2 (1 урок): починається найвище (top: 0), закінчується вище низу (10 рядків);
	 *   - Колонка 3 (2 уроки): починається під плашкою (top: 6.0cqi), 15 рядків вміщуються повністю;
	 *   - Колонка 4 (3 уроки): починається нижче за 3-ю (top: 7.8cqi), усі 17 рядків вміщуються повністю;
	 *   - Колонка 1 (% — оцінка): починається під масками (top: 9.5cqi), усі 12 рядків вміщуються повністю.
	 */
	interface Props {
		view: CalendarView;
		locale?: Locale;
	}

	let { view, locale = 'uk' }: Props = $props();

	const isEn = $derived(locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
	const texts = $derived(GRADING_TEXTS[lang]);

	const theme = $derived(getCalendarThemeById(view.bg));
	const filterAlpha = $derived(view.filter === 'none' ? 0 : view.density / 100);

	const MASKS: LocalImage = '/calendar/calendar-masks-logo.png';
	const masksSize = imageSize(MASKS);
</script>

<div class="poster-frame">
	<div
		class="grading-poster"
		data-testid="calendar-grading-poster-container"
		style:--poster-bg="url('{theme.bgUrl}')"
		style:--poster-blur="{view.blur}px"
	>
		<!-- Шар фону теми з підтримкою фільтрів та розмиття -->
		<div class="poster-bg-layer" aria-hidden="true"></div>
		<div
			class="poster-overlay-layer"
			class:overlay-dark={view.filter === 'dark'}
			style:opacity={filterAlpha}
			aria-hidden="true"
		></div>

		<!-- Верхній шар: маски над 1-ю колонкою та плашка заголовка праворуч -->
		<div class="masks-slot" data-testid="calendar-grading-masks-img">
			<img
				src={asset(MASKS)}
				alt={isEn ? 'Theatrical masks' : 'Театральні маски'}
				class="masks-img"
				width={masksSize.width}
				height={masksSize.height}
			/>
		</div>

		<header class="header-pill" data-testid="calendar-grading-header">
			<h1 class="header-main-title">{texts.mainTitle}</h1>
			<p class="header-sub-title">{texts.mainSubtitle}</p>
		</header>

		<!-- 4 колонки таблиць -->
		<div class="columns-grid" data-testid="calendar-grading-tables-list">
			<!-- Колонка 1: Таблиця співвідношення % — оцінка (12 рядків) -->
			<section class="table-col col-1" aria-label={texts.ratioTableTitle}>
				<div class="capsule col-header ratio-header">
					<h2 class="col-title ratio-title">
						{#if isEn}
							Percentage ratio<br />% — grade
						{:else}
							Таблиця співвідношення<br />% — оцінка
						{/if}
					</h2>
				</div>

				<div class="capsule subheader-capsule ratio-grid">
					<span class="sub-cell cell-left ratio-percent-sub">{texts.ratioColPercentage}</span>
					<span class="sub-cell cell-right ratio-grade-sub">
						{#if isEn}
							corresponding<br />grade
						{:else}
							відповідна<br />оцінка
						{/if}
					</span>
				</div>

				<div class="rows-stack col-1-stack">
					{#each PERCENTAGE_GRADE_TABLE as row (row.percentageRange)}
						<div class="capsule row-capsule ratio-grid col-1-row">
							<span class="data-cell cell-left range-text">{row.percentageRange}</span>
							<span class="data-cell cell-right grade-text">{row.grade}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- Колонка 2: 1 урок на тиждень (10 рядків, починається з самого верху) -->
			<section class="table-col col-2" aria-label={texts.weeklyTables.oneLesson}>
				<div class="capsule col-header weekly-header">
					<h2 class="col-title">{texts.weeklyTables.oneLesson}</h2>
				</div>

				<div class="capsule subheader-capsule weekly-grid">
					<span class="sub-cell cell-left weekly-sub">
						{#if isEn}
							missed<br />lessons
						{:else}
							кількість пропущених<br />уроків
						{/if}
					</span>
					<span class="sub-cell cell-mid weekly-sub">
						{#if isEn}
							rating<br />percentage (%)
						{:else}
							рейтинговий<br />відсоток (%)
						{/if}
					</span>
					<span class="sub-cell cell-right weekly-sub">
						{#if isEn}
							semester<br />grade
						{:else}
							семестрова<br />оцінка
						{/if}
					</span>
				</div>

				<div class="rows-stack col-2-stack">
					{#each ONE_LESSON_WEEK_TABLE as row (row.missedLessons)}
						<div class="capsule row-capsule weekly-grid col-2-row">
							<span class="data-cell cell-left missed-text">
								{texts.formatMissedLessons(row.missedLessons)}
							</span>
							<span class="data-cell cell-mid percent-cell">
								<span class="bordered-percent-pill">{row.percentage}%</span>
							</span>
							<span class="data-cell cell-right grade-text">{row.grade}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- Колонка 3: 2 уроки на тиждень (15 рядків, починається на 6.0cqi) -->
			<section class="table-col col-3" aria-label={texts.weeklyTables.twoLessons}>
				<div class="capsule col-header weekly-header">
					<h2 class="col-title">{texts.weeklyTables.twoLessons}</h2>
				</div>

				<div class="capsule subheader-capsule weekly-grid">
					<span class="sub-cell cell-left weekly-sub">
						{#if isEn}
							missed<br />lessons
						{:else}
							кількість пропущених<br />уроків
						{/if}
					</span>
					<span class="sub-cell cell-mid weekly-sub">
						{#if isEn}
							rating<br />percentage (%)
						{:else}
							рейтинговий<br />відсоток (%)
						{/if}
					</span>
					<span class="sub-cell cell-right weekly-sub">
						{#if isEn}
							semester<br />grade
						{:else}
							семестрова<br />оцінка
						{/if}
					</span>
				</div>

				<div class="rows-stack col-3-stack">
					{#each TWO_LESSONS_WEEK_TABLE as row (row.missedLessons)}
						<div class="capsule row-capsule weekly-grid col-3-row">
							<span class="data-cell cell-left missed-text">
								{texts.formatMissedLessons(row.missedLessons)}
							</span>
							<span class="data-cell cell-mid percent-text">{row.percentage}%</span>
							<span class="data-cell cell-right grade-text">{row.grade}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- Колонка 4: 3 уроки на тиждень (17 рядків, починається на 7.8cqi, всі 17 рядків 100% видно) -->
			<section class="table-col col-4" aria-label={texts.weeklyTables.threeLessons}>
				<div class="capsule col-header weekly-header">
					<h2 class="col-title">{texts.weeklyTables.threeLessons}</h2>
				</div>

				<div class="capsule subheader-capsule weekly-grid">
					<span class="sub-cell cell-left weekly-sub">
						{#if isEn}
							missed<br />lessons
						{:else}
							кількість пропущених<br />уроків
						{/if}
					</span>
					<span class="sub-cell cell-mid weekly-sub">
						{#if isEn}
							rating<br />percentage (%)
						{:else}
							рейтинговий<br />відсоток (%)
						{/if}
					</span>
					<span class="sub-cell cell-right weekly-sub">
						{#if isEn}
							semester<br />grade
						{:else}
							семестрова<br />оцінка
						{/if}
					</span>
				</div>

				<div class="rows-stack col-4-stack">
					{#each THREE_LESSONS_WEEK_TABLE as row (row.missedLessons)}
						<div class="capsule row-capsule weekly-grid col-4-row">
							<span class="data-cell cell-left missed-text">
								{texts.formatMissedLessons(row.missedLessons)}
							</span>
							<span class="data-cell cell-mid percent-text">{row.percentage}%</span>
							<span class="data-cell cell-right grade-text">{row.grade}</span>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.poster-frame {
		container-type: inline-size;
		width: 100%;
		max-width: 1600px;
		margin: 0 auto;
	}

	/* Плакат A4 альбомом: 2500 x 1765 (співвідношення 1.416) */
	.grading-poster {
		--poster-bg: url('/calendar/calendar-bg-geometry.webp');
		--poster-blur: 4px;

		position: relative;
		overflow: hidden;
		width: 100%;
		aspect-ratio: 2500 / 1765;
		border-radius: clamp(24px, 3vw, 40px);
		border: 3px solid #141414;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
		padding: 2cqi 3.2cqi 2.2cqi 3.2cqi;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	/* Фонові шари теми */
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

	/* Маски у лівому верхньому кутку над Колонкою 1 */
	.masks-slot {
		position: absolute;
		top: 2.2cqi;
		left: 4.8cqi;
		width: 16.5cqi;
		height: 8.5cqi;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.masks-img {
		max-width: 95%;
		max-height: 100%;
		width: auto;
		height: auto;
		object-fit: contain;
		filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.25));
	}

	/* Плашка головного заголовка у правому верхньому кутку над Колонками 3 і 4 */
	.header-pill {
		position: absolute;
		top: 1.8cqi;
		right: 3.2cqi;
		width: 32.5cqi;
		height: 5.8cqi;
		z-index: 2;
		background: rgba(35, 37, 40, 0.78);
		border: 1.5px solid rgba(255, 255, 255, 0.15);
		border-radius: 9999px;
		padding: 0.3cqi 1.8cqi;
		backdrop-filter: blur(14px);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
		pointer-events: none;
	}

	.header-main-title {
		margin: 0;
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		font-size: 2.05cqi;
		font-weight: 800;
		line-height: 1.12;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: #ffffff;
	}

	.header-sub-title {
		margin: 0.15cqi 0 0;
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		font-size: 0.92cqi;
		font-weight: 600;
		line-height: 1.12;
		color: rgba(255, 255, 255, 0.92);
	}

	/* Сітка 4-х колонок на весь розмір аркуша */
	.columns-grid {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2.2cqi;
		align-items: flex-start;
	}

	.table-col {
		display: flex;
		flex-direction: column;
		min-width: 0;
		box-sizing: border-box;
	}

	/* Точні початкові відступи колонок зверху за Figma (без обрізання знизу) */
	.col-1 {
		padding-top: 9.5cqi;
	}

	.col-2 {
		padding-top: 0;
	}

	.col-3 {
		padding-top: 6.0cqi;
	}

	.col-4 {
		padding-top: 7.8cqi;
	}

	/* Спільний стиль заокруглених білих плашок-капсул */
	.capsule {
		background: #eef1f5;
		color: #000000;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
		transition: background var(--transition-fast, 0.15s ease);
	}

	.capsule:hover {
		background: #ffffff;
	}

	/* Заголовки таблиць */
	.col-header {
		flex-shrink: 0;
		margin-bottom: 0.35cqi;
	}

	.ratio-header {
		height: 4.2cqi;
		padding: 0.2cqi 0.6cqi;
	}

	.weekly-header {
		height: 3.5cqi;
		padding: 0.2cqi 0.6cqi;
	}

	.col-title {
		margin: 0;
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		font-size: 1.48cqi;
		font-weight: 700;
		line-height: 1.15;
		color: #000000;
		text-align: center;
	}

	.ratio-title {
		font-size: 1.22cqi;
		line-height: 1.18;
	}

	/* Підзаголовки стовпчиків */
	.subheader-capsule {
		flex-shrink: 0;
		height: 2.4cqi;
		margin-bottom: 0.35cqi;
		padding: 0.1cqi 0.3cqi;
	}

	.sub-cell {
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		color: #000000;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0 2px;
		box-sizing: border-box;
	}

	.ratio-percent-sub {
		font-size: 1.45cqi;
		font-weight: 700;
	}

	.ratio-grade-sub {
		font-size: 0.75cqi;
		font-weight: 600;
		line-height: 1.1;
	}

	.weekly-sub {
		font-size: 0.72cqi;
		font-weight: 600;
		line-height: 1.12;
	}

	/* Стек рядків даних з точними висотами, щоб усе поміщалося на аркуш */
	.rows-stack {
		display: flex;
		flex-direction: column;
	}

	.col-1-stack {
		gap: 0.32cqi;
	}

	.col-2-stack {
		gap: 0.35cqi;
	}

	.col-3-stack {
		gap: 0.26cqi;
	}

	.col-4-stack {
		gap: 0.18cqi;
	}

	/* Висоти рядків: підібрані так, що всі рядки поміщаються повністю без обрізання */
	.col-1-row {
		height: 3.4cqi;
		padding: 0.1cqi 0.3cqi;
	}

	.col-2-row {
		height: 3.8cqi;
		padding: 0.1cqi 0.3cqi;
	}

	.col-3-row {
		height: 2.5cqi;
		padding: 0.06cqi 0.3cqi;
	}

	.col-4-row {
		height: 2.08cqi;
		padding: 0.04cqi 0.3cqi;
	}

	/* Розподіл колонок усередині рядків за Figma: 66% : 34% */
	.ratio-grid {
		display: grid;
		grid-template-columns: 66% 34%;
		width: 100%;
		height: 100%;
		align-items: center;
	}

	.weekly-grid {
		display: grid;
		grid-template-columns: 1.3fr 1.25fr 1fr;
		width: 100%;
		height: 100%;
		align-items: center;
	}

	/* Клітинки та вертикальні розділювачі */
	.data-cell {
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		color: #000000;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		height: 100%;
		padding: 0 3px;
		box-sizing: border-box;
	}

	.cell-left,
	.cell-mid {
		border-right: 2px solid #000000;
	}

	/* Типографіка даних у клітинках у відносних одиницях cqi (масштабується ідеально) */
	.range-text {
		font-size: 1.75cqi;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.missed-text {
		font-size: 1.22cqi;
		font-weight: 600;
	}

	.col-2 .missed-text {
		font-size: 1.35cqi;
	}

	.percent-text {
		font-size: 1.62cqi;
		font-weight: 700;
	}

	.col-4 .percent-text {
		font-size: 1.48cqi;
	}

	.grade-text {
		font-size: 1.95cqi;
		font-weight: 700;
	}

	.col-4 .grade-text {
		font-size: 1.68cqi;
	}

	/* Обведена плашка відсотка у 2-й колонці («1 урок на тиждень») */
	.percent-cell {
		padding: 0.12cqi 0.4cqi;
	}

	.bordered-percent-pill {
		border: 2px solid #000000;
		border-radius: 9999px;
		padding: 0.1cqi 0.7cqi;
		font-size: 2.05cqi;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	/* ===== Мобільні пристрої та вузькі екрани ===== */
	@container (max-width: 900px) {
		.grading-poster {
			aspect-ratio: auto;
			padding: 1.25rem 0.75rem;
			border-radius: 24px;
			gap: 1.5rem;
		}

		.masks-slot {
			position: static;
			width: 100%;
			height: auto;
			margin-bottom: 0.5rem;
		}

		.masks-img {
			width: 130px;
			max-width: 130px;
		}

		.header-pill {
			position: static;
			width: 100%;
			height: auto;
			border-radius: 24px;
			padding: 0.9rem 1.25rem;
			margin-bottom: 1rem;
		}

		.header-main-title {
			font-size: 1.35rem;
		}

		.header-sub-title {
			font-size: 0.85rem;
		}

		.columns-grid {
			display: flex;
			flex-direction: column;
			gap: 1.75rem;
		}

		.table-col {
			padding: 0 !important;
			height: auto !important;
		}

		.col-header {
			height: auto;
			padding: 0.75rem;
			margin-bottom: 0.5rem;
		}

		.col-title {
			font-size: 1.15rem;
		}

		.subheader-capsule {
			height: auto;
			padding: 0.5rem 0.25rem;
			margin-bottom: 0.5rem;
		}

		.sub-cell {
			font-size: 0.72rem;
		}

		.rows-stack {
			gap: 0.45rem;
		}

		.col-1-row,
		.col-2-row,
		.col-3-row,
		.col-4-row {
			height: auto;
			min-height: 44px;
			padding: 0.35rem 0.25rem;
		}

		.range-text {
			font-size: 1.15rem;
		}

		.missed-text {
			font-size: 0.92rem;
		}

		.percent-text {
			font-size: 1.05rem;
		}

		.grade-text {
			font-size: 1.3rem;
		}

		.bordered-percent-pill {
			padding: 2px 10px;
			font-size: 1.05rem;
		}
	}
</style>
