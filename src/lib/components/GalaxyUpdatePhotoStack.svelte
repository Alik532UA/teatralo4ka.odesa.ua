<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { allGraduatePhotos } from '$lib/data/graduates';

	/**
	 * Стопка світлин — ілюстрація до пункту «кілька фотографій замість однієї».
	 *
	 * Повторює картку випускника рядок у рядок: ті самі зсув, нахил, прозорість,
	 * приглушення й пружна крива. Показувати «як це працює» і малювати при цьому
	 * щось інше було б гірше, ніж не показувати зовсім.
	 *
	 * Розмір фіксований і КВАДРАТНИЙ. У картці він гумовий
	 * (`clamp(100px, 40vw, 175px)` з `height: auto`), і саме звідти брався овал:
	 * ширину задавала колонка пункту, а висота підлаштовувалася під неї.
	 */
	interface Props {
		/** Курсор на пункті: тоді стопка сама показує іншу світлину. */
		active?: boolean;
	}

	let { active = false }: Props = $props();

	const SIZE = 62;

	/**
	 * Стопка з облікового запису автора — його ж і питають, коли щось не так.
	 *
	 * Порядок задає `allGraduatePhotos`: спершу додаткові (молодші), останнім
	 * основне. Тому починаємо з КІНЦЯ — теперішнє фото зверху, як і в картці.
	 */
	const stack = allGraduatePhotos('alik-zapolnov', 2, 192);
	let shown = $state(stack.length - 1);

	/** -1 ліворуч-угору, +1 праворуч-униз, 0 — та, що зверху. */
	const offsetOf = (i: number) => (i === shown ? 0 : i < shown ? -1 : 1);

	/**
	 * Наведення гортає стопку, відведення — гортає далі, тобто повертає
	 * попередню світлину.
	 *
	 * Саме на КОЖНУ зміну `active`, а не окремо на вхід і вихід: із двома фото
	 * це і є «навів — побачив інше, відвів — повернулося». Перший прогін ефекту
	 * пропускається (`ready`), бо він стається на монтуванні, коли курсора ще
	 * ніде немає.
	 */
	let ready = false;
	$effect(() => {
		const _ = active;
		if (!ready) {
			ready = true;
			return;
		}
		untrack(() => {
			shown = (shown + 1) % stack.length;
		});
	});

	/**
	 * Гортання стопки колесом миші під курсором.
	 *
	 * Запобігає прокручуванню всієї сторінки/модалки (`e.preventDefault()`)
	 * і перемикає світлини: вниз — наступна, вгору — попередня.
	 */
	function wheelStack(): Attachment {
		return (node) => {
			const element = node as HTMLElement;
			let wheelAcc = 0;
			let wheelAt = 0;
			const WHEEL_STEP = 40;
			const WHEEL_GAP = 200;

			function onWheel(e: WheelEvent) {
				if (stack.length <= 1) return;
				e.preventDefault();

				const now = performance.now();
				if (now - wheelAt > WHEEL_GAP) wheelAcc = 0;
				wheelAt = now;
				wheelAcc += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

				if (wheelAcc >= WHEEL_STEP) {
					shown = (shown + 1) % stack.length;
					wheelAcc = 0;
				} else if (wheelAcc <= -WHEEL_STEP) {
					shown = (shown - 1 + stack.length) % stack.length;
					wheelAcc = 0;
				}
			}

			element.addEventListener('wheel', onWheel, { passive: false });

			return () => {
				element.removeEventListener('wheel', onWheel);
			};
		};
	}
</script>

<div class="photo-block" {@attach wheelStack()}>
	<button
		type="button"
		class="photo-stack"
		onclick={() => (shown = (shown + 1) % stack.length)}
		aria-label={`${shown + 1} / ${stack.length}`}
		data-testid="galaxy-update-photo-stack-btn"
	>
		{#each stack as photo, i (i)}
			<img
				class="photo photo--stacked"
				class:photo--active={i === shown}
				class:photo--behind={i !== shown}
				style="--stack-offset: {offsetOf(i)}"
				src={photo.src}
				srcset={photo.srcset}
				sizes="{SIZE}px"
				width={SIZE}
				height={SIZE}
				alt=""
				loading="lazy"
			/>
		{/each}
	</button>

	<div class="photo-dots" data-testid="galaxy-update-photo-dot-list">
		{#each stack as _photo, i (i)}
			<button
				type="button"
				class="photo-dot"
				class:photo-dot--active={i === shown}
				onclick={() => (shown = i)}
				aria-label={`${i + 1}`}
				data-testid="galaxy-update-photo-dot-btn-{i}"
			>
				<span class="photo-dot__track">
					{#if i === shown}<span class="photo-dot__progress"></span>{/if}
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	/* Де стоїть — вирішує `feature__figure`; тут лише вигляд. */
	.photo-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}
	.photo-stack {
		position: relative;
		width: 62px;
		height: 62px;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}
	.photo {
		display: block;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgb(140 190 255 / 0.55);
	}
	.photo--stacked {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		transition:
			transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.35s ease,
			z-index 0s;
	}
	.photo--active {
		z-index: 2;
		opacity: 1;
		transform: translate(0, 0) rotate(0deg) scale(1);
	}
	/* Зсуви на 40 % менші за картку — рівно настільки, наскільки менше саме коло. */
	.photo--behind {
		z-index: 1;
		opacity: 0.7;
		transform: translate(
				calc(var(--stack-offset) * 11px),
				calc(var(--stack-offset) * 4px)
			)
			rotate(calc(var(--stack-offset) * 4deg)) scale(0.92);
		filter: brightness(0.8);
	}
	.photo-stack:hover .photo--behind {
		opacity: 0.85;
		transform: translate(
				calc(var(--stack-offset) * 13px),
				calc(var(--stack-offset) * 5px)
			)
			rotate(calc(var(--stack-offset) * 5deg)) scale(0.94);
	}
	.photo-dots { --dot-pad-block: 8px; --dot-pad-inline: 0px; display: flex; justify-content: center; column-gap: 0.35rem; row-gap: calc(2 * var(--dot-pad-block) + 0.35rem); flex-wrap: wrap; }
	.photo-dot { box-sizing: content-box; position: relative; width: 18px; height: 5px; padding-block: var(--dot-pad-block); padding-inline: var(--dot-pad-inline); margin-block: calc(-1 * var(--dot-pad-block)); margin-inline: calc(-1 * var(--dot-pad-inline)); border: none; background: none; cursor: pointer; transition: width 0.3s ease; }
	.photo-dot__track { position: absolute; inset-block: var(--dot-pad-block); inset-inline: var(--dot-pad-inline); border-radius: 3px; background: color-mix(in srgb, var(--galaxy-muted, #a8bfe0), transparent 65%); overflow: hidden; pointer-events: none; transition: background-color 0.3s ease; }
	.photo-dot:hover .photo-dot__track { background: color-mix(in srgb, var(--galaxy-muted, #a8bfe0), transparent 35%); }
	.photo-dot--active { width: 36px; }
	.photo-dot__progress { display: block; height: 100%; width: 100%; border-radius: 3px; background: var(--galaxy-accent, #8cc4ff); box-shadow: 0 0 6px color-mix(in srgb, var(--galaxy-accent, #8cc4ff), transparent 50%); }
</style>
