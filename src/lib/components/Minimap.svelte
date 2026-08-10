<script lang="ts">
	import { browser } from '$app/environment';
	import { ui } from '$lib/controllers/ui.svelte';
	import { Spring } from 'svelte/motion';
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
	let pageHeight = $state(1);
	let windowWidth = $state(0);
	let mouseX = $state(Number.POSITIVE_INFINITY);
	let pointerInside = $state(false);
	let dragging = $state(false);
	let cloneHost = $state<HTMLElement | null>(null);
	/** Прямокутник мінімапи, знятий один раз на початку перетягування. */
	let dragTop = 0;
	let dragHeight = 1;
	let pendingY = 0;
	let frame = 0;
	/** Позиція рамки під час перетягування — прямо з курсора, без петлі через scroll. */
	let dragViewTop = $state(0);

	const canHover = new MediaQuery('(hover: hover) and (pointer: fine)');
	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
	/** На вузьких екранах мінімапа з'їдала б корисну ширину. */
	const wideEnough = new MediaQuery('(min-width: 1100px)');

	const mode = $derived(ui.scrollbarMode);
	const isFull = $derived(mode === 'minimap-full');
	const visible = $derived(
		browser && (mode === 'minimap' || isFull) && canHover.current && wideEnough.current
	);

	/** Ширина схематичної мінімапи. Смужкам не потрібна пропорційна ширина. */
	const SCHEMA_WIDTH = 28;
	/** Стеля для візуальної: ширша вона з’їдала б корисну частину екрана. */
	const VISUAL_MAX_WIDTH = 200;

	/**
	 * Масштаб добирається так, щоб УСЯ сторінка вмістилася у висоту екрана.
	 *
	 * Саме звідси брався розсинхрон: раніше масштаб рахувався від ШИРИНИ
	 * мінімапи, а рамка видимої області — у відсотках від її ВИСОТИ. Коли
	 * ширину обмежувала стеля, ці дві системи координат розходилися, і рамка
	 * показувала не те місце, що клон. Тепер масштаб один — по висоті, — а
	 * зайва ширина просто обрізається.
	 */
	const scale = $derived(viewportHeight > 0 && pageHeight > 0 ? viewportHeight / pageHeight : 0.1);
	/** Ширина клону в масштабі: скільки він займав би без обрізання. */
	const scaledPageWidth = $derived(windowWidth * scale);
	/** Ширина розгорнутої мінімапи. */
	const fullWidth = $derived(
		isFull ? Math.min(scaledPageWidth, VISUAL_MAX_WIDTH) : SCHEMA_WIDTH
	);
	/**
	 * Обрізаємо симетрично: сайт вирівняний по центру, тож зріз лише праворуч
	 * лишив би в мінімапі порожнє поле замість вмісту.
	 */
	const cloneShiftX = $derived(-Math.max(0, (scaledPageWidth - fullWidth) / 2));

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

		// Клонується ВСЕ тіло, а не лише <main>.
		//
		// Масштаб рахується від висоти всієї сторінки, тож і клон мусить мати ту
		// саму висоту. З одним <main> він виходив нижчим на шапку та підвал, і
		// рамка видимої області показувала не те місце — це й був розсинхрон.
		// Заразом мінімапа стала схожішою на сайт.
		const clone = document.body.cloneNode(true) as HTMLElement;

		// Себе саму й власну смугу — геть, інакше мінімапа малювала б мінімапу.
		for (const el of clone.querySelectorAll('.minimap, .page-scrollbar, #app-splash')) {
			el.remove();
		}

		for (const el of [clone, ...clone.querySelectorAll('*')]) {
			el.removeAttribute('id');
			el.removeAttribute('data-testid');
			// Клон нічим не керує — прибираємо все, що робить його інтерактивним
			// для клавіатури й читалок.
			el.removeAttribute('tabindex');
			el.setAttribute('aria-hidden', 'true');
		}

		// eslint-disable-next-line svelte/no-dom-manipulating
		cloneHost.appendChild(clone);
	}

	$effect(() => {
		if (!visible) return;
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

		return () => {
			window.removeEventListener('scroll', onScroll);
			observer.disconnect();
		};
	});

	// Нативну смугу ховаємо: інакше поруч із мінімапою був би другий
	// індикатор того самого. Клас знімається при вимкненні режиму.
	$effect(() => {
		if (!visible) return;
		document.documentElement.classList.add('has-custom-scrollbar');
		return () => document.documentElement.classList.remove('has-custom-scrollbar');
	});

	/** Висота, за якої клон збудували востаннє. */
	let clonedAtHeight = 0;

	// Клон дорогий: він дублює весь вміст сторінки. Перебудовуємо лише коли
	// висота змінилася помітно — інакше кожен піксель прокрутки, що зрушив
	// липку шапку, коштував би повного клонування DOM.
	$effect(() => {
		if (!visible || !isFull || !cloneHost || pageHeight <= 1) return;
		if (dragging) return;
		if (Math.abs(pageHeight - clonedAtHeight) < 40) return;
		clonedAtHeight = pageHeight;
		buildClone();
	});

	const viewFraction = $derived(Math.min(viewportHeight / pageHeight, 1));
	const viewTop = $derived(dragging ? dragViewTop : scrollY / pageHeight);

	/**
	 * `behavior: 'instant'`, а не `'auto'`: `'auto'` означає «взяти значення з
	 * CSS», а там `scroll-behavior: smooth`. Через це кожен рух миші запускав
	 * плавну анімацію, вони наздоганяли одна одну — і це відчувалося як ривки.
	 */
	function applyScroll() {
		frame = 0;
		const fraction = Math.min(Math.max((pendingY - dragTop) / dragHeight, 0), 1);
		dragViewTop = Math.min(Math.max(fraction - viewFraction / 2, 0), 1 - viewFraction);
		// Центр вікна стає туди, куди вказали — так поводяться мінімапи в редакторах.
		const top = fraction * pageHeight - viewportHeight / 2;
		window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
	}

	/** Рухи миші йдуть частіше за кадри — зайві відкидаємо. */
	function requestScroll(clientY: number) {
		pendingY = clientY;
		if (!frame) frame = requestAnimationFrame(applyScroll);
	}

	function onPointerDown(e: PointerEvent) {
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		dragTop = rect.top;
		dragHeight = rect.height || 1;
		dragViewTop = viewTop;
		dragging = true;
		el.setPointerCapture(e.pointerId);
		requestScroll(e.clientY);
	}

	function onPointerMove(e: PointerEvent) {
		if (dragging) requestScroll(e.clientY);
	}

	function endDrag(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
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
		if (dragging) return;
		mouseX = e.clientX;
		pointerInside = true;
	}}
	onpointerleave={() => (pointerInside = false)}
/>

{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="minimap"
		class:minimap--full={isFull}
		class:dragging
		style="width: {fullWidth}px; transform: translateX({hiddenPart}px);"
		aria-label={$t('settings.scrollbarMinimap')}
		data-testid="minimap-container"
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
					transform: translateX({cloneShiftX}px) scale({scale});"
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
			style="top: {viewTop * 100}%; height: {viewFraction * 100}%;"
			data-testid="minimap-viewport-status"
		></span>
	</div>
{/if}

<style>
	.minimap {
		position: fixed;
		right: 0;
		top: 0;
		height: 100vh;
		/* Нижче заставки (10000) і модалок, але вище звичайного вмісту. */
		z-index: 9000;
		background: color-mix(in srgb, var(--bg-surface), transparent 15%);
		border-left: 1px solid var(--border-main);
		cursor: pointer;
		overflow: hidden;
		touch-action: none;
		/* Рух задає пружина в скрипті; CSS-перехід тут лише боровся б із нею. */
		transition: background 0.2s;
	}

	.minimap:hover,
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
	}

	.minimap__block {
		background: var(--accent-primary);
		border-radius: 1px;
	}

	.minimap__viewport {
		background: color-mix(in srgb, var(--accent-primary), transparent 85%);
		border-top: 1px solid var(--accent-primary);
		border-bottom: 1px solid var(--accent-primary);
		pointer-events: none;
	}

	@media print {
		.minimap {
			display: none;
		}
	}
</style>
