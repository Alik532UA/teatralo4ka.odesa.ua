<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Search, GraduationCap, Globe, Theater, School, Drama, Plus, Menu, X, Expand, Shrink, Play, Pause } from 'lucide-svelte';
	import { localizedPath, type Locale } from '$lib/i18n/routing';
	import { fullscreen } from '$lib/services/fullscreen.svelte';
	import { slideshow } from '$lib/services/graduateSlideshow.svelte';
	import { isNearBox } from '$lib/utils/pointerProximity';

	/**
	 * Керування сценою галактики: переліки й кнопка анкети.
	 *
	 * ## Навіщо окремо від сторінки
	 *
	 * Не заради розміру, хоч сторінка й стояла біля стелі. На телефоні ці п'ять
	 * кнопок ховаються за одну, і разом із ними в сторінку прийшли б власний стан
	 * «меню відкрите», медіазапит і два набори розкладки. Сторінка ж відповідає за
	 * інше — за адресу, картку й реєстр.
	 *
	 * ## Чому меню саме на телефоні
	 *
	 * Заміряно: п'ять кнопок у рядок потребують близько 620 пікселів. На 375
	 * вони переносяться у три ряди й з'їдають чверть екрана — тобто саму
	 * галактику, заради якої сторінка й існує. Тому нижче 640 лишається один
	 * значок, а рядок розкривається стовпчиком над ним.
	 *
	 * Показ і ховання — КЛАСАМИ, а не умовою в розмітці: інакше при зміні ширини
	 * кнопки перестворювалися б, і фокус із відкритого меню злітав би на початок
	 * сторінки.
	 */
	interface Props {
		/** Скільком випускникам є сторінка — число поруч із «Всі». */
		total: number;
		locale: Locale;
		onopenroster: () => void;
		onopenform: () => void;
		/** Пуск і зупинка слайдшоу — сторінка знає, кого показувати. */
		onslideshow?: () => void;
	}

	let { total, locale, onopenroster, onopenform, onslideshow }: Props = $props();

	let menuOpen = $state(false);

	/**
	 * Курсор БІЛЯ кнопок — і три рівні прозорості: 50% удалині, 75% поблизу,
	 * 100% під курсором.
	 *
	 * ## Чому відстань рахується, а не робиться зона наведення
	 *
	 * Простіше було б розтягнути невидиму зону навколо рядка (`::before` із
	 * від'ємним `inset`) і взяти звичайний `:hover`. Ціна цього — зона перехоплює
	 * натискання: смуга 120 пікселів навколо кнопок накрила б зірки, і людина, що
	 * цілиться в обличчя біля краю, натискала б у порожнє.
	 *
	 * Відстань до прямокутника цього не робить: слухач пасивний, нічого не
	 * перехоплює, а `requestAnimationFrame` не дає рахувати частіше за кадр.
	 *
	 * Сама математика — у `utils/pointerProximity` під звичайним тестом: у
	 * прихованій панелі цього оточення кадрів немає, тож `requestAnimationFrame`
	 * не викликається й поведінку там не заміряти.
	 *
	 * ## Чому 120 пікселів
	 *
	 * Приблизно два діаметри кнопки: далі за це рух курсора вже не «до кнопок», а
	 * просто рух по галактиці. Менше — і плашки не встигали б з'явитися до того,
	 * як курсор дійде.
	 */
	const ЗОНА = 120;

	let controlsEl = $state<HTMLElement | null>(null);
	let near = $state(false);

	$effect(() => {
		const el = controlsEl;
		if (!el) return;

		let frame = 0;
		const onMove = (event: PointerEvent) => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				near = isNearBox({ x: event.clientX, y: event.clientY }, el.getBoundingClientRect(), ЗОНА);
			});
		};

		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			window.removeEventListener('pointermove', onMove);
			if (frame) cancelAnimationFrame(frame);
		};
	});

	/*
	 * Вихід із повного екрана ЗЗОВНІ — клавішею Esc або системною кнопкою —
	 * сервіс сам не помітить: подію дає документ. Життєвий цикл слухача веде
	 * компонент, бо в сервісі (module-level singleton) рун немає.
	 */
	$effect(() => fullscreen.watch());

	/** На телефоні перелік і анкета ховаються за один значок. */
	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	/**
	 * Натиснули щось у меню — меню згортається.
	 *
	 * Інакше після відкриття реєстру воно лишалося б розкритим за ним і
	 * визирало б з-під аркуша, коли той закриють.
	 */
	function pick(дія: () => void) {
		дія();
		menuOpen = false;
	}
	const БАЗА = '/projects/galaxy-graduates/';

	/**
	 * Переліки галактики: значок, адреса й ключ підпису.
	 *
	 * Порядок тут і є порядком на екрані. Він не абетковий, а за тим, як розділи
	 * з'являлися: групи, фестивалі, вистави, заклади освіти, театри.
	 */
	const ПЕРЕЛІКИ = [
		{ icon: GraduationCap, href: `${БАЗА}groups/`, label: 'galaxy.groupsTitle', testid: 'galaxy-groups-link' },
		{ icon: Globe, href: `${БАЗА}festivals/`, label: 'galaxy.festivalsTitle', testid: 'galaxy-festivals-link' },
		{ icon: Theater, href: `${БАЗА}plays/`, label: 'galaxy.playsTitle', testid: 'galaxy-plays-link' },
		{ icon: School, href: `${БАЗА}institutions/`, label: 'galaxy.institutionsTitle', testid: 'galaxy-institutions-link' },
		{ icon: Drama, href: `${БАЗА}theatres/`, label: 'galaxy.theatresTitle', testid: 'galaxy-theatres-link' }
	] as const;

</script>

<div
	class="stage__controls"
	class:stage__controls--open={menuOpen}
	class:stage__controls--near={near}
	bind:this={controlsEl}
>
	<!--
		Значок-перемикач: на широкому екрані його немає (CSS), на телефоні він
		єдине, що видно, доки меню згорнуте.
	-->
	<button
		type="button"
		class="stage__menu-btn"
		onclick={toggleMenu}
		aria-expanded={menuOpen}
		title={$t('galaxy.stageMenu', { default: 'Переліки' })}
		aria-label={$t('galaxy.stageMenu', { default: 'Переліки' })}
		data-testid="galaxy-stage-menu-btn"
	>
		{#if menuOpen}
			<X size={20} aria-hidden="true" />
		{:else}
			<Menu size={20} aria-hidden="true" />
		{/if}
	</button>

	<div class="stage__items">

		<!--
			ЧОТИРИ ПОСИЛАННЯ ОДНИМ `{#each}`, а не написані підряд.

			Спершу їх було три, і кожне стояло окремим тегом зі своїм коментарем.
			Коли з'явився четвертий (навчальні заклади), у стелі розміру цього
			файлу було записано: наступне посилання мусить починатися зі
			згортання переліку, бо п'ять однакових `<a>` — це вже копія, а не
			збіг. Театри стали п'ятим, і борг закрито тут.

			Описувач тримає ЗНАЧОК КОМПОНЕНТОМ, а не назвою: `<svelte:component>`
			для цього не потрібен — у Svelte 5 звичайний тег із великої літери
			приймає значення змінної. Причина кожного переліку лишилася в
			докблоці своїх даних (`data/institutions.ts`, `data/theatres.ts`), а
			не тут: тут вони всі однакові.
		-->
		{#each ПЕРЕЛІКИ as перелік (перелік.testid)}
			{@const Значок = перелік.icon}
			<a
				class="stage__roster-btn stage__roster-btn--nav"
				href={localizedPath(перелік.href, locale)}
				data-testid={перелік.testid}
			>
				<Значок size={18} aria-hidden="true" />
				<span class="stage__nav-label">{$t(перелік.label)}</span>
			</a>
		{/each}

		<!--
			«Усі випускники» стоїть ПІСЛЯ переліків і поруч із плюсом, хоч і
			є головною дією: так просив замовник, і в цьому є сенс — праворуч
			найближче до великого пальця й до курсору, що йде до кнопки анкети.
			Переліки поруч трохи менші за розміром: вони другорядні.

			Значок — лупа, а не список. `List` у цьому проєкті означає «режим
			списку» — у перемикачах вигляду `ContentWidget`, `MasterProductions`
			та в редакторі, — тож на кнопці, що ВІДКРИВАЄ перелік, він казав не
			те. Лупа ж усюди означає пошук (шапка, `SearchOverlay`,
			`SearchField`), а ростер і відкривається з полем пошуку за іменем.
		-->
		<button
			type="button"
			class="stage__roster-btn"
			onclick={() => pick(onopenroster)}
			data-testid="galaxy-open-roster-btn"
		>
			<Search size={18} aria-hidden="true" />
			<span>{$t('galaxy.all')}</span>
			<span class="stage__total" data-testid="galaxy-roster-total-count">{total}</span>
		</button>

		<button
			type="button"
			class="stage__add-btn"
			onclick={() => pick(onopenform)}
			title={$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}
			aria-label={$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}
			data-testid="galaxy-open-form-btn"
		>
			<Plus size={20} aria-hidden="true" />
			<!--
				Підпис видно ЛИШЕ в меню на телефоні. У рядку на широкому екрані
				кнопка кругла й підпис їй нема де вмістити, а в стовпчику самотній
				плюс не каже, що станеться: «додати» — що саме?
			-->
			<span class="stage__label">{$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}</span>
		</button>

		<!--
			Повний екран стоїть ТУТ, а не окремо на сцені, хоч на широкому екрані
			й виглядає як окрема кнопка в кутку. Так він один: два примірники
			означали б два однакові `data-testid` на сторінці, і перевірки не
			могли б послатися на конкретний.

			Значок — стрілки (`Expand`/`Shrink`), а не кути: у кутів немає
			напрямку, тобто вони не кажуть, куди поїде екран. Той самий вибір, що
			в сусідньому `VetCrewGames`, звідки перенесено сервіс.
		-->
		<!--
			Слайдшоу — ЛІВОРУЧ від повного екрана, як просив автор, і це сусідство
			не випадкове: обидві кнопки про те, як дивитися, а не куди йти. Решта
			панелі веде в переліки.
		-->
		<button
			type="button"
			class="stage__fullscreen-btn stage__fullscreen-btn--show"
			onclick={() => pick(() => onslideshow?.())}
			title={slideshow.active ? $t('galaxy.slideshowStop') : $t('galaxy.slideshowStart')}
			aria-label={slideshow.active ? $t('galaxy.slideshowStop') : $t('galaxy.slideshowStart')}
			aria-pressed={slideshow.active}
			data-testid="galaxy-slideshow-btn"
		>
			{#if slideshow.active}
				<Pause size={20} aria-hidden="true" />
			{:else}
				<Play size={20} aria-hidden="true" />
			{/if}
			<span class="stage__label">
				{slideshow.active ? $t('galaxy.slideshowStop') : $t('galaxy.slideshowStart')}
			</span>
		</button>

		<button
			type="button"
			class="stage__fullscreen-btn"
			onclick={() => pick(() => fullscreen.toggle())}
			title={fullscreen.active
				? $t('galaxy.exitFullscreen', { default: 'Вийти з повного екрана' })
				: $t('galaxy.enterFullscreen', { default: 'На весь екран' })}
			aria-label={fullscreen.active
				? $t('galaxy.exitFullscreen', { default: 'Вийти з повного екрана' })
				: $t('galaxy.enterFullscreen', { default: 'На весь екран' })}
			data-testid="galaxy-fullscreen-btn"
		>
			{#if fullscreen.active}
				<Shrink size={20} aria-hidden="true" />
			{:else}
				<Expand size={20} aria-hidden="true" />
			{/if}
			<span class="stage__label">
				{fullscreen.active
					? $t('galaxy.exitFullscreen', { default: 'Вийти з повного екрана' })
					: $t('galaxy.enterFullscreen', { default: 'На весь екран' })}
			</span>
		</button>
	</div>
</div>

<style>
	.stage__controls {
		position: absolute;
		z-index: 3;
		left: clamp(0.75rem, 2vw, 1.5rem);
		right: clamp(0.75rem, 2vw, 1.5rem);
		bottom: clamp(0.75rem, 2vh, 1.5rem);
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}

	.stage__items {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}

	/* На широкому екрані перемикача немає — усі кнопки й так у рядку. */
	.stage__menu-btn {
		display: none;
	}

	.stage__roster-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: 999px;
		background: rgb(5 10 31 / 0.72);
		color: var(--galaxy-text);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}

	/*
	 * Три переліки — трохи менші за «Усі випускники»: вони другорядні, і різниця
	 * в розмірі каже це без слів.
	 *
	 * Лише на широкому екрані. Гейт `e2e/touch-targets` міряє цілі дотику на
	 * мобільному з порогом 44px, і в меню ці ж кнопки вертаються до 44 (див.
	 * медіазапит нижче).
	 */
	.stage__roster-btn--nav {
		min-height: 38px;
		padding: 0 0.8rem;
		font-size: 0.82rem;
	}

	.stage__roster-btn:hover {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}

	.stage__add-btn {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid rgb(140 190 255 / 0.4);
		border-radius: 50%;
		background: rgb(5 10 31 / 0.72);
		color: #cfe4ff;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition:
			transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.stage__add-btn:hover {
		background: rgb(12 22 56 / 0.9);
		border-color: rgb(140 190 255 / 0.8);
		color: #fff;
		transform: rotate(90deg) scale(1.08);
	}

	.stage__add-btn:active {
		transform: rotate(90deg) scale(0.92);
	}

	/*
	 * Повний екран: на широкому екрані — кружечок у ПРАВОМУ ВЕРХНЬОМУ кутку,
	 * хоч у розмітці він стоїть у нижньому рядку.
	 *
	 * `position: fixed`, а не `absolute`: рядок керування притиснутий до низу
	 * сцени, і від нього до верху не дотягнутися. Сцена лежить `fixed; inset: 0`
	 * без жодного `transform`, тож вікно тут і є система координат.
	 */
	.stage__fullscreen-btn {
		position: fixed;
		z-index: 3;
		top: clamp(0.75rem, 2vh, 1.5rem);
		right: clamp(0.75rem, 2vw, 1.5rem);
		display: grid;
		place-items: center;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		width: 44px;
		height: 44px;
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: 999px;
		background: rgb(5 10 31 / 0.72);
		color: var(--galaxy-text);
		cursor: pointer;
		backdrop-filter: blur(8px);
		transition:
			border-color var(--transition-base),
			background var(--transition-base);
	}

	/*
	 * Показ анкет — ЛІВОРУЧ від повного екрана, тобто на його ширину плюс
	 * проміжок правіше від правого краю. Модифікатор, а не другий набір правил:
	 * кнопки однакові в усьому, крім місця, і копія п'ятнадцяти рядків
	 * розійшлася б на першій же правці вигляду.
	 *
	 * Правило стоїть ПІСЛЯ базового — вага в них однакова, тож вирішує порядок.
	 * У розкритому меню на телефоні його перебиває `--open` (два класи проти
	 * одного), і кнопка там стає таким самим рядком, як решта.
	 */
	.stage__fullscreen-btn--show {
		right: calc(clamp(0.75rem, 2vw, 1.5rem) + 44px + 0.5rem);
	}

	.stage__fullscreen-btn:hover,
	.stage__fullscreen-btn:focus-visible {
		border-color: rgb(140 190 255 / 0.6);
		background: rgb(5 10 31 / 0.9);
	}

	/* Підписи кнопок-значків живуть лише в меню на телефоні. */
	.stage__label {
		display: none;
	}

	.stage__total {
		opacity: 0.65;
		font-variant-numeric: tabular-nums;
	}

	/*
	 * Три рівні прозорості на комп'ютері: 50% удалині, 75% поблизу, 100% під
	 * курсором.
	 *
	 * Прозорість несе КОЖНА кнопка, а не рядок: `opacity` на батькові
	 * перемножується з дитячою, і кнопка під курсором не змогла б стати
	 * яскравішою за рядок — 0.5 × 1 це все одно 0.5.
	 *
	 * Рівень приходить ЗМІННОЮ на контейнері, а не селектором
	 * `.stage__controls--near .stage__items > *`. Селектор теж працював би —
	 * специфічності в нього досить, — але змінна тримає всі три рівні в трьох
	 * рядках поруч, а не розкидає по вкладених селекторах, і не залежить від
	 * того, як scoping Svelte перепише спадковість (`:where(.s-hash)` у
	 * скомпільованих правилах).
	 *
	 * Заміряти це в прихованій браузерній панелі можна лише з вимкненою
	 * транзицією: кадрів рендеру там немає, тож `transition: opacity` застигає на
	 * початковому значенні, і `getComputedStyle` віддає 0.5 навіть тоді, коли
	 * змінна вже 0.75. Півгодини пішло на пошук «дефекту», якого не було.
	 *
	 * `:focus-visible` теж дає повну видимість: інакше кнопка, до якої дійшли
	 * клавіатурою, лишалася б напівпрозорою — тобто фокус було б не видно.
	 *
	 * Лише там, де є курсор і широкий екран. На дотику наближення не існує, а в
	 * меню на телефоні напівпрозорі пункти читалися б як недоступні.
	 */
	@media (hover: hover) and (min-width: 641px) {
		.stage__controls {
			--stage-dim: 0.5;
		}

		.stage__controls--near {
			--stage-dim: 0.75;
		}

		.stage__items > * {
			opacity: var(--stage-dim);
			transition: opacity 0.25s ease;
		}

		.stage__items > *:hover,
		.stage__items > *:focus-visible {
			opacity: 1;
		}
	}

	/*
	 * Три переліки вдалині — самі значки, поблизу — значок із підписом.
	 *
	 * Анімується `max-width`, а не `width`: від `auto` до числа транзиція не
	 * рахується взагалі, тож ширина стрибала б без жодної анімації. Тому підпис
	 * лежить у смузі нульової ширини з `overflow: hidden`, а поблизу смуга
	 * розтягується до стелі, більшої за найдовший підпис («Групи випускників»).
	 * Стеля лише обмежує — ширшою за свій текст кнопка не стає (заміряно: 46px
	 * згорнута, 191px розкрита).
	 *
	 * Відступ між значком і підписом теж анімується і живе на підписі, а не як
	 * `gap` кнопки: `gap` не знає, що сусід має нульову ширину, і згорнута кнопка
	 * носила б 0.5rem порожнечі праворуч від значка.
	 *
	 * Півсекунди й одна крива на всі три властивості — рух виходить один, а не
	 * три різні.
	 *
	 * ## Чому 900px, а не 641px, як у прозорості
	 *
	 * Рядок кнопок має `flex-wrap: wrap`. Заміряно: згорнутий він 435px, а
	 * розкритий 733px — плюс відступи контейнера це близько 770px. У вужчому
	 * вікні розкриття перекинуло б кнопки на другий рядок, і замість плавного
	 * підпису читач бачив би стрибок усього керування. Тому вузькому вікну
	 * підписи лишаються видимими завжди — так, як було до цієї зміни.
	 */
	@media (hover: hover) and (min-width: 900px) {
		.stage__roster-btn--nav {
			gap: 0;
		}

		.stage__nav-label {
			display: inline-block;
			max-width: 0;
			margin-left: 0;
			overflow: hidden;
			white-space: nowrap;
			opacity: 0;
			transition:
				max-width 0.5s ease,
				margin-left 0.5s ease,
				opacity 0.5s ease;
		}

		.stage__controls--near .stage__nav-label {
			max-width: 14rem;
			margin-left: 0.5rem;
			opacity: 1;
		}
	}

	/*
	 * Телефон: усе за одним значком.
	 *
	 * Межа 640 — не кругле число зі стелі: п'ять кнопок у рядок займають
	 * близько 620 пікселів, і нижче цього вони переносяться, з'їдаючи чверть
	 * екрана. Стовпчик відкривається ВГОРУ, бо сам рядок стоїть біля нижнього
	 * краю.
	 */
	@media (max-width: 640px) {
		.stage__menu-btn {
			display: grid;
			place-items: center;
			width: 44px;
			height: 44px;
			border: 1px solid rgb(255 255 255 / 0.22);
			border-radius: 999px;
			background: rgb(5 10 31 / 0.72);
			color: var(--galaxy-text);
			cursor: pointer;
			backdrop-filter: blur(8px);
		}

		.stage__items {
			display: none;
		}

		.stage__controls--open .stage__items {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			order: -1;
		}

		.stage__controls--open {
			flex-direction: column;
			align-items: flex-end;
		}

		/* У стовпчику підпис має вести за собою всю ширину плашки. */
		.stage__controls--open .stage__roster-btn,
		.stage__controls--open .stage__add-btn,
		.stage__controls--open .stage__fullscreen-btn {
			justify-content: flex-start;
			width: 100%;
		}

		/*
		 * У меню кнопки анкети й повного екрана стають такими самими плашками, як
		 * переліки: у стовпчику кружечок поруч із підписаними рядками читався б як
		 * щось інакше за призначенням, хоч він тут рівно такий самий пункт.
		 */
		.stage__controls--open .stage__add-btn,
		.stage__controls--open .stage__fullscreen-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			min-height: 44px;
			height: auto;
			padding: 0 1rem;
			border-radius: 999px;
		}

		/* Обертання плюса лишається кружечку: на широкій плашці воно ні до чого. */
		.stage__controls--open .stage__add-btn:hover,
		.stage__controls--open .stage__add-btn:active {
			transform: none;
		}

		/* У стовпчику він уже не в кутку — стає звичайним рядком меню. */
		.stage__controls--open .stage__fullscreen-btn {
			position: static;
			top: auto;
			right: auto;
		}

		.stage__controls--open .stage__label {
			display: inline;
		}

		/* У меню всі пункти однакові, і ціль дотику знову 44px. */
		.stage__controls--open .stage__roster-btn--nav {
			min-height: 44px;
			padding: 0 1rem;
			font-size: 0.9rem;
		}
	}
</style>
