<script lang="ts">
	import { UART_DOSVID_BOOKLET } from '$lib/data/uartDosvidBooklet';
	import { Clock, Calendar } from 'lucide-svelte';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'uart-dark' }: Props = $props();

	const data = UART_DOSVID_BOOKLET;
	const isLight = $derived(themeId === 'uart-light');
</script>

<div
	class="booklet-sheet inside-sheet"
	class:inside-sheet--light={isLight}
	data-testid="uart-dosvid-inside-card"
	role="region"
	aria-label={isEn ? 'A4 Booklet Sheet 2 (Inside Spread)' : 'Аркуш 2 буклету A4 (Внутрішній розворот)'}
>
	<!-- Ліва половина: Дійові особи та виконавці (10 записів) -->
	<section
		class="sheet-half sheet-half--left cast-half"
		aria-label={isEn ? 'Cast and Characters' : 'Дійові особи та виконавці'}
	>
		<div class="half-content">
			<header class="half-header">
				<h2 class="section-title">
					{isEn ? 'Characters and Cast' : 'Дійові особи та виконавці'}
				</h2>
			</header>

			<ul class="cast-list" aria-label={isEn ? 'Characters list' : 'Список дійових осіб'}>
				{#each data.cast as item (item.characterUk)}
					<li class="cast-row">
						<span class="cast-character">{isEn ? item.characterEn : item.characterUk}</span>
						<span class="cast-leader" aria-hidden="true"></span>
						<span class="cast-actor">{isEn ? item.actorEn : item.actorUk}</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- Центральна лінія згину -->
	<div class="sheet-fold-line" aria-hidden="true">
		<span class="fold-badge">{isEn ? 'fold line' : 'лінія згину'}</span>
	</div>

	<!-- Права половина: Постановочна група, педагоги, метадані та художній керівник -->
	<section
		class="sheet-half sheet-half--right credits-half"
		aria-label={isEn ? 'Production Team and Details' : 'Постановочна група та деталі'}
	>
		<div class="half-content half-content--credits">
			<div class="credits-top-area">
				<header class="half-header">
					<h2 class="section-title">
						{isEn ? 'Production Team' : 'Постановочна група'}
					</h2>
				</header>

				<!-- Творча група (Режисер, Хореограф, Світло) -->
				<div class="credits-block">
					<ul class="credits-list">
						{#each data.crew as item (item.roleUk)}
							<li class="credit-row">
								<div class="credit-line">
									<span class="credit-role">{isEn ? item.roleEn : item.roleUk}:</span>
									<span class="credit-names">{isEn ? item.namesEn : item.namesUk}</span>
								</div>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Педагоги (Вокал, Сценмовлення) -->
				<div class="credits-block">
					<h3 class="subsection-title">{isEn ? 'Teachers' : 'Педагоги'}</h3>
					<ul class="credits-list">
						{#each data.teachers as item (item.roleUk)}
							<li class="credit-row">
								<div class="credit-line">
									<span class="credit-role">{isEn ? item.roleEn : item.roleUk}:</span>
									<span class="credit-names">{isEn ? item.namesEn : item.namesUk}</span>
								</div>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Адміністрація -->
				<div class="credits-block">
					<h3 class="subsection-title">{isEn ? 'Administration' : 'Адміністрація'}</h3>
					<p class="admin-names">
						{isEn ? data.administrationNamesEn : data.administrationNamesUk}
					</p>
				</div>
			</div>

			<div class="credits-bottom-area">
				<!-- Віджети метаданих: тривалість, премʼєра, вік -->
				<div class="meta-widgets-grid">
					<div class="meta-widget">
						<div class="widget-head">
							<Clock size={12} class="widget-icon" aria-hidden="true" />
							<span class="widget-label">{isEn ? 'Duration' : 'Тривалість'}</span>
						</div>
						<span class="widget-val">{isEn ? data.durationEn : data.durationUk}</span>
					</div>

					<div class="meta-widget">
						<div class="widget-head">
							<Calendar size={12} class="widget-icon" aria-hidden="true" />
							<span class="widget-label">{isEn ? 'Premiere' : 'Прем’єра'}</span>
						</div>
						<span class="widget-val">{isEn ? `${data.premiereEn}, ${data.premiereTime}` : `${data.premiereUk}, ${data.premiereTime}`}</span>
					</div>

					<div class="meta-widget meta-widget--age">
						<span class="widget-label widget-label--age">{isEn ? 'Age' : 'Вік'}</span>
						<span class="widget-val widget-val--age">{data.ageBadge}</span>
					</div>
				</div>

				<!-- Рядок художнього керівника -->
				<p class="artistic-director-footer">
					<span class="art-dir-role">{isEn ? 'Artistic Director of UArt Educational Theatre' : 'Художній керівник навчального театру «UArt»'}</span> —
					<span class="art-dir-name">{isEn ? 'Fedir Tkach' : 'Федір Ткач'}</span>
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	.booklet-sheet { --sheet-bg: #161217; --sheet-text: #ffffff; --sheet-muted: #cbd5e1; --sheet-accent: #ffed00; --sheet-border: rgba(255, 237, 0, 0.2); position: relative; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1fr; width: 100%; max-width: 1120px; aspect-ratio: 297 / 210; margin: 0 auto; background: var(--sheet-bg, #161217); color: var(--sheet-text, #ffffff); border-radius: 6px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); border: 1px solid var(--sheet-border, rgba(255, 237, 0, 0.2)); font-family: 'e-Ukraine', var(--font-body), sans-serif; container-type: inline-size; }
	.inside-sheet--light { background: #ffffff !important; color: #111827 !important; border-color: rgba(0, 0, 0, 0.12) !important; }

	.sheet-half { position: relative; height: 100%; overflow: hidden; box-sizing: border-box; padding: clamp(14px, 2.6cqi, 26px) clamp(16px, 3.2cqi, 32px); display: flex; flex-direction: column; }
	.half-content { height: 100%; display: flex; flex-direction: column; justify-content: space-between; }

	.section-title { margin: 0 0 clamp(8px, 1.4cqi, 14px); font-family: 'e-Ukraine', var(--font-body), sans-serif; font-size: clamp(12px, 1.7cqi, 17px); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sheet-accent, #ffed00); border-bottom: 2px solid var(--sheet-accent, #ffed00); padding-bottom: 4px; }
	.subsection-title { margin: clamp(6px, 1.1cqi, 10px) 0 clamp(3px, 0.7cqi, 6px); font-family: 'e-Ukraine', var(--font-body), sans-serif; font-size: clamp(9.5px, 1.25cqi, 12.5px); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sheet-accent, #ffed00); }

	/* Список дійових осіб */
	.cast-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: clamp(5px, 0.95cqi, 9px); flex: 1; justify-content: space-around; }
	.cast-row { display: flex; align-items: baseline; font-size: clamp(9.5px, 1.35cqi, 13.5px); line-height: 1.35; }
	.cast-character { font-weight: 700; color: var(--sheet-accent, #ffed00); white-space: nowrap; flex-shrink: 0; }
	.cast-leader { flex: 1; border-bottom: 1px dotted var(--sheet-muted, #cbd5e1); margin: 0 6px; opacity: 0.55; min-width: 12px; transform: translateY(-2px); }
	.cast-actor { font-weight: 500; color: var(--sheet-text, #ffffff); white-space: nowrap; flex-shrink: 0; text-align: right; }

	/* Творча група */
	.credits-block { margin-bottom: clamp(6px, 1.1cqi, 10px); }
	.credits-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: clamp(3px, 0.65cqi, 6px); }
	.credit-row { font-size: clamp(9px, 1.22cqi, 12px); line-height: 1.35; }
	.credit-line { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
	.credit-role { font-weight: 600; color: var(--sheet-muted, #cbd5e1); flex-shrink: 0; }
	.credit-names { color: var(--sheet-text, #ffffff); font-weight: 500; }
	.admin-names { font-size: clamp(8.5px, 1.15cqi, 11.5px); color: var(--sheet-text, #ffffff); font-weight: 500; line-height: 1.35; }

	/* Віджети метаданих */
	.meta-widgets-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: clamp(6px, 1cqi, 10px); margin-top: clamp(8px, 1.2cqi, 12px); padding-top: clamp(6px, 1cqi, 10px); border-top: 1px solid var(--sheet-border, rgba(255, 237, 0, 0.2)); }
	.meta-widget { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--sheet-border, rgba(255, 237, 0, 0.2)); border-radius: 6px; padding: clamp(4px, 0.8cqi, 8px) clamp(8px, 1.2cqi, 12px); display: flex; flex-direction: column; gap: 2px; }
	.inside-sheet--light .meta-widget { background: #f8fafc !important; border-color: rgba(0, 0, 0, 0.1) !important; }
	.widget-head { display: flex; align-items: center; gap: 4px; color: var(--sheet-accent, #ffed00); }
	:global(.widget-icon) { color: var(--sheet-accent, #ffed00); flex-shrink: 0; }
	.widget-label { font-size: clamp(7px, 0.9cqi, 9.5px); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--sheet-muted, #cbd5e1); }
	.widget-val { font-size: clamp(9px, 1.25cqi, 12.5px); color: var(--sheet-text, #ffffff); font-weight: 700; }
	.meta-widget--age { align-items: center; justify-content: center; min-width: clamp(38px, 6cqi, 54px); padding: 4px 8px; }
	.widget-label--age { font-size: clamp(6.5px, 0.85cqi, 8.5px); }
	.widget-val--age { font-size: clamp(12px, 1.7cqi, 16px); color: var(--sheet-accent, #ffed00); }

	/* Рядок художнього керівника */
	.artistic-director-footer { margin: clamp(6px, 1cqi, 10px) 0 0; padding-top: clamp(4px, 0.7cqi, 8px); border-top: 1px solid var(--sheet-border, rgba(255, 237, 0, 0.2)); font-size: clamp(8px, 1.1cqi, 11px); line-height: 1.35; text-align: center; }
	.art-dir-role { color: var(--sheet-muted, #cbd5e1); font-weight: 500; }
	.art-dir-name { color: var(--sheet-accent, #ffed00); font-weight: 700; }

	/* Центральна лінія згину */
	.sheet-fold-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 6px, transparent 6px, transparent 12px); z-index: 10; pointer-events: none; transform: translateX(-50%); }
	.inside-sheet--light .sheet-fold-line { background: repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0, rgba(0, 0, 0, 0.25) 6px, transparent 6px, transparent 12px); }
	.fold-badge { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.7); color: #cbd5e1; font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; padding: 1px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255, 255, 255, 0.2); }
	.inside-sheet--light .fold-badge { background: rgba(255, 255, 255, 0.9); color: #475569; border-color: rgba(0, 0, 0, 0.15); }

	/* Стилі друку */
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
