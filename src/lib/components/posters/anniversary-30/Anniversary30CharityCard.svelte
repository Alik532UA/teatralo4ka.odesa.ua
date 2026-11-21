<script lang="ts">
	import { asset } from '$app/paths';
	import { ANNIVERSARY_30_CHARITY } from '$lib/data/anniversary30';
	import { focusTrap } from '$lib/utils/focusTrap';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import { Heart, Copy, Check, ExternalLink, X } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
		printMode?: 'digital' | 'paper';
	}

	let { isEn = false, themeId = 'yellow-brand', printMode = 'digital' }: Props = $props();

	const charity = ANNIVERSARY_30_CHARITY;
	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let showQrModal = $state(false);

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

<div
	class="charity-card"
	class:charity-card--dark={themeId === 'uart-dark'}
	class:charity-card--light={themeId === 'paper-white'}
	data-testid="anniversary-30-charity-card"
>
	<div class="charity-main-col">
		<div class="charity-header">
			<div class="charity-badge" aria-hidden="true">
				<Heart size={20} class="charity-heart-icon" />
			</div>
			<div class="charity-headline">
				<h2 class="charity-title">{isEn ? charity.titleEn : charity.titleUk}</h2>
				<p class="charity-lead">{isEn ? charity.leadEn : charity.leadUk}</p>
			</div>
		</div>

		<div class="charity-details">
			<div class="charity-target-badge">
				<CountryFlag code="UA" title="Україна" />
				<strong>{isEn ? charity.targetEn : charity.targetUk}</strong>
			</div>

			<p class="charity-desc">{isEn ? charity.descriptionEn : charity.descriptionUk}</p>

			<div class="charity-actions" class:charity-actions--paper={printMode === 'paper'}>
				{#if printMode === 'paper'}
					<div class="paper-jar-ref" data-testid="paper-jar-badge">
						<span class="card-label">{isEn ? 'Monobank Jar:' : 'Банка Монобанк:'}</span>
						<span class="paper-jar-url">send.monobank.ua/jar/4FvXthaHVH</span>
					</div>
				{:else}
					<a
						href="https://send.monobank.ua/jar/4FvXthaHVH"
						target="_blank"
						rel="noopener noreferrer"
						class="btn-jar"
						data-testid="monobank-jar-link"
					>
						<ExternalLink size={15} aria-hidden="true" />
						<span>{isEn ? 'Donate via Monobank Jar' : 'Посилання на Банку'}</span>
					</a>
				{/if}

				<div class="card-copy-box" class:card-copy-box--paper={printMode === 'paper'}>
					<div class="card-number-wrap">
						<span class="card-label">{isEn ? 'Card number:' : 'Номер картки Банки:'}</span>
						<code class="card-number">{charity.cardNumber}</code>
					</div>
					{#if printMode !== 'paper'}
						<button
							type="button"
							class="btn-copy"
							class:btn-copy--copied={copied}
							onclick={copyCardNumber}
							aria-label={isEn ? 'Copy card number' : 'Скопіювати номер картки'}
							data-testid="copy-card-btn"
						>
							{#if copied}
								<Check size={14} aria-hidden="true" />
								<span>{isEn ? 'Copied!' : 'Скопійовано!'}</span>
							{:else}
								<Copy size={14} aria-hidden="true" />
								<span>{isEn ? 'Copy' : 'Скопіювати'}</span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="charity-qr-preview">
		<button
			type="button"
			class="qr-thumb-btn"
			onclick={() => (showQrModal = true)}
			aria-label={isEn ? 'Enlarge Monobank QR code' : 'Збільшити QR-код Монобанку'}
			data-testid="enlarge-qr-btn"
		>
			<img
				src={asset(charity.qrImage)}
				alt={isEn ? 'Monobank Jar QR code for 14th ORB' : 'QR-код для поповнення Банки на пікапи для 14 ОРБ'}
				width="2109"
				height="2109"
				class="qr-thumb-img"
				loading="eager"
				decoding="async"
			/>
		</button>
	</div>
</div>

{#if showQrModal}
	<div
		class="qr-modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label={isEn ? 'Monobank Jar QR code' : 'QR-код для поповнення Банки Монобанку'}
		tabindex="-1"
		{@attach focusTrap()}
		onkeydown={(e) => { if (e.key === 'Escape') showQrModal = false; }}
		data-testid="qr-code-modal"
	>
		<div class="qr-modal-card">
			<button
				type="button"
				class="btn-modal-close"
				onclick={() => (showQrModal = false)}
				aria-label={isEn ? 'Close dialog' : 'Закрити вікно'}
				data-testid="qr-modal-close-btn"
			>
				<X size={20} aria-hidden="true" />
			</button>
			<img
				src={asset(charity.qrImage)}
				alt={isEn ? 'Monobank Jar QR code for 14th ORB' : 'QR-код для поповнення Банки на пікапи для 14 ОРБ'}
				width="2109"
				height="2109"
				class="qr-modal-img"
			/>
			<div class="qr-modal-footer">
				<a
					href="https://send.monobank.ua/jar/4FvXthaHVH"
					target="_blank"
					rel="noopener noreferrer"
					class="btn-jar btn-jar--full"
					data-testid="qr-modal-jar-link"
				>
					<ExternalLink size={15} aria-hidden="true" />
					<span>{isEn ? 'Open Monobank Jar' : 'Відкрити Банку в Monobank'}</span>
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	.charity-card {
		position: relative;
		background: rgba(255, 255, 255, 0.98);
		border-radius: clamp(16px, 2.4cqi, 24px);
		padding: clamp(12px, 2cqi, 20px) clamp(14px, 2.4cqi, 24px);
		border: 2.5px solid #0077c8;
		box-shadow:
			0 0 0 2.5px #ffd000,
			0 12px 30px -6px rgba(0, 0, 0, 0.14);
		display: flex;
		flex-direction: row;
		align-items: stretch;
		justify-content: space-between;
		gap: clamp(14px, 2.4cqi, 26px);
		text-align: left;
	}
	.charity-card--dark {
		background: rgba(23, 17, 24, 0.95);
		color: #f8fafc;
		border-color: #38bdf8;
		box-shadow:
			0 0 0 2.5px #fbbf24,
			0 12px 30px -6px rgba(0, 0, 0, 0.4),
			0 0 16px rgba(56, 189, 248, 0.2);
	}
	.charity-card--light {
		background: #ffffff;
		border: 2.5px solid #0077c8;
		box-shadow:
			0 0 0 2.5px #ffd000,
			0 10px 25px -5px rgba(0, 0, 0, 0.08);
	}
	.charity-main-col {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: clamp(10px, 1.5cqi, 16px);
		min-width: 0;
	}
	.charity-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.charity-badge {
		width: clamp(38px, 4.6cqi, 48px);
		height: clamp(38px, 4.6cqi, 48px);
		border-radius: 50%;
		background: #e0f2fe;
		color: #0369a1;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.charity-card--dark .charity-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
	.charity-headline { display: flex; flex-direction: column; gap: 3px; }
	.charity-title {
		margin: 0;
		font-size: clamp(15px, 2.1cqi, 21px);
		font-weight: 900;
		color: #0369a1;
		line-height: 1.25;
	}
	.charity-card--dark .charity-title { color: #38bdf8; }
	.charity-lead {
		margin: 0;
		font-size: clamp(12px, 1.6cqi, 14.5px);
		color: #475569;
		line-height: 1.4;
		white-space: pre-line;
	}
	.charity-card--dark .charity-lead { color: #cbd5e1; }
	.charity-details {
		display: flex;
		flex-direction: column;
		gap: clamp(8px, 1.3cqi, 12px);
		min-width: 0;
	}
	.charity-target-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
		padding: 4px 12px;
		border-radius: 999px;
		width: fit-content;
		font-size: clamp(12px, 1.55cqi, 14px);
		font-weight: 700;
	}
	.charity-card--dark .charity-target-badge {
		background: #1e3a8a;
		color: #bfdbfe;
		border-color: #3b82f6;
	}
	.charity-desc {
		margin: 0;
		font-size: clamp(12px, 1.55cqi, 14px);
		color: #334155;
		line-height: 1.42;
	}
	.charity-card--dark .charity-desc { color: #e2e8f0; }
	.charity-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 12px;
	}
	.btn-jar {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #047857;
		color: #ffffff;
		text-decoration: none;
		font-size: clamp(12px, 1.55cqi, 14px);
		font-weight: 800;
		padding: 7px 15px;
		border-radius: 8px;
		box-shadow: 0 2px 6px rgba(4, 120, 87, 0.35);
		transition: background-color 0.15s ease, transform 0.1s ease;
	}
	.btn-jar:hover { background: #064e3b; transform: translateY(-1px); }
	.btn-jar--full { width: 100%; justify-content: center; padding: 10px 16px; }
	.card-copy-box {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		padding: 4px 10px;
	}
	.charity-card--dark .card-copy-box { background: #27202b; border-color: #475569; }
	.card-number-wrap { display: flex; flex-direction: column; line-height: 1.15; }
	.card-label { font-size: 9px; text-transform: uppercase; color: #334155; font-weight: 700; letter-spacing: 0.03em; }
	.charity-card--dark .card-label { color: #cbd5e1; }
	.card-number {
		font-family: monospace;
		font-size: clamp(12px, 1.55cqi, 14px);
		font-weight: 800;
		color: #0f172a;
	}
	.charity-card--dark .card-number { color: #f1f5f9; }
	.btn-copy {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: #ffffff;
		color: #0f172a;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 4px 8px;
		font-size: 11.5px;
		font-weight: 700;
		cursor: pointer;
	}
	.btn-copy:hover { background: #e2e8f0; }
	.btn-copy--copied { background: #dcfce7; color: #166534; border-color: #86efac; }
	.paper-jar-ref {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		padding: 4px 10px;
		font-size: 12px;
	}
	.charity-card--dark .paper-jar-ref {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.16);
	}
	.paper-jar-url {
		font-weight: 700;
		color: #047857;
		font-family: monospace;
	}
	.charity-card--dark .paper-jar-url {
		color: #34d399;
	}
	.card-copy-box--paper {
		background: #f8fafc;
		border-color: #cbd5e1;
	}
	.charity-card--dark .card-copy-box--paper {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.16);
	}
	.charity-qr-preview {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: stretch;
	}
	.qr-thumb-btn {
		background: transparent;
		border: none;
		border-radius: 0;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		align-self: stretch;
		transition: transform 0.15s ease;
		box-shadow: none;
	}
	.qr-thumb-btn:hover {
		transform: scale(1.02);
	}
	.qr-thumb-img {
		height: 100%;
		min-height: clamp(200px, 30cqi, 280px);
		max-height: clamp(260px, 38cqi, 330px);
		width: auto;
		display: block;
		aspect-ratio: 1 / 1;
		object-fit: contain;
	}
	.qr-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
	.qr-modal-card {
		position: relative;
		background: #ffffff;
		border-radius: 18px;
		padding: 18px;
		max-width: 340px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}
	.btn-modal-close {
		position: absolute;
		top: 8px;
		right: 8px;
		background: #f1f5f9;
		border: none;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #475569;
	}
	.qr-modal-img { width: 100%; height: auto; border-radius: 12px; }
	.qr-modal-footer { width: 100%; }
	@container (max-width: 620px) {
		.charity-card {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}
		.charity-qr-preview {
			display: flex;
			justify-content: center;
			align-self: center;
		}
		.qr-thumb-img {
			width: clamp(160px, 45cqi, 220px);
			height: auto;
			min-height: 0;
			max-height: none;
		}
	}
	@media print {
		.btn-copy { display: none !important; }
		.qr-modal-backdrop { display: none !important; }
		.charity-card {
			flex-direction: row !important;
			align-items: stretch !important;
			justify-content: space-between !important;
			gap: 14px !important;
			padding: 8px 16px !important;
			border-radius: 16px !important;
			box-shadow: none !important;
			break-inside: avoid !important;
		}
		.charity-main-col {
			flex: 1 1 auto !important;
			min-width: 0 !important;
			display: flex !important;
			flex-direction: column !important;
			justify-content: space-between !important;
			gap: 4px !important;
		}
		.charity-title {
			white-space: nowrap !important;
		}
		.charity-qr-preview {
			display: flex !important;
			flex: 0 0 auto !important;
			align-self: stretch !important;
			align-items: center !important;
			justify-content: center !important;
		}
		.qr-thumb-btn {
			height: 100% !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
		}
		.qr-thumb-img {
			width: auto !important;
			height: 100% !important;
			min-height: 175px !important;
			max-height: 190px !important;
			aspect-ratio: 1 / 1 !important;
			object-fit: contain !important;
		}
	}
</style>
