<script lang="ts">
	import { t, locale } from "svelte-i18n";
	import { untrack } from "svelte";
	import { X, Plus, Eraser } from "lucide-svelte";
	import { focusTrap } from "$lib/utils/focusTrap";
	import {
		GRADUATION_YEARS,
		type Department,
		type GraduateIndexEntry,
	} from "$lib/data/graduates";
	import { filterGraduates } from "$lib/utils/graduateGalaxy";
	import { layoutRoster, sortRoster, type Cell } from "$lib/utils/graduateRoster";
	import GraduateRosterHead from "./GraduateRosterHead.svelte";
	import GraduateRosterRow from "./GraduateRosterRow.svelte";
	import GraduateRosterYears from "./GraduateRosterYears.svelte";
	import GraduateRosterFilters from "./GraduateRosterFilters.svelte";
	import GraduateRosterEmpty from "./GraduateRosterEmpty.svelte";
	import { customScroll } from "$lib/utils/customScroll";

	function formatGraduateNoun(count: number): string {
		const currentLocale = $locale ?? 'uk';
		if (currentLocale.startsWith('en')) {
			return count === 1 ? 'graduate' : 'graduates';
		}
		const mod10 = count % 10;
		const mod100 = count % 100;
		if (mod100 >= 11 && mod100 <= 19) {
			return 'випускників';
		}
		if (mod10 === 1) {
			return 'випускник';
		}
		if (mod10 >= 2 && mod10 <= 4) {
			return 'випускника';
		}
		return 'випускників';
	}

	interface Props {
		graduates: readonly GraduateIndexEntry[];
		open: boolean;
		onclose: () => void;
		onselect: (graduate: GraduateIndexEntry) => void;
		onopenform?: () => void;
		year: number | "all" | readonly number[];
		departments: Department[];
		photo: "all" | "with" | "without";
		query: string;
		onyearchange: (year: number | "all" | readonly number[]) => void;
		ondepartmentschange: (departments: Department[]) => void;
		onphotochange: (photo: "all" | "with" | "without") => void;
		onquerychange: (query: string) => void;
	}

	let {
		graduates, open, onclose, onselect, onopenform,
		year, departments, photo, query,
		onyearchange, ondepartmentschange, onphotochange, onquerychange,
	}: Props = $props();

	const id = $props.id();

	let rosterSeed = $state(0);

	$effect(() => {
		if (open) {
			untrack(() => {
				rosterSeed = Math.random();
			});
		}
	});

	/** Ширина сітки — не для краси: від неї залежить, скільки колонок вміщається. */
	let gridWidth = $state(0);

	/**
	 * Найвужча колонка, у якій ім'я ще стає в один рядок. Заміряно шрифтом
	 * сторінки, а не оцінено по літерах: 95-й процентиль імені 180px плюс
	 * обрамлення рядка 72px. Було 300, бо в картці стояв ще й рік на 49px; рік
	 * переїхав у заголовок групи, і ця ширина вивільнилася.
	 */
	const MIN_COLUMN = 255;

	// Довільний порядок у межах року (з фотографіями на початку), оновлюється при кожному відкритті
	const shown = $derived.by(() => {
		const _ = rosterSeed;
		return sortRoster(
			filterGraduates(graduates, { year, query, departments, photo }),
		);
	});

	const perRow = $derived(Math.max(1, Math.floor(gridWidth / MIN_COLUMN)));

	interface YearGroup {
		year: number | null;
		graduates: GraduateIndexEntry[];
		cells: Cell[];
	}

	/**
	 * Розбиття переліку на окремі контейнери за роками.
	 * Кожен рік отримує свою розкладку сітки.
	 */
	const yearGroups = $derived.by<YearGroup[]>(() => {
		const groupsMap: { year: number | null; graduates: GraduateIndexEntry[]; filled: number; plain: number }[] = [];
		for (const graduate of shown) {
			let group = groupsMap[groupsMap.length - 1];
			if (!group || group.year !== graduate.graduationYear) {
				group = {
					year: graduate.graduationYear,
					graduates: [],
					filled: 0,
					plain: 0
				};
				groupsMap.push(group);
			}
			group.graduates.push(graduate);
			if (graduate.hasPhoto) group.filled++;
			else group.plain++;
		}

		return groupsMap.map((g) => {
			const { cells } = layoutRoster([{ filled: g.filled, plain: g.plain }], perRow);
			return {
				year: g.year,
				graduates: g.graduates,
				cells
			};
		});
	});

	const selectedYears = $derived<readonly number[]>(
		Array.isArray(year)
			? year
			: typeof year === 'number'
				? [year]
				: []
	);

	const hasActiveFilters = $derived(
		selectedYears.length > 0 ||
		departments.length > 0 ||
		photo !== "all" ||
		query.trim().length > 0,
	);

	let scrolledYear = $state<number | null>(null);
	let lastInteractedYear = $state<number | null>(null);
	let gridEl = $state<HTMLDivElement | null>(null);
	let canScrollUp = $state(false);
	let canScrollDown = $state(false);
	let isScrollingProgrammatically = false;
	let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

	function updateScrollBounds() {
		if (!gridEl) return;
		const { scrollTop, scrollHeight, clientHeight } = gridEl;
		canScrollUp = scrollTop > 8;
		canScrollDown = scrollHeight - scrollTop - clientHeight > 8;
	}

	$effect(() => {
		const _ = yearGroups.length;
		const __ = gridWidth;
		untrack(() => {
			setTimeout(updateScrollBounds, 60);
		});
	});

	function handleYearSelect(clickedYear: number | 'all', event?: MouseEvent) {
		if (clickedYear === 'all') {
			scrolledYear = null;
			lastInteractedYear = null;
			onyearchange('all');
			if (gridEl) {
				gridEl.scrollTo({ top: 0, behavior: 'smooth' });
				setTimeout(updateScrollBounds, 300);
			}
			return;
		}

		// Мультивибір з Ctrl / Cmd (поодиноке додавання/зняття року)
		if (event?.ctrlKey || event?.metaKey) {
			lastInteractedYear = clickedYear;
			scrolledYear = null;
			if (selectedYears.includes(clickedYear)) {
				const next = selectedYears.filter((y) => y !== clickedYear);
				onyearchange(next.length > 0 ? next : 'all');
			} else {
				onyearchange([...selectedYears, clickedYear]);
			}
			return;
		}

		// Діапазон з Shift (вибір від останнього взаємодіяного року до поточного)
		if (event?.shiftKey && lastInteractedYear !== null) {
			const start = Math.min(lastInteractedYear, clickedYear);
			const end = Math.max(lastInteractedYear, clickedYear);
			const range = GRADUATION_YEARS.filter((y) => y >= start && y <= end);
			scrolledYear = null;
			onyearchange(range);
			return;
		}

		// Якщо зараз активний мультивибір (декілька років) -> звичайний клік обирає тільки цей 1 рік
		if (selectedYears.length > 1) {
			lastInteractedYear = clickedYear;
			onyearchange([clickedYear]);
			return;
		}

		// Якщо зараз активний жорсткий фільтр на цей самий рік -> знімаємо фільтр і лишаємося на скролі
		if (selectedYears.length === 1 && selectedYears[0] === clickedYear) {
			lastInteractedYear = clickedYear;
			scrolledYear = clickedYear;
			onyearchange('all');
			setTimeout(() => scrollToYear(clickedYear), 30);
			return;
		}

		// Якщо зараз активний жорсткий фільтр на інший рік -> знімаємо фільтр і скролимо до нового року
		if (selectedYears.length > 0) {
			lastInteractedYear = clickedYear;
			scrolledYear = clickedYear;
			onyearchange('all');
			setTimeout(() => scrollToYear(clickedYear), 30);
			return;
		}

		// Якщо selectedYears порожній (показано всі роки):
		// Якщо ми вже стоїмо / скролили на цей рік -> 2-й клік = жорсткий фільтр!
		if (scrolledYear === clickedYear) {
			lastInteractedYear = clickedYear;
			onyearchange([clickedYear]);
		} else {
			// Перший клік = плавний скрол до року в повному списку
			lastInteractedYear = clickedYear;
			scrolledYear = clickedYear;
			scrollToYear(clickedYear);
		}
	}

	function scrollToYear(targetYear: number) {
		if (!gridEl) return;
		const targetCard = gridEl.querySelector(`[data-year="${targetYear}"]`) as HTMLElement | null;
		if (targetCard) {
			isScrollingProgrammatically = true;
			if (scrollTimeout) clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				isScrollingProgrammatically = false;
				updateScrollBounds();
			}, 600);

			const targetTop = targetCard.offsetTop - gridEl.offsetTop;
			gridEl.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
			updateScrollBounds();
		}
	}

	function handleGridScroll() {
		updateScrollBounds();
		if (isScrollingProgrammatically || selectedYears.length > 0 || !gridEl) return;

		const cards = gridEl.querySelectorAll('.year-card[data-year]') as NodeListOf<HTMLElement>;
		if (cards.length === 0) return;

		const gridRect = gridEl.getBoundingClientRect();
		let active: number | null = null;

		for (const card of cards) {
			const rect = card.getBoundingClientRect();
			if (rect.top <= gridRect.top + 80) {
				const y = Number(card.dataset.year);
				if (!isNaN(y)) active = y;
			} else {
				break;
			}
		}

		if (gridEl.scrollTop < 20) {
			scrolledYear = null;
		} else if (active !== null) {
			scrolledYear = active;
		}
	}

	function resetAllFilters() {
		scrolledYear = null;
		lastInteractedYear = null;
		onyearchange("all");
		ondepartmentschange([]);
		onphotochange("all");
		onquerychange("");
		if (gridEl) {
			gridEl.scrollTo({ top: 0, behavior: 'smooth' });
			setTimeout(updateScrollBounds, 300);
		}
	}

	/** Escape — той самий обробник, що в `PhotoLightbox`: один спосіб закривати. */
	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === "Escape") {
			event.preventDefault();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!--
		Клік по тлу лише ДУБЛЮЄ кнопку закриття, яка є нижче й доступна з
		клавіатури; Tab тримає `focusTrap`, Escape — обробник вище. Тому
		`role="presentation"`: він і знімає a11y-попередження компілятора.
	-->
	<div
		class="backdrop"
		onclick={onclose}
		role="presentation"
		data-testid="galaxy-roster-backdrop"
	></div>

	<div
		class="sheet"
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		{@attach focusTrap()}
		data-testid="galaxy-roster-modal"
	>
		<header class="sheet__head">
			<h2
				class="sheet__title"
				id="{id}-title"
				data-testid="galaxy-roster-title"
			>
				<span class="sheet__count" data-testid="galaxy-roster-count">{shown.length}</span>
				<span class="sheet__count-word">{formatGraduateNoun(shown.length)}</span>
			</h2>

			<label class="sheet__field" for="{id}-search">
				<span class="sr-only">{$t("galaxy.searchName")}</span>
				<input
					id="{id}-search"
					type="search"
					value={query}
					oninput={(e: Event) => onquerychange((e.target as HTMLInputElement).value)}
					placeholder={$t("galaxy.searchName")}
					data-testid="galaxy-roster-search-input"
				/>
			</label>

			<GraduateRosterFilters
				{departments}
				{photo}
				ondepartmentschange={ondepartmentschange}
				onphotochange={onphotochange}
			/>

			<button
				type="button"
				class="sheet__icon-btn"
				class:sheet__icon-btn--disabled={!hasActiveFilters}
				disabled={!hasActiveFilters}
				onclick={resetAllFilters}
				title={$t("common.reset", { default: "Очистити фільтри" })}
				aria-label={$t("common.reset", { default: "Очистити фільтри" })}
				data-testid="galaxy-roster-reset-filters-btn"
			>
				<Eraser size={18} aria-hidden="true" />
			</button>

			{#if onopenform}
				<button
					type="button"
					class="sheet__icon-btn sheet__icon-btn--add"
					onclick={onopenform}
					title={$t("galaxy.fillProfile", { default: "Заповнити анкету" })}
					aria-label={$t("galaxy.fillProfile", { default: "Заповнити анкету" })}
					data-testid="galaxy-roster-add-btn"
				>
					<Plus size={20} aria-hidden="true" />
				</button>
			{/if}

			<button
				type="button"
				class="sheet__close"
				onclick={onclose}
				aria-label={$t("common.close")}
				data-testid="galaxy-roster-close-btn"
			>
				<X size={20} aria-hidden="true" />
			</button>
		</header>

		<div class="sheet__body">
			<GraduateRosterYears
				years={GRADUATION_YEARS}
				selected={year}
				{scrolledYear}
				onselect={handleYearSelect}
			/>

			{#if yearGroups.length > 0}
				<div
					class="roster-scroll"
					class:mask-top={canScrollUp}
					class:mask-bottom={canScrollDown}
					bind:this={gridEl}
					bind:clientWidth={gridWidth}
					onscroll={handleGridScroll}
					data-testid="galaxy-roster-list"
					{@attach customScroll({
						rightOffset: -10,
						alignThumb: "center",
					})}
				>
					{#each yearGroups as group (group.year)}
						<section
							class="year-card"
							data-year={group.year}
							data-testid="galaxy-roster-year-card-{group.year}"
						>
							<GraduateRosterHead
								year={group.year}
								count={group.graduates.length}
							/>

							<ul class="year-card__grid" style="--columns: {perRow * 2}">
								{#each group.graduates as graduate, idx (graduate.slug)}
									<li
										style="grid-row: {group.cells[idx]?.row ?? 1}; grid-column-start: {group.cells[idx]?.column ?? 1}"
										data-testid="galaxy-roster-list-item-{graduate.slug}"
									>
										<GraduateRosterRow
											{graduate}
											onselect={() => onselect(graduate)}
										/>
									</li>
								{/each}
							</ul>
						</section>
					{/each}
				</div>
			{:else}
				<div class="empty-panel" data-testid="galaxy-roster-empty-panel">
					<GraduateRosterEmpty
						{hasActiveFilters}
						{year}
						{photo}
						{departments}
						{query}
						{onyearchange}
						{onphotochange}
						{ondepartmentschange}
						{onquerychange}
						onreset={resetAllFilters}
					/>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
		background: rgb(3 6 20 / 0.72);
		backdrop-filter: blur(3px);
	}

	.sheet {
		position: fixed;
		z-index: 71;
		left: 50%;
		top: clamp(8px, 1.6dvh, 16px);
		translate: -50% 0;
		display: flex;
		flex-direction: column;
		width: min(1500px, calc(100vw - 2rem));
		height: calc(100dvh - clamp(16px, 3.2dvh, 32px));
		padding: 0;
		gap: 0.75rem;
		background: none;
		box-shadow: none;
		border: none;
		color: var(--galaxy-text);
	}

	.sheet__head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem;
		padding: 0.25rem 0.5rem;
		padding-left: clamp(0.5rem, calc(90px - (100vw - min(1500px, calc(100vw - 2rem))) / 2), 90px);
		background: none;
		border: none;
		backdrop-filter: none;
		box-shadow: none;
		margin-bottom: 0;
		flex-shrink: 0;
		min-height: 44px;
	}

	.sheet__title {
		display: flex;
		align-items: baseline;
		gap: 0.35em;
		margin: 0;
		font-size: clamp(1rem, 2.6dvh, 1.3rem);
		color: #ffffff;
		white-space: nowrap;
	}

	.sheet__count {
		font-weight: 700;
		color: #ffffff;
		font-variant-numeric: tabular-nums;
	}

	.sheet__count-word {
		font-weight: 400;
		color: var(--galaxy-muted, #a8bfe0);
	}

	.sheet__field {
		flex: 1 1 8rem;
		/* min-width: 0 — без нього флекс-елемент не стискається менше за вміст. */
		min-width: 0;
	}

	.sheet__field input {
		width: 100%;
		min-height: 44px;
		padding: 0 0.9rem;
		border: 1px solid rgb(255 255 255 / 0.18);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.06);
		color: inherit;
		font: inherit;
	}

	.sheet__icon-btn,
	.sheet__close {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border: 1px solid rgb(255 255 255 / 0.14);
		border-radius: 50%;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		cursor: pointer;
	}

	.sheet__icon-btn {
		transition:
			transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			background 0.15s ease,
			border-color 0.15s ease,
			opacity 0.15s ease;
	}

	.sheet__icon-btn:hover:not(:disabled),
	.sheet__close:hover {
		background: rgb(255 255 255 / 0.18);
		border-color: rgb(255 255 255 / 0.28);
	}

	.sheet__icon-btn--add:hover {
		transform: rotate(90deg) scale(1.08);
	}

	.sheet__icon-btn--add:active {
		transform: rotate(90deg) scale(0.92);
	}

	.sheet__icon-btn:disabled,
	.sheet__icon-btn--disabled {
		opacity: 0.3;
		cursor: not-allowed;
		border-color: transparent;
	}

	/* min-height: 0 — без нього флекс-елемент не дає дітям прокручуватися */
	.sheet__body {
		display: flex;
		gap: 0.75rem;
		min-height: 0;
		flex: 1 1 0;
		height: 100%;
	}

	.roster-scroll {
		position: relative;
		flex: 1 1 0;
		height: 100%;
		min-width: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: mask-image 0.2s ease, -webkit-mask-image 0.2s ease;
	}

	.roster-scroll.mask-top.mask-bottom {
		mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 36px,
			black calc(100% - 36px),
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 36px,
			black calc(100% - 36px),
			transparent 100%
		);
	}

	.roster-scroll.mask-top:not(.mask-bottom) {
		mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 36px,
			black 100%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 36px,
			black 100%
		);
	}

	.roster-scroll.mask-bottom:not(.mask-top) {
		mask-image: linear-gradient(
			to bottom,
			black 0%,
			black calc(100% - 36px),
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			black 0%,
			black calc(100% - 36px),
			transparent 100%
		);
	}

	.year-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.9rem 1.15rem 1.15rem;
		border-radius: 1.25rem;
		background: color-mix(in srgb, var(--galaxy-card-bg, #0b1330) 75%, transparent);
		backdrop-filter: blur(20px);
		box-shadow: 0 12px 36px rgb(0 0 0 / 0.45);
		border: none;
	}

	.year-card__grid {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.year-card__grid li {
		/* `span 2` тут, а в розмітці лише `grid-column-start` — див. `staggerCells`. */
		grid-column-end: span 2;
		min-width: 0;
	}

	.empty-panel {
		position: relative;
		flex: 1 1 0;
		height: 100%;
		min-width: 0;
		border-radius: 1.25rem;
		background: color-mix(in srgb, var(--galaxy-card-bg, #0b1330) 50%, transparent);
		border: none;
		backdrop-filter: blur(20px);
		box-shadow: 0 12px 36px rgb(0 0 0 / 0.45);
		overflow-y: auto;
		display: grid;
		place-items: center;
		padding: 1.5rem;
	}

	/*
	 * Роки на вузькому екрані стають смугою НАД переліком
	 */
	@media (max-width: 700px) {
		.sheet {
			width: calc(100vw - 1rem);
			top: 8px;
			height: calc(100dvh - 16px);
			gap: 0.5rem;
		}

		.sheet__head {
			padding: 0.25rem 0.4rem;
			padding-left: clamp(0.4rem, calc(72px - (100vw - (100vw - 1rem)) / 2), 72px);
		}

		.sheet__body {
			flex-direction: column;
			gap: 0.5rem;
		}

		.roster-scroll {
			gap: 0.5rem;
		}

		.year-card,
		.empty-panel {
			padding: 0.75rem 0.85rem;
			border-radius: 1rem;
		}
	}
</style>
