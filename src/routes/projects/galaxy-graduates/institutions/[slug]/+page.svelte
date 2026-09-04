<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { ArrowLeft, ArrowRight, GraduationCap, Users, MapPin } from 'lucide-svelte';
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

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
	const назва = $derived(isEn && data.institution.nameEn ? data.institution.nameEn : data.institution.name);

	/**
	 * Підпис під іменем — РІК ВСТУПУ й те, куди саме.
	 *
	 * Саме рік вступу, а не рік випуску зі школи: на цій сторінці людина стоїть
	 * як студент цього закладу, і в трьох із чотирнадцяти ці роки різні (Аліна
	 * Демедюк випустилася 2025-го, Карина Шаркова 2024-го, а вступили обидві
	 * 2026-го). Рік випуску видно в картці, яка відкривається натисканням.
	 */
	function підпис(student: { year: number; programme?: string; master?: string; note?: string }) {
		const частини = [
			$t('galaxy.institutionEnrolled', { values: { year: student.year } }),
			student.programme,
			student.master ? $t('galaxy.institutionCourse', { values: { master: student.master } }) : null,
			student.note
		];
		return частини.filter(Boolean).join(', ');
	}

	const картка = $derived(graduateFromPageState());
</script>

<svelte:head>
	<title>{назва} — {$t('galaxy.title')}</title>
</svelte:head>

<main class="inst-page" data-testid="institution-page-section">
	<div class="container">
		<nav class="inst-page__nav clears-logo" aria-label="Breadcrumb">
			<a
				href={localizedPath('/projects/galaxy-graduates/institutions/', currentLang)}
				class="inst-nav"
				data-testid="institution-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.institutionsTitle')}</span>
			</a>

			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="inst-nav inst-nav--forward"
				data-testid="institution-galaxy-link"
			>
				<span>{$t('galaxy.title')}</span>
				<ArrowRight size={18} aria-hidden="true" />
			</a>
		</nav>

		<VerificationNoticeBanner status={data.institution.verificationStatus} />

		<header class="inst-header">
			<div class="inst-header__badges">
				{#each data.institution.countries as code (code)}
					<span class="inst-badge" data-testid="institution-where-badge-{code}">
						<CountryFlag {code} />
						{$t(`galaxy.country.${code}`)}
					</span>
				{/each}
				{#if data.institution.city}
					<span class="inst-badge" data-testid="institution-city-badge">
						<MapPin size={14} aria-hidden="true" />
						{data.institution.city}
					</span>
				{/if}

				<span class="inst-header__edit">
					<EditContactButton testIdPrefix="institution-page-contact" openTo="down" />
				</span>
			</div>

			<h1 class="inst-header__title" data-testid="institution-title">{назва}</h1>

			{#if data.institution.fullName}
				<p class="inst-header__full" data-testid="institution-full-name-text">
					{data.institution.fullName}
				</p>
			{/if}
		</header>

		<!--
			ГОЛОВНЕ, ЗАРАДИ ЧОГО СТОРІНКА Є: хто з наших тут навчається.

			Картка відкривається ТУТ, а не переходом у галактику — те саме
			правило й та сама причина, що на сторінці фестивалю: людина прийшла
			дивитися заклад, і посилання забирало б її зі сторінки, з якої вона
			щойно почала.
		-->
		{#if data.students.length > 0}
			<section class="inst-section" aria-labelledby="inst-students-title">
				<div class="inst-heading">
					<span class="inst-heading__icon"><Users size={20} aria-hidden="true" /></span>
					<h2 id="inst-students-title" class="inst-heading__title">
						{$t('galaxy.institutionStudents')}
					</h2>
					<span class="inst-heading__count">{data.total}</span>
				</div>

				<div class="people-grid" data-testid="institution-students-list">
					{#each data.students as { graduate, student }, idx (graduate.id)}
						{@const photo = graduate.hasPhoto ? asset(`/graduates/${graduate.slug}-192.webp`) : null}
						<GroupPersonCard
							name={graduate.name}
							{photo}
							subtitle={підпис(student)}
							onclick={() => openGraduateModal(graduate)}
							splitName
							index={idx}
							testid="institution-student-card-{graduate.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!--
			Ті, кого називає джерело, а реєстру випускників вони невідомі —
			ТЕКСТОМ, без картки й без посилання. Причина в докблоці
			`data/institutions.ts`: викидати їх до з'ясування означало б, що
			сторінка показує нуль людей, хоч ми знаємо двох.
		-->
		{#if (data.institution.unlistedStudents?.length ?? 0) > 0}
			<section class="inst-section" aria-labelledby="inst-unlisted-title">
				<div class="inst-heading">
					<span class="inst-heading__icon"><GraduationCap size={20} aria-hidden="true" /></span>
					<h2 id="inst-unlisted-title" class="inst-heading__title">
						{$t('galaxy.institutionUnlisted')}
					</h2>
				</div>
				<p class="inst-note">{$t('galaxy.institutionUnlistedHint')}</p>
				<ul class="inst-list" data-testid="institution-unlisted-list">
					{#each data.institution.unlistedStudents ?? [] as person (person.name)}
						<li>{person.name} — {підпис(person)}</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</main>

<GraduateCard showGalaxyLink graduate={картка} onclose={closeGraduateModal} />

<style>
	.inst-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main);
	}
	.inst-page__nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.inst-nav {
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
	.inst-nav:hover {
		border-color: var(--accent-primary);
		transform: translateX(-3px);
	}
	.inst-nav--forward:hover {
		transform: translateX(3px);
	}

	.inst-header {
		margin-bottom: var(--space-2xl, 2.5rem);
	}
	.inst-header__badges {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.inst-header__edit {
		margin-left: auto;
	}
	.inst-badge {
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
	.inst-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	/* Повна назва — підзаголовок, а не другий заголовок: вона довга, і читають її
	   лише ті, кому скорочення не сказало нічого. */
	.inst-header__full {
		margin: 0.4rem 0 0;
		max-width: 62ch;
		color: var(--text-muted);
		font-size: 0.95rem;
		line-height: 1.45;
	}

	.inst-section {
		margin-bottom: var(--space-2xl, 2.5rem);
	}
	.inst-heading {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1rem;
	}
	.inst-heading__icon {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-full, 9999px);
		background: color-mix(in srgb, var(--accent-primary) 18%, transparent);
		color: var(--accent-primary);
	}
	.inst-heading__title {
		margin: 0;
		font-size: clamp(1.2rem, 2.4vw, 1.6rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.inst-heading__count {
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

	.inst-note {
		margin: 0 0 0.6rem;
		max-width: 62ch;
		color: var(--text-muted);
		font-size: 0.88rem;
		line-height: 1.45;
	}
	.inst-list {
		margin: 0;
		padding-left: 1.4rem;
		line-height: 1.7;
	}
</style>
