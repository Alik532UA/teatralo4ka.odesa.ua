<script lang="ts">
	import { asset } from '$app/paths';
	import {
		ANNIVERSARY_BOOKLET_DATA,
		type BookletPageData
	} from '$lib/data/anniversaryBooklet';
	import {
		BookOpen,
		Printer,
		FileText,
		Layers,
		ChevronLeft,
		ChevronRight,
		Info
	} from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'uart-dark' }: Props = $props();

	type ViewMode = 'reader' | 'print';
	let viewMode = $state<ViewMode>('reader');

	// Для режиму читання розворотами (1 до 7)
	let currentSpreadIndex = $state(0);

	// Для режиму друку (який саме аркуш показувати або всі 3)
	type PrintSheetSelection = 'all' | 1 | 2 | 3;
	let printSheet = $state<PrintSheetSelection>('all');

	const data = ANNIVERSARY_BOOKLET_DATA;
	const isLight = $derived(themeId === 'uart-light' || themeId === 'paper-white');
	const isGold = $derived(themeId === 'theatre-gold');

	// Зручний доступ до сторінок за їхнім номером 1..12
	function getPage(num: number): BookletPageData {
		return data.pages.find((p) => p.pageNumber === num) || data.pages[0];
	}

	// Структура розворотів для режиму читання (Reader Spreads)
	const SPREADS = [
		{ id: 'spread-1', labelUk: 'Обкладинка (ст. 1)', labelEn: 'Cover (p. 1)', leftPage: null, rightPage: 1 },
		{ id: 'spread-2', labelUk: '1996–2006 (ст. 2–3)', labelEn: '1996–2006 (pp. 2–3)', leftPage: 2, rightPage: 3 },
		{ id: 'spread-3', labelUk: '2006–2011 & Гімн 1 (ст. 4–5)', labelEn: '2006–2011 & Anthem 1 (pp. 4–5)', leftPage: 4, rightPage: 5 },
		{ id: 'spread-4', labelUk: 'Центр: Викладачі (ст. 6–7)', labelEn: 'Center: Faculty (pp. 6–7)', leftPage: 6, rightPage: 7, isCenterfold: true },
		{ id: 'spread-5', labelUk: '2011–2021 (ст. 8–9)', labelEn: '2011–2021 (pp. 8–9)', leftPage: 8, rightPage: 9 },
		{ id: 'spread-6', labelUk: 'Гімн 2 & 2021–2026 (ст. 10–11)', labelEn: 'Anthem 2 & 2021–2026 (pp. 10–11)', leftPage: 10, rightPage: 11 },
		{ id: 'spread-7', labelUk: 'Гімн 3 · Задня обкладинка (ст. 12)', labelEn: 'Anthem 3 · Back Cover (p. 12)', leftPage: 12, rightPage: null }
	];

	function prevSpread() {
		if (currentSpreadIndex > 0) currentSpreadIndex--;
	}

	function nextSpread() {
		if (currentSpreadIndex < SPREADS.length - 1) currentSpreadIndex++;
	}

	// Спуск смуг для друку (3 аркуші A4 landscape)
	const PRINT_SHEETS = [
		{
			sheetNum: 1,
			titleUk: 'Аркуш 1 (Зовнішній)',
			titleEn: 'Sheet 1 (Outer)',
			side1: { left: 12, right: 1, labelUk: 'Лице: ст. 12 (Задня) + ст. 1 (Обкладинка)', labelEn: 'Front: p. 12 (Back) + p. 1 (Cover)' },
			side2: { left: 2, right: 11, labelUk: 'Зворот: ст. 2 (1996-2001) + ст. 11 (2021-2026)', labelEn: 'Back: p. 2 (1996-2001) + p. 11 (2021-2026)' }
		},
		{
			sheetNum: 2,
			titleUk: 'Аркуш 2 (Середній)',
			titleEn: 'Sheet 2 (Middle)',
			side1: { left: 10, right: 3, labelUk: 'Лице: ст. 10 (Гімн 2) + ст. 3 (2001-2006)', labelEn: 'Front: p. 10 (Anthem 2) + p. 3 (2001-2006)' },
			side2: { left: 4, right: 9, labelUk: 'Зворот: ст. 4 (2006-2011) + ст. 9 (2016-2021)', labelEn: 'Back: p. 4 (2006-2011) + p. 9 (2016-2021)' }
		},
		{
			sheetNum: 3,
			titleUk: 'Аркуш 3 (Внутрішній — Центр)',
			titleEn: 'Sheet 3 (Inner — Center)',
			side1: { left: 8, right: 5, labelUk: 'Лице: ст. 8 (2011-2016) + ст. 5 (Гімн 1)', labelEn: 'Front: p. 8 (2011-2016) + p. 5 (Anthem 1)' },
			side2: { left: 6, right: 7, labelUk: 'Зворот: ст. 6 + 7 (Центральне спільне фото викладачів)', labelEn: 'Back: pp. 6 + 7 (Faculty Centerfold Spread)', isCenterfold: true }
		}
	];
</script>

<div class="anniversary-booklet-container" data-testid="anniversary-booklet-container">
	<!-- Панель керування буклетом -->
	<header class="booklet-toolbar" data-testid="anniversary-booklet-toolbar">
		<div class="toolbar-modes" role="tablist" aria-label={isEn ? 'Booklet mode' : 'Режим перегляду буклету'}>
			<button
				type="button"
				role="tab"
				aria-selected={viewMode === 'reader'}
				class="mode-tab-btn"
				class:mode-tab-btn--active={viewMode === 'reader'}
				onclick={() => (viewMode = 'reader')}
				data-testid="booklet-mode-reader-btn"
			>
				<BookOpen size={15} aria-hidden="true" />
				<span>{isEn ? 'Reader View (Spreads)' : 'Електронний буклет (Розвороти)'}</span>
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={viewMode === 'print'}
				class="mode-tab-btn"
				class:mode-tab-btn--active={viewMode === 'print'}
				onclick={() => (viewMode = 'print')}
				data-testid="booklet-mode-print-btn"
			>
				<Printer size={15} aria-hidden="true" />
				<span>{isEn ? 'Print View (Imposition)' : 'Для друку (Спуск смуг A4)'}</span>
			</button>
		</div>

		{#if viewMode === 'reader'}
			<!-- Навігація по розворотах у режимі читання -->
			<div class="spread-nav" aria-label={isEn ? 'Spread navigation' : 'Навігація по розворотах'}>
				<button
					type="button"
					class="nav-arrow-btn"
					disabled={currentSpreadIndex === 0}
					onclick={prevSpread}
					aria-label={isEn ? 'Previous spread' : 'Попередній розворот'}
					title={isEn ? 'Previous spread' : 'Попередній розворот'}
					data-testid="booklet-spread-prev-btn"
				>
					<ChevronLeft size={18} aria-hidden="true" />
				</button>

				<div class="spread-pills" role="tablist">
					{#each SPREADS as spread, i (spread.id)}
						<button
							type="button"
							role="tab"
							aria-selected={currentSpreadIndex === i}
							class="spread-pill"
							class:spread-pill--active={currentSpreadIndex === i}
							onclick={() => (currentSpreadIndex = i)}
							title={isEn ? spread.labelEn : spread.labelUk}
							data-testid={`booklet-spread-${i + 1}-tab`}
						>
							<span class="pill-num">{i + 1}</span>
							<span class="pill-label">{isEn ? spread.labelEn : spread.labelUk}</span>
						</button>
					{/each}
				</div>

				<button
					type="button"
					class="nav-arrow-btn"
					disabled={currentSpreadIndex === SPREADS.length - 1}
					onclick={nextSpread}
					aria-label={isEn ? 'Next spread' : 'Наступний розворот'}
					title={isEn ? 'Next spread' : 'Наступний розворот'}
					data-testid="booklet-spread-next-btn"
				>
					<ChevronRight size={18} aria-hidden="true" />
				</button>
			</div>
		{:else}
			<!-- Вибір аркуша для друку -->
			<div class="print-sheet-selector">
				<div class="sheet-tabs" role="tablist" aria-label={isEn ? 'Sheet selector' : 'Вибір аркуша'}>
					<button
						type="button"
						role="tab"
						aria-selected={printSheet === 'all'}
						class="sheet-tab"
						class:sheet-tab--active={printSheet === 'all'}
						onclick={() => (printSheet = 'all')}
						data-testid="booklet-sheet-all-tab"
					>
						<Layers size={14} aria-hidden="true" />
						<span>{isEn ? 'All 3 Sheets (Complete)' : 'Всі 3 аркуші (Повний буклет)'}</span>
					</button>

					{#each PRINT_SHEETS as s (s.sheetNum)}
						<button
							type="button"
							role="tab"
							aria-selected={printSheet === s.sheetNum}
							class="sheet-tab"
							class:sheet-tab--active={printSheet === s.sheetNum}
							onclick={() => (printSheet = s.sheetNum as PrintSheetSelection)}
							data-testid={`booklet-sheet-${s.sheetNum}-tab`}
						>
							<FileText size={14} aria-hidden="true" />
							<span>{isEn ? `Sheet ${s.sheetNum}` : `Аркуш ${s.sheetNum}`}</span>
						</button>
					{/each}
				</div>

				<div class="print-guide-badge">
					<Info size={13} aria-hidden="true" />
					<span>
						{isEn
							? 'Print duplex on 3 A4 sheets (flip on short edge), nest together, fold in half'
							: 'Двосторонній друк на 3 аркушах A4 (перевертати по короткому краю), вкласти та скласти навпіл'}
					</span>
				</div>
			</div>
		{/if}
	</header>

	<!-- Основне полотно буклету -->
	<main class="booklet-viewport" class:booklet-viewport--light={isLight} class:booklet-viewport--gold={isGold}>
		{#if viewMode === 'reader'}
			<!-- Режим читання: один розворот (A4 landscape) -->
			{@const currentSpread = SPREADS[currentSpreadIndex]}
			<article class="booklet-sheet spread-card" class:spread-card--centerfold={currentSpread.isCenterfold}>
				{#if currentSpread.isCenterfold}
					<!-- Центральний розворот на обидві сторінки 6 і 7 -->
					<div class="centerfold-full">
						<div class="centerfold-image-box">
							<img
								src={asset('/posters/anniversary-booklet/teachers-centerfold.webp')}
								alt={isEn ? 'Faculty and masters collective portrait' : 'Спільне фото колективу викладачів та майстрів'}
								class="centerfold-img"
								width="2400"
								height="1600"
								loading="eager"
								decoding="async"
							/>
						</div>
						<div class="centerfold-header-overlay">
							<span class="centerfold-tag">1996 — 2026 · 30 РОКІВ ДТШ</span>
							<h2 class="centerfold-title">{isEn ? 'Creators and Mentors of Teatralo4ka' : 'Творці та наставники «Театрало4ки»'}</h2>
							<p class="centerfold-sub">{isEn ? 'The pedagogical collective and masters of courses' : 'Педагогічний колектив та майстри курсів Одеської театральної школи'}</p>
						</div>
						<div class="centerfold-footer-row">
							<span class="page-corner page-corner--left">6</span>
							<span class="centerfold-quote">«Мистецтво починається з любові та віри у кожне дитяче серце»</span>
							<span class="page-corner page-corner--right">7</span>
						</div>
						<div class="sheet-fold-line" aria-hidden="true">
							<span class="fold-badge">{isEn ? 'center fold' : 'центральний згин'}</span>
						</div>
					</div>
				{:else}
					<!-- Звичайний подвійний розворот: ліва сторінка + центральний згин + права сторінка -->
					<!-- Ліва сторінка розвороту -->
					<section class="page-half page-half--left" class:page-half--empty={currentSpread.leftPage === null}>
						{#if currentSpread.leftPage !== null}
							{@const pLeft = getPage(currentSpread.leftPage)}
							{@render renderPageContent(pLeft)}
						{:else}
							<div class="cover-intro-back">
								<span class="cover-back-logo">🎭</span>
								<p class="cover-back-school">{isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}</p>
								<p class="cover-back-note">{isEn ? 'Open cover to begin reading' : 'Розгорніть буклет для читання'}</p>
							</div>
						{/if}
					</section>

					<div class="sheet-fold-line" aria-hidden="true">
						<span class="fold-badge">{isEn ? 'fold' : 'згин'}</span>
					</div>

					<!-- Права сторінка розвороту -->
					<section class="page-half page-half--right" class:page-half--empty={currentSpread.rightPage === null}>
						{#if currentSpread.rightPage !== null}
							{@const pRight = getPage(currentSpread.rightPage)}
							{@render renderPageContent(pRight)}
						{:else}
							<div class="cover-intro-back">
								<span class="cover-back-logo">🌟</span>
								<p class="cover-back-school">«Театралка — це життя!»</p>
								<p class="cover-back-note">30 років натхнення</p>
							</div>
						{/if}
					</section>
				{/if}
			</article>
		{:else}
			<!-- Режим друку: аркуші зі спуском смуг -->
			<div class="print-sheets-stack">
				{#each PRINT_SHEETS as sheet (sheet.sheetNum)}
					{#if printSheet === 'all' || printSheet === sheet.sheetNum}
						<!-- Сторона 1 аркуша -->
						<div class="print-sheet-wrapper">
							<div class="sheet-print-header">
								<span class="sheet-number-tag">{isEn ? `Sheet ${sheet.sheetNum} · Side 1 (Front)` : `Аркуш ${sheet.sheetNum} · Лицьова сторона`}</span>
								<span class="sheet-desc-tag">{isEn ? sheet.side1.labelEn : sheet.side1.labelUk}</span>
							</div>

							<article class="booklet-sheet print-sheet" data-testid={`booklet-sheet-${sheet.sheetNum}-side1-card`}>
								<section class="page-half page-half--left">
									{@render renderPageContent(getPage(sheet.side1.left))}
								</section>
								<div class="sheet-fold-line" aria-hidden="true">
									<span class="fold-badge">{isEn ? 'fold line' : 'лінія згину'}</span>
								</div>
								<section class="page-half page-half--right">
									{@render renderPageContent(getPage(sheet.side1.right))}
								</section>
							</article>
						</div>

						<!-- Сторона 2 аркуша (Зворот) -->
						<div class="print-sheet-wrapper">
							<div class="sheet-print-header">
								<span class="sheet-number-tag">{isEn ? `Sheet ${sheet.sheetNum} · Side 2 (Back)` : `Аркуш ${sheet.sheetNum} · Зворотна сторона`}</span>
								<span class="sheet-desc-tag">{isEn ? sheet.side2.labelEn : sheet.side2.labelUk}</span>
							</div>

							<article class="booklet-sheet print-sheet" data-testid={`booklet-sheet-${sheet.sheetNum}-side2-card`}>
								{#if sheet.side2.isCenterfold}
									<!-- Спеціальний центральний розворот -->
									<div class="centerfold-full">
										<div class="centerfold-image-box">
											<img
												src={asset('/posters/anniversary-booklet/teachers-centerfold.webp')}
												alt={isEn ? 'Faculty and masters collective portrait' : 'Спільне фото колективу викладачів та майстрів'}
												class="centerfold-img"
												width="2400"
												height="1600"
												loading="eager"
												decoding="async"
											/>
										</div>
										<div class="centerfold-header-overlay">
											<span class="centerfold-tag">1996 — 2026 · 30 РОКІВ ДТШ</span>
											<h2 class="centerfold-title">{isEn ? 'Creators and Mentors of Teatralo4ka' : 'Творці та наставники «Театрало4ки»'}</h2>
											<p class="centerfold-sub">{isEn ? 'The pedagogical collective and masters of courses' : 'Педагогічний колектив та майстри курсів Одеської театральної школи'}</p>
										</div>
										<div class="centerfold-footer-row">
											<span class="page-corner page-corner--left">6</span>
											<span class="centerfold-quote">«Мистецтво починається з любові та віри у кожне дитяче серце»</span>
											<span class="page-corner page-corner--right">7</span>
										</div>
										<div class="sheet-fold-line" aria-hidden="true">
											<span class="fold-badge">{isEn ? 'center fold' : 'центральний згин'}</span>
										</div>
									</div>
								{:else}
									<section class="page-half page-half--left">
										{@render renderPageContent(getPage(sheet.side2.left))}
									</section>
									<div class="sheet-fold-line" aria-hidden="true">
										<span class="fold-badge">{isEn ? 'fold line' : 'лінія згину'}</span>
									</div>
									<section class="page-half page-half--right">
										{@render renderPageContent(getPage(sheet.side2.right))}
									</section>
								{/if}
							</article>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</main>
</div>

<!-- Рендеринг контенту однієї сторінки A5 -->
{#snippet renderPageContent(page: BookletPageData)}
	<div class="booklet-page booklet-page--{page.type}" data-page={page.pageNumber}>
		<!-- Номер сторінки у кутку -->
		<div class="page-num-corner">
			<span class="page-badge">{page.pageNumber}</span>
		</div>

		{#if page.type === 'cover'}
			<!-- 1 ст. Титульна обкладинка -->
			<div class="cover-layout">
				<header class="cover-header">
					<div class="school-emblem-pill">
						<span class="pill-sparkle">✦</span>
						<span class="pill-text">{isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}</span>
						<span class="pill-sparkle">✦</span>
					</div>
					<h1 class="cover-main-title">
						<span class="title-sub">{isEn ? 'Anniversary Booklet' : 'Ювілейний буклет'}</span>
						<span class="title-huge">«ДНК — ДТШ»</span>
					</h1>
					<p class="cover-anniversary-badge">{isEn ? 'for the 30th Anniversary' : 'до 30-річчя школи'}</p>
				</header>

				<div class="cover-photo-frame">
					<img
						src={asset(page.photos[0].src)}
						alt={isEn ? page.photos[0].altEn : page.photos[0].altUk}
						class="cover-photo"
						width="1088"
						height="725"
						loading="eager"
						decoding="async"
					/>
					<div class="cover-photo-overlay">
						<span class="cover-years">1996 — 2026</span>
					</div>
				</div>

				<footer class="cover-footer">
					<p class="cover-tagline">{isEn ? 'Three Decades of Creativity, Magic & Love' : 'Три десятиліття творчості, магії та любові'}</p>
					<div class="cover-meta-row">
						<span>Одеса · вул. Софіївська, 24</span>
						<span>1 грудня 2026 року</span>
					</div>
				</footer>
			</div>
		{:else if page.type === 'history'}
			<!-- 2, 3, 4, 8, 9, 11 ст. Історичні дайджести за 5-річчями -->
			<div class="history-layout">
				<header class="page-header">
					{#if page.yearsBadge}
						<div class="years-badge-row">
							<span class="years-badge">{page.yearsBadge}</span>
							<span class="school-micro-badge">ДТШ</span>
						</div>
					{/if}
					<h2 class="page-title">{isEn ? page.titleEn : page.titleUk}</h2>
					{#if page.subtitleUk}
						<p class="page-subtitle">{isEn ? page.subtitleEn : page.subtitleUk}</p>
					{/if}
				</header>

				<!-- Двоколонковий журнальний текст -->
				<div class="two-column-text">
					{#each (isEn ? page.paragraphsEn : page.paragraphsUk) as para, i (i)}
						<p class="history-para">{para}</p>
					{/each}
				</div>

				<!-- Міні-галерея фотографій періоду -->
				{#if page.photos && page.photos.length > 0}
					<div class="photos-strip photos-strip--{Math.min(page.photos.length, 3)}">
						{#each page.photos as photo, idx (idx)}
							<figure class="photo-cell">
								<img
									src={asset(photo.src)}
									alt={isEn ? photo.altEn : photo.altUk}
									class="strip-img"
									width="400"
									height="260"
									loading="lazy"
									decoding="async"
								/>
							</figure>
						{/each}
					</div>
				{/if}
			</div>
		{:else if page.type === 'hymn'}
			<!-- 5 та 10 ст. Гімни школи -->
			<div class="hymn-layout">
				<header class="hymn-header">
					<span class="hymn-musical-badge">🎵 ІСТОРИЧНА СПАДЩИНА</span>
					<h2 class="hymn-title">{isEn ? page.titleEn : page.titleUk}</h2>
					{#if page.subtitleUk}
						<p class="hymn-subtitle">{isEn ? page.subtitleEn : page.subtitleUk}</p>
					{/if}
				</header>

				{#if page.hymnLyrics}
					<div class="lyrics-card">
						{#each page.hymnLyrics.verses as verse, vi (vi)}
							<div class="verse-block verse-block--{verse.type}">
								{#if verse.type === 'chorus'}
									<span class="verse-type-tag">Приспів:</span>
								{:else if verse.type === 'coda'}
									<span class="verse-type-tag">Кода:</span>
								{/if}
								{#each verse.linesUk as line, li (li)}
									<p class="verse-line">{line}</p>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				{#if page.photos && page.photos.length > 0}
					<div class="hymn-photos-row">
						{#each page.photos as photo, idx (idx)}
							<div class="hymn-photo-item">
								<img
									src={asset(photo.src)}
									alt={isEn ? photo.altEn : photo.altUk}
									class="hymn-thumb"
									width="300"
									height="200"
									loading="lazy"
									decoding="async"
								/>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else if page.type === 'back-cover'}
			<!-- 12 ст. Третій гімн та задня обкладинка -->
			<div class="back-cover-layout">
				<header class="back-cover-header">
					<span class="modern-badge">✨ СУЧАСНИЙ ГІМН</span>
					<h2 class="back-cover-title">{isEn ? page.titleEn : page.titleUk}</h2>
					<p class="back-cover-sub">{isEn ? page.subtitleEn : page.subtitleUk}</p>
				</header>

				{#if page.hymnLyrics}
					<div class="lyrics-card lyrics-card--compact">
						{#each page.hymnLyrics.verses as verse, vi (vi)}
							<div class="verse-block verse-block--{verse.type}">
								{#if verse.type === 'chorus'}
									<span class="verse-type-tag">Приспів:</span>
								{:else if verse.type === 'coda'}
									<span class="verse-type-tag">Фінал:</span>
								{/if}
								{#each verse.linesUk as line, li (li)}
									<p class="verse-line">{line}</p>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<footer class="back-cover-footer">
					<div class="footer-contacts">
						<span class="school-footer-name">Одеська театральна школа</span>
						<span class="school-footer-sub">teatralo4ka.odesa.ua · Одеса, вул. Софіївська, 24</span>
					</div>
					<div class="footer-emblem-box">
						<img
							src={asset('/posters/anniversary-booklet/p12-teatralo4ka-30.webp')}
							alt="30 років Театралочці"
							class="footer-30-emblem"
							width="64"
							height="64"
							loading="lazy"
							decoding="async"
						/>
					</div>
				</footer>
			</div>
		{/if}
	</div>
{/snippet}

<style>
	/* Загальний контейнер */
	.anniversary-booklet-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Панель інструментів */
	.booklet-toolbar {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		padding: 14px 18px;
		background: rgba(23, 17, 24, 0.85);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(254, 240, 138, 0.2);
		border-radius: 14px;
	}

	.toolbar-modes {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.mode-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		font-size: 0.88rem;
		font-weight: 600;
		color: #e2e8f0;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.mode-tab-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #ffffff;
	}

	.mode-tab-btn--active {
		background: #ffed00 !important;
		color: #171118 !important;
		border-color: #ffed00 !important;
	}

	/* Навігація по розворотах у режимі читання */
	.spread-nav {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		width: 100%;
	}

	.nav-arrow-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #ffffff;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.nav-arrow-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.nav-arrow-btn:not(:disabled):hover {
		background: #ffed00;
		color: #171118;
	}

	.spread-pills {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		flex: 1;
	}

	.spread-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.78rem;
		font-weight: 500;
		color: #cbd5e1;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.spread-pill:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.spread-pill--active {
		background: rgba(255, 237, 0, 0.18) !important;
		color: #ffed00 !important;
		border-color: #ffed00 !important;
	}

	.pill-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.15);
		font-size: 0.7rem;
		font-weight: 700;
	}

	.spread-pill--active .pill-num {
		background: #ffed00;
		color: #171118;
	}

	/* Селектор друку */
	.print-sheet-selector {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.sheet-tabs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.sheet-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		font-size: 0.82rem;
		font-weight: 600;
		color: #cbd5e1;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.sheet-tab:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #ffffff;
	}

	.sheet-tab--active {
		background: #fef08a !important;
		color: #171118 !important;
		border-color: #fef08a !important;
	}

	.print-guide-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		color: #fef08a;
		opacity: 0.9;
	}

	/* Область перегляду буклету */
	.booklet-viewport {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;
	}

	/* Фізичний аркуш A4 landscape (297 x 210 мм, співвідношення ~ 1.414) */
	.booklet-sheet {
		display: flex;
		width: 100%;
		max-width: 1120px;
		aspect-ratio: 297 / 210;
		background: #171118;
		color: #f8fafc;
		border-radius: 8px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
		border: 1px solid rgba(255, 255, 255, 0.12);
		position: relative;
		overflow: hidden;
		container-type: inline-size;
	}

	.booklet-viewport--light .booklet-sheet {
		background: #ffffff;
		color: #0f172a;
		border-color: #cbd5e1;
	}

	.booklet-viewport--gold .booklet-sheet {
		background: #fffbeb;
		color: #1e293b;
		border-color: #fde047;
	}

	/* Лінія згину по центру */
	.sheet-fold-line {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 2px;
		background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 8px, transparent 8px, transparent 16px);
		transform: translateX(-50%);
		z-index: 10;
		pointer-events: none;
	}

	.fold-badge {
		position: absolute;
		top: 8px;
		left: 50%;
		transform: translateX(-50%);
		padding: 2px 6px;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: rgba(0, 0, 0, 0.6);
		color: rgba(255, 255, 255, 0.7);
		border-radius: 4px;
	}

	/* Половинка аркуша (сторінка A5) */
	.page-half {
		flex: 1;
		width: 50%;
		height: 100%;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.page-half--empty {
		background: rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cover-intro-back {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		opacity: 0.4;
		text-align: center;
	}

	.cover-back-logo { font-size: 2.5rem; }
	.cover-back-school { font-size: 0.95rem; font-weight: 600; }
	.cover-back-note { font-size: 0.8rem; }

	/* Внутрішній вміст сторінки A5 */
	.booklet-page {
		width: 100%;
		height: 100%;
		padding: clamp(14px, 2.5cqi, 24px);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
	}

	.page-num-corner {
		position: absolute;
		bottom: 10px;
		right: 14px;
		z-index: 5;
	}

	.page-half--left .page-num-corner {
		right: auto;
		left: 14px;
	}

	.page-badge {
		font-size: clamp(9px, 1.2cqi, 12px);
		font-weight: 700;
		color: rgba(255, 255, 255, 0.45);
	}

	.booklet-viewport--light .page-badge {
		color: rgba(0, 0, 0, 0.45);
	}

	/* 1. Обкладинка (Cover Layout) */
	.cover-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		text-align: center;
	}

	.school-emblem-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 4px 14px;
		border-radius: 20px;
		background: rgba(254, 240, 138, 0.15);
		border: 1px solid rgba(254, 240, 138, 0.4);
		color: #fef08a;
		font-size: clamp(9px, 1.1cqi, 11px);
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		margin-bottom: 6px;
	}

	.cover-main-title {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
	}

	.title-sub {
		font-size: clamp(12px, 1.8cqi, 16px);
		font-weight: 600;
		color: #e2e8f0;
		letter-spacing: 0.02em;
	}

	.booklet-viewport--light .title-sub { color: #334155; }

	.title-huge {
		font-size: clamp(24px, 4.2cqi, 40px);
		font-weight: 900;
		color: #ffed00;
		letter-spacing: -0.01em;
		text-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
	}

	.booklet-viewport--light .title-huge {
		color: #854d0e;
		text-shadow: none;
	}

	.cover-anniversary-badge {
		margin: 4px 0 0;
		font-size: clamp(11px, 1.4cqi, 14px);
		font-weight: 600;
		color: #cbd5e1;
	}

	.cover-photo-frame {
		position: relative;
		width: 100%;
		flex: 1;
		max-height: 52%;
		margin: 8px 0;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.cover-photo {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cover-photo-overlay {
		position: absolute;
		bottom: 8px;
		right: 8px;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		padding: 3px 8px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.cover-years {
		font-size: 0.85rem;
		font-weight: 800;
		color: #ffed00;
		letter-spacing: 0.05em;
	}

	.cover-footer {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.cover-tagline {
		margin: 0;
		font-size: clamp(10px, 1.2cqi, 12px);
		font-weight: 600;
		color: #fef08a;
	}

	.booklet-viewport--light .cover-tagline { color: #854d0e; }

	.cover-meta-row {
		display: flex;
		justify-content: space-between;
		font-size: clamp(8px, 1cqi, 10px);
		color: #94a3b8;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 6px;
	}

	/* 2. Історичні сторінки (History Layout) */
	.history-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		gap: 6px;
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.years-badge-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.years-badge {
		display: inline-block;
		padding: 2px 8px;
		background: #ffed00;
		color: #171118;
		font-size: clamp(10px, 1.2cqi, 12px);
		font-weight: 800;
		border-radius: 4px;
		letter-spacing: 0.03em;
	}

	.school-micro-badge {
		font-size: 0.7rem;
		font-weight: 700;
		color: #94a3b8;
	}

	.page-title {
		margin: 3px 0 0;
		font-size: clamp(13px, 1.8cqi, 17px);
		font-weight: 800;
		color: #ffffff;
		line-height: 1.25;
	}

	.booklet-viewport--light .page-title { color: #0f172a; }

	.page-subtitle {
		margin: 0;
		font-size: clamp(9px, 1.2cqi, 11px);
		font-weight: 500;
		color: #cbd5e1;
		font-style: italic;
	}

	.booklet-viewport--light .page-subtitle { color: #475569; }

	/* Двоколонковий журнальний текст */
	.two-column-text {
		column-count: 2;
		column-gap: 14px;
		flex: 1;
		margin: 4px 0;
	}

	.history-para {
		margin: 0 0 6px 0;
		font-size: clamp(8.5px, 1.15cqi, 10.5px);
		line-height: 1.4;
		text-align: justify;
		text-justify: inter-word;
		color: #e2e8f0;
	}

	.booklet-viewport--light .history-para { color: #1e293b; }

	/* Стрічка фотографій */
	.photos-strip {
		display: grid;
		gap: 6px;
		width: 100%;
		height: clamp(65px, 11cqi, 95px);
		margin-top: 4px;
	}

	.photos-strip--2 { grid-template-columns: 1fr 1fr; }
	.photos-strip--3 { grid-template-columns: 1fr 1fr 1fr; }

	.photo-cell {
		margin: 0;
		height: 100%;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
	}

	.strip-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* 3. Центральний розворот (Centerfold) */
	.centerfold-full {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.centerfold-image-box {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.centerfold-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.centerfold-header-overlay {
		position: relative;
		z-index: 5;
		padding: clamp(14px, 2.5cqi, 24px);
		background: linear-gradient(to bottom, rgba(23, 17, 24, 0.9) 0%, rgba(23, 17, 24, 0.6) 65%, transparent 100%);
		text-align: center;
	}

	.centerfold-tag {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 4px;
		background: #ffed00;
		color: #171118;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.08em;
	}

	.centerfold-title {
		margin: 4px 0 0;
		font-size: clamp(18px, 3cqi, 28px);
		font-weight: 900;
		color: #ffffff;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
	}

	.centerfold-sub {
		margin: 2px 0 0;
		font-size: clamp(11px, 1.4cqi, 14px);
		color: #fef08a;
		font-weight: 600;
	}

	.centerfold-footer-row {
		position: relative;
		z-index: 5;
		padding: 10px 16px;
		background: linear-gradient(to top, rgba(23, 17, 24, 0.92) 0%, rgba(23, 17, 24, 0.5) 75%, transparent 100%);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.centerfold-quote {
		font-size: clamp(10px, 1.25cqi, 13px);
		font-style: italic;
		font-weight: 600;
		color: #fef08a;
		text-align: center;
		flex: 1;
		padding: 0 16px;
	}

	.page-corner {
		font-size: 0.9rem;
		font-weight: 800;
		color: rgba(255, 255, 255, 0.7);
	}

	/* 4. Гімни школи (Hymn Layout) */
	.hymn-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		gap: 6px;
	}

	.hymn-musical-badge {
		font-size: 0.68rem;
		font-weight: 800;
		color: #ffed00;
		letter-spacing: 0.05em;
	}

	.booklet-viewport--light .hymn-musical-badge { color: #854d0e; }

	.hymn-title {
		margin: 2px 0;
		font-size: clamp(14px, 2cqi, 19px);
		font-weight: 800;
		color: #ffffff;
	}

	.booklet-viewport--light .hymn-title { color: #0f172a; }

	.hymn-subtitle {
		margin: 0;
		font-size: clamp(9px, 1.2cqi, 11px);
		color: #cbd5e1;
		font-style: italic;
	}

	.lyrics-card {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: clamp(8px, 1.5cqi, 12px);
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
		justify-content: center;
	}

	.booklet-viewport--light .lyrics-card {
		background: rgba(0, 0, 0, 0.02);
		border-color: rgba(0, 0, 0, 0.08);
	}

	.verse-block {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.verse-block--chorus {
		padding-left: 10px;
		border-left: 2px solid #ffed00;
		font-weight: 600;
	}

	.verse-block--coda {
		padding: 4px 8px;
		background: rgba(254, 240, 138, 0.1);
		border-radius: 4px;
		font-weight: 600;
	}

	.verse-type-tag {
		font-size: 0.68rem;
		font-weight: 700;
		color: #ffed00;
		text-transform: uppercase;
		margin-bottom: 2px;
	}

	.booklet-viewport--light .verse-type-tag { color: #854d0e; }

	.verse-line {
		margin: 0;
		font-size: clamp(8.5px, 1.15cqi, 10.5px);
		line-height: 1.35;
		color: #f1f5f9;
	}

	.booklet-viewport--light .verse-line { color: #1e293b; }

	.hymn-photos-row {
		display: flex;
		gap: 6px;
		height: clamp(55px, 9cqi, 75px);
	}

	.hymn-photo-item {
		flex: 1;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.hymn-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* 5. Задня обкладинка (Back Cover Layout) */
	.back-cover-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		gap: 6px;
	}

	.modern-badge {
		font-size: 0.68rem;
		font-weight: 800;
		color: #ffed00;
		letter-spacing: 0.05em;
	}

	.booklet-viewport--light .modern-badge { color: #854d0e; }

	.back-cover-title {
		margin: 2px 0;
		font-size: clamp(14px, 2cqi, 19px);
		font-weight: 900;
		color: #ffed00;
	}

	.booklet-viewport--light .back-cover-title { color: #854d0e; }

	.back-cover-sub {
		margin: 0;
		font-size: clamp(9px, 1.2cqi, 11px);
		color: #cbd5e1;
	}

	.lyrics-card--compact {
		padding: 8px;
		gap: 5px;
	}

	.back-cover-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 6px;
		border-top: 1px solid rgba(255, 255, 255, 0.15);
	}

	.footer-contacts {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.school-footer-name {
		font-size: clamp(9px, 1.2cqi, 11px);
		font-weight: 700;
		color: #ffffff;
	}

	.booklet-viewport--light .school-footer-name { color: #0f172a; }

	.school-footer-sub {
		font-size: clamp(7.5px, 0.95cqi, 9.5px);
		color: #94a3b8;
	}

	.footer-emblem-box {
		width: clamp(38px, 6cqi, 52px);
		height: auto;
	}

	.footer-30-emblem {
		width: 100%;
		height: auto;
		object-fit: contain;
	}

	/* Друк спуску смуг */
	.print-sheets-stack {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
	}

	.print-sheet-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.sheet-print-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: #fef08a;
		padding: 0 4px;
	}

	.sheet-number-tag { font-weight: 700; }
	.sheet-desc-tag { opacity: 0.85; }

	/* Стилі друку */
	@media print {
		.booklet-toolbar,
		.sheet-print-header,
		.sheet-fold-line,
		.fold-badge {
			display: none !important;
		}

		.anniversary-booklet-container {
			max-width: none !important;
			width: 100% !important;
			padding: 0 !important;
			margin: 0 !important;
		}

		.booklet-viewport {
			gap: 0 !important;
		}

		.print-sheets-stack {
			gap: 0 !important;
		}

		.print-sheet-wrapper {
			gap: 0 !important;
			page-break-after: always !important;
			break-after: page !important;
		}

		.booklet-sheet {
			width: 297mm !important;
			height: 210mm !important;
			max-width: none !important;
			margin: 0 !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			border: none !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}
	}
</style>
