<script lang="ts">
	import { activateOnKey } from '$lib/utils/activateOnKey';

	/**
	 * Знімок плитки. Ширший за `LightboxImage` на три поля, і кожне має причину:
	 * `position` кадрує плитку (у «Про школу» так виправлено сім знімків із
	 * десяти), а `width`/`height` заявляють місце під зображення — без них тег
	 * до завантаження займає нуль, і розкладка стрибає (`src/image-dimensions.test.ts`).
	 */
	export interface BentoImage {
		src: string;
		alt?: string;
		title?: string;
		/** `object-position` — яку частину знімка показати в плитці. */
		position?: string;
		width?: number;
		height?: number;
	}

	/**
	 * Бенто-галерея знімків: перша плитка велика, решта складається в мозаїку.
	 *
	 * ## Чому компонент, а не третя копія розмітки
	 *
	 * Ця сітка вже жила двома копіями — на сторінці «Про школу» і на головній
	 * (там свій варіант `g-bento-4x3`). Новина 2026-09-04 просила «як в
	 * about-gallery-list», тобто рівно те саме, і третя копія означала б, що
	 * правка плитки, зроблена в одному місці, тихо не діє у двох інших. Розмітка
	 * й стилі перенесені зі сторінки «Про школу» БЕЗ змін — це витяг, а не нове
	 * оформлення.
	 *
	 * ## Що компонент НЕ робить
	 *
	 * Не тримає лайтбокс і не обмежує кількість знімків. Перше — бо лайтбокс на
	 * сторінці один, і власний примірник у кожної галереї означав би два різні
	 * стани відкритого знімка. Друге — бо межу задає налаштування сторінки
	 * (`maxItemsGrid` у «Про школу»), і компонент про нього знати не мусить.
	 */
	interface Props {
		/** Знімки в порядку показу — уже обрізані сторінкою до потрібної кількості. */
		items: readonly BentoImage[];
		/**
		 * Початок `data-testid`. Свій на кожній сторінці: `e2e/testid.spec.ts`
		 * вимагає унікальності в межах сторінки.
		 */
		testIdPrefix: string;
		/** Підпис поверх знімка на наведенні. Немає — плитка без напису. */
		showCaptions?: boolean;
		/** Що робити на кліку: сторінка відкриває свій лайтбокс на цьому індексі. */
		onpick: (index: number) => void;
	}

	let { items, testIdPrefix, showCaptions = true, onpick }: Props = $props();
</script>

<div class="g-bento" data-testid="{testIdPrefix}-list">
	{#each items as img, i (img.src)}
		<div
			class="g-bento__item g-bento__item--{i}"
			data-testid="{testIdPrefix}-item-{i}"
			onclick={() => onpick(i)}
			onkeydown={activateOnKey(() => onpick(i))}
			role="button"
			tabindex="0"
		>
			<img
				src={img.src}
				alt={img.alt}
				width={img.width ?? 1200}
				height={img.height ?? 900}
				loading="lazy"
				decoding="async"
				style={img.position ? `object-position: ${img.position}` : ''}
				data-testid="{testIdPrefix}-img-{i}"
			/>
			{#if showCaptions && img.title}
				<div class="g-bento__overlay" data-testid="{testIdPrefix}-overlay-{i}">
					<span class="g-bento__caption" data-testid="{testIdPrefix}-caption-text-{i}">{img.title}</span>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.g-bento {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-auto-rows: 240px;
		gap: 24px;
	}
	.g-bento__item {
		position: relative;
		border-radius: 40px;
		overflow: hidden;
		box-shadow: 0 15px 35px rgba(0,0,0,0.05);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
		cursor: pointer;
	}
	.g-bento__item:hover {
		box-shadow: 0 20px 50px color-mix(in srgb, var(--accent-primary), transparent 70%);
		z-index: 2;
	}
	.g-bento__item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.g-bento__item:hover img {
		transform: scale(1.08);
	}
	
	/* Adaptive Grid Spans */
	.g-bento__item--0 { grid-column: span 2; grid-row: span 2; }
	.g-bento__item--1 { grid-column: span 2; grid-row: span 1; }
	.g-bento__item--2 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--3 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--4 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--5 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--6 { grid-column: span 2; grid-row: span 1; }
	.g-bento__item--7 { grid-column: span 2; grid-row: span 1; }
	.g-bento__item--8 { grid-column: span 1; grid-row: span 1; }
	.g-bento__item--9 { grid-column: span 1; grid-row: span 1; }

	.g-bento__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, color-mix(in srgb, var(--text-title), transparent 15%), transparent 60%);
		display: flex;
		align-items: flex-end;
		padding: 2rem;
		opacity: 0;
		transition: opacity 0.4s ease;
	}
	.g-bento__item:hover .g-bento__overlay { opacity: 1; }
	.g-bento__caption {
		color: var(--color-white);
		font-family: var(--font-heading);
		font-size: 1.2rem;
		font-weight: 800;
		transform: translateY(20px);
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.g-bento__item:hover .g-bento__caption { transform: translateY(0); }

	@media (max-width: 1024px) {
		.g-bento { grid-template-columns: repeat(2, 1fr); }
		/* Reset spans for tablet */
		.g-bento__item { grid-column: span 1 !important; grid-row: span 1 !important; }
		.g-bento__item--0 { grid-column: span 2 !important; grid-row: span 2 !important; }
	}

	@media (max-width: 640px) {
		.g-bento { grid-template-columns: 1fr; grid-auto-rows: 200px; }
		.g-bento__item { grid-column: span 1 !important; grid-row: span 1 !important; border-radius: 32px; }
	}
</style>
