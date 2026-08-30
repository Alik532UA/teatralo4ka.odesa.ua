<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { asset } from '$app/paths';
	import { ArrowLeft, ArrowRight, Theater, Users, Globe, Calendar } from 'lucide-svelte';
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

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/*
	 * Вибір живе в СТАНІ СТОРІНКИ, а не в локальному `$state`: тоді відкрита
	 * картка має власну адресу, «назад» її закриває, а посилання можна
	 * скопіювати. Те саме рішення, що й на сторінці групи.
	 */
	const selectedGraduate = $derived(graduateFromPageState());

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
				<span class="fest-badge" data-testid="festival-where-badge">
					<span class="icon-wrap icon-wrap--gold"><Globe size={14} aria-hidden="true" /></span>
					<span class="fest-badge__flags">
						{#each data.festival.countries as code (code)}
							<CountryFlag {code} title={$t(`galaxy.country.${code}`)} />
						{/each}
					</span>
					{whereStr}
				</span>
				<span class="fest-badge" data-testid="festival-years-badge">
					<Calendar size={14} aria-hidden="true" />
					{yearsStr}
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
					{#each data.members as member, idx (member.id)}
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
		{#if data.members.length === 0 && data.plays.length === 0}
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
	.fest-badge__flags {
		font-size: 1rem;
		line-height: 1;
		/* Без letter-spacing: інтервал роз'єднує пару символів-індикаторів,
		   і замість прапора виходять дві літери. */
		letter-spacing: normal;
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
	.icon-wrap--gold {
		width: 1.7rem;
		height: 1.7rem;
		background: rgba(234, 179, 8, 0.15);
		border-color: rgba(234, 179, 8, 0.3);
		color: #fde68a;
	}

	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
		gap: 1rem;
	}

	.fest-empty {
		max-width: 55ch;
		margin: 0 auto;
		text-align: center;
		color: var(--text-muted);
		line-height: 1.6;
	}
</style>
