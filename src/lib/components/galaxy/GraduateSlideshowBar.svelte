<script lang="ts">
	import { t } from 'svelte-i18n';
	import { X } from 'lucide-svelte';
	import {
		slideshow,
		SLIDE_SECONDS,
		SLIDE_FADE_MS,
		SLIDESHOW_FILTERS
	} from '$lib/services/graduateSlideshow.svelte';

	/**
	 * Рядок налаштувань слайдшоу — згори екрана, поверх картки.
	 *
	 * ## Чому він ХОВАЄТЬСЯ, а не зникає
	 *
	 * Прохання автора: «Кнопки налаштування видно тільки якщо курсор рухається, а
	 * якщо курсор не рухається то приховувати кнопки прозорістю 1%». Саме
	 * прозорістю, а не `display: none` — і це важливо для двох речей, які легко
	 * зламати:
	 *
	 *   • елемент лишається в дереві, тож фокус із нього не злітає й таб-порядок
	 *     не стрибає посеред слайдшоу;
	 *   • прозорість 1 %, а не 0, лишає рядок хоч трохи видимим — людина, яка
	 *     шукає, як це вимкнути, бачить, що там щось є.
	 *
	 * Наведення й фокус ТРИМАЮТЬ рядок видимим незалежно від таймера: інакше
	 * налаштування гасли б просто тому, що курсор стоїть на самому повзунку.
	 *
	 * ## Чому слухач на `window`, а не на рядку
	 *
	 * Рух курсора треба бачити всюди по екрану, а не лише над самим рядком —
	 * інакше він з'являвся б лише тоді, коли й так уже під курсором.
	 */
	const ПАУЗА_МС = 2500;

	let рухається = $state(true);
	let наведено = $state(false);
	let таймер: ReturnType<typeof setTimeout> | undefined;

	function ожив() {
		рухається = true;
		clearTimeout(таймер);
		таймер = setTimeout(() => (рухається = false), ПАУЗА_МС);
	}

	$effect(() => {
		ожив();
		return () => clearTimeout(таймер);
	});

	const видно = $derived(рухається || наведено);
</script>

<svelte:window onpointermove={ожив} onkeydown={ожив} />

<!--
	`role="toolbar"` навмисно НЕ ставиться: у ролі toolbar стрілки мусять
	переміщати фокус між кнопками, а тут стоять повзунки, у яких стрілки міняють
	значення. Обіцяти поведінку, якої немає, гірше за відсутність ролі
	(ACCESSIBILITY-v8 § 3).
-->
<div
	class="bar"
	class:bar--idle={!видно}
	onpointerenter={() => (наведено = true)}
	onpointerleave={() => (наведено = false)}
	onfocusin={() => (наведено = true)}
	onfocusout={() => (наведено = false)}
	role="group"
	aria-label={$t('galaxy.slideshowSettings')}
	data-testid="galaxy-slideshow-settings-panel"
>
	<label class="bar__field">
		<span class="bar__label">{$t('galaxy.slideshowSeconds')}</span>
		<input
			type="range"
			min={SLIDE_SECONDS.min}
			max={SLIDE_SECONDS.max}
			step="1"
			value={slideshow.seconds}
			oninput={(e) => slideshow.setSeconds(Number(e.currentTarget.value))}
			data-testid="galaxy-slideshow-seconds-input"
		/>
		<span class="bar__value" data-testid="galaxy-slideshow-seconds-text"
			>{slideshow.seconds} {$t('galaxy.slideshowSecondsShort')}</span
		>
	</label>

	<label class="bar__field">
		<span class="bar__label">{$t('galaxy.slideshowFade')}</span>
		<input
			type="range"
			min={SLIDE_FADE_MS.min}
			max={SLIDE_FADE_MS.max}
			step="100"
			value={slideshow.fadeMs}
			oninput={(e) => slideshow.setFadeMs(Number(e.currentTarget.value))}
			data-testid="galaxy-slideshow-fade-input"
		/>
		<span class="bar__value" data-testid="galaxy-slideshow-fade-text"
			>{(slideshow.fadeMs / 1000).toFixed(1)} {$t('galaxy.slideshowSecondsShort')}</span
		>
	</label>

	<label class="bar__field">
		<span class="bar__label">{$t('galaxy.slideshowWho')}</span>
		<select
			value={slideshow.filter}
			onchange={(e) => slideshow.setFilter(e.currentTarget.value)}
			data-testid="galaxy-slideshow-filter-select"
		>
			{#each SLIDESHOW_FILTERS as вибір (вибір)}
				<option value={вибір}>{$t(`galaxy.slideshowFilter.${вибір}`)}</option>
			{/each}
		</select>
	</label>

	<button
		type="button"
		class="bar__stop"
		onclick={() => slideshow.stop()}
		data-testid="galaxy-slideshow-stop-btn"
	>
		<X size={16} aria-hidden="true" />
		<span>{$t('galaxy.slideshowStop')}</span>
	</button>
</div>

<style>
	/*
	 * ШИРИНА: рядок, а не два.
	 *
	 * Доти панель була `max-width: 62rem` по центру, і чотири елементи керування
	 * у неї не влазили — «Кого показувати» зі «Спинити показ» переносилися на
	 * другий рядок. Тепер вона тягнеться від лівого краю майже до правого.
	 *
	 * САМЕ «майже»: у правому куті стоять ДВІ кнопки по 44 px — показ (пауза) і
	 * повний екран, — і панель мусить лишити місце обом. Кнопка повного екрана
	 * має бути доступною, про це автор попросив окремо; кнопка показу — це
	 * пауза, тобто теж те, чим користуються під час показу.
	 *
	 * Заміряно: із запасом 4,5 rem панель на 1280 px тяглася до 1208 і накривала
	 * кнопку показу (1160..1204). Тепер запас — дві кнопки плюс проміжки.
	 */
	.bar {
		position: fixed;
		top: 0;
		left: clamp(0.5rem, 1.5vw, 1.5rem);
		right: calc(clamp(0.5rem, 1.5vw, 1.5rem) + 2 * 44px + 1rem);
		z-index: var(--z-modal, 1000);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		padding: 0.6rem 1rem;
		border-radius: 0 0 var(--radius-lg, 16px) var(--radius-lg, 16px);
		background: rgb(5 10 31 / 0.82);
		border: 1px solid rgb(255 255 255 / 0.14);
		border-top: 0;
		backdrop-filter: blur(8px);
		color: var(--galaxy-text, #eaf2ff);
		/*
		 * Прозорість, а не `display`, і перехід саме по ній: розбір у докблоці
		 * вище. Півсекунди — щоб зникнення читалося як затихання, а не як збій.
		 */
		transition: opacity 0.5s ease;
	}
	/* Рівно один відсоток, як просив автор: рядок майже зник, але його видно. */
	.bar--idle {
		opacity: 0.01;
	}

	.bar__field {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}
	.bar__label {
		color: var(--galaxy-muted, #a8bfe0);
	}
	.bar__value {
		min-width: 3.2rem;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}
	/* Повзунки вужчі за початкові 8 rem: рядок мусить лишатися одним і на
	   1280 px, а точність тут не потрібна — крок цілий. */
	.bar__field input[type='range'] {
		width: clamp(5rem, 9vw, 8rem);
		accent-color: var(--galaxy-accent, #8cc4ff);
	}
	.bar__field select {
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm, 6px);
		background: rgb(11 19 48 / 0.9);
		border: 1px solid rgb(255 255 255 / 0.18);
		color: inherit;
		font-size: 0.85rem;
	}

	.bar__stop {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-full, 9999px);
		background: rgb(255 255 255 / 0.1);
		border: 1px solid rgb(255 255 255 / 0.22);
		color: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition: background var(--transition-base);
	}
	.bar__stop:hover {
		background: rgb(255 255 255 / 0.2);
	}

	/* На телефоні повзунки не влазять у рядок — рядок стає стовпчиком, а сам
	   екран там і так вертикальний. */
	@media (max-width: 640px) {
		.bar {
			left: 0;
			right: 0;
			border-radius: 0;
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
