<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { getFestivalsByMember, festivalPath } from '$lib/data/festivals';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';

	interface Props {
		/** СТІЙКИЙ ключ випускника, а не адреса: зв'язок тримається на `id`. */
		memberId: string;
	}

	let { memberId }: Props = $props();

	/*
	 * Фестивалі беруться з РЕЄСТРУ, а не з тексту «про себе».
	 *
	 * Доти вони жили трьома рядками в анкеті — «🇧🇬 Славянский венок, 2010 у
	 * Болгарії» — і на них не можна було натиснути: рядок не веде нікуди. Тепер
	 * той самий факт є зв'язком, тож картка веде на сторінку фестивалю, а сам
	 * рядок з анкети прибрано, щоб не було двох джерел однієї правди.
	 */
	const festivals = $derived(getFestivalsByMember(memberId));
	const isEn = $derived($locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	function whereOf(city: string | undefined, countries: string[]): string {
		const named = countries.map((c) => $t(`galaxy.country.${c}`)).join(' · ');
		return [city, named].filter(Boolean).join(', ');
	}
</script>

{#if festivals.length}
	<div class="fests" data-testid="galaxy-card-festivals-list">
		<span class="fests__title">{$t('galaxy.festivalsTitle')}:</span>
		<ul class="fests__list">
			{#each festivals as festival (festival.slug)}
				<li>
					<a
						class="fests__link"
						href={localizedPath(festivalPath(festival.slug), lang)}
						title={whereOf(festival.city, festival.countries)}
						data-testid="galaxy-card-festival-link-{festival.slug}"
					>
						<span class="fests__years">{festival.years.join(', ')}</span>
						<span class="fests__name">
							{isEn && festival.nameEn ? festival.nameEn : festival.name}
						</span>
						<span class="fests__flags">
							{#each festival.countries as code (code)}
								<CountryFlag {code} title={$t(`galaxy.country.${code}`)} />
							{/each}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.fests {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.fests__title {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
	.fests__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.fests__link {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.6rem;
		border-radius: var(--radius-md, 12px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-main);
		text-decoration: none;
		font-size: 0.88rem;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}
	.fests__link:hover {
		border-color: var(--accent-primary);
		transform: translateX(3px);
	}
	.fests__name {
		font-weight: 600;
		color: var(--text-title);
	}
	.fests__years {
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		font-size: 0.82rem;
	}
	/*
	 * БЕЗ letter-spacing — і це не косметика. Прапорець складається з ДВОХ
	 * символів-індикаторів, які шрифт зливає в один гліф; будь-який міжлітерний
	 * інтервал їх роз'єднує, і замість 🇺🇦 читач бачить «UA». Саме так прапорці
	 * тут і зникли з першого разу.
	 */
	.fests__flags {
		margin-left: auto;
		font-size: 1rem;
		line-height: 1;
		letter-spacing: normal;
	}
</style>
