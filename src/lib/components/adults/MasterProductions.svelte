<script lang="ts">
	import { t } from 'svelte-i18n';
	import { LayoutGrid, List, CalendarRange, Theater } from 'lucide-svelte';
	import type { Play } from '$lib/data/plays';
	import { earlyShows } from '$lib/services/earlyShows.svelte';
	import {
		productionsViewMode,
		isProductionView
	} from '$lib/services/productionsViewMode.svelte';
	import MasterProductionCard from './MasterProductionCard.svelte';
	import MasterProductionsFilters, { type FilterType } from './MasterProductionsFilters.svelte';
	import MasterProductionsList from './MasterProductionsList.svelte';
	import MasterProductionsTimeline from './MasterProductionsTimeline.svelte';
	import MasterViewToggle, { type ViewOption } from './MasterViewToggle.svelte';

	interface Props {
		productions: Play[];
		isEn?: boolean;
	}

	let { productions = [], isEn = false }: Props = $props();

	let activeFilter = $state<FilterType>('all');
	let searchQuery = $state('');

	/**
	 * «Ранні покази» типово сховані — і з переліку, і з фільтрів, і з лічильників.
	 *
	 * Ховаються, а не видаляються: дані лишаються в профілі, а серія `J`
	 * повертає їх на екран. Чому саме так — у `services/earlyShows`.
	 *
	 * Далі по файлу рахується САМЕ цей список, а не весь: інакше «Усі (80)»
	 * обіцяло б вісімдесят, а показувало сімдесят дві.
	 */
	const visibleProductions = $derived(
		earlyShows.visible ? productions : productions.filter((p) => p.isDtsh !== false)
	);

	/* Фільтр «Ранні покази» зникає разом із ними — інакше він лишався б обраним
	   і сторінка показувала б порожньо. */
	$effect(() => {
		if (!earlyShows.visible && activeFilter === 'early') activeFilter = 'all';
	});

	const filteredProductions = $derived(
		visibleProductions.filter((p) => {
			if (activeFilter === 'dtsh' && p.isDtsh === false) return false;
			if (activeFilter === 'early' && p.isDtsh !== false) return false;
			if (activeFilter === 'awards' && (!p.awards || p.awards.length === 0)) return false;
			if (activeFilter === 'video' && !p.videoUrl) return false;

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const inTitle = p.title.toLowerCase().includes(q);
				const inAuthor = p.author?.toLowerCase().includes(q) ?? false;
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

	const awardsCount = $derived(visibleProductions.filter((p) => p.awards && p.awards.length > 0).length);
	const videoCount = $derived(visibleProductions.filter((p) => p.videoUrl).length);
	const dtshCount = $derived(visibleProductions.filter((p) => p.isDtsh !== false).length);
	const earlyCount = $derived(productions.filter((p) => p.isDtsh === false).length);

	/**
	 * Три режими показу. Перемикач той самий, що в переліку викладачів, тож
	 * набір приходить звідси — див. докблок `productionsViewMode`, чому саме ці
	 * три й чому типова лишається плитка.
	 */
	const VIEW_OPTIONS: ReadonlyArray<ViewOption> = $derived([
		{ value: 'tiles', label: $t('galaxy.viewModes.tiles', { default: 'Плитка' }), icon: LayoutGrid },
		{ value: 'list', label: $t('galaxy.viewModes.list', { default: 'Список' }), icon: List },
		{
			value: 'timeline',
			label: $t('galaxy.viewModes.timeline', { default: 'Хронологія' }),
			icon: CalendarRange
		}
	]);

	const view = $derived(productionsViewMode.current);

	/* Перемикач віддає рядок — звужує той, хто знає свій набір. */
	function chooseView(mode: string) {
		if (isProductionView(mode)) productionsViewMode.set(mode);
	}
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
			<Theater size={16} aria-hidden="true" />
			<span>
				{$t('galaxy.productionsCount', {
					values: { count: visibleProductions.length },
					default: `${visibleProductions.length} вистав та показів`
				})}
			</span>
		</span>
	</div>

	<div class="section-controls">
		<div class="section-controls__filters">
			<MasterProductionsFilters
				{activeFilter}
				{searchQuery}
				counts={{
					all: visibleProductions.length,
					dtsh: dtshCount,
					early: earlyCount,
					awards: awardsCount,
					video: videoCount
				}}
				onfilter={(f) => (activeFilter = f)}
				onsearch={(q) => (searchQuery = q)}
			/>
		</div>
		<MasterViewToggle
			viewMode={view}
			onchange={chooseView}
			options={VIEW_OPTIONS}
			testIdPrefix="master-productions-view"
		/>
	</div>

	{#if filteredProductions.length === 0}
		<div class="empty-card" data-testid="master-productions-empty-card">
			<p>{$t('galaxy.nothingFoundByFilters', { default: 'Нічого не знайдено за фільтрами' })}</p>
		</div>
	{:else}
		<!--
			Три режими, і показується РІВНО один: `{#if}`, а не приховування
			стилями. Інакше сторінка малювала б усі три щоразу — при вісімдесяти
			виставах це втричі більше вузлів і втричі довша гідрація заради того,
			чого не видно.
		-->
		{#if view === 'list'}
			<MasterProductionsList productions={filteredProductions} />
		{:else if view === 'timeline'}
			<MasterProductionsTimeline productions={filteredProductions} />
		{:else}
			<div class="productions-list" data-testid="master-productions-list">
				{#each filteredProductions as prod, idx (prod.title + String(prod.year) + (prod.number ?? idx))}
					<MasterProductionCard {prod} index={idx} {isEn} />
				{/each}
			</div>
		{/if}
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
	/*
	 * Фільтри й перемикач стоять в одному ряду, поки вміщаються.
	 *
	 * Перемикач не стискається (`flex-shrink: 0` у ньому самому), тож при
	 * нестачі місця вниз іде саме панель фільтрів — вона переносна за
	 * побудовою, а перемикач із трьох кнопок обрізався б.
	 */
	.section-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.section-controls__filters {
		flex: 1 1 auto;
		min-width: 0;
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
