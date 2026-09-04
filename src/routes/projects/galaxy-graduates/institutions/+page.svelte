<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { Users, MapPin } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { INSTITUTIONS, institutionPath, institutionSize } from '$lib/data/institutions';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import GalaxyAddCard from '$lib/components/galaxy/GalaxyAddCard.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import GalaxyRegistry from '$lib/components/galaxy/GalaxyRegistry.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/**
	 * Порядок — за кількістю наших людей, від більшої.
	 *
	 * Не за абеткою: заклад, куди вступили семеро, і заклад з одним вступником
	 * — це різна вага в історії школи, і перелік мусить це показувати. Абетка
	 * поставила б «École de culture générale» першою.
	 *
	 * Другий ключ — назва, щоб порядок був стійкий: заклади з однаковим числом
	 * інакше стрибали б місцями між збірками.
	 */
	const заклади = $derived(
		[...INSTITUTIONS].sort(
			(a, b) =>
				institutionSize(b) - institutionSize(a) ||
				a.name.localeCompare(b.name, isEn ? 'en' : 'uk')
		)
	);

	const усього = $derived(заклади.reduce((сума, i) => сума + institutionSize(i), 0));

	/**
	 * Ті самі заклади у спільній формі рядка — для хронології та списку.
	 *
	 * Рік — НАЙРАНІШИЙ вступ із відомих: у хронології рядок стоїть під
	 * заголовком раз, і осмислено поставити його там, де наш перший туди
	 * вступив. У другого закладу поспіль року немає взагалі (розбір у полі
	 * `year` у `data/institutions.ts`), тож у частини рік вийде 0 — у
	 * хронології такі стоять окремим заголовком, а не прикидаються цьогорічними.
	 *
	 * `memberIds` — і є ті обличчя, яких на цій сторінці бракувало.
	 */
	const рядки = $derived<GalaxyRow[]>(
		заклади.map((заклад) => {
			const роки = заклад.students.map((s) => s.year).filter((y): y is number => !!y);
			return {
				key: заклад.slug,
				href: localizedPath(institutionPath(заклад.slug), currentLang),
				year: роки.length ? Math.min(...роки) : 0,
				title: isEn && заклад.nameEn ? заклад.nameEn : заклад.name,
				subtitle: [заклад.city, заклад.fullName].filter(Boolean).join(' · ') || undefined,
				memberIds: заклад.students.map((s) => s.id),
				flags: заклад.countries.map((code) => ({ code, label: $t(`galaxy.country.${code}`) }))
			};
		})
	);

	/*
	 * Мапа «адреса → заклад»: плитка малює лише ЗНАЙДЕНІ рядки, а картці
	 * потрібен сам заклад із усіма полями. Те саме рішення й та сама причина, що
	 * на сторінці театрів.
	 */
	const закладиЗаАдресою = $derived(new Map(заклади.map((i) => [i.slug, i])));

	/* Пошук іде ще й по місту та повній назві — те, чого типовий збіг не знає. */
	const збіг = (row: GalaxyRow, q: string) =>
		`${row.title} ${row.subtitle ?? ''}`.toLowerCase().includes(q);
</script>

<svelte:head>
	<title>{$t('galaxy.institutionsTitle')} | {$t('hero.title')}</title>
</svelte:head>

<main class="insts-page" data-testid="galaxy-institutions-panel">
	<div class="container">
				<GalaxyBreadcrumb
			backHref={localizedPath('/projects/galaxy-graduates/plays/', currentLang)}
			backLabel={$t('galaxy.playsTitle')}
			backTestId="galaxy-institutions-back-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="galaxy-institutions-galaxy-link"
		/>

		<header class="insts-header">
			<h1 class="insts-header__title" data-testid="galaxy-institutions-title">
				{$t('galaxy.institutionsTitle')}
			</h1>
			<p class="insts-header__count" data-testid="galaxy-institutions-total-count">
				{заклади.length}
			</p>
		</header>

		<p class="insts-hint" data-testid="galaxy-institutions-hint-text">
			{$t('galaxy.institutionsHint', { values: { people: усього } })}
		</p>

		<!--
			Звернення СТОЇТЬ НАД переліком — так само, як у виставах, і з тієї ж
			причини: воно про весь розділ, а не про якийсь один заклад.
		-->
		<GalaxyAddCard
			title={$t('galaxy.addInstitution')}
			hint={$t('galaxy.addInstitutionHint')}
			testIdPrefix="galaxy-institution-add"
			variant="row"
		/>

		<GalaxyRegistry
			rows={рядки}
			storageKey="institutions"
			testIdPrefix="galaxy-institutions"
			matches={збіг}
			placeholderKey="galaxy.institutionsSearch"
			nothingKey="galaxy.institutionsSearchNothing"
			tiles={плиткаЗакладів}
		/>
	</div>
</main>

<!--
	Плитка — ВЛАСНА: у закладу в картці повна назва, місто й число вступників.
	Спільним лишається зв'язування; розбір — у докблоці `GalaxyRegistry`.
-->
{#snippet плиткаЗакладів(рядкиПлитки: readonly GalaxyRow[])}
	<ul class="insts-grid" data-testid="galaxy-institutions-list">
			{#each рядкиПлитки.map((row) => закладиЗаАдресою.get(row.key)!) as заклад (заклад.slug)}
				<li>
					<a
						class="inst-card"
						href={localizedPath(institutionPath(заклад.slug), currentLang)}
						data-testid="galaxy-institutions-card-{заклад.slug}"
					>
						<span class="inst-card__head">
							<span class="inst-card__name"
								>{isEn && заклад.nameEn ? заклад.nameEn : заклад.name}</span
							>
							<span class="inst-card__people">
								<Users size={13} aria-hidden="true" />
								{institutionSize(заклад)}
							</span>
						</span>

						{#if заклад.fullName}
							<span class="inst-card__full">{заклад.fullName}</span>
						{/if}

						<span class="inst-card__meta">
							{#each заклад.countries as code (code)}
								<span class="inst-card__badge"><CountryFlag {code} /></span>
							{/each}
							{#if заклад.city}
								<span class="inst-card__badge">
									<MapPin size={12} aria-hidden="true" />
									{заклад.city}
								</span>
							{/if}
						</span>
					</a>
				</li>
			{/each}
	</ul>
{/snippet}

<style>
	.insts-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main);
	}
	.insts-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	.insts-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.insts-header__count {
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
	.insts-hint {
		margin: 0 0 1.5rem;
		max-width: 62ch;
		color: var(--text-muted);
		font-size: 0.92rem;
		line-height: 1.5;
	}

	.insts-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
		gap: 0.9rem;
	}
	.inst-card {
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
	.inst-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-main);
	}
	.inst-card__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.6rem;
	}
	.inst-card__name {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.3;
	}
	.inst-card__people {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
		color: var(--accent-primary);
		font-size: 0.85rem;
		font-weight: 700;
	}
	.inst-card__full {
		font-size: 0.8rem;
		color: var(--text-muted);
		line-height: 1.35;
	}
	.inst-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: auto;
		padding-top: 0.5rem;
	}
	.inst-card__badge {
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
