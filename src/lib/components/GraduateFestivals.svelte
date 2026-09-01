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

<!--
	Прапори сніпетом, бо місце в рядку в них РІЗНЕ.
	Де саме — нижче, біля кожного виклику.
-->
{#snippet flagsOf(festival: Festival)}
	<span class="fests__flags">
		{#each festival.countries as code (code)}
			<CountryFlag {code} title={$t(`galaxy.country.${code}`)} />
		{/each}
	</span>
{/snippet}

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
						<!--
							Без мініатюр прапор стоїть УСЕРЕДИНІ плашки: сама плашка й є
							тут візуальною межею рядка, і прапор поза нею читався як
							нічий. Так було в анкеті випускника, доки прапори не
							переїхали звідси заради мініатюр.
						-->
						{#if !showMembers}{@render flagsOf(festival)}{/if}
					</a>

					<!--
						Мініатюри — МІЖ назвою і прапорами, у тому самому рядку.
						Рядком нижче вони розтягували картку вдвічі, і зв'язок «ці
						обличчя — цієї поїздки» читався гірше, ніж коли все на одній
						лінії.
						Сестринські до посилання, а не всередині: мініатюри самі є
						посиланнями, а `<a>` в `<a>` валить сторінку (гейт
						`nested-interactive`).
					-->
					{#if showMembers}
						<!--
							`fitToWidth`: рядок фестивалю розтягується на всю ширину, тож
							число облич беремо із заміру. `max` лишається запасним — до
							першого заміру й на сервері.
						-->
						<GraduateAvatarRow
							ids={festival.memberIds}
							testIdPrefix="{testIdPrefix}-members-{festival.slug}"
							max={16}
							fitToWidth
							inline
						/>
					{/if}

					<!--
						З мініатюрами плашка обіймає лише назву, а межею рядка стає сама
						картка — тож прапор іде за обличчями, до її правого краю.
					-->
					{#if showMembers}{@render flagsOf(festival)}{/if}
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
		/* Запит контейнера, а не екрана: той самий перелік стоїть і на всю ширину
		   сторінки викладача, і в колонці анкети випускника. */
		container-type: inline-size;
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
	.fests__row {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
	}

	/*
	 * Вузько — обличчя на ВЛАСНИЙ рядок.
	 *
	 * В один рядок назва «Слов'янський вінок» з'їдає майже все, і на телефоні
	 * обличчям лишалося 60 пікселів — заміряно: одне обличчя й плашка «+30», яку
	 * ще й обрізало. Це не показ складу, а натяк на нього. На своєму рядку в ті
	 * самі 375 пікселів влазить десяток.
	 *
	 * Прапори лишаються біля назви: вони про те саме, що й назва — куди їздили.
	 */
	@container (max-width: 560px) {
		.fests__row--card {
			flex-wrap: wrap;
		}
		.fests__row--card :global(ul.mates--inline) {
			order: 1;
			flex-basis: 100%;
		}
	}

	.fests__row--card {
		border-radius: var(--radius-md, 12px);
		/* Напівпрозоро в спокої, повністю під курсором — так само, як у рядках
		   переліків галактики. Однаковий рядок мусить і поводитися однаково. */
		background: color-mix(in srgb, var(--bg-surface), transparent 50%);
		border: 1px solid var(--border-main);
		padding: 0.35rem 0.6rem;
		transition:
			background var(--transition-base),
			border-color var(--transition-base);
	}
	.fests__row--card:hover {
		background: var(--bg-surface);
		border-color: var(--accent-primary);
	}
	.fests__link {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
		/*
		 * НА ВСЮ ширину рядка — саме тому прапор виявляється праворуч, а не
		 * впритул до назви: його `margin-left: auto` має що з'їсти лише тоді, коли
		 * у плашці є вільне місце. Плашка, що тягнеться під назву, ліпила прапор
		 * до тексту й давала різну довжину в кожному рядку.
		 *
		 * У варіанті з мініатюрами (`--bare`) навпаки — там плашка не росте, бо
		 * вільне місце потрібне обличчям.
		 */
		flex: 1 1 auto;
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
	/*
	 * Модифікатор мусить стояти ПІСЛЯ базового правила.
	 *
	 * Вага в них однакова (по одному класу плюс хеш області), тож вирішує лише
	 * порядок у файлі. Доти `--bare` стояв ВИЩЕ за базове — і не працював зовсім:
	 * фон, рамка й відступи приходили з базового, тобто плашка з назвою малювалася
	 * всередині картки рядка як контейнер у контейнері. Заміряно: `background`
	 * `rgb(0, 36, 47)`, рамка 1 px, `border-radius` 10 px — усе з базового, попри
	 * `background: none` тут.
	 */
	.fests__link--bare {
		background: none;
		border: 0;
		padding: 0;
		/*
		 * НЕ розтягується: вільне місце віддається мініатюрам, а не назві. Саме
		 * через це обличчя й починаються ОДРАЗУ після назви, а не з середини
		 * рядка — доки базове `flex: 1 1 auto` перемагало, назва з'їдала всю
		 * ширину до прапорів.
		 */
		flex: 0 1 auto;
	}
	.fests__link--bare:hover {
		transform: none;
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
		flex-shrink: 0;
		font-size: 1rem;
		line-height: 1;
		letter-spacing: normal;
	}
</style>
