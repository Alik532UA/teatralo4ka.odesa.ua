<script lang="ts">
	import { browser } from '$app/environment';
	import { ui } from '$lib/controllers/ui.svelte';
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

	const canHover = new MediaQuery('(hover: hover) and (pointer: fine)');
	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	/**
	 * На сенсорних пристроях смуга не потрібна: там прокрутка пальцем, а
	 * нативний індикатор і так накладка, що нічого не зсуває.
	 */
	/** Власна смуга малюється лише в режимі `custom`; решту показують інші
	 * компоненти або сам браузер. */
	const enabled = $derived(browser && ui.scrollbarMode === 'custom' && canHover.current);

	const scrollable = $derived(pageHeight > viewportHeight + 1);
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

	const width = $derived(REST_WIDTH + (HOVER_WIDTH - REST_WIDTH) * progress.current);

	const thumbHeight = $derived(
		Math.max((viewportHeight / pageHeight) * viewportHeight, MIN_THUMB)
	);
	const thumbTop = $derived.by(() => {
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
	 * Ховає нативну смугу лише поки компонент живий.
	 *
	 * Через клас на `<html>`, а не назавжди в CSS: якщо компонент не
	 * змонтувався — на сенсорному пристрої, при помилці — сторінка лишається з
	 * робочою нативною смугою, а не зовсім без жодної.
	 */
	$effect(() => {
		if (!enabled) return;
		document.documentElement.classList.add('has-custom-scrollbar');
		return () => document.documentElement.classList.remove('has-custom-scrollbar');
	});

	/** Прокрутити так, щоб верх повзунка опинився під курсором. */
	function scrollFromPointer(clientY: number, trackTop: number) {
		const maxThumbTop = viewportHeight - thumbHeight;
		if (maxThumbTop <= 0) return;
		const wanted = clientY - trackTop - grabOffset;
		const fraction = Math.min(Math.max(wanted / maxThumbTop, 0), 1);
		window.scrollTo({ top: fraction * (pageHeight - viewportHeight), behavior: 'auto' });
	}

	function onTrackPointerDown(e: PointerEvent) {
		const track = e.currentTarget as HTMLElement;
		const rect = track.getBoundingClientRect();
		const localY = e.clientY - rect.top;

		// Натиск по самому повзунку — тягнемо з того місця, за яке взяли.
		// Натиск повз нього — спершу переносимо повзунок під курсор.
		const onThumb = localY >= thumbTop && localY <= thumbTop + thumbHeight;
		grabOffset = onThumb ? localY - thumbTop : thumbHeight / 2;

		dragging = true;
		track.setPointerCapture(e.pointerId);
		scrollFromPointer(e.clientY, rect.top);
	}

	function onTrackPointerMove(e: PointerEvent) {
		if (!dragging) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		scrollFromPointer(e.clientY, rect.top);
	}

	function endDrag(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}
</script>

<svelte:window
	bind:innerWidth={windowWidth}
	onpointermove={(e) => {
		mouseX = e.clientX;
		pointerInside = true;
	}}
	onpointerleave={() => (pointerInside = false)}
/>

{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="page-scrollbar"
		class:dragging
		style="width: {width}px;"
		data-testid="page-scrollbar-container"
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
		cursor: pointer;
		/* Накладка: сторінка під нею лишається на всю ширину, тож перехід між
		   сторінками з прокруткою і без неї більше нічого не зсуває. */
		touch-action: none;
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
	.page-scrollbar.dragging .page-scrollbar__thumb {
		background: var(--accent-primary);
	}

	@media print {
		.page-scrollbar {
			display: none;
		}
	}
</style>
