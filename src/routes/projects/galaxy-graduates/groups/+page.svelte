<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { ArrowLeft, Users, Calendar, Sparkles, Theater } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { GROUPS, groupProfilePath } from '$lib/data/groups';
	import mastersIndex from '$lib/data/masters.index.json';
	import type { MasterIndexEntry } from '$lib/data/masters';

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
	 * Найновіші згори: людина зазвичай шукає свою групу, а не найдавнішу, і
	 * випускники останніх років приходять сюди частіше.
	 */
	const ordered = $derived(
		[...GROUPS].sort((a, b) => {
			const ya = Math.max(...a.graduationYears);
			const yb = Math.max(...b.graduationYears);
			return yb - ya || a.name.localeCompare(b.name, 'uk');
		})
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
				href={localizedPath('/projects/galaxy-graduates/', currentLang)}
				class="nav-back-link"
				data-testid="galaxy-groups-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.title')}</span>
			</a>
		</nav>

		<header class="groups-header">
			<h1 class="groups-header__title" data-testid="galaxy-groups-title">
				{$t('galaxy.groupsTitle', { default: 'Групи випускників' })}
			</h1>
			<p class="groups-header__count">
				{ordered.length}
			</p>
		</header>

		<ul class="groups-grid" data-testid="galaxy-groups-list">
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
							<span class="group-card__badge">
								<Theater size={13} aria-hidden="true" />
								{group.plays.length}
							</span>
						</span>

						{#if group.masters.length}
							<span class="group-card__masters">
								{group.masters.map((m) => masterName(m.id, m.name)).join(' · ')}
							</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</main>

<style>
	.groups-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
	}
	.groups-page__nav {
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
		transition: border-color var(--transition-base);
	}
	.nav-back-link:hover {
		border-color: var(--accent-primary);
	}

	.groups-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
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
	.group-card__masters {
		margin-top: auto;
		padding-top: 0.5rem;
		border-top: 1px dashed var(--border-main);
		font-size: 0.84rem;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
