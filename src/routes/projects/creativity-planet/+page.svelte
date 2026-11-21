<script lang="ts">
	import { t, locale as мова } from "svelte-i18n";
	import { getAbortSignal } from "svelte";
	import { goto, pushState } from "$app/navigation";
	import { browser } from "$app/environment";
	import { page } from "$app/state";
	import { Plus, ArrowLeft, ArrowRight } from "lucide-svelte";
	import GraduateCard from "$lib/components/GraduateCard.svelte";
	import GraduateFormModal from "$lib/components/GraduateFormModal.svelte";
	import PlanetSplit from "$lib/components/planet/PlanetSplit.svelte";
	import {
		cachedGraduateProfile,
		ensureGraduateProfile,
	} from "$lib/services/graduateProfiles.svelte";
	import { localizedPath } from "$lib/i18n/routing";
	import {
		STUDENTS,
		graduateAddress,
		graduateProfilePath,
		hasProfile,
		type GraduateIndexEntry,
	} from "$lib/data/graduates";

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
	const мова_uk = $derived<"uk" | "en">($мова === "en" ? "en" : "uk");

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
			? STUDENTS.find(
					(с) => graduateAddress(с) === page.state.graduateAddress,
				)
			: undefined,
	);
	const анкета = $derived(cachedGraduateProfile(page.state.graduateAddress));

	$effect(() => {
		const адр = page.state.graduateAddress;
		const запис = адр
			? STUDENTS.find((с) => graduateAddress(с) === адр)
			: undefined;
		if (адр && запис && hasProfile(запис) && browser) {
			ensureGraduateProfile(адр, getAbortSignal());
		}
	});

	async function відкрити(учень: GraduateIndexEntry) {
		/* На вузькому екрані картка займає майже все — там простіше піти на саму
		   сторінку, як це робить галактика. */
		if (browser && window.matchMedia("(max-width: 768px)").matches) {
			await goto(адреса(учень));
			return;
		}
		pushState(адреса(учень), { graduateAddress: graduateAddress(учень) });
	}

	let анкетаВідкрита = $state(false);
</script>

<!--
	Тег `section`, а НЕ `main`: `main` уже малює layout (`#main-content`), і
	другий такий тег на сторінці — і поламаний орієнтир для читалки (їх мусить
	бути рівно один), і мовчазна пастка для прогонів: `locator('main')`
	знаходив ДВА елементи, тобто смоук-перевірка «сторінка не порожня» падала
	не тому, що сторінка порожня. Заміряно 2026-09-05 повним прогоном e2e.
-->
<section class="planet-page" data-testid="creativity-planet-panel">
	<div class="container">
		<PlanetSplit students={STUDENTS} onopen={відкрити}>
			{#snippet header()}
				<div class="panel-header">
					<nav class="panel-nav">
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={localizedPath("/projects/", мова_uk)}
							class="panel-link"
							data-testid="creativity-planet-back-link"
						>
							<ArrowLeft size={15} aria-hidden="true" />
							<span>{$t("planet.allProjects")}</span>
						</a>

						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={localizedPath(
								"/projects/galaxy-graduates/",
								мова_uk,
							)}
							class="panel-link panel-link--galaxy"
							data-testid="creativity-planet-galaxy-link"
						>
							<span>{$t("galaxy.title")}</span>
							<ArrowRight size={15} aria-hidden="true" />
						</a>
					</nav>

					<div class="panel-title-row">
						<div class="panel-title-group">
							<h1
								class="panel-title"
								data-testid="creativity-planet-title"
							>
								{$t("planet.title")}
							</h1>
							<span
								class="panel-count"
								data-testid="creativity-planet-count"
								>{STUDENTS.length}</span
							>
						</div>

						<button
							type="button"
							class="panel-cta-btn"
							onclick={() => (анкетаВідкрита = true)}
							data-testid="creativity-planet-form-btn"
						>
							<Plus size={15} aria-hidden="true" />
							<span>{$t("galaxy.fillProfile")}</span>
						</button>
					</div>

					<p class="panel-invite">{$t("planet.invite")}</p>
				</div>
			{/snippet}
		</PlanetSplit>
	</div>
</section>

<GraduateCard
	graduate={відкритий ?? null}
	profile={анкета}
	onclose={() => history.back()}
/>

<GraduateFormModal
	isOpen={анкетаВідкрита}
	onclose={() => (анкетаВідкрита = false)}
	variant="student"
/>

<style>
	/*
	 * КОЛЬОРИ — ТОКЕНАМИ ТЕМИ, а не власною космічною палітрою.
	 *
	 * Тло — `--bg-page`, поверхні — `--bg-surface`/`--bg-card`, написи — `--text-*`,
	 * а сама планета зібрана з акцентів теми через `color-mix`.
	 */
	.planet-page {
		min-height: calc(
			100dvh - var(--header-height, 72px) - 16px -
				var(--footer-height, 80px)
		);
		padding: 2.25rem 1.5rem 3rem;
		background: var(--bg-page);
		color: var(--text-main);
		box-sizing: border-box;
	}

	.container {
		max-width: min(1800px, 94vw);
		margin: 0 auto;
		width: 100%;
	}

	.panel-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		margin-top: 0;
		margin-bottom: 0.35rem;
	}

	.panel-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}

	.panel-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.8rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: var(--hairline-width) solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base),
			color var(--transition-base);
	}
	.panel-link:hover {
		border-color: var(--accent-primary);
		transform: translateX(-2px);
		color: var(--accent-text);
	}
	.panel-link--galaxy:hover {
		transform: translateX(2px);
	}

	.panel-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.panel-title-group {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.panel-title {
		margin: 0;
		font-size: clamp(1.35rem, 2.5vw, 1.7rem);
		font-weight: 800;
		color: var(--text-title);
		line-height: 1.15;
		white-space: nowrap;
	}

	.panel-count {
		margin: 0;
		display: grid;
		place-items: center;
		min-width: 1.75rem;
		height: 1.75rem;
		padding: 0 0.45rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: var(--hairline-width) solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.panel-cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 38px;
		padding: 0 1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--accent-primary);
		border: var(--hairline-width) solid var(--accent-primary);
		color: var(--text-on-accent);
		font: inherit;
		font-size: 0.84rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
		transition: filter var(--transition-base);
	}
	.panel-cta-btn:hover {
		filter: brightness(1.08);
	}

	.panel-invite {
		margin: 0;
		font-size: 0.84rem;
		color: var(--text-muted);
		line-height: 1.35;
	}

	@media (max-width: 860px) {
		.planet-page {
			padding: 0.5rem 0.75rem 1.5rem;
			display: block;
		}
	}
</style>
