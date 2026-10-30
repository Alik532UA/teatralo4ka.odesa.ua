<script lang="ts">
	import { UART_SECRETS_BOOKLET, UART_BOOKLET_THEMES } from '$lib/data/uartSecretsBooklet';
	import { Clock, Calendar } from 'lucide-svelte';

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

	const leadership = $derived([
		{ roleUk: 'Художній керівник театру «UArt»', roleEn: 'Artistic Director of "UArt"', namesUk: 'Федір Ткач', namesEn: 'Fedir Tkach' },
		{ roleUk: 'Директор школи', roleEn: 'School Director', namesUk: 'Олена Ткач', namesEn: 'Olena Tkach' },
		{ roleUk: 'Адміністрація', roleEn: 'Administration', namesUk: 'Оксана Панченко, Наталія Шалашна', namesEn: 'Oksana Panchenko, Nataliia Shalashna' }
	]);
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
	<section class="sheet-half sheet-half--left cast-half" aria-label={isEn ? 'Cast and Characters' : 'Дійові особи та виконавці'}>
		<div class="half-content half-content--left">
			<header class="half-header">
				<p class="tagline">{isEn ? data.theatreEn : data.theatreUk} · {isEn ? data.titleEn : data.titleUk}</p>
				<h2 class="section-title">{isEn ? 'Cast & Performers:' : 'Дійові особи та виконавці:'}</h2>
			</header>

			<ul class="cast-list" role="list">
				{#each data.cast as item, idx (idx)}
					{#if item.characterUk.includes(',')}
						<li class="cast-row cast-row--multi">
							<div class="multi-char-box"><span class="cast-character">{isEn ? item.characterEn : item.characterUk}</span></div>
							<span class="cast-leader" aria-hidden="true"></span>
							<span class="cast-actor">{isEn ? item.actorEn : item.actorUk}</span>
						</li>
					{:else}
						<li class="cast-row">
							<span class="cast-character">{isEn ? item.characterEn : item.characterUk}</span>
							<span class="cast-leader" aria-hidden="true"></span>
							<span class="cast-actor">{isEn ? item.actorEn : item.actorUk}</span>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	</section>

	<!-- Центральна лінія згину буклету навпіл -->
	<div class="sheet-fold-line" aria-hidden="true">
		<span class="fold-badge">{isEn ? 'fold line' : 'лінія згину'}</span>
	</div>

	<!-- Права половина: Постановники, педагоги, керівництво та метадані (Inside Right, A5) -->
	<section class="sheet-half sheet-half--right credits-half" aria-label={isEn ? 'Production Team and Details' : 'Постановники та відомості про виставу'}>
		<div class="half-content half-content--right">
			{#snippet creditRow(role: string, names: string)}
				<li class="credit-row">
					<span class="credit-role">{role} –</span>
					<span class="credit-names">
						{#each names.split(', ') as name, nIdx}
							{#if nIdx > 0}{', '}{/if}<span class="credit-name">{name}</span>
						{/each}
					</span>
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

			<!-- Блок 3. Керівництво та адміністрація -->
			<div class="credits-block">
				<h3 class="subsection-title">{isEn ? 'Leadership & Administration:' : 'Керівництво та адміністрація:'}</h3>
				<ul class="credits-list" role="list">
					{#each leadership as item, idx (idx)}
						{@render creditRow(isEn ? item.roleEn : item.roleUk, isEn ? item.namesEn : item.namesUk)}
					{/each}
				</ul>
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
					<strong class="widget-val">{isEn ? data.premiereEn : data.premiereUk}</strong>
				</div>

				<div class="meta-widget meta-widget--age">
					<span class="widget-label widget-label--age">{isEn ? 'Age' : 'Вік'}</span>
					<strong class="widget-val widget-val--age">{data.ageBadge}</strong>
				</div>
			</div>
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
	.sheet-half { position: relative; height: 100%; overflow: hidden; padding: 6.5% 8.5%; box-sizing: border-box; }
	.half-content { height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
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
	.half-header { margin-bottom: clamp(6px, 1cqi, 12px); }
	.tagline { margin: 0 0 4px; font-size: clamp(8.5px, 1.12cqi, 11.5px); text-transform: uppercase; letter-spacing: 0.06em; color: var(--sheet-muted, #cbd5e1); font-weight: 600; white-space: nowrap; }
	.section-title { margin: 0 0 clamp(8px, 1.2cqi, 14px); font-size: clamp(15px, 2.1cqi, 21px); font-weight: 800; letter-spacing: 0.02em; color: var(--sheet-accent, #ffed00); border-bottom: 2px solid var(--sheet-border, rgba(255, 237, 0, 0.3)); padding-bottom: 5px; }
	.subsection-title { margin: 0 0 4px; font-size: clamp(11.5px, 1.55cqi, 15px); font-weight: 800; color: var(--sheet-accent, #ffed00); border-bottom: 1px dashed var(--sheet-border, rgba(255, 237, 0, 0.2)); padding-bottom: 3px; }

	.cast-list {
		list-style: none;
		margin: clamp(10px, 1.4cqi, 18px) 0 0;
		padding: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.cast-row { display: flex; align-items: baseline; font-size: clamp(13.5px, 1.9cqi, 18.5px); line-height: 1.35; }
	.cast-character { font-weight: 600; color: var(--sheet-muted, #cbd5e1); white-space: nowrap; }
	.cast-leader { flex: 1; min-width: 8px; margin: 0 10px 4px; border-bottom: 1.5px dotted var(--sheet-border, rgba(255, 255, 255, 0.35)); align-self: flex-end; }
	.cast-actor { font-weight: 800; color: var(--sheet-text, #ffffff); white-space: nowrap; }
	.cast-row--multi { align-items: center; margin-top: 3px; }
	.multi-char-box { max-width: 58%; line-height: 1.3; }
	.cast-row--multi .cast-character { white-space: normal; font-size: clamp(11px, 1.45cqi, 14.5px); font-style: italic; }

	.credits-block { display: flex; flex-direction: column; gap: 3px; margin-bottom: clamp(6px, 1cqi, 12px); }
	.credits-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: clamp(3px, 0.55cqi, 6px); }
	.credit-row { font-size: clamp(11px, 1.5cqi, 14.5px); line-height: 1.35; }
	.credit-role { font-weight: 600; color: var(--sheet-muted, #cbd5e1); }
	.credit-names { font-weight: 700; color: var(--sheet-text, #ffffff); }
	.credit-name { white-space: nowrap; }

	/* 3 окремих дворівневих контейнери метаданих (Варіант A) */
	.meta-widgets-grid {
		display: grid;
		grid-template-columns: 1fr 1.4fr 0.6fr;
		gap: clamp(6px, 0.9cqi, 10px);
		margin-top: auto;
	}
	.meta-widget {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: clamp(8px, 1.2cqi, 12px) clamp(10px, 1.35cqi, 14px);
		border-radius: 8px;
		background: rgba(255, 237, 0, 0.04);
		border: 1.5px solid var(--sheet-border, rgba(255, 237, 0, 0.25));
	}
	.inside-sheet--light .meta-widget { background: #f8fafc; border-color: rgba(0, 0, 0, 0.12); }
	.widget-head {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: clamp(8.5px, 1.15cqi, 11px);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 700;
		color: var(--sheet-muted, #94a3b8);
	}
	:global(.widget-icon) { color: var(--sheet-accent, #ffed00); flex-shrink: 0; }
	.inside-sheet--light :global(.widget-icon) { color: #0f172a; }
	.widget-val {
		font-size: clamp(12px, 1.6cqi, 15.5px);
		font-weight: 800;
		color: var(--sheet-text, #ffffff);
		line-height: 1.25;
		margin-top: 3px;
		white-space: nowrap;
	}
	.meta-widget--age {
		align-items: center;
		justify-content: center;
		background: rgba(255, 237, 0, 0.08);
		border-color: var(--sheet-accent, #ffed00);
		gap: 2px;
	}
	.inside-sheet--light .meta-widget--age { background: #f1f5f9; border-color: #0f172a; }
	.widget-label--age { color: var(--sheet-muted, #94a3b8); font-size: clamp(8px, 1.05cqi, 10px); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
	.widget-val--age { font-size: clamp(15px, 2cqi, 20px); font-weight: 900; color: var(--sheet-accent, #ffed00); margin-top: 0; }
	.inside-sheet--light .widget-val--age { color: #0f172a; }

	@media print {
		.booklet-sheet { width: 297mm !important; height: 210mm !important; max-width: none !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; border: none !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
		.sheet-half { padding: 12mm 14mm !important; }
		.sheet-fold-line { background: repeating-linear-gradient(to bottom, var(--sheet-border, rgba(255, 255, 255, 0.25)) 0, var(--sheet-border, rgba(255, 255, 255, 0.25)) 4mm, transparent 4mm, transparent 8mm) !important; }
		.fold-badge { display: none !important; }
		.section-title { font-size: 15pt !important; padding-bottom: 2mm !important; margin-bottom: 3mm !important; }
		.subsection-title { font-size: 12pt !important; }
		.cast-row { font-size: 13.5pt !important; line-height: 1.4 !important; }
		.cast-row--multi .cast-character { font-size: 11pt !important; }
		.credit-row { font-size: 12pt !important; line-height: 1.35 !important; }
		.meta-widgets-grid { gap: 2mm !important; }
		.meta-widget { padding: 2mm 3mm !important; }
		.widget-head { font-size: 8.5pt !important; }
		.widget-val { font-size: 10.5pt !important; }
		.widget-val--age { font-size: 13.5pt !important; }
	}
</style>
