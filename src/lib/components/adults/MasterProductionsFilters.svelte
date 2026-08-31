<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Trophy, Video, Search } from 'lucide-svelte';
	import { earlyShows } from '$lib/services/earlyShows.svelte';

	export type FilterType = 'all' | 'dtsh' | 'early' | 'awards' | 'video';

	/**
	 * Панель фільтрів вистав винесена з `MasterProductions` окремим файлом.
	 *
	 * Причина механічна й записана чесно: розділ упритул підійшов до стелі SLOC
	 * (299 із 300 на 2026-08-31), і три режими показу в нього просто не
	 * вміщалися. Але поділ вийшов і за відповідальністю, а не лише за розміром:
	 * тут — ЩО показувати (відбір і пошук), у сусідніх компонентах — ЯК
	 * показувати. Лічильники приходять готовими: рахує їх той, хто володіє
	 * списком, інакше два місця рахували б те саме по-різному.
	 */
	interface Props {
		activeFilter: FilterType;
		searchQuery: string;
		counts: { all: number; dtsh: number; early: number; awards: number; video: number };
		onfilter: (filter: FilterType) => void;
		onsearch: (query: string) => void;
	}

	let { activeFilter, searchQuery, counts, onfilter, onsearch }: Props = $props();
</script>

<div class="controls-bar">
	<div class="filter-tabs" role="tablist" aria-label="Фільтр вистав">
		<button
			type="button"
			role="tab"
			aria-selected={activeFilter === 'all'}
			class="filter-tab"
			class:filter-tab--active={activeFilter === 'all'}
			onclick={() => onfilter('all')}
			data-testid="master-productions-tab-all"
		>
			{$t('galaxy.filterAll', { default: 'Усі' })} ({counts.all})
		</button>

		<button
			type="button"
			role="tab"
			aria-selected={activeFilter === 'dtsh'}
			class="filter-tab"
			class:filter-tab--active={activeFilter === 'dtsh'}
			onclick={() => onfilter('dtsh')}
			data-testid="master-productions-tab-dtsh"
		>
			{$t('galaxy.filterDtsh', { default: 'ДТШ (2006–2026)' })} ({counts.dtsh})
		</button>

		{#if earlyShows.visible}
			<button
				type="button"
				role="tab"
				aria-selected={activeFilter === 'early'}
				class="filter-tab"
				class:filter-tab--active={activeFilter === 'early'}
				onclick={() => onfilter('early')}
				data-testid="master-productions-tab-early"
			>
				{$t('galaxy.filterEarly', { default: 'Ранні покази (1992–2015)' })} ({counts.early})
			</button>
		{/if}

		{#if counts.awards > 0}
			<button
				type="button"
				role="tab"
				aria-selected={activeFilter === 'awards'}
				class="filter-tab"
				class:filter-tab--active={activeFilter === 'awards'}
				onclick={() => onfilter('awards')}
				data-testid="master-productions-tab-awards"
			>
				<Trophy size={14} aria-hidden="true" />
				<span>{$t('galaxy.filterAwards', { default: 'З нагородами' })} ({counts.awards})</span>
			</button>
		{/if}

		{#if counts.video > 0}
			<button
				type="button"
				role="tab"
				aria-selected={activeFilter === 'video'}
				class="filter-tab"
				class:filter-tab--active={activeFilter === 'video'}
				onclick={() => onfilter('video')}
				data-testid="master-productions-tab-video"
			>
				<Video size={14} aria-hidden="true" />
				<span>{$t('galaxy.filterVideo', { default: 'З відео' })} ({counts.video})</span>
			</button>
		{/if}
	</div>

	<div class="search-wrap">
		<div class="search-icon-box" aria-hidden="true">
			<Search size={16} />
		</div>
		<input
			type="search"
			value={searchQuery}
			oninput={(e) => onsearch(e.currentTarget.value)}
			placeholder="Пошук вистави, автора, групи, року чи учасника..."
			class="search-input"
			aria-label="Пошук вистави або учасника"
			data-testid="master-productions-search-input"
		/>
	</div>
</div>

<style>
	.controls-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.filter-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.filter-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.9rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base, 0.2s ease);
	}
	.filter-tab:hover {
		color: var(--text-title);
		border-color: var(--accent-primary);
	}
	.filter-tab--active {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: var(--text-on-accent);
	}
	.search-wrap {
		position: relative;
		min-width: 280px;
		flex-grow: 1;
		max-width: 380px;
	}
	.search-icon-box {
		position: absolute;
		left: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		pointer-events: none;
		display: flex;
		align-items: center;
	}
	.search-input {
		width: 100%;
		padding: 0.5rem 1rem 0.5rem 2.4rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		font-size: 0.88rem;
		outline: none;
		transition:
			border-color var(--transition-base, 0.2s ease),
			box-shadow var(--transition-base, 0.2s ease);
	}
	.search-input:focus {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
	}
</style>
