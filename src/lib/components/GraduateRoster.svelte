<script lang="ts">
	import { t } from 'svelte-i18n';
	import { X } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { GRADUATION_YEARS, type GraduateIndexEntry } from '$lib/data/graduates';
	import { filterGraduates } from '$lib/utils/graduateGalaxy';
	import { layoutRoster, sortRoster } from '$lib/utils/graduateRoster';
	import GraduateRosterHead from './GraduateRosterHead.svelte';
	import GraduateRosterRow from './GraduateRosterRow.svelte';
	import GraduateRosterYears from './GraduateRosterYears.svelte';

	interface Props {
		graduates: readonly GraduateIndexEntry[];
		open: boolean;
		onclose: () => void;
		onselect: (graduate: GraduateIndexEntry) => void;
	}

	let { graduates, open, onclose, onselect }: Props = $props();

	const id = $props.id();

	let year = $state<number | 'all'>('all');
	let query = $state('');

	/** Ширина сітки — не для краси: від неї залежить, скільки колонок вміщається. */
	let gridWidth = $state(0);

	/**
	 * Найвужча колонка, у якій ім'я ще стає в один рядок. Заміряно шрифтом
	 * сторінки, а не оцінено по літерах: 95-й процентиль імені 180px плюс
	 * обрамлення рядка 72px. Було 300, бо в картці стояв ще й рік на 49px; рік
	 * переїхав у заголовок групи, і ця ширина вивільнилася.
	 */
	const MIN_COLUMN = 255;

	// Пошук за іменем поруч із фільтром за роком: галактика гарна для розглядання
	// й безпорадна для «де мій однокурсник з 2014 року». На 482 записах це вже не
	// зручність, а умова того, щоб переліком можна було користуватися.
	const shown = $derived(sortRoster(filterGraduates(graduates, { year, query })));

	const perRow = $derived(Math.max(1, Math.floor(gridWidth / MIN_COLUMN)));

	/**
	 * Роки, а в кожному — скільки заповнених анкет і скільки решти. Розкладці
	 * потрібні саме два числа: смуга анкет розкладається просторіше за решту.
	 */
	const groups = $derived(
		shown.reduce<{ year: number | null; filled: number; plain: number }[]>(
			(all, graduate, index) => {
				const fresh = index === 0 || shown[index - 1].graduationYear !== graduate.graduationYear;
				if (fresh) all.push({ year: graduate.graduationYear, filled: 0, plain: 0 });
				const group = all[all.length - 1];
				if (graduate.hasPhoto) group.filled += 1;
				else group.plain += 1;
				return all;
			},
			[]
		)
	);

	const layout = $derived(layoutRoster(groups, perRow));

	/** Escape — той самий обробник, що в `PhotoLightbox`: один спосіб закривати. */
	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'Escape') {
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
	<div class="backdrop" onclick={onclose} role="presentation" data-testid="galaxy-roster-backdrop"
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
			<h2 class="sheet__title" id="{id}-title" data-testid="galaxy-roster-title">
				{$t('galaxy.all')}
				<span class="sheet__count" data-testid="galaxy-roster-count">{shown.length}</span>
			</h2>

			<label class="sheet__field" for="{id}-search">
				<span class="sr-only">{$t('galaxy.searchName')}</span>
				<input
					id="{id}-search"
					type="search"
					bind:value={query}
					placeholder={$t('galaxy.searchName')}
					data-testid="galaxy-roster-search-input"
				/>
			</label>

			<button
				type="button"
				class="sheet__close"
				onclick={onclose}
				aria-label={$t('common.close')}
				data-testid="galaxy-roster-close-btn"
			>
				<X size={20} aria-hidden="true" />
			</button>
		</header>

		<div class="sheet__body">
			<GraduateRosterYears
				years={GRADUATION_YEARS}
				selected={year}
				onselect={(value) => (year = value)}
			/>

			<!-- Колонок стільки, скільки вміщається; рядки по черзі `n-1` / `n`.
			     Номери клітинок дає `staggerCells` — сітка сама так не вміє. -->
			<ul
				class="grid"
				style="--columns: {perRow * 2}"
				bind:clientWidth={gridWidth}
				data-testid="galaxy-roster-list"
			>
				{#each shown as graduate, index (graduate.slug)}
					<li
						style="grid-row: {layout.cells[index]?.row ?? 1}; grid-column-start: {layout.cells[
							index
						]?.column ?? 1}"
						data-testid="galaxy-roster-list-item-{graduate.slug}"
					>
						<GraduateRosterRow {graduate} onselect={() => onselect(graduate)} />
					</li>
				{/each}

				{#each groups as group, index (group.year)}
					<GraduateRosterHead year={group.year} row={layout.headingRows[index] ?? 1} />
				{/each}
			</ul>
		</div>

		{#if shown.length === 0}
			<p class="sheet__empty" data-testid="galaxy-roster-empty-message">{$t('galaxy.nothingFound')}</p>
		{/if}
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
		/* Ширше, ніж було: колонок стільки, скільки вміститься. max-height
		   обов'язковий — без нього центроване вікно вилазить в обидва боки, і кнопка
		   закриття опиняється над екраном (FLUID-SIZING-v8 § 4). */
		width: min(1500px, calc(100vw - 1.5rem));
		max-height: min(86dvh, 900px);
		padding: clamp(0.75rem, 2.5dvh, 1.25rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
	}

	.sheet__head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.sheet__title {
		margin: 0;
		font-size: clamp(1rem, 2.6dvh, 1.3rem);
	}

	.sheet__count {
		opacity: 0.65;
		font-weight: 400;
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

	/* min-height: 0 — без нього флекс-елемент не дає дітям прокручуватися: висота
	   рахується по вмісту, і вікно вилазить за екран замість прокрутки. */
	.sheet__body {
		display: flex;
		gap: 0.75rem;
		min-height: 0;
	}

	.grid {
		display: grid;
		/* Колонок ДВІЧІ більше, ніж людей у рядку: елемент займає дві, і короткий
		   рядок зсувається рівно на півклітинки — це й дає шахівницю. */
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		/* Відступ помітний навмисно: із тлом рядки читаються як окремі картки. */
		gap: 0.5rem;
		flex: 1 1 auto;
		min-width: 0;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		list-style: none;
	}

	.grid li {
		/* `span 2` тут, а в розмітці лише `grid-column-start` — див. `staggerCells`. */
		grid-column-end: span 2;
		min-width: 0;
	}

	/*
	 * Роки на вузькому екрані стають смугою НАД переліком (сама смуга — у
	 * `GraduateRosterYears`), і сітка забирає всю ширину.
	 *
	 * Цей запит я одного разу вже втратив: витягаючи заголовок року в окремий
	 * компонент, вирізав його разом зі стилями заголовка, які лежали поруч. На
	 * телефоні смуга лишилася збоку, розтяглася на всю висоту вікна — кнопки
	 * стали 587px завишки й поїхали за екран на x=936. Спіймав це гейт
	 * `e2e/galaxy-roster`, а не око.
	 */
	@media (max-width: 700px) {
		.sheet__body {
			flex-direction: column;
		}
	}

	.sheet__empty {
		margin: 1rem 0 0;
		opacity: 0.7;
		text-align: center;
	}
</style>
