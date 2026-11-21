<script lang="ts">
	import { asset } from "$app/paths";
	import {
		ANNIVERSARY_30_CHARITY,
		ANNIVERSARY_30_POSTER,
		ANNIVERSARY_30_LEFT_PARTICLES,
		ANNIVERSARY_30_RIGHT_PARTICLES,
	} from "$lib/data/anniversary30";
	import CountryFlag from "$lib/components/icons/CountryFlag.svelte";
	import { Heart, ExternalLink, Copy, Check, QrCode } from "lucide-svelte";

	interface Props {
		isEn?: boolean;
		themeId?: string;
		printMode?: "digital" | "paper";
	}

	let {
		isEn = false,
		themeId = "yellow-brand",
		printMode = "digital",
	}: Props = $props();

	const charity = ANNIVERSARY_30_CHARITY;
	const poster = ANNIVERSARY_30_POSTER;

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	async function copyCardNumber() {
		try {
			await navigator.clipboard.writeText(charity.cardRaw);
			copied = true;
			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copied = false;
			}, 2500);
		} catch {
			copied = false;
		}
	}

	$effect(() => {
		return () => {
			if (copyTimeout) clearTimeout(copyTimeout);
		};
	});
</script>

<div class="poster-frame" data-testid="anniversary-30-charity-poster-container">
	<article
		class="anniversary-poster"
		class:anniversary-poster--dark={themeId === "uart-dark"}
		class:anniversary-poster--white={themeId === "paper-white"}
		class:anniversary-poster--cream={themeId === "warm-cream"}
		class:anniversary-poster--gold={themeId === "theatre-gold"}
		data-testid="anniversary-30-charity-poster-card"
	>
		<!-- Бічні іконки айдентики ліворуч -->
		<aside class="side-icons side-icons--left" aria-hidden="true">
			{#each ANNIVERSARY_30_LEFT_PARTICLES as p, i (i)}
				<img
					src={asset(p.iconFile)}
					alt=""
					width={p.size}
					height={p.size}
					class="side-particle"
					style="top: {p.top}%; left: {p.x}%; width: {p.size}px; transform: translate(-50%, -50%) rotate({p.rot}deg); opacity: {p.opacity};"
					loading="eager"
					decoding="async"
				/>
			{/each}
		</aside>

		<!-- Бічні іконки айдентики праворуч -->
		<aside class="side-icons side-icons--right" aria-hidden="true">
			{#each ANNIVERSARY_30_RIGHT_PARTICLES as p, i (i)}
				<img
					src={asset(p.iconFile)}
					alt=""
					width={p.size}
					height={p.size}
					class="side-particle"
					style="top: {p.top}%; right: {p.x}%; width: {p.size}px; transform: translate(50%, -50%) rotate({p.rot}deg); opacity: {p.opacity};"
					loading="eager"
					decoding="async"
				/>
			{/each}
		</aside>

		<div class="poster-content">
			<!-- Шапка: герб та назва школи -->
			<header class="poster-header">
				<div class="emblem-wrap">
					<img
						src={asset(
							"/logo/svg/t4_logo_IndividualParticles_MasksTwo_2026.svg",
						)}
						alt={isEn
							? "Odesa Theatre School Crest"
							: "Герб Одеської театральної школи"}
						width="160"
						height="97"
						class="emblem-img"
						loading="eager"
						decoding="async"
					/>
				</div>
				<p class="school-headline">
					{isEn
						? "Odesa Theatre School · 30th Anniversary Season"
						: "Одеська театральна школа · 30-й ювілейний сезон"}
				</p>
			</header>

			<!-- Основна картка благодійного збору (займає понад 90% простору) -->
			<section
				class="charity-card"
				aria-label={isEn ? charity.titleEn : charity.titleUk}
			>
				<div class="card-intro">
					<div class="badge-row">
						<div class="charity-badge">
							<span class="heart-wrap"
								><Heart size={24} aria-hidden="true" /></span
							>
							<span
								>{isEn
									? "AFU CHARITY FUNDRAISER"
									: "БЛАГОДІЙНИЙ ЗБІР ДЛЯ ЗСУ"}</span
							>
						</div>
						<div class="target-badge">
							<CountryFlag code="UA" title="Україна" />
							<strong
								>{isEn
									? charity.targetEn
									: charity.targetUk}</strong
							>
						</div>
					</div>

					<h1 class="charity-title">
						{isEn ? charity.titleEn : charity.titleUk}
					</h1>

					<p class="charity-lead">
						{isEn ? charity.leadEn : charity.leadUk}
					</p>

					<p class="charity-desc">
						{isEn ? charity.descriptionEn : charity.descriptionUk}
					</p>
				</div>

				<!-- Центральний блок: великий QR-код по середині -->
				<div class="qr-center-section">
					<div class="qr-box">
						<img
							src={asset(charity.qrImage)}
							alt={isEn
								? "Monobank Jar QR Code"
								: "QR-код Банки Монобанк"}
							width="440"
							height="440"
							class="qr-img"
							loading="eager"
							decoding="async"
						/>
						<div class="qr-hint">
							<QrCode size={20} aria-hidden="true" />
							<span
								>{isEn
									? "Scan with phone camera"
									: "Скануй камерою смартфона"}</span
							>
						</div>
					</div>
				</div>

				<!-- Нижні реквізити та підтримка -->
				<div class="details-bottom">
					<div class="details-grid">
						<div class="detail-row">
							<span class="detail-label"
								>{isEn
									? "Monobank Jar:"
									: "Банка Монобанк:"}</span
							>
							{#if printMode === "paper"}
								<div class="paper-val">
									send.monobank.ua/jar/4FvXthaHVH
								</div>
							{:else}
								<a
									href="https://send.monobank.ua/jar/4FvXthaHVH"
									target="_blank"
									rel="noopener noreferrer"
									class="btn-jar"
									data-testid="charity-poster-jar-link"
								>
									<ExternalLink
										size={20}
										aria-hidden="true"
									/>
									<span>send.monobank.ua/jar/4FvXthaHVH</span>
								</a>
							{/if}
						</div>

						<div class="detail-row">
							<span class="detail-label"
								>{isEn
									? "Card number:"
									: "Номер картки Банки:"}</span
							>
							<div class="card-num-box">
								<code class="card-code"
									>{charity.cardNumber}</code
								>
								{#if printMode !== "paper"}
									<button
										type="button"
										class="btn-copy"
										class:btn-copy--copied={copied}
										onclick={copyCardNumber}
										aria-label={isEn
											? "Copy card number"
											: "Скопіювати номер картки"}
										data-testid="charity-poster-copy-btn"
									>
										{#if copied}
											<Check
												size={18}
												aria-hidden="true"
											/>
											<span
												>{isEn
													? "Copied"
													: "Скопійовано"}</span
											>
										{:else}
											<Copy
												size={18}
												aria-hidden="true"
											/>
											<span
												>{isEn
													? "Copy"
													: "Копіювати"}</span
											>
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>

					<div class="support-box">
						<p class="support-text">
							{isEn
								? "Every donation brings our Victory closer! Thank you for standing with Ukraine and supporting our defenders."
								: "Кожна гривня наближає нашу Перемогу! Дякуємо кожному, хто підтримує Збройні Сили України!"}
						</p>
					</div>
				</div>
			</section>

			<!-- Нижній колонтитул з девізом -->
			<footer class="poster-footer">
				<p class="poster-season">
					{isEn ? poster.schoolEn : poster.schoolUk}
				</p>
			</footer>
		</div>
	</article>
</div>

<style>
	.poster-frame {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: 0;
		margin: 0;
	}
	.anniversary-poster {
		position: relative;
		width: min(100%, 960px);
		aspect-ratio: 210 / 297;
		background-color: #ffed00;
		background-image: radial-gradient(
				circle at 20% 20%,
				rgba(255, 255, 255, 0.4) 0%,
				transparent 40%
			),
			radial-gradient(
				circle at 80% 80%,
				rgba(255, 215, 0, 0.5) 0%,
				transparent 50%
			);
		border-radius: clamp(16px, 2.5cqi, 28px);
		box-shadow:
			0 20px 48px -12px rgba(0, 0, 0, 0.18),
			0 0 0 1px rgba(0, 0, 0, 0.06);
		padding: clamp(10px, 1.6cqi, 18px) clamp(12px, 2cqi, 22px);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: hidden;
		container-type: inline-size;
	}
	.anniversary-poster--dark {
		background-color: #171118;
		background-image: radial-gradient(
				circle at 15% 15%,
				rgba(120, 53, 15, 0.35) 0%,
				transparent 45%
			),
			radial-gradient(
				circle at 85% 85%,
				rgba(180, 83, 9, 0.2) 0%,
				transparent 50%
			);
		color: #f8fafc;
	}
	.anniversary-poster--white {
		background-color: #ffffff;
		background-image: none;
		border: 1px solid rgba(0, 0, 0, 0.12);
	}
	.anniversary-poster--cream {
		background-color: #fffbeb;
		background-image: radial-gradient(
			circle at 50% 50%,
			rgba(254, 243, 199, 0.5) 0%,
			transparent 60%
		);
	}
	.anniversary-poster--gold {
		background-color: #fef08a;
		background-image: radial-gradient(
			circle at 50% 20%,
			rgba(253, 224, 71, 0.6) 0%,
			transparent 50%
		);
	}

	.side-icons {
		position: absolute;
		top: 0;
		bottom: 0;
		width: clamp(50px, 7cqi, 80px);
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
	}
	.side-icons--left {
		left: 0;
	}
	.side-icons--right {
		right: 0;
	}
	.side-particle {
		position: absolute;
		height: auto;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
		pointer-events: none;
	}

	.poster-content {
		position: relative;
		z-index: 2;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: clamp(8px, 1.2cqi, 14px);
		max-width: 93%;
		margin: 0 auto;
		text-align: center;
	}
	.poster-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(3px, 0.5cqi, 6px);
	}
	.emblem-wrap {
		display: flex;
		justify-content: center;
	}
	.emblem-img {
		width: clamp(100px, 15cqi, 150px);
		height: auto;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
	}
	.school-headline {
		margin: 0;
		font-size: clamp(14px, 2.1cqi, 20px);
		font-weight: 900;
		color: #00242f;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.anniversary-poster--dark .school-headline {
		color: #fde047;
	}

	.charity-card {
		flex: 1 1 auto;
		background: rgba(255, 255, 255, 0.96);
		border-radius: clamp(18px, 2.8cqi, 32px);
		padding: clamp(18px, 2.6cqi, 28px);
		box-shadow:
			0 12px 32px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		text-align: left;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: clamp(10px, 1.6cqi, 18px);
	}
	.anniversary-poster--dark .charity-card {
		background: rgba(30, 24, 32, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #f1f5f9;
	}

	.card-intro {
		display: flex;
		flex-direction: column;
		gap: clamp(8px, 1.3cqi, 14px);
	}
	.badge-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
	}
	.charity-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: clamp(12px, 1.8cqi, 16px);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #075985;
		background: #e0f2fe;
		padding: 7px 16px;
		border-radius: 999px;
	}
	.anniversary-poster--dark .charity-badge {
		background: #0c4a6e;
		color: #bae6fd;
	}
	.heart-wrap {
		display: flex;
		color: #e11d48;
	}

	.target-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: clamp(13px, 1.9cqi, 17px);
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		padding: 7px 16px;
		border-radius: 999px;
		color: #0f172a;
	}
	.anniversary-poster--dark .target-badge {
		background: #1e293b;
		border-color: #334155;
		color: #f8fafc;
	}

	.charity-title {
		margin: 0;
		font-size: clamp(20px, 3.4cqi, 36px);
		font-weight: 900;
		line-height: 1.15;
		color: #00242f;
		white-space: nowrap;
	}
	.anniversary-poster--dark .charity-title {
		color: #f8fafc;
	}

	.charity-lead {
		margin: 0;
		font-size: clamp(17px, 2.6cqi, 24px);
		font-weight: 700;
		line-height: 1.35;
		color: #0f172a;
	}
	.anniversary-poster--dark .charity-lead {
		color: #f1f5f9;
	}

	.charity-desc {
		margin: 0;
		font-size: clamp(14px, 2.1cqi, 19px);
		line-height: 1.45;
		color: #1e293b;
	}
	.anniversary-poster--dark .charity-desc {
		color: #cbd5e1;
	}

	.qr-center-section {
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(6px, 1cqi, 14px) 0;
	}
	.qr-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(10px, 1.5cqi, 16px);
		justify-content: center;
	}
	.qr-img {
		width: clamp(440px, 72cqi, 640px);
		max-height: clamp(440px, 72cqi, 640px);
		height: auto;
		display: block;
		aspect-ratio: 1 / 1;
		object-fit: contain;
		filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.09));
	}
	.qr-hint {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: clamp(15px, 2.2cqi, 20px);
		font-weight: 800;
		color: #0369a1;
		background: #e0f2fe;
		padding: 7px 22px;
		border-radius: 999px;
		box-shadow: 0 2px 8px rgba(3, 105, 161, 0.1);
	}
	.anniversary-poster--dark .qr-hint {
		background: #0c4a6e;
		color: #bae6fd;
	}

	.details-bottom {
		display: flex;
		flex-direction: column;
		gap: clamp(10px, 1.5cqi, 16px);
		width: 100%;
	}
	.details-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(12px, 2cqi, 22px);
		align-items: stretch;
	}
	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.detail-label {
		font-size: clamp(12px, 1.6cqi, 14.5px);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #334155;
	}
	.anniversary-poster--dark .detail-label {
		color: #94a3b8;
	}

	.paper-val {
		font-size: clamp(13px, 1.7cqi, 16px);
		font-weight: 700;
		color: #075985;
		font-family: monospace;
		background: #f0f9ff;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid #bae6fd;
		text-align: center;
		word-break: break-all;
	}
	.btn-jar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: clamp(13px, 1.7cqi, 16px);
		font-weight: 800;
		color: #ffffff;
		background: #0369a1;
		padding: 10px 14px;
		border-radius: 10px;
		text-decoration: none;
		transition: background 0.15s ease;
		width: 100%;
		box-sizing: border-box;
		text-align: center;
		word-break: break-all;
	}
	.btn-jar:hover {
		background: #075985;
	}

	.card-num-box {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.card-code {
		flex: 1 1 auto;
		font-size: clamp(15px, 2.1cqi, 20px);
		font-weight: 900;
		letter-spacing: 0.04em;
		color: #0f172a;
		background: #f8fafc;
		border: 1.5px solid #cbd5e1;
		padding: 8px 12px;
		border-radius: 10px;
		text-align: center;
		font-family: monospace;
	}
	.anniversary-poster--dark .card-code {
		background: #1e293b;
		color: #f8fafc;
		border-color: #475569;
	}

	.btn-copy {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: clamp(12px, 1.6cqi, 14px);
		font-weight: 800;
		padding: 8px 12px;
		border-radius: 10px;
		border: 1px solid #94a3b8;
		background: #ffffff;
		color: #1e293b;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.btn-copy:hover {
		background: #f1f5f9;
	}
	.btn-copy--copied {
		background: #dcfce7;
		color: #166534;
		border-color: #86efac;
	}

	.support-box {
		background: rgba(2, 132, 199, 0.08);
		border: 1.5px solid rgba(2, 132, 199, 0.22);
		padding: clamp(10px, 1.5cqi, 16px) clamp(14px, 2cqi, 20px);
		border-radius: 12px;
		text-align: center;
	}
	.anniversary-poster--dark .support-box {
		background: rgba(56, 189, 248, 0.12);
		border-color: rgba(56, 189, 248, 0.25);
	}
	.support-text {
		margin: 0;
		font-size: clamp(13px, 1.7cqi, 16.5px);
		line-height: 1.4;
		font-weight: 700;
		color: #0f172a;
	}
	.anniversary-poster--dark .support-text {
		color: #f1f5f9;
	}

	.poster-footer {
		text-align: center;
		padding: clamp(4px, 0.8cqi, 8px) 0;
	}
	.poster-season {
		margin: 0;
		font-size: clamp(18px, 2.8cqi, 28px);
		font-weight: 900;
		color: #00242f;
		letter-spacing: 0.02em;
		text-shadow: 0 1px 2px rgba(255, 255, 255, 0.4);
	}
	.anniversary-poster--dark .poster-season {
		color: #f8fafc;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	@container (max-width: 620px) {
		.side-icons {
			display: none;
		}
		.poster-content {
			max-width: 100%;
		}
		.charity-title {
			white-space: normal;
		}
		.details-grid {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.badge-row {
			justify-content: center;
		}
		.card-num-box {
			justify-content: center;
		}
		.qr-img {
			width: clamp(240px, 65cqi, 340px);
		}
	}

	@media print {
		.poster-frame {
			width: 210mm !important;
			height: 297mm !important;
			max-width: 210mm !important;
			max-height: 297mm !important;
			margin: 0 !important;
			padding: 0 !important;
		}
		.anniversary-poster {
			width: 210mm !important;
			height: 297mm !important;
			max-width: 210mm !important;
			max-height: 297mm !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			border: none !important;
			margin: 0 !important;
			padding: 5mm 8mm !important;
			box-sizing: border-box !important;
			display: flex !important;
			flex-direction: column !important;
			justify-content: space-between !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			page-break-inside: avoid !important;
			break-inside: avoid !important;
			overflow: hidden !important;
		}
		.poster-content {
			height: 100% !important;
			max-width: 94% !important;
			margin: 0 auto !important;
			display: flex !important;
			flex-direction: column !important;
			justify-content: space-between !important;
		}
		.charity-card {
			flex: 1 1 auto !important;
			box-shadow: none !important;
			border: 1.5px solid #0284c7 !important;
			padding: 6mm 10mm !important;
			gap: 3mm !important;
			display: flex !important;
			flex-direction: column !important;
			justify-content: space-between !important;
		}
		.charity-title {
			font-size: 19pt !important;
			line-height: 1.15 !important;
			white-space: nowrap !important;
		}
		.charity-lead {
			font-size: 12pt !important;
			line-height: 1.3 !important;
		}
		.charity-desc {
			font-size: 10pt !important;
			line-height: 1.35 !important;
		}
		.qr-center-section {
			display: flex !important;
			justify-content: center !important;
			align-items: center !important;
		}
		.qr-img {
			width: 330px !important;
			height: 330px !important;
			max-width: 330px !important;
			max-height: 330px !important;
		}
		.qr-hint {
			font-size: 9.5pt !important;
			padding: 2px 8px !important;
		}
		.details-bottom {
			gap: 3mm !important;
		}
		.details-grid {
			display: grid !important;
			grid-template-columns: 1fr 1fr !important;
			gap: 4mm !important;
		}
		.detail-label {
			font-size: 9pt !important;
		}
		.paper-val {
			font-size: 9.5pt !important;
			padding: 3px 6px !important;
		}
		.card-code {
			font-size: 12pt !important;
			padding: 3px 6px !important;
		}
		.support-box {
			padding: 3mm 4mm !important;
			border-radius: 8px !important;
		}
		.support-text {
			font-size: 9pt !important;
			line-height: 1.3 !important;
		}
		.poster-season {
			font-size: 16px !important;
			font-weight: 900 !important;
		}
	}
</style>
