<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { scrollbar } from '$lib/controllers/scrollbar.svelte';
	import { Spring } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';

	/**
	 * Власна смуга прокрутки сторінки.
	 *
	 * Нативну довелося замінити, бо три вимоги з нею несумісні:
	 *
	 * 1. **Не займати ширину.** Класична смуга є частиною розкладки, тому
	 *    сторінки з нею і без неї зсунуті одна відносно одної — це видно при
	 *    перемиканні вкладок.
	 * 2. **Бути під заставкою.** Нативну смугу малює браузер поверх усього
	 *    вмісту, `z-index` на неї не діє.
	 * 3. **Товщати при наближенні миші.** Chromium не перемальовує
	 *    `::-webkit-scrollbar` від зміни змінних у рантаймі — перевірено:
	 *    значення змінної оновлюється, вигляд лишається старим.
	 *
	 * Сама прокрутка лишається нативною: колесо, клавіатура, дотик і `scrollTo`
	 * працюють як раніше. Компонент лише малює індикатор і дозволяє тягнути.
	 *
	 * Алгоритм реакції на наближення — з бокових арок DigitalWorkshop: лінійна
	 * частка від відстані плюс пружина.
	 */

	/** Товщина у спокої та в розгорнутому стані, px. */
	const REST_WIDTH = 10;
	const HOVER_WIDTH = 20;

	/** Найменша висота повзунка, щоб його було за що вхопити на довгій сторінці. */
	const MIN_THUMB = 32;

	let scrollY = $state(0);
	let viewportHeight = $state(0);
	let pageHeight = $state(1);
	let windowWidth = $state(0);
	let mouseX = $state(Number.POSITIVE_INFINITY);
	let pointerInside = $state(false);
	let dragging = $state(false);
	/** Зсув місця захоплення від верху повзунка — щоб той не стрибав під курсор. */
	let grabOffset = 0;
	/**
	 * Прямокутник доріжки, знятий ОДИН раз на початку перетягування.
	 *
	 * `getBoundingClientRect()` на кожен рух миші змушує браузер рахувати
	 * розкладку — а доріжка `position: fixed` і під час прокрутки не рухається,
	 * тож міряти її повторно нема сенсу.
	 */
	let trackTop = 0;
	/** Останнє положення курсора, ще не застосоване. */
	let pendingY = 0;
	let frame = 0;
	/**
	 * Позиція повзунка під час перетягування — прямо з курсора.
	 *
	 * Інакше виходить петля: рух → scrollTo → подія scroll → оновлення стану →
	 * перемальовування. Повзунок відстає від курсора щонайменше на кадр, і це
	 * відчувається як гальмування.
	 */
	let dragThumbTop = $state(0);

	/** Куди тягне утримання: -1 вгору, 1 вниз, 0 — нікуди. */
	let holdDirection = 0;
	let holdTimer: ReturnType<typeof setTimeout> | null = null;
	let holdFrame = 0;
	let holdStarted = 0;
	/** Позначка для розмітки: показати, що зараз іде автопрокрутка. */
	let holding = $state(false);

	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	/**
	 * На сенсорних пристроях смуга не потрібна: там прокрутка пальцем, а
	 * нативний індикатор і так накладка, що нічого не зсуває.
	 */
	/** Чи наша черга малювати. Рішення приймає один контролер на всіх. */
	const enabled = $derived(scrollbar.active === 'custom');

	const scrollable = $derived(pageHeight > viewportHeight + 1);
	/**
	 * Змонтована — поки обрано цей режим; ВИДИМА — поки є що прокручувати.
	 *
	 * Розділено навмисно: якби елемент зникав із DOM на сторінці без прокрутки,
	 * анімувати зникнення не було б чого. Тепер він лишається і просто виїжджає
	 * за край.
	 */
	const visible = $derived(enabled && scrollable);

	const target = $derived.by(() => {
		if (!visible || reducedMotion.current) return 0;
		if (dragging) return 1;
		if (!pointerInside || !windowWidth) return 0;
		const start = 0.18 * windowWidth;
		const end = 0.02 * windowWidth;
		const distance = windowWidth - mouseX;
		if (distance > start) return 0;
		if (distance < end) return 1;
		return (start - distance) / (start - end);
	});

	const progress = new Spring(0, { stiffness: 0.05, damping: 0.4 });

	$effect(() => {
		progress.target = target;
	});

	/**
	 * Поява й зникнення: 0 — повністю за краєм, 1 — на місці.
	 *
	 * Жорсткіша за пружину наближення: тут не потрібна м’якість, потрібно
	 * швидко й без коливань прибрати смугу зі сторінки, яка вся вмістилася.
	 */
	const presence = new Spring(0, { stiffness: 0.15, damping: 0.8 });

	$effect(() => {
		presence.target = visible ? 1 : 0;
	});

	/**
	 * Висота повзунка теж пружинна: при переході між сторінками вона
	 * стрибала — коротка сторінка дає довгий повзунок і навпаки.
	 *
	 * Позиція (`thumbTop`) навмисно НЕ анімується: вона мусить іти за курсором
	 * і за прокруткою миттєво, інакше повертається та сама затримка, через яку
	 * перетягування смикалося.
	 */
	const springHeight = new Spring(MIN_THUMB, { stiffness: 0.2, damping: 0.9 });

	$effect(() => {
		springHeight.target = rawThumbHeight;
	});

	const width = $derived(REST_WIDTH + (HOVER_WIDTH - REST_WIDTH) * progress.current);

	/** Скільки повзунок мав би займати за поточної висоти сторінки. */
	const rawThumbHeight = $derived(
		Math.max((viewportHeight / pageHeight) * viewportHeight, MIN_THUMB)
	);
	/** Те саме, але доїжджає плавно. */
	const thumbHeight = $derived(springHeight.current);
	const thumbTop = $derived.by(() => {
		if (dragging) return dragThumbTop;
		const maxScroll = pageHeight - viewportHeight;
		if (maxScroll <= 0) return 0;
		return (scrollY / maxScroll) * (viewportHeight - thumbHeight);
	});

	function measure() {
		if (!browser) return;
		pageHeight = Math.max(document.documentElement.scrollHeight, 1);
		viewportHeight = window.innerHeight;
		scrollY = window.scrollY;
	}

	/**
	 * Після переходу міряємо одразу, не чекаючи на ResizeObserver.
	 *
	 * Спостерігач спрацює й сам, але на кадр-два пізніше — і саме в цей момент
	 * повзунок мав би стару висоту від попередньої сторінки. Пружина згладжує
	 * перехід, але починати його треба вчасно.
	 */
	afterNavigate(() => {
		if (enabled) measure();
	});

	$effect(() => {
		if (!enabled) return;
		measure();

		const onScroll = () => (scrollY = window.scrollY);
		window.addEventListener('scroll', onScroll, { passive: true });

		// Висота сторінки змінюється не лише від resize: довантажуються
		// зображення, відкриваються блоки, приходить контент із Firestore.
		const observer = new ResizeObserver(measure);
		observer.observe(document.documentElement);

		return () => {
			window.removeEventListener('scroll', onScroll);
			observer.disconnect();
		};
	});


	/**
	 * Прокрутити так, щоб верх повзунка опинився під курсором.
	 *
	 * `behavior: 'instant'`, а не `'auto'`. `'auto'` означає «взяти значення з
	 * CSS», а в `global.css` стоїть `scroll-behavior: smooth` — тобто кожен рух
	 * миші запускав плавну анімацію прокрутки, і вони наздоганяли одна одну.
	 * Саме це відчувалося як ривки й затримка.
	 */
	function applyScroll() {
		frame = 0;
		const maxThumbTop = viewportHeight - thumbHeight;
		if (maxThumbTop <= 0) return;
		const wanted = pendingY - trackTop - grabOffset;
		const clamped = Math.min(Math.max(wanted, 0), maxThumbTop);
		dragThumbTop = clamped;
		window.scrollTo({ top: (clamped / maxThumbTop) * (pageHeight - viewportHeight), behavior: 'instant' });
	}

	/** Рухи миші йдуть частіше за кадри — зайві просто відкидаємо. */
	function requestScroll(clientY: number) {
		pendingY = clientY;
		if (!frame) frame = requestAnimationFrame(applyScroll);
	}

	/** Скільки чекати, перш ніж почати рух. */
	const HOLD_DELAY_MS = 1000;
	/** Швидкість на початку і на піку, пікселів за секунду. */
	const HOLD_SPEED_START = 120;
	const HOLD_SPEED_MAX = 2600;
	/** За скільки секунд розгін доходить до піку. */
	const HOLD_RAMP_S = 2.5;

	/**
	 * Прокрутка від самого наведення, без натискання.
	 *
	 * Затримка в секунду — щоб випадкове проходження курсора повз смугу нічого
	 * не зрушило. Розгін квадратичний: спершу помітно повільно, щоб можна було
	 * зупинитися там, де треба, далі швидше — інакше довгу сторінку довелося б
	 * чекати надто довго.
	 */
	function holdStep(now: number) {
		holdFrame = requestAnimationFrame(holdStep);
		if (!holdStarted) {
			holdStarted = now;
			return;
		}
		const elapsed = (now - holdStarted) / 1000;
		const ramp = Math.min(elapsed / HOLD_RAMP_S, 1);
		const speed = HOLD_SPEED_START + (HOLD_SPEED_MAX - HOLD_SPEED_START) * ramp * ramp;
		// Крок за кадр; 60 кадрів на секунду — достатньо близько для плавності.
		const delta = (holdDirection * speed) / 60;
		const next = Math.min(Math.max(window.scrollY + delta, 0), pageHeight - viewportHeight);
		window.scrollTo({ top: next, behavior: 'instant' });

		// Доїхали до потрібного місця — далі тягнути нема куди.
		const thumbCenter = thumbTop + thumbHeight / 2;
		if ((holdDirection > 0 && thumbCenter >= holdTargetY) || (holdDirection < 0 && thumbCenter <= holdTargetY)) {
			stopHold();
		}
	}

	/** Куди саме тягнемо, у пікселях від верху доріжки. */
	let holdTargetY = 0;

	function startHold(localY: number) {
		stopHold();
		holdTargetY = localY;
		holdDirection = localY > thumbTop + thumbHeight ? 1 : localY < thumbTop ? -1 : 0;
		if (!holdDirection) return;

		holdTimer = setTimeout(() => {
			holdTimer = null;
			holdStarted = 0;
			holding = true;
			holdFrame = requestAnimationFrame(holdStep);
		}, HOLD_DELAY_MS);
	}

	function stopHold() {
		if (holdTimer) clearTimeout(holdTimer);
		if (holdFrame) cancelAnimationFrame(holdFrame);
		holdTimer = null;
		holdFrame = 0;
		holdDirection = 0;
		holdStarted = 0;
		holding = false;
	}

	function onTrackPointerDown(e: PointerEvent) {
		const track = e.currentTarget as HTMLElement;
		const rect = track.getBoundingClientRect();
		trackTop = rect.top;
		const localY = e.clientY - trackTop;

		// Натиск по самому повзунку — тягнемо з того місця, за яке взяли.
		// Натиск повз нього — спершу переносимо повзунок під курсор.
		const onThumb = localY >= thumbTop && localY <= thumbTop + thumbHeight;
		grabOffset = onThumb ? localY - thumbTop : thumbHeight / 2;
		dragThumbTop = thumbTop;

		stopHold();
		dragging = true;
		track.setPointerCapture(e.pointerId);
		requestScroll(e.clientY);
	}

	function onTrackPointerMove(e: PointerEvent) {
		if (dragging) {
			requestScroll(e.clientY);
			return;
		}

		// Відлік починається заново лише коли курсор змінив зону: інакше
		// найдрібніший рух миші скидав би секунду очікування раз за разом.
		const localY = e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top;
		const zone = localY > thumbTop + thumbHeight ? 1 : localY < thumbTop ? -1 : 0;
		if (zone !== holdDirection || (zone !== 0 && !holdTimer && !holdFrame)) {
			startHold(localY);
		} else if (zone !== 0) {
			// Мета оновлюється без перезапуску: користувач може підвести курсор
			// далі, і рух просто триватиме до нового місця.
			holdTargetY = localY;
		}
	}

	function onTrackPointerEnter(e: PointerEvent) {
		if (dragging) return;
		const localY = e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top;
		startHold(localY);
	}

	function endDrag(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		stopHold();
		if (frame) {
			cancelAnimationFrame(frame);
			frame = 0;
		}
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}
</script>

<svelte:window
	bind:innerWidth={windowWidth}
	onpointermove={(e) => {
		// Під час перетягування ширина й так зафіксована на максимумі, а зайве
		// оновлення стану на кожен рух коштувало б перемальовування.
		if (dragging) return;
		mouseX = e.clientX;
		pointerInside = true;
	}}
	onpointerleave={() => (pointerInside = false)}
/>

<!-- Умова — `enabled`, а не `visible`: елемент лишається змонтованим, поки
     обрано цей режим, і на сторінці без прокрутки просто виїжджає за край.
     Якби він зникав із DOM, анімувати зникнення не було б чого. -->
{#if enabled}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="page-scrollbar"
		class:dragging
		class:holding
		class:page-scrollbar--hidden={presence.current < 0.01}
		style="width: {width}px; opacity: {presence.current};
			transform: translateX({(1 - presence.current) * width}px);"
		data-testid="page-scrollbar-container"
		onpointerenter={onTrackPointerEnter}
		onpointerleave={stopHold}
		onpointerdown={onTrackPointerDown}
		onpointermove={onTrackPointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
	>
		<div
			class="page-scrollbar__thumb"
			style="top: {thumbTop}px; height: {thumbHeight}px;"
			data-testid="page-scrollbar-thumb-status"
		></div>
	</div>
{/if}

<style>
	.page-scrollbar {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		/* Нижче заставки (10000) і нижче модалок, але вище звичайного вмісту. */
		z-index: 9000;
		background: color-mix(in srgb, var(--scrollbar-track), transparent 40%);
		/* Та сама тінь, що й у мінімапи: обидві накладки мають однаково
		   відокремлюватися від сторінки. */
		box-shadow: -6px 0 18px rgba(0, 0, 0, 0.22);
		cursor: pointer;
		/* Накладка: сторінка під нею лишається на всю ширину, тож перехід між
		   сторінками з прокруткою і без неї більше нічого не зсуває. */
		touch-action: none;
	}

	/* Поїхала за край — не перехоплює натиски й не читається читалками. */
	.page-scrollbar--hidden {
		pointer-events: none;
		visibility: hidden;
	}

	.page-scrollbar__thumb {
		position: absolute;
		left: 2px;
		right: 2px;
		background: var(--scrollbar-thumb);
		border-radius: 999px;
		transition: background 0.15s;
	}

	.page-scrollbar:hover .page-scrollbar__thumb,
	.page-scrollbar.holding .page-scrollbar__thumb,
	.page-scrollbar.dragging .page-scrollbar__thumb {
		background: var(--accent-primary);
	}

	@media print {
		.page-scrollbar {
			display: none;
		}
	}
</style>
