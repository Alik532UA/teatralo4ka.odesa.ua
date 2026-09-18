<script lang="ts">
	import { asset } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { FRIENDS, FRIENDS_DIR, matchesFriendQuery } from '$lib/data/friends';
	import { expertPath } from '$lib/data/experts';
	import { LayoutGrid, List } from 'lucide-svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import GalaxyRegistryHeader from '$lib/components/galaxy/GalaxyRegistryHeader.svelte';
	import PhotoLightbox from '$lib/components/PhotoLightbox.svelte';
	import { createViewState } from '$lib/services/galaxyViewMode.svelte';
	import type { ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';

	/**
	 * Друзі школи — стіна підписаних карток.
	 *
	 * ## Чому шапка спільна, а рядків немає
	 *
	 * Шапка — `GalaxyRegistryHeader`, той самий, що в п'яти сусідніх переліків:
	 * пошук і перемикач вигляду мусять стояти на однакових місцях, інакше
	 * розділи галактики починають відрізнятися дрібницями (саме через це той
	 * компонент і з'явився).
	 *
	 * А `GalaxyRows` тут не стоїть, і це записано в самому гейті
	 * (`galaxy-registry.test.ts`, `БЕЗ_РЯДКІВ`). Рядок веде на сторінку сутності
	 * й стає під заголовок року. У друга школи немає ні власної сторінки, ні
	 * року: рік написаний рукою всередині знімка. Рядок довелося б вигадати — з
	 * порожнім посиланням і роком «0», — і хронологія показала б один заголовок
	 * «0» на весь розділ.
	 *
	 * Два режими натомість справжні: КАРТКИ (сам артефакт) і СПИСОК (імена з
	 * фахом, коли треба швидко проглянути, хто тут є).
	 *
	 * ## Чому дві величини знімка
	 *
	 * Картка в сітці — 480 px (≈24 КБ), на весь екран — 1280 px (≈110 КБ).
	 * Одна величина на обидва випадки коштувала б або 2.4 МБ на відкриття
	 * сторінки, або нечитабельного почерку в лайтбоксі: рукописний текст —
	 * половина того, заради чого картку й показують.
	 */

	const isEn = $derived($locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	let запит = $state('');

	/**
	 * ПОРЯДОК ВИПАДКОВИЙ — і це рішення про зміст, а не про показ.
	 *
	 * У даних картки лежать так, як їх сканували: спершу вся жовта серія, потім
	 * помаранчева. Показувати цей порядок означало б робити з нього рейтинг —
	 * перші четверо щоразу ті самі, а старша серія завжди в хвості. Жодного
	 * старшинства між друзями школи немає, тож його не показує й сторінка.
	 *
	 * До гідратації лишається порядок даних: пререндерена розмітка мусить мати
	 * ЯКИЙСЬ порядок, якщо скрипт не дійде. Перемішування живе в `$effect`, бо
	 * `$derived` рахувався б і на сервері — і клієнт побачив би іншу розмітку,
	 * ніж приїхала з мережі. Той самий прийом стоїть на сторінці закладу освіти.
	 */
	function перемішати<T>(list: readonly T[]): T[] {
		const out = [...list];
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	/* `$derived` тут саме те, чого не можна: він порахувався б і на сервері, і
	   клієнт отримав би розмітку з іншим порядком, ніж приїхала з мережі. */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let порядок = $state<typeof FRIENDS | null>(null);
	$effect(() => {
		порядок = перемішати(FRIENDS);
	});

	const знайдені = $derived(
		(порядок ?? FRIENDS).filter((f) => matchesFriendQuery(f, запит))
	);

	const вигляд = createViewState('friends', ['tiles', 'list'] as const, 'tiles');
	const РЕЖИМИ = $derived<ViewOption[]>([
		{ value: 'tiles', label: $t('galaxy.viewModes.tiles'), icon: LayoutGrid },
		{ value: 'list', label: $t('galaxy.viewModes.list'), icon: List }
	]);

	const імя = (f: (typeof FRIENDS)[number]) => (isEn && f.nameEn ? f.nameEn : f.name);

	/*
	 * Лайтбокс отримує ЗНАЙДЕНИХ, а не всіх: інакше стрілки «вперед-назад»
	 * водили б по картках, яких на екрані немає, і людина після пошуку
	 * опинялася б у когось стороннього.
	 */
	const знімки = $derived(
		знайдені.map((f) => ({
			src: asset(`${FRIENDS_DIR}/${f.slug}.webp`),
			alt: імя(f),
			title: `${імя(f)} — ${f.role[lang]}`
		}))
	);

	let відкрито = $state(false);
	let поточний = $state(0);

	function відкрити(i: number) {
		поточний = i;
		відкрито = true;
	}
</script>

<svelte:head>
	<title>{$t('galaxy.friendsTitle')} | {$t('hero.title')}</title>
</svelte:head>

<main class="friends-page" data-testid="galaxy-friends-panel">
	<div class="container">
		<GalaxyBreadcrumb
			withTrail
			trailTestId="galaxy-friends-from-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', lang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="galaxy-friends-galaxy-link"
		/>

		<GalaxyRegistryHeader
			title={$t('galaxy.friendsTitle')}
			titleTestId="galaxy-friends-title"
			count={FRIENDS.length}
			countTestId="galaxy-friends-total-count"
			hint={$t('galaxy.friendsHint', { values: { people: FRIENDS.length } })}
			hintTestId="galaxy-friends-hint-text"
			searchValue={запит}
			onSearch={(v) => (запит = v)}
			found={знайдені.length}
			placeholderKey="galaxy.friendsSearch"
			nothingKey="galaxy.friendsSearchNothing"
			searchTestId="galaxy-friends-search"
			viewMode={вигляд.current}
			onView={(m) => вигляд.set(m)}
			viewOptions={РЕЖИМИ}
			viewTestId="galaxy-friends-view"
		/>

		<ul class="friends-grid" class:friends-grid--list={вигляд.current === 'list'} data-testid="galaxy-friends-list">
			{#each знайдені as друг, i (друг.slug)}
				<li class="friend" data-testid="galaxy-friends-card-{друг.slug}">
					{#if друг.expertSlug}
						<!--
							Для митців із власною сторінкою вся картка (зображення, ім'я,
							опис, кнопка) веде на сторінку митця, а повний знімок
							розгортається вже на ній.
						-->
						<a
							class="friend__link"
							href={localizedPath(expertPath(друг.expertSlug), lang)}
							data-testid="galaxy-friends-expert-link-{друг.slug}"
							aria-label={`${імя(друг)} — ${$t('galaxy.friendExpertLink')}`}
						>
							{#if вигляд.current === 'tiles'}
								<div class="friend__shot">
									<img
										src={asset(`${FRIENDS_DIR}/${друг.slug}-480.webp`)}
										width={друг.thumb.w}
										height={друг.thumb.h}
										alt={імя(друг)}
										loading="lazy"
									/>
								</div>
							{/if}
							<div class="friend__text">
								<span class="friend__name">{імя(друг)}</span>
								<span class="friend__role">{друг.role[lang]}</span>
								<span class="friend__expert-btn">
									{$t('galaxy.friendExpertLink')}
								</span>
							</div>
						</a>
					{:else}
						<!--
							Картка без власної сторінки: розгортається на весь екран
							на місці у фотолайтбоксі.
						-->
						{#if вигляд.current === 'tiles'}
							<button
								type="button"
								class="friend__shot"
								onclick={() => відкрити(i)}
								aria-label={`${імя(друг)} — ${$t('galaxy.friendOpenCard')}`}
								data-testid="galaxy-friends-open-btn-{друг.slug}"
							>
								<img
									src={asset(`${FRIENDS_DIR}/${друг.slug}-480.webp`)}
									width={друг.thumb.w}
									height={друг.thumb.h}
									alt={імя(друг)}
									loading="lazy"
								/>
							</button>
						{/if}
						<div class="friend__text">
							<span class="friend__name">{імя(друг)}</span>
							<span class="friend__role">{друг.role[lang]}</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</main>

<PhotoLightbox
	images={знімки}
	currentIndex={поточний}
	isOpen={відкрито}
	onclose={() => (відкрито = false)}
/>

<style>
	.friends-page {
		padding: var(--page-pad-top) 0 var(--page-pad-bottom);
	}

	/*
	 * Мінімум 260 px, а не 150 як у карток людей: тут у клітинці лежить ціла
	 * картка з рукописним текстом, і на 150 px почерк стає візерунком.
	 */
	.friends-grid {
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
		gap: 1.5rem;
	}

	/*
	 * Режим «список» — це та сама сітка без знімків: одна колонка, щільніше.
	 * Окремої розмітки не заводимо, бо в ній лежало б те саме — ім'я, фах і
	 * посилання, — і дві копії розійшлися б на першій же правці.
	 */
	.friends-grid--list {
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.friend {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.friend__shot {
		display: block;
		width: 100%;
		padding: 0;
		border: var(--hairline-width) solid var(--border-main);
		border-radius: var(--radius-md, 12px);
		background: none;
		overflow: hidden;
		cursor: pointer;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}
	.friend__shot:hover {
		border-color: var(--accent-primary);
		transform: translateY(-2px);
	}
	.friend__shot img {
		display: block;
		width: 100%;
		height: auto;
	}

	.friend__text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.friend__name {
		font-weight: 700;
		color: var(--text-title);
	}
	.friend__role {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.friend__link {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		text-decoration: none;
		color: inherit;
	}
	.friend__link:hover .friend__shot {
		border-color: var(--accent-primary);
		transform: translateY(-2px);
	}
	.friend__link:hover .friend__name {
		color: var(--accent-primary);
	}
	.friend__link:hover .friend__expert-btn {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		border-color: var(--accent-primary);
		transform: translateY(-1px);
	}

	.friend__expert-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: 0.35rem;
		padding: 0.35rem 0.85rem;
		font-size: 0.85rem;
		font-weight: 600;
		border-radius: var(--radius-full, 9999px);
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		align-self: start;
		transition:
			background var(--transition-base),
			color var(--transition-base),
			border-color var(--transition-base),
			transform var(--transition-base);
	}
</style>
