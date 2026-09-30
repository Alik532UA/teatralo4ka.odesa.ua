<script lang="ts">
	import { asset } from '$app/paths';
	import { getCalendarThemeById } from '$lib/config/calendarThemes';
	import { imageSize, type LocalImage } from '$lib/config/localImages';
	import type { CalendarView } from '$lib/data/calendarView';
	import type { Locale } from '$lib/i18n/routing';
	import { Crown, Gift, PartyPopper, Sparkle, Sparkles, Star } from 'lucide-svelte';
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
	 * Канонічні критерії:
	 * - Пропорції A4 альбомом (2500 x 1765);
	 * - Усі 4 таблиці однакової повної висоти (50.0cqi):
	 *   - Колонка 2 (1 урок, 10 рядків): рядки найвищі, без порожнечі знизу;
	 *   - Колонка 3 (2 уроки, 15 рядків): рядки середньої висоти;
	 *   - Колонка 4 (3 уроки, 17 рядків): компактні рядки;
	 *   - Колонка 1 (% — оцінка, 12 рядків): збалансована висота рядків;
	 * - Заголовки «1 урок / 2 уроки / 3 уроки на тиждень» однакової висоти (3.5cqi);
	 * - Підзаголовки стовпчиків однакової висоти (2.5cqi);
	 * - Текст «ТАБЛИЦІ РОЗРАХУНКІВ» та «для виставлення рейтингової оцінки» однакової ширини;
	 * - Відсотки (%) оформлені однаково в усіх таблицях без унікальних кружечків;
	 * - Усі елементи 100% поміщаються на аркуш без обрізання;
	 * - Підтримка тем і фонів через poster-bg-layer та poster-overlay-layer.
	 */
	interface Props {
		view: CalendarView;
		locale?: Locale;
	}

	let { view, locale = 'uk' }: Props = $props();

	const isEn = $derived(locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
	const isCelebration = $derived(view.tab === 'tables-30');
	const texts = $derived(GRADING_TEXTS[lang]);
	const weeklyCols = $derived([
		{ id: 'col-2', title: texts.weeklyTables.oneLesson, data: ONE_LESSON_WEEK_TABLE },
		{ id: 'col-3', title: texts.weeklyTables.twoLessons, data: TWO_LESSONS_WEEK_TABLE },
		{ id: 'col-4', title: texts.weeklyTables.threeLessons, data: THREE_LESSONS_WEEK_TABLE }
	] as const);

	const theme = $derived(getCalendarThemeById(view.bg));
	const filterAlpha = $derived(view.filter === 'none' ? 0 : view.density / 100);

	const MASKS: LocalImage = '/calendar/calendar-masks-logo.png';
	const masksSize = imageSize(MASKS);

	/**
	 * Вирівнює ширину верхнього й нижнього рядка заголовка плаката піксель-в-піксель.
	 */
	function syncHeaderWidths(node: HTMLElement) {
		const update = () => {
			const title = node.querySelector<HTMLElement>('.header-main-title');
			const sub = node.querySelector<HTMLElement>('.header-sub-title');
			if (!title || !sub) return;

			title.style.letterSpacing = '0px';
			sub.style.letterSpacing = '0px';

			const titleW = title.getBoundingClientRect().width;
			const subW = sub.getBoundingClientRect().width;
			const diff = subW - titleW;

			if (diff > 0.5 && titleW > 0) {
				const chars = (title.textContent ?? '').length;
				if (chars > 1) {
					title.style.letterSpacing = `${diff / (chars - 1)}px`;
				}
			} else if (diff < -0.5 && subW > 0) {
				const chars = (sub.textContent ?? '').length;
				if (chars > 1) {
					sub.style.letterSpacing = `${-diff / (chars - 1)}px`;
				}
			}
		};

		update();
		if (typeof document !== 'undefined' && document.fonts?.ready) {
			document.fonts.ready.then(update);
		}

		const ro = new ResizeObserver(() => update());
		ro.observe(node);

		return {
			update,
			destroy() {
				ro.disconnect();
			}
		};
	}
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

		<header
			class="header-pill"
			class:header-pill--celebration={isCelebration}
			data-testid="calendar-grading-header"
		>
			<div class="header-titles" use:syncHeaderWidths>
				<h1 class="header-main-title">{texts.mainTitle}</h1>
				<p class="header-sub-title">{texts.mainSubtitle}</p>
			</div>
		</header>

		<!-- 4 колонки таблиць однакової повної висоти -->
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

			{#each weeklyCols as col (col.id)}
				<section class="table-col {col.id}" aria-label={col.title}>
					<div class="capsule col-header weekly-header">
						<h2 class="col-title">{col.title}</h2>
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

					<div class="rows-stack {col.id}-stack">
						{#each col.data as row (row.missedLessons)}
							<div class="capsule row-capsule weekly-grid {col.id}-row">
								<span class="data-cell cell-left missed-text">
									{texts.formatMissedLessons(row.missedLessons)}
								</span>
								<span class="data-cell cell-mid percent-text">{row.percentage}%</span>
								<span class="data-cell cell-right grade-text">{row.grade}</span>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>

		<!-- Святкова ювілейна плашка «Нам 30 років!» зі святковими іконками по бордеру (тільки у вкладці «Таблиці 30») -->
		{#if isCelebration}
			<div class="anniversary-pill" data-testid="calendar-grading-anniversary-badge">
				<!-- Золоті та блакитні святкові іконки різних розмірів по периметру бордера -->
				<div class="border-icons-layer" aria-hidden="true">
					<span class="border-icon b-pos-1 sz-xl icon-gold"><PartyPopper /></span>
					<span class="border-icon b-pos-2 sz-md icon-cyan"><Sparkles /></span>
					<span class="border-icon b-pos-3 sz-lg icon-gold"><Crown /></span>
					<span class="border-icon b-pos-4 sz-sm icon-cyan"><Star /></span>
					<span class="border-icon b-pos-5 sz-sm icon-gold"><Sparkle /></span>
					<span class="border-icon b-pos-6 sz-lg icon-cyan"><Gift /></span>
					<span class="border-icon b-pos-7 sz-md icon-gold"><Sparkles /></span>
					<span class="border-icon b-pos-8 sz-xl icon-cyan"><PartyPopper /></span>
					<span class="border-icon b-pos-9 sz-md icon-gold"><Star /></span>
					<span class="border-icon b-pos-10 sz-lg icon-cyan"><Crown /></span>
					<span class="border-icon b-pos-11 sz-sm icon-gold"><Sparkle /></span>
					<span class="border-icon b-pos-12 sz-md icon-cyan"><Sparkles /></span>
				</div>

				<span class="anniversary-text">
					{#if isEn}
						We are 30 years old!
					{:else}
						Нам 30 років!
					{/if}
				</span>
			</div>
		{/if}
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
		padding: 2cqi 3cqi 2.2cqi 3cqi;
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
		top: 1.8cqi;
		left: 4.5cqi;
		width: 16.5cqi;
		height: 8.8cqi;
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

	/* Плашка головного заголовка у правому верхньому кутку */
	.header-pill {
		position: absolute;
		top: 1.6cqi;
		right: 3cqi;
		width: 30cqi;
		height: 5.6cqi;
		z-index: 2;
		background: rgba(35, 37, 40, 0.82);
		border: 1.5px solid rgba(255, 255, 255, 0.15);
		border-radius: clamp(16px, 1.8cqi, 40px);
		padding: 0.3cqi 1.2cqi;
		backdrop-filter: blur(14px);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
		pointer-events: none;
	}

	.header-titles {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.header-main-title {
		margin: 0;
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		font-size: 1.95cqi;
		font-weight: 800;
		line-height: 1.15;
		text-transform: uppercase;
		color: #ffffff;
		white-space: nowrap;
		display: block;
	}

	.header-sub-title {
		margin: 0.35cqi 0 0;
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		font-size: 1.05cqi;
		font-weight: 600;
		line-height: 1.15;
		color: rgba(255, 255, 255, 0.95);
		white-space: nowrap;
		display: block;
	}

	/* Святкове оформлення плашки заголовка для вкладки «Таблиці 30» */
	.header-pill--celebration {
		background:
			linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%) padding-box,
			linear-gradient(135deg, #ffd700 0%, #f59e0b 25%, #ffffff 50%, #0284c7 75%, #ffd700 100%) border-box;
		border: clamp(2.5px, 0.28cqi, 6px) solid transparent;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.8),
			0 0 24px rgba(2, 132, 199, 0.3),
			0 8px 24px rgba(11, 37, 69, 0.22);
	}

	.header-pill--celebration .header-main-title {
		color: #0b2545;
		text-shadow: 0 1px 1px rgba(255, 255, 255, 0.85);
		filter: drop-shadow(0 1px 3px rgba(11, 37, 69, 0.18));
	}

	.header-pill--celebration .header-sub-title {
		color: #1a365d;
		text-shadow: 0 1px 1px rgba(255, 255, 255, 0.85);
	}

	/* Святкова ювілейна плашка «Нам 30 років!» (світло-блакитний фон, темно-синій текст, святковий бордер) */
	.anniversary-pill {
		position: absolute;
		bottom: 1.8cqi;
		left: 49.5%;
		transform: translateX(-50%);
		z-index: 2;
		background:
			linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%) padding-box,
			linear-gradient(135deg, #ffd700 0%, #f59e0b 25%, #ffffff 50%, #0284c7 75%, #ffd700 100%) border-box;
		border: clamp(3px, 0.35cqi, 7px) solid transparent;
		border-radius: clamp(24px, 3cqi, 64px);
		padding: 0.55cqi 3.2cqi;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.8),
			0 0 24px rgba(2, 132, 199, 0.3),
			0 8px 24px rgba(11, 37, 69, 0.22);
		pointer-events: none;
	}

	/* Шар святкових іконок по всьому бордеру плашки */
	.border-icons-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.border-icon {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.border-icon :global(svg) {
		width: 100%;
		height: 100%;
		stroke-width: 2.2;
	}

	.icon-gold {
		color: #e5a100;
		filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.85)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
	}

	.icon-cyan {
		color: #0284c7;
		filter: drop-shadow(0 0 6px rgba(2, 132, 199, 0.85)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
	}

	/* Різні розміри святкових іконок */
	.sz-sm { width: 1.3cqi; height: 1.3cqi; }
	.sz-md { width: 1.8cqi; height: 1.8cqi; }
	.sz-lg { width: 2.3cqi; height: 2.3cqi; }
	.sz-xl { width: 2.6cqi; height: 2.6cqi; }

	/* Розподіл іконок по периметру золотистого бордера */
	.b-pos-1 { left: -1.3cqi; top: 48%; transform: translateY(-50%) rotate(-25deg); }
	.b-pos-2 { left: 2%; top: -0.9cqi; transform: rotate(-15deg); }
	.b-pos-3 { left: 16%; top: -1.3cqi; transform: rotate(-8deg); }
	.b-pos-4 { left: 34%; top: -0.9cqi; transform: rotate(12deg); }
	.b-pos-5 { right: 34%; top: -0.8cqi; transform: rotate(-10deg); }
	.b-pos-6 { right: 16%; top: -1.2cqi; transform: rotate(15deg); }
	.b-pos-7 { right: 2%; top: -0.9cqi; transform: rotate(20deg); }
	.b-pos-8 { right: -1.3cqi; top: 48%; transform: translateY(-50%) scaleX(-1) rotate(-25deg); }
	.b-pos-9 { right: 3%; bottom: -0.9cqi; transform: rotate(18deg); }
	.b-pos-10 { right: 22%; bottom: -1.1cqi; transform: rotate(-12deg); }
	.b-pos-11 { left: 22%; bottom: -1.0cqi; transform: rotate(15deg); }
	.b-pos-12 { left: 3%; bottom: -0.9cqi; transform: rotate(-15deg); }

	.anniversary-text {
		margin: 0;
		font-family: 'Montserrat', var(--font-heading), sans-serif;
		font-size: 4.35cqi;
		font-weight: 900;
		line-height: 1.1;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
		color: #0b2545;
		text-shadow: 0 1px 1px rgba(255, 255, 255, 0.85);
		filter: drop-shadow(0 2px 4px rgba(11, 37, 69, 0.18));
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

	/*
	 * Кожна таблиця має фіксовану висоту (49.0cqi), завдяки чому всі таблиці
	 * однакової висоти незалежно від кількості рядків:
	 * заголовок (3.5cqi) + підзаголовок (2.6cqi) + стеки рядків (42.2cqi) + відступи = 49.0cqi.
	 */
	.table-col {
		display: flex;
		flex-direction: column;
		min-width: 0;
		box-sizing: border-box;
	}

	/* Східчасті початкові відступи колонок зверху: рівні кроки між таблицями (по 5.4cqi), щільний відступ під плашкою */
	.col-1 {
		padding-top: 12.8cqi;
	}

	.col-2 {
		padding-top: 2.0cqi;
	}

	.col-3 {
		padding-top: 7.4cqi;
	}

	.col-4 {
		padding-top: 12.8cqi;
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

	/* Заголовки таблиць однакової висоти (3.5cqi) */
	.col-header {
		flex-shrink: 0;
		height: 3.5cqi;
		margin-bottom: 0.35cqi;
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
		font-size: 1.25cqi;
		line-height: 1.15;
	}

	/* Підзаголовки стовпчиків однакової висоти (2.6cqi) */
	.subheader-capsule {
		flex-shrink: 0;
		height: 2.6cqi;
		margin-bottom: 0.35cqi;
		padding: 0.1cqi 0.3cqi;
		box-sizing: border-box;
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
		line-height: 1.08;
	}

	.ratio-percent-sub {
		font-size: 1.42cqi;
		font-weight: 700;
	}

	.ratio-grade-sub {
		font-size: 0.74cqi;
		font-weight: 600;
		line-height: 1.08;
	}

	.weekly-sub {
		font-size: 0.72cqi;
		font-weight: 600;
		line-height: 1.08;
	}

	/*
	 * Стек рядків даних: фіксована висота (42.7cqi) однакова для всіх 4 таблиць.
	 * Використовуємо CSS Grid з gap для кожного стовпчика, щоб:
	 * 1) Між рядками завжди був видимий відступ (gap);
	 * 2) Сумарна висота таблиць була гарантовано однаковою;
	 * 3) Рядки не злипалися.
	 */
	.rows-stack {
		height: 42.2cqi;
	}

	.col-1 .rows-stack {
		display: grid;
		grid-template-rows: repeat(12, 1fr);
		gap: 0.40cqi;
	}

	.col-2 .rows-stack {
		display: grid;
		grid-template-rows: repeat(10, 1fr);
		gap: 0.45cqi;
	}

	.col-3 .rows-stack {
		display: grid;
		grid-template-rows: repeat(15, 1fr);
		gap: 0.35cqi;
	}

	.col-4 .rows-stack {
		display: grid;
		grid-template-rows: repeat(17, 1fr);
		gap: 0.30cqi;
	}

	.row-capsule {
		min-height: 0;
		height: 100%;
		padding: 0 0.3cqi;
	}

	/* Розподіл колонок усередині рядків за Figma: 66% : 34% */
	.ratio-grid {
		display: grid;
		grid-template-columns: 66% 34%;
		width: 100%;
		align-items: center;
	}

	.weekly-grid {
		display: grid;
		grid-template-columns: 1.3fr 1.25fr 1fr;
		width: 100%;
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
		padding: 0 2px;
		box-sizing: border-box;
		line-height: 1.1;
		min-height: 0;
	}

	.cell-left,
	.cell-mid {
		border-right: 2px solid #000000;
	}

	/* Типографіка даних у клітинках */
	.range-text {
		font-size: 1.45cqi;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.missed-text {
		font-size: 1.15cqi;
		font-weight: 600;
	}

	.col-2 .missed-text {
		font-size: 1.35cqi;
	}

	.col-4 .missed-text {
		font-size: 1.05cqi;
	}

	.percent-text {
		font-size: 1.45cqi;
		font-weight: 700;
	}

	.col-2 .percent-text {
		font-size: 1.75cqi;
	}

	.col-4 .percent-text {
		font-size: 1.22cqi;
	}

	.grade-text {
		font-size: 1.75cqi;
		font-weight: 700;
	}

	.col-2 .grade-text {
		font-size: 2.1cqi;
	}

	.col-4 .grade-text {
		font-size: 1.45cqi;
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
			height: auto !important;
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

		.anniversary-pill {
			position: static;
			width: fit-content;
			margin: 1rem auto 0.5rem;
			transform: none;
			padding: 0.65rem 2rem;
			border-radius: 32px;
		}

		.border-icons-layer {
			display: none;
		}

		.anniversary-text {
			font-size: 1.55rem;
		}
	}
</style>
