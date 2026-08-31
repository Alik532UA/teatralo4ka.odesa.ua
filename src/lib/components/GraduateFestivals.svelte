<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { festivalPath, type Festival } from '$lib/data/festivals';
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';

	interface Props {
		/**
		 * Готовий перелік, а не ключ людини.
		 *
		 * Доти компонент сам кликав `getFestivalsByMember` — і тим прив'язувався
		 * до ОДНОГО поля реєстру. На сторінці викладача потрібне інше
		 * (`masterIds`), а показ той самий; резолвити всередині означало б або
		 * другий проп-режим, або копію розмітки. Тепер хто кличе — той і
		 * вирішує, чиї це фестивалі.
		 */
		festivals: Festival[];
		/**
		 * Початок `data-testid`: блок є і в анкеті випускника, і на сторінці
		 * викладача, а `e2e/testid.spec.ts` вимагає унікальності в межах сторінки.
		 */
		testIdPrefix?: string;
		/**
		 * Мініатюри учасників — усередині картки того фестивалю, до якого вони
		 * належать.
		 *
		 * Перша спроба малювала їх окремим списком ПІД усіма фестивалями: два
		 * рядки облич висіли самі по собі, і з екрана не було видно, хто з якої
		 * поїздки. Тепер рядок стоїть у тому самому `<li>`, і картка обводить
		 * обох.
		 *
		 * Типово вимкнено: в анкеті випускника цей блок стоїть у вузькій колонці
		 * поряд із виставами, і тридцять облич на фестиваль розсунули б її.
		 */
		showMembers?: boolean;
		/**
		 * Свій підпис «Фестивалі:» над списком.
		 *
		 * Вимикається там, де блок уже стоїть у секції з таким самим заголовком
		 * — інакше слово «Фестивалі» читається двічі підряд.
		 */
		showTitle?: boolean;
	}

	let {
		festivals,
		testIdPrefix = 'galaxy-card-festivals',
		showMembers = false,
		showTitle = true
	}: Props = $props();

	/*
	 * Фестивалі беруться з РЕЄСТРУ, а не з тексту «про себе».
	 *
	 * Доти вони жили трьома рядками в анкеті — «🇧🇬 Славянский венок, 2010 у
	 * Болгарії» — і на них не можна було натиснути: рядок не веде нікуди. Тепер
	 * той самий факт є зв'язком, тож картка веде на сторінку фестивалю, а сам
	 * рядок з анкети прибрано, щоб не було двох джерел однієї правди.
	 */
	const isEn = $derived($locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	function whereOf(city: string | undefined, countries: string[]): string {
		const named = countries.map((c) => $t(`galaxy.country.${c}`)).join(' · ');
		return [city, named].filter(Boolean).join(', ');
	}
</script>

{#if festivals.length}
	<div class="fests" data-testid="{testIdPrefix}-list">
		{#if showTitle}
			<span class="galaxy-block-title">{$t('galaxy.festivalsTitle')}:</span>
		{/if}
		<ul class="fests__list">
			{#each festivals as festival (festival.slug)}
				<li class="fests__row" class:fests__row--card={showMembers}>
					<a
						class="fests__link"
						class:fests__link--bare={showMembers}
						href={localizedPath(festivalPath(festival.slug), lang)}
						title={whereOf(festival.city, festival.countries)}
						data-testid="{testIdPrefix}-link-{festival.slug}"
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

					<!--
						Рядок СЕСТРИНСЬКИЙ до посилання, а не всередині нього: мініатюри
						самі є посиланнями, а `<a>` в `<a>` валить сторінку (гейт
						`nested-interactive`).
					-->
					{#if showMembers}
						<GraduateAvatarRow
							ids={festival.memberIds}
							testIdPrefix="{testIdPrefix}-members-{festival.slug}"
						/>
					{/if}
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

	.fests__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	/* Коли мініатюри показуються, рамкою стає сам рядок — щоб посилання й обличчя
	   читалися як одна картка, а не як два сусідні блоки. */
	.fests__row--card {
		border-radius: var(--radius-md, 12px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		padding-bottom: 0.2rem;
		transition: border-color var(--transition-base);
	}
	.fests__row--card:hover {
		border-color: var(--accent-primary);
	}
	.fests__link--bare {
		background: none;
		border: 0;
	}
	.fests__link--bare:hover {
		transform: none;
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
