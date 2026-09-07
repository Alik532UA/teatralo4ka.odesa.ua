<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Search } from 'lucide-svelte';
	import PlanetFace from './PlanetFace.svelte';
	import PlanetSphere from './PlanetSphere.svelte';
	import { matchesQuery } from '$lib/utils/searchQuery';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * ПЛАНЕТА Й ПЕРЕЛІК — імена видно завжди, і планета лишається.
	 *
	 * ## Що вирішує
	 *
	 * Компроміс між двома крайніми варіантами: куля з обличчями ліворуч, стовпчик
	 * імен праворуч. Наведення на ім'я підсвічує обличчя, наведення на обличчя —
	 * ім'я; тобто підпис не лізе на малюнок, але й не зникає.
	 *
	 * Масштабується найкраще з трьох: планета впирається у свою ємність (обличчя
	 * не меншає за ціль дотику 44 px), а перелік — ні, він просто прокручується,
	 * і в нього є пошук. Коли учнів стане більше, ніж уміщає куля, ті, кого на ній
	 * немає, лишаються в переліку — і про це сказано числом під самою кулею.
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
	}

	let { students, onopen, testIdPrefix = 'creativity-planet' }: Props = $props();

	let запит = $state('');
	let активний = $state<string | null>(null);

	const знайдені = $derived(students.filter((с) => matchesQuery([с.name], запит)));
</script>

<div class="split">
	<div class="split__planet">
		<!-- Планета показує ВСІХ, а не знайдених: вона не фільтр, а картина класу.
		     Куля тут менша за орбітальну — поруч із нею стоїть перелік. -->
		<PlanetSphere
			{students}
			{onopen}
			{testIdPrefix}
			maxWidth={460}
			active={активний}
			onactive={(id) => (активний = id)}
		/>
	</div>

	<div class="split__side">
		<label class="search">
			<Search size={16} aria-hidden="true" />
			<input
				type="search"
				bind:value={запит}
				placeholder={$t('galaxy.searchPlaceholder', { default: 'Пошук за іменем' })}
				aria-label={$t('galaxy.searchPlaceholder', { default: 'Пошук за іменем' })}
				data-testid="{testIdPrefix}-search-input"
			/>
		</label>

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
						<PlanetFace student={учень} icon={16} />
						<span>{учень.name}</span>
					</button>
				</li>
			{/each}
		</ul>

		{#if знайдені.length === 0}
			<p class="empty" data-testid="{testIdPrefix}-empty-message">
				{students.length === 0
					? $t('planet.empty')
					: $t('search.nothing', { values: { query: запит } })}
			</p>
		{/if}
	</div>
</div>

<style>
	/*
	 * Дві колонки на широкому, одна на вузькому. `minmax(0, …)` обов'язковий:
	 * без нього колонка з переліком не дає йому стискатися, і довге ім'я
	 * розсуває сітку за край сторінки.
	 */
	.split {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
		gap: 1.5rem 2rem;
		align-items: start;
		width: 100%;
	}
	@media (max-width: 860px) {
		.split {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
		}
	}

	.split__planet {
		display: grid;
		justify-items: center;
	}

	.split__side {
		display: grid;
		gap: 0.75rem;
		width: 100%;
		max-width: 34rem;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 0.85rem;
		border: 1px solid var(--border-main);
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		color: var(--text-muted);
	}
	.search input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: none;
		color: var(--text-main);
		font: inherit;
	}
	/*
	 * Кільце знято з ПОЛЯ й намальоване на плашці навколо нього: візуально це
	 * один контрол, і рамка по краю плашки читається краще за прямокутник
	 * усередині. `:focus-within` — саме той селектор, який це вміє.
	 */
	.search input:focus {
		outline: none;
	}
	.search:focus-within {
		outline: 2px solid var(--accent-text);
		outline-offset: 2px;
	}

	/*
	 * Перелік прокручується САМ, а не разом зі сторінкою: інакше при сорока
	 * іменах планета їхала б угору, і зв'язок «ім'я ↔ обличчя» ставав би
	 * недосяжним — а він і є весь сенс цієї розкладки.
	 */
	.names {
		display: grid;
		gap: 0.25rem;
		max-height: min(60vmin, 460px);
		overflow-y: auto;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.name {
		--face: 34px;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		min-height: 44px;
		padding: 0.25rem 0.6rem;
		border: 1px solid transparent;
		border-radius: var(--radius-md, 8px);
		background: none;
		color: var(--text-main);
		font: inherit;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		transition:
			background var(--transition-base),
			border-color var(--transition-base);
	}
	.name:hover,
	.name:focus-visible,
	.name.is-active {
		background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
		border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border-main));
	}

	.empty {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
</style>
