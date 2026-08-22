<script lang="ts">
	import { t } from "svelte-i18n";
	import { untrack } from "svelte";
	import { customScroll } from "$lib/utils/customScroll";

	interface Props {
		years: readonly number[];
		selected: number | "all";
		scrolledYear?: number | null;
		onselect: (year: number | "all") => void;
	}

	let { years, selected, scrolledYear = null, onselect }: Props = $props();

	/**
	 * Адаптивний крок шкали:
	 *
	 * Стандартний крок — 24px (кнопка 48px = 2 × 24, шахівниця).
	 * Якщо всі роки поміщаються при зменшенні кроку до 80% (19px, кнопка 38px) —
	 * крок зменшується автоматично, скрол зникає.
	 * Якщо навіть при 80% не поміщаються — залишаємо стандартний крок зі скролом.
	 */
	const STEP_DEFAULT = 24;
	const STEP_MIN = 14;

	let yearsEl = $state<HTMLDivElement | null>(null);
	let step = $state(STEP_DEFAULT);
	let lastAvailableHeight = 0;

	function recalcStep() {
		if (!yearsEl) return;
		const style = window.getComputedStyle(yearsEl);
		const padTop = parseFloat(style.paddingTop) || 0;
		const padBottom = parseFloat(style.paddingBottom) || 0;
		const gap = parseFloat(style.gap) || 6;

		const allBtn = yearsEl.querySelector('.years__all') as HTMLElement | null;
		const allBtnHeight = allBtn ? allBtn.offsetHeight : 44;

		const availableHeight = Math.round(yearsEl.clientHeight - padTop - padBottom);
		if (availableHeight <= 0) return;

		if (Math.abs(availableHeight - lastAvailableHeight) < 2) return;
		lastAvailableHeight = availableHeight;

		const scaleRows = years.length + 1;
		const spaceForScale = availableHeight - allBtnHeight - gap;
		if (spaceForScale <= 0) return;

		const neededDefault = scaleRows * STEP_DEFAULT;
		let next: number;

		if (neededDefault <= spaceForScale) {
			next = STEP_DEFAULT;
		} else {
			const idealStep = Math.floor(spaceForScale / scaleRows);
			next = idealStep >= STEP_MIN ? idealStep : STEP_DEFAULT;
		}

		if (next !== step) {
			step = next;
		}
	}

	$effect(() => {
		if (!yearsEl) return;
		const _ = years.length;

		untrack(() => {
			recalcStep();
		});

		const observer = new ResizeObserver(() => {
			recalcStep();
		});
		observer.observe(yearsEl);
		return () => observer.disconnect();
	});
</script>

<!--
	Роки — шкала часу, а не спадний список і не стовпчик.

	Список приховував усі 28 років за одним кліком і не показував вибраного, доки
	його не відкриєш. Стовпчик показував усі, але був завищий за будь-яке вікно, і
	половина років жила за прокруткою.

	Тому шахівниця: роки навперемін ліворуч і праворуч від центральної лінії, і
	кожен наступний зсунутий на ПІВкнопки. Крок шкали виходить удвічі менший за
	висоту кнопки.

	Крок адаптивний: якщо контейнер досить високий — стандартний 24px (кнопка 48px).
	Якщо потрібно стиснути — крок плавно зменшується автоматично, щоб вмістити
	всі роки без скролу.

	`aria-pressed` каже читалці те саме, що підсвітка — оку.
-->
<div
	class="years"
	role="group"
	aria-label={$t("galaxy.filterYear")}
	data-testid="galaxy-roster-years-toolbar"
	bind:this={yearsEl}
	{@attach customScroll({ rightOffset: -4, alignThumb: "center" })}
>
	<button
		type="button"
		class="years__all"
		aria-pressed={selected === "all" && (scrolledYear === null || selected !== "all")}
		onclick={() => onselect("all")}
		data-testid="galaxy-roster-year-all-btn">{$t("galaxy.allYears")}</button
	>

	<div class="scale" style="grid-auto-rows: {step}px" data-testid="galaxy-roster-timeline-container">
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
				data-scrolled={selected === "all" && scrolledYear === year}
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
		height: 100%;
		padding: 0.75rem;
		border-radius: 1.25rem;
		background: color-mix(in srgb, var(--galaxy-card-bg, #0b1330) 50%, transparent);
		border: none;
		backdrop-filter: blur(20px);
		box-shadow: 0 12px 36px rgb(0 0 0 / 0.45);
		overflow-y: auto;
	}

	.scale {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		/* grid-auto-rows тепер задається inline через step */
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
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 0.7rem;
		text-align: center;
	}

	.years__btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		/* Кнопка вища за крок сітки — вона займає два рядки. */
		padding: 0 0.85rem 0 0.3rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
		font-size: clamp(0.78rem, 1.8dvh, 0.95rem);
	}

	.years__btn--right {
		justify-content: flex-start;
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
		transition: background 0.15s ease, box-shadow 0.15s ease;
	}

	.years__btn--right::after {
		right: auto;
		left: -4px;
	}

	.years__all:hover,
	.years__btn:hover {
		background: rgb(255 255 255 / 0.08);
	}

	/* Стан скролу / Scroll-spy (список прокручено до цього року) */
	.years__btn[data-scrolled="true"] {
		border-color: rgb(140 190 255 / 0.45);
		background: rgb(140 190 255 / 0.1);
		color: #ffffff;
	}

	.years__btn[data-scrolled="true"]::after {
		background: rgb(190 225 255);
		box-shadow: 0 0 8px rgb(140 190 255 / 0.85);
	}

	/* Стан жорсткої фільтрації (список ізольовано тільки за цим роком) */
	.years__all[aria-pressed="true"],
	.years__btn[aria-pressed="true"] {
		border-color: rgb(140 190 255 / 0.75);
		background: rgb(140 190 255 / 0.22);
		font-weight: 700;
		color: #ffffff;
	}

	.years__btn[aria-pressed="true"]::after {
		background: #ffffff;
		box-shadow: 0 0 10px #ffffff;
	}

	/*
	 * На вузькому екрані шкала стає горизонтальною смугою над переліком
	 */
	@media (max-width: 700px) {
		.years {
			flex-direction: row;
			padding: 0.5rem;
			overflow-x: auto;
			border-radius: 1rem;
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

