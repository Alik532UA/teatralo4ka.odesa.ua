<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import { asset } from '$app/paths';
	import { MediaQuery } from 'svelte/reactivity';
	import { GRADUATES } from '$lib/data/graduates';
	import { galleryGestures } from '$lib/utils/galleryGestures';
	import PhotoLightbox, { type LightboxImage } from './PhotoLightbox.svelte';

	/**
	 * Галереї випускників у мініатюрі — ілюстрація до пункту «не лише аватарка».
	 *
	 * ## Чому НЕ одна галерея, а всі
	 *
	 * Перша редакція показувала три кадри однієї людини й вела на її сторінку.
	 * Автор відкинув це одним рядком, і він має рацію: пункт розповідає про
	 * МОЖЛИВІСТЬ, яку має кожен, а виглядало воно як вітрина однієї анкети.
	 * Тепер тут по два кадри від КОЖНОГО, у кого галерея вже є, і сусідні
	 * кадри — від різних людей; під рамкою стоїть ім'я того, чий кадр зараз.
	 * Саме з цього видно те, що пункт і стверджує: галерею має не одна людина.
	 *
	 * ## Чому не стопка, як у сусіднього пункту
	 *
	 * Поруч уже є `GalaxyUpdatePhotoStack`, і він показує ІНШЕ: круглі
	 * аватарки, що змінюються в польоті. Якби галерея малювалася так само, два
	 * пункти поспіль розповідали б про різні речі однаковою картинкою — і
	 * головне питання читача («а чим одне від одного відрізняється?») лишилося
	 * б без відповіді саме там, де на нього мала відповісти ілюстрація.
	 *
	 * Тому тут прямокутна рамка з підписом — тобто той вигляд, який галерея має
	 * на самій сторінці: один кадр за раз, решта за ним.
	 *
	 * ## Натискання відкриває САМ ЗНІМОК, а не сторінку
	 *
	 * Теж прохання автора, і воно узгоджене з рештою сайту: у галереї на
	 * сторінці випускника кадр відкривається на весь екран тим самим
	 * `PhotoLightbox`. Відправляти звідси на сторінку означало б, що однаковий
	 * на вигляд знімок в одному місці збільшується, а в іншому кудись веде.
	 *
	 * У лайтбокс ідуть ПОВНОРОЗМІРНІ кадри з тек випускників, а не мініатюри:
	 * збільшувати зменшене немає сенсу. Вони приходять лише після натискання —
	 * сам `PhotoLightbox` до того не змонтований.
	 *
	 * ## Чому окремі файли, а не самі знімки з галерей
	 *
	 * Кадри в теках заміряно 1280 px по довшій стороні й 27…155 КБ кожен —
	 * вони для лайтбокса на весь екран. Показати шістнадцять таких у рамці
	 * 108 px означало б привезти понад мегабайт заради 12-кратного переліку
	 * пікселів, і привезти КОЖНОМУ, хто відкрив вітальне вікно з телефона.
	 *
	 * Тому в `static/galaxy/` лежать шістнадцять мініатюр, зрізаних до 4:3 і
	 * зменшених до 216×162 (подвійний розмір рамки): разом 78 КБ. Той самий
	 * підхід, що в сусідній ілюстрації пункту «анкета», де стоїть `…-96.webp`,
	 * а не повнорозмірне фото.
	 *
	 * Звідки взявся кожен кадр і що станеться, коли галерея зміниться, — у
	 * `galaxy-update-content.test.ts`: він стежить, щоб кадри-джерела лишалися
	 * в галереях, а самі галереї — в анкетах.
	 */

	/**
	 * Кадри-джерела, по порядку показу.
	 *
	 * Добір — АВТОРСЬКИЙ: знімки в рамці обрав автор сайту, переглянувши теки
	 * очима. Машинне правило («перші два кадри кожної галереї») тут було й було
	 * замінене вручну того ж дня: воно бере кадр за номером, а не за тим, чи
	 * видно на ньому щось у прямокутнику 108 px.
	 *
	 * Незмінним лишилося те, що правило задавало, і воно тримається гейтом
	 * `galaxy-update-content.test.ts`:
	 *
	 *   • по ДВА кадри від кожного, у кого галерея вже є, — без переваг;
	 *   • черга колами (спершу по одному від усіх, потім другий круг), щоб
	 *     сусідні кадри були від РІЗНИХ людей, а не двійками.
	 *
	 * Мініатюра `update-gallery-NN.webp` відповідає рядку NN цього переліку, і
	 * саме звідси лайтбокс знає, який ПОВНОРОЗМІРНИЙ кадр відкривати. Міняючи
	 * мініатюру, треба міняти й рядок: інакше в рамці буде один знімок, а на весь
	 * екран відкриється інший. Зіставити файли з джерелами вміє
	 * `.private/match-thumbs.mjs` — він шукає найсхожіший кадр у теках.
	 */
	const КАДРИ = [
		{ slug: 'albina-abuladze', file: '01.webp' },
		{ slug: 'alik-zapolnov', file: '20.webp' },
		{ slug: 'anastasiia-moldovanu', file: '02.webp' },
		{ slug: 'dariia-kulish', file: '01.webp' },
		{ slug: 'kateryna-nesterenko', file: '05.webp' },
		{ slug: 'liora-kazatsker', file: '01.webp' },
		{ slug: 'margotcine', file: '01.webp' },
		{ slug: 'nikol-onyshchenko', file: '01.webp' },
		{ slug: 'albina-abuladze', file: '02.webp' },
		{ slug: 'alik-zapolnov', file: '02.webp' },
		{ slug: 'anastasiia-moldovanu', file: '04.webp' },
		{ slug: 'dariia-kulish', file: '04.webp' },
		{ slug: 'kateryna-nesterenko', file: '03.webp' },
		{ slug: 'liora-kazatsker', file: '02.webp' },
		{ slug: 'margotcine', file: '04.webp' },
		{ slug: 'nikol-onyshchenko', file: '03.webp' }
	];

	/*
	 * Ім'я береться з реєстру, а не вписане поруч із кадром: реєстр уже в
	 * бандлі цієї сторінки, а друга копія імені розійшлася б із ним на першому
	 * ж виправленні написання — і розійшлася б тихо.
	 */
	const імена = КАДРИ.map((к) => GRADUATES.find((g) => g.slug === к.slug)?.name ?? '');

	const Ш = 108;
	const В = 81;

	/**
	 * Скільки кадр тримається на екрані. 2400, а не 1200: на першій редакції
	 * автор сказав «зашвидко» — і має рацію, бо в рамці 108 px кадр треба ще
	 * розібрати, а не просто помітити.
	 */
	const КРОК_МС = 2400;

	let показано = $state(0);
	let лайтбокс = $state(false);
	/**
	 * Курсор на мініатюрі — гортання стоїть.
	 *
	 * Наведення тут означає «хочу роздивитися саме цей кадр», і забирати його
	 * з-під курсора через секунду було б рівно тим, від чого людина щойно
	 * захистилася, зупинившись. Стрілки поруч працюють і на паузі.
	 */
	let наведено = $state(false);

	/** Під «зменшити рух» кадр стоїть, поки його не перегорнуть стрілкою. */
	const безРуху = new MediaQuery('(prefers-reduced-motion: reduce)');

	const крок = (на: number) => {
		показано = (показано + на + КАДРИ.length) % КАДРИ.length;
	};

	/*
	 * `untrack` — бо крок ЧИТАЄ `показано`, щоб порахувати наступний. Без нього
	 * ефект підписався б на власний запис і крутився б без упину.
	 *
	 * Поки відкрито лайтбокс, гортання стоїть: інакше людина закриє його й
	 * побачить у рамці зовсім інший кадр, ніж той, який щойно роздивлялася.
	 */
	$effect(() => {
		if (лайтбокс || наведено || безРуху.current) return;
		const таймер = setInterval(() => untrack(() => крок(1)), КРОК_МС);
		return () => clearInterval(таймер);
	});

	const знімки = $derived<LightboxImage[]>(
		КАДРИ.map((к, i) => ({
			src: asset(`/graduates/gallery/${к.slug}/${к.file}`),
			alt: імена[i],
			title: імена[i]
		}))
	);
</script>

<!--
	`role="group"` — не косметика для лінтера: обробники наведення стоять на
	обгортці, бо стрілки лежать ПОВЕРХ рамки й перекривають її, тож наведення на
	стрілку інакше рахувалося б як відведення з кадру, і пауза знімалася б рівно
	тоді, коли людина тягнеться перегорнути.
-->
<div
	class="gallery"
	role="group"
	aria-label={$t('galaxy.gallery')}
	onpointerenter={() => (наведено = true)}
	onpointerleave={() => (наведено = false)}
	onfocusin={() => (наведено = true)}
	onfocusout={() => (наведено = false)}
	{@attach galleryGestures({
		count: () => КАДРИ.length,
		next: () => крок(1),
		prev: () => крок(-1)
	})}
>
	<button
		type="button"
		class="gallery__frame"
		onclick={() => (лайтбокс = true)}
		aria-label="{$t('galaxy.gallery')} — {імена[показано]}"
		data-testid="galaxy-update-gallery-btn"
	>
		{#each КАДРИ as кадр, i (кадр.slug + кадр.file)}
			<!--
				`alt` порожній навмисно: підпис несе сама кнопка, а шістнадцять
				описів поспіль читалися б з екранного диктора як шістнадцять
				окремих знімків, яких тут показано по одному за раз.
			-->
			<img
				class="gallery__shot"
				class:gallery__shot--active={i === показано}
				src={asset(`/galaxy/update-gallery-${String(i + 1).padStart(2, '0')}.webp`)}
				width={Ш}
				height={В}
				alt=""
				loading="lazy"
			/>
		{/each}
	</button>

	<!--
		Стрілки — ПОВЕРХ рамки, а не під нею: місця під ілюстрацією немає, а
		пункт і так найвищий у вікні. Такі самі, як у банера на сторінці групи,
		лише менші.
	-->
	<button
		type="button"
		class="gallery__arrow gallery__arrow--prev"
		onclick={() => крок(-1)}
		aria-label={$t('common.prev')}
		data-testid="galaxy-update-gallery-prev-btn"
	>
		<ChevronLeft size={14} aria-hidden="true" />
	</button>
	<button
		type="button"
		class="gallery__arrow gallery__arrow--next"
		onclick={() => крок(1)}
		aria-label={$t('common.next')}
		data-testid="galaxy-update-gallery-next-btn"
	>
		<ChevronRight size={14} aria-hidden="true" />
	</button>
</div>

{#if лайтбокс}
	<PhotoLightbox
		images={знімки}
		currentIndex={показано}
		isOpen={лайтбокс}
		onclose={() => (лайтбокс = false)}
	/>
{/if}

<style>
	.gallery {
		position: relative;
		width: 108px;
	}
	/*
	 * Рамка фіксована, а кадри зрізані під неї ще при конвертації — тобто
	 * `object-fit` тут нічого не обрізає, він лише страхує від розходження на
	 * піксель. Гумова рамка означала б, що вертикальний кадр робить пункт
	 * вищим, а горизонтальний нижчим: стрибок висоти на кожному гортанні.
	 */
	.gallery__frame {
		position: relative;
		display: block;
		width: 108px;
		height: 81px;
		padding: 0;
		border-radius: 0.6rem;
		overflow: hidden;
		border: var(--hairline-width) solid rgb(140 190 255 / 0.35);
		background: rgb(3 6 20 / 0.5);
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}
	.gallery:hover .gallery__frame {
		border-color: rgb(140 190 255 / 0.7);
	}
	.gallery__shot {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 420ms ease;
	}
	.gallery__shot--active {
		opacity: 1;
	}
	.gallery__arrow {
		position: absolute;
		top: 50%;
		translate: 0 -50%;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgb(3 6 20 / 0.55);
		color: #cfe4ff;
		cursor: pointer;
		transition: background var(--transition-fast);
	}
	.gallery__arrow:hover {
		background: rgb(3 6 20 / 0.85);
	}
	.gallery__arrow--prev {
		left: 2px;
	}
	.gallery__arrow--next {
		right: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.gallery__shot {
			transition: none;
		}
	}
</style>
