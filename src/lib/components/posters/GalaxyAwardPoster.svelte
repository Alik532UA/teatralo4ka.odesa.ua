<script lang="ts">
	import { asset } from '$app/paths';
	import {
		SOFIIA_PODIAKOVA_AWARD,
		GALAXY_AWARD_THEMES
	} from '$lib/data/galaxyAward';
	import StarEight from '$lib/components/icons/StarEight.svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'galaxy-space' }: Props = $props();

	const activeTheme = $derived(
		GALAXY_AWARD_THEMES.find((t) => t.id === themeId) ?? GALAXY_AWARD_THEMES[0]
	);

	const isLight = $derived(activeTheme.id === 'galaxy-print-light');
	const isGold = $derived(activeTheme.id === 'galaxy-gold');
	const award = SOFIIA_PODIAKOVA_AWARD;
</script>

<div class="award-frame" data-testid="galaxy-award-container">
	<article
		class="award-poster"
		class:award-poster--light={isLight}
		class:award-poster--gold={isGold}
		style:background={activeTheme.color}
		data-testid="galaxy-award-poster-card"
	>
		<!-- Повнорозмірне гіперпосилання на персональну сторінку випускниці (працює і на сайті, і в збереженому PDF) -->
		<a
			href="https://teatralo4ka.odesa.ua/projects/galaxy-graduates/sofiia-podiakova/"
			class="poster-click-overlay"
			data-testid="galaxy-award-click-overlay"
			target="_blank"
			rel="noopener noreferrer"
			aria-label={isEn
				? "Open Sofiia Podiakova's profile on Galaxy of Graduates"
				: 'Відкрити персональну сторінку Софії Подьякової на Планеті Творчості'}
		></a>

		<!-- Зоряний пил та фонові промені -->
		<div class="space-particles" aria-hidden="true">
			<span class="star-sparkle star-1"><StarEight size={22} /></span>
			<span class="star-sparkle star-2"><StarEight size={14} /></span>
			<span class="star-sparkle star-3"><StarEight size={18} /></span>
			<span class="star-sparkle star-4"><StarEight size={12} /></span>
			<span class="star-sparkle star-5"><StarEight size={20} /></span>
			<span class="star-sparkle star-6"><StarEight size={14} /></span>
		</div>

		<!-- Декоративна подвійна рамка з кутовими елементами -->
		<div class="ornate-border" aria-hidden="true">
			<div class="corner-star corner-tl"><StarEight size={24} /></div>
			<div class="corner-star corner-tr"><StarEight size={24} /></div>
			<div class="corner-star corner-bl"><StarEight size={24} /></div>
			<div class="corner-star corner-br"><StarEight size={24} /></div>
		</div>

		<div class="award-content">
			<!-- Шапка: Герб та офіційний підпис школи -->
			<header class="award-header">
				<img
					src={asset(
						isLight
							? '/brand/big-emblem/svg/big-emblem-2025-color-color-hands-text.svg'
							: '/brand/big-emblem/svg/big-emblem-2025-color-white-text.svg'
					)}
					alt={isEn ? 'Odesa Theatre School Emblem' : 'Герб Одеської театральної школи'}
					width="380"
					height="160"
					class="award-emblem"
					loading="eager"
				/>
				<div class="institution-name">
					{isEn ? 'ODESA THEATRE SCHOOL' : 'ОДЕСЬКА ТЕАТРАЛЬНА ШКОЛА'}
				</div>
				<div class="project-tag">
					{isEn ? 'PROJECT “GALAXY OF GRADUATES” · OFFICIAL CHRONICLE' : 'ПРОЄКТ «ПЛАНЕТА ТВОРЧОСТІ» · ОФІЦІЙНИЙ ЛІТОПИС'}
				</div>
			</header>

			<!-- Назва відзнаки та номер -->
			<div class="title-block">
				<div class="award-ribbon">
					<span class="ribbon-star"><StarEight size={14} /></span>
					<span class="ribbon-text">{isEn ? award.titleEn : award.titleUk}</span>
					<span class="ribbon-star"><StarEight size={14} /></span>
				</div>
				<h1 class="award-main-title">
					{isEn ? award.badgeEn : award.badgeUk}
				</h1>
				<div class="award-cert-badge">
					{isEn ? `CERTIFICATE ${award.certificateNumber} · FIRST QUESTIONNAIRE` : `СЕРТИФІКАТ ${award.certificateNumber} · ПЕРША АНКЕТА ПРОЄКТУ`}
				</div>
			</div>

			<!-- Портрет та ім'я лауреата -->
			<section class="honoree-section">
				<div class="honoree-aura">
					<div class="honoree-photo-frame">
						<img
							src={asset(award.photo)}
							alt={isEn ? award.personNameEn : award.personNameUk}
							width="280"
							height="280"
							class="honoree-avatar"
							loading="eager"
						/>
					</div>
					<div class="orbit-glow" aria-hidden="true"></div>
				</div>

				<div class="honoree-intro">
					{isEn ? 'This honorary distinction is presented to' : 'Ця почесна відзнака вручається'}
				</div>
				<h2 class="honoree-name">
					{isEn ? award.personNameEn : award.personNameUk}
				</h2>
				<div class="honoree-subtitle">
					<span>{isEn ? award.roleEn : award.roleUk}</span>
					<span class="sep" aria-hidden="true">·</span>
					<strong class="master-highlight">{isEn ? award.masterEn : award.masterUk}</strong>
				</div>
			</section>

			<!-- Текст присвяти та подяки -->
			<div class="citation-block">
				<p class="citation-lead">
					{isEn ? award.citationLeadEn : award.citationLeadUk}
				</p>
				<p class="citation-sub">
					{isEn ? award.citationBodyEn : award.citationBodyUk}
				</p>
			</div>

			<!-- Інтерактивний QR-код та репертуарний бейдж -->
			<div class="interactive-card">
				<div class="qr-col">
					<div class="qr-wrap">
						<img
							src={asset(award.qrCode)}
							alt={isEn ? 'QR code to graduate profile' : 'QR-код для переходу на сторінку випускниці'}
							width="112"
							height="112"
							class="award-qr"
							loading="eager"
						/>
					</div>
					<div class="qr-info">
						<div class="qr-title">
							{isEn ? 'Personal Galaxy Page' : 'Персональна сторінка на Планеті Творчості'}
						</div>
						<div class="qr-url">
							{award.pageUrl}
						</div>
						<div class="qr-hint">
							{isEn ? 'Scan to view all plays, roles and school gallery' : 'Скануйте для перегляду вистав, ролей та галереї'}
						</div>
					</div>
				</div>

				<div class="plays-col">
					<div class="plays-title">
						{isEn ? 'School Repertoire Plays:' : 'У репертуарі вистав школи:'}
					</div>
					<div class="plays-chips">
						{#each award.plays as play, idx (idx)}
							<span class="play-chip">
								<strong class="play-title">{isEn ? play.titleEn : play.titleUk}</strong>
								{#if play.roleUk}
									<span class="play-role">({isEn ? play.roleEn : play.roleUk})</span>
								{/if}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Підвал відзнаки: рік та місто текстом знизу -->
			<footer class="award-footer">
				<div class="award-footer-text">
					{isEn ? '2026 · ODESA' : '2026 · М. ОДЕСА'}
				</div>
			</footer>
		</div>
	</article>
</div>

<style>
	.award-frame {
		display: flex;
		justify-content: center;
		width: 100%;
		padding: clamp(6px, 1.5cqi, 16px) 0;
	}

	.award-poster {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 794px;
		aspect-ratio: 210 / 297;
		background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0c122c 45%, #030712 100%);
		color: #ffffff;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		box-sizing: border-box;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
		container-type: inline-size;
		container-name: award;
		padding: 5.2cqi 4.76cqi 4.2cqi 4.76cqi;
	}

	.poster-click-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
		display: block;
		text-decoration: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.poster-click-overlay:focus-visible {
		outline: 3px solid #ffd700;
		outline-offset: -3px;
	}

	.award-poster--light .poster-click-overlay:focus-visible {
		outline-color: #1e3a8a !important;
	}

	.award-poster--light {
		background: #ffffff !important;
		color: #0f172a !important;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08) !important;
	}

	.award-poster--light .institution-name,
	.award-poster--light .project-tag,
	.award-poster--light .ribbon-star,
	.award-poster--light .award-cert-badge,
	.award-poster--light .master-highlight,
	.award-poster--light .citation-lead,
	.award-poster--light .qr-title,
	.award-poster--light .qr-url,
	.award-poster--light .plays-title,
	.award-poster--light .play-title,
	.award-poster--light .award-footer-text {
		color: #1e3a8a !important;
	}

	.award-poster--gold {
		background: radial-gradient(circle at 50% 20%, #2e2107 0%, #171103 50%, #070501 100%) !important;
		color: #fffbeb !important;
	}

	/* Орнаментальна рамка */
	.ornate-border {
		position: absolute;
		inset: 2.38cqi;
		border: 1.5px solid #d4af37;
		pointer-events: none;
		z-index: 2;
	}

	.award-poster--light .ornate-border {
		border-color: #1e3a8a !important;
	}

	.ornate-border::before {
		content: '';
		position: absolute;
		inset: 0.95cqi;
		border: 1px dashed rgba(212, 175, 55, 0.55);
	}

	.award-poster--light .ornate-border::before {
		border-color: rgba(30, 58, 138, 0.45) !important;
	}

	.corner-star {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffd700;
		line-height: 1;
		transform: translate(-50%, -50%);
		filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.7));
	}
	.corner-star :global(svg) { width: 2.86cqi; height: 2.86cqi; }
	.corner-tl { top: 0; left: 0; }
	.corner-tr { top: 0; left: 100%; }
	.corner-bl { top: 100%; left: 0; }
	.corner-br { top: 100%; left: 100%; }

	.award-poster--light .corner-star {
		color: #1e3a8a !important;
		filter: none !important;
	}

	/* Зоряні спалахи */
	.space-particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.star-sparkle {
		position: absolute;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #ffd600;
		opacity: 0.65;
		filter: drop-shadow(0 0 6px #ffd700);
	}
	.star-1 { top: 7%; left: 10%; opacity: 0.85; }
	.star-2 { top: 18%; right: 9%; }
	.star-3 { top: 52%; left: 6%; }
	.star-4 { top: 58%; right: 7%; }
	.star-5 { top: 82%; left: 8%; }
	.star-6 { top: 86%; right: 10%; }

	.award-poster--light .star-sparkle {
		color: #1e3a8a !important;
		opacity: 0.28 !important;
		filter: none !important;
	}

	.award-content {
		position: relative;
		z-index: 3;
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		text-align: center;
		padding: 0;
	}

	/* Шапка */
	.award-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6cqi;
		margin-top: 0;
	}

	.award-emblem {
		display: block;
		max-width: 46cqi;
		height: auto;
		max-height: 12.38cqi;
		object-fit: contain;
		margin-bottom: 2.38cqi;
	}

	.institution-name {
		font-size: 2.38cqi;
		font-weight: 700;
		letter-spacing: 0.16em;
		color: #ffd700;
		text-transform: uppercase;
	}

	.project-tag {
		font-size: 1.62cqi;
		font-weight: 600;
		letter-spacing: 0.18em;
		opacity: 0.85;
		text-transform: uppercase;
	}

	/* Блок назви відзнаки */
	.title-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8cqi;
		margin: 0.4cqi 0;
	}

	.award-ribbon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 1.2cqi;
		background: linear-gradient(90deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.4), rgba(212, 175, 55, 0.15));
		border: 1px solid rgba(212, 175, 55, 0.8);
		padding: 0.71cqi 2.86cqi;
		border-radius: 999px;
		font-size: 1.81cqi;
		font-weight: 700;
		letter-spacing: 0.22em;
		line-height: 1;
		color: #ffd700;
	}

	.ribbon-text {
		display: inline-flex;
		align-items: center;
		line-height: 1;
	}

	.ribbon-star {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		flex-shrink: 0;
	}

	.ribbon-star :global(svg) {
		display: block;
		width: 1.67cqi;
		height: 1.67cqi;
	}

	.award-poster--light .award-ribbon {
		background: rgba(30, 58, 138, 0.08) !important;
		border-color: #1e3a8a !important;
	}

	.award-main-title {
		margin: 0;
		font-size: 4.52cqi;
		font-weight: 700;
		letter-spacing: 0.04em;
		line-height: 1.15;
		background: linear-gradient(180deg, #ffffff 30%, #ffd700 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		filter: drop-shadow(0 2px 8px rgba(255, 215, 0, 0.35));
	}

	.award-poster--light .award-main-title {
		background: none !important;
		-webkit-text-fill-color: #0f172a !important;
		color: #0f172a !important;
		filter: none !important;
	}

	.award-cert-badge {
		font-size: 1.52cqi;
		font-weight: 600;
		letter-spacing: 0.22em;
		opacity: 0.8;
	}

	/* Портрет та персона */
	.honoree-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0.5cqi 0;
	}

	.honoree-aura {
		position: relative;
		width: 24.76cqi;
		height: 24.76cqi;
		margin-bottom: 1.2cqi;
	}

	.honoree-photo-frame {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 2.5px solid #ffd700;
		box-shadow: 0 0 28px rgba(255, 215, 0, 0.45);
		overflow: hidden;
		box-sizing: border-box;
		background: #111827;
	}

	.award-poster--light .honoree-photo-frame {
		border-color: #1e3a8a !important;
		box-shadow: 0 4px 18px rgba(30, 58, 138, 0.22) !important;
		background: #f8fafc !important;
	}

	.honoree-avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 20%;
		display: block;
	}

	.honoree-intro {
		font-size: 1.81cqi;
		font-weight: 500;
		opacity: 0.85;
		font-style: italic;
	}

	.honoree-name {
		margin: 0.3cqi 0 0.5cqi 0;
		font-size: 5.24cqi;
		font-weight: 800;
		letter-spacing: 0.05em;
		color: #ffffff;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
	}

	.award-poster--light .honoree-name {
		color: #0f172a !important;
		text-shadow: none !important;
	}

	.honoree-subtitle {
		font-size: 2cqi;
		display: inline-flex;
		align-items: center;
		gap: 0.8cqi;
		opacity: 0.95;
	}

	.master-highlight {
		color: #ffd700;
		font-weight: 700;
	}

	/* Текст подяки */
	.citation-block {
		max-width: 81.9cqi;
		margin: 0 auto;
		background: rgba(255, 255, 255, 0.04);
		border-top: 1px solid rgba(212, 175, 55, 0.35);
		border-bottom: 1px solid rgba(212, 175, 55, 0.35);
		padding: 1.9cqi 2.86cqi;
		box-sizing: border-box;
	}

	.award-poster--light .citation-block {
		background: rgba(30, 58, 138, 0.04) !important;
		border-color: rgba(30, 58, 138, 0.3) !important;
	}

	.citation-lead {
		margin: 0 0 0.6cqi 0;
		font-size: 2cqi;
		line-height: 1.4;
		font-weight: 600;
		color: #fef08a;
	}

	.citation-sub {
		margin: 0;
		font-size: 1.71cqi;
		line-height: 1.4;
		opacity: 0.9;
	}

	/* Інтерактивна картка з QR */
	.interactive-card {
		display: grid;
		grid-template-columns: 37.14cqi 1fr;
		align-items: center;
		gap: 2.38cqi;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(212, 175, 55, 0.4);
		border-radius: 12px;
		padding: 1.9cqi 2.86cqi;
		text-align: left;
		box-sizing: border-box;
	}

	.award-poster--light .interactive-card {
		background: #f8fafc !important;
		border-color: rgba(30, 58, 138, 0.25) !important;
	}

	.qr-col {
		display: flex;
		align-items: center;
		gap: 1.4cqi;
	}

	.qr-wrap {
		width: 11.9cqi;
		height: 11.9cqi;
		background: #ffffff;
		border: 1.5px solid #d4af37;
		border-radius: 8px;
		padding: 0.4cqi;
		box-sizing: border-box;
		flex-shrink: 0;
	}

	.award-poster--light .qr-wrap {
		border-color: #1e3a8a !important;
	}

	.award-qr {
		width: 100%;
		height: 100%;
		display: block;
	}

	.qr-info {
		display: flex;
		flex-direction: column;
		gap: 0.25cqi;
	}

	.qr-title {
		font-size: 1.62cqi;
		font-weight: 700;
		color: #ffd700;
	}

	.qr-url {
		font-size: 1.14cqi;
		color: var(--accent-text, #38bdf8);
		word-break: break-all;
		font-family: monospace;
	}

	.award-poster--light .qr-url {
		font-weight: 700 !important;
	}

	.qr-hint {
		font-size: 1.14cqi;
		opacity: 0.75;
	}

	.award-poster--light .qr-hint {
		color: #334155 !important;
		opacity: 0.9 !important;
	}

	.plays-col {
		display: flex;
		flex-direction: column;
		gap: 0.6cqi;
	}

	.plays-title {
		font-size: 1.52cqi;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		opacity: 0.9;
	}

	.plays-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4cqi 0.8cqi;
	}

	.play-chip {
		font-size: 1.33cqi;
		background: rgba(255, 255, 255, 0.08);
		padding: 0.3cqi 0.7cqi;
		border-radius: 5px;
	}

	.award-poster--light .play-chip {
		background: #ffffff !important;
		border: 1px solid rgba(30, 58, 138, 0.25) !important;
	}

	.play-title { font-weight: 700; }
	.play-role { opacity: 0.8; font-size: 1.19cqi; }

	/* Підвал: просто текстом знизу */
	.award-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1.43cqi 0 0.48cqi;
	}

	.award-footer-text {
		font-size: 1.9cqi;
		font-weight: 700;
		letter-spacing: 0.22em;
		color: #ffd700;
		opacity: 0.9;
		text-transform: uppercase;
	}

	/* ДРУК A4 PORTRAIT */
	@media print {
		.award-frame {
			padding: 0 !important;
			margin: 0 !important;
			width: 210mm !important;
			height: 297mm !important;
		}

		.award-poster,
		.award-poster * {
			font-family: 'e-Ukraine', var(--font-body), sans-serif !important;
		}

		.award-poster {
			width: 210mm !important;
			height: 297mm !important;
			max-width: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			page-break-after: avoid !important;
			break-after: avoid !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.ornate-border { border-width: 0.6mm !important; }
		.ornate-border::before { border-width: 0.3mm !important; }
	}
</style>
