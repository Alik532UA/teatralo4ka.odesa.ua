<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { asset } from '$app/paths';
	import {
		ArrowLeft,
		ArrowRight,
		Theater,
		Users,
		GraduationCap,
		Calendar
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { graduationCaption } from '$lib/data/graduates';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import {
		closeGraduateModal,
		graduateFromPageState,
		openGraduateModal
	} from '$lib/services/graduateModal.svelte';
	import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
	import GroupPlaysTimeline from '$lib/components/GroupPlaysTimeline.svelte';
	import GroupPhotoBanner from '$lib/components/GroupPhotoBanner.svelte';
	import EditContactButton from '$lib/components/EditContactButton.svelte';

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/*
	 * Вибір живе в СТАНІ СТОРІНКИ, а не в локальному `$state`: тоді відкрита
	 * картка має власну адресу, «назад» її закриває, а посилання можна
	 * скопіювати. Те саме рішення, що й на сторінці групи.
	 */
	const selectedGraduate = $derived(graduateFromPageState());

	/**
	 * Склад поїздки щоразу в новому порядку — щоб ніхто не стояв першим завжди.
	 *
	 * Перемішування живе в `$effect`, а НЕ в тілі компонента, і це не стиль:
	 * сторінка потрапляє в prerender, тож на сервері порядок мусить лишитися тим
	 * самим, що й у готовому HTML. Перемішай його там — і гідратація побачить
	 * іншу розмітку, ніж прийшла з мережі. Ефект виконується вже в браузері.
	 *
	 * Фішер—Йейтс, а не `sort(() => Math.random() - 0.5)`: другий дає нерівний
	 * розподіл (порівняння не транзитивне) і в частині рушіїв майже не рухає
	 * початок списку — тобто «випадковість», якої насправді немає.
	 *
	 * Викладачів це не стосується: їх у поїздці двоє-п'ятеро, і порядок там —
	 * той, у якому їх назвали.
	 */
	let shuffled = $state<typeof data.members | null>(null);

	$effect(() => {
		const list = [...data.members];
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		shuffled = list;
	});

	const members = $derived(shuffled ?? data.members);

	const festivalTitle = $derived(
		isEn && data.festival.nameEn ? data.festival.nameEn : data.festival.name
	);
	const yearsStr = $derived([...data.festival.years].sort((a, b) => a - b).join(', '));
	const countriesStr = $derived(
		data.festival.countries.map((c) => $t(`galaxy.country.${c}`)).join(' · ')
	);
	const whereStr = $derived(
		data.festival.city ? `${data.festival.city}, ${countriesStr}` : countriesStr
	);
</script>

<svelte:head>
	<title>{festivalTitle} — {$t('galaxy.festivalsTitle')} | {$t('hero.title')}</title>
	<meta name="description" content="{festivalTitle}, {yearsStr}. {whereStr}." />
</svelte:head>

<main class="fest-page" data-testid="festival-panel">
	<div class="container">
		<nav class="fest-page__nav clears-logo" aria-label="Breadcrumb">
			<a
				href={localizedPath('/projects/galaxy-graduates/festivals/', currentLang)}
				class="nav-link"
				data-testid="festival-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.backToFestivals')}</span>
			</a>

			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="nav-link nav-link--forward"
				data-testid="festival-galaxy-link"
			>
				<span>{$t('galaxy.title')}</span>
				<ArrowRight size={18} aria-hidden="true" />
			</a>
		</nav>

		<header class="fest-header">
			<GroupPhotoBanner photos={data.festival.photos ?? []} title={festivalTitle} />

			<div class="fest-header__badges">
				<!--
					Кожна країна — ВЛАСНА плашка, а не всі в одній через роздільник.
					Три країни в одному овалі читалися як одне місце; окремі плашки
					одразу показують, що поїздка була до трьох різних країн.
				-->
				{#if data.festival.city}
					<span class="fest-badge" data-testid="festival-city-badge">{data.festival.city}</span>
				{/if}
				{#each data.festival.countries as code (code)}
					<span class="fest-badge" data-testid="festival-where-badge-{code}">
						<CountryFlag {code} />
						{$t(`galaxy.country.${code}`)}
					</span>
				{/each}
				<span class="fest-badge" data-testid="festival-years-badge">
					<Calendar size={14} aria-hidden="true" />
					{yearsStr}
				</span>

				<!--
					Кнопка правок у тому самому рядку, що й плашки. Саме на цих
					сторінках вона потрібна найбільше: учасників фестивалів
					відновлювали листуванням, і помилку в прізвищі помітить той,
					хто там був.
				-->
				<span class="fest-header__edit">
					<EditContactButton
						testIdPrefix="festival-page-contact"
						openTo="down"
						hasPhoto={(data.festival.photos ?? []).length > 0}
					/>
				</span>
			</div>

			<h1 class="fest-header__title" data-testid="festival-title">{festivalTitle}</h1>

			{#if isEn && data.festival.name !== festivalTitle}
				<p class="fest-header__subtitle-uk">{data.festival.name}</p>
			{/if}

			{#if data.festival.bio?.length}
				<div class="fest-header__bio">
					{#each data.festival.bio as paragraph (paragraph)}
						<p>{paragraph}</p>
					{/each}
				</div>
			{/if}
		</header>

		{#if data.members.length > 0}
			<section class="fest-section" aria-labelledby="section-members-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Users size={20} aria-hidden="true" /></span>
					<h2 id="section-members-title" class="section-heading__title">
						{$t('galaxy.festivalMembers')}
					</h2>
					<span class="section-heading__count">{data.members.length}</span>
				</div>

				<!--
					Випускник відкривається КАРТКОЮ тут, а не переходом у галактику:
					людина прийшла дивитися фестиваль, і посилання забирало б її зі
					сторінки, з якої вона щойно почала.
				-->
				<div class="people-grid" data-testid="festival-members-list">
					{#each members as member, idx (member.id)}
						{@const photoSrc = member.hasPhoto ? asset(`/graduates/${member.slug}-192.webp`) : null}
						<GroupPersonCard
							name={member.name}
							photo={photoSrc}
							subtitle={graduationCaption(member, $t)}
							onclick={() => openGraduateModal(member)}
							splitName
							index={idx}
							testid="festival-member-card-{member.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!--
			Викладачі, що їздили. GraduationCap — та сама іконка, що й на розділі
			майстрів курсу: у словнику вона означає курс, тобто людей, які вчать.
		-->
		{#if data.masters.length > 0}
			<section class="fest-section" aria-labelledby="section-faculty-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"
						><GraduationCap size={20} aria-hidden="true" /></span
					>
					<h2 id="section-faculty-title" class="section-heading__title">
						{$t('galaxy.festivalTeachers')}
					</h2>
					<span class="section-heading__count">{data.masters.length}</span>
				</div>

				<!--
					Без підпису під іменем: `roleTitle` у працівників — це повна посада
					(«викладач акторської майстерності вищої категорії, методист, …»), і
					в картці 150 px вона перетворюється на стіну тексту. Хто це такі,
					каже сам заголовок розділу.
				-->
				<div class="people-grid" data-testid="festival-teachers-list">
					{#each data.masters as master, idx (master.id)}
						<GroupPersonCard
							name={isEn ? master.displayNameEn : master.displayName}
							photo={master.photo ? asset(master.photo) : null}
							href={localizedPath(`/residents/adults/${master.slug}`, currentLang)}
							index={data.members.length + idx}
							testid="festival-teacher-card-{master.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.plays.length > 0}
			<section class="fest-section" aria-labelledby="section-plays-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Theater size={20} aria-hidden="true" /></span>
					<h2 id="section-plays-title" class="section-heading__title">
						{$t('galaxy.festivalPlays')}
					</h2>
					<span class="section-heading__count">{data.plays.length}</span>
				</div>

				<GroupPlaysTimeline plays={data.plays} />
			</section>
		{/if}

		<!--
			Склад і показ вносять поступово, тож сторінка може лишитися без обох.
			Порожня сторінка мовчки — гірше за сторінку, яка каже, чого на ній ще
			немає: інакше читач вирішить, що зламалося.
		-->
		{#if data.members.length === 0 && data.masters.length === 0 && data.plays.length === 0}
			<p class="fest-empty" data-testid="festival-empty-text">
				{$t('galaxy.festivalEmpty')}
			</p>
		{/if}
	</div>
</main>

<!-- Та сама картка, що й у галактиці та на сторінці групи. -->
<GraduateCard showGalaxyLink graduate={selectedGraduate} onclose={closeGraduateModal} />

<style>
	.fest-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
	}

	.fest-page__nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 2rem;
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
	.fest-page__nav .nav-link--forward:hover {
		transform: translateX(3px);
	}

	.fest-header {
		margin-bottom: 3rem;
		text-align: center;
	}
	.fest-header__edit {
		display: inline-flex;
		margin-left: auto;
	}
	.fest-header__badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem;
		margin-bottom: 1rem;
	}
	.fest-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.85rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 600;
	}
	.fest-header__title {
		margin: 0;
		font-size: clamp(1.8rem, 5vw, 3rem);
		font-weight: 800;
		color: var(--text-title);
		text-wrap: balance;
	}
	.fest-header__subtitle-uk {
		margin: 0.4rem 0 0;
		font-size: 1rem;
		color: var(--text-muted);
	}
	.fest-header__bio {
		max-width: 65ch;
		margin: 1.2rem auto 0;
		text-align: left;
		color: var(--text-main);
		line-height: 1.65;
	}

	.fest-section {
		margin-bottom: 3.5rem;
	}
	.section-heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.section-heading__title {
		margin: 0;
		font-size: clamp(1.2rem, 3vw, 1.6rem);
		font-weight: 700;
		color: var(--text-title);
	}
	.section-heading__count {
		display: grid;
		place-items: center;
		min-width: 1.8rem;
		height: 1.8rem;
		padding: 0 0.45rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}
	.icon-wrap {
		display: inline-grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: var(--radius-md, 12px);
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
	}
	.icon-wrap--primary {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
	}
	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
		gap: 1rem;
	}

	/*
	 * На телефоні — рівно ДВОЄ в рядок, як на сторінці групи.
	 *
	 * `auto-fill` із мінімумом у 150px мав би пускати двох і сюди, але не
	 * пускав: грид-елемент із типовим `min-width: auto` не вужчий за свій
	 * найдовший рядок, а прізвища на кшталт «Вішталюк (Суханова)» цей мінімум
	 * перекривають. Через це двадцять чотири учасники займали двадцять чотири
	 * рядки, тоді як у групі поруч ті самі картки стояли парами.
	 *
	 * Тут ширину задає не мінімум, а саме число колонок.
	 */
	@media (max-width: 767px) {
		.people-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}
	}

	.fest-empty {
		max-width: 55ch;
		margin: 0 auto;
		text-align: center;
		color: var(--text-muted);
		line-height: 1.6;
	}
</style>
