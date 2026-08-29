<script lang="ts">
	import { t, locale } from "svelte-i18n";
	import { untrack } from "svelte";
	import { X, Plus, Eraser, SlidersHorizontal } from "lucide-svelte";
	import { focusTrap } from "$lib/utils/focusTrap";
	import {
		GRADUATION_YEARS,
		type Department,
		type GraduateIndexEntry,
	} from "$lib/data/graduates";
	import { filterGraduates } from "$lib/utils/graduateGalaxy";
	import {
		formatGraduateNoun,
		layoutRoster,
		sortRoster,
		type Cell,
	} from "$lib/utils/graduateRoster";
	import GraduateRosterHead from "./GraduateRosterHead.svelte";
	import GraduateRosterRow from "./GraduateRosterRow.svelte";
	import GraduateRosterYears from "./GraduateRosterYears.svelte";
	import GraduateRosterFilters from "./GraduateRosterFilters.svelte";
	import GraduateRosterEmpty from "./GraduateRosterEmpty.svelte";
	import { customScroll } from "$lib/utils/customScroll";
	import { overlayFade, overlayPop } from "$lib/utils/overlayTransition";

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
		/**
		 * Рік, на якому список стояв минулого разу, — з адреси. Читається один
		 * раз, коли аркуш відкривається: далі рік веде сам список.
		 */
		initialScrolledYear?: number | null;
		/**
		 * Куди доїхав список. Викликається З ЗАТРИМКОЮ — див. `notifyScrolled`.
		 */
		onscrolledyearchange?: (year: number | null) => void;
	}

	let {
		graduates, open, onclose, onselect, onopenform,
		year, departments, photo, query,
		onyearchange, ondepartmentschange, onphotochange, onquerychange,
		initialScrolledYear = null, onscrolledyearchange,
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
	let notifyTimeout: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Ставить рік і — згодом — повідомляє про це нагору.
	 *
	 * Затримка обов'язкова: `handleGridScroll` висить на `onscroll` без
	 * жодного гальма, тобто спрацьовує десятки разів на секунду. Батько на
	 * кожен виклик переписує адресу, а `history.replaceState` стільки разів
	 * поспіль браузери душать (Safari просто кидає виняток після сотні за
	 * півхвилини). Тому місцевий стан міняється ОДРАЗУ — список підсвічує рік
	 * без затримки, — а нагору йде вже те, на чому гортання спинилося.
	 */
	function setScrolledYear(next: number | null) {
		scrolledYear = next;
		if (!onscrolledyearchange) return;
		if (notifyTimeout) clearTimeout(notifyTimeout);
		notifyTimeout = setTimeout(() => {
			notifyTimeout = undefined;
			onscrolledyearchange?.(next);
		}, 250);
	}
	let lastInteractedYear = $state<number | null>(null);
	let gridEl = $state<HTMLDivElement | null>(null);
	let canScrollUp = $state(false);
	let canScrollDown = $state(false);
	let isScrollingProgrammatically = false;
	let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Фільтри згорнуті — але лише на вузькому екрані.
	 *
	 * На телефоні шапка аркуша не вміщала все одразу: два випадні списки
	 * переповзали за правий край, а три круглі кнопки лягали окремим рядком
	 * посеред нічого. Фільтри при цьому потрібні не щоразу — здебільшого
	 * відкривають список і гортають.
	 *
	 * На широкому екрані стан не діє взагалі: там `.sheet__filters` має
	 * `display: contents`, тобто фільтри лишаються прямими дітьми шапки, як і
	 * були.
	 */
	let filtersOpen = $state(false);

	/**
	 * Відновлює позицію з адреси, коли аркуш відкривається.
	 *
	 * Один раз на відкриття, а не на кожну зміну `initialScrolledYear`: далі
	 * рік веде сам список, і повторне втручання смикало б його назад під
	 * пальцем.
	 */
	let restored = $state(false);
	$effect(() => {
		if (!open) {
			restored = false;
			return;
		}
		if (restored) return;
		const target = initialScrolledYear;
		/*
		 * Порожня ціль защіпку НЕ ставить — і це не дрібниця.
		 *
		 * Аркуш відкривається з `?roster=open` одразу, а рік приходить із того
		 * самого читання адреси мить по тому. Защіпнувшись на `null`, ефект
		 * більше не спрацьовував: рік приїжджав у вже «відновлений» список, і
		 * гортання не ставалося ніколи.
		 */
		if (target === null) return;
		restored = true;

		/*
		 * Чекаємо на саму картку, а не на «якийсь час».
		 *
		 * Аркуш виїжджає з анімацією, список усередині малюється ще пізніше, і
		 * фіксована затримка в 120 мс не спрацьовувала: `scrollToYear` не
		 * знаходив `[data-year]` і мовчки виходив. Рік при цьому підсвічувався,
		 * тобто збоку виглядало як «майже працює».
		 *
		 * Опитування ТАЙМЕРОМ, а не `requestAnimationFrame`. Перша спроба була
		 * саме на кадрах, і вона мовчки не працювала, коли вкладку відкривали у
		 * фоні: кадри там не малюються взагалі, тож зворотний виклик не
		 * приходив жодного разу. Саме так відкривають надіслане посилання —
		 * середнім кліком у сусідню вкладку.
		 *
		 * Межа в 30 спроб (≈1.5 с) потрібна, щоб цикл не крутився вічно, якщо
		 * такого року в списку немає взагалі — наприклад, коли адресу склали
		 * руками.
		 */
		let frames = 0;
		const tryScroll = () => {
			if (!open) return;
			const ready = gridEl?.querySelector(`[data-year="${target}"]`);
			if (ready && gridEl!.scrollHeight > gridEl!.clientHeight) {
				scrolledYear = target;
				scrollToYear(target, true);
				return;
			}
			if (frames++ < 30) setTimeout(tryScroll, 50);
		};
		tryScroll();
	});

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
			setScrolledYear(null);
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
			setScrolledYear(null);
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
			setScrolledYear(null);
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
			setScrolledYear(clickedYear);
			onyearchange('all');
			setTimeout(() => scrollToYear(clickedYear), 30);
			return;
		}

		// Якщо зараз активний жорсткий фільтр на інший рік -> знімаємо фільтр і скролимо до нового року
		if (selectedYears.length > 0) {
			lastInteractedYear = clickedYear;
			setScrolledYear(clickedYear);
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
			setScrolledYear(clickedYear);
			scrollToYear(clickedYear);
		}
	}

	/**
	 * @param instant Стрибнути без анімації. Потрібно для відновлення з адреси:
	 *   плавно повзти чотирнадцять тисяч пікселів від початку списку — не
	 *   «плавно», а довго, і людина весь цей час бачить чужі роки. До того ж
	 *   `behavior: 'smooth'` вимагає малювання: у вкладці, відкритій у фоні
	 *   (саме так відкривають надіслане посилання), прокрутка просто не
	 *   стається — заміряно, `scrollTop` лишається нулем.
	 */
	function scrollToYear(targetYear: number, instant = false) {
		if (!gridEl) return;
		const targetCard = gridEl.querySelector(`[data-year="${targetYear}"]`) as HTMLElement | null;
		if (targetCard) {
			isScrollingProgrammatically = true;
			if (scrollTimeout) clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				isScrollingProgrammatically = false;
				updateScrollBounds();
			}, 600);

			const targetTop = Math.max(0, targetCard.offsetTop - gridEl.offsetTop);
			if (instant) {
				gridEl.scrollTop = targetTop;
			} else {
				gridEl.scrollTo({ top: targetTop, behavior: 'smooth' });
			}
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
			setScrolledYear(null);
		} else if (active !== null) {
			setScrolledYear(active);
		}
	}

	function resetAllFilters() {
		setScrolledYear(null);
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
		transition:overlayFade
		onclick={onclose}
		role="presentation"
		data-testid="galaxy-roster-backdrop"
	></div>

	<div
		class="sheet"
		transition:overlayPop={{ y: 22 }}
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
				<span class="sheet__count-word">{formatGraduateNoun(shown.length, $locale ?? "uk")}</span>
			</h2>

			<!-- Порожній елемент на всю ширину — розрив рядка у flex-розкладці.
			     Інакше на телефоні жодна комбінація ширин не сходиться: щоб
			     пошук пішов на другий рядок, його база мусить бути більшою за
			     200px, а щоб поруч став «Фільтри» — меншою за 180. -->
			<span class="sheet__break" aria-hidden="true"></span>

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

			<button
				type="button"
				class="sheet__icon-btn sheet__filters-toggle"
				class:sheet__filters-toggle--on={filtersOpen}
				onclick={() => (filtersOpen = !filtersOpen)}
				aria-expanded={filtersOpen}
				aria-controls="{id}-filters"
				title={$t("galaxy.filters", { default: "Фільтри" })}
				data-testid="galaxy-roster-filters-toggle-btn"
			>
				<SlidersHorizontal size={18} aria-hidden="true" />
				<span class="sheet__filters-toggle-text"
					>{$t("galaxy.filters", { default: "Фільтри" })}</span
				>
				<!-- Крапка каже, що фільтр діє, коли панель згорнута: інакше
				     людина бачила б короткий список і не знала чому. -->
				{#if hasActiveFilters}
					<span class="sheet__filters-dot" aria-hidden="true"></span>
				{/if}
			</button>

			<div
				class="sheet__filters"
				class:sheet__filters--open={filtersOpen}
				id="{id}-filters"
				data-testid="galaxy-roster-filters-panel"
			>
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
			</div>

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
		z-index: var(--z-modal-backdrop);
		background: rgb(3 6 20 / 0.72);
		backdrop-filter: blur(3px);
	}

	.sheet {
		position: fixed;
		z-index: var(--z-modal);
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

	/*
	 * На широкому екрані панель НЕ створює коробки: фільтри й гумка лишаються
	 * прямими дітьми шапки, тобто розкладка там така сама, як була до згортання.
	 */
	.sheet__filters {
		display: contents;
	}
	/*
	 * Селектор СКЛАДЕНИЙ, і не для краси: кнопка має обидва класи, а
	 * `.sheet__icon-btn` з його `display: grid` оголошено нижче. При однаковій
	 * вазі виграє той, хто пізніше, — і на широкому екрані перемикач лишався
	 * видимим поруч із самими фільтрами.
	 */
	.sheet__icon-btn.sheet__filters-toggle,
	.sheet__break {
		display: none;
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

		/*
		 * Три рядки замість каші:
		 *   1) скільки випускників · «додати» · «закрити»
		 *   2) пошук · «фільтри»
		 *   3) самі фільтри — і лише коли їх розгорнули
		 *
		 * Порядок задається `order`, а не перестановкою в розмітці: на широкому
		 * екрані та сама шапка лишається одним рядком, і переставляти там нічого
		 * не треба.
		 */
		.sheet__head {
			padding: 0.25rem 0.4rem;
			gap: 0.5rem 0.4rem;
		}
		/*
		 * База НУЛЬОВА (`flex: 1 1 0`), а не `auto`: `flex-wrap` розриває рядок
		 * ЩЕ ДО стискання, і поки заголовок займав свою природну ширину
		 * (заміряно 231px із 375), кнопка закриття падала вниз — до пошуку.
		 */
		/*
		 * Місце під логотип лишає САМ ЗАГОЛОВОК, а не вся шапка.
		 *
		 * Маски лежать під аркушем (шапка без тла, тож вони просвічують) і
		 * займають, за заміром, 48×48 у куті — x 12…60, y 6…54. Тобто затуляють
		 * вони лише перший рядок: пошук починається на 96px, панель фільтрів на
		 * 154px, і там ховатися вже нема від чого.
		 *
		 * Доти відступ у 64px тримала вся шапка, і ці 64px губилися на КОЖНОМУ
		 * рядку: на 375px екрана пошук і фільтри втрачали шосту частину ширини
		 * заради порожнечі.
		 */
		.sheet__title {
			order: 1;
			flex: 1 1 0;
			min-width: 0;
			overflow: hidden;
			margin-left: 3rem;
		}
		/*
		 * Три крапки саме на слові, а не на заголовку: заголовок — flex-контейнер
		 * (число й слово стоять поруч на спільній базовій лінії), а
		 * `text-overflow` до таких не застосовується взагалі. Без цього рядок
		 * просто обрізався під кнопкою «додати» — без жодного знаку, що там ще
		 * щось є.
		 */
		.sheet__count-word {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.sheet__icon-btn--add { order: 2; }
		.sheet__close { order: 3; }
		.sheet__break {
			order: 4;
			display: block;
			flex: 1 0 100%;
			height: 0;
		}
		.sheet__field {
			order: 5;
			flex: 1 1 8rem;
			min-width: 0;
		}
		.sheet__icon-btn.sheet__filters-toggle {
			order: 6;
			position: relative;
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			width: auto;
			padding: 0 0.85rem;
			border-radius: 999px;
			font-size: 0.86rem;
			font-weight: 600;
		}
		.sheet__icon-btn.sheet__filters-toggle--on { background: rgb(140 190 255 / 0.22); }
		.sheet__filters-dot {
			position: absolute;
			top: 6px;
			right: 6px;
			width: 7px;
			height: 7px;
			border-radius: 50%;
			background: var(--galaxy-accent);
		}
		.sheet__filters {
			order: 7;
			display: none;
			flex: 1 0 100%;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.45rem;
		}
		.sheet__filters--open { display: flex; }

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
