<script lang="ts">
	import { t } from "svelte-i18n";
	import { customScroll } from "$lib/utils/customScroll";

	interface Props {
		years: readonly number[];
		selected: number | "all";
		onselect: (year: number | "all") => void;
	}

	let { years, selected, onselect }: Props = $props();
</script>

<!--
	Роки — шкала часу, а не спадний список і не стовпчик.

	Список приховував усі 28 років за одним кліком і не показував вибраного, доки
	його не відкриєш. Стовпчик показував усі, але був завищий за будь-яке вікно, і
	половина років жила за прокруткою.

	Тому шахівниця: роки навперемін ліворуч і праворуч від центральної лінії, і
	кожен наступний зсунутий на ПІВкнопки. Крок шкали виходить удвічі менший за
	висоту кнопки, а сама кнопка лишається 48px, тобто понад мінімум цілі дотику.
	Заміряно в Playwright: 28 років — 696px замість 1344 стовпчиком, крок 24 при
	кнопці 48.

	`aria-pressed` каже читалці те саме, що підсвітка — оку.
-->
<div
	class="years"
	role="group"
	aria-label={$t("galaxy.filterYear")}
	data-testid="galaxy-roster-years-toolbar"
	{@attach customScroll({ rightOffset: -10, alignThumb: "center" })}
>
	<button
		type="button"
		class="years__all"
		aria-pressed={selected === "all"}
		onclick={() => onselect("all")}
		data-testid="galaxy-roster-year-all-btn">{$t("galaxy.allYears")}</button
	>

	<div class="scale" data-testid="galaxy-roster-timeline-container">
		{#each years as year, index (year)}
			<button
				type="button"
				class="years__btn"
				class:years__btn--right={index % 2 === 1}
				style="grid-row: {index + 1} / span 2; grid-column: {index %
					2 ===
				0
					? 1
					: 2}"
				aria-pressed={selected === year}
				onclick={() => onselect(year)}
				data-testid="galaxy-roster-year-{year}-btn">{year}</button
			>
		{/each}
	</div>
</div>

<style>
	.years {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex-shrink: 0;
		padding-right: 0.75rem;
		overflow-y: auto;
		border-right: 1px solid rgb(255 255 255 / 0.12);
	}

	.scale {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		/* Півкнопки: саме цей крок і подвоює кількість років, які влазять. */
		grid-auto-rows: 24px;
		column-gap: 0;
	}

	/* Лінія шкали. Малюється до кнопок, тож точки лягають поверх неї. */
	.scale::before {
		content: "";
		position: absolute;
		top: 12px;
		bottom: 12px;
		left: 50%;
		width: 1px;
		background: rgb(255 255 255 / 0.22);
	}

	.years__all,
	.years__btn {
		border: 1px solid transparent;
		border-radius: 999px;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		white-space: nowrap;
	}

	.years__all {
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		padding: 0 0.7rem;
		text-align: left;
	}

	.years__btn {
		position: relative;
		/* Кнопка вища за крок сітки — вона займає два рядки по 24px. */
		padding: 0 0.85rem 0 0.3rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.years__btn--right {
		padding: 0 0.3rem 0 0.85rem;
		text-align: left;
	}

	/* Точка на лінії: рівно на межі колонки, тобто по центру шкали. */
	.years__btn::after {
		content: "";
		position: absolute;
		top: 50%;
		right: -4px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgb(180 214 255 / 0.55);
		translate: 0 -50%;
	}

	.years__btn--right::after {
		right: auto;
		left: -4px;
	}

	.years__all:hover,
	.years__btn:hover {
		background: rgb(255 255 255 / 0.07);
	}

	.years__all[aria-pressed="true"],
	.years__btn[aria-pressed="true"] {
		border-color: rgb(140 190 255 / 0.6);
		background: rgb(140 190 255 / 0.16);
		font-weight: 600;
	}

	.years__btn[aria-pressed="true"]::after {
		background: rgb(200 226 255);
	}

	/*
	 * На вузькому екрані шкала з'їдає ту саму ширину, якої бракує переліку: у вікні
	 * 375px на сітку лишалося 239px. Тому роки стають смугою над переліком.
	 * `display: flex` заодно вимикає inline-стилі рядків і колонок — у флексі
	 * властивості сітки не діють, тож шахівниця тут сама собою розгортається в лінію.
	 */
	@media (max-width: 700px) {
		.years {
			flex-direction: row;
			padding: 0 0 0.4rem;
			overflow-x: auto;
			border-right: none;
			border-bottom: 1px solid rgb(255 255 255 / 0.12);
		}

		.scale {
			display: flex;
			gap: 0.2rem;
		}

		.scale::before {
			content: none;
		}

		.years__btn {
			min-height: 44px;
			padding: 0 0.7rem;
		}

		.years__btn::after {
			content: none;
		}
	}
</style>
