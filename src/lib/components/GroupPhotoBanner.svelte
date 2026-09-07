<script lang="ts">
	import { asset } from '$app/paths';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { imageSize, type LocalImage } from '$lib/config/localImages';
	import PhotoLightbox, { type LightboxImage } from '$lib/components/PhotoLightbox.svelte';

	interface Props {
		/** Шляхи знімків. Порожній список — банера немає. */
		photos: readonly string[];
		/** Назва групи: йде в `alt`, у підписи крапок і в заголовок лайтбокса. */
		title: string;
	}

	let { photos, title }: Props = $props();

	/**
	 * КОЖЕН знімок показується у ВЛАСНІЙ пропорції — нічого не кадрується.
	 *
	 * ## Дві попередні редакції, і чому обидві були неправильні
	 *
	 * Спершу коробка була 16:10 на всю стопку, а вертикальний знімок отримував
	 * свою пропорцію — «є хоч один портрет, значить коробка вертикальна». На
	 * стопці з самих портретів це працювало, а на змішаній ні: у «ТВ Продакшн»
	 * один вертикальний знімок із п'яти зробив коробку вертикальною, і афіша
	 * 1280×850 втратила половину ширини.
	 *
	 * Тоді правило стало «більшість або порівну» — і зламалося дзеркально:
	 * коробка лишилася горизонтальною, а той самий вертикальний знімок у ній
	 * зрізало згори й знизу. Автор побачив і це: «вертикальні фотографії сильно
	 * відрізані».
	 *
	 * Спільна помилка обох редакцій — сама ідея ОДНІЄЇ пропорції на різні
	 * знімки: при ній хтось завжди втрачає. Тому пропорцію задає той знімок,
	 * який показується ЗАРАЗ, і жоден не кадрується взагалі.
	 *
	 * ## Чому сторінка від цього не стрибає
	 *
	 * Висота обмежена `МАКС_ВИСОТА`, а ширина рахується з неї та з пропорції.
	 * Тобто вертикальний знімок стає ВУЖЧИМ, а не вищим: у горизонтального
	 * 820×545, у вертикального 450×600. Різниця у висоті 55 px замість двох
	 * різних форматів на всю ширину.
	 */
	const МАКС_ШИРИНА = 820;
	const МАКС_ВИСОТА = 600;

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

	/**
	 * Коробка ОДНА на всю стопку — і це третя редакція правила.
	 *
	 * Друга редакція (6 вересня) давала коробці пропорцію того знімка, який
	 * показується ЗАРАЗ: жоден кадр не різався, зате коробка міняла розмір на
	 * кожному перегортанні. На сторінці групи це смикало все, що нижче, а в
	 * плашці випускника — сусідні плашки, бо їхню розкладку рахують за
	 * заміряними висотами. Автор назвав це прямо: «не зафіксований по висоті і
	 * як наслідок при переключені фотографій стрибає інші елементи».
	 *
	 * Тепер пропорція береться з НАЙШИРШОГО знімка стопки, а всередині лишається
	 * `object-fit: contain`. Це не повернення до кадрування, і ось чому: у
	 * коробці з пропорцією найширшого будь-який вужчий знімок вписується цілком
	 * — він масштабується до її ВИСОТИ й отримує поля з боків. Тобто коробка
	 * стоїть нерухомо, а жоден кадр не втрачає ані пікселя.
	 *
	 * Заміряно на «ТВ Продакшн» (чотири горизонтальні 1280×850 і один
	 * вертикальний 960×1280): коробка 820×545 на всіх п'яти, вертикальний
	 * показується як 409×545 по центру.
	 */
	const пропорції = $derived(
		photos.map((photo) => {
			const { width, height } = imageSize(photo as LocalImage);
			return width / height;
		})
	);
	const найширша = $derived(Math.max(...пропорції));
	const пропорція = $derived(`${найширша}`);
	const ширина = $derived(Math.round(Math.min(МАКС_ШИРИНА, МАКС_ВИСОТА * найширша)));

	/**
	 * Гортання стрілками — по колу, як і автоперегортання.
	 *
	 * `stopPropagation` обов'язковий: стрілки лежать усередині коробки, а вона
	 * сама відкриває лайтбокс. Без цього натискання на стрілку і гортало б, і
	 * відкривало повний екран — тобто робило б дві дії замість однієї.
	 */
	function гортати(крок: number, подія: MouseEvent) {
		подія.stopPropagation();
		index = (активний + крок + photos.length) % photos.length;
	}

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
		style:aspect-ratio={пропорція}
		style:max-width={`${ширина}px`}
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

		{#if photos.length > 1}
			<button
				type="button"
				class="banner__nav banner__nav--prev"
				aria-label={$t('common.prev')}
				onclick={(e) => гортати(-1, e)}
				data-testid="group-photo-prev-btn"
			>
				<ChevronLeft size={28} aria-hidden="true" />
			</button>
			<button
				type="button"
				class="banner__nav banner__nav--next"
				aria-label={$t('common.next')}
				onclick={(e) => гортати(1, e)}
				data-testid="group-photo-next-btn"
			>
				<ChevronRight size={28} aria-hidden="true" />
			</button>
		{/if}
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
	/*
	 * Відступи знизу — ЗМІННІ, бо в банера тепер два дуже різні місця.
	 *
	 * На сторінці групи, вистави й фестивалю він шапка: під ним іде решта
	 * сторінки, і повітря там доречне. У плашці випускника він вміст картки, і
	 * ті самі 1rem + 2rem дали 78 px порожнечі під крапками — автор побачив це
	 * одразу: «завеликі відступи перед і до контексту».
	 *
	 * Типові значення лишаються тими, що були, тож три сторінки-шапки не
	 * змінилися ані на піксель; плашка задає свої нулі.
	 */
	.banner {
		position: relative;
		max-width: 820px;
		margin: 0 auto var(--banner-gap, 1rem);
		/* Пропорція й гранична ширина приходять інлайном — від того знімка, що
		   показується зараз. Розбір у докблоці властивостей. */
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
		/*
		 * `contain`, а не `cover`: коробка вже має пропорцію АКТИВНОГО знімка, тож
		 * для нього різниці немає — зате сусіди в стопці під час перетікання не
		 * кадруються, а вписуються.
		 */
		object-fit: contain;
		opacity: 0;
		transition: opacity 0.6s ease;
	}

	.banner__img.is-active {
		opacity: 1;
	}

	/*
	 * Стрілки — поверх знімка, як у лайтбоксі. Ціль дотику 44×44 (WCAG 2.2
	 * SC 2.5.8), тож кружечок саме такий і на телефоні не меншає.
	 */
	.banner__nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		background: rgba(15, 23, 42, 0.45);
		backdrop-filter: blur(6px);
		color: #ffffff;
		cursor: pointer;
		transition:
			background 0.2s ease,
			transform 0.2s ease;
	}

	.banner__nav--prev {
		left: 12px;
	}

	.banner__nav--next {
		right: 12px;
	}

	.banner__nav:hover {
		background: rgba(15, 23, 42, 0.7);
		transform: translateY(-50%) scale(1.08);
	}

	.banner__nav:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 3px;
	}

	.banner__dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: var(--banner-dots-gap, 2rem);
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
