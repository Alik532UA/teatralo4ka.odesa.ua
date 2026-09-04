<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { Users, MapPin } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { THEATRES, theatrePath, theatreSize } from '$lib/data/theatres';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import GalaxyAddCard from '$lib/components/galaxy/GalaxyAddCard.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/**
	 * Порядок — за кількістю наших людей, від більшої, потім за назвою.
	 *
	 * Те саме правило, що в переліку навчальних закладів, і з тієї ж причини:
	 * театр, у якому працюють двоє, важить у житті школи більше за той, де один,
	 * а другий ключ тримає порядок стійким між збірками.
	 */
	const театри = $derived(
		[...THEATRES].sort(
			(a, b) => theatreSize(b) - theatreSize(a) || a.name.localeCompare(b.name, isEn ? 'en' : 'uk')
		)
	);

	const усього = $derived(театри.reduce((сума, t) => сума + theatreSize(t), 0));
</script>

<svelte:head>
	<title>{$t('galaxy.theatresTitle')} | {$t('hero.title')}</title>
</svelte:head>

<main class="ths-page" data-testid="galaxy-theatres-panel">
	<div class="container">
				<GalaxyBreadcrumb
			backHref={localizedPath('/projects/galaxy-graduates/institutions/', currentLang)}
			backLabel={$t('galaxy.institutionsTitle')}
			backTestId="galaxy-theatres-back-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="galaxy-theatres-galaxy-link"
		/>

		<header class="ths-header">
			<h1 class="ths-header__title" data-testid="galaxy-theatres-title">
				{$t('galaxy.theatresTitle')}
			</h1>
			<p class="ths-header__count" data-testid="galaxy-theatres-total-count">
				{театри.length}
			</p>
		</header>

		<p class="ths-hint" data-testid="galaxy-theatres-hint-text">
			{$t('galaxy.theatresHint', { values: { people: усього } })}
		</p>

		<!--
			Звернення СТОЇТЬ НАД переліком — так само, як у виставах і закладах, і
			з тієї ж причини: воно про весь розділ, а не про якийсь один театр.
		-->
		<GalaxyAddCard
			title={$t('galaxy.addTheatre')}
			hint={$t('galaxy.addTheatreHint')}
			testIdPrefix="galaxy-theatre-add"
			variant="row"
		/>

		<ul class="ths-grid" data-testid="galaxy-theatres-list">
			{#each театри as театр (театр.slug)}
				<li>
					<a
						class="th-card"
						href={localizedPath(theatrePath(театр.slug), currentLang)}
						data-testid="galaxy-theatres-card-{театр.slug}"
					>
						<span class="th-card__head">
							<span class="th-card__name"
								>{isEn && театр.nameEn ? театр.nameEn : театр.name}</span
							>
							<span class="th-card__people">
								<Users size={13} aria-hidden="true" />
								{theatreSize(театр)}
							</span>
						</span>

						{#if театр.fullName}
							<span class="th-card__full">{театр.fullName}</span>
						{/if}

						<span class="th-card__meta">
							{#each театр.countries as code (code)}
								<span class="th-card__badge"><CountryFlag {code} /></span>
							{/each}
							{#if театр.city}
								<span class="th-card__badge">
									<MapPin size={12} aria-hidden="true" />
									{театр.city}
								</span>
							{/if}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</main>

<style>
	.ths-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main);
	}
	.ths-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	.ths-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.ths-header__count {
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
	.ths-hint {
		margin: 0 0 1.5rem;
		max-width: 62ch;
		color: var(--text-muted);
		font-size: 0.92rem;
		line-height: 1.5;
	}

	.ths-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
		gap: 0.9rem;
	}
	.th-card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		height: 100%;
		padding: 1rem 1.1rem;
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
	.th-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-main);
	}
	.th-card__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.6rem;
	}
	.th-card__name {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.3;
	}
	.th-card__people {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
		color: var(--accent-primary);
		font-size: 0.85rem;
		font-weight: 700;
	}
	.th-card__full {
		font-size: 0.8rem;
		color: var(--text-muted);
		line-height: 1.35;
	}
	.th-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: auto;
		padding-top: 0.5rem;
	}
	.th-card__badge {
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
</style>
