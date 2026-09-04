<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { Users, MapPin, ExternalLink } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import VerificationNoticeBanner from '$lib/components/VerificationNoticeBanner.svelte';
	import EditContactButton from '$lib/components/EditContactButton.svelte';
	import {
		openGraduateModal,
		graduateFromPageState,
		closeGraduateModal
	} from '$lib/services/graduateModal.svelte';
	import type { PageData } from './$types';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
	const назва = $derived(isEn && data.theatre.nameEn ? data.theatre.nameEn : data.theatre.name);

	/**
	 * Підпис під іменем — ПОСАДА й роки, а не рік випуску зі школи.
	 *
	 * Робота в театрі має тривалість, і саме вона тут головна: «акторка,
	 * 2019–2021» і «актриса, з 2019» — різні речі, хоч обидві акторки.
	 * Порожні поля просто не з'являються: у частини анкет років немає взагалі,
	 * і вигадувати їх нема з чого.
	 */
	function підпис(member: { since?: number; until?: number; role?: string; note?: string }) {
		const роки =
			member.since && member.until
				? `${member.since}–${member.until}`
				: member.since
					? $t('galaxy.theatreSince', { values: { year: member.since } })
					: member.until
						? $t('galaxy.theatreUntil', { values: { year: member.until } })
						: null;
		return [member.role, роки, member.note].filter(Boolean).join(', ');
	}

	const картка = $derived(graduateFromPageState());
</script>

<svelte:head>
	<title>{назва} — {$t('galaxy.title')}</title>
</svelte:head>

<main class="th-page" data-testid="theatre-page-section">
	<div class="container">
				<GalaxyBreadcrumb
			backHref={localizedPath('/projects/galaxy-graduates/theatres/', currentLang)}
			backLabel={$t('galaxy.theatresTitle')}
			backTestId="theatre-back-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="theatre-galaxy-link"
		/>

		<VerificationNoticeBanner status={data.theatre.verificationStatus} />

		<header class="th-header">
			<div class="th-header__badges">
				{#each data.theatre.countries as code (code)}
					<span class="th-badge" data-testid="theatre-where-badge-{code}">
						<CountryFlag {code} />
						{$t(`galaxy.country.${code}`)}
					</span>
				{/each}
				{#if data.theatre.city}
					<span class="th-badge" data-testid="theatre-city-badge">
						<MapPin size={14} aria-hidden="true" />
						{data.theatre.city}
					</span>
				{/if}

				<span class="th-header__edit">
					<EditContactButton testIdPrefix="theatre-page-contact" openTo="down" />
				</span>
			</div>

			<h1 class="th-header__title" data-testid="theatre-title">{назва}</h1>

			{#if data.theatre.fullName}
				<p class="th-header__full" data-testid="theatre-full-name-text">
					{data.theatre.fullName}
				</p>
			{/if}

			<!--
				САЙТ ТЕАТРУ — ЗАРАДИ ЦЬОГО РЯДКА СТОРІНКА Й ІСНУЄ.

				Прохання автора звучало так: «замість посилання на сайт театру
				робимо на внутрішню сторінку а там вже буде посилання на театр».
				Тобто зовнішнє посилання не зникає — воно переїжджає з абзацу
				чужої анкети сюди, де стоїть один раз і поруч із людьми, яких
				читач саме прийшов побачити.
			-->
			{#if data.theatre.website}
				<a
					class="th-site"
					href={data.theatre.website}
					target="_blank"
					rel="external noopener noreferrer"
					data-testid="theatre-website-link"
				>
					<ExternalLink size={15} aria-hidden="true" />
					<span>{$t('galaxy.theatreWebsite')}</span>
				</a>
			{/if}
		</header>

		<!--
			ГОЛОВНЕ, ЗАРАДИ ЧОГО СТОРІНКА Є: хто з наших тут працює.

			Картка відкривається ТУТ, а не переходом у галактику — те саме
			правило й та сама причина, що на сторінках фестивалю та закладу:
			людина прийшла дивитися театр, і посилання забирало б її зі
			сторінки, з якої вона щойно почала.
		-->
		{#if data.members.length > 0}
			<section class="th-section" aria-labelledby="th-members-title">
				<div class="th-heading">
					<span class="th-heading__icon"><Users size={20} aria-hidden="true" /></span>
					<h2 id="th-members-title" class="th-heading__title">
						{$t('galaxy.theatreMembers')}
					</h2>
					<span class="th-heading__count">{data.total}</span>
				</div>

				<div class="people-grid" data-testid="theatre-members-list">
					{#each data.members as { graduate, member }, idx (graduate.id)}
						{@const photo = graduate.hasPhoto ? asset(`/graduates/${graduate.slug}-192.webp`) : null}
						<GroupPersonCard
							name={graduate.name}
							{photo}
							subtitle={підпис(member)}
							onclick={() => openGraduateModal(graduate)}
							splitName
							index={idx}
							testid="theatre-member-card-{graduate.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!--
			Ті, кого називає анкета, а реєстру випускників вони невідомі —
			ТЕКСТОМ, без картки й без посилання. Причина та сама, що в закладів
			освіти: викидати їх до з'ясування означало б показати нуль людей
			там, де ми знаємо когось.
		-->
		{#if (data.theatre.unlistedMembers?.length ?? 0) > 0}
			<section class="th-section" aria-labelledby="th-unlisted-title">
				<div class="th-heading">
					<span class="th-heading__icon"><Users size={20} aria-hidden="true" /></span>
					<h2 id="th-unlisted-title" class="th-heading__title">
						{$t('galaxy.theatreUnlisted')}
					</h2>
				</div>
				<ul class="th-list" data-testid="theatre-unlisted-list">
					{#each data.theatre.unlistedMembers ?? [] as person (person.name)}
						<li>{person.name} — {підпис(person)}</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</main>

<GraduateCard showGalaxyLink graduate={картка} onclose={closeGraduateModal} />

<style>
	.th-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main);
	}
	.th-header {
		margin-bottom: var(--space-2xl, 2.5rem);
	}
	.th-header__badges {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.th-header__edit {
		margin-left: auto;
	}
	.th-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 600;
	}
	.th-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	/* Повна назва — підзаголовок, а не другий заголовок: вона довга, і читають її
	   лише ті, кому коротка не сказала нічого. */
	.th-header__full {
		margin: 0.4rem 0 0;
		max-width: 62ch;
		color: var(--text-muted);
		font-size: 0.95rem;
		line-height: 1.45;
	}
	.th-site {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.9rem;
		padding: 0.45rem 0.9rem;
		border-radius: var(--radius-full, 9999px);
		background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
		border: 1px solid var(--accent-primary);
		color: var(--accent-text, var(--accent-primary));
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
		transition:
			background var(--transition-base),
			transform var(--transition-base);
	}
	.th-site:hover {
		background: color-mix(in srgb, var(--accent-primary) 24%, transparent);
		transform: translateY(-2px);
	}

	.th-section {
		margin-bottom: var(--space-2xl, 2.5rem);
	}
	.th-heading {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1rem;
	}
	.th-heading__icon {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-full, 9999px);
		background: color-mix(in srgb, var(--accent-primary) 18%, transparent);
		color: var(--accent-primary);
	}
	.th-heading__title {
		margin: 0;
		font-size: clamp(1.2rem, 2.4vw, 1.6rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.th-heading__count {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
		gap: 0.9rem;
	}

	.th-list {
		margin: 0;
		padding-left: 1.4rem;
		line-height: 1.7;
	}
</style>
