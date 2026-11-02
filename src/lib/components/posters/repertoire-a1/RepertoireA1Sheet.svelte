<script lang="ts">
	import { asset } from '$app/paths';
	import { REPERTOIRE_NOVEMBER_2026 } from '$lib/data/repertoireNovember2026';

	export type RepertoireBgKey = 'theatre' | 'black' | 'yellow' | 'white' | 'blue';
	export type RepertoireLayoutKey = 'timeline5' | 'merged4';

	interface Props {
		isEn?: boolean;
		bgVariant?: RepertoireBgKey;
		accentVariant?: 'yellow' | 'white' | 'red';
		layoutVariant?: RepertoireLayoutKey;
		schoolLogoVariant?: 'crest' | 'logo2026';
		onToggleLogo?: () => void;
	}

	let {
		isEn = false,
		bgVariant = 'theatre',
		accentVariant = 'white',
		layoutVariant = 'timeline5',
		schoolLogoVariant = 'crest',
		onToggleLogo
	}: Props = $props();

	const data = REPERTOIRE_NOVEMBER_2026;
	const isLight = $derived(
		bgVariant === 'yellow' || bgVariant === 'white' || bgVariant === 'blue'
	);
	const currentEvents = $derived(
		layoutVariant === 'merged4' ? data.eventsMerged : data.events
	);
</script>

<article
	class="a1-sheet"
	class:a1-sheet--theatre={bgVariant === 'theatre'}
	class:a1-sheet--black={bgVariant === 'black'}
	class:a1-sheet--yellow={bgVariant === 'yellow'}
	class:a1-sheet--white={bgVariant === 'white'}
	class:a1-sheet--blue={bgVariant === 'blue'}
	class:a1-sheet--light={isLight}
	class:accent--yellow={accentVariant === 'yellow'}
	class:accent--white={accentVariant === 'white'}
	class:accent--red={accentVariant === 'red'}
	data-testid="repertoire-nov-a1-card"
	aria-label={isEn ? 'November 2026 Repertoire Poster A1' : 'Афіша A1: Репертуар на листопад 2026'}
>
	<div class="sheet-canvas">
		<!-- 1. Шапка: Департамент -> Логотипи (Школа -> PRO.ТЕАТР -> UArt) -> репертUArt -->
		<header class="poster-header">
			<p class="dept-line">
				{isEn
					? 'Department of Culture, Tourism and Cultural Heritage Protection of Odesa City Council'
					: 'Департамент культури, туризму та охорони культурної спадщини Одеської міської ради'}
			</p>

			<!-- Три повноцінні логотипи: Школа (Герб у долоньках) · ГО «PRO.ТЕАТР» · Навчальний театр «UArt» -->
			<div class="partner-logos">
				<button
					type="button"
					class="logo-switch-btn"
					onclick={onToggleLogo}
					disabled={!onToggleLogo}
					data-testid="repertoire-a1-logo-toggle-btn"
					title={onToggleLogo ? (isEn ? 'Switch school logo' : 'Змінити логотип школи') : undefined}
				>
					<img
						src={asset(
							schoolLogoVariant === 'logo2026'
								? '/logo/svg/t4_logo_2026.svg'
								: isLight
									? '/brand/big-emblem/svg/big-emblem-2025-color-color-hands-text.svg'
									: '/brand/big-emblem/svg/big-emblem-2025-color-white-text.svg'
						)}
						alt={isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}
						class="p-logo p-logo--school"
						width="1905"
						height="1105"
						loading="eager"
						decoding="async"
					/>
				</button>

				<img
					src={asset(
						isLight
							? '/brand/theatre-projects/pro-teatr-logo-transparent-light.webp'
							: '/posters/pro-teatr-logo-dark.webp'
					)}
					alt={isEn ? 'NGO PRO.THEATRE' : 'ГО «PRO.ТЕАТР»'}
					class="p-logo p-logo--pro"
					width="800"
					height="89"
					loading="eager"
					decoding="async"
				/>

				<img
					src={asset(
						isLight
							? '/brand/theatre-projects/uart-logo-transparent-light.webp'
							: '/posters/uart-logo-dark.webp'
					)}
					alt={isEn ? 'Educational Theatre UArt' : 'Навчальний театр «UArt»'}
					class="p-logo p-logo--uart"
					width="600"
					height="493"
					loading="eager"
					decoding="async"
				/>
			</div>

			<h1 class="main-title">
				реперт<span class="main-title-uart">UArt</span>
				<span class="main-title-date">{isEn ? 'for November 2026' : 'на листопад 2026'}</span>
			</h1>
		</header>

		<!-- 2. Репертуарний блок: 5 хронологічних дат або 4 об'єднані вистави -->
		<section class="events-list" class:events-list--merged4={layoutVariant === 'merged4'}>
			{#each currentEvents as ev (ev.id)}
				<div class="event-card" data-testid={`event-card-${ev.id}`}>
					<!-- Ліва колонка: день, місяць та час вистави -->
					<div class="event-date-col">
						<span class="date-num" class:date-num--double={ev.dateDay.includes(',')}>{ev.dateDay}</span>
						<div class="date-meta">
							<span class="date-month">{isEn ? ev.dateMonthEn : ev.dateMonthUk}</span>
							<span class="date-day">{isEn ? ev.dayOfWeekEn : ev.dayOfWeekUk} · {ev.time}</span>
						</div>
					</div>

					<!-- Центральна колонка: художній арт 16:9 -->
					<div class="event-image-wrap">
						<img
							src={asset(ev.image)}
							alt={isEn ? ev.titleEn : ev.titleUk}
							class="event-img"
							width="1376"
							height="768"
							loading="eager"
							decoding="async"
						/>
						{#if ev.ageBadge}
							<span class="event-age-tag">{ev.ageBadge}</span>
						{/if}
					</div>

					<!-- Права колонка: бейдж, назва, жанр та постановники -->
					<div class="event-info-col">
						<div class="event-badge-row">
							{#if ev.tagUk}
								<span class="event-tag">{isEn ? ev.tagEn : ev.tagUk}</span>
							{/if}
						</div>

						<h2 class="event-title">{isEn ? ev.titleEn : ev.titleUk}</h2>
						<p class="event-genre">{isEn ? ev.genreEn : ev.genreUk}</p>

						<div class="event-credits">
							{#if ev.authorUk}
								<p class="credit-line">{isEn ? ev.authorEn : ev.authorUk}</p>
							{/if}
							{#if ev.directorUk}
								<p class="credit-line">{isEn ? ev.directorEn : ev.directorUk}</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</section>

		<!-- 3. Підвал: контакти школи, обидва номери телефонів та спільний QR-код concert.ua -->
		<footer class="poster-footer">
			<div class="footer-contacts">
				<p class="contacts-inst">{isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}</p>
				<p class="contacts-addr">{isEn ? data.locationEn : data.locationUk}</p>
				<div class="contacts-phones-wrap">
					{#each data.contactPhones as phone (phone.raw)}
						<p class="contacts-phone-item">{phone.formatted}</p>
					{/each}
				</div>
			</div>

			<div class="footer-qr-slot">
				<img
					src={asset(data.ticketQrCode)}
					alt={isEn ? 'concert.ua/uk/talent/navchalnii-teatr-uart' : 'Квитки на concert.ua'}
					class="footer-qr-img"
					width="1000"
					height="1000"
					loading="eager"
					decoding="async"
				/>
				<span class="qr-label">{isEn ? 'CONCERT.UA TICKETS' : 'КВИТКИ НА CONCERT.UA'}</span>
			</div>
		</footer>
	</div>
</article>

<style>
	.a1-sheet {
		--sheet-accent: #ffffff;
		--sheet-border: rgba(255, 255, 255, 0.25);
		--sheet-card-bg: rgba(255, 255, 255, 0.05);

		box-sizing: border-box;
		position: relative;
		width: 100%;
		height: 100%;
		aspect-ratio: 594 / 841;
		background: #000000;
		color: #ffffff;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		container-type: inline-size;
		overflow: hidden;
		transition: background-color 0.25s ease;
		-webkit-print-color-adjust: exact !important;
		print-color-adjust: exact !important;
	}

	.a1-sheet.accent--yellow {
		--sheet-accent: #ffed00;
		--sheet-border: rgba(255, 237, 0, 0.45);
	}

	.a1-sheet.accent--red {
		--sheet-accent: #dc2626;
		--sheet-border: rgba(220, 38, 38, 0.45);
	}

	/* 5 варіантів фону */
	.a1-sheet.a1-sheet--theatre {
		background: #171118;
		color: #ffffff;
	}

	.a1-sheet.a1-sheet--black {
		background: #000000;
		color: #ffffff;
	}

	.a1-sheet.a1-sheet--yellow {
		background: #ffed00;
		color: #111827;
		--sheet-card-bg: rgba(255, 255, 255, 0.94);
		--sheet-border: rgba(0, 0, 0, 0.12);
	}

	.a1-sheet.a1-sheet--white {
		background: #ffffff;
		color: #111827;
		--sheet-card-bg: rgba(0, 0, 0, 0.03);
		--sheet-border: rgba(0, 0, 0, 0.14);
	}

	.a1-sheet.a1-sheet--blue {
		background: #cfe2f3;
		color: #0f172a;
		--sheet-card-bg: rgba(255, 255, 255, 0.94);
		--sheet-border: rgba(15, 23, 42, 0.12);
	}

	/* Світлі теми */
	.a1-sheet--light .main-title {
		color: #111827;
		text-shadow: none;
	}

	.a1-sheet--light .event-title {
		color: #111827;
	}

	.a1-sheet--light .date-day {
		background: rgba(0, 0, 0, 0.08);
		color: #111827;
	}

	.a1-sheet--light.accent--yellow {
		--sheet-accent: #0f172a;
		--sheet-border: rgba(0, 0, 0, 0.2);
	}

	.a1-sheet--light.accent--white {
		--sheet-accent: #0f172a;
		--sheet-border: rgba(0, 0, 0, 0.15);
	}

	.a1-sheet--light.accent--red {
		--sheet-accent: #dc2626;
		--sheet-border: rgba(220, 38, 38, 0.35);
	}

	.sheet-canvas {
		box-sizing: border-box;
		position: relative;
		width: 100%;
		height: 100%;
		padding: 2.2cqi 3.2cqi;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	/* Шапка */
	.poster-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.4cqi;
	}

	.dept-line {
		margin: 0;
		font-size: clamp(8px, 1.2cqi, 13px);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		opacity: 0.75;
		max-width: 88cqi;
		line-height: 1.25;
	}

	.partner-logos {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3.8cqi;
		margin: 0.6cqi 0;
	}

	.logo-switch-btn {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: transform 0.15s ease;
	}

	.logo-switch-btn:hover {
		transform: scale(1.06);
	}

	.p-logo {
		height: 5.4cqi;
		width: auto;
		object-fit: contain;
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
	}

	.p-logo--school {
		height: 5.8cqi;
	}

	.p-logo--pro {
		height: 3.4cqi;
	}

	.p-logo--uart {
		height: 5.2cqi;
	}

	.a1-sheet--light .p-logo {
		filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.12));
	}

	.main-title {
		margin: 0.2cqi 0 0;
		font-size: clamp(26px, 4.8cqi, 54px);
		font-weight: 900;
		letter-spacing: 0.01em;
		line-height: 1.05;
		color: #ffffff;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.main-title-uart {
		color: var(--sheet-accent);
		letter-spacing: 0.03em;
	}

	.main-title-date {
		font-weight: 800;
	}

	/* Список подій */
	.events-list {
		display: flex;
		flex-direction: column;
		gap: 1.6cqi;
		margin: 1.2cqi 0;
		flex: 1;
		justify-content: space-evenly;
	}

	.events-list--merged4 {
		gap: 2.5cqi;
		margin: 1.6cqi 0;
	}

	.event-card {
		display: flex;
		align-items: center;
		gap: 2.6cqi;
		background: var(--sheet-card-bg);
		border: 1.5px solid var(--sheet-border);
		border-radius: 1.8cqi;
		padding: 1.5cqi 2.4cqi;
		box-sizing: border-box;
		position: relative;
	}

	.events-list--merged4 .event-card {
		padding: 1.8cqi 2.6cqi;
	}

	.event-date-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 12cqi;
		text-align: center;
		border-right: 1.5px solid var(--sheet-border);
		padding-right: 2.2cqi;
		flex-shrink: 0;
	}

	.date-num {
		font-size: clamp(26px, 5.4cqi, 60px);
		font-weight: 900;
		line-height: 0.92;
		color: var(--sheet-accent);
		letter-spacing: -0.02em;
	}

	.date-num--double {
		font-size: clamp(20px, 3.8cqi, 44px);
		letter-spacing: -0.03em;
		white-space: nowrap;
	}

	.date-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2cqi;
		margin-top: 0.4cqi;
	}

	.date-month {
		font-size: clamp(10px, 1.45cqi, 16px);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.88;
	}

	.date-day {
		font-size: clamp(10px, 1.45cqi, 16px);
		font-weight: 900;
		color: var(--sheet-accent);
		background: rgba(255, 255, 255, 0.12);
		border-radius: 0.6cqi;
		padding: 0.2cqi 0.7cqi;
	}

	/* Арт 16:9 */
	.event-image-wrap {
		position: relative;
		width: 26cqi;
		aspect-ratio: 16 / 9;
		border-radius: 1.3cqi;
		overflow: hidden;
		flex-shrink: 0;
		border: 1px solid var(--sheet-border);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
	}

	.events-list--merged4 .event-image-wrap {
		width: 28cqi;
	}

	.event-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.event-age-tag {
		position: absolute;
		top: 0.5cqi;
		right: 0.5cqi;
		background: rgba(0, 0, 0, 0.8);
		color: var(--sheet-accent);
		border: 1px solid var(--sheet-accent);
		font-size: clamp(8px, 1.2cqi, 13px);
		font-weight: 900;
		border-radius: 0.4cqi;
		padding: 0.2cqi 0.5cqi;
		backdrop-filter: blur(4px);
	}

	/* Текст про виставу */
	.event-info-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-width: 0;
		gap: 0.35cqi;
	}

	.event-badge-row {
		display: flex;
		align-items: center;
		gap: 0.8cqi;
		flex-wrap: wrap;
	}

	.event-tag {
		font-size: clamp(9px, 1.3cqi, 14px);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #111827;
		background: var(--sheet-accent);
		padding: 0.2cqi 0.7cqi;
		border-radius: 0.5cqi;
	}

	.accent--white .event-tag {
		background: #ffffff;
		color: #111827;
	}

	.accent--yellow .event-tag {
		background: #ffed00;
		color: #111827;
	}

	.accent--red .event-tag {
		background: #dc2626;
		color: #ffffff;
	}

	.event-title {
		margin: 0.15cqi 0;
		font-size: clamp(18px, 3.1cqi, 36px);
		font-weight: 900;
		line-height: 1.15;
		color: #ffffff;
		letter-spacing: -0.01em;
		white-space: pre-line;
	}

	.events-list--merged4 .event-title {
		font-size: clamp(19px, 3.4cqi, 40px);
	}

	.event-genre {
		margin: 0;
		font-size: clamp(11px, 1.65cqi, 19px);
		font-weight: 700;
		color: var(--sheet-accent);
		text-transform: none;
	}

	.event-credits {
		display: flex;
		flex-direction: column;
		gap: 0.15cqi;
		font-size: clamp(10px, 1.35cqi, 15px);
		line-height: 1.25;
		opacity: 0.9;
		margin-top: 0.2cqi;
	}

	.credit-line {
		margin: 0;
		word-break: keep-all;
	}

	/* Підвал */
	.poster-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 1.8cqi;
		border-top: 1.5px solid var(--sheet-border);
		gap: 2cqi;
	}

	.footer-contacts {
		display: flex;
		flex-direction: column;
		gap: 0.2cqi;
		font-size: clamp(11px, 1.5cqi, 17px);
		line-height: 1.3;
	}

	.contacts-inst {
		margin: 0;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--sheet-accent);
	}

	.contacts-addr {
		margin: 0 0 0.2cqi 0;
		opacity: 0.9;
	}

	.contacts-phones-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.1cqi;
	}

	.contacts-phone-item {
		margin: 0;
		font-weight: 800;
		letter-spacing: 0.02em;
	}

	.footer-qr-slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4cqi;
		background: #ffffff;
		padding: 0.8cqi 1.2cqi;
		border-radius: 1cqi;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
	}

	.footer-qr-img {
		width: 8cqi;
		height: 8cqi;
		display: block;
	}

	.qr-label {
		font-size: clamp(7px, 1cqi, 12px);
		font-weight: 900;
		letter-spacing: 0.06em;
		color: #111827;
		text-align: center;
	}

	@media print {
		.a1-sheet,
		.a1-sheet * {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			box-shadow: none !important;
			text-shadow: none !important;
		}

		.a1-sheet {
			height: 100% !important;
			max-height: 100dvh !important;
			width: auto !important;
			max-width: 100vw !important;
			aspect-ratio: 594 / 841 !important;
			margin: 0 auto !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
		}
	}
</style>
