<script lang="ts">
	import { t, locale as мова } from 'svelte-i18n';
	import { getAbortSignal } from 'svelte';
	import { goto, pushState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { Plus } from 'lucide-svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import GraduateFormModal from '$lib/components/GraduateFormModal.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import PlanetSplit from '$lib/components/planet/PlanetSplit.svelte';
	import {
		cachedGraduateProfile,
		ensureGraduateProfile
	} from '$lib/services/graduateProfiles.svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import {
		STUDENTS,
		graduateAddress,
		graduateProfilePath,
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
	 * РОЗКЛАДКА ОДНА, і це вибір автора.
	 *
	 * Доти обличчя стояли спіраллю за золотим кутом, і 2026-09-08 автор надіслав
	 * знімок: із одинадцяти імен читалися п'ять. Спіраль ідеальна для НАСІНИН —
	 * однакових кружечків без підписів; наш «кружечок» має підпис завширшки як
	 * три обличчя, і саме він накладався. З ростом числа учнів ставало б гірше.
	 *
	 * У відповідь ми зробили три розкладки з перемикачем — щоб автор подивився й
	 * обрав. Того ж дня він обрав «Планету й перелік», і решту прибрано разом із
	 * перемикачем: елемент керування з одним пунктом нічим не керує, а два
	 * непоказувані компоненти й далі їхали б у бандл.
	 *
	 * Чому саме ця виграла — у докблоці `PlanetSplit`; коротко: імена видно
	 * завжди, і куля лишається.
	 *
	 * @see components/planet/PlanetSplit.svelte
	 */
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

<!--
	Тег `section`, а НЕ `main`: `main` уже малює layout (`#main-content`), і
	другий такий тег на сторінці — і поламаний орієнтир для читалки (їх мусить
	бути рівно один), і мовчазна пастка для прогонів: `locator('main')`
	знаходив ДВА елементи, тобто смоук-перевірка «сторінка не порожня» падала
	не тому, що сторінка порожня. Заміряно 2026-09-05 повним прогоном e2e.
-->
<section class="planet-page" data-testid="creativity-planet-panel">
	<div class="container">
		<!--
			Ліворуч — НАЗАД У ПРОЄКТИ, праворуч — далі в галактику. Так само
			влаштовані решта сторінок розділу: ліва кнопка веде на рівень вище,
			права — на сусідній розділ. Доти тут стояла сама галактика ліворуч,
			тобто «нагору» вело вбік.
		-->
		<GalaxyBreadcrumb
			backHref={localizedPath('/projects/', мова_uk)}
			backLabel={$t('planet.allProjects')}
			backTestId="creativity-planet-back-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', мова_uk)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="creativity-planet-galaxy-link"
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
			<PlanetSplit students={STUDENTS} onopen={відкрити} />
		</div>
	</div>
</section>

<GraduateCard graduate={відкритий ?? null} profile={анкета} onclose={() => history.back()} />

<GraduateFormModal
	isOpen={анкетаВідкрита}
	onclose={() => (анкетаВідкрита = false)}
	variant="student"
/>

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
	 * САМА ПЛАНЕТА ЖИВЕ В КОМПОНЕНТАХ, а не тут: куля, обличчя й підписи — у
	 * `components/planet/*`. Сторінці лишається місце під них.
	 */
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
