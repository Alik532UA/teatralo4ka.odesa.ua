<script lang="ts">
	import { t } from "svelte-i18n";
	import {
		Search,
		ChevronRight,
		X,
		Users,
		Drama,
		Music,
		Mic,
		Palette,
		Calendar,
		Sparkles,
	} from "lucide-svelte";
	import PlanetFace from "./PlanetFace.svelte";
	import PlanetSphere from "./PlanetSphere.svelte";
	import { matchesQuery } from "$lib/utils/searchQuery";
	import type { GraduateIndexEntry, Department } from "$lib/data/graduates";

	/**
	 * ПЛАНЕТА Й ПЕРЕЛІК — куля з обличчями ліворуч, імена праворуч.
	 *
	 * ## Що вирішує
	 *
	 * Наведення на ім'я підсвічує обличчя, наведення на обличчя — і підсвічує
	 * ім'я в переліку, і показує його плашкою під самим обличчям. Тобто підпис
	 * не стоїть під кожним постійно (саме від цього сторінка й була нечитною),
	 * але й не ховається — він є в обох місцях одразу для того, на кого дивляться.
	 *
	 * ## Чому саме ця розкладка, і чому вона одна
	 *
	 * 2026-09-08 автор обрав її з трьох, які ми зробили після його знімка з
	 * накладеними підписами. Дві інші («Орбіти» — сама куля, «Сітка» — самі
	 * картки) прибрано разом із перемикачем: обирати більше нема з чого, а
	 * перемикач із одним пунктом — це елемент керування, який нічим не керує.
	 *
	 * Масштабується вона й найкраще з трьох: куля впирається у свою ємність
	 * (обличчя не меншає за ціль дотику 44 px), а перелік — ні, він просто
	 * прокручується, і в нього є пошук. Коли учнів стане більше, ніж уміщає куля,
	 * ті, кого на ній немає, лишаються в переліку — і про це сказано числом під
	 * самою кулею.
	 *
	 * ## Чому пошук саме тут
	 *
	 * Він має сенс лише там, де є перелік: шукати очима по кулі однаково не
	 * вийде. Правило збігу — спільне `matchesQuery`, те саме, що в галактиці.
	 */
	interface Props {
		/* `readonly`: реєстр приходить сталим переліком, і компонент його не міняє. */
		students: readonly GraduateIndexEntry[];
		onopen: (student: GraduateIndexEntry) => void;
		testIdPrefix?: string;
		header?: import("svelte").Snippet;
	}

	let {
		students,
		onopen,
		testIdPrefix = "creativity-planet",
		header,
	}: Props = $props();

	let запит = $state("");
	let активний = $state<string | null>(null);
	let обранеВідділення = $state<string | null>(null);

	/**
	 * Перемішування Фішера—Йейтса.
	 *
	 * Окремий випадковий порядок для планети й окремий для списку:
	 * на планеті — довільні місця серед усіх учнів, а у списку —
	 * спершу ті, хто має фото (у випадковому порядку), потім ті,
	 * хто без фото (також у випадковому порядку).
	 */
	function shuffle<T>(list: readonly T[]): T[] {
		const out = [...list];
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	/*
	 * До гідратації (пререндер) — детермінований порядок: на планеті як у даних,
	 * а в списку спершу ті, що з фото, далі без фото.
	 *
	 * Після гідратації в клієнтському ефекті обидва переліки перемішуються:
	 * на планеті — випадкові місця для всіх учнів;
	 * у списку — спершу учні з фото у випадковому порядку, потім учні без фото
	 * також у випадковому порядку.
	 */
	const defaultList = $derived([
		...students.filter((s) => s.hasPhoto),
		...students.filter((s) => !s.hasPhoto),
	]);

	let shuffledPlanet = $state<readonly GraduateIndexEntry[] | null>(null);
	let shuffledList = $state<readonly GraduateIndexEntry[] | null>(null);

	$effect(() => {
		shuffledPlanet = shuffle(students);
		shuffledList = [
			...shuffle(students.filter((s) => s.hasPhoto)),
			...shuffle(students.filter((s) => !s.hasPhoto)),
		];
	});

	const planetStudents = $derived(shuffledPlanet ?? students);
	const listStudents = $derived(shuffledList ?? defaultList);

	const DEPT_META: Record<string, { labelKey: string }> = {
		theatre: { labelKey: "galaxy.departments.theatre" },
		music: { labelKey: "galaxy.departments.music" },
		vocal: { labelKey: "galaxy.departments.vocal" },
		piano: { labelKey: "galaxy.departments.piano" },
		guitar: { labelKey: "galaxy.departments.guitar" },
		art: { labelKey: "galaxy.departments.art" },
	};

	const наявніВідділення = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const s of students) {
			for (const d of s.departments) {
				counts[d] = (counts[d] ?? 0) + 1;
			}
		}
		return Object.entries(counts).map(([dept, count]) => ({
			id: dept,
			count,
			meta: DEPT_META[dept] ?? { labelKey: `galaxy.departments.${dept}` },
		}));
	});

	const відфільтрованіЗаВідділенням = $derived(
		обранеВідділення
			? listStudents.filter((s) =>
					s.departments.includes(обранеВідділення as Department),
				)
			: listStudents,
	);

	const знайдені = $derived(
		відфільтрованіЗаВідділенням.filter((с) =>
			matchesQuery([с.name], запит),
		),
	);
</script>

{#snippet deptIcon(id: string, size = 12)}
	{#if id === "theatre"}
		<Drama {size} aria-hidden="true" />
	{:else if id === "music" || id === "piano" || id === "guitar"}
		<Music {size} aria-hidden="true" />
	{:else if id === "vocal"}
		<Mic {size} aria-hidden="true" />
	{:else if id === "art"}
		<Palette {size} aria-hidden="true" />
	{:else}
		<Sparkles {size} aria-hidden="true" />
	{/if}
{/snippet}

<div class="split">
	<div class="split__planet">
		<!-- Планета показує ВСІХ, а не знайдених: вона не фільтр, а картина класу.
		     Куля вужча за повну ширину — поруч із нею стоїть перелік. -->
		<PlanetSphere
			students={planetStudents}
			{onopen}
			{testIdPrefix}
			maxWidth={1600}
			active={активний}
			onactive={(id: string | null) => (активний = id)}
			departmentFilter={обранеВідділення}
		/>
	</div>

	<div class="split__side">
		{#if header}
			<div class="split__header">
				{@render header()}
			</div>
		{/if}

		<div class="card">
			<div class="card__header">
				<div class="card__title-wrap">
					<span class="card__icon"
						><Users size={17} aria-hidden="true" /></span
					>
					<h2 class="card__title">
						{$t("planet.studentsList", { default: "Список учнів" })}
					</h2>
				</div>
				<span class="card__counter"
					>{знайдені.length} / {students.length}</span
				>
			</div>

			<label class="search">
				<Search size={15} aria-hidden="true" />
				<input
					class="search__input"
					type="search"
					bind:value={запит}
					placeholder={$t("galaxy.searchPlaceholder", {
						default: "Пошук за іменем",
					})}
					aria-label={$t("galaxy.searchPlaceholder", {
						default: "Пошук за іменем",
					})}
					data-testid="{testIdPrefix}-search-input"
				/>
				{#if запит}
					<button
						type="button"
						class="search__clear"
						onclick={() => (запит = "")}
						aria-label={$t("search.clear", { default: "Очистити" })}
						data-testid="{testIdPrefix}-search-clear-btn"
					>
						<X size={13} aria-hidden="true" />
					</button>
				{/if}
			</label>

			{#if наявніВідділення.length > 1}
				<div
					class="dept-tabs"
					role="tablist"
					aria-label={$t("galaxy.departmentsTitle", {
						default: "Відділення",
					})}
				>
					<button
						type="button"
						role="tab"
						aria-selected={обранеВідділення === null}
						class="dept-tab"
						class:is-active={обранеВідділення === null}
						onclick={() => (обранеВідділення = null)}
						data-testid="{testIdPrefix}-dept-all-btn"
					>
						<span class="dept-tab__icon"
							><Sparkles size={13} aria-hidden="true" /></span
						>
						<span
							>{$t("planet.allStudents", {
								default: "Усі учні",
							})}</span
						>
						<span class="dept-tab__count">{students.length}</span>
					</button>
					{#each наявніВідділення as d (d.id)}
						<button
							type="button"
							role="tab"
							aria-selected={обранеВідділення === d.id}
							class="dept-tab"
							class:is-active={обранеВідділення === d.id}
							onclick={() =>
								(обранеВідділення =
									обранеВідділення === d.id ? null : d.id)}
							data-testid="{testIdPrefix}-dept-{d.id}-btn"
						>
							<span class="dept-tab__icon"
								>{@render deptIcon(d.id, 13)}</span
							>
							<span>{$t(d.meta.labelKey, { default: d.id })}</span
							>
							<span class="dept-tab__count">{d.count}</span>
						</button>
					{/each}
				</div>
			{/if}

			<div class="names-scroll-wrap">
				<ul class="names" data-testid="{testIdPrefix}-names-list">
					{#each знайдені as учень (учень.id)}
						<li>
							<button
								type="button"
								class="name"
								class:is-active={активний === учень.id}
								onclick={() => onopen(учень)}
								onpointerenter={() => (активний = учень.id)}
								onpointerleave={() => (активний = null)}
								onfocus={() => (активний = учень.id)}
								onblur={() => (активний = null)}
								data-testid="{testIdPrefix}-name-{учень.slug}-btn"
							>
								<span class="name__face">
									<PlanetFace student={учень} icon={16} />
								</span>
								<span class="name__body">
									<span class="name__name">{учень.name}</span>
									<span class="name__meta">
										{#each учень.departments as d (d)}
											{@const meta = DEPT_META[d]}
											<span class="name__tag">
												<span class="name__tag-icon"
													>{@render deptIcon(
														d,
														12,
													)}</span
												>
												<span
													>{$t(
														meta?.labelKey ??
															`galaxy.departments.${d}`,
														{ default: d },
													)}</span
												>
											</span>
										{/each}
										{#if учень.enrollmentYears && учень.enrollmentYears.length > 0}
											<span class="name__year">
												<Calendar
													size={11}
													aria-hidden="true"
												/>
												<span
													>{учень
														.enrollmentYears[0]}</span
												>
											</span>
										{/if}
									</span>
								</span>
								<span class="name__arrow"
									><ChevronRight
										size={15}
										aria-hidden="true"
									/></span
								>
							</button>
						</li>
					{/each}
				</ul>

				{#if знайдені.length === 0}
					<p class="empty" data-testid="{testIdPrefix}-empty-message">
						{students.length === 0
							? $t("planet.empty")
							: $t("search.nothing", {
									values: { query: запит },
								})}
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/*
	 * Дві колонки на широкому:
	 *   - куля ліворуч закріплена по центру (fixed) і не скролиться;
	 *   - картка та шапка праворуч скроляться за потреби.
	 * На вузькому (<=860px) — лінійний потік: шапка -> куля -> картка.
	 */
	.split {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		position: relative;
	}

	.split__planet {
		position: fixed;
		top: calc(var(--header-height, 72px) + 1rem);
		bottom: calc(var(--footer-height, 80px) + 1rem);
		left: max(1.5rem, calc((100vw - min(1800px, 94vw)) / 2));
		width: calc(min(1800px, 94vw) - min(480px, 42vw) - clamp(1.5rem, 2.5vw, 3rem));
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
		z-index: 5;
	}

	.split__side {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		width: min(480px, 42vw);
		margin-left: auto;
		min-width: 0;
		position: relative;
		z-index: 10;
	}

	@media (max-width: 860px) {
		.split {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			gap: 1.25rem;
		}

		.split__side {
			display: contents;
			width: 100%;
			margin-left: 0;
		}

		.split__header {
			order: -1;
			width: 100%;
		}

		.split__planet {
			order: 0;
			position: static;
			height: auto;
			width: 100%;
		}

		.card {
			order: 1;
			width: 100%;
		}
	}

	.card {
		display: grid;
		gap: 0.65rem;
		width: 100%;
		padding: 0.85rem 1rem;
		border-radius: var(--radius-xl, 16px);
		background: var(--bg-surface);
		border: var(--hairline-width) solid var(--border-main);
		box-shadow: var(--shadow-sm, 0 2px 8px rgb(0 0 0 / 0.08));
	}

	.card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.65rem;
	}

	.card__title-wrap {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--text-title);
	}

	.card__icon {
		display: inline-flex;
		align-items: center;
		color: var(--accent-text);
	}

	.card__title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}

	.card__counter {
		display: inline-block;
		padding: 0.12rem 0.55rem;
		border-radius: var(--radius-full, 9999px);
		background: color-mix(in srgb, var(--bg-card) 85%, transparent);
		border: var(--hairline-width) solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 600;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 38px;
		padding: 0 0.75rem;
		border: var(--hairline-width) solid var(--border-main);
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-card);
		color: var(--text-muted);
	}
	.search__input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: none;
		color: var(--text-main);
		font: inherit;
		font-size: 0.88rem;
	}
	.search__input:focus {
		outline: none;
	}
	.search:focus-within {
		outline: 2px solid var(--accent-text);
		outline-offset: 2px;
	}

	.search__clear {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: color-mix(in srgb, var(--text-muted) 20%, transparent);
		color: var(--text-main);
		cursor: pointer;
		transition: background var(--transition-base);
	}
	.search__clear:hover {
		background: color-mix(in srgb, var(--accent-primary) 30%, transparent);
		color: var(--accent-text);
	}

	.dept-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		padding: 0.05rem 0;
	}

	.dept-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 28px;
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius-full, 9999px);
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-card);
		color: var(--text-muted);
		font: inherit;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background var(--transition-base),
			border-color var(--transition-base),
			color var(--transition-base);
	}
	.dept-tab:hover {
		color: var(--text-title);
		border-color: color-mix(
			in srgb,
			var(--accent-primary) 40%,
			var(--border-main)
		);
	}
	.dept-tab.is-active {
		background: color-mix(
			in srgb,
			var(--accent-primary) 18%,
			var(--bg-card)
		);
		border-color: var(--accent-primary);
		color: var(--accent-text);
		font-weight: 700;
	}
	.dept-tab__icon {
		display: inline-flex;
		align-items: center;
	}
	.dept-tab__count {
		display: inline-block;
		padding: 0.04rem 0.32rem;
		border-radius: var(--radius-full, 9999px);
		background: color-mix(in srgb, var(--text-muted) 15%, transparent);
		font-size: 0.7rem;
	}
	.dept-tab.is-active .dept-tab__count {
		background: color-mix(in srgb, var(--accent-primary) 30%, transparent);
		color: var(--text-title);
	}

	.names-scroll-wrap {
		position: relative;
		border-radius: var(--radius-lg, 12px);
		background: color-mix(in srgb, var(--bg-card) 60%, transparent);
		border: var(--hairline-width) solid var(--border-main);
		padding: 0.25rem;
	}

	/*
	 * Перелік прокручується САМ, а не разом зі сторінкою: інакше при сорока
	 * іменах планета їхала б угору, і зв'язок «ім'я ↔ обличчя» ставав би
	 * недосяжним — а він і є весь сенс цієї розкладки.
	 */
	.names {
		display: grid;
		gap: 0.2rem;
		max-height: min(calc(100dvh - 430px), 52dvh, 650px);
		min-height: 200px;
		overflow-y: auto;
		margin: 0;
		padding: 0.15rem;
		list-style: none;
		scrollbar-width: thin;
		scrollbar-color: color-mix(
				in srgb,
				var(--accent-primary) 40%,
				var(--border-main)
			)
			transparent;
	}
	.names::-webkit-scrollbar {
		width: 5px;
	}
	.names::-webkit-scrollbar-track {
		background: transparent;
	}
	.names::-webkit-scrollbar-thumb {
		background: color-mix(
			in srgb,
			var(--accent-primary) 40%,
			var(--border-main)
		);
		border-radius: var(--radius-full, 9999px);
	}
	.names::-webkit-scrollbar-thumb:hover {
		background: var(--accent-primary);
	}

	.name {
		--face: 34px;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		min-height: 44px;
		padding: 0.3rem 0.55rem;
		border: var(--hairline-width) solid transparent;
		border-radius: var(--radius-md, 8px);
		background: none;
		color: var(--text-main);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			background var(--transition-base),
			border-color var(--transition-base),
			transform var(--transition-base);
	}
	.name:hover,
	.name:focus-visible,
	.name.is-active {
		background: color-mix(
			in srgb,
			var(--accent-primary) 14%,
			var(--bg-card)
		);
		border-color: color-mix(
			in srgb,
			var(--accent-primary) 45%,
			var(--border-main)
		);
		transform: translateX(2px);
	}

	.name__face {
		flex-shrink: 0;
	}

	.name__body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.name__name {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-title);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.name__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.73rem;
		color: var(--text-muted);
	}

	.name__tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.name__tag-icon {
		display: inline-flex;
		align-items: center;
		opacity: 0.85;
	}

	.name__year {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		opacity: 0.85;
	}

	.name__arrow {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		color: var(--text-muted);
		opacity: 0.45;
		transition:
			transform var(--transition-base),
			opacity var(--transition-base),
			color var(--transition-base);
	}
	.name:hover .name__arrow,
	.name:focus-visible .name__arrow,
	.name.is-active .name__arrow {
		opacity: 1;
		color: var(--accent-text);
		transform: translateX(3px);
	}

	.empty {
		margin: 1rem;
		color: var(--text-muted);
		font-size: 0.9rem;
		text-align: center;
	}
</style>
