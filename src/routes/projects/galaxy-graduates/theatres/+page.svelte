<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { Users, MapPin } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { THEATRES, theatrePath, theatreSize } from '$lib/data/theatres';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';
	import GalaxyAddCard from '$lib/components/galaxy/GalaxyAddCard.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import GalaxyRegistry from '$lib/components/galaxy/GalaxyRegistry.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';

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

	/**
	 * Ті самі театри у спільній формі рядка — для хронології та списку.
	 *
	 * Рік — НАЙРАНІШИЙ початок роботи з відомих: у хронології рядок стоїть під
	 * заголовком раз, і осмислено поставити його там, де наш перший там
	 * з'явився. Театрів без жодного року двоє (у їхніх анкетах років немає), і
	 * для них рік — 0: у хронології вони йдуть окремим заголовком у кінці, а не
	 * прикидаються сьогоднішніми.
	 *
	 * `memberIds` — і є ті обличчя, яких на цій сторінці бракувало: `GalaxyRows`
	 * малює їх сам, щойно ключі є.
	 */
	const рядки = $derived<GalaxyRow[]>(
		театри.map((театр) => {
			const роки = театр.members.map((m) => m.since).filter((y): y is number => !!y);
			return {
				key: театр.slug,
				href: localizedPath(theatrePath(театр.slug), currentLang),
				year: роки.length ? Math.min(...роки) : 0,
				title: isEn && театр.nameEn ? театр.nameEn : театр.name,
				subtitle: [театр.city, театр.fullName].filter(Boolean).join(' · ') || undefined,
				memberIds: театр.members.map((m) => m.id),
				flags: театр.countries.map((code) => ({ code, label: $t(`galaxy.country.${code}`) }))
			};
		})
	);

	/*
	 * Мапа «адреса → театр»: плитка малює лише ЗНАЙДЕНІ рядки, а картці потрібен
	 * сам театр із усіма полями. Без мапи плитка або показувала б усе (тобто
	 * пошук у ній не діяв би), або мусила б нести всі поля в рядку — а рядок
	 * спільний, і полів театру в нього не покладеш.
	 */
	const театриЗаАдресою = $derived(new Map(театри.map((t) => [t.slug, t])));

	/* Пошук іде ще й по місту та повній назві — те, чого типовий збіг не знає. */
	const збіг = (row: GalaxyRow, q: string) =>
		`${row.title} ${row.subtitle ?? ''}`.toLowerCase().includes(q);
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

		<GalaxyRegistry
			rows={рядки}
			storageKey="theatres"
			testIdPrefix="galaxy-theatres"
			title={$t('galaxy.theatresTitle')}
			titleTestId="galaxy-theatres-title"
			count={театри.length}
			countTestId="galaxy-theatres-total-count"
			hint={$t('galaxy.theatresHint', { values: { people: усього } })}
			hintTestId="galaxy-theatres-hint-text"
			matches={збіг}
			placeholderKey="galaxy.theatresSearch"
			nothingKey="galaxy.theatresSearchNothing"
			tiles={плиткаТеатрів}
			addCard={зверненняДодати}
		/>
	</div>
</main>

<!--
	Звернення «Додати» — сніпетом, бо його МІСЦЕ спільне (між пошуком і
	переліком), а текст і значки свої. Доти воно стояло вище за назву розділу, і
	вся шапка через це з'їжджала — розбір у пропі `addCard` `GalaxyRegistry`.
-->
{#snippet зверненняДодати()}
	<GalaxyAddCard
		title={$t('galaxy.addTheatre')}
		hint={$t('galaxy.addTheatreHint')}
		testIdPrefix="galaxy-theatre-add"
		variant="row"
	/>
{/snippet}

<!--
	Плитка — ВЛАСНА, і це не виняток із спільного переліку, а його задум: у
	театру в картці місто, повна назва й число людей, у закладу освіти інше, у
	вистави третє. Спільним лишається зв'язування (пошук, режими, обличчя,
	картка на місці), а картка своя. Розбір — у докблоці `GalaxyRegistry`.
-->
{#snippet плиткаТеатрів(рядкиПлитки: readonly GalaxyRow[])}
	<ul class="ths-grid" data-testid="galaxy-theatres-list">
			{#each рядкиПлитки.map((row) => театриЗаАдресою.get(row.key)!) as театр (театр.slug)}
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

						<!--
							Мініатюри учасників — той самий рядок, що в плитці фестивалів.
							`linked={false}`: сама плитка вже посилання, а `<a>` в `<a>`
							валить сторінку (гейт `nested-interactive`). Свій
							`testIdPrefix` із адресою: таких рядків на сторінці стільки ж,
							скільки плиток.
						-->
						<GraduateAvatarRow
							ids={театр.members.map((m) => m.id)}
							linked={false}
							testIdPrefix="galaxy-theatres-members-{театр.slug}"
							max={20}
							fitToWidth
						/>
					</a>
				</li>
			{/each}
	</ul>
{/snippet}

<style>
	.ths-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main);
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
