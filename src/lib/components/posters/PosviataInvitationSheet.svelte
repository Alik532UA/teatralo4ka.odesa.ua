<script lang="ts">
	import type { InvitationStudent, PosviataSlotTime } from '$lib/data/posviataInvitations';
	import PosviataInvitationCard from './PosviataInvitationCard.svelte';

	interface Props {
		mode: 'named' | 'template' | 'cover';
		students?: InvitationStudent[];
		time?: PosviataSlotTime;
		coverType?: 'color' | 'bw';
		isEn?: boolean;
		sheetIndex?: number;
		totalSheets?: number;
	}

	let {
		mode = 'template',
		students = [],
		time = '10:00',
		coverType = 'color',
		isEn = false,
		sheetIndex = 1,
		totalSheets = 1
	}: Props = $props();

	const showCutLines = $derived(mode !== 'cover');
	// Рівно 6 слотів на аркуші A4
	const slots = [0, 1, 2, 3, 4, 5];
</script>

<div
	class="posviata-sheet"
	class:posviata-sheet--cover={mode === 'cover'}
	data-testid="posviata-sheet-card"
	data-sheet-index={sheetIndex}
	data-sheet-mode={mode}
	data-total-sheets={totalSheets}
>
	<div class="sheet-grid" class:sheet-grid--cut-lines={showCutLines}>
		{#each slots as slotIndex (slotIndex)}
			<div
				class="sheet-slot"
				class:sheet-slot--cut-lines={showCutLines}
				class:sheet-slot--col-left={slotIndex % 2 === 0}
				class:sheet-slot--row-inner={slotIndex < 4}
			>
				<PosviataInvitationCard
					{mode}
					student={mode === 'named' ? students[slotIndex] : undefined}
					{time}
					{coverType}
					{isEn}
					showCutLines={false}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.posviata-sheet {
		box-sizing: border-box;
		background: #ffffff;
		color: #111827;
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		margin: 0 auto 24px;
		width: 100%;
		max-width: 1120px;
		aspect-ratio: 297 / 210;
		padding: 3.6% 3.8%;
		border-radius: 6px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(0, 0, 0, 0.08);
	}

	.sheet-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		gap: 0;
	}

	/* Зовнішній контур розрізу навколо 6 карток */
	.sheet-grid--cut-lines {
		border: 1px dashed #d9d9d9;
		box-sizing: border-box;
	}

	.sheet-slot {
		position: relative;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		overflow: hidden;
		container-type: inline-size;
		container-name: card;
	}

	/* Спільна вертикальна лінія розрізу між 1-ю і 2-ю колонками */
	.sheet-slot--cut-lines.sheet-slot--col-left {
		border-right: 1px dashed #d9d9d9;
	}

	/* Спільні горизонтальні лінії розрізу між 1-м, 2-м та 3-м рядами */
	.sheet-slot--cut-lines.sheet-slot--row-inner {
		border-bottom: 1px dashed #d9d9d9;
	}

	@media print {
		.posviata-sheet,
		.posviata-sheet * {
			font-family: 'e-Ukraine', var(--font-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
		}

		.posviata-sheet {
			width: 297mm !important;
			height: 210mm !important;
			max-width: none !important;
			aspect-ratio: auto !important;
			margin: 0 !important;
			padding: 10.81mm 11.27mm !important;
			box-shadow: none !important;
			border: none !important;
			border-radius: 0 !important;
			page-break-after: always !important;
			break-after: page !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			box-sizing: border-box !important;
		}

		.sheet-grid {
			width: 274.46mm !important;
			height: 188.38mm !important;
			grid-template-columns: 137.23mm 137.23mm !important;
			grid-template-rows: 62.79mm 62.79mm 62.79mm !important;
			box-sizing: border-box !important;
		}

		.sheet-grid--cut-lines {
			border: 0.25mm dashed #d9d9d9 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.sheet-slot {
			width: 137.23mm !important;
			height: 62.79mm !important;
			box-sizing: border-box !important;
		}

		.sheet-slot--cut-lines.sheet-slot--col-left {
			border-right: 0.25mm dashed #d9d9d9 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.sheet-slot--cut-lines.sheet-slot--row-inner {
			border-bottom: 0.25mm dashed #d9d9d9 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.posviata-sheet:last-child {
			page-break-after: avoid !important;
			break-after: avoid !important;
		}
	}
</style>
