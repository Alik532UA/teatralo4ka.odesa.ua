<script lang="ts">
	import { asset } from '$app/paths';
	import { ANNIVERSARY_30_CHARITY } from '$lib/data/anniversary30';
	import { focusTrap } from '$lib/utils/focusTrap';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import { Heart, Copy, Check, ExternalLink, X } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'yellow-brand' }: Props = $props();

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
	<div class="charity-header">
		<div class="charity-badge" aria-hidden="true">
			<Heart size={20} class="charity-heart-icon" />
		</div>
		<div class="charity-headline">
			<h2 class="charity-title">{isEn ? charity.titleEn : charity.titleUk}</h2>
			<p class="charity-lead">{isEn ? charity.leadEn : charity.leadUk}</p>
		</div>
	</div>

	<div class="charity-content">
		<div class="charity-details">
			<div class="charity-target-badge">
				<CountryFlag code="UA" title="Україна" />
				<strong>{isEn ? charity.targetEn : charity.targetUk}</strong>
			</div>

			<p class="charity-desc">{isEn ? charity.descriptionEn : charity.descriptionUk}</p>

			<div class="charity-actions">
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

				<div class="card-copy-box">
					<div class="card-number-wrap">
						<span class="card-label">{isEn ? 'Card number:' : 'Номер картки Банки:'}</span>
						<code class="card-number">{charity.cardNumber}</code>
					</div>
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
		background: rgba(255, 255, 255, 0.94);
		border-radius: clamp(14px, 2.2cqi, 22px);
		padding: clamp(10px, 1.8cqi, 18px) clamp(12px, 2.2cqi, 22px);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
		display: flex;
		flex-direction: column;
		gap: clamp(8px, 1.4cqi, 14px);
		text-align: left;
	}
	.charity-card--dark {
		background: rgba(23, 17, 24, 0.92);
		color: #f8fafc;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
	}
	.charity-card--light {
		background: #ffffff;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}
	.charity-header {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.charity-badge {
		width: clamp(34px, 4cqi, 40px);
		height: clamp(34px, 4cqi, 40px);
		border-radius: 50%;
		background: #fee2e2;
		color: #991b1b;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.charity-card--dark .charity-badge { background: #7f1d1d; color: #fecaca; }
	.charity-headline { display: flex; flex-direction: column; gap: 2px; }
	.charity-title {
		margin: 0;
		font-size: clamp(13px, 1.8cqi, 18px);
		font-weight: 900;
		color: #991b1b;
		line-height: 1.2;
	}
	.charity-card--dark .charity-title { color: #f87171; }
	.charity-lead {
		margin: 0;
		font-size: clamp(10.5px, 1.35cqi, 13px);
		color: #475569;
		line-height: 1.35;
		white-space: pre-line;
	}
	.charity-card--dark .charity-lead { color: #cbd5e1; }
	.charity-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: clamp(10px, 1.8cqi, 18px);
	}
	.charity-details {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: clamp(6px, 1cqi, 10px);
		min-width: 0;
	}
	.charity-target-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
		padding: 3px 10px;
		border-radius: 999px;
		width: fit-content;
		font-size: clamp(10.5px, 1.35cqi, 13px);
	}
	.charity-card--dark .charity-target-badge {
		background: #1e3a8a;
		color: #bfdbfe;
		border-color: #3b82f6;
	}
	.charity-desc {
		margin: 0;
		font-size: clamp(10.5px, 1.3cqi, 12.5px);
		color: #334155;
		line-height: 1.35;
	}
	.charity-card--dark .charity-desc { color: #e2e8f0; }
	.charity-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 10px;
	}
	.btn-jar {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: #047857;
		color: #ffffff;
		text-decoration: none;
		font-size: clamp(10.5px, 1.3cqi, 12.5px);
		font-weight: 800;
		padding: 5px 12px;
		border-radius: 7px;
		box-shadow: 0 2px 6px rgba(4, 120, 87, 0.35);
		transition: background-color 0.15s ease, transform 0.1s ease;
	}
	.btn-jar:hover { background: #064e3b; transform: translateY(-1px); }
	.btn-jar--full { width: 100%; justify-content: center; padding: 10px 16px; }
	.card-copy-box {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: 7px;
		padding: 3px 8px;
	}
	.charity-card--dark .card-copy-box { background: #27202b; border-color: #475569; }
	.card-number-wrap { display: flex; flex-direction: column; line-height: 1.1; }
	.card-label { font-size: 8.5px; text-transform: uppercase; color: #64748b; font-weight: 700; }
	.card-number {
		font-family: monospace;
		font-size: clamp(10.5px, 1.3cqi, 12.5px);
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
		border-radius: 5px;
		padding: 3px 7px;
		font-size: 10.5px;
		font-weight: 700;
		cursor: pointer;
	}
	.btn-copy:hover { background: #e2e8f0; }
	.btn-copy--copied { background: #dcfce7; color: #166534; border-color: #86efac; }
	.charity-qr-preview { flex: 0 0 auto; }
	.qr-thumb-btn {
		background: transparent;
		border: none;
		border-radius: 0;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease;
		box-shadow: none;
	}
	.qr-thumb-btn:hover {
		transform: scale(1.03);
	}
	.qr-thumb-img {
		width: clamp(120px, 16cqi, 155px);
		height: auto;
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
	@container (max-width: 600px) {
		.charity-content { flex-direction: column-reverse; align-items: stretch; }
		.charity-qr-preview { display: flex; justify-content: center; }
		.qr-thumb-img { width: clamp(140px, 35cqi, 180px); }
	}
	@media print {
		.charity-card {
			box-shadow: none !important;
			border: 1px solid #cbd5e1 !important;
			background: #ffffff !important;
			color: #000000 !important;
			padding: 6px 10px !important;
			break-inside: avoid !important;
		}
		.qr-modal-backdrop { display: none !important; }
		.btn-jar, .btn-copy {
			border: 1px solid #000000 !important;
			box-shadow: none !important;
			color: #000000 !important;
		}
	}
</style>
