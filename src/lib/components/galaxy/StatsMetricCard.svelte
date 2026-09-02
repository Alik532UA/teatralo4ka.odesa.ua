<script lang="ts">
	import { ChevronDown, ChevronUp, ExternalLink, Search, CheckCircle2 } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { getEntityHref, type StatMetric } from '$lib/data/stats';

	interface Props {
		metric: StatMetric;
		categoryId: 'graduates' | 'groups' | 'plays' | 'masters' | 'festivals';
		isEn: boolean;
		currentLang: 'uk' | 'en';
	}

	let { metric, categoryId, isEn, currentLang }: Props = $props();

	let isExpanded = $state(false);
	let searchQuery = $state('');
	let visibleLimit = $state(24);

	function toggleExpanded() {
		isExpanded = !isExpanded;
		if (isExpanded) visibleLimit = 24;
	}

	function loadMore() {
		visibleLimit += 36;
	}

	const statusColor = $derived.by(() => {
		if (metric.percent >= 80) return '#10b981';
		if (metric.percent >= 50) return '#f59e0b';
		return '#f43f5e';
	});

	const filteredMissing = $derived.by(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return metric.missingItems;
		return metric.missingItems.filter(
			(item) =>
				item[1].toLowerCase().includes(q) ||
				(item[2] && item[2].toLowerCase().includes(q)) ||
				item[0].toLowerCase().includes(q)
		);
	});

	const displayedItems = $derived(filteredMissing.slice(0, visibleLimit));
</script>

<div
	class="metric-card"
	class:metric-card--expanded={isExpanded}
	data-testid="stats-metric-card-{metric.id}"
>
	<div class="metric-card__header">
		<div class="metric-card__titles">
			<h3 class="metric-title">{isEn ? metric.labelEn : metric.labelUk}</h3>
			{#if metric.descriptionUk}
				<p class="metric-desc">{isEn ? metric.descriptionEn : metric.descriptionUk}</p>
			{/if}
		</div>
		<div class="metric-card__value">
			<span class="metric-percent" style:color={statusColor}>{metric.percent}%</span>
			<span class="metric-fraction">{metric.completed} / {metric.total}</span>
		</div>
	</div>

	<div class="progress-bar-track" aria-hidden="true">
		<div
			class="progress-bar-fill"
			style:width="{metric.percent}%"
			style:background-color={statusColor}
		></div>
	</div>

	<div class="metric-card__actions">
		{#if metric.missingItems.length > 0}
			<button
				type="button"
				class="toggle-missing-btn"
				onclick={toggleExpanded}
				aria-expanded={isExpanded}
				data-testid="stats-toggle-missing-btn-{metric.id}"
			>
				{#if isExpanded}
					<ChevronUp size={16} aria-hidden="true" />
					<span>{isEn ? 'Hide list' : 'Сховати список'}</span>
				{:else}
					<ChevronDown size={16} aria-hidden="true" />
					<span>
						{isEn
							? `Show missing (${metric.missingItems.length})`
							: `Показати що бракує (${metric.missingItems.length})`}
					</span>
				{/if}
			</button>
		{:else}
			<div class="all-filled-badge">
				<CheckCircle2 size={16} aria-hidden="true" />
				<span>{isEn ? 'All entries complete' : 'Усі записи заповнено'}</span>
			</div>
		{/if}
	</div>

	{#if isExpanded && metric.missingItems.length > 0}
		<div class="missing-items-container">
			{#if metric.missingItems.length > 10}
				<div class="missing-search">
					<Search size={16} aria-hidden="true" class="search-icon" />
					<input
						type="search"
						placeholder={isEn ? 'Search among missing entries...' : 'Пошук серед відсутніх...'}
						bind:value={searchQuery}
						class="search-input"
						data-testid="stats-search-input-{metric.id}"
					/>
				</div>
			{/if}

			<div class="missing-grid">
				{#each displayedItems as [id, title, subtitle] (id)}
					{@const href = getEntityHref(categoryId, id)}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- адреса сутності формується динамічно з getEntityHref -->
					<a
						href={localizedPath(href, currentLang)}
						class="missing-pill"
						title={isEn ? `Open ${title}` : `Відкрити ${title}`}
						data-testid="stats-missing-link-{id}"
					>
						<div class="missing-pill__text">
							<span class="missing-pill__title">{title}</span>
							{#if subtitle}<span class="missing-pill__sub">{subtitle}</span>{/if}
						</div>
						<ExternalLink size={14} aria-hidden="true" class="missing-pill__ext" />
					</a>
				{/each}
			</div>

			{#if filteredMissing.length > visibleLimit}
				<div class="load-more-container">
					<button
						type="button"
						class="load-more-btn"
						onclick={loadMore}
						data-testid="stats-load-more-btn-{metric.id}"
					>
						{isEn
							? `Show more (${filteredMissing.length - visibleLimit} left)`
							: `Показати ще (лишилося ${filteredMissing.length - visibleLimit})`}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.metric-card {
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-xl, 20px);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}
	.metric-card--expanded { border-color: var(--accent-primary); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); }
	.metric-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
	.metric-title { font-size: 1.05rem; font-weight: 700; color: var(--text-title); margin: 0 0 0.3rem; line-height: 1.3; }
	.metric-desc { font-size: 0.82rem; color: var(--text-muted); margin: 0; line-height: 1.4; }
	.metric-card__value { display: flex; flex-direction: column; align-items: flex-end; text-align: right; flex-shrink: 0; }
	.metric-percent { font-size: 1.35rem; font-weight: 800; line-height: 1.1; }
	.metric-fraction { font-size: 0.78rem; color: var(--text-muted); }
	.progress-bar-track { width: 100%; height: 8px; background: var(--bg-surface); border-radius: var(--radius-full, 9999px); overflow: hidden; }
	.progress-bar-fill { height: 100%; border-radius: var(--radius-full, 9999px); transition: width 0.4s ease; }
	.metric-card__actions { display: flex; align-items: center; justify-content: flex-start; }
	.toggle-missing-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-sm, 6px);
		color: var(--text-main);
		padding: 0.4rem 0.85rem;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease;
	}
	.toggle-missing-btn:hover { border-color: var(--accent-primary); color: var(--text-title); }
	.all-filled-badge { display: inline-flex; align-items: center; gap: 0.4rem; color: #10b981; font-size: 0.82rem; font-weight: 600; }
	.missing-items-container { margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border-main); display: flex; flex-direction: column; gap: 0.85rem; }
	.missing-search { position: relative; display: flex; align-items: center; }
	:global(.search-icon) { position: absolute; left: 0.75rem; color: var(--text-muted); pointer-events: none; }
	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.25rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-main);
		font-size: 0.82rem;
		outline: none;
		transition: border-color 0.15s ease;
	}
	.search-input:focus { border-color: var(--accent-primary); }
	.missing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
		gap: 0.4rem;
		max-height: 360px;
		overflow-y: auto;
		padding-right: 0.25rem;
		scrollbar-width: thin;
	}
	.missing-pill {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.45rem 0.75rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-sm, 6px);
		color: var(--text-main);
		text-decoration: none;
		font-size: 0.82rem;
		transition: background 0.15s ease, border-color 0.15s ease;
	}
	.missing-pill:hover { border-color: var(--accent-primary); color: var(--text-title); }
	.missing-pill__text { display: flex; flex-direction: column; overflow: hidden; }
	.missing-pill__title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.missing-pill__sub { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	:global(.missing-pill__ext) { color: var(--text-muted); flex-shrink: 0; margin-left: 0.5rem; transition: color 0.15s ease; }
	.missing-pill:hover :global(.missing-pill__ext) { color: var(--accent-primary); }
	.load-more-container { display: flex; justify-content: center; margin-top: 0.25rem; }
	.load-more-btn {
		background: var(--bg-surface);
		border: 1px dashed var(--border-main);
		border-radius: var(--radius-sm, 6px);
		color: var(--text-title);
		padding: 0.35rem 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.load-more-btn:hover { border: 1px solid var(--accent-primary); color: var(--text-title); }
</style>
