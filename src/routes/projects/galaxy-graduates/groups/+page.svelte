<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import {
		ArrowLeft,
		ArrowRight,
		Users,
		Calendar,
		Sparkles,
		Theater,
		Plus,
		CalendarRange,
		List,
		LayoutGrid
	} from 'lucide-svelte';
	import EditContactButton from '$lib/components/EditContactButton.svelte';
	import GroupMatesRow from '$lib/components/GroupMatesRow.svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { GROUPS, groupProfilePath } from '$lib/data/groups';
	import mastersIndex from '$lib/data/masters.index.json';
	import type { MasterIndexEntry } from '$lib/data/masters';
	import MasterViewToggle, { type ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';
	import { createGalaxyView } from '$lib/services/galaxyViewMode.svelte';

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/**
	 * Майстер підписаний ІМЕНЕМ, а не ПІБ — так само, як на сторінці самої групи.
	 * У даних групи лежить повне ПІБ, коротке ім'я знає реєстр майстрів.
	 */
	const masters = mastersIndex as MasterIndexEntry[];
	function masterName(id: string, fallback: string): string {
		const found = masters.find((m) => m.id === id || m.slug === id);
		if (!found) return fallback;
		return isEn ? found.displayNameEn : found.displayName;
	}

	/**
	 * Порядок ВИПАДКОВИЙ, і міняється він на кожному заході.
	 *
	 * Доти згори стояли найновіші — розумно, але з наслідком: групи початку
	 * двотисячних не бачив ніхто, бо до них не догортали. Випадковий порядок дає
	 * кожній однакові шанси потрапити на очі, а хто шукає СВОЮ, той однаково
	 * шукає її очима, а не читає список підряд.
	 *
	 * Перемішування живе в `$effect`, а НЕ в тілі компонента, і це не стиль:
	 * сторінка потрапляє в prerender, тож на сервері порядок мусить лишитися тим
	 * самим, що й у готовому HTML. Перемішай його там — і гідратація побачить
	 * іншу розмітку, ніж прийшла з мережі. Ефект виконується вже в браузері.
	 *
	 * Фішер—Йейтс, а не `sort(() => Math.random() - 0.5)`: другий дає нерівний
	 * розподіл (порівняння не транзитивне) і в частині рушіїв майже не рухає
	 * початок списку — тобто «випадковість», якої насправді немає. Той самий
	 * порядок міркувань, що й в учасників фестивалю.
	 */
	const byYear = $derived(
		[...GROUPS].sort((a, b) => {
			const ya = Math.max(...a.graduationYears);
			const yb = Math.max(...b.graduationYears);
			return yb - ya || a.name.localeCompare(b.name, 'uk');
		})
	);

	let shuffled = $state<typeof GROUPS | null>(null);

	$effect(() => {
		const list = [...GROUPS];
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		shuffled = list;
	});

	/*
	 * До гідратації — за роками: пререндерена розмітка мусить мати ЯКИЙСЬ
	 * порядок, і осмислений кращий за довільний, якщо скрипт не дійде.
	 */
	const ordered = $derived(shuffled ?? byYear);

	const view = createGalaxyView('galaxy_groups_view');

	const VIEW_OPTIONS: ReadonlyArray<ViewOption> = $derived([
		{ value: 'timeline', label: $t('galaxy.viewModes.timeline'), icon: CalendarRange },
		{ value: 'list', label: $t('galaxy.viewModes.list'), icon: List },
		{ value: 'tiles', label: $t('galaxy.viewModes.tiles'), icon: LayoutGrid }
	]);

	/**
	 * Ті самі групи рядками — і ЗА РОКАМИ, а не перемішані.
	 *
	 * Плитка лишається випадковою, і це не суперечність: перемішування вирішує
	 * задачу саме плитки — рівне поле однакових карток, у якому групи початку
	 * двотисячних не бачив ніхто, бо до них не догортали (докладно вище, над
	 * `byYear`). Хронологія й список натомість ВІДПОВІДАЮТЬ роком: випадковий
	 * порядок у режимі, який називається «хронологія», був би просто неправдою.
	 *
	 * Заразом це знімає з рядків клопіт із гідратацією: перемішування живе лише
	 * в тій гілці, де воно й потрібне.
	 */
	const rows = $derived<GalaxyRow[]>(
		byYear.map((g) => ({
			key: g.slug,
			href: localizedPath(groupProfilePath(g.slug), currentLang),
			year: Math.max(...g.graduationYears),
			yearLabel: g.graduationYears.join(', '),
			title: isEn && g.nameEn ? g.nameEn : g.name,
			subtitle: g.masters.map((m) => masterName(m.id, m.name)).join(' · '),
			memberIds: g.memberIds,
			marks: [
				...(g.abbr ? [{ icon: Sparkles, text: g.abbr, tone: 'group' as const }] : []),
				{ icon: Users, text: String(g.memberIds.length) },
				...(g.playIds.length ? [{ icon: Theater, text: String(g.playIds.length) }] : [])
			]
		}))
	);
</script>

<svelte:head>
	<title>{$t('galaxy.groupsTitle', { default: 'Групи випускників' })} | {$t('hero.title')}</title>
	<meta
		name="description"
		content="Навчальні групи «Галактики випускників»: склад, майстри курсу та репертуар вистав."
	/>
</svelte:head>

<main class="groups-page" data-testid="graduate-groups-panel">
	<div class="container">
		<nav class="groups-page__nav clears-logo" aria-label="Breadcrumb">
			<a
				href={localizedPath('/projects/galaxy-graduates/festivals/', currentLang)}
				class="nav-back-link"
				data-testid="galaxy-groups-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.backToFestivals')}</span>
			</a>

			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="nav-back-link nav-back-link--forward"
				data-testid="galaxy-groups-galaxy-link"
			>
				<span>{$t('galaxy.title')}</span>
				<ArrowRight size={18} aria-hidden="true" />
			</a>
		</nav>

		<header class="groups-header">
			<h1 class="groups-header__title" data-testid="galaxy-groups-title">
				{$t('galaxy.groupsTitle', { default: 'Групи випускників' })}
			</h1>
			<p class="groups-header__count">
				{ordered.length}
			</p>

			<div class="groups-header__view">
				<MasterViewToggle
					viewMode={view.current}
					onchange={view.set}
					options={VIEW_OPTIONS}
					testIdPrefix="galaxy-groups-view"
				/>
			</div>
		</header>

		<!--
			«Додати групу» — сніпетом, бо картка потрібна в УСІХ трьох режимах.
			Скопіювати її в кожну гілку означало б три однакових шматки, які
			розійдуться на першій же правці, а показувати лише в плитці — сховати
			прохання написати від тих, хто дивиться хронологію.
		-->
		{#snippet addCard()}
			<div class="group-card group-card--add" data-testid="galaxy-group-add-card">
				<span class="group-card__head">
					<span class="group-card__name">{$t('galaxy.addGroup')}</span>
					<span class="group-card__abbr">
						<Plus size={13} aria-hidden="true" />
					</span>
				</span>
				<span class="group-card__masters">{$t('galaxy.addGroupHint')}</span>
				<!--
					Розгорнуто, без олівця: прохання написати вже стоїть рядком
					вище, і кнопка поруч питала б удруге те саме, ховаючи
					відповідь за ще одним натисканням. Місця в плитці вистачає.
				-->
				<EditContactButton testIdPrefix="galaxy-group-add-contact" mode="inline" />
			</div>
		{/snippet}

		{#if view.current !== 'tiles'}
			<!--
				У рядках картка стоїть НАД переліком, а не першим рядком: усередині
				неї кнопка звернення, і в сітці рядка вона ламала б і ліву лінію, і
				праву. Той самий `testIdPrefix`, що в плитки, — режим показується
				рівно один.
			-->
			<div class="groups-add-solo">{@render addCard()}</div>
			<GalaxyRows
				{rows}
				grouped={view.current === 'timeline'}
				testIdPrefix="galaxy-groups"
				maxFaces={8}
			/>
		{:else}
		<ul class="groups-grid" data-testid="galaxy-groups-list">
			<!--
				ПЕРШИМ пунктом — «додати групу», у тій самій плитці, що й решта.
				Доти сторінка показувала сам лише перелік того, що вже є, і не
				казала, що список поповнюється зверненням. Окрема кнопка десь збоку
				сказала б це тихіше: тут вона стоїть там, де людина шукає СВОЮ групу
				й не знаходить.
			-->
			<li>{@render addCard()}</li>
			{#each ordered as group (group.slug)}
				<li>
					<a
						class="group-card"
						href={localizedPath(groupProfilePath(group.slug), currentLang)}
						data-testid="galaxy-group-card-{group.slug}"
					>
						<span class="group-card__head">
							<span class="group-card__name">
								{isEn && group.nameEn ? group.nameEn : group.name}
							</span>
							{#if group.abbr}
								<span class="group-card__abbr">
									<Sparkles size={13} aria-hidden="true" />
									{group.abbr}
								</span>
							{/if}
						</span>

						<span class="group-card__meta">
							<span class="group-card__badge">
								<Calendar size={13} aria-hidden="true" />
								{group.graduationYears.join(', ')}
							</span>
							<span class="group-card__badge">
								<Users size={13} aria-hidden="true" />
								{group.memberIds.length}
							</span>
							<!-- Репертуар може ще не бути внесений: значок «0» повідомляв би
							     не про групу, а про стан наших даних. -->
							{#if group.playIds.length > 0}
								<span class="group-card__badge">
									<Theater size={13} aria-hidden="true" />
									{group.playIds.length}
								</span>
							{/if}
						</span>

						{#if group.masters.length}
							<span class="group-card__masters">
								{group.masters.map((m) => masterName(m.id, m.name)).join(' · ')}
							</span>
						{/if}

						<!--
							Мініатюри складу — те саме, що в картці випускника, тільки
							БЕЗ посилань: рядок лежить усередині картки-посилання, а
							`<a>` всередині `<a>` невалідний. Натискання й так веде на
							сторінку групи, а звідти вже можна перейти до людини.

							Свій `testIdPrefix` обов'язковий: таких рядків на сторінці
							стільки ж, скільки груп, а `testid.spec` вимагає
							унікальності в межах сторінки.
						-->
						<span class="group-card__mates">
							<GroupMatesRow
								groupSlug={group.slug}
								linked={false}
								testIdPrefix="galaxy-group-mates-{group.slug}"
							/>
						</span>
					</a>
				</li>
			{/each}
		</ul>
		{/if}
	</div>
</main>

<style>
	.groups-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
	}
	/*
	 * Дві сторони, як на сусідніх сторінках: назад до фестивалів, уперед до
	 * галактики. Доти галактика стояла ЛІВОРУЧ зі стрілкою назад, хоч на решті
	 * сторінок та сама кнопка — крок уперед і стоїть праворуч.
	 */
	.groups-page__nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.nav-back-link {
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
	.nav-back-link:hover {
		border-color: var(--accent-primary);
		transform: translateX(-3px);
	}
	/* Складений добір: модифікатор має ту саму вагу, що й правило вище. */
	.groups-page__nav .nav-back-link--forward:hover {
		transform: translateX(3px);
	}

	.groups-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	/* Перемикач до правого краю — там, де його шукають на сторінці майстра. */
	.groups-header__view {
		margin-left: auto;
	}
	/* Картка звернення поза плиткою: у повну ширину вона розтягла б прохання
	   написати на весь екран, а це не головне на сторінці. */
	.groups-add-solo {
		max-width: 24rem;
		margin-bottom: 1.25rem;
	}
	.groups-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.groups-header__count {
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

	.groups-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
		gap: 1rem;
	}

	.group-card {
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
	.group-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-main);
	}
	.group-card__head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.group-card__name {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}
	.group-card__abbr {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-sm, 6px);
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
		font-size: 0.75rem;
		font-weight: 700;
	}
	.group-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.group-card__badge {
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
	/*
	 * Плитка «додати групу» — та сама, що й у решти, з двома відмінностями:
	 * вона не посилання (кнопка всередині сама веде до контактів) і не має
	 * значків із числами, бо рахувати в ній нічого. Пунктирна рамка каже, що це
	 * місце під групу, а не група.
	 */
	.group-card--add {
		border-style: dashed;
		justify-content: space-between;
		gap: 0.6rem;
	}
	/*
	 * Мініатюри притиснуті до низу картки: у груп різна кількість плашок і
	 * різна довжина назв, і без цього ряди облич стрибали б по вертикалі від
	 * картки до картки.
	 */
	.group-card__mates {
		display: block;
		margin-top: auto;
		padding-top: 0.75rem;
	}
	.group-card__masters {
		margin-top: auto;
		padding-top: 0.5rem;
		border-top: 1px dashed var(--border-main);
		font-size: 0.84rem;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
