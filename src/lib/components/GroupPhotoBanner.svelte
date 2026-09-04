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

	/**
	 * CSS `aspect-ratio` першого портретного фото, або `undefined`.
	 *
	 * Портретне фото у коробці 16:10 з `object-fit: cover` втрачає ≈60 %
	 * висоти — обличчя зрізаються. Тому для портретного знімка коробка
	 * отримує пропорцію самого зображення (`width / height`), і `cover`
	 * заповнює її точно — рамка лягає по краю фото, а не по краю коробки.
	 */
	const portraitRatio = $derived.by(() => {
		if (fit !== 'cover') return undefined;
		const portrait = photos.find((p) => {
			const s = imageSize(p as LocalImage);
			return s.height > s.width;
		});
		if (!portrait) return undefined;
		const { width, height } = imageSize(portrait as LocalImage);
		return `${width} / ${height}`;
	});

	/** Кожні стільки мілісекунд банер перегортається сам. */
	const ROTATE_MS = 5000;

	/** Знімки лежать стопкою й перемикаються прозорістю, як у героя на головній. */
	let index = $state(0);
	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);

	/**
	 * Що показуємо НАСПРАВДІ — індекс, приведений у межі переліку.
	 *
	 * ## Що зламалося без цього
	 *
	 * Кроки: зайти на `/groups/tu-154/` (два знімки), дочекатися, поки
	 * автоперегортання перемкне на другий, і перейти по зв'язку родоводу на
	 * `/groups/freestyle/` (один знімок). Банер порожній.
	 *
	 * Причина не в даних. Маршрут той самий — `groups/[slug]`, — тож компонент
	 * НЕ перемонтовується, а `index` лишається станом попередньої групи, тобто
	 * одиницею. У розмітці активний знімок обирає `index === i`, а `i` тепер
	 * буває лише нулем: жоден не збігається, і стопка малює нічого. Крапок для
	 * порятунку теж немає — їхній рядок з'являється лише при двох і більше
	 * знімках.
	 *
	 * ## Обмеження І скидання — два запобіжники, і це навмисно
	 *
	 * Заміряно (dev, перехід ТУ-154 → FreeStyle): без обох знімок FreeStyle не
	 * отримує `is-active` — банер порожній. Скидання `index` у гілці «менше двох
	 * знімків» (нижче) саме собою цей шлях лагодить: перевірено окремим
	 * проходом, знімок активний.
	 *
	 * Тобто обмеження тут НЕ тому, що без нього не працює. Воно тому, що
	 * скидання тримається на ефекті — на тому, що той спрацює й не вийде
	 * раніше. Баг виріс рівно з передчасного `return` у цьому ж ефекті, і
	 * наступний такий `return` поверне його. Обмеження ж робить порожній банер
	 * НЕМОЖЛИВИМ незалежно від стану: розмітка не має способу попросити знімок,
	 * якого в переліку немає.
	 */
	const активний = $derived(photos.length === 0 ? 0 : Math.min(index, photos.length - 1));

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
		if (total < 2) {
			// Група з одним знімком: перегортати нічого, але стан мусить лишитися
			// правдивим — інакше `index` тягне за собою одиницю з попередньої групи.
			index = 0;
			return;
		}

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
		lightboxIndex = активний;
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
		class:banner--portrait={portraitRatio !== undefined}
		style:aspect-ratio={ownRatio ?? portraitRatio}
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
				class:is-active={активний === i}
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
					class:is-active={активний === i}
					role="tab"
					aria-selected={активний === i}
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
		border: 16px solid light-dark(rgb(0 0 0 / 0.08), rgba(255, 255, 255, 0.15));
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

	/* Портретне фото: пропорцію коробці задає inline `aspect-ratio` з
	   реальних розмірів знімка, `cover` заповнює точно — рамка по фото. */
	.banner--portrait {
		max-height: 600px;
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
		background: light-dark(rgb(0 0 0 / 0.2), rgba(255, 255, 255, 0.3));
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

	/*
	 * Світле й темне значення — парою в самій властивості.
	 *
	 * Доти світлі значення стояли окремим правилом під селектором однієї теми
	 * (`light`), а тем шість: дві ЖОВТІ теми теж світлі, але тим селектором не
	 * накривалися й отримували оформлення для темного тла. Розбір і замір — у
	 * докблоці `VerificationNoticeBanner`, з якого почалася ця правка.
	 */
</style>
