<script lang="ts">
	import { asset } from '$app/paths';
	import { UART_DOSVID_BOOKLET } from '$lib/data/uartDosvidBooklet';

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

	const data = UART_DOSVID_BOOKLET;
	const isLight = $derived(themeId === 'uart-light');
</script>

<div
	class="booklet-sheet cover-sheet"
	class:cover-sheet--light={isLight}
	data-testid="uart-dosvid-cover-card"
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
					? 'Back cover artwork illustration'
					: 'Художня ілюстрація задньої обкладинки вистави'}
				class="sheet-image"
				width="744"
				height="1051"
				loading="eager"
				decoding="async"
			/>
		</div>

		<div class="back-cover-overlay">
			<div class="back-quote-card">
				<p class="back-quote-text">
					{isEn ? data.synopsisEn : data.synopsisUk}
				</p>
			</div>
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
		<div class="image-wrapper">
			<img
				src={asset(data.coverRightImage)}
				alt={isEn
					? 'Front cover artwork with teenagers and bread'
					: 'Художня афіша вистави «Досвід» (підлітки та хлібина)'}
				class="sheet-image"
				width="744"
				height="1051"
				loading="eager"
				decoding="async"
			/>
		</div>

		<div class="front-cover-overlay">
			<header class="cover-presenters" aria-label={isEn ? 'Presenters' : 'Організатори'}>
				{#each (isEn ? data.presentersEn : data.presentersUk) as presenter, i (i)}
					<p class="presenter-line" class:presenter-line--lead={i === 0}>{presenter}</p>
				{/each}
			</header>

			<div class="cover-title-block">
				<h1 class="cover-title-main">{isEn ? data.titleEn : data.titleUk}</h1>
				<p class="cover-title-genre">{isEn ? data.genreEn : data.genreUk}</p>
			</div>

			<div class="cover-info-block">
				<p class="cover-author">
					<span class="author-primary">{isEn ? data.authorEn : data.authorUk}</span>
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

			<footer class="cover-logos" aria-label={isEn ? 'Partners and Organizer Logos' : 'Логотипи партнерів та організаторів'}>
				<div class="logos-upper-row">
					<div class="logo-box logo-box--uart">
						<img
							src={asset(isLight ? '/posters/uart-logo-light.webp' : '/posters/uart-logo-dark.webp')}
							alt={isEn ? 'UArt Educational Theatre Logo' : 'Логотип Навчального театру «UArt»'}
							class="partner-logo partner-logo--uart"
							width="88"
							height="88"
							loading="eager"
							decoding="async"
						/>
					</div>

					<button
						type="button"
						class="logo-box logo-box--school logo-box--interactive"
						onclick={onToggleLogo}
						title={isEn
							? `School logo: click to switch to ${schoolLogoVariant === 'crest' ? '2026 emblem' : 'historical crest'}`
							: `Логотип школи: клікніть для перемикання на ${schoolLogoVariant === 'crest' ? 'емблему 2026' : 'історичний герб'}`}
						aria-label={isEn ? 'Switch school logo variant' : 'Змінити варіант логотипа школи'}
						data-testid="uart-school-logo-toggle"
					>
						{#if schoolLogoVariant === 'crest'}
							<img
								src={asset(isLight ? '/posters/teatralo4ka-crest-light.svg' : '/posters/teatralo4ka-crest-dark.svg')}
								alt={isEn ? 'Odesa Theatre School Historical Crest' : 'Історичний герб Одеської театральної школи'}
								class="partner-logo partner-logo--school"
								width="72"
								height="88"
								loading="eager"
								decoding="async"
							/>
						{:else}
							<img
								src={asset(isLight ? '/posters/teatralo4ka-logo-2026-light.webp' : '/posters/teatralo4ka-logo-2026-dark.webp')}
								alt={isEn ? 'Odesa Theatre School 2026 Emblem' : 'Емблема 2026 Одеської театральної школи'}
								class="partner-logo partner-logo--school"
								width="88"
								height="88"
								loading="eager"
								decoding="async"
							/>
						{/if}
					</button>
				</div>

				<div class="logos-lower-row">
					<div class="logo-box logo-box--pro-teatr">
						<img
							src={asset(isLight ? '/posters/pro-teatr-logo-light.webp' : '/posters/pro-teatr-logo-dark.webp')}
							alt={isEn ? 'NGO PRO.THEATRE Logo' : 'Логотип ГО «PRO.ТЕАТР»'}
							class="partner-logo partner-logo--pro-teatr"
							width="380"
							height="44"
							loading="eager"
							decoding="async"
						/>
					</div>
				</div>
			</footer>
		</div>
	</section>
</div>

<style>
	.booklet-sheet { position: relative; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1fr; width: 100%; max-width: 1120px; aspect-ratio: 297 / 210; margin: 0 auto; background: #161217; color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 237, 0, 0.2); container-type: inline-size; }
	.sheet-half { position: relative; height: 100%; overflow: hidden; }
	.image-wrapper { position: absolute; inset: 0; width: 100%; height: 100%; }
	.sheet-image { width: 100%; height: 100%; object-fit: cover; display: block; }
	.cover-badge-row { display: flex; justify-content: center; }

	.sheet-fold-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 6px, transparent 6px, transparent 12px); z-index: 10; pointer-events: none; transform: translateX(-50%); }
	.fold-badge { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.7); color: #cbd5e1; font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; padding: 1px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255, 255, 255, 0.2); }

	/* Задня обкладинка */
	.back-cover-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 7% 7% 6%; box-sizing: border-box; z-index: 5; background: linear-gradient(to bottom, rgba(22, 18, 23, 0.5) 0%, rgba(22, 18, 23, 0.2) 40%, rgba(22, 18, 23, 0.85) 100%); }
	.back-quote-card { background: rgba(22, 18, 23, 0.82); border: 1px solid rgba(255, 237, 0, 0.35); border-radius: 8px; padding: clamp(10px, 2cqi, 18px); backdrop-filter: blur(6px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6); }
	.back-quote-text { margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif; font-size: clamp(8.5px, 1.25cqi, 13px); line-height: 1.5; color: #ffffff; font-style: italic; text-align: center; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8); }

	/* Лицьова частина */
	.front-cover-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 5.2% 5% 6.5%; box-sizing: border-box; z-index: 5; text-align: center; pointer-events: none; background: linear-gradient(to bottom, rgba(22, 18, 23, 0.6) 0%, rgba(22, 18, 23, 0.15) 30%, rgba(22, 18, 23, 0.75) 100%); }
	.cover-presenters { display: flex; flex-direction: column; gap: 3px; }
	.presenter-line { margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif; font-size: clamp(7.5px, 0.95cqi, 10px); line-height: 1.35; color: #f1f5f9; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9); white-space: pre-line; }
	.presenter-line--lead { margin-bottom: clamp(5px, 0.75cqi, 9px); }

	.cover-title-block { display: flex; flex-direction: column; align-items: center; gap: clamp(2px, 0.6cqi, 6px); margin: auto 0; }
	.cover-title-main { margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif; font-size: clamp(24px, 4.5cqi, 44px); font-weight: 900; letter-spacing: 0.06em; color: #ffed00; text-transform: uppercase; text-shadow: 0 3px 12px rgba(0, 0, 0, 0.95), 0 0 20px rgba(255, 237, 0, 0.35); }
	.cover-title-genre { margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif; font-size: clamp(10px, 1.4cqi, 14px); font-weight: 600; letter-spacing: 0.12em; color: #ffffff; text-transform: uppercase; text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9); }

	.cover-info-block { display: flex; flex-direction: column; align-items: center; gap: clamp(6px, 1.2cqi, 12px); margin-bottom: clamp(10px, 1.8cqi, 18px); }
	.cover-author { margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif; color: #ffffff; max-width: 92%; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9); }
	.author-primary { font-size: clamp(10px, 1.45cqi, 14.5px); font-weight: 600; line-height: 1.3; }

	.age-badge { display: inline-flex; align-items: center; justify-content: center; font-family: 'e-Ukraine', var(--font-body), sans-serif; font-weight: 700; font-size: clamp(9.5px, 1.25cqi, 13px); line-height: 1; padding: 3px 12px; border-radius: 9999px; color: #ffed00; border: 1.5px solid #ffed00; background: rgba(22, 18, 23, 0.85); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); }
	.cover-director { margin: 0; font-family: 'e-Ukraine', var(--font-body), sans-serif; font-weight: 700; font-size: clamp(9px, 1.35cqi, 13px); letter-spacing: 0.08em; color: #ffed00; text-transform: uppercase; text-shadow: 0 2px 5px rgba(0, 0, 0, 0.9); }

	.cover-logos { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(10px, 1.6cqi, 16px); padding: 0; width: 100%; max-width: 90%; margin: 0 auto; }
	.logos-upper-row { display: flex; align-items: center; justify-content: center; gap: clamp(24px, 4.6cqi, 48px); width: 100%; }
	.logos-lower-row { display: flex; align-items: center; justify-content: center; width: 100%; }
	.logo-box { display: flex; align-items: center; justify-content: center; }
	.logo-box--uart, .logo-box--school { height: clamp(48px, 7.5cqi, 76px); }
	.logo-box--interactive { background: transparent; border: none; padding: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: transform 0.18s ease, filter 0.18s ease; }
	.logo-box--interactive:hover { transform: scale(1.05); }
	.logo-box--interactive:focus-visible { outline: 2px solid #ffed00; outline-offset: 4px; border-radius: 4px; }
	.logo-box--pro-teatr { width: clamp(280px, 44cqi, 400px); max-width: 95%; }
	.partner-logo { width: auto; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6)); }
	.partner-logo--uart, .partner-logo--school { height: 100%; width: auto; max-height: 100%; max-width: 100%; }
	.partner-logo--pro-teatr { width: 100%; height: auto; }

	/* Друк */
	@media print {
		.booklet-sheet,
		.booklet-sheet * {
			font-family: 'e-Ukraine', var(--font-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
		}

		.booklet-sheet {
			width: 297mm !important; height: 210mm !important; max-width: none !important; margin: 0 !important;
			border-radius: 0 !important; box-shadow: none !important; border: none !important;
			page-break-inside: avoid !important; break-inside: avoid !important;
			-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
		}

		.sheet-fold-line, .fold-badge { display: none !important; }
	}
</style>
