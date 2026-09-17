<script lang="ts">
	import { asset } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { EXPERTS, expertPath } from '$lib/data/experts';
	import { INSTITUTIONS } from '$lib/data/institutions';
	import { FESTIVALS } from '$lib/data/festivals';
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

	const VISIBLE_EXPERTS = EXPERTS.filter((e) => !e.hidden && !e.hiddenFromMasters);

	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/** Найсвіжіша посада — за нею ж рядок і стає в хронологію. */
	const рікПосади = (e: (typeof VISIBLE_EXPERTS)[number]) =>
		e.titles.reduce((макс, t) => Math.max(макс, t.year), 0);

	/**
	 * ПОРЯДОК: спершу ті, з ким у нас найбільше зв'язків, — і всередині рівних
	 * випадково.
	 *
	 * Доти перелік ішов за абеткою, і це давало хибну картину розділу: людина,
	 * яка вела в нас цілий курс, стояла після того, кого запросили одного разу
	 * в журі, — бо в неї прізвище на «С». Кількість зв'язків — єдине, що тут
	 * справді різне, і саме вона мусить вирішувати.
	 *
	 * Випадковість у межах рівних — щоб не виходило, ніби перші троє з нуля
	 * зв'язків чимось важливіші за решту тридцяти. Той самий прийом і з тих
	 * самих причин стоїть на сторінці навчального закладу.
	 */
	const зв_язків = (slug: string) => (студентиФахівця[slug] ?? []).length;

	/**
	 * ЧОМУ РОЗДІЛ БІЛЬШЕ НЕ ЗВЕТЬСЯ «ЕКСПЕРТНА РАДА».
	 *
	 * Заміряно на реєстрі: з тридцяти семи людей на фестивалі були 25, майстрами
	 * курсу в наших випускників — 17, і ОБОМА водночас лише п'ятеро. Тобто
	 * дванадцять людей у переліку в жодній експертній раді не сиділи — вони
	 * ведуть курси, на яких учаться наші. Назва «Експертна Рада» казала про них
	 * неправду, і автор помітив це на конкретних іменах.
	 *
	 * Назва-парасолька мусить бути правдивою для ВСІХ. «Майстри курсів» була б
	 * не кращою за попередню, а гіршою: вона бреше про двадцятьох із тридцяти
	 * семи замість дванадцятьох. Тому «Майстри і фахівці» — рівно два способи,
	 * якими ці люди пов'язані зі школою, і фільтр нижче ділить їх за тим самим.
	 */
	const наФестивалі = new Set(
		FESTIVALS.flatMap((f) => [...(f.expertIds ?? []), ...(f.coachIds ?? []), ...(f.guestIds ?? [])])
	);

	const ФІЛЬТРИ = ['all', 'council', 'teaching'] as const;
	type Фільтр = (typeof ФІЛЬТРИ)[number];
	let фільтр = $state<Фільтр>('all');

	const підходить = (slug: string, який: Фільтр) =>
		який === 'all' ? true
		: який === 'council' ? наФестивалі.has(slug)
		: зв_язків(slug) > 0;

	const скільки = (який: Фільтр) => VISIBLE_EXPERTS.filter((e) => підходить(e.slug, який)).length;

	const ПІДПИСИ: Record<Фільтр, string> = {
		all: 'galaxy.mastersAll',
		council: 'galaxy.mastersCouncil',
		teaching: 'galaxy.mastersTeaching'
	};

	/*
	 * До гідратації — стабільний порядок: пререндерена розмітка мусить мати
	 * ЯКИЙСЬ порядок, і осмислений кращий за довільний, якщо скрипт не дійде.
	 * Перемішування живе в `$effect`, бо `$derived` рахувався б і на сервері —
	 * і клієнт побачив би іншу розмітку, ніж приїхала з мережі.
	 */
	const базовий = $derived(
		[...VISIBLE_EXPERTS].sort(
			(a, b) =>
				зв_язків(b.slug) - зв_язків(a.slug) ||
				(isEn && a.nameEn ? a.nameEn : a.name).localeCompare(
					isEn && b.nameEn ? b.nameEn : b.name,
					'uk'
				)
		)
	);

	/** Фішер—Йейтс. Чому не `sort(() => Math.random() - 0.5)` — у `GraduateAvatarRow`. */
	function перемішати<T>(list: T[]): T[] {
		const out = [...list];
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	let перемішані = $state<typeof VISIBLE_EXPERTS | null>(null);

	$effect(() => {
		/* Звичайний об'єкт, а не `Map`: лінтер вимагає `SvelteMap` для мутабельної
		   мапи в компоненті, а тут потрібне просто групування на один прохід. */
		const групи: Record<number, (typeof VISIBLE_EXPERTS)[number][]> = {};
		for (const e of VISIBLE_EXPERTS) (групи[зв_язків(e.slug)] ??= []).push(e);
		перемішані = Object.keys(групи)
			.map(Number)
			.sort((a, b) => b - a)
			.flatMap((n) => перемішати(групи[n]));
	});

	const фахівці = $derived((перемішані ?? базовий).filter((e) => підходить(e.slug, фільтр)));

	const заАдресою = $derived(new Map(фахівці.map((e) => [e.slug, e])));

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
	<title>{$t('galaxy.mastersTitle')} | {$t('hero.title')}</title>
</svelte:head>

<main class="experts-page" data-testid="galaxy-masters-panel">
	<div class="container">
		<GalaxyBreadcrumb
			withTrail
			trailTestId="galaxy-masters-from-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="galaxy-masters-galaxy-link"
		/>

		<GalaxyRegistry
			rows={рядки}
			storageKey="masters"
			defaultView="tiles"
			testIdPrefix="galaxy-masters"
			title={$t('galaxy.mastersTitle')}
			titleTestId="galaxy-masters-title"
			count={VISIBLE_EXPERTS.length}
			countTestId="galaxy-masters-total-count"
			hint={$t('galaxy.mastersHint', { values: { people: VISIBLE_EXPERTS.length } })}
			hintTestId="galaxy-masters-hint-text"
			matches={збіг}
			placeholderKey="galaxy.expertsSearch"
			nothingKey="galaxy.expertsSearchNothing"
			tiles={плиткаФахівців}
			scope={фільтри}
		/>
	</div>
</main>

<!--
	ФІЛЬТР — між пошуком і переліком, у тому самому місці, де в груп і вистав
	стоїть рядок «показано N з M». Три кнопки, а не список, бо їх завжди три й
	вони не ростуть: це не довільна вибірка, а два способи бути пов'язаним зі
	школою плюс «усі».
-->
{#snippet фільтри()}
	<div class="masters-filter" role="group" aria-label={$t('galaxy.mastersTitle')}>
		{#each ФІЛЬТРИ as який (який)}
			<button
				type="button"
				class="masters-filter__btn"
				class:masters-filter__btn--on={фільтр === який}
				aria-pressed={фільтр === який}
				onclick={() => (фільтр = який)}
				data-testid="galaxy-masters-filter-btn-{який}"
			>
				{$t(ПІДПИСИ[який])}
				<span class="masters-filter__count">{скільки(який)}</span>
			</button>
		{/each}
	</div>
{/snippet}

<!--
	Плитка — та сама картка людини, що на поїздці, у групі й на сторінці самого
	фахівця. Своя картка тут означала б четвертий вигляд однієї сутності.
-->
{#snippet плиткаФахівців(рядкиПлитки: readonly GalaxyRow[])}
	<div class="people-grid" data-testid="galaxy-masters-list">
		{#each рядкиПлитки as row, idx (row.key)}
			{@const фахівець = заАдресою.get(row.key)!}
			<GroupPersonCard
				name={isEn && фахівець.nameEn ? фахівець.nameEn : фахівець.name}
				photo={фахівець.photo ? asset(фахівець.photo) : null}
				subtitle={фахівець.city}
				href={localizedPath(expertPath(фахівець.slug), currentLang)}
				splitName
				index={idx}
				testid="galaxy-masters-card-{фахівець.slug}"
				memberIds={row.memberIds}
				memberTestIdPrefix="galaxy-masters-members-{фахівець.slug}"
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
	.masters-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 1rem;
	}
	.masters-filter__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 0.9rem;
		border-radius: var(--radius-full, 9999px);
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--transition-base);
	}
	.masters-filter__btn:hover {
		border-color: var(--accent-primary);
	}
	/* Обраний позначений РАМКОЮ й товщиною, а не заливкою акцентом: акцент як
	   тло під текстом уже двічі валив `contrast.test.ts` у темах «yellow» і
	   «light». */
	.masters-filter__btn--on {
		border-color: var(--accent-primary);
		border-width: 2px;
		color: var(--text-title);
	}
	.masters-filter__count {
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
