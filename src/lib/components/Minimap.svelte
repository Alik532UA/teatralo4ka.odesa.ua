<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { scrollbar } from '$lib/controllers/scrollbar.svelte';
	import { Spring } from 'svelte/motion';
	import { HoldScroll } from '$lib/utils/holdScroll.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { t } from 'svelte-i18n';

	/**
	 * Мінімапа сторінки збоку, як у редакторах коду.
	 *
	 * Два варіанти:
	 *
	 * - **схематичний** — кожен помітний блок стає смужкою. Дешевий: нічого не
	 *   клонується, лише міряються прямокутники;
	 * - **повний** — справжня зменшена копія сторінки через клон DOM і
	 *   `transform: scale()`. Виглядає як мініатюра сайту, але коштує дублювання
	 *   вмісту, тому вмикається лише свідомо.
	 *
	 * У спокої мінімапа схована за край і лишає вузьку смужку; при наближенні
	 * миші виїжджає. Алгоритм — з бокових арок DigitalWorkshop: лінійна частка
	 * від відстані плюс пружина.
	 */

	const BLOCK_SELECTOR = 'h1, h2, h3, p, img, figure, section > div, li, table, blockquote';
	/** Нижче цієї висоти блок не малюємо: смужка в пів пікселя лише шумить. */
	const MIN_BLOCK_HEIGHT = 24;
	/** Скільки видно у спокої, px. */
	const HANDLE_WIDTH = 8;

	interface Block {
		top: number;
		height: number;
		/** Заголовки помітніші за абзаци. */
		weight: number;
	}

	let blocks = $state.raw<Block[]>([]);
	let scrollY = $state(0);
	let viewportHeight = $state(0);
	/** Нижній край фіксованої шапки, або 0, якщо її немає. */
	let headerOffset = $state(0);
	/** Скільки знизу займає фіксований підвал, або 0. */
	let footerOffset = $state(0);
	let pageHeight = $state(1);
	let windowWidth = $state(0);
	let mouseX = $state(Number.POSITIVE_INFINITY);
	let pointerInside = $state(false);
	let dragging = $state(false);
	let cloneHost = $state<HTMLElement | null>(null);
	/** Прямокутник мінімапи, знятий один раз на початку перетягування. */
	let dragTop = 0;
	let pendingY = 0;
	let frame = 0;
	/** Позиція рамки під час перетягування — прямо з курсора, без петлі через scroll. */
	let dragMarkerTop = $state(0);
	/** Зсув місця захоплення від верху рамки. */
	let grabOffset = 0;
	/** Елемент, що тримає захват вказівника, і для якого саме вказівника. */
	let capturedStrip: HTMLElement | null = null;
	let capturedPointerId = -1;

	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	/** Чи наша черга малювати. Рішення приймає один контролер на всіх. */
	const isFull = $derived(scrollbar.active === 'minimap-full');
	const chosen = $derived(scrollbar.active === 'minimap' || isFull);

	/**
	 * На сторінці, що вміщається цілком, мінімапи бути не має.
	 *
	 * Ця перевірка була у власної смуги, а тут її забули — і на коротких
	 * сторінках мінімапа висіла збоку, показуючи рамку на всю висоту, тобто
	 * нічого корисного. Нативна смуга в такому разі теж не з’являється.
	 */
	const scrollable = $derived(pageHeight > viewportHeight + 1);
	const visible = $derived(chosen && scrollable);

	/** Ширина схематичної мінімапи. Смужкам не потрібна пропорційна ширина. */
	const SCHEMA_WIDTH = 28;
	/** Стеля для візуальної: ширша вона з’їдала б корисну частину екрана. */
	const VISUAL_MAX_WIDTH = 200;

	/** Ширина розгорнутої мінімапи. */
	const fullWidth = $derived(isFull ? VISUAL_MAX_WIDTH : SCHEMA_WIDTH);

	/**
	 * Масштаб — по ШИРИНІ: сторінка цілком уміщається в смужку, нічого не
	 * обрізається. Через це клон може вийти вищим за екран, і тоді він їде
	 * всередині смужки разом із прокруткою — рівно як мінімапа в редакторі
	 * коду поводиться з довгим файлом.
	 *
	 * Попередній варіант масштабував по висоті: сторінка вміщалася вся, зате
	 * боки зрізалися.
	 */
	const scale = $derived(windowWidth > 0 ? fullWidth / windowWidth : 0.1);
	/** Висота клону після масштабування. */
	const cloneHeight = $derived(pageHeight * scale);

	/** Що лишається від вікна після фіксованої шапки й підвалу. */
	const availableHeight = $derived(Math.max(viewportHeight - headerOffset - footerOffset, 0));

	/**
	 * Висота смужки = висота ВИДИМОГО вмісту.
	 *
	 * Коли сторінка коротка, клон не заповнює екран — і раніше смужка все одно
	 * лишалася на всю висоту. Натиск під клоном виглядав як «кінець сторінки»,
	 * а вів у середину: область натискання не збігалася з тим, що видно.
	 *
	 * Оголошено тут, а не поруч із рештою геометрії нижче: `cloneShiftY` рахується
	 * від цієї величини, і посилання на 250 рядків уперед читалося б як помилка.
	 */
	const mapHeight = $derived(isFull ? Math.min(cloneHeight, availableHeight) : availableHeight);
	/**
	 * Наскільки клон треба підняти, щоб показати поточне місце.
	 *
	 * Від висоти СМУЖКИ, не вікна. Поки смужка займала все вікно, це були однакові
	 * величини; щойно вона стала коротшою на шапку й підвал, клон не додавав на цю
	 * різницю — і в кінці сторінки мінімапа показувала не її кінець.
	 */
	const cloneShiftY = $derived.by(() => {
		const overflow = cloneHeight - mapHeight;
		if (overflow <= 0) return 0;
		return -(scrollY / Math.max(pageHeight - viewportHeight, 1)) * overflow;
	});

	const target = $derived.by(() => {
		if (!visible || reducedMotion.current) return 0;
		if (dragging) return 1;
		if (!pointerInside || !windowWidth) return 0;
		const start = 0.22 * windowWidth;
		const end = 0.03 * windowWidth;
		const distance = windowWidth - mouseX;
		if (distance > start) return 0;
		if (distance < end) return 1;
		return (start - distance) / (start - end);
	});

	// Коефіцієнти з бокових арок: рух помітний, але не пружинить.
	const progress = new Spring(0, { stiffness: 0.05, damping: 0.4 });

	$effect(() => {
		progress.target = target;
	});

	/** Наскільки мінімапа схована за правий край. */
	const hiddenPart = $derived((1 - progress.current) * (fullWidth - HANDLE_WIDTH));

	function measure() {
		if (!browser) return;
		pageHeight = Math.max(document.documentElement.scrollHeight, 1);
		viewportHeight = window.innerHeight;
		scrollY = window.scrollY;

		// Смужка починається під шапкою і кінчається над підвалом: інакше візуальний
		// варіант завширшки 200px накриває органи керування в обох. Висоти саме
		// міряються, бо вони вже задані у власних стилях компонентів, і третя копія
		// числа розійшлася б.
		const header = document.querySelector('header');
		headerOffset = header ? Math.max(header.getBoundingClientRect().bottom, 0) : 0;

		// Підвал враховується ЛИШЕ поки він `fixed` (у цьому проєкті — від 1025px).
		// Підвал у потоці входить у вікно тільки в кінці сторінки, тож відступ від
		// нього залежав би від прокрутки — а `mapHeight`, що змінюється під час
		// перетягування, ламає жест так само, як пружина на висоті рамки (§ 9.10).
		const footer = document.querySelector('footer');
		const footerFixed = footer ? getComputedStyle(footer).position === 'fixed' : false;
		footerOffset =
			footer && footerFixed
				? Math.max(viewportHeight - footer.getBoundingClientRect().top, 0)
				: 0;
	}

	function measureBlocks() {
		if (!browser || isFull) return;
		const main = document.querySelector('main') ?? document.body;
		const seen: Element[] = [];
		const found: Block[] = [];

		for (const el of main.querySelectorAll(BLOCK_SELECTOR)) {
			// Вкладені збіги дали б кілька смужок на тому самому місці.
			if (seen.some((s) => s.contains(el))) continue;
			const rect = el.getBoundingClientRect();
			if (rect.height < MIN_BLOCK_HEIGHT) continue;
			seen.push(el);

			const tag = el.tagName.toLowerCase();
			const weight =
				tag === 'h1' ? 1
				: tag === 'h2' ? 0.85
				: tag === 'h3' ? 0.7
				: tag === 'img' || tag === 'figure' ? 0.55
				: 0.35;

			found.push({
				top: (rect.top + window.scrollY) / pageHeight,
				height: rect.height / pageHeight,
				weight
			});
		}
		blocks = found;
	}

	/**
	 * Готує зменшену копію сторінки.
	 *
	 * З клону знімаються `id` і `data-testid`. Без цього на сторінці з'явилася б
	 * друга копія кожного ідентифікатора: `getElementById` почав би знаходити не
	 * те, а перевірка унікальності testid у E2E впала б — і мала б рацію.
	 */
	function buildClone() {
		if (!browser || !cloneHost || !isFull) return;
		// Правило застерігає від правки DOM повз Svelte, і загалом слушно. Тут
		// виняток: `cloneHost` у розмітці порожній, Svelte усередині нього нічим
		// не керує, а вміст — клон, який не можна виразити шаблоном.
		// eslint-disable-next-line svelte/no-dom-manipulating
		cloneHost.replaceChildren();

		// Копіюється ВМІСТ тіла, а не сам елемент <body>.
		//
		// Клонований <body> усередині <div> — недопустима вкладеність, і браузер
		// на неї скаржився: «Blocked aria-hidden on a <body> element». Обгортка
		// звичайним <div> дає той самий вміст без цієї дивини.
		//
		// Саме вміст тіла, а не лише <main>: масштаб рахується від висоти всієї
		// сторінки, тож із одним <main> клон виходив нижчим на шапку та підвал, і
		// рамка видимої області показувала не те місце.
		const clone = document.createElement('div');
		for (const child of document.body.children) {
			clone.appendChild(child.cloneNode(true));
		}

		// Себе саму й власну смугу — геть, інакше мінімапа малювала б мінімапу.
		for (const el of clone.querySelectorAll('.minimap, .page-scrollbar, #app-splash')) {
			el.remove();
		}

		for (const el of clone.querySelectorAll('*')) {
			el.removeAttribute('id');
			el.removeAttribute('data-testid');
			// Клон нічим не керує — прибираємо все, що робить його інтерактивним
			// для клавіатури й читалок.
			el.removeAttribute('tabindex');
		}
		clone.setAttribute('aria-hidden', 'true');

		// eslint-disable-next-line svelte/no-dom-manipulating
		cloneHost.appendChild(clone);
	}

	// Слухаємо, поки режим обрано, а не поки мінімапа видима: інакше на
	// короткій сторінці ніхто не помітив би, що вона стала довшою.
	$effect(() => {
		if (!chosen) return;
		measure();
		measureBlocks();

		const onScroll = () => (scrollY = window.scrollY);
		window.addEventListener('scroll', onScroll, { passive: true });

		// Висота змінюється не лише від resize: довантажуються зображення,
		// приходить контент із Firestore, розгортаються блоки.
		// Під час перетягування спостерігач мовчить: кожна дрібна зміна висоти
		// (ліниві зображення, липка шапка) інакше перемірювала б усі блоки й
		// перебудовувала клон просто посеред руху миші.
		const observer = new ResizeObserver(() => {
			if (dragging) return;
			measure();
			measureBlocks();
		});
		observer.observe(document.documentElement);
		// Шапку й підвал спостерігаємо ОКРЕМО: обидва fixed, тобто поза потоком, і
		// їхній ріст не змінює розмір documentElement — спостерігач за самим
		// документом про них не дізнається ніколи.
		const header = document.querySelector('header');
		if (header) observer.observe(header);
		const footer = document.querySelector('footer');
		if (footer) observer.observe(footer);

		// І цього все одно замало. ResizeObserver за специфікацією бачить лише
		// зміну РОЗМІРУ коробки — а тикер, шрифти й переклади ЗСУВАЮТЬ шапку й
		// підвал, не змінюючи їх самих. Слухач scroll теж не рятує: він пише лише
		// scrollY. У підсумку відступи застигали в стані першого кадру, і смужка
		// налізала на підвал на ~27px до першої зміни розміру будь-чого — причому
		// хвіст гонки щоразу інший, тож у E2E число пливло між прогонами.
		// Пульс дешевий (два getBoundingClientRect раз на пів секунди) і
		// самозцілюється від БУДЬ-ЯКОЇ причини зсуву, включно з тими, яких ми ще
		// не зустріли.
		const pulse = setInterval(() => {
			if (!dragging) measure();
		}, 500);

		return () => {
			window.removeEventListener('scroll', onScroll);
			observer.disconnect();
			clearInterval(pulse);
		};
	});


	/** Висота й контейнер, для яких клон збудували востаннє. */
	let clonedAtHeight = 0;
	let clonedHost: HTMLElement | null = null;
	/** Версія вмісту, для якої клон збудували востаннє. */
	let clonedVersion = -1;

	/**
	 * Після переходу клон завжди застарілий, навіть якщо висота не змінилася.
	 *
	 * Це той самий дефект, що й із порожньою мінімапою, лише інший його бік: між
	 * двома довгими сторінками схожої висоти елемент не розмонтовується, тож
	 * жодна з перевірок не спрацьовувала — і мінімапа показувала ПОПЕРЕДНЮ
	 * сторінку. Скидання позначки змушує зібрати клон заново рівно один раз на
	 * перехід.
	 */
	afterNavigate(() => {
		clonedAtHeight = 0;
		clonedHost = null;
		clonedVersion = -1;
	});

	/**
	 * Клон дорогий: він дублює весь вміст сторінки. Тому перебудова лише коли
	 * висота змінилася помітно — інакше кожен піксель прокрутки, що зрушив
	 * липку шапку, коштував би повного клонування DOM.
	 *
	 * Але одної висоти для порівняння НЕ ДОСИТЬ, і це давало порожню мінімапу.
	 * Перехід на коротку сторінку розмонтовує мінімапу разом із клоном; якщо
	 * далі відкрити довгу сторінку приблизно тієї самої висоти, перевірка по
	 * висоті вважала клон актуальним — хоч його вже не існувало. Наступний
	 * перехід на сторінку іншої висоти все «лагодив», через що й виглядало як
	 * випадковість.
	 *
	 * Тому порівнюється ще й сам контейнер: після розмонтування він новий, і
	 * це надійна ознака того, що клон треба зібрати заново.
	 */
	/** Позначка «вміст змінився» — її ставить спостерігач мутацій. */
	let contentVersion = $state(0);

	/**
	 * Розділи головної рендеряться ЛІНИВО, через IntersectionObserver.
	 *
	 * При повному перезавантаженні сторінка приходить із сервера цілою, тож клон
	 * захоплював усе. А після переходу між сторінками ліниві розділи ще не
	 * існують — і в мінімапі на їхньому місці лишалися порожні прогалини, поки
	 * користувач до них не докрутить.
	 *
	 * Висота тут поганий сигнал: розділ може з’явитися, майже не змінивши її.
	 * Спостерігач мутацій дивиться саме на те, від чого клон і залежить — на
	 * вміст. Він стежить за `<main>`, а не за тілом: мінімапа лежить поза
	 * `<main>`, тож власні зміни клону його не будять і рекурсії немає.
	 */
	$effect(() => {
		if (!chosen || !isFull) return;
		const main = document.querySelector('main');
		if (!main) return;

		let timer: ReturnType<typeof setTimeout> | null = null;
		const observer = new MutationObserver(() => {
			// Затримка обов’язкова: рендер розділу — це десятки мутацій підряд, і
			// без неї клон збирався б заново на кожну з них.
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				contentVersion++;
			}, 250);
		});
		observer.observe(main, { childList: true, subtree: true });

		return () => {
			if (timer) clearTimeout(timer);
			observer.disconnect();
		};
	});

	$effect(() => {
		if (!visible || !isFull || !cloneHost || pageHeight <= 1) return;
		if (dragging) return;

		const sameHost = cloneHost === clonedHost;
		const sameHeight = Math.abs(pageHeight - clonedAtHeight) < 40;
		const sameContent = contentVersion === clonedVersion;
		if (sameHost && sameHeight && sameContent) return;

		clonedHost = cloneHost;
		clonedAtHeight = pageHeight;
		clonedVersion = contentVersion;
		buildClone();
	});

	/** Рамка видимої області — у пікселях смужки. */
	const markerHeight = $derived(
		Math.max(isFull ? viewportHeight * scale : (viewportHeight / pageHeight) * mapHeight, 8)
	);

	/**
	 * Скільки пікселів смужки припадає на піксель прокрутки.
	 *
	 * Одна формула на обидва варіанти: рамка проходить від нуля до
	 * `mapHeight - markerHeight`, поки сторінка йде від нуля до кінця. Для
	 * візуального варіанта це автоматично враховує ще й зсув клону.
	 */
	const maxScroll = $derived(Math.max(pageHeight - viewportHeight, 1));
	const pxPerScroll = $derived(Math.max(mapHeight - markerHeight, 0) / maxScroll);

	const markerTop = $derived(dragging ? dragMarkerTop : scrollY * pxPerScroll);

	/**
	 * Прокрутка від наведення — та сама, що й у власної смуги.
	 *
	 * Мінімапа теж має рамку, яку можна «доводити» без натискання: працює для
	 * обох варіантів, бо геометрія в них однакова.
	 */
	const hold = new HoldScroll(() => ({ markerTop, markerHeight, pxPerScroll }));

	/**
	 * Рамка рухається як повзунок смуги: за курсором, із поправкою на місце
	 * захоплення. Прокрутка виводиться з її позиції, а не навпаки.
	 *
	 * `behavior: 'instant'`, а не `'auto'`: `'auto'` означає «взяти значення з
	 * CSS», а там `scroll-behavior: smooth`. Через це кожен рух миші запускав
	 * плавну анімацію, і вони наздоганяли одна одну.
	 */
	// Таймер і кадр мусять зупинитися разом із компонентом.
	$effect(() => () => hold.stop());

	function applyScroll() {
		frame = 0;
		if (pxPerScroll <= 0) return;
		const wanted = pendingY - dragTop - grabOffset;
		const clamped = Math.min(Math.max(wanted, 0), Math.max(mapHeight - markerHeight, 0));
		dragMarkerTop = clamped;
		window.scrollTo({ top: clamped / pxPerScroll, behavior: 'instant' });
	}

	/** Рухи миші йдуть частіше за кадри — зайві відкидаємо. */
	function requestScroll(clientY: number) {
		pendingY = clientY;
		if (!frame) frame = requestAnimationFrame(applyScroll);
	}

	function onPointerDown(e: PointerEvent) {
		// Гасить сумісні мишачі події, які цей натиск інакше породить, а з ними —
		// виділення, що браузер починає з mousedown. Захват вказівника доставляє
		// рухи й так; це прибирає паралельний жест браузера.
		e.preventDefault();

		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		dragTop = rect.top;

		const localY = e.clientY - dragTop;
		const current = scrollY * pxPerScroll;
		// Натиск по самій рамці — тягнемо з того місця, за яке взяли; повз неї —
		// переносимо рамку центром під курсор.
		const onMarker = localY >= current && localY <= current + markerHeight;
		grabOffset = onMarker ? localY - current : markerHeight / 2;
		dragMarkerTop = current;

		hold.stop();
		dragging = true;
		// Перед захватом, щоб виняток у ньому — вказівник, якого браузер уже не
		// вважає активним — не проглинув перший стрибок.
		requestScroll(e.clientY);
		try {
			el.setPointerCapture(e.pointerId);
			capturedStrip = el;
			capturedPointerId = e.pointerId;
		} catch {
			// Без захвату рухи приходять лише поки курсор над смужкою. При 180px це
			// живуче, при 28px — ні; жест насправді несе слухач на window.
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (dragging) {
			requestScroll(e.clientY);
			return;
		}
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		hold.aim(e.clientY - rect.top);
	}

	function onPointerEnter(e: PointerEvent) {
		if (dragging) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		hold.aim(e.clientY - rect.top);
	}

	/**
	 * Без аргументу: викликається і зі смужки, і з window, а знімати захват треба з
	 * того елемента, який його взяв, а не з випадкової цілі події.
	 */
	function endDrag() {
		if (!dragging) return;
		dragging = false;
		hold.stop();
		if (frame) {
			cancelAnimationFrame(frame);
			frame = 0;
		}
		if (capturedStrip !== null) {
			try {
				capturedStrip.releasePointerCapture(capturedPointerId);
			} catch {
				// Уже знято — браузером або разом з елементом.
			}
			capturedStrip = null;
		}
	}
</script>

<svelte:window
	bind:innerWidth={windowWidth}
	onpointermove={(e) => {
		// Під час перетягування жест несе саме цей слухач, а не власний обробник
		// смужки. Схематична смужка завширшки 28px, тож найменший зсув убік виводить
		// курсор за неї, і якщо захват вказівника колись не візьметься — рухи
		// доставляти нікому. Візуальна на 180px ховала ту саму крихкість просто тим,
		// що достатньо широка, щоб лишатися під курсором.
		if (dragging) {
			requestScroll(e.clientY);
			return;
		}
		mouseX = e.clientX;
		pointerInside = true;
	}}
	onpointerup={endDrag}
	onpointercancel={endDrag}
	onpointerleave={() => (pointerInside = false)}
/>

{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="minimap"
		class:minimap--full={isFull}
		class:dragging
		class:holding={hold.holding}
		style="top: {headerOffset}px; width: {fullWidth}px; height: {mapHeight}px;
			transform: translateX({hiddenPart}px);"
		aria-label={$t('settings.scrollbarMinimap')}
		data-testid="minimap-container"
		onpointerenter={onPointerEnter}
		onpointerleave={() => hold.stop()}
		oncontextmenu={(e) => {
			// Нативне меню тут ні до чого: копіювати чи зберігати нема чого,
			// а перемкнути режим — саме те, чого хочеться на смузі.
			e.preventDefault();
			hold.stop();
			scrollbar.openMenu(e.clientX, e.clientY);
		}}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
	>
		{#if isFull}
			<!-- Клон сторінки: лише картинка, жодної взаємодії. -->
			<div
				class="minimap__clone"
				style="width: {windowWidth}px;
					transform: translateY({cloneShiftY}px) scale({scale});"
				bind:this={cloneHost}
				aria-hidden="true"
			></div>
		{:else}
			{#each blocks as block, i (i)}
				<span
					class="minimap__block"
					style="top: {block.top * 100}%; height: {Math.max(block.height * 100, 0.3)}%;
						opacity: {0.25 + block.weight * 0.55};"
				></span>
			{/each}
		{/if}

		<span
			class="minimap__viewport"
			style="top: {markerTop}px; height: {markerHeight}px;"
			data-testid="minimap-viewport-status"
		></span>
	</div>
{/if}

<style>
	.minimap {
		position: fixed;
		right: 0;
		/* `top` і висоту задає скрипт: смужка починається під шапкою і кінчається
		   над підвалом, обидва — виміряні. */
		/* Нижче заставки (10000) і модалок, але вище звичайного вмісту. */
		z-index: 9000;
		background: color-mix(in srgb, var(--bg-surface), transparent 15%);
		border-left: 1px solid var(--border-main);
		/* Тінь ліворуч: без неї мінімапа зливалася зі сторінкою, бо тло в неї
		   майже те саме. Тінь читається на будь-якій темі, на відміну від
		   світлішого або темнішого тла. */
		box-shadow: -8px 0 24px rgba(0, 0, 0, 0.28);
		cursor: pointer;
		overflow: hidden;
		touch-action: none;
		/* Успадковується дітьми, тож усередині смужки нічого не може почати
		   виділення тексту. Виділення тут не безневинне: смужка притулена до
		   правого краю вікна — саме там, де браузер вмикає власний автоскрол
		   виділення, — і той далі бореться з кожним нашим scrollTo. Зачіпало це
		   лише схематичний варіант, бо там натиск падав на дочірній елемент;
		   у візуального клон уже має `user-select: none` і не бере подій узагалі. */
		user-select: none;
		-webkit-user-select: none;
		/* Рух задає пружина в скрипті; CSS-перехід тут лише боровся б із нею. */
		transition: background 0.2s;
	}

	.minimap:hover,
	.minimap.holding,
	.minimap.dragging {
		background: color-mix(in srgb, var(--bg-surface), transparent 5%);
	}

	.minimap__clone {
		position: absolute;
		top: 0;
		left: 0;
		/* Масштаб рахується від лівого верхнього кута, тому висота клону дорівнює
		   рівно висоті смужки, а рамка видимої області збігається з ним. */
		transform-origin: top left;
		pointer-events: none;
		user-select: none;
	}

	.minimap__block,
	.minimap__viewport {
		position: absolute;
		left: 0;
		right: 0;
		display: block;
		/* Обидва — малюнок, не ціль. Рамка від подій уже відмовилася, а смужки ні,
		   тож у схематичному варіанті кожен натиск падав на смужку, а не на саму
		   мінімапу: інший елемент, ніж у візуальному, і єдиний із двох, який міг
		   почати виділення. */
		pointer-events: none;
	}

	.minimap__block {
		background: var(--accent-primary);
		border-radius: 1px;
	}

	.minimap__viewport {
		background: color-mix(in srgb, var(--accent-primary), transparent 85%);
		border-top: 1px solid var(--accent-primary);
		border-bottom: 1px solid var(--accent-primary);
	}

	@media print {
		.minimap {
			display: none;
		}
	}
</style>
