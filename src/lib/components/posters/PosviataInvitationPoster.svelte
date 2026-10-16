<script lang="ts">
	import {
		chunkStudents,
		getStudentsForSlot,
		type PosviataSlotTime
	} from '$lib/data/posviataInvitations';
	import PosviataInvitationSheet from './PosviataInvitationSheet.svelte';
	import PosviataInvitationToolbar, {
		type InvitationMode
	} from './PosviataInvitationToolbar.svelte';

	interface Props {
		isEn?: boolean;
	}

	let { isEn = false }: Props = $props();

	let selectedYear = $state<string>('2026');
	let selectedTime = $state<PosviataSlotTime>('10:00');
	let selectedMode = $state<InvitationMode>('named');
	let duplexCoverType = $state<'color' | 'bw'>('color');

	const students = $derived(getStudentsForSlot(selectedTime));
	const studentChunks = $derived(chunkStudents(students, 6));

	// Обчислення списку аркушів для відображення та друку
	interface SheetSpec {
		id: string;
		mode: 'named' | 'template' | 'cover';
		students?: typeof students;
		coverType?: 'color' | 'bw';
		labelUk: string;
		labelEn: string;
	}

	const sheets = $derived.by<SheetSpec[]>(() => {
		if (selectedMode === 'template') {
			return [
				{
					id: `template-${selectedTime}`,
					mode: 'template',
					labelUk: `Шаблон під підпис (${selectedTime})`,
					labelEn: `Blank Template (${selectedTime})`
				}
			];
		}

		if (selectedMode === 'cover-color') {
			return [
				{
					id: 'cover-color',
					mode: 'cover',
					coverType: 'color',
					labelUk: 'Сорочка (кольоровий герб)',
					labelEn: 'Cover (Color Emblem)'
				}
			];
		}

		if (selectedMode === 'cover-bw') {
			return [
				{
					id: 'cover-bw',
					mode: 'cover',
					coverType: 'bw',
					labelUk: 'Сорочка (ч/б герб)',
					labelEn: 'Cover (B&W Emblem)'
				}
			];
		}

		if (selectedMode === 'named') {
			return studentChunks.map((chunk, idx) => ({
				id: `named-${selectedTime}-p${idx + 1}`,
				mode: 'named',
				students: chunk,
				labelUk: `Аркуш ${idx + 1} з ${studentChunks.length} (${chunk[0].firstName} ... ${chunk[chunk.length - 1].firstName})`,
				labelEn: `Sheet ${idx + 1} of ${studentChunks.length} (${chunk[0].firstName} ... ${chunk[chunk.length - 1].firstName})`
			}));
		}

		// Duplex (лицьова -> сорочка -> лицьова -> сорочка...)
		const duplexList: SheetSpec[] = [];
		studentChunks.forEach((chunk, idx) => {
			duplexList.push({
				id: `duplex-front-${idx + 1}`,
				mode: 'named',
				students: chunk,
				labelUk: `Аркуш ${idx + 1} (Лицьова: ${chunk[0].firstName} ... ${chunk[chunk.length - 1].firstName})`,
				labelEn: `Sheet ${idx + 1} (Front: ${chunk[0].firstName} ... ${chunk[chunk.length - 1].firstName})`
			});
			duplexList.push({
				id: `duplex-cover-${idx + 1}`,
				mode: 'cover',
				coverType: duplexCoverType,
				labelUk: `Аркуш ${idx + 1} (Сорочка ${duplexCoverType === 'bw' ? 'ч/б' : 'кольорова'})`,
				labelEn: `Sheet ${idx + 1} (Back cover ${duplexCoverType === 'bw' ? 'B&W' : 'Color'})`
			});
		});
		return duplexList;
	});
</script>

<svelte:head>
	<style>
		@page {
			size: A4 landscape;
			margin: 0;
		}
	</style>
</svelte:head>

<section class="posviata-container" data-testid="posviata-invitation-container">
	<!-- Внутрішня панель управління варіантами запрошень -->
	<PosviataInvitationToolbar
		{selectedYear}
		{selectedTime}
		{selectedMode}
		{duplexCoverType}
		{isEn}
		onSelectYear={(year) => (selectedYear = year)}
		onSelectTime={(time) => (selectedTime = time)}
		onSelectMode={(mode) => (selectedMode = mode)}
		onSelectDuplexCover={(type) => (duplexCoverType = type)}
	/>

	<!-- Інформаційний рядок -->
	<div class="summary-bar">
		<span class="summary-count">
			{isEn ? 'Total sheets to print:' : 'Аркушів до друку:'}
			<strong>{sheets.length}</strong>
		</span>
		<span class="summary-hint">
			{selectedMode === 'cover-color' || selectedMode === 'cover-bw'
				? (isEn ? 'Cover sheet has no cut lines' : 'На сорочці лінії розрізу навмисно відсутні')
				: (isEn ? 'Subtle cut lines on front side' : 'Тонкі лінії розрізу є на лицьовій стороні')}
		</span>
	</div>

	<!-- Список аркушів A4 Landscape -->
	<div class="sheets-stack">
		{#each sheets as sheet, sheetIdx (sheet.id)}
			<div class="sheet-wrapper">
				<div class="sheet-header-badge" aria-hidden="true">
					<span class="badge-number">A4 #{sheetIdx + 1}</span>
					<span class="badge-desc">{isEn ? sheet.labelEn : sheet.labelUk}</span>
				</div>
				<PosviataInvitationSheet
					mode={sheet.mode}
					students={sheet.students}
					time={selectedTime}
					coverType={sheet.coverType}
					{isEn}
					sheetIndex={sheetIdx + 1}
					totalSheets={sheets.length}
				/>
			</div>
		{/each}
	</div>
</section>

<style>
	.posviata-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 20px;
	}

	.summary-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 0.9rem;
		color: var(--text-muted);
		padding: 0 4px;
	}

	.summary-count strong {
		color: var(--text-title);
		font-size: 1.05rem;
	}

	.summary-hint {
		font-size: 0.82rem;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		padding: 3px 10px;
		border-radius: 999px;
	}

	.sheets-stack {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
	}

	.sheet-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.sheet-header-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		align-self: center;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-muted);
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		padding: 4px 14px;
		border-radius: 999px;
	}

	.badge-number {
		font-weight: 800;
		color: var(--accent-text, #0284c7);
	}

	@media print {
		.summary-bar,
		.sheet-header-badge {
			display: none !important;
		}

		.posviata-container,
		.sheets-stack,
		.sheet-wrapper {
			display: block !important;
			width: 100% !important;
			margin: 0 !important;
			padding: 0 !important;
			gap: 0 !important;
		}
	}
</style>
