<script lang="ts">
	import { asset } from '$app/paths';
	import { DANCE_STUDIO_POSTER, POSTER_THEMES, DEFAULT_POSTER_THEME } from '$lib/data/posters';
	import { CalendarDays, Clock, MapPin, UserCheck } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = DEFAULT_POSTER_THEME }: Props = $props();

	const activeTheme = $derived(
		POSTER_THEMES.find((t) => t.id === themeId) ?? POSTER_THEMES[0]
	);

	// 12 фірмових мікро-часток у точних позиціях з референсу:
	// Верхній лівий кут: хлопавка (#10) та книга (#03) поруч, скрипковий ключ (#07) під ними
	// Верхній правий кут: храм (#08) та мікрофон (#06) поруч, софіт (#05) під ними
	// Нижній лівий кут: маски (#11), олівець (#04), зірка (#01) у самому куті
	// Нижній правий кут: гітара (#02), кінокамера (#09), палітра (#12) у самому куті
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

	const poster = DANCE_STUDIO_POSTER;
</script>

<div class="poster-frame" data-testid="dance-poster-container">
	<article
		class="dance-poster"
		style:--poster-bg={activeTheme.color}
		data-testid="dance-poster-card"
	>
		<!-- Великі декоративні мікро-частки по 4 кутах за референсом -->
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

		<!-- Основний контент афіші -->
		<div class="poster-content">
			<!-- Шапка: герб (дві маски), великі заголовки та лого СВОЇ -->
			<header class="poster-header">
				<div class="emblem-wrap">
					<img
						src={asset('/logo/svg/t4_logo_IndividualParticles_MasksTwo_2026.svg')}
						alt={isEn ? 'Odesa Theatre School Crest' : 'Герб Одеської театральної школи'}
						width="260"
						height="158"
						class="emblem-img"
						loading="eager"
						decoding="async"
					/>
				</div>

				<h1 class="main-headline">
					{isEn ? poster.headlineEn : poster.headlineUk}
				</h1>

				<h2 class="sub-headline">
					{isEn ? poster.subheadlineEn : poster.subheadlineUk}
				</h2>

				<div class="svoi-logo-wrap">
					<img
						src={asset('/logo/svg/svoi_dance_collective.svg')}
						alt={isEn ? 'Dance Collective SVOI' : 'Танцювальний колектив СВОЇ'}
						width="2330"
						height="925"
						class="svoi-logo-img"
						loading="eager"
						decoding="async"
					/>
				</div>
			</header>

			<!-- Картки вмісту -->
			<div class="poster-body">
				<!-- 1. Картка педагога з великим Telegram QR -->
				<section class="card card--teacher" data-testid="dance-poster-teacher-card">
					<div class="teacher-avatar-slot">
						<img
							src={asset(poster.teacher.photo)}
							alt={isEn ? poster.teacher.nameEn : poster.teacher.nameUk}
							width="720"
							height="1080"
							class="teacher-photo"
							loading="eager"
							decoding="async"
						/>
					</div>

					<div class="teacher-details">
						<div class="teacher-badge">
							<UserCheck size={18} aria-hidden="true" />
							<span>{isEn ? 'TEACHER & CHOREOGRAPHER' : 'ПЕДАГОГ-ХОРЕОГРАФ'}</span>
						</div>

						<h3 class="teacher-name">
							{isEn ? poster.teacher.nameEn : poster.teacher.nameUk}
						</h3>

						<p class="teacher-role">
							{isEn ? poster.teacher.roleEn : poster.teacher.roleUk}
						</p>
					</div>

					<div class="teacher-qr-slot" data-testid="dance-poster-teacher-qr-card">
						<img
							src={asset('/qr/tetiana-stohul-telegram-qr.svg')}
							alt={isEn ? 'Teacher Telegram QR' : 'Telegram QR-код викладача'}
							width="1000"
							height="1000"
							class="teacher-qr-img"
							loading="eager"
							decoding="async"
						/>
						<span class="teacher-qr-label">{isEn ? 'Join Telegram' : 'Запис у Telegram'}</span>
					</div>
				</section>

				<!-- 2. Картка розкладу -->
				<section class="card card--schedule" data-testid="dance-poster-schedule-card">
					<div class="schedule-head">
						<Clock size={26} class="schedule-icon" aria-hidden="true" />
						<h3 class="schedule-title">
							{isEn ? 'CLASS SCHEDULE' : 'РОЗКЛАД ЗАНЯТЬ'}
						</h3>
					</div>

					<div class="schedule-grid">
						{#each poster.schedule as item, i (i)}
							<div class="schedule-pill" data-testid={`schedule-item-${i}`}>
								<div class="pill-day">
									<CalendarDays size={18} class="pill-day-icon" aria-hidden="true" />
									<span>{isEn ? item.dayEn : item.dayUk}</span>
								</div>
								<div class="pill-time">
									{item.time}
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- 3. Картка запису (6 клас) -->
				<section class="card card--location" data-testid="dance-poster-location-card">
					<div class="location-badge-row">
						<div class="location-pin-wrap">
							<MapPin size={36} aria-hidden="true" />
						</div>
						<div class="location-text-col">
							<span class="location-label">
								{isEn ? 'WHERE TO SIGN UP' : 'ДЕ ЗАПИСУВАТИСЯ:'}
							</span>
							<strong class="location-highlight">
								{isEn ? poster.location.roomEn : poster.location.roomUk}
							</strong>
							<div class="location-address">
								<span class="location-building">
									{isEn ? poster.location.buildingEn : poster.location.buildingUk}
								</span>
								<span class="location-street">
									{isEn ? poster.location.addressEn : poster.location.addressUk}
								</span>
							</div>
						</div>
					</div>
				</section>
			</div>

			<!-- Нижній підвал афіші -->
			<footer class="poster-footer">
				<p class="poster-school">
					{isEn ? poster.schoolEn : poster.schoolUk}
				</p>
			</footer>
		</div>
	</article>
</div>

<style>
	.poster-frame {
		container-type: inline-size;
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
	}

	.dance-poster {
		position: relative;
		width: 100%;
		aspect-ratio: 210 / 297;
		background-color: var(--poster-bg, #ffed00);
		background-image: none;
		border-radius: clamp(16px, 2.4cqi, 30px);
		box-shadow:
			0 24px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		color: #111827;
		overflow: hidden;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: clamp(14px, 2.6cqi, 28px) clamp(16px, 2.8cqi, 32px);
		user-select: text;
	}

	/* Шар великих мікро-часток по кутах за референсом */
	.corner-icons-layer {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}

	.corner-icon {
		position: absolute;
		width: clamp(48px, 6.8cqi, 76px);
		height: clamp(48px, 6.8cqi, 76px);
		object-fit: contain;
		filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.16));
		opacity: 0.95;
	}

	/* Точні координати 4 кутових кластерів по 3 іконки як на референсі */
	/* 1. Верхній лівий кластер: Хлопавка, Книга, Скрипковий ключ */
	.pos-top-left { top: clamp(12px, 2.2cqi, 24px); left: clamp(12px, 2.2cqi, 24px); }
	.pos-top-left-sub { top: clamp(12px, 2.2cqi, 24px); left: clamp(66px, 9.5cqi, 106px); }
	.pos-mid-upper-left { top: clamp(68px, 9.8cqi, 110px); left: clamp(12px, 2.2cqi, 24px); }

	/* 2. Верхній правий кластер: Храм, Мікрофон, Софіт */
	.pos-top-right { top: clamp(12px, 2.2cqi, 24px); right: clamp(12px, 2.2cqi, 24px); }
	.pos-top-right-sub { top: clamp(12px, 2.2cqi, 24px); right: clamp(66px, 9.5cqi, 106px); }
	.pos-mid-upper-right { top: clamp(68px, 9.8cqi, 110px); right: clamp(12px, 2.2cqi, 24px); }

	/* 3. Нижній лівий кластер: Маски, Олівець, Зірка */
	.pos-mid-lower-left { bottom: clamp(122px, 17.5cqi, 190px); left: clamp(12px, 2.2cqi, 24px); }
	.pos-bot-sub-left { bottom: clamp(68px, 9.8cqi, 110px); left: clamp(12px, 2.2cqi, 24px); }
	.pos-bot-corner-left { bottom: clamp(12px, 2.2cqi, 24px); left: clamp(12px, 2.2cqi, 24px); }

	/* 4. Нижній правий кластер: Гітара, Камера, Палітра */
	.pos-mid-lower-right { bottom: clamp(122px, 17.5cqi, 190px); right: clamp(12px, 2.2cqi, 24px); }
	.pos-bot-sub-right { bottom: clamp(68px, 9.8cqi, 110px); right: clamp(12px, 2.2cqi, 24px); }
	.pos-bot-corner-right { bottom: clamp(12px, 2.2cqi, 24px); right: clamp(12px, 2.2cqi, 24px); }

	/* Центральний контент — ширина 78% гарантує, що картки не торкаються кутових іконок */
	.poster-content {
		position: relative;
		z-index: 2;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 78%;
		max-width: 78%;
		margin: 0 auto;
		text-align: center;
	}

	/* Шапка */
	.poster-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(4px, 0.8cqi, 10px);
		margin-top: clamp(24px, 3.8cqi, 44px);
	}

	.emblem-wrap {
		display: flex;
		justify-content: center;
		margin-bottom: clamp(14px, 2.2cqi, 24px);
	}

	.emblem-img {
		width: clamp(180px, 26cqi, 260px);
		height: auto;
		filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.16));
	}

	.main-headline {
		margin: 0;
		font-size: clamp(38px, 6.5cqi, 70px);
		font-weight: 900;
		line-height: 1.05;
		color: #e20413;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
	}

	.sub-headline {
		margin: 0;
		font-size: clamp(22px, 3.8cqi, 40px);
		font-weight: 800;
		line-height: 1.15;
		color: #0a2e52;
		text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
	}

	.svoi-logo-wrap {
		display: flex;
		justify-content: center;
		margin-top: clamp(4px, 0.8cqi, 12px);
	}

	.svoi-logo-img {
		width: clamp(240px, 36cqi, 400px);
		height: auto;
		filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.16));
	}

	/* Тіло афіші - збалансоване вертикально */
	.poster-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		gap: clamp(12px, 2cqi, 24px);
		margin: clamp(10px, 1.6cqi, 20px) 0;
	}

	.card {
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(8px);
		border: 1.5px solid rgba(255, 255, 255, 0.9);
		border-radius: clamp(18px, 2.6cqi, 28px);
		box-shadow:
			0 12px 28px -6px rgba(0, 0, 0, 0.12),
			0 2px 8px rgba(0, 0, 0, 0.04);
		padding: clamp(14px, 2.2cqi, 24px) clamp(16px, 2.6cqi, 28px);
		text-align: left;
		box-sizing: border-box;
	}

	/* 1. Картка педагога з великим Telegram QR */
	.card--teacher {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: clamp(14px, 2.2cqi, 26px);
	}

	.teacher-avatar-slot {
		position: relative;
		flex-shrink: 0;
		width: clamp(90px, 13cqi, 135px);
		aspect-ratio: 2 / 3;
	}

	.teacher-photo {
		width: 100%;
		height: 100%;
		border-radius: clamp(10px, 1.5cqi, 16px);
		object-fit: cover;
		object-position: center 15%;
		border: 3.5px solid #00b5ec;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
		display: block;
	}

	.teacher-details {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: clamp(3px, 0.6cqi, 8px);
	}

	.teacher-badge {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #e0f2fe;
		color: #0369a1;
		font-size: clamp(10px, 1.4cqi, 14px);
		font-weight: 800;
		letter-spacing: 0.06em;
		padding: 4px 12px;
		border-radius: 999px;
	}

	.teacher-name {
		margin: 0;
		font-size: clamp(22px, 3.2cqi, 34px);
		font-weight: 900;
		color: #0f172a;
		line-height: 1.15;
		letter-spacing: -0.01em;
	}

	.teacher-role {
		margin: 0;
		font-size: clamp(13px, 1.8cqi, 18px);
		font-weight: 700;
		color: #475569;
		line-height: 1.3;
	}

	.teacher-qr-slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		padding: clamp(8px, 1.2cqi, 14px);
		background: #ffffff;
		border: 2.5px solid #00b5ec;
		border-radius: clamp(14px, 2cqi, 20px);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
	}

	.teacher-qr-img {
		width: clamp(96px, 14cqi, 145px);
		height: clamp(96px, 14cqi, 145px);
		border-radius: 6px;
		display: block;
		object-fit: contain;
	}

	.teacher-qr-label {
		font-size: clamp(11px, 1.5cqi, 15px);
		font-weight: 800;
		color: #0077c8;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* 2. Картка розкладу */
	.card--schedule {
		background: rgba(255, 255, 255, 0.98);
		border-left: 6px solid #00b5ec;
	}

	.schedule-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: clamp(8px, 1.4cqi, 16px);
	}

	:global(.schedule-icon) {
		color: #0077c8;
	}

	.schedule-title {
		margin: 0;
		font-size: clamp(17px, 2.6cqi, 26px);
		font-weight: 900;
		color: #0a2e52;
		letter-spacing: 0.04em;
	}

	.schedule-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(10px, 1.8cqi, 20px);
	}

	.schedule-pill {
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: clamp(12px, 1.8cqi, 18px);
		padding: clamp(12px, 2cqi, 20px) clamp(8px, 1.5cqi, 16px);
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.pill-day {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: clamp(14px, 2.1cqi, 20px);
		font-weight: 800;
		color: #475569;
	}

	:global(.pill-day-icon) {
		color: #0284c7;
	}

	.pill-time {
		font-size: clamp(24px, 4cqi, 44px);
		font-weight: 900;
		color: #0284c7;
		letter-spacing: -0.01em;
		line-height: 1.1;
	}

	/* 3. Картка запису (6 клас) */
	.card--location {
		background: #ffffff;
		border: 2.5px dashed #e20413;
	}

	.location-badge-row {
		display: flex;
		align-items: center;
		gap: clamp(14px, 2.5cqi, 26px);
	}

	.location-pin-wrap {
		width: clamp(56px, 8.5cqi, 80px);
		height: clamp(56px, 8.5cqi, 80px);
		border-radius: 50%;
		background: #fee2e2;
		color: #b91c1c;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.location-text-col {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.location-label {
		font-size: clamp(12px, 1.8cqi, 17px);
		font-weight: 900;
		color: #dc2626;
		letter-spacing: 0.05em;
	}

	.location-highlight {
		font-size: clamp(24px, 3.8cqi, 40px);
		font-weight: 900;
		color: #0f172a;
		line-height: 1.15;
	}

	.location-address {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: clamp(12px, 1.8cqi, 18px);
		font-weight: 600;
		color: #64748b;
		line-height: 1.25;
	}

	.location-street {
		font-weight: 700;
		color: #334155;
		white-space: nowrap;
	}

	/* Підвал афіші */
	.poster-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: clamp(6px, 1cqi, 12px) 0 clamp(28px, 4.4cqi, 48px);
	}

	.poster-school {
		margin: 0;
		font-size: clamp(13px, 1.9cqi, 19px);
		font-weight: 800;
		color: #1e293b;
		text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
	}

	/* Адаптивність для вузьких мобільних екранів */
	@container (max-width: 580px) {
		.dance-poster {
			aspect-ratio: auto;
			padding: 24px 14px;
		}

		.corner-icons-layer {
			display: none;
		}

		.poster-content {
			width: 100%;
			max-width: 100%;
		}

		.schedule-grid {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.card--teacher {
			flex-direction: column;
			text-align: center;
		}

		.location-badge-row {
			flex-direction: column;
			text-align: center;
		}
	}

	/* Стилі друку: ідеальний A4 без полів */
	@media print {
		.poster-frame {
			width: 100% !important;
			max-width: none !important;
			margin: 0 !important;
			padding: 0 !important;
		}

		.dance-poster {
			width: 210mm !important;
			height: 297mm !important;
			aspect-ratio: 210 / 297 !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			margin: 0 !important;
			padding: 14mm 14mm !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
		}
	}
</style>
