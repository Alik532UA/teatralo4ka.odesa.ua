<script lang="ts">
	import { graduatePhoto, graduatePhotoSrcset, allGraduatePhotos, type GraduateIndexEntry } from '$lib/data/graduates';
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

	function updatePlacement() {
		if (buttonEl) {
			const rect = buttonEl.getBoundingClientRect();
			const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
			isNearBottom = rect.bottom > viewportHeight * 0.8;
		}
	}

	/**
	 * Web Animations API: crossfade між фото, синхронізований з drift.
	 *
	 * Чому не CSS keyframes: CSS не підтримує динамічні відсотки.
	 * Для N фото точки переходу — `1/N`, `2/N`, …, `(N-1)/N` — обчислюються
	 * тільки в JS. WAAPI працює на GPU compositor як і CSS animations.
	 *
	 * `--duration` і `--delay` успадковуються від `.lane` в GraduateGalaxy,
	 * тому кожен проліт = повний цикл від наймолодшого до поточного фото.
	 */
	$effect(() => {
		if (!browser || photoCount <= 1 || !buttonEl) return;

		// Поважаємо prefers-reduced-motion
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const style = getComputedStyle(buttonEl);
		const duration = parseFloat(style.getPropertyValue('--duration')) || 30;
		const delay = parseFloat(style.getPropertyValue('--delay')) || 0;
		const durationMs = duration * 1000;
		const delayMs = delay * 1000;

		// 4 секунди як частка тривалості, cap 12% для коротких прольотів
		const fadeFrac = Math.min(4 / duration, 0.12);
		const half = fadeFrac / 2;

		const layers = buttonEl.querySelectorAll<HTMLElement>('.star__photo--layer');
		const animations: Animation[] = [];

		layers.forEach((img, i) => {
			const n = photos.length;
			const fadeIn = i / n;           // коли це фото з'являється
			const fadeOut = (i + 1) / n;     // коли зникає

			let keyframes: Keyframe[];

			if (i === 0) {
				// Перше (наймолодше): видиме з початку, зникає на fadeOut
				keyframes = [
					{ opacity: 1, offset: 0 },
					{ opacity: 1, offset: Math.max(0, fadeOut - half) },
					{ opacity: 0, offset: Math.min(1, fadeOut + half) },
					{ opacity: 0, offset: 1 },
				];
			} else if (i === n - 1) {
				// Останнє (поточне): приховане, з'являється на fadeIn
				keyframes = [
					{ opacity: 0, offset: 0 },
					{ opacity: 0, offset: Math.max(0, fadeIn - half) },
					{ opacity: 1, offset: Math.min(1, fadeIn + half) },
					{ opacity: 1, offset: 1 },
				];
			} else {
				// Середнє: з'являється на fadeIn, зникає на fadeOut
				keyframes = [
					{ opacity: 0, offset: 0 },
					{ opacity: 0, offset: Math.max(0, fadeIn - half) },
					{ opacity: 1, offset: Math.min(fadeIn + half, fadeOut - half) },
					{ opacity: 1, offset: Math.max(fadeIn + half, fadeOut - half) },
					{ opacity: 0, offset: Math.min(1, fadeOut + half) },
					{ opacity: 0, offset: 1 },
				];
			}

			const anim = img.animate(keyframes, {
				duration: durationMs,
				delay: delayMs,
				iterations: Infinity,
				easing: 'linear',
			});
			animations.push(anim);
		});

		return () => animations.forEach((a) => a.cancel());
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
	onmouseenter={updatePlacement}
	onfocus={updatePlacement}
	onclick={onselect}
	data-testid="galaxy-{graduate.slug}-btn"
>
	{#if kind === 'photo'}
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
						src={photo.src}
						srcset={photo.srcset}
						sizes="(hover: hover) 176px, 96px"
						width="96"
						height="96"
						loading="lazy"
						decoding="async"
						alt={i === photos.length - 1 ? graduate.name : ''}
					/>
				{/each}
			</div>
		{:else}
			<img
				class="star__photo"
				src={photo ?? graduatePhoto(graduate.slug, 96)}
				srcset={photo ? undefined : graduatePhotoSrcset(graduate.slug)}
				sizes={photo ? undefined : '(hover: hover) 176px, 96px'}
				width="96"
				height="96"
				loading="lazy"
				decoding="async"
				alt={graduate.name}
			/>
		{/if}
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
	.star {
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

	.star__photo {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
		filter: brightness(0.85) saturate(0.9);
		/* `outline`, а не `box-shadow` із розмиттям: обведення без blur не змушує
		   перемальовувати шар на кожному кадрі руху. */
		outline: 1px solid rgb(255 255 255 / 0.4);
		outline-offset: -1px;
		transition: filter 280ms ease;
	}

	.star--tier-colleague .star__photo {
		width: 52px;
		height: 52px;
		/* Обведення яскравіше: колега мусить читатися як окремий ранг і без
		   порівняння з сусідньою зіркою, якої в кадрі може й не бути. */
		outline-color: rgb(255 255 255 / 0.7);
	}

	.star--tier-student .star__photo {
		width: 38px;
		height: 38px;
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
		width: 44px;
		height: 44px;
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

