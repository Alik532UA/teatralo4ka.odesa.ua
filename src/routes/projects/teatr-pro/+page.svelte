<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { TEATR_PRO_FESTIVALS } from '$lib/data/festivals';
	import { festivalRow } from '$lib/components/galaxy/festivalRow';
	import GalaxyRows from '$lib/components/galaxy/GalaxyRows.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';

	/**
	 * Загальна сторінка фестивалю — про сам фестиваль, а не про його випуск.
	 *
	 * Доти вона змішувала обидва: під заголовком «що таке Театр.PRO» одразу
	 * стояли «ІV-й», «5–6 червня 2026» і заявки того року. Тобто сторінка
	 * старіла разом із набором, і читач не міг зрозуміти, він дивиться на
	 * фестиваль чи на оголошення, яке вже минуло.
	 *
	 * Перелік випусків малюється ТИМ САМИМ рядком, що й повний перелік поїздок
	 * (`GalaxyRows` плюс спільний переклад `festivalRow`). Власна розкладка тут
	 * була, і автор попросив її прибрати: два різні вигляди того самого списку
	 * на сусідніх сторінках збивають сильніше, ніж будь-яка з двох розкладок
	 * поодинці.
	 *
	 * Фільтрів, пошуку й перемикача вигляду тут навмисно немає: у повному
	 * переліку сотня записів, а тут вісім рядків про одну подію в різні роки.
	 */

	let { data } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	const rows = $derived<GalaxyRow[]>(
		TEATR_PRO_FESTIVALS.map((f) => festivalRow(f, { isEn, lang: currentLang, t: $t }))
	);
</script>

<StaticPage
	{data}
	testPrefix="teatr-pro"
	backHref={resolve('/projects')}
	backLabel={$t('projects.backToProjects')}
/>

{#if rows.length > 0}
	<section class="fests container" aria-labelledby="teatr-pro-fests-title">
		<h2 class="fests__title" id="teatr-pro-fests-title" data-testid="teatr-pro-editions-title">
			{$t('teatrPro.editions')}
		</h2>

		<!--
			`grouped={false}` — рівний перелік із роком у самому рядку.
			Групування по роках тут не групує нічого: у кожного випуску свій рік,
			і заголовки просто подвоїли б числа.
		-->
		<GalaxyRows {rows} grouped={false} testIdPrefix="teatr-pro-editions" maxFaces={10} />
	</section>
{/if}

<style>
	.fests {
		margin: 0 auto 4rem;
	}

	.fests__title {
		font-family: var(--font-heading, sans-serif);
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		margin: 0 0 1rem;
		color: var(--text-title);
	}
</style>
