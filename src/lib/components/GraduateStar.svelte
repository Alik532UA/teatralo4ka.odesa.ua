<script lang="ts">
	import { graduatePhoto, graduatePhotoSrcset, allGraduatePhotos, type GraduateIndexEntry } from '$lib/data/graduates';
	import { портретУЧерзі } from '$lib/services/imageQueue';
	import { запуститиЦикл } from '$lib/utils/photoCycle';
	import { browser } from '$app/environment';

	interface Props {
		graduate: GraduateIndexEntry;
		/** `photo` — анкету заповнено, є портрет. `plain` — лише ім'я. */
		kind: 'photo' | 'plain';
		/**
		 * Ранг у потоці майстра — і залежить він від того, ХТО ця людина, а не від
		 * того, як вона пов'язана з майстром:
		 *
		 *   `colleague` — сама стала майстром цієї школи (трохи більша зірка);
		 *   `graduate`  — випускник, чий курс вів цей майстер (звичайна);
		 *   `student`   — учень окремого предмета (трохи менша).
		 *
		 * Доти сюди приходило `role: 'master' | 'teacher'`, тобто ВИД ЗВ'ЯЗКУ, і
		 * розмір зірки залежав від нього. Через це колеги-майстри не мали розміру
		 * взагалі: у потоці їх просто не було (див. `MasterStudentEntry`).
		 *
		 * У «Галактиці» ранг не передається — там усі рівні, і це типове значення.
		 */
		tier?: 'colleague' | 'graduate' | 'student';
		/**
		 * Портрет не з теки випускників.
		 *
		 * Колеги-майстри лежать в `static/masters/`, а не в `static/graduates/`, і
		 * `graduatePhoto()` для них дала б 404. Одного розміру досить: зірка — це
		 * 38–52 px, і `srcset` тут не має чого вибирати.
		 */
		photo?: string | null;
		onselect: () => void;
	}

	let { graduate, kind, tier = 'graduate', photo = null, onselect }: Props = $props();

	let buttonEl = $state<HTMLButtonElement | null>(null);
	let isNearBottom = $state(false);

	// Зовнішній портрет виключає мультифото: додаткові кадри є лише у випускників.
	const photoCount = $derived(photo ? 1 : (graduate.photoCount ?? 1));
	const photos = $derived(
		photoCount > 1 ? allGraduatePhotos(graduate.slug, photoCount, 96) : []
	);

	/**
	 * ГЕОМЕТРІЯ РАНГА ОДНИМ ПЕРЕЛІКОМ — і головна причина не в охайності.
	 *
	 * Ці ж числа стоять у стилях (`--photo-size` і множник `scale`), і рівно
	 * розходження двох таких місць колись зробило з кола овал 44×52. Тут вони
	 * потрібні ще й скрипту — щоб `sizes` описував справжній розмір, — тож
	 * копія була б третьою. Інваріант `graduateStar.test.ts` звіряє цей перелік
	 * зі стилями того самого файлу.
	 */
	const РАНГИ = {
		colleague: { розмір: 52, наближення: 1.6 },
		graduate: { розмір: 44, наближення: 1.9 },
		student: { розмір: 38, наближення: 1.8 }
	} as const;

	/**
	 * `sizes` описує РЕАЛЬНИЙ розмір зірки, а не запас на наведення.
	 *
	 * Доти тут стояло `(hover: hover) 176px, 96px`, і 176 — це 44 × 4, тобто
	 * запас під наведену зірку на екрані з DPR 2. Платила за нього КОЖНА зірка й
	 * ЗАВЖДИ: браузер обирав 192w на звичайному десктопі й 480w на ноутбуці з
	 * DPR 2. Заміряно на 120 зірках: 816 КБ і 2766 КБ відповідно, замість 347 КБ
	 * у 96w. Бюджет бандла цього не бачив — він міряє JS і реєстри, не картинки.
	 *
	 * Тепер `sizes` каже правду: 44 px у спокої (на DPR 1 і 2 це 96w) і
	 * 84 px під курсором (44 × 1.9; на DPR 2 це 192w). Більший кандидат
	 * підтягується лише для тієї зірки, на яку дивляться, і поки він їде,
	 * видимим лишається попередній — тобто без блимання.
	 *
	 * Заміряно в браузері, бо на цьому тримається весь задум: зміна `sizes`
	 * ПІСЛЯ завантаження справді змушує браузер переобрати кандидата (96w → 480w
	 * при `sizes: 400px`). Заразом виявилося, що НАЗАД він не переобирає ніколи:
	 * після повернення `sizes` до 44 px джерело лишилося 480w. Тобто зірка,
	 * на яку раз навели, тримає більший кандидат до кінця сеансу — це один
	 * зайвий запит на ту зірку, якою людина цікавилася, і ніякої видимої
	 * різниці. Написано тут, щоб наступний читач не шукав, чому воно «не
	 * зменшується назад».
	 */
	let zoomed = $state(false);
	const sizes = $derived.by(() => {
		const { розмір, наближення } = РАНГИ[tier];
		return zoomed ? `${Math.round(розмір * наближення)}px` : `${розмір}px`;
	});

	/**
	 * ПОКИ ПОРТРЕТ НЕ ПРИЙШОВ — зірка виглядає зіркою, а не порожньою рамкою.
	 *
	 * Рамку малювало `outline` на самому `<img>`: атрибути `width`/`height`
	 * дають коробку 44×44 ще до першого байта вмісту, а `border-radius: 50%`
	 * робить із обведення біле коло. Порожнього кільця ніхто не задумував — воно
	 * побічний ефект обведення портрета, і разом із відсутністю переходу давало
	 * саме те, що видно на екрані: коло-привид, потім різкий стрибок обличчя, а
	 * інколи ще й обличчя, обрізане горизонтально посередині.
	 *
	 * Обидві половини лікуються одним прапорцем: до готовності портрет має
	 * `opacity: 0` (а з ним і обведення), а на його місці світиться така сама
	 * точка, як у людей без анкети. Коробка при цьому лишається 56 px — точка
	 * підмінює лише вигляд, не ціль дотику, інакше розмір цілі стрибав би на
	 * льоту й гейт `e2e/touch-targets` міряв би різне в різні секунди.
	 *
	 * Для мультифото рахуються ВСІ кадри: показувати стопку, коли готовий один
	 * шар із трьох, означало б віддати кадр, на якому WAAPI саме тримає інший,
	 * ще порожній.
	 */
	let готових = $state(0);
	const готово = $derived(готових >= Math.max(1, photos.length || 1));

	function updatePlacement() {
		if (buttonEl) {
			const rect = buttonEl.getBoundingClientRect();
			const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
			isNearBottom = rect.bottom > viewportHeight * 0.8;
		}
	}

	function наблизити() {
		zoomed = true;
		updatePlacement();
	}

	/**
	 * Цикл мультифото: один проліт — одна послідовність знімків.
	 *
	 * Обчислення кадрів живе в `$lib/utils/photoCycle` і має власні тести: воно
	 * переїхало туди, коли цей файл переріс стелю розміру, і поділ виявився
	 * природним — арифметика точок переходу нічого не знає ні про кнопку, ні про
	 * ранги.
	 *
	 * `--duration` і `--delay` успадковуються від `.lane` у `GraduateGalaxy`, тож
	 * цикл рівно збігається з прольотом через екран.
	 */
	$effect(() => {
		if (!browser || photoCount <= 1 || !buttonEl) return;
		// Рух — саме те, що просили прибрати; статичний кадр лишає CSS нижче.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const стиль = getComputedStyle(buttonEl);
		return запуститиЦикл(
			buttonEl,
			'.star__photo--layer',
			parseFloat(стиль.getPropertyValue('--duration')) || 30,
			parseFloat(стиль.getPropertyValue('--delay')) || 0
		);
	});
</script>

<!--
	Зірка — справжня кнопка, а не піксель на канвасі.

	Це не зручність розробки: ціль на canvas неможливо ані сфокусувати з
	клавіатури, ані озвучити читалкою, ані виміряти гейтом `e2e/touch-targets`, а
	зображення втратило б `srcset` і на телефоні з DPR 3 стало б мутним.

	Жодних обробників наведення: зупинку, збільшення й показ підпису робить CSS
	через `:hover` і `:focus-visible`.
-->
<button
	bind:this={buttonEl}
	type="button"
	class="star star--{kind} star--tier-{tier}"
	class:star--multi={photoCount > 1}
	class:star--ready={готово}
	onmouseenter={наблизити}
	onmouseleave={() => (zoomed = false)}
	onfocus={наблизити}
	onblur={() => (zoomed = false)}
	onclick={onselect}
	data-testid="galaxy-{graduate.slug}-btn"
>
	{#if kind === 'photo'}
		<!--
			Точка під портретом — та сама, що в людини без анкети, і саме тому
			окремого вигляду для «вантажиться» тут немає: галактика має два стани,
			а не три. Вона лежить у DOM і після появи обличчя, бо зникає
			переходом; прибрати її блоком `{#if}` означало б обміняти різку появу
			портрета на різке зникнення точки.
		-->
		<span class="star__face">
			<span class="star__dot star__dot--waiting" aria-hidden="true"></span>
		{#if photoCount > 1}
			<!--
				Мультифото: всі <img> накладені одна на одну. CSS-анімація
				`photo-cycle-N` плавно перемикає opacity між ними, синхронізовано
				з тривалістю прольоту (`--duration` від `.lane`).

				Порядок: від наймолодшого (index 0 = додаткове фото 2) до
				найстаршого (останній = основне фото). Метафора: дорослішення
				під час польоту.
			-->
			<div class="star__photos">
				{#each photos as photo, i (i)}
					<img
						class="star__photo star__photo--layer"
						{sizes}
						width="96"
						height="96"
						decoding="async"
						alt={i === photos.length - 1 ? graduate.name : ''}
						{@attach портретУЧерзі(photo.src, photo.srcset, () => (готових += 1))}
					/>
				{/each}
			</div>
		{:else}
			<img
				class="star__photo"
				sizes={photo ? undefined : sizes}
				width="96"
				height="96"
				decoding="async"
				alt={graduate.name}
				{@attach портретУЧерзі(
					photo ?? graduatePhoto(graduate.slug, 96),
					photo ? undefined : graduatePhotoSrcset(graduate.slug),
					() => (готових = 1)
				)}
			/>
		{/if}
		</span>
	{:else}
		<span class="star__dot" aria-hidden="true"></span>
	{/if}

	<span class="star__label" class:star__label--top={isNearBottom}>
		<span class="star__name">{graduate.name}</span>
		{#if graduate.graduationYear}
			<span class="star__year">{graduate.graduationYear}</span>
		{/if}
	</span>
</button>

<style>
	/*
	 * Діаметр обличчя — ОДНЕ число на ранг, і саме тому змінна.
	 *
	 * Доти розмір стояв двічі: на самому `<img class="star__photo">` і окремо на
	 * `.star__photos` — обгортці стопки мультифото. Ранги переозначували лише
	 * перше, тож у колеги з кількома знімками картинка ставала 44×52: ширину
	 * задавала обгортка (44, без переозначення), висоту — правило ранга (52).
	 * Коло перетворювалося на овал, і лише в тих, у кого фото більше за одне.
	 *
	 * Змінна прибирає саму можливість розходження: обидва місця читають її, а
	 * ранг міняє її один раз.
	 */
	.star {
		--photo-size: 44px;
		display: grid;
		place-items: center;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		/*
		 * 56px — понад обов'язковий мінімум WCAG 2.2 (24) і понад власний стандарт
		 * проєкту (44). Гейт `e2e/touch-targets` це міряє.
		 *
		 * Запас навколо видимого кола тут не косметичний: зірка рухається, і саме
		 * прозорі поля дають курсору «схопити» її раніше, ніж він дістанеться до
		 * самого обличчя. Без них у ціль 44px, що їде, влучити важко.
		 */
		width: 56px;
		height: 56px;
		transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.star--photo {
		width: 56px;
		height: 56px;
	}

	.star--plain {
		width: 36px;
		height: 36px;
	}

	.star:hover,
	.star:focus-visible {
		transform: scale(1.9);
	}

	/*
	 * ТРИ РАНГИ, і різниця між ними лише в розмірі.
	 *
	 * Прозорості тут більше немає ніде. Учень доти малювався з `opacity: 0.88`, і
	 * це читалося як «зображення не доїхало» або як вимкнений елемент, а не як
	 * «трохи менший». Зменшення каже те саме, нічого не ламаючи: напівпрозорий
	 * портрет ще й змішується з тлом, тобто його контраст залежить від того, що
	 * зараз пролітає позаду.
	 *
	 * Числа: 66 / 56 / 50 px коробка і 52 / 44 / 38 px портрет. Мінімум WCAG 2.2
	 * для цілі — 24 px, власний стандарт проєкту — 44; менша з коробок (50) вище
	 * за обидва, і це міряє гейт `e2e/touch-targets`.
	 */
	.star--tier-colleague {
		width: 66px;
		height: 66px;
	}

	.star--tier-student {
		width: 50px;
		height: 50px;
	}

	/* Наближення слабше в більшої зірки: кінцевий розмір у всіх приблизно один,
	   інакше колега при наведенні перекривав би пів екрана. */
	.star--tier-colleague:hover,
	.star--tier-colleague:focus-visible {
		transform: scale(1.6);
	}

	.star--tier-student:hover,
	.star--tier-student:focus-visible {
		transform: scale(1.8);
	}

	/*
	 * Спільне місце для точки-плейсхолдера й портрета: вони мусять стояти ОДНЕ
	 * ПОВЕРХ ОДНОГО, щоб перехід був перетіканням, а не зміною розкладки.
	 *
	 * Розмір саме `--photo-size`, а не 100 %: коробка кнопки більша за обличчя
	 * навмисно (прозорі поля, за які легше «схопити» зірку, що їде), і точка
	 * мусить світитися там, де потім буде обличчя, а не по центру всієї цілі.
	 */
	.star__face {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--photo-size);
		height: var(--photo-size);
	}

	.star__photo {
		width: var(--photo-size);
		height: var(--photo-size);
		border-radius: 50%;
		object-fit: cover;
		filter: brightness(0.85) saturate(0.9);
		/* `outline`, а не `box-shadow` із розмиттям: обведення без blur не змушує
		   перемальовувати шар на кожному кадрі руху. */
		outline: 1px solid rgb(255 255 255 / 0.4);
		outline-offset: -1px;
		transition: filter 280ms ease;
	}

	/*
	 * ПОЯВА ОБЛИЧЧЯ — секунда, і не більше.
	 *
	 * Нуль тут не лише ховає незавантажене зображення, а й знімає з екрана
	 * `outline`: прозорість діє на весь елемент разом з обведенням, і саме тому
	 * порожнє біле кільце зникає без жодної правки самого обведення.
	 *
	 * Секунда — а не дві, як у сусідньому проєкті: там картка стоїть на місці, а
	 * тут зірка летить. За секунду вона проходить близько півтора відсотка
	 * ширини екрана; за дві перехід починає читатися як «підвантажується», а не
	 * як «з'явилася».
	 *
	 * ДВА РІЗНІ НОСІЇ ПРОЗОРОСТІ, і плутати їх не можна. В одинокого портрета
	 * переходом володіє сам `<img>`. У мультифото прозорість ШАРІВ належить Web
	 * Animations API (див. `$effect` вище), а анімація WAAPI сильніша за будь-яке
	 * авторське правило — тобто `opacity` на шарі просто не подіяв би. Там
	 * переходом володіє обгортка, і множення двох прозоростей дає рівно те, що
	 * потрібно: поява стопки плюс власний цикл усередині неї.
	 */
	.star:not(.star--multi) .star__photo,
	.star--multi .star__photos {
		opacity: 0;
		transition: opacity 1s ease-out;
	}

	.star--ready:not(.star--multi) .star__photo,
	.star--multi.star--ready .star__photos {
		opacity: 1;
	}

	/* Точка стоїть рівно там, де з'явиться обличчя, і згасає тим самим тактом. */
	.star__dot--waiting {
		position: absolute;
		opacity: 0.7;
		transition: opacity 1s ease-out;
	}

	.star--ready .star__dot--waiting {
		opacity: 0;
	}

	.star--tier-colleague {
		--photo-size: 52px;
	}

	.star--tier-colleague .star__photo {
		/* Обведення яскравіше: колега мусить читатися як окремий ранг і без
		   порівняння з сусідньою зіркою, якої в кадрі може й не бути. */
		outline-color: rgb(255 255 255 / 0.7);
	}

	.star--tier-student {
		--photo-size: 38px;
	}

	.star:hover .star__photo,
	.star:focus-visible .star__photo {
		filter: brightness(1.05) saturate(1);
	}

	/*
	 * Контейнер стопки фото для мультифото-зірок.
	 * Всі <img> абсолютно позиціоновані всередині.
	 */
	.star__photos {
		position: relative;
		width: var(--photo-size);
		height: var(--photo-size);
	}

	/*
	 * Шар мультифото: позиціювання в стопці.
	 * Анімація opacity керується Web Animations API із $effect
	 * (динамічні keyframes для будь-якого N фото, точно 2с crossfade).
	 */
	.star__photo--layer {
		position: absolute;
		inset: 0;
	}

	/* Зірка без обличчя навмисно схожа на фонову — доки на неї не навели.
	   Світіння градієнтом, а не `box-shadow`: тінь на елементі, що рухається
	   щокадру, змушує перемальовувати шар. */
	.star__dot {
		width: 24px;
		height: 24px;
		background: radial-gradient(
			circle,
			rgb(234 242 255 / 0.9) 0 3px,
			rgb(180 214 255 / 0.35) 5px,
			transparent 60%
		);
		opacity: 0.7;
		transition: opacity 280ms ease;
	}

	.star--plain:hover .star__dot,
	.star--plain:focus-visible .star__dot {
		opacity: 1;
	}

	.star__label {
		position: absolute;
		top: calc(100% - 4px);
		left: 50%;
		translate: -50% 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.1em;
		padding: 3px 7px;
		border-radius: 6px;
		background: rgb(5 10 31 / 0.9);
		border: 1px solid rgb(255 255 255 / 0.15);
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.5);
		color: var(--galaxy-text, #ffffff);
		font-size: 0.7rem;
		line-height: 1.15;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 180ms ease;
		pointer-events: none;
		/* Підпис не масштабується разом із зіркою: інакше текст стає розмитим. */
		scale: calc(1 / 1.9);
	}

	/* Підпис не масштабується разом із зіркою, тож дільник мусить збігатися з
	   `scale` наближення того ж рангу — інакше текст стає розмитим. */
	.star--tier-colleague .star__label {
		scale: calc(1 / 1.6);
	}

	.star--tier-student .star__label {
		scale: calc(1 / 1.8);
	}

	.star__label--top {
		top: auto;
		bottom: calc(100% - 4px);
	}

	.star:hover .star__label,
	.star:focus-visible .star__label {
		opacity: 1;
	}

	.star__name {
		font-weight: 500;
	}

	.star__year {
		opacity: 0.75;
		font-size: 0.65rem;
		font-variant-numeric: tabular-nums;
	}

	@media (prefers-reduced-motion: reduce) {
		.star {
			transition: none;
		}

		/*
		 * Поява портрета лишається, але вмить: показ усе одно мусить чекати
		 * декодування (інакше повертається обличчя, обрізане горизонтально), а
		 * ось секунда перетікання — це рух, і саме її просили прибрати.
		 */
		.star:not(.star--multi) .star__photo,
		.star--multi .star__photos,
		.star__dot--waiting {
			transition: none;
		}

		.star__photo--layer {
			animation: none;
		}

		/* При зниженому русі — показуємо лише останнє (поточне) фото */
		.star__photo--layer:not(:last-child) {
			opacity: 0;
		}

		.star__photo--layer:last-child {
			opacity: 1;
		}
	}
</style>

