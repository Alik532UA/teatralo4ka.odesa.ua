<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { asset } from '$app/paths';
	import { ArrowLeft, Drama, Users, Sparkles, Award, Calendar } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { graduateProfilePath, type GraduateIndexEntry } from '$lib/data/graduates';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
	import GroupPlaysTimeline from '$lib/components/GroupPlaysTimeline.svelte';
	import { imageSize, type LocalImage } from '$lib/config/localImages';

	let { data }: { data: PageData } = $props();

	let selectedGraduate = $state<GraduateIndexEntry | null>(null);

	/**
	 * Склад групи щоразу в новому порядку — щоб ніхто не стояв першим завжди.
	 *
	 * Перемішування живе в `$effect`, а НЕ в тілі компонента, і це не стиль:
	 * сторінка потрапляє в prerender, тож на сервері порядок мусить лишитися
	 * тим самим, що й у готовому HTML. Перемішай його там — і гідратація
	 * побачить іншу розмітку, ніж прийшла з мережі. Ефект виконується вже в
	 * браузері, після гідратації, тому обидві сторони збігаються.
	 *
	 * Фішер—Йейтс, а не `sort(() => Math.random() - 0.5)`: другий дає нерівний
	 * розподіл (порівняння не транзитивне) і в частині рушіїв майже не рухає
	 * початок списку — тобто «випадковість», якої насправді немає.
	 */
	let shuffled = $state<GraduateIndexEntry[] | null>(null);

	$effect(() => {
		const source = data.members;
		const list = [...source];
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		shuffled = list;
	});

	const members = $derived(shuffled ?? data.members);

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
	const groupTitle = $derived(isEn && data.group.nameEn ? data.group.nameEn : data.group.name);
	const graduationYearsStr = $derived(data.group.graduationYears.join(', '));
</script>

<svelte:head>
	<title>{groupTitle} — {$t('galaxy.groupsTitle')} | {$t('hero.title')}</title>
	<meta
		name="description"
		content="{groupTitle} ({data.group.abbr || ''}): {$t('galaxy.groupMaster')} — {data.masters.map((m) => m.fullName).join(', ')}. {$t('galaxy.groupEnsemble')}, {$t('galaxy.groupRepertoire').toLowerCase()}."
	/>
</svelte:head>

<main class="group-page" data-testid="graduate-group-panel">
	<div class="group-page__ambient" aria-hidden="true">
		<div class="ambient-glow ambient-glow--1"></div>
		<div class="ambient-glow ambient-glow--2"></div>
	</div>

	<div class="container">
		<!-- Хлібні крихти та навігація -->
		<nav class="group-page__nav" aria-label="Breadcrumb">
			<a
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="nav-back-link"
				data-testid="group-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.title')}</span>
			</a>
		</nav>

		<!-- Головна шапка групи -->
		<header class="group-header">
			{#if data.group.photo}
				{@const size = imageSize(data.group.photo as LocalImage)}
				<div class="group-photo-wrap" data-testid="group-photo-banner">
					<img
						src={asset(data.group.photo)}
						alt={groupTitle}
						class="group-photo-img"
						loading="eager"
						width={size.width}
						height={size.height}
					/>
				</div>
			{/if}

			<div class="group-header__badge-wrap">
				{#if data.group.abbr}
					<span class="group-abbr-badge" data-testid="group-abbr-badge">
						<span class="icon-wrap icon-wrap--gold"><Sparkles size={14} aria-hidden="true" /></span>
						{data.group.abbr}
					</span>
				{/if}
				<span class="group-years-badge" data-testid="group-years-badge">
					<Calendar size={14} aria-hidden="true" />
					{$t('galaxy.graduated')}: {graduationYearsStr}
				</span>
			</div>

			<h1 class="group-header__title" data-testid="group-title">
				{groupTitle}
			</h1>

			{#if isEn && data.group.name !== groupTitle}
				<p class="group-header__subtitle-uk">{data.group.name}</p>
			{/if}
		</header>

		<!--
			1. Секція: Склад групи (Ансамбль випускників)

			Хвиля пульсації йде НАСКРІЗЬ обома секціями: `index` рахується від
			початку сторінки, а не від початку секції. Доти в кожної секції був
			власний відлік, тож вони пульсували двома окремими хвилями — між
			ними читалася пауза.
		-->
		{#if data.members.length > 0}
			<section class="group-section" aria-labelledby="section-members-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Users size={20} aria-hidden="true" /></span>
					<h2 id="section-members-title" class="section-heading__title">
						{$t('galaxy.groupEnsemble')}
					</h2>
					<span class="section-heading__count">{data.members.length}</span>
				</div>

				<div class="people-grid" data-testid="group-members-list">
					{#each members as member, idx (member.slug)}
						{@const hasProfile = Boolean(member.hasPhoto && member.code)}
						{@const photoSrc = member.hasPhoto ? asset(`/graduates/${member.slug}-192.webp`) : null}
						<GroupPersonCard
							name={member.name}
							photo={photoSrc}
							subtitle={member.graduationYear
								? `${$t('galaxy.graduated')} ${member.graduationYear}`
								: null}
							href={hasProfile && member.code
								? localizedPath(graduateProfilePath(member.code), currentLang)
								: undefined}
							onclick={hasProfile && member.code
								? undefined
								: () => {
										selectedGraduate = member;
									}}
							index={idx}
							testid="group-member-card-{member.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 2. Секція: майстер курсу й викладачі -->
		{#if data.masters.length > 0 || data.teachers.length > 0}
			<section class="group-section" aria-labelledby="section-faculty-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Award size={20} aria-hidden="true" /></span>
					<h2 id="section-faculty-title" class="section-heading__title">
						{$t('galaxy.groupFaculty')}
					</h2>
				</div>

				<!--
					Майстри й викладачі в ОДНІЙ сітці, майстер перший. Ролі
					розрізняє підпис під іменем: у майстра це сама роль, у
					викладача — предмет.
				-->
				<div class="people-grid">
					{#each data.masters as master, idx (master.id)}
						{@const masterSlug = 'slug' in master ? master.slug : master.id}
						{@const masterPhoto = 'photo' in master && master.photo ? asset(master.photo) : null}
						<GroupPersonCard
							name={master.fullName}
							photo={masterPhoto}
							subtitle={$t('galaxy.groupMaster')}
							href={localizedPath(`/residents/adults/${masterSlug}`, currentLang)}
							index={members.length + idx}
							testid="group-master-card"
						/>
					{/each}

					{#each data.teachers as teacher, idx (teacher.id)}
						<GroupPersonCard
							name={teacher.fullName}
							photo={teacher.photo ? asset(teacher.photo) : null}
							subtitle={teacher.subject}
							href={localizedPath(`/residents/adults/${teacher.slug}`, currentLang)}
							index={members.length + data.masters.length + idx}
							testid="group-teacher-card-{teacher.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 3. Секція: Репертуар вистав -->
		{#if data.group.plays.length > 0}
			<section class="group-section" aria-labelledby="section-plays-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Drama size={20} aria-hidden="true" /></span>
					<h2 id="section-plays-title" class="section-heading__title">
						{$t('galaxy.groupRepertoire')}
					</h2>
					<span class="section-heading__count">{data.group.plays.length}</span>
				</div>

				<GroupPlaysTimeline plays={data.group.plays} />
			</section>
		{/if}
	</div>
</main>

<!-- Та сама картка, що й у галактиці. Анкету вона дістає сама, а кнопку
     «Заповнити анкету» й саму форму тримає всередині. -->
<GraduateCard
	graduate={selectedGraduate}
	onclose={() => { selectedGraduate = null; }}
/>

<style>
	.group-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
		overflow: hidden;
	}

	.container {
		max-width: 1040px;
		margin: 0 auto;
		position: relative;
		z-index: 2;
	}

	/* Фонове світіння */
	.group-page__ambient {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		overflow: hidden;
	}

	.ambient-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
		opacity: 0.18;
	}

	.ambient-glow--1 {
		width: 450px;
		height: 450px;
		top: -50px;
		left: 10%;
		background: radial-gradient(circle, var(--accent-primary, #6366f1) 0%, transparent 70%);
	}

	.ambient-glow--2 {
		width: 500px;
		height: 500px;
		top: 200px;
		right: 5%;
		background: radial-gradient(circle, #ec4899 0%, transparent 70%);
	}

	/* Навігація */
	.group-page__nav {
		margin-bottom: 2rem;
	}

	.nav-back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-muted, #94a3b8);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.2s ease;
		backdrop-filter: blur(8px);
	}

	.nav-back-link:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-main, #f8fafc);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(-3px);
	}

	/* Шапка групи */
	.group-header {
		margin-bottom: 3.5rem;
		text-align: center;
	}

	.group-photo-wrap {
		max-width: 820px;
		margin: 0 auto 2rem;
		border-radius: 20px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(12px);
	}

	.group-photo-img {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
		transition: transform 0.4s ease;
	}

	.group-photo-wrap:hover .group-photo-img {
		transform: scale(1.015);
	}

	.group-header__badge-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	.group-abbr-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25));
		border: 1px solid rgba(168, 85, 247, 0.4);
		color: #e0e7ff;
		font-weight: 700;
		font-size: 0.9rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
	}

	.icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.icon-wrap--gold {
		color: #facc15;
	}

	.icon-wrap--primary {
		color: var(--accent-primary, #6366f1);
	}

	.group-years-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: var(--text-muted, #94a3b8);
		font-size: 0.85rem;
		font-weight: 500;
	}

	.group-header__title {
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 800;
		line-height: 1.15;
		margin: 0 0 0.5rem;
		background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		letter-spacing: -0.02em;
	}

	.group-header__subtitle-uk {
		font-size: 1.15rem;
		color: var(--text-muted, #94a3b8);
		margin: 0;
	}

	/* Секції */
	.group-section {
		margin-bottom: 4rem;
	}

	.section-heading {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 1.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		padding-bottom: 0.75rem;
	}

	.section-heading__title {
		font-size: 1.45rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.section-heading__count {
		margin-left: auto;
		padding: 0.15rem 0.6rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.08);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted, #94a3b8);
	}

	/* Одна сітка на майстрів і на випускників — картка тепер спільна. */
	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
		gap: 1.25rem;
	}

	/* Світла тема */
	:global(.light-theme) .group-page {
		color: #1e293b;
	}

	:global(.light-theme) .group-header__title {
		background: linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	:global(.light-theme) .group-photo-wrap {
		border-color: rgba(0, 0, 0, 0.1);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12);
		background: #f8fafc;
	}

	:global(.light-theme) .nav-back-link {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.08);
		color: #475569;
	}

	:global(.light-theme) .nav-back-link:hover {
		background: rgba(0, 0, 0, 0.08);
		color: #0f172a;
	}

	:global(.light-theme) .group-years-badge {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.08);
		color: #64748b;
	}

	:global(.light-theme) .section-heading {
		border-bottom-color: rgba(0, 0, 0, 0.08);
	}

	@media (max-width: 640px) {
		.group-page {
			padding: 1.5rem 1rem 3.5rem;
		}

		.group-header {
			margin-bottom: 2.5rem;
		}

		.group-section {
			margin-bottom: 2.5rem;
		}
	}
</style>
