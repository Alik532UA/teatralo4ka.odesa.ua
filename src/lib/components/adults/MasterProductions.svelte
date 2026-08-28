<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Sparkles, Trophy, Video, Search, Theater } from 'lucide-svelte';
	import type { MasterProduction } from '$lib/data/masters';
	import MasterProductionCard from './MasterProductionCard.svelte';

	interface Props {
		productions: MasterProduction[];
		isEn?: boolean;
	}

	let { productions = [], isEn = false }: Props = $props();

	type FilterType = 'all' | 'dtsh' | 'early' | 'awards' | 'video';

	let activeFilter = $state<FilterType>('all');
	let searchQuery = $state('');

	const filteredProductions = $derived(
		productions.filter((p) => {
			if (activeFilter === 'dtsh' && p.isDtsh === false) return false;
			if (activeFilter === 'early' && p.isDtsh !== false) return false;
			if (activeFilter === 'awards' && (!p.awards || p.awards.length === 0)) return false;
			if (activeFilter === 'video' && !p.videoUrl) return false;

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const inTitle = p.title.toLowerCase().includes(q);
				const inAuthor = p.originalAuthor?.toLowerCase().includes(q) ?? false;
				const inGroup = p.theatreGroup?.toLowerCase().includes(q) ?? false;
				const inYear = String(p.year).includes(q);
				const inParticipants = p.participants?.some((part) => part.toLowerCase().includes(q)) ?? false;
				const inAwards = p.awards?.some((aw) => aw.toLowerCase().includes(q)) ?? false;
				const inInstitution = p.institution?.toLowerCase().includes(q) ?? false;

				return inTitle || inAuthor || inGroup || inYear || inParticipants || inAwards || inInstitution;
			}

			return true;
		})
	);

	const awardsCount = $derived(productions.filter((p) => p.awards && p.awards.length > 0).length);
	const videoCount = $derived(productions.filter((p) => p.videoUrl).length);
	const dtshCount = $derived(productions.filter((p) => p.isDtsh !== false).length);
	const earlyCount = $derived(productions.filter((p) => p.isDtsh === false).length);
</script>

<section class="productions-section" data-testid="master-productions-section">
	<div class="section-header">
		<div class="section-header__title-wrap">
			<div class="section-icon">
				<Theater size={24} aria-hidden="true" />
			</div>
			<div>
				<h2 class="section-title">
					{$t('galaxy.productionsTitle', { default: 'Режисерські роботи та покази вистав' })}
				</h2>
				<p class="section-subtitle">
					{$t('galaxy.productionsSubtitle', {
						default: 'Хронологія театральних постановок, показів та вистав за участі вихованців'
					})}
				</p>
			</div>
		</div>

		<span class="total-badge" data-testid="master-productions-total-badge">
			<Sparkles size={16} aria-hidden="true" />
			<span>
				{$t('galaxy.productionsCount', {
					values: { count: productions.length },
					default: `${productions.length} вистав та показів`
				})}
			</span>
		</span>
	</div>

	<div class="controls-bar">
		<div class="filter-tabs" role="tablist" aria-label="Фільтр вистав">
			<button
				type="button"
				role="tab"
				aria-selected={activeFilter === 'all'}
				class="filter-tab"
				class:filter-tab--active={activeFilter === 'all'}
				onclick={() => (activeFilter = 'all')}
				data-testid="master-productions-tab-all"
			>
				{$t('galaxy.filterAll', { default: 'Усі' })} ({productions.length})
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={activeFilter === 'dtsh'}
				class="filter-tab"
				class:filter-tab--active={activeFilter === 'dtsh'}
				onclick={() => (activeFilter = 'dtsh')}
				data-testid="master-productions-tab-dtsh"
			>
				{$t('galaxy.filterDtsh', { default: 'ДТШ (2006–2026)' })} ({dtshCount})
			</button>

			<button
				type="button"
				role="tab"
				aria-selected={activeFilter === 'early'}
				class="filter-tab"
				class:filter-tab--active={activeFilter === 'early'}
				onclick={() => (activeFilter = 'early')}
				data-testid="master-productions-tab-early"
			>
				{$t('galaxy.filterEarly', { default: 'Ранні покази (1992–2015)' })} ({earlyCount})
			</button>

			{#if awardsCount > 0}
				<button
					type="button"
					role="tab"
					aria-selected={activeFilter === 'awards'}
					class="filter-tab"
					class:filter-tab--active={activeFilter === 'awards'}
					onclick={() => (activeFilter = 'awards')}
					data-testid="master-productions-tab-awards"
				>
					<Trophy size={14} aria-hidden="true" />
					<span>{$t('galaxy.filterAwards', { default: 'З нагородами' })} ({awardsCount})</span>
				</button>
			{/if}

			{#if videoCount > 0}
				<button
					type="button"
					role="tab"
					aria-selected={activeFilter === 'video'}
					class="filter-tab"
					class:filter-tab--active={activeFilter === 'video'}
					onclick={() => (activeFilter = 'video')}
					data-testid="master-productions-tab-video"
				>
					<Video size={14} aria-hidden="true" />
					<span>{$t('galaxy.filterVideo', { default: 'З відео' })} ({videoCount})</span>
				</button>
			{/if}
		</div>

		<div class="search-wrap">
			<div class="search-icon-box" aria-hidden="true">
				<Search size={16} />
			</div>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Пошук вистави, автора, групи, року чи учасника..."
				class="search-input"
				aria-label="Пошук вистави або учасника"
				data-testid="master-productions-search-input"
			/>
		</div>
	</div>

	{#if filteredProductions.length === 0}
		<div class="empty-card" data-testid="master-productions-empty-card">
			<p>{$t('galaxy.nothingFoundByFilters', { default: 'Нічого не знайдено за фільтрами' })}</p>
		</div>
	{:else}
		<div class="productions-list" data-testid="master-productions-list">
			{#each filteredProductions as prod, idx (prod.title + String(prod.year) + (prod.number ?? idx))}
				<MasterProductionCard {prod} index={idx} {isEn} />
			{/each}
		</div>
	{/if}
</section>

<style>
	.productions-section {
		margin-top: 3rem;
		padding-top: 2.5rem;
		border-top: 1px solid var(--border-main);
	}
	.section-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}
	.section-header__title-wrap {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}
	.section-icon {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border-radius: var(--radius-lg, 16px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		flex-shrink: 0;
	}
	.section-title {
		margin: 0;
		font-size: clamp(1.25rem, 2.2vw, 1.65rem);
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}
	.section-subtitle {
		margin: 0.3rem 0 0;
		font-size: 0.92rem;
		color: var(--text-muted);
	}
	.total-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 0.9rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-title);
	}
	.controls-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
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
		transition: border-color var(--transition-base, 0.2s ease), box-shadow var(--transition-base, 0.2s ease);
	}
	.search-input:focus {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
	}
	.productions-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
		gap: 1.5rem;
	}
	.empty-card {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
		background: var(--bg-card);
		border: 1px dashed var(--border-main);
		border-radius: var(--radius-xl, 20px);
	}
</style>
