<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import {
		GraduationCap,
		Users,
		Theater,
		Sparkles,
		Globe,
		Copy,
		Check,
		ArrowLeft,
		BarChart3
	} from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import {
		generateTextReport,
		type StatCategory,
		type StatsData,
		type HistoryDailySnapshot
	} from '$lib/data/stats';
	import StatsMetricCard from '$lib/components/galaxy/StatsMetricCard.svelte';
	import StatsTimeline from '$lib/components/galaxy/StatsTimeline.svelte';

	interface Props {
		data: {
			stats: StatsData;
			history: HistoryDailySnapshot[];
		};
	}

	let { data }: Props = $props();
	const stats = $derived(data.stats);
	const history = $derived(data.history || []);

	let selectedHistoryIndex = $state(0);

	$effect(() => {
		if (history.length > 0 && selectedHistoryIndex === 0) {
			selectedHistoryIndex = history.length - 1;
		}
	});

	const isHistorical = $derived(
		history.length > 0 && selectedHistoryIndex < history.length - 1
	);
	const selectedSnapshot = $derived<HistoryDailySnapshot | undefined>(
		history[selectedHistoryIndex]
	);

	const activeOverallPercent = $derived(
		isHistorical && selectedSnapshot ? selectedSnapshot.overallPercent : stats.overallPercent
	);

	function getActiveCategoryPercent(catId: string): number {
		if (isHistorical && selectedSnapshot) {
			return (selectedSnapshot.categoryPercents as Record<string, number>)[catId] ?? 0;
		}
		const cat = stats.categories.find((c) => c.id === catId);
		return cat ? cat.overallPercent : 0;
	}

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	let activeCategory = $state<'graduates' | 'groups' | 'plays' | 'masters' | 'festivals'>('graduates');
	let copiedReport = $state(false);

	const selectedCategory = $derived<StatCategory>(
		stats.categories.find((c) => c.id === activeCategory) || stats.categories[0]
	);

	async function handleCopyReport() {
		const text = generateTextReport(stats);
		try {
			await navigator.clipboard.writeText(text);
			copiedReport = true;
			setTimeout(() => {
				copiedReport = false;
			}, 3000);
		} catch {
			// fallback
		}
	}

	function getMetricStatusColor(percent: number): string {
		if (percent >= 80) return '#10b981';
		if (percent >= 50) return '#f59e0b';
		return '#f43f5e';
	}

	function getCategoryIcon(id: string) {
		switch (id) {
			case 'graduates':
				return GraduationCap;
			case 'groups':
				return Users;
			case 'plays':
				return Theater;
			case 'masters':
				return Sparkles;
			case 'festivals':
				return Globe;
			default:
				return BarChart3;
		}
	}
</script>

<svelte:head>
	<title>{isEn ? 'Archival Completeness Statistics' : 'Статистика наповнення архіву'} | {$t('hero.title')}</title>
</svelte:head>

<main class="stats-page" data-testid="stats-section">
	<div class="container">
		<nav class="stats-page__nav clears-logo" aria-label="Breadcrumb">
			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="nav-back-link"
				data-testid="stats-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.title', { default: 'Сузір’я випускників' })}</span>
			</a>
		</nav>

		<header class="stats-header">
			<div class="stats-header__meta">
				<span class="stats-badge">
					<BarChart3 size={16} aria-hidden="true" />
					<span>{isEn ? 'Completeness Audit' : 'Аудит наповнення бази'}</span>
				</span>
				<h1 class="stats-title">
					{isEn ? 'Archive Completeness Statistics' : 'Статистика наповнення архіву'}
				</h1>
				<p class="stats-subtitle">
					{isEn
						? 'A live dashboard showing which historical records are verified and what details still need memories, photos, or documents.'
						: 'Жива панель моніторингу даних: які історичні матеріали вже підтверджено, а де ще потрібні фотографії, спогади чи архівні списки.'}
				</p>
			</div>

			<div class="stats-overview">
				<div class="stats-score-card">
					<div class="stats-score-circle" style:--pct="{activeOverallPercent}%">
						<span class="stats-score-val">{activeOverallPercent}%</span>
					</div>
					<div class="stats-score-info">
						<span class="stats-score-label">{isEn ? 'Overall Archive Score' : 'Загальний індекс бази'}</span>
						<span class="stats-score-sub">{isEn ? 'across all 5 sections' : 'по 5 розділах проєкту'}</span>
					</div>
				</div>

				<button
					type="button"
					class="copy-report-btn"
					class:copy-report-btn--success={copiedReport}
					onclick={handleCopyReport}
					aria-label={isEn ? 'Copy text summary' : 'Скопіювати текстовий звіт'}
					data-testid="stats-copy-btn"
				>
					{#if copiedReport}
						<Check size={18} aria-hidden="true" />
						<span>{isEn ? 'Report Copied!' : 'Звіт скопійовано!'}</span>
					{:else}
						<Copy size={18} aria-hidden="true" />
						<span>{isEn ? 'Copy Text Summary' : 'Скопіювати звіт'}</span>
					{/if}
				</button>
			</div>
		</header>

		{#if history.length > 0}
			<StatsTimeline
				snapshots={history}
				bind:selectedIndex={selectedHistoryIndex}
				{currentLang}
			/>
		{/if}

		<div class="stats-tabs" role="tablist" aria-label={isEn ? 'Category tabs' : 'Вкладки категорій'} data-testid="stats-tabs">
			{#each stats.categories as category (category.id)}
				{@const IconComponent = getCategoryIcon(category.id)}
				{@const isActive = activeCategory === category.id}
				{@const catPercent = getActiveCategoryPercent(category.id)}
				<button
					type="button"
					role="tab"
					aria-selected={isActive}
					aria-controls="panel-{category.id}"
					id="tab-{category.id}"
					class="tab-btn"
					class:tab-btn--active={isActive}
					onclick={() => (activeCategory = category.id)}
					data-testid="stats-tab-{category.id}"
				>
					<IconComponent size={18} aria-hidden="true" />
					<span class="tab-btn__title">{isEn ? category.titleEn : category.titleUk}</span>
					<span
						class="tab-btn__badge"
						style:background-color={getMetricStatusColor(catPercent)}
					>
						{catPercent}%
					</span>
				</button>
			{/each}
		</div>

		<div
			id="panel-{selectedCategory.id}"
			role="tabpanel"
			aria-labelledby="tab-{selectedCategory.id}"
			class="stats-panel"
			data-testid="stats-panel-{selectedCategory.id}"
		>
			<div class="stats-panel__summary">
				<div class="summary-info">
					<h2 class="summary-title">{isEn ? selectedCategory.titleEn : selectedCategory.titleUk}</h2>
					<p class="summary-text">
						{isEn ? 'Total recorded in database: ' : 'Усього зареєстровано в базі: '}
						<strong>{selectedCategory.totalEntities}</strong>
					</p>
				</div>
				<div class="summary-meter">
					<span class="summary-meter-label">{isEn ? 'Average Completeness' : 'Середня повнота'}:</span>
					<span
						class="summary-meter-badge"
						style:color={getMetricStatusColor(getActiveCategoryPercent(selectedCategory.id))}
					>
						{getActiveCategoryPercent(selectedCategory.id)}%
					</span>
				</div>
			</div>

			<div class="metrics-grid">
				{#each selectedCategory.metrics as metric (metric.id)}
					<StatsMetricCard
						{metric}
						categoryId={selectedCategory.id}
						{isEn}
						{currentLang}
						{isHistorical}
						historicalCompleted={selectedSnapshot?.metrics[metric.id]?.completed}
						historicalTotal={selectedSnapshot?.metrics[metric.id]?.total}
						historicalPercent={selectedSnapshot?.metrics[metric.id]?.percent}
					/>
				{/each}
			</div>
		</div>
	</div>
</main>

<style>
	.stats-page { padding: 2rem 0 5rem; min-height: 80dvh; }
	.container { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; }
	.stats-page__nav { margin-bottom: 2rem; display: flex; align-items: center; }
	.nav-back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.15s ease; }
	.nav-back-link:hover { color: var(--accent-primary); }
	.stats-header { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2.5rem; }
	@media (min-width: 860px) {
		.stats-header { flex-direction: row; justify-content: space-between; align-items: flex-end; }
	}
	.stats-badge {
		display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; border-radius: var(--radius-full, 9999px);
		background: rgba(96, 165, 250, 0.1); color: var(--accent-primary); font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.75rem;
	}
	.stats-title { font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 800; color: var(--text-title); line-height: 1.2; margin: 0 0 0.5rem; }
	.stats-subtitle { font-size: 1rem; color: var(--text-muted); max-width: 600px; line-height: 1.5; margin: 0; }
	.stats-overview { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
	.stats-score-card { display: flex; align-items: center; gap: 0.85rem; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: var(--radius-xl, 20px); padding: 0.75rem 1.25rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
	.stats-score-circle {
		--pct: 0%; width: 48px; height: 48px; border-radius: 50%;
		background: conic-gradient(var(--accent-primary) var(--pct), rgba(255, 255, 255, 0.1) 0);
		display: flex; align-items: center; justify-content: center; position: relative;
	}
	.stats-score-circle::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: var(--bg-card); }
	.stats-score-val { position: relative; z-index: 1; font-size: 0.88rem; font-weight: 700; color: var(--text-title); }
	.stats-score-info { display: flex; flex-direction: column; }
	.stats-score-label { font-size: 0.9rem; font-weight: 600; color: var(--text-title); }
	.stats-score-sub { font-size: 0.75rem; color: var(--text-muted); }
	.copy-report-btn {
		display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.2rem; border-radius: var(--radius-md, 8px);
		background: var(--accent-primary); color: var(--text-on-accent); border: none; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
	}
	.copy-report-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
	.copy-report-btn--success { background: #047857; color: #ffffff; box-shadow: 0 2px 8px rgba(4, 120, 87, 0.3); }
	.stats-tabs { display: flex; overflow-x: auto; gap: 0.5rem; padding-bottom: 0.75rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-main); scrollbar-width: thin; }
	.tab-btn {
		display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1.25rem; border-radius: var(--radius-md, 8px);
		background: transparent; color: var(--text-muted); border: 1px solid transparent; font-size: 0.95rem; font-weight: 600; white-space: nowrap; cursor: pointer; transition: all 0.18s ease;
	}
	.tab-btn:hover { background: var(--bg-surface); color: var(--text-title); }
	.tab-btn--active { background: var(--bg-card); color: var(--text-title); border-color: var(--border-main); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
	.tab-btn__badge { padding: 0.15rem 0.45rem; border-radius: var(--radius-full, 9999px); color: #ffffff; font-size: 0.75rem; font-weight: 700; line-height: 1; }
	.stats-panel__summary {
		display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.75rem; padding: 1.25rem 1.5rem;
		background: var(--bg-surface); border-radius: var(--radius-lg, 12px); border: 1px solid var(--border-main);
	}
	@media (min-width: 640px) {
		.stats-panel__summary { flex-direction: row; justify-content: space-between; align-items: center; }
	}
	.summary-title { font-size: 1.35rem; font-weight: 700; color: var(--text-title); margin: 0 0 0.25rem; }
	.summary-text { font-size: 0.9rem; color: var(--text-muted); margin: 0; }
	.summary-meter { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
	.summary-meter-label { color: var(--text-muted); }
	.summary-meter-badge { font-size: 1.2rem; font-weight: 800; }
	.metrics-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
	@media (min-width: 900px) {
		.metrics-grid { grid-template-columns: repeat(2, 1fr); }
	}
</style>
