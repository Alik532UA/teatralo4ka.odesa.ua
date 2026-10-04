<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { focusTrap } from '$lib/utils/focusTrap';
	import type { BrandAiRemake } from '$lib/data/brandAiRemakes';
	import { Download, X, ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		item: BrandAiRemake;
		currentIndex: number;
		totalCount: number;
		onclose: () => void;
		onprev: () => void;
		onnext: () => void;
		testIdPrefix?: string;
	}

	let {
		item,
		currentIndex,
		totalCount,
		onclose,
		onprev,
		onnext,
		testIdPrefix = 'brand-ai'
	}: Props = $props();

	const isEn = $derived($locale === 'en');
	let lastWheelTime = 0;
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const now = Date.now();
		if (now - lastWheelTime < 220) return;
		const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
		if (Math.abs(delta) < 6) return;
		lastWheelTime = now;
		if (delta > 0) onnext();
		else onprev();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
		else if (e.key === 'ArrowLeft') onprev();
		else if (e.key === 'ArrowRight') onnext();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="modal-backdrop"
	role="dialog"
	aria-modal="true"
	aria-label={item.titleUk}
	data-testid={`${testIdPrefix}-modal`}
	{@attach focusTrap()}
>
	<button
		type="button"
		class="backdrop-dismiss"
		onclick={onclose}
		aria-label={isEn ? 'Close modal' : 'Закрити'}
		data-testid={`${testIdPrefix}-backdrop-dismiss-btn`}
	></button>
	<div class="modal-dialog">
		<button
			type="button"
			class="modal-close"
			onclick={onclose}
			aria-label={isEn ? 'Close' : 'Закрити'}
			data-testid={`${testIdPrefix}-modal-close`}
		>
			<X size={18} />
		</button>

		<div class="modal-body">
			<div class="modal-preview" onwheel={handleWheel}>
				<img
					src={asset(item.src)}
					alt={item.titleUk}
					width="560"
					height="560"
					class="modal-img"
				/>
				<button
					type="button"
					class="nav-btn nav-prev"
					onclick={onprev}
					aria-label={isEn ? 'Previous' : 'Попереднє'}
					data-testid={`${testIdPrefix}-modal-prev`}
				>
					<ChevronLeft size={22} />
				</button>
				<button
					type="button"
					class="nav-btn nav-next"
					onclick={onnext}
					aria-label={isEn ? 'Next' : 'Наступне'}
					data-testid={`${testIdPrefix}-modal-next`}
				>
					<ChevronRight size={22} />
				</button>
			</div>

			<div class="modal-info">
				<div class="modal-header">
					<h3 class="modal-title">{isEn ? item.titleEn : item.titleUk}</h3>
					<span class="modal-subtitle">{isEn ? item.titleUk : item.titleEn}</span>
				</div>

				<p class="modal-desc">{isEn ? item.descEn : item.descUk}</p>

				<div class="modal-actions">
					<a
						href={asset(item.src)}
						download={`teatralo4ka-ai-${item.slug}.webp`}
						class="download-btn"
						data-testid={`${testIdPrefix}-modal-download`}
					>
						<Download size={15} aria-hidden="true" />
						<span>{isEn ? 'Download WebP' : 'Завантажити WebP'}</span>
					</a>
					<span class="counter-text">
						{currentIndex + 1} / {totalCount}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
	.backdrop-dismiss {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.modal-dialog {
		position: relative;
		z-index: 2;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 18px;
		max-width: 600px;
		width: 100%;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
		overflow: hidden;
	}
	.modal-close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		z-index: 5;
		background: rgba(0, 0, 0, 0.5);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition: background 0.15s ease;
	}
	.modal-close:hover {
		background: rgba(0, 0, 0, 0.8);
	}
	.modal-body {
		display: flex;
		flex-direction: column;
	}
	.modal-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		max-height: 360px;
		background: #000000;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.modal-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.5);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition: background 0.15s ease, transform 0.15s ease;
	}
	.nav-btn:hover {
		background: rgba(0, 0, 0, 0.85);
		transform: translateY(-50%) scale(1.05);
	}
	.nav-prev {
		left: 0.75rem;
	}
	.nav-next {
		right: 0.75rem;
	}
	.modal-info {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.modal-header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.modal-title {
		margin: 0;
		font-size: 1.25rem;
		color: var(--text-title);
		font-weight: 800;
	}
	.modal-subtitle {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.modal-desc {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--text-main);
	}
	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
		margin-top: 0.25rem;
	}
	.download-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.5rem 0.9rem;
		border-radius: 8px;
		background: var(--accent-primary);
		color: var(--text-on-accent);
		font-size: 0.84rem;
		font-weight: 700;
		text-decoration: none;
		transition: opacity 0.15s ease;
	}
	.download-btn:hover {
		opacity: 0.9;
	}
	.counter-text {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
	}
</style>
