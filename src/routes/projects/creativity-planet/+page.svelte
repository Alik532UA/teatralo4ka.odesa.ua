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
		<p class="planet-hint">{$t('planet.hint')}</p>

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
	</div>
</main>

<GraduateCard graduate={відкритий ?? null} profile={анкета} onclose={() => history.back()} />

<GraduateFormModal isOpen={анкетаВідкрита} onclose={() => (анкетаВідкрита = false)} />

<style>
	.planet-page {
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		background: var(--galaxy-bg);
		color: var(--galaxy-text, #eaf2ff);
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
		/* Колір ЯВНО: глобальне правило для h1 фарбує заголовок у `--text-title`,
		   а він розрахований на світле тло сторінки — на темній планеті напис
		   виходив майже чорним. */
		color: var(--galaxy-text, #eaf2ff);
	}
	.planet-header__count {
		margin: 0;
		display: grid;
		place-items: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.5rem;
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.08);
		border: 1px solid rgb(255 255 255 / 0.18);
		font-size: 0.9rem;
		font-weight: 700;
	}
	.planet-hint {
		max-width: 62ch;
		margin: 0 0 2rem;
		color: var(--galaxy-muted, #a8bfe0);
		line-height: 1.55;
	}

	.planet-wrap {
		display: grid;
		place-items: center;
		padding: 1rem 0 2.5rem;
	}

	/*
	 * САМА ПЛАНЕТА. Коло з м'яким світлом ізсередини й тінню знизу — щоб воно
	 * читалося кулею, а не наліпкою. Розмір у `vmin`: планета мусить уміщатися
	 * у висоту так само, як у ширину, інакше на широкому й низькому екрані вона
	 * поїхала б за край.
	 */
	.planet {
		position: relative;
		width: min(78vmin, 620px);
		aspect-ratio: 1;
		border-radius: 50%;
		background:
			radial-gradient(circle at 32% 28%, rgb(140 190 255 / 0.35), transparent 55%),
			radial-gradient(circle at 68% 78%, rgb(94 234 212 / 0.22), transparent 60%),
			linear-gradient(160deg, #12224d, #0a1330 60%, #060b1d);
		box-shadow:
			inset 0 -30px 60px rgb(0 0 0 / 0.55),
			0 30px 80px rgb(4 10 30 / 0.6);
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
		background: rgb(9 18 44 / 0.85);
		border: 2px solid rgb(140 190 255 / 0.45);
		color: #9ae6c8;
		box-shadow: 0 8px 24px rgb(3 8 24 / 0.55);
	}
	.pupil__face img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.pupil__name {
		max-width: 11rem;
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1.2;
		text-align: center;
		text-shadow: 0 2px 8px rgb(3 8 24 / 0.9);
	}

	.planet-empty {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 2rem;
		text-align: center;
		color: var(--galaxy-muted, #a8bfe0);
	}

	.planet-invite {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem 1rem;
		max-width: 62ch;
		margin: 0 auto;
		text-align: center;
		color: var(--galaxy-muted, #a8bfe0);
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
		border-radius: 9999px;
		background: rgb(140 190 255 / 0.16);
		border: 1px solid rgb(140 190 255 / 0.5);
		color: var(--galaxy-text, #eaf2ff);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		transition: background var(--transition-base);
	}
	.planet-invite__btn:hover {
		background: rgb(140 190 255 / 0.3);
	}
</style>
