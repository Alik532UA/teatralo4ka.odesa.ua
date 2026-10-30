<script lang="ts">
	import { UART_SECRETS_BOOKLET, UART_BOOKLET_THEMES } from '$lib/data/uartSecretsBooklet';

	interface Props {
		isEn?: boolean;
		themeId?: string;
	}

	let { isEn = false, themeId = 'uart-dark' }: Props = $props();

	const data = UART_SECRETS_BOOKLET;
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
	data-testid="uart-booklet-inside-card"
	role="region"
	aria-label={isEn ? 'A4 Booklet Sheet 2 (Inside Spread)' : 'Аркуш 2 буклету A4 (Внутрішній розворот)'}
>
	<!-- Ліва половина: Дійові особи та виконавці (Inside Left, A5) -->
	<section
		class="sheet-half sheet-half--left cast-half"
		aria-label={isEn ? 'Cast and Characters' : 'Дійові особи та виконавці'}
	>
		<div class="half-content">
			<header class="half-header">
				<p class="tagline">{isEn ? data.theatreEn : data.theatreUk} · {isEn ? data.titleEn : data.titleUk}</p>
				<h2 class="section-title">
					{isEn ? 'Cast & Performers:' : 'Дійові особи та виконавці:'}
				</h2>
			</header>

			<ul class="cast-list" role="list">
				{#each data.cast as item, idx (idx)}
					<li class="cast-row" class:cast-row--multi={item.characterUk.includes(',')}>
						<span class="cast-character">{isEn ? item.characterEn : item.characterUk}</span>
						<span class="cast-leader" aria-hidden="true"></span>
						<span class="cast-actor">{isEn ? item.actorEn : item.actorUk}</span>
					</li>
				{/each}
			</ul>

			<div class="cast-footer-note" aria-hidden="true">
				<span class="ornament">✦</span>
			</div>
		</div>
	</section>

	<!-- Центральна лінія згину буклету навпіл -->
	<div class="sheet-fold-line" aria-hidden="true">
		<span class="fold-badge">{isEn ? 'fold line' : 'лінія згину'}</span>
	</div>

	<!-- Права половина: Постановники, педагоги, адміністрація та метадані (Inside Right, A5) -->
	<section
		class="sheet-half sheet-half--right credits-half"
		aria-label={isEn ? 'Production Team and Details' : 'Постановники та відомості про виставу'}
	>
		<div class="half-content">
			<!-- Постановники -->
			<div class="credits-block">
				<h2 class="section-title">
					{isEn ? 'Production Team:' : 'Над виставою працювали:'}
				</h2>
				<ul class="credits-list" role="list">
					{#each data.crew as item, idx (idx)}
						<li class="credit-row">
							<span class="credit-role">{isEn ? item.roleEn : item.roleUk} –</span>
							<span class="credit-names">{isEn ? item.namesEn : item.namesUk}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Педагоги -->
			<div class="credits-block credits-block--compact">
				<h3 class="subsection-title">
					{isEn ? 'Odesa Theatre School Faculty:' : 'Педагоги Одеської театральної школи:'}
				</h3>
				<ul class="credits-list" role="list">
					{#each data.teachers as item, idx (idx)}
						<li class="credit-row">
							<span class="credit-role">{isEn ? item.roleEn : item.roleUk} –</span>
							<span class="credit-names">{isEn ? item.namesEn : item.namesUk}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Адміністрація -->
			<div class="credits-block credits-block--compact">
				<ul class="credits-list" role="list">
					{#each data.administration as item, idx (idx)}
						<li class="credit-row">
							<span class="credit-role">{isEn ? item.roleEn : item.roleUk} –</span>
							<span class="credit-names">{isEn ? item.namesEn : item.namesUk}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Метадані вистави: Тривалість, Премʼєра, Вік -->
			<div class="meta-pills-row" aria-label={isEn ? 'Play Information' : 'Відомості про виставу'}>
				<span class="meta-pill">
					<strong>{isEn ? 'Duration:' : 'Тривалість:'}</strong> {isEn ? data.durationEn : data.durationUk}
				</span>
				<span class="meta-pill">
					<strong>{isEn ? 'Premiere:' : 'Прем’єра:'}</strong> {isEn ? data.premiereEn : data.premiereUk}
				</span>
				<span class="meta-pill meta-pill--age">
					<strong>{data.ageBadge}</strong>
				</span>
			</div>

			<!-- Художній керівник театру -->
			<footer class="artistic-director-footer">
				<p class="director-text">
					{isEn ? data.artisticDirectorEn : data.artisticDirectorUk}
				</p>
			</footer>
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
	}

	.inside-sheet--light { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }
	.sheet-half { position: relative; height: 100%; overflow: hidden; padding: 3% 4.5%; box-sizing: border-box; }
	.half-content { height: 100%; display: flex; flex-direction: column; justify-content: space-between; }

	/* Центральна лінія згину */
	.sheet-fold-line {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: repeating-linear-gradient(to bottom, var(--sheet-border, rgba(255, 255, 255, 0.25)) 0, var(--sheet-border, rgba(255, 255, 255, 0.25)) 6px, transparent 6px, transparent 12px);
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

	.inside-sheet--light .fold-badge { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
	.half-header { margin-bottom: clamp(4px, 0.8cqi, 8px); }
	.tagline { margin: 0 0 2px; font-size: clamp(7px, 0.85cqi, 9.5px); text-transform: uppercase; letter-spacing: 0.08em; color: var(--sheet-muted, #cbd5e1); font-weight: 500; }
	.section-title { margin: 0 0 clamp(4px, 0.8cqi, 8px); font-size: clamp(10.5px, 1.45cqi, 15px); font-weight: 700; letter-spacing: 0.02em; color: var(--sheet-accent, #ffed00); border-bottom: 1.5px solid var(--sheet-border, rgba(255, 237, 0, 0.25)); padding-bottom: 3px; }
	.subsection-title { margin: clamp(2px, 0.4cqi, 5px) 0 2px; font-size: clamp(8.5px, 1.15cqi, 12px); font-weight: 700; color: var(--sheet-accent, #ffed00); }

	/* Список дійових осіб */
	.cast-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: clamp(2px, 0.5cqi, 5px); flex: 1; justify-content: space-around; }
	.cast-row { display: flex; align-items: baseline; font-size: clamp(8px, 1.15cqi, 11.5px); line-height: 1.3; }
	.cast-character { font-weight: 500; color: var(--sheet-muted, #cbd5e1); white-space: nowrap; }
	.cast-row--multi .cast-character { white-space: normal; max-width: 62%; font-size: clamp(7px, 0.95cqi, 10px); line-height: 1.15; }
	.cast-leader { flex: 1; min-width: 8px; margin: 0 8px 3px; border-bottom: 1px dotted var(--sheet-border, rgba(255, 255, 255, 0.35)); align-self: flex-end; }
	.cast-actor { font-weight: 700; color: var(--sheet-text, #ffffff); white-space: nowrap; }
	.cast-footer-note { text-align: center; padding-top: 2px; color: var(--sheet-accent, #ffed00); opacity: 0.6; font-size: 10px; }

	/* Блоки постановочної групи */
	.credits-block { margin-bottom: clamp(2px, 0.5cqi, 5px); }
	.credits-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: clamp(1px, 0.35cqi, 3px); }
	.credit-row { font-size: clamp(7.5px, 1.05cqi, 10.5px); line-height: 1.25; }
	.credit-role { font-weight: 600; color: var(--sheet-muted, #cbd5e1); }
	.credit-names { font-weight: 600; color: var(--sheet-text, #ffffff); }

	/* Метадані */
	.meta-pills-row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: clamp(2px, 0.4cqi, 6px); padding-top: clamp(2px, 0.4cqi, 5px); border-top: 1px solid var(--sheet-border, rgba(255, 255, 255, 0.15)); }
	.meta-pill { font-size: clamp(7px, 0.95cqi, 9.5px); padding: 1.5px 6px; border-radius: 4px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--sheet-border, rgba(255, 255, 255, 0.15)); color: var(--sheet-text, #ffffff); }
	.inside-sheet--light .meta-pill { background: #f8fafc; }
	.meta-pill--age { color: var(--sheet-accent, #ffed00); font-weight: 700; border-color: var(--sheet-accent, #ffed00); }
	.artistic-director-footer { margin-top: clamp(2px, 0.5cqi, 6px); padding-top: clamp(2px, 0.4cqi, 4px); border-top: 1px dashed var(--sheet-border, rgba(255, 255, 255, 0.2)); text-align: center; }
	.director-text { margin: 0; font-size: clamp(7.5px, 1.05cqi, 10.5px); font-weight: 700; letter-spacing: 0.03em; color: var(--sheet-accent, #ffed00); }

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
			background: repeating-linear-gradient(to bottom, var(--sheet-border, rgba(255, 255, 255, 0.25)) 0, var(--sheet-border, rgba(255, 255, 255, 0.25)) 4mm, transparent 4mm, transparent 8mm) !important;
		}

		.fold-badge { display: none !important; }
		.section-title { font-size: 11pt !important; padding-bottom: 1.5mm !important; margin-bottom: 2mm !important; }
		.subsection-title { font-size: 8.5pt !important; }
		.cast-row { font-size: 8.5pt !important; line-height: 1.35 !important; }
		.cast-row--multi .cast-character { font-size: 7.2pt !important; }
		.credit-row { font-size: 8pt !important; line-height: 1.25 !important; }
		.meta-pill { font-size: 7pt !important; padding: 1mm 2.5mm !important; }
		.director-text { font-size: 8pt !important; }
	}
</style>
