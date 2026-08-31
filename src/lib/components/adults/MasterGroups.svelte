<script lang="ts">
	import { t } from 'svelte-i18n';
	import {
		ArrowRight,
		GraduationCap,
		Users,
		Theater,
		Sparkles,
		CalendarRange,
		List,
		LayoutGrid
	} from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { groupProfilePath, type GraduateGroup } from '$lib/data/groups';
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';
	import MasterViewToggle, { type ViewOption } from './MasterViewToggle.svelte';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';
	import { createGalaxyView } from '$lib/services/galaxyViewMode.svelte';

	/**
	 * Навчальні групи майстра курсу.
	 *
	 * Доти сторінка викладача про свої курси не знала нічого: група була
	 * досяжна лише через випускника, тобто «зайди в чиюсь картку і звідти
	 * побачиш назву». Тепер зв'язок читається прямо з `GROUPS` — див.
	 * `getGroupsByMaster`, — і кожна нова група з'являється тут сама.
	 */
	interface Props {
		groups: GraduateGroup[];
		isEn: boolean;
	}

	let { groups, isEn }: Props = $props();

	const lang = $derived(isEn ? ('en' as const) : ('uk' as const));

	/** Роки випуску одним підписом: «2012» або «2009 — 2013». */
	function yearsLabel(years: number[]): string {
		if (years.length === 0) return '';
		const sorted = [...years].sort((a, b) => a - b);
		const first = sorted[0];
		const last = sorted[sorted.length - 1];
		return first === last ? String(first) : `${first} — ${last}`;
	}

	/*
	 * Свій ключ сховища, окремий від переліку груп у галактиці: там та сама
	 * сутність, але інша задача — там шукають СВОЮ групу серед двадцяти
	 * чотирьох, тут читають курси одного майстра. Спільний ключ означав би, що
	 * вибір в одному місці тихо міняє вигляд іншого.
	 */
	const view = createGalaxyView('master_groups_view');

	const VIEW_OPTIONS: ReadonlyArray<ViewOption> = $derived([
		{ value: 'timeline', label: $t('galaxy.viewModes.timeline'), icon: CalendarRange },
		{ value: 'list', label: $t('galaxy.viewModes.list'), icon: List },
		{ value: 'tiles', label: $t('galaxy.viewModes.tiles'), icon: LayoutGrid }
	]);

	/**
	 * Ті самі групи у спільній формі рядка — для хронології та списку.
	 *
	 * Майстер підписом НЕ йде: це його ж сторінка, і його ім'я в кожному рядку
	 * було б єдиним, що там повторюється. Кількість вихованців натомість
	 * з'являється — але числом зі значком, без слова, тому три відмінкові форми
	 * («вихованець / вихованці / вихованців»), через які її немає в картці, тут
	 * не потрібні.
	 */
	const rows = $derived<GalaxyRow[]>(
		groups.map((g) => ({
			key: g.slug,
			href: localizedPath(groupProfilePath(g.slug), lang),
			year: Math.max(...g.graduationYears),
			yearLabel: yearsLabel(g.graduationYears),
			title: isEn ? (g.nameEn ?? g.name) : g.name,
			memberIds: g.memberIds,
			marks: [
				...(g.abbr ? [{ icon: Sparkles, text: g.abbr, tone: 'group' as const }] : []),
				{ icon: Users, text: String(g.memberIds.length) },
				...(g.playIds.length ? [{ icon: Theater, text: String(g.playIds.length) }] : [])
			]
		}))
	);
</script>

<section class="groups-section" data-testid="master-groups-section">
	<div class="section-header">
		<div class="section-icon">
			<GraduationCap size={24} aria-hidden="true" />
		</div>
		<h2 class="section-title" data-testid="master-groups-title">
			{$t('galaxy.groups', { default: 'Навчальні групи' })}
		</h2>

		<div class="section-header__view">
			<MasterViewToggle
				viewMode={view.current}
				onchange={view.set}
				options={VIEW_OPTIONS}
				testIdPrefix="master-groups-view"
			/>
		</div>
	</div>

	{#if view.current !== 'tiles'}
		<!--
			Той самий `testIdPrefix`, що в плитки: `master-groups-list` означає
			перелік груп цього майстра, а не перелік у вигляді плитки. Режим
			показується рівно один, тож збігу в межах сторінки не буває.
		-->
		<GalaxyRows
			{rows}
			grouped={view.current === 'timeline'}
			testIdPrefix="master-groups"
			maxFaces={8}
		/>
	{:else}
	<ul class="groups-list" data-testid="master-groups-list">
		{#each groups as group (group.slug)}
			<li>
				<a
					class="group-card"
					href={localizedPath(groupProfilePath(group.slug), lang)}
					data-testid="master-group-card-{group.slug}"
				>
					<span class="group-card__body">
						<span class="group-card__name">
							{isEn ? (group.nameEn ?? group.name) : group.name}
							{#if group.abbr}
								<span class="group-card__abbr">{group.abbr}</span>
							{/if}
						</span>
						<!--
							Тут лише роки випуску. Кількість вихованців проситься
							поруч, але українською вона вимагає трьох форм
							(«вихованець / вихованці / вихованців»), а наявний
							ключ `galaxy.graduatesCount` — це голий підпис
							«Вихованців» без числа. Три нові ключі заради рядка,
							якого не просили, того не варті.
						-->
						<span class="group-card__meta">
							{$t('galaxy.groupGraduationYears', { default: 'Роки випуску' })}:
							{yearsLabel(group.graduationYears)}
						</span>
						<!--
							Мініатюри складу — той самий рядок, що в переліку груп.
							`linked={false}` обов'язково: картка сама вже посилання,
							а `<a>` в `<a>` валить сторінку (див. `GraduateAvatarRow`).
							Свій `testIdPrefix` — бо таких рядків на сторінці стільки ж,
							скільки груп.
						-->
						<GraduateAvatarRow
							ids={group.memberIds}
							linked={false}
							testIdPrefix="master-group-mates-{group.slug}"
							max={8}
							fitToWidth
						/>
					</span>
					<span class="group-card__arrow" aria-hidden="true">
						<ArrowRight size={18} />
					</span>
				</a>
			</li>
		{/each}
	</ul>
	{/if}
</section>

<style>
	.groups-section {
		margin-top: 3rem;
		padding-top: 2.5rem;
		border-top: 1px solid var(--border-main);
	}
	.section-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	/* Перемикач до правого краю — там, де він стоїть у репертуарі нижче. */
	.section-header__view {
		margin-left: auto;
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
	.groups-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		/* Картки самі перебудовуються в один стовпчик на вузькому — без
		   окремої точки зламу, бо ширина тут залежить від колонки, а не вікна. */
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
		gap: 0.85rem;
	}
	.group-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 100%;
		padding: 1rem 1.15rem;
		border: 1px solid var(--border-main);
		border-radius: var(--radius-lg, 16px);
		background: var(--bg-surface);
		color: inherit;
		text-decoration: none;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}
	.group-card:hover {
		border-color: var(--accent-primary);
		transform: translateY(-2px);
	}
	.group-card__body {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}
	.group-card__name {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-weight: 700;
		color: var(--text-title);
	}
	.group-card__abbr {
		padding: 0.1rem 0.45rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-page);
		border: 1px solid var(--border-main);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.group-card__meta {
		font-size: 0.88rem;
		color: var(--text-muted);
	}
	.group-card__arrow {
		display: grid;
		place-items: center;
		color: var(--text-muted);
		flex-shrink: 0;
		transition: transform var(--transition-base);
	}
	.group-card:hover .group-card__arrow {
		transform: translateX(3px);
		color: var(--accent-primary);
	}
</style>
