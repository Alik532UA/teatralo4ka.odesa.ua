<script lang="ts">
	import { t } from "svelte-i18n";
	import { untrack } from "svelte";
	import { X } from "lucide-svelte";
	import { focusTrap } from "$lib/utils/focusTrap";
	import {
		GRADUATION_YEARS,
		type Department,
		type GraduateIndexEntry,
	} from "$lib/data/graduates";
	import { filterGraduates } from "$lib/utils/graduateGalaxy";
	import { layoutRoster, sortRoster } from "$lib/utils/graduateRoster";
	import GraduateRosterHead from "./GraduateRosterHead.svelte";
	import GraduateRosterRow from "./GraduateRosterRow.svelte";
	import GraduateRosterYears from "./GraduateRosterYears.svelte";
	import GraduateRosterFilters from "./GraduateRosterFilters.svelte";
	import GraduateRosterEmpty from "./GraduateRosterEmpty.svelte";
	import { customScroll } from "$lib/utils/customScroll";

	interface Props {
		graduates: readonly GraduateIndexEntry[];
		open: boolean;
		onclose: () => void;
		onselect: (graduate: GraduateIndexEntry) => void;
		year: number | "all";
		departments: Department[];
		photo: "all" | "with" | "without";
		query: string;
		onyearchange: (year: number | "all") => void;
		ondepartmentschange: (departments: Department[]) => void;
		onphotochange: (photo: "all" | "with" | "without") => void;
		onquerychange: (query: string) => void;
	}

	let {
		graduates, open, onclose, onselect,
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

	/**
	 * Роки, а в кожному — скільки заповнених анкет і скільки решти. Розкладці
	 * потрібні саме два числа: смуга анкет розкладається просторіше за решту.
	 */
	const groups = $derived(
		shown.reduce<{ year: number | null; filled: number; plain: number }[]>(
			(all, graduate, index) => {
				const fresh =
					index === 0 ||
					shown[index - 1].graduationYear !== graduate.graduationYear;
				if (fresh)
					all.push({
						year: graduate.graduationYear,
						filled: 0,
						plain: 0,
					});
				const group = all[all.length - 1];
				if (graduate.hasPhoto) group.filled += 1;
				else group.plain += 1;
				return all;
			},
			[],
		),
	);

	const layout = $derived(layoutRoster(groups, perRow));

	const hasActiveFilters = $derived(
		year !== "all" ||
		departments.length > 0 ||
		photo !== "all" ||
		query.trim().length > 0,
	);

	function resetAllFilters() {
		onyearchange("all");
		ondepartmentschange([]);
		onphotochange("all");
		onquerychange("");
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
				{$t("galaxy.all")}
				<span class="sheet__count" data-testid="galaxy-roster-count"
					>{shown.length}</span
				>
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
				onselect={onyearchange}
			/>

			{#if shown.length > 0}
				<!-- Колонок стільки, скільки вміщається; рядки по черзі `n-1` / `n`.
				     Номери клітинок дає `staggerCells` — сітка сама так не вміє. -->
				<ul
					class="grid"
					style="--columns: {perRow * 2}"
					bind:clientWidth={gridWidth}
					data-testid="galaxy-roster-list"
					{@attach customScroll({
						rightOffset: -10,
						alignThumb: "center",
					})}
				>
					{#each shown as graduate, index (graduate.slug)}
						<li
							style="grid-row: {layout.cells[index]?.row ??
								1}; grid-column-start: {layout.cells[index]
								?.column ?? 1}"
							data-testid="galaxy-roster-list-item-{graduate.slug}"
						>
							<GraduateRosterRow
								{graduate}
								onselect={() => onselect(graduate)}
							/>
						</li>
					{/each}

					{#each groups as group, index (group.year)}
						<GraduateRosterHead
							year={group.year}
							row={layout.headingRows[index] ?? 1}
						/>
					{/each}
				</ul>
			{:else}
				<div class="empty-panel" data-testid="galaxy-roster-list">
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
		top: 50%;
		translate: -50% -50%;
		display: flex;
		flex-direction: column;
		width: min(1500px, calc(100vw - 1.5rem));
		height: min(88dvh, 920px);
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
		padding: 0.75rem 1rem;
		border-radius: 1.25rem;
		background: var(--galaxy-card-bg);
		border: 1px solid rgb(255 255 255 / 0.14);
		backdrop-filter: blur(20px);
		box-shadow: 0 12px 36px rgb(0 0 0 / 0.45);
		margin-bottom: 0;
		flex-shrink: 0;
	}

	.sheet__title {
		margin: 0;
		font-size: clamp(1rem, 2.6dvh, 1.3rem);
		color: #ffffff;
	}

	.sheet__count {
		opacity: 0.75;
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

	.sheet__close {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		cursor: pointer;
	}

	.sheet__close:hover {
		background: rgb(255 255 255 / 0.16);
	}

	/* min-height: 0 — без нього флекс-елемент не дає дітям прокручуватися */
	.sheet__body {
		display: flex;
		gap: 0.75rem;
		min-height: 0;
		flex: 1 1 0;
		height: 100%;
	}

	.grid,
	.empty-panel {
		position: relative;
		flex: 1 1 0;
		height: 100%;
		min-width: 0;
		border-radius: 1.25rem;
		background: var(--galaxy-card-bg);
		border: 1px solid rgb(255 255 255 / 0.14);
		backdrop-filter: blur(20px);
		box-shadow: 0 12px 36px rgb(0 0 0 / 0.45);
		overflow-y: auto;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: 0.5rem;
		margin: 0;
		padding: 0.85rem;
		list-style: none;
	}

	.empty-panel {
		display: grid;
		place-items: center;
		padding: 1.5rem;
	}

	.grid li {
		/* `span 2` тут, а в розмітці лише `grid-column-start` — див. `staggerCells`. */
		grid-column-end: span 2;
		min-width: 0;
	}

	/*
	 * Роки на вузькому екрані стають смугою НАД переліком
	 */
	@media (max-width: 700px) {
		.sheet {
			width: calc(100vw - 1rem);
			height: 92dvh;
			gap: 0.5rem;
		}

		.sheet__head {
			padding: 0.6rem 0.75rem;
			border-radius: 1rem;
		}

		.sheet__body {
			flex-direction: column;
			gap: 0.5rem;
		}

		.grid,
		.empty-panel {
			padding: 0.6rem;
			border-radius: 1rem;
		}
	}
</style>
