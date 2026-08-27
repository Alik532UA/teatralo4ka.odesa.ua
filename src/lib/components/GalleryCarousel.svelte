<script lang="ts">
	import { Play, Pause } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import type { GalleryWidgetConfig } from '$lib/services/settings';
	import PhotoLightbox from '$lib/components/PhotoLightbox.svelte';
	import {
		createDragState, createWheelState,
		handleTouchStart as sharedTouchStart,
		handleTouchMove as sharedTouchMove,
		handleTouchEnd as sharedTouchEnd,
		handleClickCapture as sharedClickCapture,
		handleWheel as sharedWheel,
		handleTransitionEnd as sharedTransitionEnd,
		type DragState,
	} from '$lib/utils/carouselInteraction';
	import { isTypingTarget } from '$lib/services/keyboard';

	export interface GalleryItem {
		src: string;
		alt: string;
		title: string;
		position?: string;
	}

	interface Props {
		items: GalleryItem[];
		config: GalleryWidgetConfig;
		testIdPrefix?: string;
		/** Accessible label for the carousel region */
		ariaLabel?: string;
	}

	let { items, config, testIdPrefix = 'gallery-carousel', ariaLabel = '' }: Props = $props();

	const resolvedAriaLabel = $derived(ariaLabel || $t('common.gallery'));

	let autoplayOverride = $state<boolean | null>(null);
	const autoplay = $derived(autoplayOverride ?? config.autoplay);
	const cssAspectRatio = $derived((config.aspectRatio || '4:3').replace(':', ' / '));
	let isHovered = $state(false);
	/**
	 * Фокус усередині галереї — така сама причина спинити автопрокрутку, як і
	 * наведення мишею. Доти слайди мінялися під руками в людини, яка щойно
	 * дійшла сюди Tab-ом і збиралася гортати стрілками.
	 */
	let isFocusWithin = $state(false);
	const isEngaged = $derived(isHovered || isFocusWithin);
	let mounted = $state(false);

	let currentIndex = $state(0);
	let isTransitioning = $state(true);
	let infiniteItems = $state<GalleryItem[]>([]);
	let bufferCount = $state(1);

	let isLightboxOpen = $state(false);
	let lightboxIndex = $state(0);

	function openLightbox(i: number) {
		lightboxIndex = i;
		isLightboxOpen = true;
	}

	$effect(() => {
		if (items.length === 0) return;

		let ordered = [...items];
		const pinnedIdx = config.pinnedIndex ?? -1;
		if (pinnedIdx >= 0 && pinnedIdx < ordered.length) {
			const [pinned] = ordered.splice(pinnedIdx, 1);
			ordered.unshift(pinned);
		}

		if (ordered.length > 0) {
			bufferCount = Math.max(3, Math.ceil(20 / ordered.length));
			const arr: GalleryItem[] = [];
			const totalCopies = 1 + 2 * bufferCount;
			for (let i = 0; i < totalCopies; i++) {
				arr.push(...ordered);
			}
			infiniteItems = arr;
			currentIndex = bufferCount * ordered.length;
		}
	});

	onMount(() => {
		const timer = setTimeout(() => { mounted = true; }, 100);
		return () => {
			clearTimeout(timer);
			clearTimeout(wheelState.timeout);
		};
	});

	function next(fromAuto = false) {
		if (!isTransitioning || infiniteItems.length <= 1) return;
		if (currentIndex >= infiniteItems.length - 2) return;
		if (!fromAuto) autoplayOverride = false;
		currentIndex++;
	}

	function prev() {
		if (!isTransitioning || infiniteItems.length <= 1) return;
		if (currentIndex <= 1) return;
		autoplayOverride = false;
		currentIndex--;
	}

	function goTo(i: number) {
		if (!isTransitioning || infiniteItems.length <= 1) return;
		const n = items.length;
		if (n === 0) return;
		const currentMod = ((currentIndex % n) + n) % n;
		if (i === currentMod) return;
		autoplayOverride = false;
		let diff = i - currentMod;
		if (diff > n / 2) diff -= n;
		else if (diff < -n / 2) diff += n;
		currentIndex += diff;
	}

	function autoNext() { next(true); }

	$effect(() => {
		if (!mounted || !autoplay || isEngaged || infiniteItems.length <= 1) return;
		const ms = (config.autoplayInterval || 5) * 1000;
		const id = setInterval(autoNext, ms);
		return () => clearInterval(id);
	});

	// â”€â”€ Swipe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	let drag = $state<DragState>(createDragState());
	let wheelState = createWheelState();

	const handlers = {
		getItemsLength: () => items.length,
		getInfiniteLength: () => infiniteItems.length,
		getBufferCount: () => bufferCount,
		getCurrentIndex: () => currentIndex,
		setCurrentIndex: (i: number) => { currentIndex = i; },
		isTransitioning: () => isTransitioning,
		next,
		prev,
		setAutoplayOverride: (v: boolean) => { autoplayOverride = v; },
	};

	function onTouchStart(e: TouchEvent | MouseEvent) {
		drag = sharedTouchStart(e, drag, handlers);
	}
	function onTouchMove(e: TouchEvent | MouseEvent) {
		drag = sharedTouchMove(e, drag, handlers);
	}
	function onTouchEnd() {
		drag = sharedTouchEnd(drag, handlers);
	}
	function onClickCapture(e: MouseEvent) {
		sharedClickCapture(e, drag);
	}
	function onWheel(e: WheelEvent) {
		wheelState = sharedWheel(e, wheelState, handlers);
	}
	function onTransitionEnd(e: TransitionEvent) {
		sharedTransitionEnd(e, handlers, (v) => { isTransitioning = v; });
	}

	const activeDot = $derived(items.length > 0 ? ((currentIndex % items.length) + items.length) % items.length : 0);
	const translateX = $derived(`calc(-${currentIndex * 100}% + ${drag.isDragging ? drag.dragOffset : 0}px)`);

	/**
	 * Умови `isHovered` тут НЕМАЄ, і це не послаблення межі.
	 *
	 * Обробник висить на самому `.gc-root`, тобто подія доходить сюди лише тоді,
	 * коли фокус усередині каруселі — межу вже задає DOM. Наведення мишею без
	 * фокуса події не породжує взагалі, тож стара умова не пускала рівно тих, для
	 * кого обробник і призначений: людей, які дійшли сюди Tab-ом.
	 *
	 * `isTypingTarget` лишається (HOTKEYS-v8 § 2, HK-TEXT-ENTRY-GUARD): слайд
	 * може містити підпис із полем, і стрілки в ньому належать курсору.
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (isTypingTarget(e.target)) return;
		if (items.length <= 1) return;
		if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
		else if (e.key === 'ArrowRight') { e.preventDefault(); next(false); }
	}
</script>

<!--
	Клавіатура тут ОБРОБЛЯЄТЬСЯ (`onkeydown` нижче: ← →); попередження — про те,
	що `role="region"` не інтерактивна роль, а не про відсутність клавіатури.
	Стрілки діють, щойно фокус усередині — межу задає сам DOM, бо обробник
	висить на цьому вузлі. Автопрокрутка спиняється і на наведенні, і на фокусі:
	слайд, що змінився під руками, збиває той самий Tab-порядок, яким сюди
	дійшли.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="gc-root"
	data-testid={testIdPrefix}
	role="region"
	aria-roledescription="carousel"
	aria-label={resolvedAriaLabel}
	tabindex="0"
	onmouseenter={() => { isHovered = true; }}
	onmouseleave={() => { isHovered = false; drag = { ...drag, isDragging: false, dragOffset: 0 }; }}
	onfocusin={() => { isFocusWithin = true; }}
	onfocusout={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) isFocusWithin = false; }}
	onkeydown={handleKeydown}
>
	<div
		class="gc-carousel"
		style="aspect-ratio: {cssAspectRatio};"
		onwheel={onWheel}
	>
		<!--
			Жест перетягування — вказівниковий за природою: пальцем і мишею. Те саме
			перелистування роблять кнопки ‹ › і точки, тож клавіатура нічого не
			втрачає. `role="list"` лишається для читалки.
		-->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="gc-track"
			style="transform: translateX({translateX}); transition: {isTransitioning && !drag.isDragging ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' : 'none'};"
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
			onmousedown={onTouchStart}
			onmousemove={onTouchMove}
			onmouseup={onTouchEnd}
			onclickcapture={onClickCapture}
			ontransitionend={onTransitionEnd}
			role="list"
		>
			{#each infiniteItems as img, i (i)}
				<!--
					ВІДОМА МЕЖА, а не розглянутий випадок: клік по слайду відкриває
					лайтбокс, і клавіатурного шляху до цього немає. Слайд не у
					Tab-порядку НАВМИСНО — у нескінченній каруселі слайди клоновані, і
					кожен клон став би окремою зупинкою Tab. Правильне рішення — одна
					кнопка «відкрити» на карусель; записано в PROJECT-CONTEXT.md.
				-->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="gc-slide"
					role="listitem"
					onclick={() => {
						if (!drag.isDragging && Math.abs(drag.dragOffset) < 5) {
							openLightbox(items.length > 0 ? ((i % items.length) + items.length) % items.length : 0);
						}
					}}
				>
					<img
						src={img.src}
						alt={img.alt}
						width="1200"
						height="900"
						loading="lazy"
						decoding="async"
						draggable="false"
						style={img.position ? `object-position: ${img.position}` : ''}
					/>
					{#if config.showCaptions}
						<div class="gc-overlay">
							<span class="gc-caption">{img.title}</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if config.autoplay && items.length > 1}
			<button
				type="button"
				class="gc-play-btn"
				onclick={() => { autoplayOverride = !autoplay; }}
				aria-label={autoplay ? $t('common.pause') : $t('common.play')}
				data-testid="{testIdPrefix}-autoplay-btn"
			>
				{#if autoplay}<Pause size={14} />{:else}<Play size={14} />{/if}
			</button>
		{/if}
	</div>

	{#if items.length > 1}
		<div class="gc-dots" data-testid="{testIdPrefix}-pagination-list">
			{#each items as item, i (item.src)}
				<button
					type="button"
					class="gc-dot"
					class:active={i === activeDot}
					onclick={() => goTo(i)}
					aria-label="{$t('common.slide')} {i + 1}"
					data-testid="{testIdPrefix}-pagination-btn-{i}"
				></button>
			{/each}
		</div>
	{/if}
</div>

<PhotoLightbox
	images={items}
	currentIndex={lightboxIndex}
	isOpen={isLightboxOpen}
	onclose={() => (isLightboxOpen = false)}
/>

<style>
	.gc-root {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.gc-carousel {
		position: relative;
		overflow: hidden;
		border-radius: 1rem;
		max-height: 70dvh;
		user-select: none;
		-webkit-user-select: none;
	}

	.gc-track {
		display: flex;
		height: 100%;
		will-change: transform;
		cursor: grab;
	}
	.gc-track:active { cursor: grabbing; }

	.gc-slide {
		flex: 0 0 100%;
		position: relative;
		overflow: hidden;
		cursor: pointer;
	}
	.gc-slide img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		pointer-events: none;
	}

	.gc-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%);
		display: flex;
		align-items: flex-end;
		padding: 1.5rem;
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.gc-caption {
		color: #fff;
		font-size: 1.1rem;
		font-weight: 600;
		text-shadow: 0 1px 6px rgba(0,0,0,0.4);
	}

	/* â”€â”€ Play/pause button â€” top-right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
	.gc-play-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: rgba(255,255,255,0.65);
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-dark-text, #1a1a2e);
		transition: background 0.2s ease, opacity 0.25s ease;
		z-index: 2;
		opacity: 0;
		box-shadow: 0 2px 8px rgba(0,0,0,0.12);
	}
	.gc-carousel:hover .gc-play-btn { opacity: 1; }
	.gc-play-btn:hover { background: rgba(255,255,255,0.9); }

	/* â”€â”€ Dots â€” below carousel, styled like ContentWidget â”€â”€ */
	.gc-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
		padding: 0 var(--space-md, 1rem);
	}

	/*
	 * Смужку малює `::before`, а не тло самої кнопки — і це третя спроба, тож
	 * причина записана.
	 *
	 * Кнопка мусить бути ціллю дотику 24px (WCAG 2.2 SC 2.5.8), а смужка —
	 * лишатися 6px. Спершу різницю набирав паддінг разом із
	 * `background-clip: content-box`: тло фарбувалося лише по вмісту, тобто
	 * смужка виглядала правильно. Але скруглення при такому clip зменшується на
	 * паддінг ОКРЕМО ПО КОЖНІЙ ОСІ:
	 *
	 *   `border-radius: 3px`   → 3−0 по горизонталі, 3−9 по вертикалі = 0 →
	 *                            смужка малювалася прямокутною, хоч скруглення
	 *                            й було оголошене;
	 *   `border-radius: 999px` → 999−0 по горизонталі (обрізається половиною
	 *                            ШИРИНИ), 999−9 по вертикалі (половиною висоти)
	 *                            → різні радіуси по осях, тобто еліпс. Саме це
	 *                            й виглядало «дивною формою».
	 *
	 * Окремий бокс під смужку знімає всю цю арифметику: у нього власні межі й
	 * власний радіус, який ні на що не зменшується. Паддінг і межі смужки
	 * зв'язані однією змінною, тож ціль дотику змінюється в одному місці.
	 */
	.gc-dot {
		--dot-pad-block: 9px;
		--dot-pad-inline: 0px;
		/* content-box навмисно: `width`/`height` описують ВИДИМУ смужку. */
		box-sizing: content-box;
		position: relative;
		width: 30px;
		height: 6px;
		padding-block: var(--dot-pad-block);
		padding-inline: var(--dot-pad-inline);
		/* Від'ємні відступи повертають рядку попередню висоту: більшає лише зона
		   натискання, розкладка не зсувається. */
		margin-block: calc(-1 * var(--dot-pad-block));
		margin-inline: calc(-1 * var(--dot-pad-inline));
		border: none;
		background: none;
		cursor: pointer;
		transition: width 0.3s ease;
	}

	.gc-dot::before {
		content: '';
		position: absolute;
		inset-block: var(--dot-pad-block);
		inset-inline: var(--dot-pad-inline);
		border-radius: 3px;
		background-color: var(--border-main, var(--color-border, #d0d5dd));
		transition: background-color 0.3s ease, opacity 0.3s ease;
	}

	.gc-dot.active {
		width: 60px;
	}

	.gc-dot.active::before {
		background-color: var(--text-title, #005fae);
	}

	.gc-dot:hover::before {
		background-color: var(--text-title, #005fae);
		opacity: 0.7;
	}

	@media (max-width: 1024px) {
		.gc-carousel { border-radius: 0.75rem; }
		.gc-caption { font-size: 0.95rem; }
		.gc-overlay { padding: 1rem; }
		.gc-play-btn { opacity: 0.7; }
		.gc-carousel:hover .gc-play-btn { opacity: 0.9; }
	}

	@media (max-width: 480px) {
		/* 20px смужки + 2px паддінга з боків = 24px цілі дотику; від'ємний
		   margin лишає проміжок між крапками таким, як був. */
		.gc-dot {
			width: 20px;
			--dot-pad-inline: 2px;
		}
		.gc-dot.active { width: 40px; }
	}
</style>
