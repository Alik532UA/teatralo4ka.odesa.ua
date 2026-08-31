<script lang="ts">
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';
	import GalaxyMarks from './GalaxyMarks.svelte';
	import { groupByYear, type GalaxyRow } from './galaxyRow';

	/**
	 * Рядки сторінки-переліку: або згруповані за роками, або поспіль.
	 *
	 * ## Чому ОДИН компонент на два режими, а не два
	 *
	 * У репертуарі майстра хронологія й список — окремі файли, і там це виправдано:
	 * рядки в них справді різні. Тут навпаки — рядок однаковий до пікселя, бо в
	 * цьому й був сенс спільної форми (див. `GalaxyRow`). Різниця РІВНО одна: рік
	 * стоїть заголовком над групою рядків або першою коміркою в самому рядку.
	 *
	 * Два файли з однаковим тілом рядка означали б, що правка відступу в одному
	 * не доходить до другого — а перемикач між ними стоїть поруч, і розходження
	 * видно з першого натискання. Тому логічне «або-або» тут і є прапорцем.
	 *
	 * ## Чому рік у списку, а не в хронології
	 *
	 * У хронології рік уже названий заголовком, і повторювати його в кожному
	 * рядку — це той самий напис двічі в одному полі зору. Замість нього крапка:
	 * вона позначає рядок як пункт під роком, і саме за нею око тримає лінію.
	 * У списку заголовків немає, тож рік мусить бути в рядку — інакше режим
	 * перестає відповідати на «коли».
	 */
	interface Props {
		rows: readonly GalaxyRow[];
		/** `true` — заголовки років; `false` — рівний перелік із роком у рядку. */
		grouped: boolean;
		/**
		 * Початок `data-testid`. Свій на кожній сторінці: `e2e/testid.spec.ts`
		 * вимагає унікальності в межах сторінки, а рядків тут сотні.
		 */
		testIdPrefix: string;
		/**
		 * Скільки мініатюр показувати в рядку.
		 *
		 * Менше за плитку: рядок віддає обличчям власну колонку сітки, а не всю
		 * ширину картки. Шість — те саме число, що в репертуарі майстра, де рядок
		 * такої самої будови.
		 */
		maxFaces?: number;
	}

	let { rows, grouped, testIdPrefix, maxFaces = 6 }: Props = $props();

	const byYear = $derived(groupByYear(rows, (r) => r.year));
</script>

{#snippet row(item: GalaxyRow)}
	<li class="grow" data-testid="{testIdPrefix}-row-{item.key}">
		{#if grouped}
			<span class="grow__dot" aria-hidden="true"></span>
		{:else}
			<span class="grow__year">{item.yearLabel ?? item.year}</span>
		{/if}

		<span class="grow__main">
			<a class="grow__link" href={item.href} data-testid="{testIdPrefix}-row-link-{item.key}">
				<span class="grow__title">{item.title}</span>
			</a>
			{#if item.subtitle}<span class="grow__subtitle">{item.subtitle}</span>{/if}
		</span>

		<!--
			Склад — ВЛАСНА колонка сітки, а не рядок під назвою: четвертим елементом
			обличчя падали на другий поверх і розтягували рядок удвічі. На вузькому
			контейнері колонка з'їжджає вниз сама — так само, як плашки праворуч.

			Порожньої комірки-заповнювача тут НЕМА: остання колонка оголошена `auto`,
			тож без вмісту вона стискається в нуль, і плашки лишаються на правому
			краї байдуже, третьою вони стали чи четвертою. Заповнювач коштував би 733
			зайвих вузли на сторінці вистав — заміряно.
		-->
		{#if item.memberIds?.length}
			<span class="grow__cast">
				<GraduateAvatarRow
					ids={item.memberIds}
					testIdPrefix="{testIdPrefix}-cast-{item.key}"
					max={maxFaces}
					inline
				/>
			</span>
		{/if}

		<span class="grow__marks">
			<!-- Роки підписом — лише коли їх більше за один; чому, див. `yearLabel`. -->
			{#if grouped && item.yearLabel && item.yearLabel !== String(item.year)}
				<span class="grow__years">{item.yearLabel}</span>
			{/if}
			<GalaxyMarks marks={item.marks ?? []} testIdPrefix="{testIdPrefix}-row-{item.key}" />
		</span>
	</li>
{/snippet}

{#if grouped}
	<div class="gyears" data-testid="{testIdPrefix}-list">
		{#each byYear as [year, items] (year)}
			<section class="gyear" data-testid="{testIdPrefix}-year-section-{year}">
				<div class="gyear__head">
					<h2 class="gyear__title">{year}</h2>
					<span class="gyear__count" data-testid="{testIdPrefix}-year-count-{year}">
						{items.length}
					</span>
				</div>
				<ul class="gyear__items">
					{#each items as item (item.key)}{@render row(item)}{/each}
				</ul>
			</section>
		{/each}
	</div>
{:else}
	<ul class="gyear__items gyear__items--flat" data-testid="{testIdPrefix}-list">
		{#each rows as item (item.key)}{@render row(item)}{/each}
	</ul>
{/if}

<style>
	.gyears {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		/* Запит контейнера, а не екрана: та сама сітка стоїть і на всю ширину
		   сторінки, і в колонці — вирішує місце, яке є, а не розмір вікна. */
		container-type: inline-size;
	}

	.gyear__head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.6rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--border-main);
	}
	.gyear__title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--text-title);
	}
	.gyear__count {
		display: grid;
		place-items: center;
		min-width: 1.5rem;
		padding: 0 0.35rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.gyear__items {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.gyear__items--flat {
		container-type: inline-size;
	}

	.grow {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: 0.5rem 0.75rem;
		padding: 0.4rem 0.5rem;
		border-radius: var(--radius-md, 12px);
		border: 1px solid transparent;
	}
	.grow:hover {
		background: var(--bg-surface);
		border-color: var(--border-main);
	}

	.grow__dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent-primary);
		opacity: 0.55;
	}
	.grow__year {
		min-width: 3.2rem;
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.grow__main {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.5rem;
		min-width: 0;
	}
	.grow__link {
		color: inherit;
		text-decoration: none;
		min-width: 0;
	}
	.grow__title {
		font-weight: 600;
		color: var(--text-title);
	}
	.grow__link:hover .grow__title {
		color: var(--accent-primary);
	}
	.grow__subtitle {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.grow__cast {
		min-width: 0;
		overflow: hidden;
	}

	.grow__marks {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		justify-content: flex-end;
	}
	.grow__years {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/*
	 * Вузько — обличчя й плашки на власні поверхи.
	 *
	 * Чотири колонки в 360 пікселів дають назву в два символи на рядок. Перша
	 * колонка (рік або крапка) лишається на місці: без неї рядки втрачають ліву
	 * лінію, за якою око йде списком.
	 */
	@container (max-width: 640px) {
		.grow {
			grid-template-columns: auto 1fr;
		}
		.grow__cast,
		.grow__marks {
			grid-column: 2;
			justify-content: flex-start;
		}
		.grow__marks {
			flex-wrap: wrap;
		}
	}
</style>
