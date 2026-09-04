<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import {
		Users,
		Trophy,
		Video,
		CalendarRange,
		List,
		LayoutGrid
	} from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { PLAYS, playPath, type Play } from '$lib/data/plays';
	import { PLAY_CAST } from '$lib/data/playCast';
	import { playGroupNames } from '$lib/data/groups';
	import MasterViewToggle, { type ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import GalaxyAddCard from '$lib/components/galaxy/GalaxyAddCard.svelte';
	import SearchField from '$lib/components/SearchField.svelte';
	import GraduateCardOnPage from '$lib/components/GraduateCardOnPage.svelte';
	import GalaxyScope from '$lib/components/galaxy/GalaxyScope.svelte';
	import GalaxyPlaysTiles from '$lib/components/galaxy/GalaxyPlaysTiles.svelte';
	import { groupByYear, type GalaxyRow } from '$lib/components/galaxy/galaxyRow';
	import { createGalaxyView } from '$lib/services/galaxyViewMode.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';

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

	/** Перше посилання на запис — власне або першої з частин. Порожньо: записів немає. */
	const запис = (play: Play) => play.videoUrl ?? play.videoParts?.[0]?.url;

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
	 * Пошук шукає по ВСІХ записах, тобто сам знімає фільтр.
	 *
	 * Інакше введена назва не знаходилася б у 478 випадках із 730, і сторінка
	 * казала б «нічого не знайдено» про виставу, яка в реєстрі є. Людина, що
	 * набирає назву, вже знає, чого хоче, — обмежувати її нашою обізнаністю про
	 * склад немає підстав.
	 */
	const пошуком = $derived.by(() => {
		if (!q) return enriched;
		return enriched.filter(
			({ play, groups }) =>
				play.title.toLowerCase().includes(q) ||
				(play.author?.toLowerCase().includes(q) ?? false) ||
				groups.some((g) => g.toLowerCase().includes(q)) ||
				String(play.year).includes(q)
		);
	});

	/** Вистави курсів — усе, що не щорічний захід школи. */
	const курсові = $derived(enriched.filter(({ play }) => !play.kind));

	/*
	 * Область показу звужує ЛИШЕ вистави курсів, а заходи — ніколи.
	 *
	 * Причина в числах, і вона та сама, через яку фільтр узагалі з'явився:
	 * курсових вистав 691, і перелік із них читати нічим, доки не лишити ті, про
	 * склад яких ми щось знаємо. Посвят 19, новорічних 22 — це переглядають
	 * очима цілком. А головне: у заготовок складу ще НЕМА за визначенням, тож
	 * фільтр «тільки з відомим складом» приховав би обидва розділи повністю —
	 * тобто сторінка мовчала б саме про те, що на ній щойно з'явилося.
	 */
	const found = $derived(
		!q && onlyWithCast ? пошуком.filter(({ play, cast }) => Boolean(play.kind) || cast > 0) : пошуком
	);

	const view = createGalaxyView('galaxy_plays_view');

	const VIEW_OPTIONS: ReadonlyArray<ViewOption> = $derived([
		{ value: 'timeline', label: $t('galaxy.viewModes.timeline'), icon: CalendarRange },
		{ value: 'list', label: $t('galaxy.viewModes.list'), icon: List },
		{ value: 'tiles', label: $t('galaxy.viewModes.tiles'), icon: LayoutGrid }
	]);

	/**
	 * Вистави у спільній формі рядка — для хронології та списку.
	 *
	 * Функція, а не одне похідне: розділів три, і кожен малює свої рядки. Одне
	 * спільне `rows` означало б, що «Посвята» й «Новий рік» показують той самий
	 * перелік, що й вистави курсів.
	 */
	const rowsOf = (items: typeof enriched): GalaxyRow[] =>
		items.map(({ play, cast, groups }) => ({
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
				/* `videoParts` теж вважається записом: у «Підкови на щастя» й «Greatest
				   Show» ЖОДНОГО `videoUrl` немає — там кілька вечорів, і жоден не
				   головніший за інший. Без цього рядка картка таких показів мовчала б
				   про те, що запис узагалі є. */
				запис(play)
					? { icon: Video, href: запис(play), tone: 'video' as const, title: $t('galaxy.watchVideo') }
					: null
			].filter((m) => m !== null)
		}));

	/**
	 * ТРИ РОЗДІЛИ, а не один перелік.
	 *
	 * Прохання автора: «треба окремі розділи "Посвята в Мистецтво" та окремий
	 * розділ "Новий рік"». Причина не в оформленні, а в тому, чиї це події:
	 * Посвяту для учнів готують випускники різних років і груп, новорічний показ
	 * — курс, який цього року випускається, а решта вистав належить репертуару
	 * свого курсу. Три різні відповіді на питання «хто це поставив» — три
	 * розділи; повний розбір у докблоці `PlayKind`.
	 *
	 * `kind` у дескрипторі, а не лише `testId`: за ним область показу знаходить
	 * свій розділ, і саме він робить умову в розмітці читабельною.
	 */
	const РОЗДІЛИ = $derived(
		(
			[
				[null, 'galaxy-plays', 'playsSectionPlays'],
				['posviata', 'galaxy-posviata', 'playsSectionPosviata'],
				['new-year', 'galaxy-new-year', 'playsSectionNewYear']
			] as const
		).map(([kind, testId, ключ]) => {
			const items = found.filter(({ play }) => (play.kind ?? null) === kind);
			return {
				kind,
				testId,
				heading: $t(`galaxy.${ключ}`),
				hint: $t(`galaxy.${ключ}Hint`),
				items,
				rows: rowsOf(items),
				/*
				 * Роки — заголовками, а не плашкою в кожній картці: рік у картці
				 * помічає лише той, хто вже вчитався в неї. Той самий висновок уже
				 * зроблено в переліку випускників.
				 *
				 * Групує спільна `groupByYear` — та сама петля стояла і тут, і в
				 * рядках, і розходження порядку між режимами однієї сторінки
				 * помітили б не одразу.
				 */
				byYear: groupByYear(items, (item) => item.play.year)
			};
		})
	);
</script>

<svelte:head>
	<title>{$t('galaxy.playsTitle')} | {$t('hero.title')}</title>
</svelte:head>

<main class="plays-page" data-testid="galaxy-plays-panel">
	<div class="container">
				<GalaxyBreadcrumb
			backHref={localizedPath('/projects/galaxy-graduates/groups/', currentLang)}
			backLabel={$t('galaxy.backToGroups')}
			backTestId="galaxy-plays-back-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="galaxy-plays-galaxy-link"
		/>

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
		<div class="plays-search-row">
			<SearchField
				value={query}
				onchange={(v) => (query = v)}
				found={found.length}
				placeholderKey="galaxy.playsSearch"
				nothingKey="galaxy.playsNothingFound"
				testid="galaxy-plays-search"
			/>
		</div>

		<!--
			Звернення СТОЇТЬ НАД переліком в обох режимах, а не всередині сітки, як
			у групах. Причина в даних: плитки вистав розкладені по РОКАХ, і картка
			всередині сітки належала б якомусь одному року — тобто прохання додати
			показ 2015-го читалося б як прохання додати саме до 2015-го. Це
			звернення про весь архів.

			Над порожнім результатом пошуку його теж видно: людина, яка нічого не
			знайшла, — саме та, кому є що додати.
		-->
		<GalaxyAddCard
			title={$t('galaxy.addPlay')}
			hint={$t('galaxy.addPlayHint')}
			testIdPrefix="galaxy-play-add"
			variant="row"
		/>

		{#if found.length === 0}
			<p class="plays-empty" data-testid="galaxy-plays-empty-text">
				{$t('galaxy.playsNothingFound')}
			</p>
		{:else}
			{#each РОЗДІЛИ as розділ (розділ.testId)}
				{#if розділ.items.length > 0}
					<section class="plays-block" data-testid="{розділ.testId}-section">
						<div class="plays-block__head">
							<h2 class="plays-block__title">{розділ.heading}</h2>
							<span class="plays-block__count" data-testid="{розділ.testId}-count">
								{розділ.items.length}
							</span>
						</div>
						<p class="plays-block__hint">{розділ.hint}</p>

						<!--
							Рядок області показу — ВСЕРЕДИНІ розділу вистав курсів, бо
							звужує він тільки його. Доти він стояв над усім переліком, і
							після поділу читався б як твердження про всі три розділи:
							«показано 255 з 730» над розділом, у якому 19 записів.

							Видно лише коли НЕ шукають: під час пошуку фільтр однаково
							знятий, а скільки знайдено — каже лічильник у самому пошуку.
						-->
						{#if розділ.kind === null && !q}
							<GalaxyScope
								count={onlyWithCast
									? $t('galaxy.playsScopeShown', {
											values: { shown: розділ.items.length, total: курсові.length }
										})
									: $t('galaxy.playsScopeAll', { values: { total: курсові.length } })}
								action={onlyWithCast
									? $t('galaxy.playsScopeShowAll')
									: $t('galaxy.playsScopeOnlyCast')}
								hint={$t('galaxy.playsScopeHint')}
								icon={onlyWithCast ? null : Users}
								onclick={() => (onlyWithCast = !onlyWithCast)}
								testIdPrefix="galaxy-plays-scope"
							/>
						{/if}

						<!--
							Той самий `testIdPrefix` у рядках і в плитках: він означає
							РОЗДІЛ, а не вигляд. Режим показується рівно один, тож збігу в
							межах сторінки не буває.
						-->
						{#if view.current !== 'tiles'}
							<GalaxyRows
								rows={розділ.rows}
								grouped={view.current === 'timeline'}
								testIdPrefix={розділ.testId}
							/>
						{:else}
							<GalaxyPlaysTiles byYear={розділ.byYear} testIdPrefix={розділ.testId} />
						{/if}
					</section>
				{/if}
			{/each}
		{/if}
	</div>
</main>

<!--
	Обличчя в рядках відкривають картку ТУТ, а не ведуть у галактику: інакше
	читач, який натиснув склад вистав, лишався б потім у галактиці й шукав цю
	сторінку заново. Чому саме так — у докблоці `GraduateCardOnPage`.
-->
<GraduateCardOnPage />

<style>
	.plays-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
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


	.plays-search-row {
		margin-bottom: 2rem;
		max-width: 460px;
	}

	/*
	 * Розділ — не рік, і оформлення це показує.
	 *
	 * Заголовок року всередині розділу лишається таким, як був (`GalaxyPlaysTiles`),
	 * а заголовок розділу мусить читатися вище за нього — інакше «Посвята в
	 * Мистецтво» і «2013» виглядали б одним рівнем, і поділ, заради якого все це
	 * робилося, не було б видно.
	 */
	.plays-block {
		margin-bottom: 3rem;
	}
	.plays-block__head {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}
	.plays-block__title {
		margin: 0;
		font-size: clamp(1.3rem, 2.6vw, 1.75rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.plays-block__count {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
	/* Пояснення розділу — не окраса: саме воно каже, чиї це вистави. */
	.plays-block__hint {
		margin: 0.35rem 0 1.25rem;
		max-width: 62ch;
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--text-muted);
	}

	.plays-empty {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--text-muted);
		border: 1px dashed var(--border-main);
		border-radius: var(--radius-xl, 20px);
	}
</style>
