<script lang="ts">
	import { asset } from '$app/paths';
	import { UART_SECRETS_BOOKLET } from '$lib/data/uartSecretsBooklet';

	interface Props {
		isEn?: boolean;
		isLight?: boolean;
		bgVariant?: 'black' | 'theatre';
		schoolLogoVariant?: 'crest' | 'logo2026';
		onToggleLogo?: () => void;
	}

	let {
		isEn = false,
		isLight = false,
		bgVariant = 'black',
		schoolLogoVariant = 'crest',
		onToggleLogo
	}: Props = $props();

	const data = UART_SECRETS_BOOKLET;
</script>

<article
	class="a1-sheet variant-3 theme-red"
	class:a1-sheet--theatre={bgVariant === 'theatre'}
	class:a1-sheet--light={isLight}
	data-testid="uart-a1-variant3-card"
	aria-label={isEn ? 'A1 Poster: Red (Modern)' : 'Афіша A1: Авангардний модерн (червоний)'}
>
	<div class="sheet-canvas">
		<!-- 1. ВЕРХНЯ ШАПКА: по центру -->
		<header class="top-header-center">
			<p class="dept-line">{isEn ? data.presentersEn[0] : data.presentersUk[0]}</p>

			<!-- Три логотипи по центру: 1) Театральна школа, 2) PRO.ТЕАТР, 3) UArt -->
			<div class="partner-logos-center">
				<button
					type="button"
					class="logo-switch-btn"
					onclick={onToggleLogo}
					disabled={!onToggleLogo}
					data-testid="uart-a1-v3-logo-toggle-btn"
					title={onToggleLogo ? (isEn ? 'Switch logo' : 'Змінити логотип школи') : undefined}
				>
					<img
						src={asset(schoolLogoVariant === 'logo2026' ? '/logo/svg/t4_logo_2026.svg' : '/posters/teatralo4ka-crest-dark.svg')}
						alt={isEn ? 'Odesa Theatre School' : 'Одеська театральна школа'}
						class="p-logo"
						width="450"
						height="450"
						loading="eager"
						decoding="async"
					/>
				</button>

				<img
					src={asset('/posters/pro-teatr-logo-dark.webp')}
					alt={isEn ? 'NGO PRO.THEATRE' : 'ГО «PRO.ТЕАТР»'}
					class="p-logo p-logo--pro"
					width="800"
					height="89"
					loading="eager"
					decoding="async"
				/>

				<img
					src={asset('/posters/uart-logo-dark.webp')}
					alt={isEn ? 'Educational Theatre UArt' : 'Навчальний театр «UArt»'}
					class="p-logo"
					width="600"
					height="493"
					loading="eager"
					decoding="async"
				/>
			</div>

			<p class="theatre-headline">{isEn ? data.theatreEn : data.theatreUk}</p>
		</header>

		<!-- 2. НАЗВА ВИСТАВИ: по центру на ~55% ширини з повітрям -->
		<section class="title-section-center">
			<img
				src={asset(data.a1TitleImage)}
				alt={isEn ? 'Too Many Secrets title' : 'Назва: «Дуже багато SEкретів»'}
				class="title-img-50"
				width="1136"
				height="698"
				loading="eager"
				decoding="async"
			/>
		</section>

		<!-- 3. КРЕДИТИ: над обличчями, під назвою (пʼєса, а під нею режисер) -->
		<section class="credits-strip-center">
			<p class="author-line">
				{#if isEn}
					Based on the play by Nina Zakhozhenko and co-authors <span class="play-hl">“Sex Education”</span>
				{:else}
					за п’єсою Ніни Захоженко та співавторок <span class="play-hl">«Статеве виховання»</span>
				{/if}
			</p>
			<h1 class="director-line">{isEn ? data.directorEn : data.directorUk}</h1>
		</section>

		<!-- 4. ПОРТРЕТИ: по центру на 95% ширини афіші (опущені нижче для балансу композиції) -->
		<section class="lineup-section-center">
			<img
				src={asset(data.a1LineupImage)}
				alt={isEn ? 'Cast portraits lineup' : 'Портрети акторського складу вистави'}
				class="lineup-img-95"
				width="1674"
				height="841"
				loading="eager"
				decoding="async"
			/>
		</section>

		<!-- Віковий ценз: по центру під обличчями -->
		<div class="age-badge-center">
			<span class="ev-pill-age">{data.ageBadge}</span>
		</div>

		<!-- 5. НИЖНЯ ЧАСТИНА: QR та дата/час у вільному просторі під обличчями, M на нижньому краї -->
		<footer class="bottom-container">
			<!-- Нижня ліва частина: Concert.ua QR у вільному просторі (не в самому куті) -->
			<div class="bottom-left-qr">
				<div class="qr-box">
					<img
						src={asset(data.concertUaQr)}
						alt={isEn ? 'Tickets on Concert.ua' : 'Квитки на Concert.ua'}
						class="qr-code-img"
						width="1000"
						height="1000"
						loading="eager"
						decoding="async"
					/>
					<span class="qr-caption">{isEn ? 'TICKETS ON CONCERT.UA' : 'КВИТКИ НА CONCERT.UA'}</span>
				</div>
			</div>

			<!-- В самому низу афіші: силует M впритул до нижнього краю без відступу -->
			<div class="bottom-center-graphic">
				<img
					src={asset(data.a1BottomImage)}
					alt=""
					class="bottom-img-m"
					width="575"
					height="627"
					loading="eager"
					decoding="async"
				/>
			</div>

			<!-- Нижня права частина: дата, час, тривалість у вільному просторі -->
			<div class="bottom-right-details">
				<div class="ev-date-card">
					<span class="ev-date-text">7.11</span>
				</div>
				<div class="ev-time-card">
					<span class="ev-time-text">{data.premiereTime}</span>
				</div>
				<div class="ev-dur-card">
					<span class="ev-pill-dur">{isEn ? data.durationEn : data.durationUk}</span>
				</div>
			</div>
		</footer>
	</div>
</article>

<style>
	.a1-sheet {
		--accent-color: #ef4444;
		--accent-border: rgba(239, 68, 68, 0.65);
		--accent-glow: rgba(239, 68, 68, 0.16);

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

	.a1-sheet.a1-sheet--theatre {
		background: #171118;
	}

	@media print {
		.a1-sheet,
		.a1-sheet * {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			box-shadow: none !important;
			text-shadow: none !important;
			filter: none !important;
		}

		.a1-sheet {
			background: #000000 !important;
			color: #ffffff !important;
			height: 100% !important;
			max-height: 100dvh !important;
			width: auto !important;
			max-width: 100vw !important;
			aspect-ratio: 594 / 841 !important;
			margin: 0 auto !important;
			border: none !important;
			overflow: hidden !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
			page-break-after: avoid !important;
			break-after: avoid !important;
		}

		.a1-sheet.a1-sheet--theatre {
			background: #171118 !important;
		}

		.qr-box,
		.ev-date-card,
		.ev-time-card,
		.ev-dur-card,
		.ev-pill-age,
		.ev-pill-dur {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			box-shadow: none !important;
		}
	}

	.a1-sheet--light {
		background: #09090e;
		color: #ffffff;
	}

	.sheet-canvas {
		box-sizing: border-box;
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		padding: 3.2cqi 3cqi 0;
		text-align: center;
	}

	/* 1. Верхня шапка: по центру */
	.top-header-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9cqi;
		width: 100%;
		margin-bottom: 0.8cqi;
	}

	.dept-line {
		margin: 0;
		font-size: 1.12cqi;
		color: #e2e8f0;
		font-weight: 500;
		line-height: 1.35;
		max-width: 85cqi;
	}

	.partner-logos-center {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2.6cqi;
		height: 4.4cqi;
		margin: 0.3cqi 0;
	}

	.p-logo {
		height: 100%;
		width: auto;
		object-fit: contain;
	}

	.p-logo--pro {
		max-width: 15.5cqi;
	}

	.logo-switch-btn {
		background: none;
		border: none;
		padding: 0;
		height: 100%;
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: opacity 0.15s ease;
	}
	.logo-switch-btn:hover {
		opacity: 0.8;
	}

	.theatre-headline {
		margin: 0;
		font-size: 1.5cqi;
		font-weight: 800;
		color: var(--accent-color);
		letter-spacing: 0.04em;
	}

	/* 2. Назва вистави: по центру на ~55% ширини з повітрям перед кредитами */
	.title-section-center {
		display: flex;
		justify-content: center;
		width: 100%;
		margin: 2.2cqi 0 1.8cqi;
	}

	.title-img-50 {
		width: 55cqi;
		max-width: 55%;
		height: auto;
		object-fit: contain;
		display: block;
	}

	/* 3. Кредити: над обличчями, під назвою (автор, під ним режисер) */
	.credits-strip-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8cqi;
		width: 100%;
		max-width: 90cqi;
		margin: 1.4cqi auto 3.8cqi;
	}

	.author-line {
		margin: 0;
		font-size: 1.45cqi;
		color: #ffffff;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.play-hl {
		font-weight: 700;
		color: var(--accent-color);
	}

	.director-line {
		margin: 0;
		font-size: 2.35cqi;
		font-weight: 900;
		letter-spacing: 0.06em;
		color: var(--accent-color);
		text-transform: uppercase;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
	}

	/* 4. Портрети: по центру на 95% ширини афіші (опущені нижче) */
	.lineup-section-center {
		display: flex;
		justify-content: center;
		width: 100%;
		margin: 0 0 1.2cqi;
	}

	.lineup-img-95 {
		width: 95cqi;
		max-width: 95%;
		height: auto;
		object-fit: contain;
		display: block;
		border-radius: 0.7cqi;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.85);
	}

	/* Віковий ценз: по центру прямо під обличчями (з комфортним відступом) */
	.age-badge-center {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin: 1.6cqi 0 0.8cqi;
		z-index: 2;
	}

	.ev-pill-age {
		background: #dc2626;
		color: #ffffff;
		padding: 0.55cqi 1.95cqi;
		border-radius: 1.2cqi;
		font-weight: 900;
		font-size: 2.1cqi;
		letter-spacing: 0.04em;
		box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
	}

	/* 5. Нижня частина: вільний простір під обличчями */
	.bottom-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		flex: 1;
		margin: 0;
		padding: 0 6cqi 1cqi;
		box-sizing: border-box;
	}

	/* Нижня ліва частина: Concert.ua QR у вільному просторі (не в самому куті) */
	.bottom-left-qr {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		margin-bottom: 1.5cqi;
	}

	.qr-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75cqi;
		background: rgba(18, 14, 22, 0.92);
		border: 0.3cqi solid var(--accent-border);
		border-radius: 1.7cqi;
		padding: 0.95cqi;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75), 0 0 16px var(--accent-glow);
	}

	.qr-code-img {
		width: 16.5cqi;
		height: 16.5cqi;
		border-radius: 1cqi;
		display: block;
	}

	.qr-caption {
		font-size: 1.1cqi;
		font-weight: 800;
		color: var(--accent-color);
		letter-spacing: 0.04em;
		text-align: center;
		white-space: nowrap;
	}

	/* В самому низу афіші: M впритул до нижнього краю без проміжку */
	.bottom-center-graphic {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1;
		display: block;
		line-height: 0;
		margin: 0;
		padding: 0;
		pointer-events: none;
	}

	.bottom-img-m {
		height: 24cqi;
		width: auto;
		max-height: 25cqi;
		object-fit: contain;
		display: block;
		margin: 0;
		padding: 0;
		filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.9));
	}

	/* Нижня права частина: дата, час, вік, тривалість у вільному просторі (не в самому куті) */
	.bottom-right-details {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.95cqi;
		margin-bottom: 1.5cqi;
	}

	.ev-date-card {
		background: rgba(16, 12, 20, 0.92);
		border: 0.3cqi solid var(--accent-border);
		border-radius: 1.7cqi;
		padding: 0.65cqi 3.3cqi;
		min-width: 17cqi;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7), 0 0 16px var(--accent-glow);
	}

	.ev-date-text {
		font-size: 3.45cqi;
		font-weight: 900;
		letter-spacing: 0.04em;
		color: #ffffff;
		white-space: nowrap;
	}

	.ev-time-card {
		background: rgba(16, 12, 20, 0.92);
		border: 0.3cqi solid var(--accent-border);
		border-radius: 1.7cqi;
		padding: 0.65cqi 3.3cqi;
		min-width: 17cqi;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7), 0 0 16px var(--accent-glow);
	}

	.ev-time-text {
		font-size: 3.45cqi;
		font-weight: 900;
		color: var(--accent-color);
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.ev-dur-card {
		display: flex;
		align-items: center;
	}

	.ev-pill-dur {
		background: rgba(28, 24, 34, 0.9);
		color: #cbd5e1;
		border: 0.25cqi solid var(--accent-border);
		padding: 0.55cqi 1.95cqi;
		border-radius: 1.05cqi;
		font-weight: 800;
		font-size: 1.7cqi;
		white-space: nowrap;
	}
</style>
