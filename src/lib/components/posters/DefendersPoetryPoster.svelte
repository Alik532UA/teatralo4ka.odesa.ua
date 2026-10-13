<script lang="ts">
	import { asset } from '$app/paths';
	import { DEFENDERS_HEARTS_POSTER, POSTER_THEMES, DEFAULT_DEFENDERS_THEME } from '$lib/data/posters';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = DEFAULT_DEFENDERS_THEME }: Props = $props();

	const activeTheme = $derived(
		POSTER_THEMES.find((t) => t.id === themeId) ?? POSTER_THEMES[0]
	);

	const isArtBg = $derived(Boolean(activeTheme.bgImage));
	const currentBgImage = $derived(activeTheme.bgImage || '/posters/defenders-hearts-sky-bg.webp');
	const isSkyTheme = $derived(activeTheme.id === 'defenders-sky');

	// 12 фірмових мікро-часток айдентики за каноном бренду по кутах
	const CORNER_ICONS = [
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon10_2026.svg', nameUk: 'Хлопавка', nameEn: 'Clapperboard', pos: 'pos-top-left' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon03_2026.svg', nameUk: 'Книга', nameEn: 'Book', pos: 'pos-top-left-sub' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon07_2026.svg', nameUk: 'Скрипковий ключ', nameEn: 'Treble Clef', pos: 'pos-mid-upper-left' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon08_2026.svg', nameUk: 'Храм', nameEn: 'Temple', pos: 'pos-top-right' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon06_2026.svg', nameUk: 'Мікрофон', nameEn: 'Microphone', pos: 'pos-top-right-sub' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon05_2026.svg', nameUk: 'Софіт', nameEn: 'Spotlight', pos: 'pos-mid-upper-right' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon11_2026.svg', nameUk: 'Маски', nameEn: 'Masks', pos: 'pos-mid-lower-left' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon04_2026.svg', nameUk: 'Олівець', nameEn: 'Pencil', pos: 'pos-bot-sub-left' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon01_2026.svg', nameUk: 'Зірка', nameEn: 'Star', pos: 'pos-bot-corner-left' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon02_2026.svg', nameUk: 'Гітара', nameEn: 'Guitar', pos: 'pos-mid-lower-right' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon09_2026.svg', nameUk: 'Камера', nameEn: 'Camera', pos: 'pos-bot-sub-right' },
		{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon12_2026.svg', nameUk: 'Палітра', nameEn: 'Palette', pos: 'pos-bot-corner-right' }
	];

	const poster = DEFENDERS_HEARTS_POSTER;
</script>

<div class="poster-frame" data-testid="defenders-poster-container">
	<article
		class="defenders-poster"
		class:defenders-poster--art-bg={isArtBg}
		class:defenders-poster--sky={isSkyTheme}
		style:--poster-bg={activeTheme.color}
		data-testid="defenders-poster-card"
	>
		<!-- Художній фон: або синє небо заходу сонця, або арт із захисниками -->
		{#if isArtBg}
			<img
				src={asset(currentBgImage)}
				alt=""
				width="768"
				height="1376"
				class="full-bleed-bg"
				class:full-bleed-bg--sky={isSkyTheme}
				loading="eager"
				decoding="async"
			/>
			<div class="art-bg-overlay" aria-hidden="true"></div>
		{/if}

		<!-- Декоративні фірмові мікро-частки по кутах (у безпечній зовнішній зоні) -->
		<div class="corner-icons-layer" aria-hidden="true">
			{#each CORNER_ICONS as icon, i (i)}
				<img
					src={asset(icon.file)}
					alt={isEn ? icon.nameEn : icon.nameUk}
					width="68"
					height="68"
					class="corner-icon {icon.pos}"
					loading="eager"
					decoding="async"
				/>
			{/each}
		</div>

		<!-- Вміст афіші (центричний безпечний стовпчик 72%, який не торкається кутових іконок) -->
		<div class="poster-content">
			<!-- Шапка: офіційний герб, підзаголовок, назва та ДАТИ ЗВЕРХУ -->
			<header class="poster-header">
				<div class="emblem-wrap">
					<img
						src={asset(isArtBg ? '/brand/big-emblem/svg/big-emblem-2025-color-white-text.svg' : '/brand/big-emblem/svg/big-emblem-2025-color-color-hands-text.svg')}
						alt={isEn ? 'Odesa Theatre School Official Crest' : 'Офіційний герб Одеської дитячої театральної школи'}
						width="450"
						height="260"
						class="emblem-img"
						loading="eager"
						decoding="async"
					/>
				</div>

				<!-- Живописний банер дат ОДРАЗУ ПІСЛЯ ЛОГО за вимогами користувача -->
				<div class="top-schedule-wrap" data-testid="defenders-poster-banner">
					<img
						src={asset('/posters/defenders-brush-banner.svg')}
						alt=""
						width="600"
						height="170"
						class="brush-banner-img"
						aria-hidden="true"
						loading="eager"
						decoding="async"
					/>

					<div class="brush-banner-content">
						<div class="dates-stack">
							<div class="date-row" data-testid="schedule-card-14">
								<span class="date-strong">{isEn ? 'October 14' : '14 жовтня'}</span>
								<span class="date-time">
									<span class="date-prep">{isEn ? 'at' : 'о'}</span>
									<span class="time-val"><span class="time-h">17</span><sup class="time-m">00</sup></span>
								</span>
								<span class="venue-pill">{isEn ? 'Room 17' : '17 ауд.'}</span>
							</div>

							<div class="date-row" data-testid="schedule-card-17">
								<span class="date-strong">{isEn ? 'October 17' : '17 жовтня'}</span>
								<span class="date-time">
									<span class="date-prep">{isEn ? 'at' : 'о'}</span>
									<span class="time-val"><span class="time-h">12</span><sup class="time-m">50</sup></span>
								</span>
								<span class="venue-pill">{isEn ? 'Room 17' : '17 ауд.'}</span>
							</div>
						</div>

						<div class="school-caption">
							{isEn
								? "Odesa Children's Theatre School · 24 Sofiivska St."
								: 'Одеська дитяча театральна школа · вул. Софіївська, 24'}
						</div>
					</div>
				</div>

				<!-- Підзаголовок та присвята за референсом -->
				<div class="header-titles">
					<p class="header-subtitle-line">
						{isEn ? 'Poetic composition' : 'Поетична композиція'}
					</p>
					<p class="header-occasion-line">
						{isEn
							? 'dedicated to the Defenders of Ukraine'
							: 'до Дня захисників та захисниць України'}
					</p>
					<p class="header-author-line">
						{isEn
							? 'based on poems by Iryna Fotuyma'
							: 'за віршами Ірини Фотуйми'}
					</p>
				</div>

				<h1 class="main-title" data-testid="defenders-poster-title">
					<span class="title-line">«Серця, які не втратили</span>
					<span class="title-line">здатність любити»</span>
				</h1>

				<!-- Живописний акцентний штрих кольорів прапора під назвою -->
				<div class="title-brush-accent" aria-hidden="true">
					<img
						src={asset('/posters/defenders-flag-brush.svg')}
						alt=""
						width="240"
						height="14"
						class="brush-accent-img"
						loading="eager"
						decoding="async"
					/>
				</div>
			</header>

			<!-- Середина та низ: повністю відкритий художній простір без перекриттів -->
			{#if isArtBg}
				<div class="art-visual-spacer" aria-hidden="true"></div>
			{:else}
				<section class="hero-art-section" data-testid="defenders-poster-section">
					<div class="hero-art-frame">
						<img
							src={asset(poster.heroImage)}
							alt={isEn
								? 'Poetic composition illustration'
								: 'Ілюстрація поетичної композиції'}
							width="1200"
							height="805"
							class="hero-art-img"
							loading="eager"
							decoding="async"
						/>
					</div>
				</section>
			{/if}

			<!-- Витончений підвал у самому низу плаката -->
			<footer class="poster-footer">
				<p class="poster-school">
					{isEn ? poster.schoolEn : poster.schoolUk}
				</p>
			</footer>
		</div>
	</article>
</div>

<style>
	/* Підключення рукописного каліграфічного шрифту для назви за референсом */
	@font-face {
		font-family: 'Marck Script';
		font-style: normal;
		font-weight: 400;
		font-display: swap;
		src: url('/fonts/MarckScript-Regular.woff2') format('woff2');
		unicode-range: U+0400-04FF, U+0500-052F, U+2DE0-2DFF, U+A640-A69F, U+1C80-1C88;
	}

	@font-face {
		font-family: 'Marck Script';
		font-style: normal;
		font-weight: 400;
		font-display: swap;
		src: url('/fonts/MarckScript-Latin.woff2') format('woff2');
		unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
	}

	/* Каркас плаката формату A4 (суворо витриманий 210/297, max-width 900px як і в dance-studio) */
	.poster-frame {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
		container-type: inline-size;
	}

	.defenders-poster {
		position: relative;
		width: 100%;
		aspect-ratio: 210 / 297;
		background: var(--poster-bg, #fffdf2);
		border-radius: clamp(16px, 2.4cqi, 30px);
		box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(217, 119, 6, 0.2);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding: clamp(14px, 2.6cqi, 28px);
	}

	/* Фон для однотонного режиму з м'яким сонячним сяйвом */
	.defenders-poster:not(.defenders-poster--art-bg)::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 0%, rgba(0, 181, 236, 0.12) 0%, transparent 60%), radial-gradient(circle at 50% 100%, rgba(255, 237, 0, 0.18) 0%, transparent 65%);
		pointer-events: none;
		z-index: 0;
	}

	/* Повнорозмірний художній фон */
	.full-bleed-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 28%;
		z-index: 0;
		pointer-events: none;
	}

	/* Для фону "синьо-жовте небо із заходом сонця" - фіксація силуету дівчини внизу */
	.full-bleed-bg--sky {
		object-position: center bottom;
	}

	.art-bg-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(15, 23, 42, 0.42) 0%, rgba(15, 23, 42, 0.18) 25%, transparent 45%, transparent 75%, rgba(15, 23, 42, 0.35) 100%);
		z-index: 1;
		pointer-events: none;
	}

	/* Декоративні фірмові мікро-частки по кутах */
	.corner-icons-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}

	.corner-icon {
		position: absolute;
		width: clamp(42px, 6cqi, 68px);
		height: clamp(42px, 6cqi, 68px);
		object-fit: contain;
		opacity: 0.5;
		filter: brightness(0) saturate(100%) invert(88%) sepia(90%) saturate(2200%) hue-rotate(352deg) brightness(102%) contrast(105%) drop-shadow(0 3px 8px rgba(0, 0, 0, 0.55));
	}

	.defenders-poster--art-bg .corner-icon {
		opacity: 0.5;
		filter: brightness(0) saturate(100%) invert(88%) sepia(90%) saturate(2200%) hue-rotate(352deg) brightness(102%) contrast(105%) drop-shadow(0 3px 8px rgba(0, 0, 0, 0.6));
	}

	/* Кутові координати іконок у 14% зовнішніх маргінесах */
	.pos-top-left { top: clamp(12px, 2cqi, 20px); left: clamp(12px, 2cqi, 20px); }
	.pos-top-left-sub { top: clamp(12px, 2cqi, 20px); left: clamp(56px, 8.4cqi, 88px); }
	.pos-mid-upper-left { top: clamp(58px, 8.8cqi, 92px); left: clamp(12px, 2cqi, 20px); }

	.pos-top-right { top: clamp(12px, 2cqi, 20px); right: clamp(12px, 2cqi, 20px); }
	.pos-top-right-sub { top: clamp(12px, 2cqi, 20px); right: clamp(56px, 8.4cqi, 88px); }
	.pos-mid-upper-right { top: clamp(58px, 8.8cqi, 92px); right: clamp(12px, 2cqi, 20px); }
	.pos-mid-lower-left { bottom: clamp(100px, 14cqi, 150px); left: clamp(12px, 2cqi, 20px); }
	.pos-bot-sub-left { bottom: clamp(56px, 8.4cqi, 88px); left: clamp(12px, 2cqi, 20px); }
	.pos-bot-corner-left { bottom: clamp(12px, 2cqi, 20px); left: clamp(12px, 2cqi, 20px); }
	.pos-mid-lower-right { bottom: clamp(100px, 14cqi, 150px); right: clamp(12px, 2cqi, 20px); }
	.pos-bot-sub-right { bottom: clamp(56px, 8.4cqi, 88px); right: clamp(12px, 2cqi, 20px); }
	.pos-bot-corner-right { bottom: clamp(12px, 2cqi, 20px); right: clamp(12px, 2cqi, 20px); }

	/* Центральний контент — ширина 76% витримує безпечну зону від кутових часток */
	.poster-content {
		position: relative;
		z-index: 3;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 76%;
		max-width: 76%;
		margin: 0 auto;
		text-align: center;
	}

	/* Шапка: займає понад 50% площі постера за вимогами користувача */
	.poster-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: clamp(8px, 1.3cqi, 16px);
		margin-top: clamp(6px, 1cqi, 14px);
		flex-shrink: 0;
	}

	.emblem-wrap {
		display: flex;
		justify-content: center;
		margin-bottom: clamp(2px, 0.4cqi, 6px);
	}

	.emblem-img {
		width: clamp(195px, 31cqi, 300px);
		height: auto;
		filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.4));
	}

	/* Жовтий живописний малярний мазок із розкладом ОДРАЗУ ПІСЛЯ ЛОГО */
	.top-schedule-wrap {
		position: relative;
		width: 100%;
		max-width: 550px;
		min-height: clamp(118px, 17.5cqi, 165px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(14px, 2.2cqi, 22px) clamp(20px, 3.6cqi, 38px) clamp(16px, 2.4cqi, 24px);
		box-sizing: border-box;
		margin: clamp(2px, 0.4cqi, 6px) 0 clamp(4px, 0.8cqi, 10px);
	}

	.brush-banner-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.38));
		pointer-events: none;
		object-fit: fill;
	}

	.brush-banner-content {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(4px, 0.7cqi, 8px);
		text-align: center;
		width: 100%;
	}

	.dates-stack {
		display: flex;
		flex-direction: column;
		gap: clamp(4px, 0.7cqi, 8px);
		width: 100%;
	}

	.date-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: clamp(8px, 1.2cqi, 12px);
		color: #072247;
		line-height: 1.15;
		letter-spacing: -0.015em;
	}

	.date-strong {
		font-size: clamp(18px, 2.9cqi, 27px);
		font-weight: 900;
		color: #051c3d;
	}

	.date-time {
		display: inline-flex;
		align-items: baseline;
		gap: clamp(3px, 0.5cqi, 6px);
		color: #0d3266;
	}
	.date-prep { font-size: clamp(15px, 2.4cqi, 22px); font-weight: 800; color: #0d3266; }
	.time-val {
		display: inline-flex;
		align-items: flex-start;
		font-weight: 900;
		color: #051c3d;
		line-height: 1;
	}
	.time-h { font-size: clamp(20px, 3.2cqi, 30px); line-height: 1; letter-spacing: -0.02em; }

	.time-m {
		font-size: clamp(12px, 1.9cqi, 17px);
		font-weight: 900;
		line-height: 1;
		margin-top: 1px;
		margin-left: 1px;
		font-feature-settings: 'tnum';
	}

	.venue-pill {
		font-size: clamp(12px, 1.8cqi, 16px);
		font-weight: 800;
		background: rgba(7, 34, 71, 0.12);
		color: #072247;
		padding: 2px 8px;
		border-radius: 999px;
		letter-spacing: 0.02em;
	}

	.school-caption {
		font-size: clamp(10px, 1.5cqi, 13.5px);
		font-weight: 800;
		color: #082452;
		margin-top: 3px;
		letter-spacing: 0.01em;
		opacity: 0.95;
		white-space: nowrap;
	}

	/* Підзаголовок та присвята за референсом */
	.header-titles {
		display: flex;
		flex-direction: column;
		gap: clamp(3px, 0.5cqi, 6px);
		max-width: 580px;
		margin: clamp(4px, 0.6cqi, 10px) auto 0;
	}

	.header-subtitle-line {
		margin: 0;
		font-size: clamp(16px, 2.5cqi, 23px);
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95), 0 0 14px rgba(0, 0, 0, 0.75);
		line-height: 1.25;
	}

	.header-occasion-line {
		margin: 0;
		font-size: clamp(17px, 2.7cqi, 25px);
		font-weight: 800;
		color: #fef08a;
		letter-spacing: 0.015em;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95), 0 0 14px rgba(0, 0, 0, 0.75);
		line-height: 1.25;
		white-space: nowrap;
	}

	.header-author-line {
		margin: 0;
		font-size: clamp(14px, 2.2cqi, 20px);
		font-weight: 700;
		color: #e2e8f0;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 5px rgba(0, 0, 0, 0.9);
		line-height: 1.25;
	}

	/* Головна назва в стилі художньої каліграфії за референсом */
	.main-title {
		margin: clamp(6px, 1cqi, 14px) 0 0;
		font-family: 'Marck Script', cursive, sans-serif;
		font-size: clamp(46px, 7.4cqi, 72px);
		font-weight: 400;
		color: #ffffff;
		line-height: 1.15;
		letter-spacing: -0.01em;
		text-shadow: 0 3px 12px rgba(0, 0, 0, 0.95), 0 0 26px rgba(0, 0, 0, 0.85);
	}

	.title-line {
		display: block;
		white-space: nowrap;
	}

	.title-brush-accent {
		display: flex;
		justify-content: center;
		width: 100%;
		max-width: clamp(180px, 30cqi, 280px);
		margin-top: clamp(4px, 0.7cqi, 10px);
	}

	.brush-accent-img {
		width: 100%;
		height: clamp(10px, 1.6cqi, 16px);
		filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.4));
		display: block;
	}

	/* Простір, де повністю видно краєвид, силует чи захисників */
	.art-visual-spacer {
		flex: 1;
		min-height: clamp(80px, 14cqi, 180px);
	}

	/* Рамка з картиною для однотонного фону */
	.hero-art-section {
		display: flex;
		justify-content: center;
		width: 100%;
		margin: clamp(6px, 1.2cqi, 14px) 0;
	}

	.hero-art-frame {
		position: relative;
		width: 100%;
		max-width: 580px;
		aspect-ratio: 1200 / 805;
		border-radius: clamp(14px, 2.2cqi, 20px);
		overflow: hidden;
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08);
		border: 3px solid #ffdd00;
		background: #0f172a;
	}

	.hero-art-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Витончений підвал у самому низу плаката */
	.poster-footer {
		display: flex;
		justify-content: center;
		padding-bottom: clamp(4px, 0.8cqi, 10px);
	}

	.poster-school {
		margin: 0;
		font-size: clamp(11px, 1.6cqi, 14px);
		font-weight: 800;
		color: #ffffff;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95);
		letter-spacing: 0.02em;
	}

	.defenders-poster:not(.defenders-poster--art-bg) .poster-school {
		color: #1e293b;
		text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
	}

	/* Адаптивність для вузьких екранів: зберігає правильні пропорції A4 */
	@container (max-width: 580px) {
		.defenders-poster {
			padding: 16px 10px;
		}

		.corner-icons-layer {
			display: none;
		}

		.poster-content {
			width: 92%;
			max-width: 92%;
		}

		.date-row {
			gap: 4px;
		}

		.school-caption {
			white-space: normal;
		}
	}

	/* Друк на формат A4 без полів */
	@media print {
		.poster-frame {
			width: 100% !important;
			max-width: none !important;
			margin: 0 !important;
			padding: 0 !important;
		}

		.defenders-poster {
			width: 210mm !important;
			height: 297mm !important;
			aspect-ratio: 210 / 297 !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			border: none !important;
			margin: 0 !important;
			padding: 5mm 6mm !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
		}

		.poster-content {
			width: 82% !important;
			max-width: 82% !important;
		}
	}
</style>
