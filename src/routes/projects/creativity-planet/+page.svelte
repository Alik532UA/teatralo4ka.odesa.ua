<script lang="ts">
	import { t, locale as мова } from 'svelte-i18n';
	import { getAbortSignal } from 'svelte';
	import { goto, pushState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { Flower2, Plus } from 'lucide-svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import GraduateFormModal from '$lib/components/GraduateFormModal.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import {
		cachedGraduateProfile,
		ensureGraduateProfile
	} from '$lib/services/graduateProfiles.svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import {
		STUDENTS,
		graduateAddress,
		graduateProfilePath,
		graduatePhoto,
		graduatePhotoSrcset,
		hasProfile,
		type GraduateIndexEntry
	} from '$lib/data/graduates';

	/**
	 * ПЛАНЕТА ТВОРЧОСТІ — ті, хто вчиться зараз.
	 *
	 * ## Навіщо окрема сторінка, а не куточок галактики
	 *
	 * Словами автора: «"Галактика випускників" для випускників чи тих, хто
	 * перестав вчитися; "Планета творчості" для поточних учнів… ідея в тому, щоб
	 * потім не шукати по соцмережах випускників, а легше запропонувати учням
	 * заповнювати на себе анкети і додавати їх сюди, щоб потім, коли прийде час,
	 * переводити їх у галактику випускників».
	 *
	 * Тобто це не другий показ тих самих людей, а ІНШИЙ стан тієї самої людини.
	 * Тому й реєстр один: учень — це запис із `kind: 'student'`, а переведення в
	 * галактику колись буде зміною виду й появою року випуску. АДРЕСА людини при
	 * цьому не міняється: сторінка в неї від першого дня та сама, і посилання,
	 * роздане учнем, переживе випуск.
	 *
	 * ## Чому планета, а не поле зірок
	 *
	 * У галактиці люди ЛЕТЯТЬ — вони розійшлися по світу, і рух там саме про це.
	 * Учні ж поки разом і в одному місці, тож вони стоять на планеті. Обличчя
	 * круглі, як у галактиці; у кого фотографії ще немає — квітка, а не порожнє
	 * коло: квітка каже «тут росте», а порожнеча казала б «тут нікого».
	 */
	const мова_uk = $derived<'uk' | 'en'>($мова === 'en' ? 'en' : 'uk');

	/**
	 * Розкладка облич — спіраль за золотим кутом (137,5°).
	 *
	 * Не випадкові координати: випадковість під час prerender дала б інший HTML,
	 * ніж перший кадр у браузері (та сама пастка, що описана в `GraduateGalaxy`).
	 * І не сітка: сітка на круглій планеті читається як таблиця поверх кола.
	 *
	 * Золотий кут дає рівномірне заповнення диска за будь-якої кількості — так
	 * ростуть насінини соняшника. Радіус береться коренем від номера, інакше
	 * центр був би густий, а край порожній.
	 */
	const ЗОЛОТИЙ_КУТ = 137.507;
	/** Частка радіуса планети, у якій стоять обличчя: далі починається край. */
	const МЕЖА = 0.66;

	const місця = $derived(
		STUDENTS.map((учень, номер) => {
			const кут = (номер * ЗОЛОТИЙ_КУТ * Math.PI) / 180;
			const радіус = МЕЖА * Math.sqrt((номер + 0.5) / Math.max(STUDENTS.length, 1));
			/*
			 * Множник 50, а не 100: `радіус` — частка РАДІУСА планети, а відсотки
			 * тут відлічуються від СТОРОНИ квадрата, тобто від двох радіусів.
			 * Перша редакція множила на 100, і крайні обличчя вилітали за коло:
			 * Родоміра Долбишева стояла над планетою, поверх тексту.
			 */
			return {
				учень,
				x: 50 + радіус * 50 * Math.cos(кут),
				y: 50 + радіус * 50 * Math.sin(кут)
			};
		})
	);

	const адреса = (учень: { code?: string; slug: string }) =>
		localizedPath(graduateProfilePath(graduateAddress(учень)), мова_uk);

	/* Картка живе в стані сторінки — так само, як у галактиці: у неї є власна
	   адреса, і «назад» закриває її без окремого обробника історії. */
	const відкритий = $derived(
		page.state.graduateAddress
			? STUDENTS.find((с) => graduateAddress(с) === page.state.graduateAddress)
			: undefined
	);
	const анкета = $derived(cachedGraduateProfile(page.state.graduateAddress));

	$effect(() => {
		const адр = page.state.graduateAddress;
		const запис = адр ? STUDENTS.find((с) => graduateAddress(с) === адр) : undefined;
		if (адр && запис && hasProfile(запис) && browser) {
			ensureGraduateProfile(адр, getAbortSignal());
		}
	});

	async function відкрити(учень: GraduateIndexEntry) {
		/* На вузькому екрані картка займає майже все — там простіше піти на саму
		   сторінку, як це робить галактика. */
		if (browser && window.matchMedia('(max-width: 768px)').matches) {
			await goto(адреса(учень));
			return;
		}
		pushState(адреса(учень), { graduateAddress: graduateAddress(учень) });
	}

	let анкетаВідкрита = $state(false);
</script>

<svelte:head>
	<title>{$t('planet.title')} | {$t('hero.title')}</title>
</svelte:head>

<main class="planet-page" data-testid="creativity-planet-panel">
	<div class="container">
		<GalaxyBreadcrumb
			backHref={localizedPath('/projects/galaxy-graduates/', мова_uk)}
			backLabel={$t('galaxy.title')}
			backTestId="creativity-planet-back-link"
		/>

		<header class="planet-header">
			<h1 class="planet-header__title" data-testid="creativity-planet-title">
				{$t('planet.title')}
			</h1>
			<p class="planet-header__count" data-testid="creativity-planet-count">{STUDENTS.length}</p>
		</header>
		<!--
			ЗАПРОШЕННЯ СТОЇТЬ ЗГОРИ, одразу під заголовком, і воно ж єдине —
			рішення автора. Доти під заголовком було пояснення, що таке планета
			(«…переїдуть у галактику з тією самою сторінкою й адресою»), а
			запрошення з кнопкою висіло аж під планетою. Пояснення читалося як
			технічний опис, а кнопку внизу бачив лише той, хто догортав.
		-->
		<div class="planet-invite">
			<p>{$t('planet.invite')}</p>
			<button
				type="button"
				class="planet-invite__btn"
				onclick={() => (анкетаВідкрита = true)}
				data-testid="creativity-planet-form-btn"
			>
				<Plus size={18} aria-hidden="true" />
				<span>{$t('galaxy.fillProfile')}</span>
			</button>
		</div>

		<div class="planet-wrap">
			<div class="planet" data-testid="creativity-planet-list">
				{#each місця as місце (місце.учень.id)}
					<button
						type="button"
						class="pupil"
						style="left: {місце.x}%; top: {місце.y}%;"
						onclick={() => відкрити(місце.учень)}
						data-testid="creativity-planet-{місце.учень.slug}-btn"
					>
						<span class="pupil__face">
							{#if місце.учень.hasPhoto}
								<img
									src={graduatePhoto(місце.учень.slug, 192)}
									srcset={graduatePhotoSrcset(місце.учень.slug)}
									sizes="96px"
									width="96"
									height="96"
									alt=""
									loading="lazy"
								/>
							{:else}
								<!-- Квітка замість порожнього кола: розбір у докблоці зверху. -->
								<Flower2 size={30} aria-hidden="true" />
							{/if}
						</span>
						<span class="pupil__name">{місце.учень.name}</span>
					</button>
				{/each}

				{#if STUDENTS.length === 0}
					<p class="planet-empty">{$t('planet.empty')}</p>
				{/if}
			</div>
		</div>
	</div>
</main>

<GraduateCard graduate={відкритий ?? null} profile={анкета} onclose={() => history.back()} />

<GraduateFormModal isOpen={анкетаВідкрита} onclose={() => (анкетаВідкрита = false)} />

<style>
	/*
	 * КОЛЬОРИ — ТОКЕНАМИ ТЕМИ, а не власною космічною палітрою.
	 *
	 * Перша редакція фарбувала сторінку так само, як галактику: темне тло
	 * `--galaxy-bg`, світлий текст, сині кола. Автор попросив інакше: «дизайн
	 * кольори кожної нашої теми з сайту». І він має рацію не лише за смаком —
	 * галактика темна тому, що вона ЗОРЯНЕ НЕБО й займає весь екран; планета ж
	 * лишається звичайною сторінкою сайту, і чужа палітра на ній означала б, що
	 * перемикач тем на неї не діє.
	 *
	 * Тому тут немає жодного літерала кольору: тло — `--bg-page`, поверхні —
	 * `--bg-surface`/`--bg-card`, написи — `--text-*`, а сама планета зібрана з
	 * акцентів теми через `color-mix`. У шести темах проєкту це дає шість різних
	 * планет із того самого коду; що написи на них лишаються читними, перевіряє
	 * `theme-contrast.spec.ts`.
	 */
	.planet-page {
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		background: var(--bg-page);
		color: var(--text-main);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
	}

	.planet-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	.planet-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.planet-header__count {
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

	.planet-wrap {
		display: grid;
		place-items: center;
		padding: 1rem 0 2.5rem;
	}

	/*
	 * САМА ПЛАНЕТА — куля з акцентів теми.
	 *
	 * Два світлові плями `radial-gradient` і нахилений `linear-gradient` під
	 * ними: перше дає об'єм, друге — колір. Усі три беруть акценти теми, тож у
	 * жовтій темі планета жовта, у морській — бірюзова, і жодного окремого
	 * правила під тему для цього не потрібно.
	 *
	 * Розмір у `vmin`: планета мусить уміщатися у висоту так само, як у ширину,
	 * інакше на широкому й низькому екрані вона поїхала б за край.
	 */
	.planet {
		position: relative;
		width: min(78vmin, 620px);
		aspect-ratio: 1;
		border-radius: 50%;
		border: 1px solid var(--border-main);
		background:
			radial-gradient(
				circle at 32% 28%,
				color-mix(in srgb, var(--accent-primary) 45%, transparent),
				transparent 58%
			),
			radial-gradient(
				circle at 68% 78%,
				color-mix(in srgb, var(--accent-secondary) 38%, transparent),
				transparent 62%
			),
			linear-gradient(
				160deg,
				color-mix(in srgb, var(--accent-primary) 16%, var(--bg-surface)),
				var(--bg-surface)
			);
		box-shadow:
			inset 0 -30px 60px color-mix(in srgb, var(--text-title) 10%, transparent),
			var(--shadow-main);
	}

	.pupil {
		position: absolute;
		translate: -50% -50%;
		display: grid;
		justify-items: center;
		gap: 0.35rem;
		padding: 0;
		background: none;
		border: 0;
		color: inherit;
		font: inherit;
		cursor: pointer;
		transition: transform var(--transition-base);
	}
	.pupil:hover,
	.pupil:focus-visible {
		transform: scale(1.08);
		z-index: 2;
	}

	.pupil__face {
		display: grid;
		place-items: center;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		width: clamp(64px, 13vmin, 96px);
		height: clamp(64px, 13vmin, 96px);
		border-radius: 50%;
		overflow: hidden;
		background: var(--bg-card);
		border: 2px solid color-mix(in srgb, var(--accent-primary) 55%, var(--border-main));
		color: var(--accent-text);
		box-shadow: var(--shadow-main);
	}
	.pupil__face img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/*
	 * Підпис лежить НА планеті, тобто на кольоровій поверхні, а не на тлі
	 * сторінки. Тому під ним власна плашка кольору поверхні: без неї в темах із
	 * насиченим акцентом ім'я читалося б через раз, і це саме той клас дефекту,
	 * від якого сторінку рятує `theme-contrast`.
	 */
	.pupil__name {
		max-width: 11rem;
		padding: 0.1rem 0.45rem;
		border-radius: var(--radius-sm, 6px);
		background: color-mix(in srgb, var(--bg-surface) 82%, transparent);
		color: var(--text-main);
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1.25;
		text-align: center;
	}

	.planet-empty {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 2rem;
		text-align: center;
		color: var(--text-muted);
	}

	/* Запрошення стоїть під заголовком, а не по центру сторінки: воно тепер
	   вступ, а не післямова. Тому вирівнювання ліворуч, як у заголовка. */
	.planet-invite {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
		max-width: 62ch;
		margin: 0 0 1.5rem;
		color: var(--text-muted);
	}
	.planet-invite p {
		margin: 0;
	}
	.planet-invite__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 1.1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--accent-primary);
		border: 1px solid var(--accent-primary);
		color: var(--text-on-accent);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		transition: filter var(--transition-base);
	}
	.planet-invite__btn:hover {
		filter: brightness(1.08);
	}
</style>
