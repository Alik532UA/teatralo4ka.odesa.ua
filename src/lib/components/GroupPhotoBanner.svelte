<script lang="ts">
	import { asset } from '$app/paths';
	import { imageSize, type LocalImage } from '$lib/config/localImages';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';

	interface Props {
		/** Шляхи знімків. Порожній список — банера немає. */
		photos: readonly string[];
		/** Назва групи: йде в `alt`, у підписи крапок і в заголовок лайтбокса. */
		title: string;
		/**
		 * `cover` — знімок кадрується під коробку 16:10, як фото групи.
		 * `whole` — показується цілком: для афіші, у якої по краях текст.
		 */
		fit?: 'cover' | 'whole';
	}

	let { photos, title, fit = 'cover' }: Props = $props();

	/**
	 * Афіша показується ЦІЛКОМ, а не кадрується під 16:10.
	 *
	 * Знімок групи можна обрізати без втрат — обличчя лишаються в кадрі. Афіша
	 * — це текст по краях: назва школи згори, назви творів унизу; `object-fit:
	 * cover` у коробці 16:10 зрізав би по вісім відсотків зверху й знизу, і
	 * читач бачив би афішу без заголовка. Тому в режимі `whole` коробка бере
	 * пропорцію самого зображення (першого — стопка з кількох афіш тут не
	 * передбачена), а знімок вписується в неї без обрізання.
	 */
	const ownRatio = $derived.by(() => {
		if (fit !== 'whole' || photos.length === 0) return undefined;
		const { width, height } = imageSize(photos[0] as LocalImage);
		return `${width} / ${height}`;
	});

	/** Кожні стільки мілісекунд банер перегортається сам. */
	const ROTATE_MS = 5000;

	/** Знімки лежать стопкою й перемикаються прозорістю, як у героя на головній. */
	let index = $state(0);
	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);

	/**
	 * Випадковий перший знімок і автоперегортання — обидва ТІЛЬКИ в ефекті.
	 *
	 * Сторінка потрапляє в prerender: якби початковий індекс вибирався в тілі
	 * компонента, сервер поклав би в HTML один знімок, а гідратація в браузері
	 * — інший, і розмітка розійшлася б із тією, що прийшла з мережі. Ефект
	 * виконується вже після гідратації, тож обидві сторони збігаються.
	 *
	 * Таймер зупиняється, поки відкритий лайтбокс: інакше знімок під ним
	 * змінювався б сам, і на закритті людина бачила б не те, що відкривала.
	 */
	$effect(() => {
		const total = photos.length;
		if (total < 2) return;

		index = Math.floor(Math.random() * total);

		const id = setInterval(() => {
			if (!lightboxOpen) index = (index + 1) % total;
		}, ROTATE_MS);

		return () => clearInterval(id);
	});

	const lightboxImages = $derived<LightboxImage[]>(
		photos.map((photo) => ({ src: asset(photo), alt: title, title }))
	);

	function open() {
		lightboxIndex = index;
		lightboxOpen = true;
	}
</script>

{#if photos.length}
	<!--
		Клікабельна коробка, а не кожен знімок окремо: вони лежать стопкою й
		перемикаються прозорістю, тож клік мусить ловити сама коробка — інакше
		він діставався б лише верхньому.
	-->
	<div
		class="banner"
		class:banner--whole={fit === 'whole'}
		style:aspect-ratio={ownRatio}
		role="button"
		tabindex="0"
		aria-label={title}
		onclick={open}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				open();
			}
		}}
		data-testid="group-photo-banner"
	>
		{#each photos as photo, i (photo)}
			{@const size = imageSize(photo as LocalImage)}
			<img
				src={asset(photo)}
				alt={title}
				class="banner__img"
				class:is-active={index === i}
				loading="eager"
				fetchpriority={i === 0 ? 'high' : 'low'}
				decoding="async"
				width={size.width}
				height={size.height}
				data-testid="group-photo-img-{i}"
			/>
		{/each}
		<div class="banner__border"></div>
	</div>

	{#if photos.length > 1}
		<div class="banner__dots" role="tablist" aria-label={title}>
			{#each photos as photo, i (photo)}
				<button
					type="button"
					class="banner__dot"
					class:is-active={index === i}
					role="tab"
					aria-selected={index === i}
					aria-label={`${title} — ${i + 1}`}
					onclick={() => (index = i)}
					data-testid="group-photo-item-{i}"
				></button>
			{/each}
		</div>
	{/if}

	<PhotoLightbox
		images={lightboxImages}
		currentIndex={lightboxIndex}
		isOpen={lightboxOpen}
		onclose={() => (lightboxOpen = false)}
	/>
{/if}

<style>
	.banner {
		position: relative;
		max-width: 820px;
		margin: 0 auto 1rem;
		/* Пропорція на коробці, бо знімки різні: 1280×720 і два 768×576. Без неї
		   стопка стрибала б у висоті при кожному перегортанні. */
		aspect-ratio: 16 / 10;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(12px);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		transition:
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.4s ease;
	}

	.banner:hover {
		transform: scale(1.01);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
	}

	.banner:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 4px;
	}

	/* Внутрішня рамка — той самий прийом, що в героя на головній: вона лежить
	   ПОВЕРХ знімка й не займає місця, тож не змінює його пропорцій. */
	.banner__border {
		position: absolute;
		inset: 0;
		border: 16px solid rgba(255, 255, 255, 0.15);
		border-radius: inherit;
		pointer-events: none;
	}

	/* Стопка: усі знімки один на одному, видно лише активний. */
	.banner__img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.6s ease;
	}

	.banner__img.is-active {
		opacity: 1;
	}

	/* Афіша: цілком, без кадрування — пропорцію коробці задає саме зображення. */
	.banner--whole .banner__img {
		object-fit: contain;
	}

	.banner__dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.banner__dot {
		width: 9px;
		height: 9px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		transition:
			background 0.25s ease,
			transform 0.25s ease;
	}

	.banner__dot:hover {
		background: rgba(255, 255, 255, 0.6);
	}

	.banner__dot.is-active {
		background: var(--accent-primary);
		transform: scale(1.3);
	}

	.banner__dot:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 3px;
	}

	:global(.light-theme) .banner__border {
		border-color: rgba(0, 0, 0, 0.08);
	}

	:global(.light-theme) .banner__dot {
		background: rgba(0, 0, 0, 0.2);
	}
</style>
