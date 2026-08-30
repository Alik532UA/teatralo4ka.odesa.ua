<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { localizedPath } from '$lib/i18n/routing';

	/**
	 * Клавіша підвала, що по черзі стає то піаніно, то входом у галактику, —
	 * але тільки там, де є курсор. На телефоні обидві кнопки стоять поруч, і
	 * причина цього описана нижче, біля `sideBySide`.
	 *
	 * Розмір задано ОБГОРТЦІ, а не кожному з варіантів, і варіанти лежать у ній
	 * абсолютно. Інакше на кожній підміні підвал сіпався б: два різні написи
	 * дають різну ширину, а це рядок, у якому поруч стоять адреса й телефони.
	 *
	 * Обидва варіанти під час підміни існують одночасно — старий відвертається,
	 * новий повертається до глядача, — саме тому потрібне абсолютне
	 * позиціювання, а не просто фіксована ширина.
	 */
	interface Props {
		/** Відкрити піаніно. Сама модалка лишається у підвалі. */
		onpiano: () => void;
	}

	let { onpiano }: Props = $props();

	/** Скільки триває один варіант. Прохання автора — рівно 11 секунд. */
	const SWAP_MS = 11_000;
	/**
	 * Найменший проміжок між підмінами вручну. Одне прокручування колеса дає
	 * десяток подій поспіль, і без цієї межі кнопка миготіла б.
	 */
	const MANUAL_COOLDOWN_MS = 350;

	let showGalaxy = $state(false);
	/** Поки курсор на кнопці, таймер її не чіпає — людина її роздивляється. */
	let hovered = $state(false);
	let lastManualSwap = 0;

	/**
	 * На вузькому екрані підміни НЕМАЄ: обидві кнопки стоять поруч.
	 *
	 * Підміна тримається на тому, чого на телефоні немає. Курсор може завмерти
	 * над кнопкою й зупинити таймер, колесо й права кнопка дають підміну на
	 * вимогу — з пальцем не працює жодне з трьох. Лишається сама лише черга по
	 * одинадцять секунд: половину часу потрібної кнопки просто немає на екрані,
	 * і дочекатися її — єдиний спосіб. У підвалі, що вже переносить рядки,
	 * місця на дві кнопки вистачає (2 × 120 плюс проміжок — 252 px при 375).
	 *
	 * Заразом це прибрало нестабільність двох перевірок CSP: вони клацали
	 * піаніно, а на мобільному прогоні встигала статися підміна, і клік летів у
	 * порожнечу.
	 */
	let sideBySide = $state(false);

	$effect(() => {
		const mq = window.matchMedia('(max-width: 768px)');
		const apply = () => (sideBySide = mq.matches);
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	});

	/**
	 * Перехід Svelte при ПЕРШОМУ рендері не програється — саме тому окремого
	 * прапорця «чи вже міняли» тут немає: кнопка просто з'являється разом із
	 * підвалом, а повертається лише на справжній підміні.
	 */
	function swap() {
		showGalaxy = !showGalaxy;
	}

	function swapManually() {
		const now = Date.now();
		if (now - lastManualSwap < MANUAL_COOLDOWN_MS) return;
		lastManualSwap = now;
		swap();
	}

	/**
	 * Колесо НЕ перехоплюється (`preventDefault` тут немає навмисно): сторінка
	 * має гортатися й тоді, коли курсор випадково опинився над кнопкою. Підміна
	 * — приємний додаток до гортання, а не заміна йому.
	 */
	function handleWheel() {
		swapManually();
	}

	/**
	 * Права кнопка, навпаки, перехоплюється: без цього поверх кнопки відкриється
	 * звичайне меню браузера й затулить те, заради чого її натиснули.
	 */
	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
		swapManually();
	}

	/**
	 * Перемикач живе в `$effect`, а не в тілі компонента: підвал є на КОЖНІЙ
	 * сторінці, і таймер у тілі почав би цокати ще під час пререндеру, де
	 * `setInterval` нікому не потрібен і нікого не будить.
	 */
	$effect(() => {
		// Обидві кнопки на екрані — міняти нічого й ніде.
		if (sideBySide) return;
		const id = setInterval(() => {
			if (hovered) return;
			/*
			 * У прихованій вкладці підміна не просто марна — вона шкідлива.
			 * Перехід Svelte тримає СТАРИЙ варіант у розмітці, доки анімація не
			 * дограє, а в невидимій вкладці вона не рухається взагалі (заміряно:
			 * `document.hidden === true`, обидва варіанти лишаються в DOM). Тобто
			 * кожні одинадцять секунд у підвалі осідав би ще один варіант, і
			 * повернувшись на вкладку людина побачила б їхню купу.
			 */
			if (document.hidden) return;
			swap();
		}, SWAP_MS);
		return () => clearInterval(id);
	});

	const galaxyHref = $derived(
		localizedPath('/projects/galaxy-graduates/', $locale === 'en' ? 'en' : 'uk')
	);

	/**
	 * Поворот навколо горизонтальної осі — той самий рух, що в перекидному
	 * табло. `u` (тобто `1 - t`) дає кут: на початку варіант відвернутий на
	 * чверть оберту, наприкінці — рівно до глядача.
	 *
	 * Прохання про менший рух виконується ТУТ, а не в CSS: тривалість переходу
	 * задає JavaScript, і медіазапит до неї не дотягується.
	 */
	function flip(_node: Element, { duration = 420 }: { duration?: number } = {}) {
		const still =
			browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return {
			duration: still ? 0 : duration,
			css: (tt: number, uu: number) =>
				`opacity: ${tt}; transform: rotateX(${uu * 90}deg);`
		};
	}
</script>

<!--
	`onmouseenter`/`onmouseleave` висять на обгортці, а не на самих варіантах:
	під час підміни старий варіант зникає, і слухач разом з ним — курсор
	«злітав» би з кнопки саме тоді, коли з неї не сходив.
-->
<div
	class="swap"
	class:swap--both={sideBySide}
	onmouseenter={() => (hovered = true)}
	onmouseleave={() => (hovered = false)}
	onwheel={handleWheel}
	oncontextmenu={handleContextMenu}
	role="presentation"
	data-testid="footer-play-container"
>
	{#if sideBySide}
		{@render galaxyFace(0)}
		{@render pianoFace(0)}
	{:else if showGalaxy}
		{@render galaxyFace(420)}
	{:else}
		{@render pianoFace(420)}
	{/if}
</div>

<!--
	Обидва варіанти лежать у сніпетах, а не двічі в розмітці: інакше
	`data-testid` тієї самої кнопки трапився б у файлі двічі, і сторонній читач
	не знав би, яка з двох копій справжня. Тут копія одна, а гілка вирішує лише,
	скільки їх показати.

	Тривалість переходить параметром, бо директиву не можна поставити під умову:
	нуль означає «без повороту», і саме він потрібен, коли обидві кнопки стоять
	поруч і підмінятися їм нема на що.
-->
{#snippet galaxyFace(dur: number)}
	<a
		href={galaxyHref}
		class="swap__face swap__face--galaxy"
		in:flip={{ duration: dur }}
		out:flip={{ duration: dur }}
		aria-label={$t('galaxy.title')}
		title={$t('galaxy.title')}
		data-testid="footer-galaxy-link"
	>
		<span class="galaxy__sky" aria-hidden="true">
			<span class="galaxy__star" style="--x: 14%; --y: 30%; --d: 0s"></span>
			<span class="galaxy__star" style="--x: 38%; --y: 68%; --d: 0.7s"></span>
			<span class="galaxy__star" style="--x: 62%; --y: 24%; --d: 1.4s"></span>
			<span class="galaxy__star" style="--x: 84%; --y: 60%; --d: 2.1s"></span>
		</span>
		<span class="swap__text">{$t('galaxy.flyShort')}</span>
	</a>
{/snippet}

{#snippet pianoFace(dur: number)}
	<button
		class="swap__face swap__face--piano"
		in:flip={{ duration: dur }}
		out:flip={{ duration: dur }}
		onclick={onpiano}
		aria-label={$t('footer.play')}
		title={$t('footer.play')}
		data-testid="footer-piano-btn"
	>
		<!--
			Напису тут немає навмисно: клавіші самі кажуть, що це піаніно, а
			слово затуляло їх білою плашкою. Для диктора назва лишається в
			`aria-label`, для миші — у підказці.
		-->
		<span class="piano__keys" aria-hidden="true">
			<span class="piano__white"></span>
			<span class="piano__white"></span>
			<span class="piano__white"></span>
			<span class="piano__white"></span>
			<span class="piano__white"></span>
			<span class="piano__black" style="left: 20%"></span>
			<span class="piano__black" style="left: 60%"></span>
			<span class="piano__black" style="left: 80%"></span>
		</span>
	</button>
{/snippet}

<style>
	.swap {
		position: relative;
		width: 120px;
		height: 36px;
		flex-shrink: 0;
		/* Глибина, без якої поворот виглядав би плоским стисканням. */
		perspective: 320px;
	}

	/*
	 * Дві кнопки поруч: обгортка перестає бути сценою для підміни й стає
	 * звичайним рядком, а варіанти виходять з абсолютного позиціювання. Ширина
	 * задається тут, бо в режимі підміни її тримала сама обгортка.
	 */
	.swap--both {
		display: flex;
		gap: var(--space-sm, 0.5rem);
		width: auto;
		/*
		 * 44, а не 36: тут кнопку натискають пальцем, і це саме той поріг, який
		 * перевіряє `touch-targets`. Доти обидва варіанти були в переліку
		 * винятків — спершу під іменем `footer__btn-piano`, яке після
		 * перейменування перестало збігатися з будь-чим на сторінці.
		 */
		height: 44px;
		perspective: none;
	}
	.swap--both .swap__face {
		position: relative;
		inset: auto;
		width: 120px;
		flex-shrink: 0;
	}

	.swap__face {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px 4px 6px 6px;
		cursor: pointer;
		overflow: hidden;
		padding: 0;
		text-decoration: none;
		/*
		 * `transition` тут НЕ оголошується: підміну веде перехід Svelte, який
		 * пише `transform` покадрово. Власний `transition` боровся б із ним за
		 * ту саму властивість, і рух виходив би ривками.
		 */
	}

	/* ── піаніно ── */
	.swap__face--piano {
		background: var(--palette-black);
		border: 2px solid var(--palette-black);
		box-shadow: 0 3px 0 var(--palette-black);
	}
	.piano__keys {
		position: absolute;
		inset: 0;
		display: flex;
		background: var(--palette-black);
	}
	.piano__white {
		flex: 1;
		background: var(--palette-white);
		border-right: 1px solid var(--palette-gray-200);
		height: 100%;
	}
	.piano__white:last-child {
		border-right: none;
	}
	.piano__black {
		position: absolute;
		top: 0;
		width: 12%;
		height: 60%;
		background: var(--palette-black);
		border-radius: 0 0 2px 2px;
		transform: translateX(-50%);
		z-index: 1;
	}

	/* ── галактика ── */
	.swap__face--galaxy {
		background: var(--galaxy-bg);
		border: 2px solid var(--galaxy-bg);
		box-shadow: 0 3px 0 var(--galaxy-bg);
	}
	.galaxy__sky {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 30% 120%, rgb(140 190 255 / 0.35), transparent 60%),
			var(--galaxy-bg);
	}
	.galaxy__star {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--galaxy-accent);
		box-shadow: 0 0 5px var(--galaxy-accent);
		animation: twinkle 2.8s ease-in-out var(--d) infinite;
	}
	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.25;
		}
		50% {
			opacity: 1;
		}
	}

	/*
	 * Напис лишився один — «Летіти». Довга назва «Галактика випускників» у
	 * 120px не ставала й обрізалася трьома крапками, тобто підказувала рівно
	 * нічого. Ціле ім'я нікуди не поділося: воно в `title` та `aria-label`.
	 */
	.swap__text {
		position: relative;
		z-index: 2;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--galaxy-text);
		text-shadow: 0 1px 6px rgb(3 6 20 / 0.9);
	}

	/* ── натискання: те саме відчуття клавіші, що й було ── */
	.swap__face:hover {
		box-shadow: 0 1.5px 0 currentcolor;
	}
	.swap__face--piano:hover {
		box-shadow: 0 1.5px 0 var(--palette-black);
	}
	.swap__face--galaxy:hover {
		box-shadow: 0 1.5px 0 var(--galaxy-bg);
	}
	.swap__face:active {
		box-shadow: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.galaxy__star {
			animation: none;
			opacity: 0.8;
		}
	}
</style>
