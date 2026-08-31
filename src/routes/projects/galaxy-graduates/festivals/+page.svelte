<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import {
		ArrowLeft,
		ArrowRight,
		Users,
		Calendar,
		Theater,
		CalendarRange,
		List,
		LayoutGrid
	} from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { FESTIVALS, festivalPath, latestYear } from '$lib/data/festivals';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';
	import MasterViewToggle, { type ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';
	import { createGalaxyView } from '$lib/services/galaxyViewMode.svelte';

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/**
	 * Найновіші згори — так само, як у переліку груп: людина шукає свою поїздку,
	 * а не найдавнішу.
	 */
	const ordered = $derived(
		[...FESTIVALS].sort(
			(a, b) => latestYear(b) - latestYear(a) || a.name.localeCompare(b.name, 'uk')
		)
	);

	/** «2012, 2013» — роки списком, бо на фестиваль їздять не раз. */
	const yearsOf = (years: number[]) => [...years].sort((x, y) => x - y).join(', ');

	const view = createGalaxyView('galaxy_festivals_view');

	const VIEW_OPTIONS: ReadonlyArray<ViewOption> = $derived([
		{ value: 'timeline', label: $t('galaxy.viewModes.timeline'), icon: CalendarRange },
		{ value: 'list', label: $t('galaxy.viewModes.list'), icon: List },
		{ value: 'tiles', label: $t('galaxy.viewModes.tiles'), icon: LayoutGrid }
	]);

	/**
	 * Ті самі фестивалі у спільній формі рядка — для хронології та списку.
	 *
	 * Країни тут ТЕКСТОМ, а не прапорами: у плитці прапор стоїть біля своєї
	 * назви й читається, а в рядку між назвою фестивалю й обличчями учасників
	 * три прапорці поспіль перетворюються на смужку кольорів без підпису. Назва
	 * країни коштує кілька символів і не потребує здогадок.
	 */
	const rows = $derived<GalaxyRow[]>(
		ordered.map((f) => ({
			key: f.slug,
			href: localizedPath(festivalPath(f.slug), currentLang),
			year: latestYear(f),
			yearLabel: yearsOf(f.years),
			title: isEn && f.nameEn ? f.nameEn : f.name,
			subtitle: [f.city, ...f.countries.map((c) => $t(`galaxy.country.${c}`))]
				.filter(Boolean)
				.join(' · '),
			memberIds: f.memberIds,
			marks: [
				...(f.memberIds.length ? [{ icon: Users, text: String(f.memberIds.length) }] : []),
				...(f.playIds.length ? [{ icon: Theater, text: String(f.playIds.length) }] : [])
			]
		}))
	);
</script>

<svelte:head>
	<title>{$t('galaxy.festivalsTitle')} | {$t('hero.title')}</title>
	<meta name="description" content={$t('galaxy.festivalsDescription')} />
</svelte:head>

<main class="festivals-page" data-testid="graduate-festivals-panel">
	<div class="container">
		<nav class="festivals-page__nav clears-logo" aria-label="Breadcrumb">
			<a
				href={localizedPath('/projects/galaxy-graduates/groups/', currentLang)}
				class="nav-link"
				data-testid="galaxy-festivals-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.backToGroups')}</span>
			</a>

			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="nav-link nav-link--forward"
				data-testid="galaxy-festivals-galaxy-link"
			>
				<span>{$t('galaxy.title')}</span>
				<ArrowRight size={18} aria-hidden="true" />
			</a>
		</nav>

		<header class="festivals-header">
			<h1 class="festivals-header__title" data-testid="galaxy-festivals-title">
				{$t('galaxy.festivalsTitle')}
			</h1>
			<p class="festivals-header__count">{ordered.length}</p>

			<div class="festivals-header__view">
				<MasterViewToggle
					viewMode={view.current}
					onchange={view.set}
					options={VIEW_OPTIONS}
					testIdPrefix="galaxy-festivals-view"
				/>
			</div>
		</header>

		{#if view.current !== 'tiles'}
			<!--
				Той самий `testIdPrefix`, що в плитки, — навмисно: `galaxy-festivals-list`
				означає «перелік фестивалів на цій сторінці», а не «перелік у вигляді
				плитки». Режим показується РІВНО один, тож збігу в межах сторінки не
				буває, а перевірки не мусять знати, який вигляд обрав читач.
			-->
			<GalaxyRows
				{rows}
				grouped={view.current === 'timeline'}
				testIdPrefix="galaxy-festivals"
				maxFaces={10}
			/>
		{:else}
		<ul class="festivals-grid" data-testid="galaxy-festivals-list">
			{#each ordered as festival (festival.slug)}
				<li>
					<a
						class="fest-card"
						href={localizedPath(festivalPath(festival.slug), currentLang)}
						data-testid="galaxy-festival-card-{festival.slug}"
					>
						<span class="fest-card__head">
							<span class="fest-card__name">
								{isEn && festival.nameEn ? festival.nameEn : festival.name}
							</span>
						</span>

						<!--
							Прапор стоїть біля СВОЄЇ назви, а не купкою попереду: при трьох
							країнах читач інакше мусить здогадуватися, котрий до котрої.
						-->
						<span class="fest-card__where">
							{#if festival.city}{festival.city},{/if}
							{#each festival.countries as code, i (code)}
								{#if i > 0}<span class="fest-card__sep" aria-hidden="true">·</span>{/if}
								<span class="fest-card__pair">
									<CountryFlag {code} />
									{$t(`galaxy.country.${code}`)}
								</span>
							{/each}
						</span>

						<span class="fest-card__meta">
							<span class="fest-card__badge">
								<Calendar size={13} aria-hidden="true" />
								{yearsOf(festival.years)}
							</span>
							<!--
								Значків «0» немає навмисно: склад і показ вносять поступово, і
								нуль повідомляв би не про фестиваль, а про стан наших даних.
							-->
							{#if festival.memberIds.length > 0}
								<span class="fest-card__badge">
									<Users size={13} aria-hidden="true" />
									{festival.memberIds.length}
								</span>
							{/if}
							{#if festival.playIds.length > 0}
								<span class="fest-card__badge">
									<Theater size={13} aria-hidden="true" />
									{festival.playIds.length}
								</span>
							{/if}
						</span>

						<!--
							Мініатюри учасників — той самий рядок, що в переліку груп.
							`linked={false}`: картка фестивалю сама вже посилання, а
							`<a>` в `<a>` валить сторінку (див. `GraduateAvatarRow`).
							Свій `testIdPrefix` зі слагом фестивалю — таких рядків на
							сторінці стільки ж, скільки фестивалів.
						-->
						<GraduateAvatarRow
							ids={festival.memberIds}
							linked={false}
							testIdPrefix="galaxy-festival-members-{festival.slug}"
							max={20}
							fitToWidth
						/>
					</a>
				</li>
			{/each}
		</ul>
		{/if}
	</div>
</main>

<style>
	.festivals-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
	}

	.festivals-page__nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-main);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}
	.nav-link:hover {
		border-color: var(--accent-primary);
		transform: translateX(-3px);
	}
	/* Складений добір: сам модифікатор має ту саму вагу, що й правило вище. */
	.festivals-page__nav .nav-link--forward:hover {
		transform: translateX(3px);
	}

	.festivals-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	/* Перемикач до правого краю — там, де його шукають на сторінці майстра. */
	.festivals-header__view {
		margin-left: auto;
	}
	.festivals-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.festivals-header__count {
		margin: 0;
		display: grid;
		place-items: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.5rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.festivals-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
		gap: 1rem;
	}

	.fest-card {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		height: 100%;
		padding: 1.1rem 1.25rem;
		border-radius: var(--radius-xl, 20px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: var(--shadow-sm);
		color: inherit;
		text-decoration: none;
		transition:
			transform var(--transition-base),
			border-color var(--transition-base),
			box-shadow var(--transition-base);
	}
	.fest-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-main);
	}
	.fest-card__head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.fest-card__name {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}
	.fest-card__pair {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.fest-card__sep {
		opacity: 0.5;
	}
	.fest-card__where {
		font-size: 0.86rem;
		color: var(--text-muted);
		line-height: 1.4;
	}
	.fest-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: auto;
		padding-top: 0.5rem;
	}
	.fest-card__badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 600;
	}
</style>
