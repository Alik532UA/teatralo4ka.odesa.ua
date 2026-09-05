<script lang="ts">
	import { t } from "svelte-i18n";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { X } from "lucide-svelte";
	import GraduateProfileView from "$lib/components/GraduateProfileView.svelte";
	import EditContactButton from "$lib/components/EditContactButton.svelte";
	import GraduateGalaxy from "$lib/components/GraduateGalaxy.svelte";
	import { localeFromPath, localizedPath } from "$lib/i18n/routing";
	import {
		graduateProfilePath,
		type GraduateIndexEntry,
		graduateAddress,
	} from "$lib/data/graduates";

	let { data } = $props();

	/**
	 * УЧЕНЬ на своїй сторінці — у темі САЙТУ, а не в палітрі галактики.
	 *
	 * Автор: «персональні сторінки учнів — дизайн кольори кожної нашої теми з
	 * сайту». Причина та сама, що й на «Планеті творчості»: галактика темна
	 * тому, що вона зоряне небо на весь екран, а сторінка учня — звичайна
	 * сторінка сайту, і перемикач тем мусить на неї діяти.
	 *
	 * Практично це означає дві речі: тілу НЕ додається клас галактики (саме він
	 * підміняє токени теми космічною палітрою — див. `global.css`), і позаду не
	 * летять зірки з випускниками. Летючі зірки тут узагалі не про учня: це
	 * перелік ВИПУСКНИКІВ, тобто чужий розділ за його спиною.
	 */
	const учень = $derived(data.graduate.kind === 'student');

	/**
	 * Куди веде хрестик — ТУДИ, ЗВІДКИ ЛЮДИНА ПРИЙШЛА ЗА СМИСЛОМ.
	 *
	 * Випускника закриваємо в галактику, учня — на «Планету творчості»: у
	 * галактиці його немає взагалі, і кнопка «закрити» вела б у перелік, де
	 * його не знайти. Автор саме це й побачив на сторінці Родоміри Долбишевої.
	 */
	const домівка = $derived(
		localizedPath(
			учень ? "/projects/creativity-planet/" : "/projects/galaxy-graduates/",
			localeFromPath(page.url.pathname),
		),
	);

	let isDesktop = $state(false);

	let profileEl = $state<HTMLElement | null>(null);
	let shiftY = $state(0);

	function updateShift() {
		if (!browser || window.innerWidth < 768 || !profileEl) {
			shiftY = 0;
			return;
		}
		const availGap = window.innerHeight - profileEl.offsetHeight;
		if (availGap >= 220) {
			shiftY = 0;
		} else if (availGap <= 100) {
			shiftY = 26;
		} else {
			const t = (220 - availGap) / 120;
			shiftY = Math.round(t * 26);
		}
	}

	$effect(() => {
		if (!profileEl || !browser) return;
		updateShift();
		const ro = new ResizeObserver(() => updateShift());
		ro.observe(profileEl);
		window.addEventListener("resize", updateShift);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", updateShift);
		};
	});

	/*
	 * Сторінка є в КОЖНОГО, тож розвилки «є код / немає коду» більше немає: доти
	 * друга гілка вела в галактику з параметром `?g=`.
	 */
	function handleSelectOtherGraduate(other: GraduateIndexEntry) {
		goto(
			localizedPath(
				graduateProfilePath(graduateAddress(other)),
				localeFromPath(page.url.pathname),
			),
		);
	}

	/*
	 * Контактів, стану меню й трьох обробників тут БІЛЬШЕ НЕМАЄ: усе веде
	 * `EditContactButton`. Це була третя копія того самого блока, і саме в ній
	 * меню виїжджало за екран на телефоні.
	 */

	onMount(() => {
		const mql = window.matchMedia("(min-width: 768px)");
		isDesktop = mql.matches;
		if (isDesktop && !учень) document.body.classList.add("page-galaxy");

		const update = (e: MediaQueryListEvent) => {
			isDesktop = e.matches;
			if (isDesktop && !учень) document.body.classList.add("page-galaxy");
			else document.body.classList.remove("page-galaxy");
		};
		mql.addEventListener("change", update);

		return () => {
			document.body.classList.remove("page-galaxy");
			mql.removeEventListener("change", update);
		};
	});
</script>

<svelte:head>
	<!-- Учень підписаний своїм розділом: у галактиці його немає. -->
	<title
		>{data.graduate.name} — {учень ? $t("planet.title") : $t("galaxy.title")}</title
	>
</svelte:head>

<div
	class="profile-stage"
	class:profile-stage--themed={учень}
	data-testid="graduate-profile-section"
>
	{#if browser && isDesktop && !учень}
		<div class="profile-stage__stars" aria-hidden="true">
			<GraduateGalaxy onselect={handleSelectOtherGraduate} />
		</div>
		<div class="profile-stage__backdrop" aria-hidden="true"></div>
	{/if}

	<div class="profile" data-testid="graduate-profile-container">
		<article
			class="profile__card"
			bind:this={profileEl}
			style="--shift-y: {shiftY}px"
			data-testid="graduate-profile-card"
		>
			<div class="card__toolbar" data-testid="graduate-profile-toolbar">
				{#if data.graduate.hasPhoto}
					<!--
						Кнопка правок і її меню — спільний компонент. Тут була третя
						копія того самого блока, і саме в ній меню виїжджало за екран
						на телефоні, поки дві інші стояли цілі.

						`card` і наведення — щоб той самий олівець того самого
						випускника поводився однаково в картці й на власній
						сторінці. Доти стояло `down`, хоч докблок компонента
						приписував цьому тулбару бічне меню: воно падало вниз
						прямокутним вікном, тоді як у картці виїжджає ліворуч
						смужкою від наведення. Людина бачила два різні віджети
						для однієї дії.
					-->
					<EditContactButton
						testIdPrefix="graduate-profile-contact"
						buttonTestId="graduate-profile-edit-btn"
						openTo="card"
						openOnHover
						variant="ghost"
						hasPhoto={!!data.graduate.hasPhoto}
						label={$t('common.contact', { default: "Зв'язатися" })}
					/>
				{/if}

				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					href={домівка}
					class="card__action card__close"
					aria-label={$t("common.close", { default: "Закрити" })}
					title={учень
						? $t("planet.backToPlanet", { default: "Повернутися на планету творчості" })
						: $t("galaxy.backToGalaxy", { default: "Повернутися до галактики" })}
					data-testid="graduate-profile-close-btn"
				>
					<X size={20} aria-hidden="true" />
				</a>
			</div>

			<GraduateProfileView
				graduate={data.graduate}
				profile={data.profile}
				heading="h1"
				headingId="graduate-name"
			/>
		</article>
	</div>
</div>

<style>
	.profile-stage {
		width: 100%;
	}

	/*
	 * Сторінка учня: тло й простір беруться з теми сайту. Решта кольорів
	 * усередині картки приходить токенами сама — саме тому тілу й не додається
	 * клас галактики, який ті токени підміняє.
	 */
	.profile-stage--themed {
		/*
		 * ПЕРЕМАПА ПАЛІТРИ: картка всередині написана на змінних `--galaxy-*`, і
		 * тут вони вказують на токени теми. Тобто жодного рядка в самій картці
		 * міняти не треба — вона фарбується темою сайту, лишаючись тією самою
		 * карткою для випускника в галактиці.
		 *
		 * Без цього виходило напівтемне: тло сторінки бралося з теми, а плашки
		 * всередині лишалися космічними, і в світлій темі axe знаходив два
		 * нечитні написи (контраст 3,06 — акцент теми на темному тлі плашки).
		 */
		--galaxy-bg: var(--bg-page);
		--galaxy-card-bg: var(--bg-card);
		--galaxy-text: var(--text-main);
		--galaxy-muted: var(--text-muted);
		--galaxy-accent: var(--accent-text);

		min-height: 100dvh;
		padding: 2rem 1rem 4rem;
		background: var(--bg-page);
		color: var(--text-main);
	}

	/*
	 * РОЗКЛАДКА СТОРІНКИ УЧНЯ — окрема, і ось чому вона знадобилася.
	 *
	 * Уся ця сторінка написана під СЦЕНУ галактики: на широкому екрані клас
	 * `page-galaxy` робить її `position: fixed; inset: 0`, центрує вміст,
	 * розширює колонку до 1760 px і кладе позаду зорі. Учневі того класу тепер
	 * не дають — і сторінка провалилася в запасну розкладку, розраховану на
	 * телефон. Автор побачив рівно її наслідки: «закруглення мають дивну тінь,
	 * на фоні ще один блок, кнопка закрити відрізана».
	 *
	 * Розбір по кожному:
	 *
	 *   • «ще один блок» — це `.profile__card`: темна плашка галактики, яка на
	 *     світлій темі стала білою на білому, і від неї лишилася сама тінь. Тут
	 *     вона взагалі не потрібна: плашки з даними всередині мають власні
	 *     поверхні. Тому фон і тінь прибрані, а поля віддані самим плашкам.
	 *   • «дивна тінь» — та сама `0 18px 48px rgb(0 0 0 / 0.28)`, підібрана під
	 *     чорне тло космосу.
	 *   • «кнопка закрити відрізана» — тулбар стоїть `position: absolute; top:
	 *     -3.2rem`, тобто НАД карткою. На сцені над нею було порожньо, а в
	 *     потоці сторінки там шапка сайту, яка кнопку й накрила. Тепер тулбар
	 *     стоїть у потоці, першим рядком.
	 *   • ширина: без класу сцени колонка лишалася 720 px, а плашки всередині
	 *     розкладаються ширше — звідси й враження «блок за блоком». Ширина
	 *     повторює ту, що на сцені.
	 */
	.profile-stage--themed .profile {
		width: min(1760px, 96vw);
		padding-top: 0;
	}

	.profile-stage--themed .profile__card {
		padding: 0;
		background: transparent;
		box-shadow: none;
	}

	.profile-stage--themed .card__toolbar {
		position: static;
		justify-content: flex-end;
		margin: 0 0 0.75rem;
	}

	.profile-stage--themed .card__action {
		border-color: var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		backdrop-filter: none;
	}
	.profile-stage--themed .card__close:hover {
		background: var(--bg-card);
		border-color: var(--accent-primary);
		color: var(--text-title);
	}

	.profile-stage__stars {
		display: none;
	}

	.profile-stage__backdrop {
		display: none;
	}

	.profile {
		width: min(720px, 100%);
		margin: 0 auto;
		padding: clamp(1rem, 3vh, 2rem) 0 clamp(4.5rem, 8vh, 6rem);
	}

	/* Темна картка: впізнаваність об'єкта галактики */
	.profile__card {
		position: relative;
		padding: clamp(1rem, 3vh, 1.75rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
	}

	.card__toolbar {
		position: absolute;
		top: -3.2rem;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 10;
	}

	.card__action {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 50%;
		background: rgb(3 6 20 / 0.75);
		color: #cfe4ff;
		cursor: pointer;
		backdrop-filter: blur(8px);
		text-decoration: none;
	}

	.card__close:hover {
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.7);
		color: #fff;
	}

	/* Контактне випадаюче меню */
	@media (max-width: 767px) {
		.card__toolbar {
			position: sticky;
			top: 0;
			right: 0;
			float: right;
			z-index: 10;
		}

		.card__action {
			border: none;
			background: rgb(255 255 255 / 0.12);
			color: inherit;
		}

		/*
		 * На телефоні меню прив'язується до КАРТКИ, а не до кнопки.
		 *
		 * Кнопка стоїть майже біля правого краю, і меню від неї не вміщалося в
		 * жоден бік: заміряно на iPhone SE — 389 px завширшки при початку на
		 * 259, тобто 273 px за екраном. Причина — `white-space: nowrap` і
		 * прив'язка до `.contact-wrap`, вужчої за саме меню.
		 *
		 * Тому обгортка тут перестає бути точкою відліку, і меню стає під
		 * тулбаром біля правого краю картки, переносячи значки на другий рядок,
		 * якщо не вміщаються.
		 */
	}

	@media (min-width: 768px) {
		:global(body.page-galaxy) .profile-stage {
			position: fixed;
			inset: 0;
			display: grid;
			place-items: center;
			padding: 1.5rem;
			background: var(--galaxy-bg);
			overflow: hidden;
		}

		:global(body.page-galaxy) .profile-stage__stars {
			display: block;
			position: absolute;
			inset: 0;
			z-index: 0;
		}

		:global(body.page-galaxy) .profile-stage__backdrop {
			display: block;
			position: absolute;
			inset: 0;
			z-index: 0;
			background: rgb(3 6 20 / 0.72);
			backdrop-filter: blur(3px);
			-webkit-backdrop-filter: blur(3px);
			pointer-events: none;
		}

		:global(body.page-galaxy) .profile {
			position: relative;
			z-index: 1;
			width: min(1760px, 96vw);
			/*
			 * ДРУГА копія магічних 840. Перша жила в модалці й різала зміст;
			 * прибрали її — а тут лишилася, і власна сторінка випускника далі
			 * обрізала останні рядки. Заміряно на 1440×900: останній рядок
			 * вистав закінчувався на 988 px при вікні 900, і колесо його не
			 * діставало, бо сцена має `overflow: hidden`, а сама картка не
			 * прокручувалася взагалі.
			 *
			 * Тепер межа одна — висота сцени, а прокрутку бере картка нижче.
			 */
			max-height: 100%;
			min-height: 0;
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		:global(body.page-galaxy) .profile__card {
			position: relative;
			width: fit-content;
			max-width: 100%;
			min-height: 0;
			background: transparent;
			border: none;
			box-shadow: none;
			padding: 0;
			transform: translateY(var(--shift-y, 0px));
			/*
			 * Прокручується САМЕ картка, а не сцена: сцена — нерухоме тло на
			 * весь екран із зорями, і зсувати її не можна. Ширина картки
			 * дорівнює змісту, тож поля обабіч лишаються тлом.
			 *
			 * Прокрутки тут немає: її беруть колонки всередині. Роль цього
			 * рівня — передати стелю вниз, і `flex: 0 1 auto` з `min-height: 0`
			 * робить саме це.
			 */
			flex: 0 1 auto;
			min-height: 0;
			/*
			 * `visible`, а не `hidden`: тулбар стоїть НАД карткою
			 * (`top: -3.2rem`), і обрізання прибирало його з екрана разом із
			 * кнопками. Висоту тримає флекс.
			 */
			overflow: visible;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		:global(body.page-galaxy) .card__toolbar {
			top: -3.25rem;
		}
	}
</style>
