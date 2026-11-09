<script lang="ts">
	import { UART_DOSVID_BOOKLET, UART_BOOKLET_THEMES } from '$lib/data/uartDosvidBooklet';
	import { Clock, Calendar } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
		showArtisticDirector?: boolean;
	}

	let { isEn = false, themeId = 'uart-dark', showArtisticDirector = false }: Props = $props();

	const data = UART_DOSVID_BOOKLET;
	const theme = $derived(
		UART_BOOKLET_THEMES.find((t) => t.id === themeId) ?? UART_BOOKLET_THEMES[0]
	);
	const isLight = $derived(themeId === 'uart-light');
</script>

<div
	class="booklet-sheet inside-sheet"
	class:inside-sheet--light={isLight}
	style:--sheet-bg={theme.sheet2Bg}
	style:--sheet-text={theme.sheet2Text}
	style:--sheet-muted={theme.sheet2Muted}
	style:--sheet-accent={theme.sheet2Accent}
	style:--sheet-border={theme.sheet2Border}
	data-testid="uart-dosvid-inside-card"
	role="region"
	aria-label={isEn ? 'A4 Booklet Sheet 2 (Inside Spread)' : 'Аркуш 2 буклету A4 (Внутрішній розворот)'}
>
	<!-- Ліва половина: Дійові особи та виконавці (Inside Left, A5) -->
	<section
		class="sheet-half sheet-half--left cast-half"
		aria-label={isEn ? 'Cast and Characters' : 'Дійові особи та виконавці'}
	>
		<div class="half-content">
			<h2 class="section-title">{isEn ? 'Cast & Performers:' : 'Дійові особи та виконавці:'}</h2>

			<ul class="cast-list" role="list">
				{#each data.cast as item, idx (idx)}
					<li class="cast-row">
						<span class="cast-character">{isEn ? item.characterEn : item.characterUk}</span>
						<span class="cast-leader" aria-hidden="true"></span>
						<span class="cast-actor">{isEn ? item.actorEn : item.actorUk}</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- Центральна лінія згину буклету навпіл -->
	<div class="sheet-fold-line" aria-hidden="true">
		<span class="fold-badge">{isEn ? 'fold line' : 'лінія згину'}</span>
	</div>

	<!-- Права половина: Постановники, педагоги, керівництво та метадані (Inside Right, A5) -->
	<section
		class="sheet-half sheet-half--right credits-half"
		aria-label={isEn ? 'Production Team and Details' : 'Постановники та відомості про виставу'}
	>
		<div class="half-content">
			{#snippet creditRow(role: string, names: string)}
				<li class="credit-row">
					<div class="credit-line">
						<span class="credit-role">{role} –</span>
						<span class="credit-names">{names}</span>
					</div>
				</li>
			{/snippet}

			<!-- Блок 1. Постановна група -->
			<div class="credits-block">
				<h2 class="section-title">{isEn ? 'Production Team:' : 'Над виставою працювали:'}</h2>
				<ul class="credits-list" role="list">
					{#each data.crew as item, idx (idx)}
						{@render creditRow(isEn ? item.roleEn : item.roleUk, isEn ? item.namesEn : item.namesUk)}
					{/each}
				</ul>
			</div>

			<!-- Блок 2. Педагоги школи -->
			<div class="credits-block">
				<h3 class="subsection-title">{isEn ? 'Theatre School Faculty:' : 'Педагоги Одеської театральної школи:'}</h3>
				<ul class="credits-list" role="list">
					{#each data.teachers as item, idx (idx)}
						{@render creditRow(isEn ? item.roleEn : item.roleUk, isEn ? item.namesEn : item.namesUk)}
					{/each}
				</ul>
			</div>

			<!-- Блок 3. Адміністрація -->
			<div class="credits-block">
				<h3 class="subsection-title">{isEn ? 'Administration:' : 'Адміністрація:'}</h3>
				<div class="admin-names">
					{isEn ? data.administrationNamesEn : data.administrationNamesUk}
				</div>
			</div>

			<!-- 3 окремих дворівневих контейнери метаданих -->
			<div class="meta-widgets-grid" aria-label={isEn ? 'Play Information' : 'Відомості про виставу'}>
				<div class="meta-widget">
					<div class="widget-head">
						<Clock size={15} strokeWidth={2.3} class="widget-icon" />
						<span class="widget-label">{isEn ? 'Duration' : 'Тривалість'}</span>
					</div>
					<strong class="widget-val">{isEn ? data.durationEn : data.durationUk}</strong>
				</div>

				<div class="meta-widget">
					<div class="widget-head">
						<Calendar size={15} strokeWidth={2.3} class="widget-icon" />
						<span class="widget-label">{isEn ? 'Premiere' : 'Прем’єра'}</span>
					</div>
					<strong class="widget-val widget-val--premiere">
						<span class="val-date">{isEn ? data.premiereEn : data.premiereUk}</span>
						<span class="val-time">{data.premiereTime}</span>
					</strong>
				</div>

				<div class="meta-widget meta-widget--age">
					<span class="widget-label widget-label--age">{isEn ? 'Age' : 'Вік'}</span>
					<strong class="widget-val widget-val--age">{data.ageBadge}</strong>
				</div>
			</div>

			<!-- Рядок художнього керівника внизу (приховано за замовчуванням, можна відновити через showArtisticDirector={true}) -->
			{#if showArtisticDirector}
				<p class="artistic-director-footer">
					<span class="art-dir-role">{isEn ? 'Artistic Director of UArt Educational Theatre –' : 'Художній керівник навчального театру «UArt» –'}</span>
					<span class="art-dir-name">{isEn ? 'Fedir Tkach' : 'Федір Ткач'}</span>
				</p>
			{/if}
		</div>
	</section>
</div>

<style>
	.booklet-sheet {
		--sheet-bg: #161217;
		--sheet-text: #ffffff;
		--sheet-muted: #cbd5e1;
		--sheet-accent: #ffed00;
		--sheet-border: rgba(255, 237, 0, 0.2);
		position: relative;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: 100%;
		max-width: 1120px;
		aspect-ratio: 297 / 210;
		margin: 0 auto;
		background: var(--sheet-bg, #161217);
		color: var(--sheet-text, #ffffff);
		border-radius: 6px;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
		border: 1px solid var(--sheet-border, rgba(255, 237, 0, 0.2));
		font-family: 'e-Ukraine', var(--font-body), sans-serif;
		container-type: inline-size;
	}
	.inside-sheet--light { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }
	.sheet-half { position: relative; height: 100%; overflow: hidden; padding: clamp(16px, 2.8cqi, 28px) clamp(20px, 4cqi, 40px); box-sizing: border-box; }
	.half-content { height: 100%; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
	.sheet-fold-line {
		position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
		background: repeating-linear-gradient(to bottom, var(--sheet-border, rgba(255, 255, 255, 0.25)) 0, var(--sheet-border, rgba(255, 255, 255, 0.25)) 6px, transparent 6px, transparent 12px);
		z-index: 10; pointer-events: none; transform: translateX(-50%);
	}
	.fold-badge {
		position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7); color: #cbd5e1; font-size: 8px; text-transform: uppercase;
		letter-spacing: 0.08em; padding: 1px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255, 255, 255, 0.2);
	}
	.inside-sheet--light .fold-badge { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
	.section-title { margin: 0 0 clamp(8px, 1.2cqi, 14px); font-size: clamp(14px, 2cqi, 20px); font-weight: 700; letter-spacing: 0.02em; color: var(--sheet-accent, #ffed00); border-bottom: 2px solid var(--sheet-border, rgba(255, 237, 0, 0.3)); padding-bottom: 5px; }
	.subsection-title { margin: 0 0 clamp(4px, 0.6cqi, 7px); font-size: clamp(11px, 1.5cqi, 14.5px); font-weight: 700; color: var(--sheet-accent, #ffed00); border-bottom: 1px dashed var(--sheet-border, rgba(255, 237, 0, 0.2)); padding-bottom: 3px; }

	.cast-list {
		list-style: none;
		margin: clamp(8px, 1.2cqi, 14px) 0 0;
		padding: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.cast-row { display: flex; align-items: baseline; font-size: clamp(12.5px, 1.75cqi, 17px); line-height: 1.35; min-width: 0; }
	.cast-character { font-weight: 600; color: var(--sheet-muted, #cbd5e1); white-space: nowrap; flex-shrink: 0; }
	.cast-leader { flex: 1; min-width: 8px; margin: 0 8px 4px; border-bottom: 1.5px dotted var(--sheet-border, rgba(255, 255, 255, 0.35)); align-self: flex-end; }
	.cast-actor { font-weight: 700; color: var(--sheet-text, #ffffff); white-space: nowrap; flex-shrink: 0; }

	.credits-block { display: flex; flex-direction: column; gap: clamp(4px, 0.65cqi, 7px); }
	.credits-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: clamp(4px, 0.65cqi, 7px); }
	.credit-row { font-size: clamp(11px, 1.5cqi, 14.5px); line-height: 1.4; min-width: 0; }
	.credit-line { line-height: 1.4; word-break: break-word; }
	.credit-role { font-weight: 600; color: var(--sheet-muted, #cbd5e1); }
	.credit-names { font-weight: 700; color: var(--sheet-text, #ffffff); }
	.admin-names { font-size: clamp(11px, 1.5cqi, 14.5px); line-height: 1.4; font-weight: 700; color: var(--sheet-text, #ffffff); word-break: break-word; }

	/* 3 окремих дворівневих контейнери метаданих */
	.meta-widgets-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1.35fr) auto; gap: clamp(6px, 1cqi, 10px); width: 100%; box-sizing: border-box; }
	.meta-widget { display: flex; flex-direction: column; justify-content: center; min-width: 0; overflow: hidden; padding: clamp(6px, 1cqi, 10px) clamp(8px, 1.2cqi, 12px); border-radius: 8px; background: rgba(255, 237, 0, 0.04); border: 1.5px solid var(--sheet-border, rgba(255, 237, 0, 0.25)); box-sizing: border-box; }
	.inside-sheet--light .meta-widget { background: #f8fafc; border-color: rgba(0, 0, 0, 0.12); }
	.widget-head { display: flex; align-items: center; gap: 5px; font-size: clamp(8px, 1.1cqi, 10.5px); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--sheet-muted, #94a3b8); }
	:global(.widget-icon) { color: var(--sheet-accent, #ffed00); flex-shrink: 0; }
	.inside-sheet--light :global(.widget-icon) { color: #0f172a; }
	.widget-label { color: var(--sheet-muted, #94a3b8); }
	.widget-val { font-size: clamp(10.5px, 1.4cqi, 13.5px); font-weight: 700; color: var(--sheet-text, #ffffff); line-height: 1.25; margin-top: 2px; }
	.widget-val--premiere { display: flex; flex-direction: column; gap: 1px; }
	.val-date { white-space: nowrap; }
	.val-time { font-size: clamp(9.5px, 1.25cqi, 12px); color: var(--sheet-accent, #ffed00); font-weight: 600; }
	.meta-widget--age { align-items: center; justify-content: center; min-width: clamp(40px, 6cqi, 54px); background: rgba(255, 237, 0, 0.08); border-color: var(--sheet-accent, #ffed00); gap: 2px; flex-shrink: 0; }
	.inside-sheet--light .meta-widget--age { background: #f1f5f9; border-color: #0f172a; }
	.widget-label--age { color: var(--sheet-muted, #94a3b8); font-size: clamp(8px, 1.05cqi, 10px); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
	.widget-val--age { font-size: clamp(15px, 2cqi, 20px); font-weight: 700; color: var(--sheet-accent, #ffed00); margin-top: 0; }
	.inside-sheet--light .widget-val--age { color: #0f172a; }

	.artistic-director-footer { margin: 0; font-size: clamp(9.5px, 1.3cqi, 12.5px); line-height: 1.35; text-align: center; }
	.art-dir-role { font-weight: 600; color: var(--sheet-muted, #cbd5e1); }
	.art-dir-name { font-weight: 700; color: var(--sheet-text, #ffffff); }

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
