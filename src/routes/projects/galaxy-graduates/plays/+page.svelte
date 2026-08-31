<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import {
		ArrowLeft,
		ArrowRight,
		Users,
		Trophy,
		Video,
		Search,
		CalendarRange,
		List,
		LayoutGrid
	} from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { PLAYS, playPath } from '$lib/data/plays';
	import { PLAY_CAST } from '$lib/data/playCast';
	import { playGroupNames } from '$lib/data/groups';
	import MasterViewToggle, { type ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import PlaysScope from '$lib/components/galaxy/PlaysScope.svelte';
	import { groupByYear, type GalaxyRow } from '$lib/components/galaxy/galaxyRow';
	import { createGalaxyView } from '$lib/services/galaxyViewMode.svelte';

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	let query = $state('');

	/**
	 * Скільки людей назвали виставу своєю — з АНКЕТ, а не з групи.
	 *
	 * Правило те саме, що на сторінці вистави й у докблоці `data/plays.ts`:
	 * добуток «учасники групи × вистави групи» дав би більші числа й частину з
	 * них хибних, бо людина могла прийти в групу вже після вистави.
	 */
	const castSize = (id: string) => PLAY_CAST[id]?.length ?? 0;

	const enriched = $derived(
		PLAYS.map((play) => ({
			play,
			cast: castSize(play.id),
			groups: playGroupNames(
				play.id,
				(PLAY_CAST[play.id] ?? []).map((c) => c.graduateId),
				play.theatreGroup,
				isEn
			)
		}))
	);

	/**
	 * Типово показуються лише вистави з ВІДОМИМ СКЛАДОМ — 255 із 733.
	 *
	 * Що саме це означає й чому названо так, а не «вистави випускників», — у
	 * докблоці `PlaysScope`. Тут важливе інше: стан НЕ зберігається між заходами,
	 * на відміну від режиму показу. Це навмисно: «типово ввімкнений» мусить
	 * означати «ввімкнений щоразу», інакше типове значення діяло б один раз у
	 * житті браузера, і сторінка показувала б різне різним людям без причини.
	 */
	let onlyWithCast = $state(true);

	const q = $derived(query.trim().toLowerCase());

	/*
	 * Пошук шукає по ВСІХ 733, тобто сам знімає фільтр.
	 *
	 * Інакше введена назва не знаходилася б у 478 випадках із 733, і сторінка
	 * казала б «нічого не знайдено» про виставу, яка в реєстрі є. Людина, що
	 * набирає назву, вже знає, чого хоче, — обмежувати її нашою обізнаністю про
	 * склад немає підстав.
	 */
	const базові = $derived(!q && onlyWithCast ? enriched.filter((item) => item.cast > 0) : enriched);

	const found = $derived.by(() => {
		if (!q) return базові;
		return базові.filter(
			({ play, groups }) =>
				play.title.toLowerCase().includes(q) ||
				(play.author?.toLowerCase().includes(q) ?? false) ||
				groups.some((g) => g.toLowerCase().includes(q)) ||
				String(play.year).includes(q)
		);
	});

	/**
	 * Роки — заголовками, а не плашкою в кожній картці.
	 *
	 * Вистав 733 за 32 роки, і рівний перелік із них читати нічим: рік у картці
	 * помічає лише той, хто вже вчитався в неї. Той самий висновок уже зроблено
	 * в переліку випускників, де рік теж винесено заголовком групи.
	 *
	 * Групує спільна `groupByYear`: та сама петля стояла тут і в рядках, і
	 * розходження порядку між режимами одної сторінки помітили б не одразу.
	 */
	const byYear = $derived(groupByYear(found, (item) => item.play.year));

	const view = createGalaxyView('galaxy_plays_view');

	const VIEW_OPTIONS: ReadonlyArray<ViewOption> = $derived([
		{ value: 'timeline', label: $t('galaxy.viewModes.timeline'), icon: CalendarRange },
		{ value: 'list', label: $t('galaxy.viewModes.list'), icon: List },
		{ value: 'tiles', label: $t('galaxy.viewModes.tiles'), icon: LayoutGrid }
	]);

	/**
	 * Знайдені вистави у спільній формі рядка — для хронології та списку.
	 *
	 * Рахується з `found`, а не з `PLAYS`: пошук мусить звужувати всі три режими
	 * однаково, інакше «знайдено 4» стояло б над повним переліком.
	 */
	const rows = $derived<GalaxyRow[]>(
		found.map(({ play, cast, groups }) => ({
			key: play.id,
			href: localizedPath(playPath(play.id), currentLang),
			year: play.year,
			title: play.title,
			subtitle: play.author,
			memberIds: (PLAY_CAST[play.id] ?? []).map((c) => c.graduateId),
			/* Через `null` і `filter`, а не розкидами порожніх масивів: тих самих
			   умов чотири, і `...(x ? [y] : [])` учетверте читається гірше, ніж
			   сама умова. Нулі й порожні поля не показуються — вони повідомляли б
			   не про виставу, а про стан наших даних. */
			marks: [
				...groups.map((name) => ({ icon: null, text: name, tone: 'group' as const })),
				cast > 0 ? { icon: Users, text: String(cast) } : null,
				play.awards?.length
					? {
							icon: Trophy,
							text: String(play.awards.length),
							title: play.awards.join('; '),
							tone: 'award' as const
						}
					: null,
				play.videoUrl
					? { icon: Video, href: play.videoUrl, tone: 'video' as const, title: $t('galaxy.watchVideo') }
					: null
			].filter((m) => m !== null)
		}))
	);
</script>

<svelte:head>
	<title>{$t('galaxy.playsTitle')} | {$t('hero.title')}</title>
	<meta name="description" content={$t('galaxy.playsDescription')} />
</svelte:head>

<main class="plays-page" data-testid="galaxy-plays-panel">
	<div class="container">
		<nav class="plays-page__nav clears-logo" aria-label="Breadcrumb">
			<a
				href={localizedPath('/projects/galaxy-graduates/groups/', currentLang)}
				class="nav-link"
				data-testid="galaxy-plays-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.backToGroups')}</span>
			</a>

			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="nav-link nav-link--forward"
				data-testid="galaxy-plays-galaxy-link"
			>
				<span>{$t('galaxy.title')}</span>
				<ArrowRight size={18} aria-hidden="true" />
			</a>
		</nav>

		<header class="plays-header">
			<h1 class="plays-header__title" data-testid="galaxy-plays-title">
				{$t('galaxy.playsTitle')}
			</h1>
			<p class="plays-header__count" data-testid="galaxy-plays-total-count">{PLAYS.length}</p>

			<div class="plays-header__view">
				<MasterViewToggle
					viewMode={view.current}
					onchange={view.set}
					options={VIEW_OPTIONS}
					testIdPrefix="galaxy-plays-view"
				/>
			</div>
		</header>

		<!--
			Пошук є, хоч на сторінці груп його немає, — і це не відступ від
			прикладу, а наслідок числа: груп двадцять, вистав 362. Двадцять
			переглядають очима, 362 — ні.
		-->
		<div class="plays-search">
			<span class="plays-search__icon" aria-hidden="true"><Search size={16} /></span>
			<input
				type="search"
				bind:value={query}
				class="plays-search__input"
				placeholder={$t('galaxy.playsSearch')}
				aria-label={$t('galaxy.playsSearch')}
				data-testid="galaxy-plays-search-input"
			/>
			{#if query.trim()}
				<span class="plays-search__found" data-testid="galaxy-plays-found-count">{found.length}</span>
			{/if}
		</div>

		<!--
			Рядок області показу видно лише коли НЕ шукають: під час пошуку фільтр
			однаково знятий, а скільки знайдено — каже лічильник у самому пошуку.
		-->
		{#if !q}
			<PlaysScope
				shown={found.length}
				total={PLAYS.length}
				{onlyWithCast}
				onchange={(v) => (onlyWithCast = v)}
			/>
		{/if}

		{#if byYear.length === 0}
			<p class="plays-empty" data-testid="galaxy-plays-empty-text">
				{$t('galaxy.playsNothingFound')}
			</p>
		{:else if view.current !== 'tiles'}
			<!--
				Той самий `testIdPrefix`, що в плитки: `galaxy-plays-list` і
				`galaxy-plays-year-section-*` означають перелік і роки на цій
				сторінці, а не в якомусь одному вигляді. Режим показується рівно
				один, тож збігу в межах сторінки не буває.
			-->
			<GalaxyRows {rows} grouped={view.current === 'timeline'} testIdPrefix="galaxy-plays" />
		{:else}
			<div class="plays-years" data-testid="galaxy-plays-list">
				{#each byYear as [year, items] (year)}
					<section class="plays-year" data-testid="galaxy-plays-year-section-{year}">
						<div class="plays-year__head">
							<h2 class="plays-year__title">{year}</h2>
							<span class="plays-year__count">{items.length}</span>
						</div>

						<ul class="plays-grid">
							{#each items as { play, cast, groups } (play.id)}
								<li>
									<a
										class="play-card"
										href={localizedPath(playPath(play.id), currentLang)}
										data-testid="galaxy-plays-card-{play.id}"
									>
										<span class="play-card__title">{play.title}</span>
										{#if play.author}
											<span class="play-card__author">{play.author}</span>
										{/if}

										<span class="play-card__meta">
											{#each groups as group (group)}
												<span class="play-card__badge play-card__badge--group">{group}</span>
											{/each}
											<!--
												Нуль не показується: «0 в анкетах» повідомляв би не про
												виставу, а про те, що анкети ще не заповнені. Вистав без
												жодної згадки 89 — рядок «0» стояв би в кожній четвертій
												картці й не означав нічого.
											-->
											{#if cast > 0}
												<span class="play-card__badge">
													<Users size={12} aria-hidden="true" />
													{cast}
												</span>
											{/if}
											{#if play.awards?.length}
												<span class="play-card__badge play-card__badge--award">
													<Trophy size={12} aria-hidden="true" />
													{play.awards.length}
												</span>
											{/if}
											{#if play.videoUrl}
												<span class="play-card__badge play-card__badge--video">
													<Video size={12} aria-hidden="true" />
												</span>
											{/if}
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</div>
</main>

<style>
	.plays-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
	}
	.plays-page__nav {
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
	.plays-page__nav .nav-link--forward:hover {
		transform: translateX(3px);
	}

	.plays-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}
	/* Перемикач до правого краю — там, де його шукають на сторінці майстра. */
	.plays-header__view {
		margin-left: auto;
	}
	.plays-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.plays-header__count {
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

	.plays-search {
		position: relative;
		display: flex;
		align-items: center;
		max-width: 460px;
		margin-bottom: 2rem;
	}
	.plays-search__icon {
		position: absolute;
		left: 0.85rem;
		display: flex;
		color: var(--text-muted);
		pointer-events: none;
	}
	.plays-search__input {
		width: 100%;
		padding: 0.55rem 3rem 0.55rem 2.5rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		font-size: 0.9rem;
		outline: none;
		transition: border-color var(--transition-base);
	}
	.plays-search__input:focus {
		border-color: var(--accent-primary);
	}
	.plays-search__found {
		position: absolute;
		right: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.plays-years {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.plays-year__head {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding-bottom: 0.4rem;
		margin-bottom: 0.9rem;
		border-bottom: 2px solid var(--border-main);
	}
	.plays-year__title {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 800;
		color: var(--text-title);
		font-variant-numeric: tabular-nums;
	}
	.plays-year__count {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.plays-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
		gap: 0.9rem;
	}
	.play-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		height: 100%;
		padding: 0.9rem 1.05rem;
		border-radius: var(--radius-lg, 16px);
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
	.play-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-main);
	}
	.play-card__title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.3;
	}
	.play-card__author {
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.35;
	}
	.play-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		/* Плашки притиснуті до низу: назви різної довжини, інакше вони стрибали б. */
		margin-top: auto;
		padding-top: 0.5rem;
	}
	.play-card__badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.12rem 0.45rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.74rem;
		font-weight: 600;
	}
	.play-card__badge--group {
		color: #a5b4fc;
		border-color: rgba(99, 102, 241, 0.3);
		background: rgba(99, 102, 241, 0.12);
	}
	.play-card__badge--award {
		color: #fbbf24;
		border-color: rgba(251, 191, 36, 0.3);
		background: rgba(251, 191, 36, 0.1);
	}
	.play-card__badge--video {
		color: #f87171;
		border-color: rgba(248, 113, 113, 0.3);
		background: rgba(248, 113, 113, 0.1);
	}

	.plays-empty {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--text-muted);
		border: 1px dashed var(--border-main);
		border-radius: var(--radius-xl, 20px);
	}
</style>
