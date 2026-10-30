<script lang="ts">
	import { asset } from '$app/paths';
	import { UART_SECRETS_BOOKLET } from '$lib/data/uartSecretsBooklet';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'uart-dark' }: Props = $props();

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
					<p class="presenter-line">{presenter}</p>
				{/each}
			</header>

			<!-- Вільний простір під графічну назву по центру (Y ~ 6% .. 36%) -->
			<div class="cover-title-gap" aria-hidden="true"></div>

			<!-- Блок під назвою: авторка пʼєси, віковий рейтинг та режисер -->
			<div class="cover-info-block">
				<p class="cover-author">
					{isEn ? data.authorEn : data.authorUk}
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

			<!-- Три логотипи внизу обкладинки -->
			<footer class="cover-logos" aria-label={isEn ? 'Logos' : 'Логотипи партнерів'}>
				{#each data.logos as logo (logo.id)}
					<div class="logo-box logo-box--{logo.id}">
						<img
							src={asset(logo.src)}
							alt={isEn ? logo.altEn : logo.altUk}
							class="partner-logo partner-logo--{logo.id}"
							width="48"
							height="48"
							loading="eager"
							decoding="async"
						/>
					</div>
				{/each}
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

	/* Центральна лінія згину */
	.sheet-fold-line {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 6px, transparent 6px, transparent 12px);
		z-index: 10;
		pointer-events: none;
		transform: translateX(-50%);
	}

	.fold-badge {
		position: absolute;
		top: 6px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: #cbd5e1;
		font-size: 8px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 1px 6px;
		border-radius: 4px;
		white-space: nowrap;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	/* Шар типографіки лицьової частини */
	.front-cover-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 4.5% 5% 4%;
		box-sizing: border-box;
		z-index: 5;
		text-align: center;
		pointer-events: none;
	}

	.cover-presenters { display: flex; flex-direction: column; gap: 2.5px; }

	.presenter-line {
		margin: 0;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		font-size: clamp(7.5px, 1.05cqi, 11px);
		line-height: 1.35;
		color: #f1f5f9;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 500;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
	}

	.cover-title-gap { height: 32%; min-height: 50px; }

	.cover-info-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(5px, 1.1cqi, 12px);
		margin-top: auto;
		margin-bottom: clamp(6px, 1.3cqi, 14px);
	}

	.cover-author {
		margin: 0;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		font-size: clamp(9px, 1.35cqi, 13.5px);
		line-height: 1.35;
		color: #ffffff;
		font-weight: 500;
		max-width: 90%;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
	}

	.cover-badge-row { display: flex; justify-content: center; }

	.age-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		font-weight: 700;
		font-size: clamp(9.5px, 1.25cqi, 13px);
		line-height: 1;
		padding: 3px 12px;
		border-radius: 9999px;
		color: #ffed00;
		border: 1.5px solid #ffed00;
		background: rgba(22, 18, 23, 0.85);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.cover-director {
		margin: 0;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		font-weight: 700;
		font-size: clamp(9px, 1.35cqi, 13px);
		letter-spacing: 0.08em;
		color: #ffed00;
		text-transform: uppercase;
		text-shadow: 0 2px 5px rgba(0, 0, 0, 0.9);
	}

	.cover-logos {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(14px, 3cqi, 28px);
		padding: 0 0 4px;
	}

	.logo-box { display: flex; align-items: center; justify-content: center; height: clamp(32px, 4.4cqi, 46px); }

	.partner-logo { max-height: 100%; width: auto; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6)); }
	.partner-logo--school { height: 100%; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7)); }

	/* Стилі друку */
	@media print {
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

		.sheet-fold-line {
			background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 0, rgba(255, 255, 255, 0.25) 4mm, transparent 4mm, transparent 8mm) !important;
		}

		.fold-badge { display: none !important; }
		.presenter-line { font-size: 7.2pt !important; line-height: 1.25 !important; }
		.cover-author { font-size: 9.5pt !important; line-height: 1.35 !important; }
		.age-badge { font-size: 9pt !important; padding: 1.5mm 4.5mm !important; }
		.cover-director { font-size: 9.5pt !important; }
		.logo-box { height: 12.5mm !important; }
	}
</style>
