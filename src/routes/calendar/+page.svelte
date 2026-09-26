<script lang="ts">
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { Expand, Shrink } from 'lucide-svelte';
	import { ACADEMIC_YEAR_IDS, type AcademicYearId } from '$lib/data/academicYears';
	import { buildAcademicCalendar } from '$lib/data/academicCalendar';
	import { yearRangeLabel } from '$lib/data/calendarText';
	import {
		DEFAULT_VIEW,
		calendarHref,
		parseCalendarView,
		type CalendarView
	} from '$lib/data/calendarView';
	import type { Locale } from '$lib/i18n/routing';
	import { fullscreen } from '$lib/services/fullscreen.svelte';
	import CalendarPoster from '$lib/components/calendar/CalendarPoster.svelte';
	import CalendarDayCard from '$lib/components/calendar/CalendarDayCard.svelte';
	import CalendarThemePicker from '$lib/components/calendar/CalendarThemePicker.svelte';

	const lang = $derived<Locale>($locale === 'en' ? 'en' : 'uk');
	const isEn = $derived(lang === 'en');

	/*
	 * ВИГЛЯД СТОРІНКИ — з адреси, і лише після гідрації.
	 *
	 * Під prerender параметрів немає (SvelteKit і читати їх не дає), тож HTML
	 * завжди містить типовий вигляд: останній рік на типовому фоні. Якби стан
	 * читався з адреси вже на першому клієнтському рендері, розмітка розійшлася б
	 * із prerender-ною — тринадцять карток місяців іншого року. Тому спершу той
	 * самий типовий вигляд, а після монтування — адреса.
	 *
	 * Далі стан живе тут, а адреса лише ЗАПИСУЄТЬСЯ — `replaceState` без нового
	 * запису в історії: повзунок розмиття дав би їх сотню за один рух, а «назад»
	 * має вести зі сторінки, а не по її налаштуваннях. `page.url` після такого
	 * запису не міняється (так працює shallow routing), тому читається лише раз.
	 */
	let view = $state<CalendarView>({ ...DEFAULT_VIEW });

	onMount(() => {
		const fromUrl = parseCalendarView(page.url.searchParams);
		// Без параметрів вигляд той самий — не перебудовувати тринадцять місяців даремно.
		if (JSON.stringify(fromUrl) !== JSON.stringify(view)) view = fromUrl;
	});

	function update(patch: Partial<CalendarView>) {
		view = { ...view, ...patch };
		// Чужі параметри (`?debug=1`, мітки реклами) лишаються як були.
		const foreign = new URLSearchParams(window.location.search);
		replaceState(calendarHref(view, lang, foreign), page.state);
	}

	/** Посилання року: звичайний клік міняє плакат на місці, решта — як у посилання. */
	function selectYear(event: MouseEvent, year: AcademicYearId) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		update({ year });
	}

	const months = $derived(buildAcademicCalendar(view.year));

	/*
	 * Вибраний день зберігається ДАТОЮ, а сам день виводиться з плаката: після
	 * зміни року обʼєкт дня з попереднього плаката лишався б відкритим поверх
	 * нового. Дата, якої на новому плакаті немає, просто закриває картку.
	 */
	let selectedDate = $state<string | null>(null);
	const selectedDay = $derived(
		months.flatMap((m) => m.days).find((d) => d.isCurrentMonth && d.date === selectedDate) ?? null
	);

	/*
	 * Повний екран — через спільний сервіс, а не голий `requestFullscreen()`.
	 *
	 * Перша редакція писала його в шапці сайту вдруге: на iPhone такого методу в
	 * елемента немає, і кнопка кидала виняток; слухачів `fullscreenchange` було
	 * два — у шапці й тут. Сервіс уміє підробку для iPhone і для відмови
	 * браузера, а кнопки стоять на самій сторінці: підробка ховає шапку, і кнопка
	 * виходу в шапці зникла б разом із нею (`global.css`, розділ про запасний
	 * повний екран).
	 */
	$effect(() => {
		const stopWatching = fullscreen.watch();
		return () => {
			stopWatching();
			// Сторінку покидають у повному екрані лише жестом «назад» — не лишаємо
			// в ньому наступну: підробка сховала б там шапку.
			if (fullscreen.active) fullscreen.toggle();
			document.body.classList.remove('calendar-fullscreen');
		};
	});

	$effect(() => {
		document.body.classList.toggle('calendar-fullscreen', fullscreen.active);
	});

	/*
	 * Кнопки «на весь екран» і «згорнути» — дві різні: натиснута зникає разом зі
	 * станом, і фокус падав би на початок сторінки. Передаємо його парі, але
	 * лише коли він справді загубився — не при першому показі сторінки.
	 */
	let fullscreenButton = $state<HTMLButtonElement | null>(null);
	let lastFullscreen = false;
	$effect(() => {
		const active = fullscreen.active;
		const button = fullscreenButton;
		if (active === lastFullscreen) return;
		lastFullscreen = active;
		if (button && (!document.activeElement || document.activeElement === document.body)) {
			button.focus();
		}
	});
</script>

<section class="calendar-page" data-testid="calendar-page-section">
	<!-- Видимого заголовка над плакатом немає на прохання автора (2026-09-26): назву
	     школи й рік каже сам плакат. Прихований `h1` лишається для читалки й пошуку. -->
	<h1 class="sr-only">{isEn ? 'Academic calendar' : 'Навчальний календар'}</h1>

	<!--
		Керування ПРАВОРУЧ від плаката, а на вузькому екрані — над ним. У розмітці
		воно ПЕРШЕ, а праворуч його ставить `row-reverse`: так з клавіатури людина
		спершу дістає вибір року, а вже потім 13 місяців, і порядок цей не
		перевертається на телефоні.
	-->
	<div class="calendar-page-content">
		<div class="calendar-controls" data-testid="calendar-controls-toolbar">
			<!-- Палітра ЛІВОРУЧ від кнопки повного екрана, обидві НАД роками (прохання
			     автора 2026-09-26). У повному екрані блок стоїть у правому верхньому
			     куті, роки ховаються, а палітра стає ПІД кнопкою «згорнути». -->
			<div class="calendar-controls__row">
				<CalendarThemePicker
					{view}
					locale={lang}
					compact={fullscreen.active}
					onChange={update}
				/>
				{#if fullscreen.active}
					<button
						type="button"
						class="calendar-controls__btn"
						bind:this={fullscreenButton}
						onclick={() => fullscreen.toggle()}
						aria-label={isEn ? 'Exit fullscreen' : 'Згорнути'}
						title={isEn ? 'Exit fullscreen' : 'Згорнути'}
						data-testid="calendar-fullscreen-exit-btn"
					>
						<Shrink size={22} aria-hidden="true" />
					</button>
				{:else}
					<button
						type="button"
						class="calendar-controls__btn"
						bind:this={fullscreenButton}
						onclick={() => fullscreen.toggle()}
						aria-label={isEn ? 'Fullscreen' : 'На весь екран'}
						title={isEn ? 'Fullscreen' : 'На весь екран'}
						data-testid="calendar-fullscreen-btn"
					>
						<Expand size={22} aria-hidden="true" />
					</button>
				{/if}
			</div>

			<!-- Список, а не посилання підряд: так читалка каже «3 пункти», а посилання
			     не стоїть «у реченні» з сусідами (`e2e/link-affordance.spec.ts`). -->
			<nav aria-label={isEn ? 'Academic year' : 'Навчальний рік'} data-testid="calendar-years-nav">
				<ul class="calendar-years">
					{#each ACADEMIC_YEAR_IDS as id (id)}
						<li>
							<a
								href={calendarHref({ ...view, year: id }, lang)}
								class="calendar-years__link"
								class:calendar-years__link--active={id === view.year}
								aria-current={id === view.year ? 'page' : undefined}
								onclick={(event) => selectYear(event, id)}
								data-testid="calendar-year-{id}-link"
							>
								{yearRangeLabel(id)}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>

		<div class="calendar-poster-slot">
			<CalendarPoster
				{months}
				{view}
				locale={lang}
				{selectedDate}
				onSelectDay={(day) => (selectedDate = day.date)}
			/>
		</div>
	</div>

	<CalendarDayCard day={selectedDay} locale={lang} onClose={() => (selectedDate = null)} />

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

	/*
	 * Праворуч від плаката — стовпчиком: роки один під одним, під ними кнопка
	 * повного екрана. `sticky`, бо плакат вищий за екран ноутбука, і без цього
	 * перемикач виїжджав угору, щойно догортали до весняних місяців.
	 */
	.calendar-controls {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		position: sticky;
		top: calc(var(--header-height, 72px) + 1rem);
		z-index: calc(var(--z-footer) + 1);
	}

	.calendar-controls__row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.calendar-poster-slot {
		flex: 1 1 auto;
		min-width: 0;
	}

	.calendar-years {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 4px;
		margin: 0;
		padding: 4px;
		list-style: none;
		background: var(--bg-card);
		border: var(--hairline-width) solid var(--border-main);
		border-radius: 22px;
		box-shadow: var(--shadow-main);
	}

	.calendar-years__link {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 36px;
		padding: 0.35rem 0.9rem;
		border-radius: var(--radius-full, 9999px);
		color: var(--text-muted);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.calendar-years__link:hover {
		color: var(--text-title);
		background: var(--bg-surface);
	}

	.calendar-years__link--active,
	.calendar-years__link--active:hover {
		background: var(--accent-primary);
		color: var(--text-on-accent);
	}

	.calendar-controls__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-card);
		color: var(--text-title);
		box-shadow: var(--shadow-main);
		cursor: pointer;
	}

	.calendar-controls__btn:hover {
		border-color: var(--accent-primary);
	}

	.calendar-page-content {
		width: 100%;
		display: flex;
		flex-direction: row-reverse;
		align-items: flex-start;
		justify-content: center;
		gap: 1rem;
	}

	/* На вузькому екрані праворуч місця немає — керування стає рядком над плакатом. */
	@media (max-width: 900px) {
		.calendar-page-content {
			flex-direction: column;
			align-items: stretch;
		}
		.calendar-controls {
			position: static;
			align-items: stretch;
		}
		.calendar-controls__row {
			justify-content: flex-end;
		}
		.calendar-years {
			flex-direction: row;
			border-radius: var(--radius-full, 9999px);
		}
	}

	/* ===== Повний екран: лише плакат, вписаний у вікно ===== */

	:global(body.calendar-fullscreen) :global(main#main-content),
	:global(body.calendar-fullscreen) :global(main) {
		padding-top: 0 !important;
		height: 100dvh !important;
		min-height: 100dvh !important;
		overflow: hidden !important;
	}

	:global(body.calendar-fullscreen) :global(#main-header),
	:global(body.calendar-fullscreen) :global(.header-blur-layer),
	:global(body.calendar-fullscreen) :global(#main-footer),
	:global(body.calendar-fullscreen) :global(.footer-spacer),
	:global(body.calendar-fullscreen) .calendar-controls nav {
		display: none !important;
	}

	/* У повному екрані — правий верхній кут: «згорнути», під нею палітра. */
	:global(body.calendar-fullscreen) .calendar-controls {
		position: fixed;
		top: 1rem;
		right: clamp(1rem, 2vw, 1.5rem);
		z-index: 10000;
	}

	:global(body.calendar-fullscreen) .calendar-controls__row {
		flex-direction: column-reverse;
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

	/*
	 * Розмір — ОБГОРТЦІ: вона контейнер, і `cqi` плаката рахуються від її ширини.
	 * Висоту дає пропорція A4, яку тут повертають навіть на вузькому екрані:
	 * повний екран — це показ аркуша цілком, а не прокрутка стовпчика місяців.
	 */
	:global(body.calendar-fullscreen) .calendar-page-content :global(.poster-frame) {
		width: min(calc(100vw - 1rem), calc((100dvh - 1rem) * 297 / 210)) !important;
		max-width: none !important;
		margin: auto !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.calendar-poster) {
		aspect-ratio: 297 / 210 !important;
		border: none !important;
		border-radius: 0 !important;
		box-shadow: none !important;
		padding: clamp(14px, 2.5cqi, 44px) !important;
		gap: clamp(4px, 0.8cqi, 12px) !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.grid-slot) {
		aspect-ratio: auto !important;
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
		grid-template-rows: repeat(3, minmax(0, 1fr)) !important;
		display: grid !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.poster-vacations-panel) {
		grid-column: 5 !important;
		grid-row: 1 / span 2 !important;
		height: calc(100% - clamp(16px, 3.2cqi, 48px)) !important;
		align-self: end !important;
	}

	:global(body.calendar-fullscreen) .calendar-page-content :global(.poster-footer) {
		grid-template-columns: 1fr 1fr !important;
		display: grid !important;
	}

	/*
	 * ===== Друк: плакат на одному аркуші A4 альбомом =====
	 *
	 * Плакат зроблено саме під A4 (пропорція 297 : 210), а стилів друку в
	 * проєкті немає ніде: перша редакція лише прибирала поля сторінки, і на
	 * аркуш їхали шапка, підвал і смуга прокрутки, а плакат розривався на два.
	 * Що аркуш ОДИН, міряє `e2e/calendar.spec.ts` через PDF.
	 */
	@page {
		size: A4 landscape;
		margin: 0;
	}

	@media print {
		:global(body) {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}
		:global(#main-header),
		:global(.header-blur-layer),
		:global(#main-footer),
		:global(.footer-spacer),
		:global(.skip-link),
		:global(.page-scrollbar),
		:global(.minimap),
		.calendar-controls {
			display: none !important;
		}
		:global(.app),
		:global(main#main-content) {
			min-height: 0 !important;
			padding: 0 !important;
			margin: 0 !important;
		}
		.calendar-page {
			padding: 0 !important;
			max-width: none !important;
			margin: 0 !important;
		}
		/* На міліметр вужче за аркуш: рівно 297 мм округлення віддає другою сторінкою.
		   Висоту дає пропорція A4 самого плаката — 209,3 мм. */
		.calendar-page-content :global(.poster-frame) {
			width: 296mm !important;
			max-width: none !important;
		}
		.calendar-page-content :global(.calendar-poster) {
			border: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			break-inside: avoid;
		}
	}
</style>
