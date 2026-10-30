<script lang="ts">
	import { asset } from '$app/paths';
	import { UART_SECRETS_BOOKLET } from '$lib/data/uartSecretsBooklet';

	interface Props {
		isEn?: boolean;
		themeId?: string;
		schoolLogoVariant?: 'crest' | 'logo2026';
		onToggleLogo?: () => void;
	}

	let {
		isEn = false,
		themeId = 'uart-dark',
		schoolLogoVariant = 'crest',
		onToggleLogo
	}: Props = $props();

	const data = UART_SECRETS_BOOKLET;
	const isLight = $derived(themeId === 'uart-light');
</script>

<div
	class="booklet-sheet cover-sheet"
	class:cover-sheet--light={isLight}
	data-testid="uart-booklet-cover-card"
	role="region"
	aria-label={isEn ? 'A4 Booklet Sheet 1 (Outer Covers)' : 'Аркуш 1 буклету A4 (Зовнішні обкладинки)'}
>
	<!-- Ліва половина: Задня обкладинка (Back Cover, A5) -->
	<section
		class="sheet-half sheet-half--left back-cover"
		aria-label={isEn ? 'Back Cover' : 'Задня обкладинка'}
	>
		<div class="image-wrapper">
			<img
				src={asset(data.coverLeftImage)}
				alt={isEn
					? 'Back cover illustration with student portraits'
					: 'Ілюстрація задньої обкладинки з портретами виконавиць'}
				class="sheet-image"
				width="744"
				height="1051"
				loading="eager"
				decoding="async"
			/>
		</div>
	</section>

	<!-- Центральна лінія згину буклету навпіл -->
	<div class="sheet-fold-line" aria-hidden="true">
		<span class="fold-badge">{isEn ? 'fold line' : 'лінія згину'}</span>
	</div>

	<!-- Права половина: Лицьова обкладинка (Front Cover, A5) -->
	<section
		class="sheet-half sheet-half--right front-cover"
		aria-label={isEn ? 'Front Cover' : 'Лицьова обкладинка'}
	>
		<!-- Фонове зображення лицьової частини з графічною назвою «ДУЖЕ БАГАТО SEKPETIB» -->
		<div class="image-wrapper">
			<img
				src={asset(data.coverRightImage)}
				alt={isEn
					? 'Front cover artwork with Too Many Secrets title'
					: 'Художня назва вистави «Дуже багато SEкретів»'}
				class="sheet-image"
				width="744"
				height="1051"
				loading="eager"
				decoding="async"
			/>
		</div>

		<!-- Типографічний шар поверх фонового зображення -->
		<div class="front-cover-overlay">
			<!-- Шапка: офіційні організатори вистави -->
			<header class="cover-presenters" aria-label={isEn ? 'Presenters' : 'Організатори'}>
				{#each (isEn ? data.presentersEn : data.presentersUk) as presenter, i (i)}
					<p class="presenter-line" class:presenter-line--lead={i === 0}>{presenter}</p>
				{/each}
			</header>

			<!-- Вільний простір під графічну назву по центру (Y ~ 6% .. 36%) -->
			<div class="cover-title-gap" aria-hidden="true"></div>

			<!-- Блок під назвою: авторка пʼєси, віковий рейтинг та режисер -->
			<div class="cover-info-block">
				<p class="cover-author">
					{#if isEn}
						<span class="author-primary">Based on the play by Nina Zakhozhenko</span>
						<span class="author-secondary">and co-authors <span class="play-title">“Sex Education”</span></span>
					{:else}
						<span class="author-primary">за п’єсою Ніни Захоженко</span>
						<span class="author-secondary">та співавторок <span class="play-title">«Статеве виховання»</span></span>
					{/if}
				</p>

				<div class="cover-badge-row">
					<span class="age-badge" aria-label={isEn ? 'Age 14 plus' : 'Вікове обмеження 14+'}>
						{data.ageBadge}
					</span>
				</div>

				<p class="cover-director">
					{isEn ? data.directorEn : data.directorUk}
				</p>
			</div>

			<!-- Блок логотипів партнерів внизу обкладинки (2-ярусна гармонійна композиція) -->
			<footer class="cover-logos" aria-label={isEn ? 'Logos' : 'Логотипи партнерів'}>
				<div class="logos-upper-row">
					<div class="logo-box logo-box--uart">
						<img
							src={asset('/posters/uart-logo-dark.webp')}
							alt={isEn ? 'Educational Theatre UArt' : 'Навчальний театр «UArt»'}
							class="partner-logo partner-logo--uart"
							width="600" height="493" loading="eager" decoding="async"
						/>
					</div>
					<button
						type="button"
						class="logo-box logo-box--school"
						class:logo-box--interactive={!!onToggleLogo}
						onclick={onToggleLogo}
						disabled={!onToggleLogo}
						data-testid="uart-school-logo-toggle-btn"
						title={onToggleLogo ? (isEn ? 'School logo (click to switch)' : 'Лого школи (клікніть для зміни)') : undefined}
						aria-label={onToggleLogo ? (isEn ? 'Switch school logo variant' : 'Змінити варіант логотипу школи') : undefined}
					>
						<img
							src={asset(
								schoolLogoVariant === 'logo2026'
									? '/logo/svg/t4_logo_2026.svg'
									: '/posters/teatralo4ka-crest-dark.svg'
							)}
							alt={isEn
								? (schoolLogoVariant === 'logo2026' ? 'Odesa Theatre School Logo 2026' : 'Odesa Theatre School Crest')
								: (schoolLogoVariant === 'logo2026' ? 'Одеська театральна школа (Логотип 2026)' : 'Одеська театральна школа (Герб)')}
							class="partner-logo partner-logo--school"
							width={schoolLogoVariant === 'logo2026' ? 2125 : 1905}
							height={schoolLogoVariant === 'logo2026' ? 1367 : 1105}
							loading="eager"
							decoding="async"
						/>
					</button>
				</div>
				<div class="logos-lower-row">
					<div class="logo-box logo-box--pro-teatr">
						<img
							src={asset('/posters/pro-teatr-logo-dark.webp')}
							alt={isEn ? 'NGO PRO.THEATRE' : 'ГО «PRO.ТЕАТР»'}
							class="partner-logo partner-logo--pro-teatr"
							width="800" height="89" loading="eager" decoding="async"
						/>
					</div>
				</div>
			</footer>
		</div>
	</section>
</div>

<style>
	.booklet-sheet {
		position: relative;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: 100%;
		max-width: 1120px;
		aspect-ratio: 297 / 210;
		margin: 0 auto;
		background: #161217;
		color: #ffffff;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
		border: 1px solid rgba(255, 237, 0, 0.2);
	}

	.sheet-half { position: relative; height: 100%; overflow: hidden; }
	.image-wrapper { position: absolute; inset: 0; width: 100%; height: 100%; }
	.sheet-image { width: 100%; height: 100%; object-fit: cover; display: block; }
	.cover-title-gap { height: 26%; min-height: 40px; }
	.cover-badge-row { display: flex; justify-content: center; }
	.sheet-fold-line {
		position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
		background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 6px, transparent 6px, transparent 12px);
		z-index: 10; pointer-events: none; transform: translateX(-50%);
	}
	.fold-badge {
		position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7); color: #cbd5e1; font-size: 8px; text-transform: uppercase;
		letter-spacing: 0.08em; padding: 1px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255, 255, 255, 0.2);
	}

	/* Шар типографіки лицьової частини */
	.front-cover-overlay {
		position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between;
		padding: 5.2% 5% 6.5%; box-sizing: border-box; z-index: 5; text-align: center; pointer-events: none;
	}
	.cover-presenters { display: flex; flex-direction: column; gap: 3px; }
	.presenter-line {
		margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif;
		font-size: clamp(7.5px, 1.05cqi, 11px); line-height: 1.35; color: #f1f5f9;
		text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
	}
	.presenter-line--lead { margin-bottom: clamp(4px, 0.65cqi, 8px); }

	.cover-info-block {
		display: flex; flex-direction: column; align-items: center;
		gap: clamp(6px, 1.2cqi, 12px); margin-top: 0; margin-bottom: clamp(14px, 2.6cqi, 26px);
	}
	.cover-author {
		margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif;
		color: #ffffff; max-width: 92%; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
		display: flex; flex-direction: column; align-items: center; gap: 2px;
	}
	.author-primary { font-size: clamp(10px, 1.45cqi, 14.5px); font-weight: 600; line-height: 1.3; }
	.author-secondary { font-size: clamp(8.5px, 1.25cqi, 12.5px); font-weight: 500; line-height: 1.3; opacity: 0.95; }
	.play-title { white-space: nowrap; }

	.age-badge {
		display: inline-flex; align-items: center; justify-content: center;
		font-family: 'e-Ukraine', var(--font-body), sans-serif; font-weight: 700;
		font-size: clamp(9.5px, 1.25cqi, 13px); line-height: 1; padding: 3px 12px;
		border-radius: 9999px; color: #ffed00; border: 1.5px solid #ffed00;
		background: rgba(22, 18, 23, 0.85); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}
	.cover-director {
		margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif; font-weight: 700;
		font-size: clamp(9px, 1.35cqi, 13px); letter-spacing: 0.08em; color: #ffed00;
		text-transform: uppercase; text-shadow: 0 2px 5px rgba(0, 0, 0, 0.9);
	}
	.cover-logos {
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		gap: clamp(10px, 1.6cqi, 16px); padding: 0; width: 100%; max-width: 90%; margin: 0 auto;
	}
	.logos-upper-row { display: flex; align-items: center; justify-content: center; gap: clamp(24px, 4.6cqi, 48px); width: 100%; }
	.logos-lower-row { display: flex; align-items: center; justify-content: center; width: 100%; }
	.logo-box { display: flex; align-items: center; justify-content: center; }
	.logo-box--uart, .logo-box--school { height: clamp(34px, 5.2cqi, 52px); }
	.logo-box--interactive {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.18s ease, filter 0.18s ease;
	}
	.logo-box--interactive:hover {
		transform: scale(1.05);
	}
	.logo-box--interactive:focus-visible {
		outline: 2px solid #ffed00;
		outline-offset: 4px;
		border-radius: 4px;
	}
	.logo-box--pro-teatr { width: clamp(210px, 32cqi, 300px); max-width: 95%; }
	.partner-logo { width: auto; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6)); }
	.partner-logo--uart, .partner-logo--school { height: 100%; width: auto; max-height: 100%; max-width: 100%; }
	.partner-logo--pro-teatr { width: 100%; height: auto; }

	/* Стилі друку */
	@media print {
		.booklet-sheet { width: 297mm !important; height: 210mm !important; max-width: none !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; border: none !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
		.sheet-fold-line { display: none !important; }
		.presenter-line { font-size: 7.2pt !important; line-height: 1.25 !important; }
		.presenter-line--lead { margin-bottom: 2mm !important; }
		.author-primary { font-size: 10.5pt !important; }
		.author-secondary { font-size: 9pt !important; }
		.play-title { white-space: nowrap !important; }
		.age-badge { font-size: 9pt !important; padding: 1.5mm 4.5mm !important; }
		.cover-director { font-size: 9.5pt !important; }
		.cover-info-block { margin-bottom: 5mm !important; }
		.cover-logos { gap: 3.5mm !important; }
		.logos-upper-row { gap: 10mm !important; }
		.logo-box--uart, .logo-box--school { height: 12mm !important; }
		.logo-box--pro-teatr { width: 62mm !important; }
	}
</style>
