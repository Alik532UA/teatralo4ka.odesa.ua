<script lang="ts">
	import { asset } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { EXPERTS, expertPath } from '$lib/data/experts';
	import { INSTITUTIONS } from '$lib/data/institutions';
	import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import GalaxyRegistry from '$lib/components/galaxy/GalaxyRegistry.svelte';
	import type { GalaxyRow } from '$lib/components/galaxy/galaxyRow';

	/**
	 * Перелік запрошених фахівців — шостий розділ галактики.
	 *
	 * ## Чому його доти не було
	 *
	 * Сторінки окремих фахівців існували з першого дня, а спільного переліку —
	 * ні: зайти до них можна було ЛИШЕ зі сторінки фестивалю, тобто знаючи
	 * наперед, на який фестиваль людина приїздила. Тридцять сім сторінок, до
	 * яких немає входу з сайту.
	 *
	 * ## Чому `GalaxyRegistry`, а не власна розмітка
	 *
	 * Прохання автора — «по дизайну як сторінка викладачів»: шапка з назвою й
	 * числом, пошук, перемикач вигляду, сітка. Рівно це вже робить спільний
	 * перелік галактики, яким живуть заклади, театри, групи, вистави й
	 * фестивалі. Повторювати ту саму шапку шостою копією означало б, що вона
	 * почне розходитися з п'ятьма сусідніми — а читач переходить між ними за
	 * два натискання.
	 *
	 * ## Чому плиткою за замовчуванням
	 *
	 * Та сама причина, що в закладів і театрів: рік тут слабка вісь. У фахівця
	 * він означає рік ПОСАДИ, а не подію, і хронологія розкидала б людей по
	 * заголовках, які нічого не пояснюють.
	 */

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/** Найсвіжіша посада — за нею ж рядок і стає в хронологію. */
	const рікПосади = (e: (typeof EXPERTS)[number]) =>
		e.titles.reduce((макс, t) => Math.max(макс, t.year), 0);

	const фахівці = $derived(
		[...EXPERTS].sort((a, b) =>
			(isEn && a.nameEn ? a.nameEn : a.name).localeCompare(isEn && b.nameEn ? b.nameEn : b.name, 'uk')
		)
	);

	const заАдресою = $derived(new Map(фахівці.map((e) => [e.slug, e])));

	/*
	 * Обличчя в рядку — це СТУДЕНТИ фахівця, а не учасники поїздок.
	 *
	 * `masterSlug` лежить у студента (`institutions.data.json`), тож зріз
	 * рахується одним перебором. Для більшості він порожній — фахівця кликали
	 * в журі, а не вчити курс, — і рядок тоді просто без облич. Показувати
	 * натомість учасників фестивалю було б неправдою: вони не його люди.
	 */
	const студентиФахівця: Record<string, string[]> = {};
	for (const заклад of INSTITUTIONS)
		for (const s of заклад.students)
			if (s.masterSlug) (студентиФахівця[s.masterSlug] ??= []).push(s.id);

	const рядки = $derived<GalaxyRow[]>(
		фахівці.map((e) => ({
			key: e.slug,
			href: localizedPath(expertPath(e.slug), currentLang),
			year: рікПосади(e),
			title: isEn && e.nameEn ? e.nameEn : e.name,
			subtitle: e.city,
			memberIds: студентиФахівця[e.slug] ?? []
		}))
	);

	/*
	 * Посада в пошуку — навмисно: людину частіше пам'ятають як «режисера
	 * Франка», ніж на ім'я. Місто теж, бо фахівці приїздять із різних міст, і
	 * «хто до нас приїздив із Києва» — питання, яке ставлять.
	 */
	const збіг = (row: GalaxyRow, query: string) => {
		const e = заАдресою.get(row.key);
		if (!e) return false;
		const q = query.trim().toLowerCase();
		return [e.name, e.nameEn ?? '', e.city ?? '', ...e.titles.map((x) => x.text)]
			.join(' ')
			.toLowerCase()
			.includes(q);
	};
</script>

<svelte:head>
	<title>{$t('galaxy.festivalExperts')} | {$t('hero.title')}</title>
</svelte:head>

<main class="experts-page" data-testid="galaxy-experts-panel">
	<div class="container">
		<GalaxyBreadcrumb
			withTrail
			trailTestId="galaxy-experts-from-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="galaxy-experts-galaxy-link"
		/>

		<GalaxyRegistry
			rows={рядки}
			storageKey="experts"
			defaultView="tiles"
			testIdPrefix="galaxy-experts"
			title={$t('galaxy.festivalExperts')}
			titleTestId="galaxy-experts-title"
			count={фахівці.length}
			countTestId="galaxy-experts-total-count"
			hint={$t('galaxy.expertsHint', { values: { people: фахівці.length } })}
			hintTestId="galaxy-experts-hint-text"
			matches={збіг}
			placeholderKey="galaxy.expertsSearch"
			nothingKey="galaxy.expertsSearchNothing"
			tiles={плиткаФахівців}
		/>
	</div>
</main>

<!--
	Плитка — та сама картка людини, що на поїздці, у групі й на сторінці самого
	фахівця. Своя картка тут означала б четвертий вигляд однієї сутності.
-->
{#snippet плиткаФахівців(рядкиПлитки: readonly GalaxyRow[])}
	<div class="people-grid" data-testid="galaxy-experts-list">
		{#each рядкиПлитки.map((row) => заАдресою.get(row.key)!) as фахівець, idx (фахівець.slug)}
			<GroupPersonCard
				name={isEn && фахівець.nameEn ? фахівець.nameEn : фахівець.name}
				photo={фахівець.photo ? asset(фахівець.photo) : null}
				subtitle={фахівець.city}
				href={localizedPath(expertPath(фахівець.slug), currentLang)}
				splitName
				index={idx}
				testid="galaxy-experts-card-{фахівець.slug}"
			/>
		{/each}
	</div>
{/snippet}

<style>
	.experts-page {
		padding: var(--page-pad-top) 0 var(--page-pad-bottom);
	}

	/*
	 * Четверта копія тих самих восьми рядків (поїздка, група, сторінка фахівця,
	 * тут) — борг названий у докблоці сторінки поїздки й лише зростає. Виносити
	 * його треба разом зі сторінкою груп, і це окрема робота, а не примітка до
	 * нового розділу.
	 */
	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
		gap: 1rem;
	}
	@media (max-width: 767px) {
		.people-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}
	}
</style>
