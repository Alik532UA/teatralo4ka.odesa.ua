<script lang="ts">
	import { untrack } from 'svelte';
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
</script>

<div class="photo-block">
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

	<div class="photo-dots" data-testid="galaxy-update-photo-dots">
		{#each stack as _photo, i (i)}
			<button
				type="button"
				class="photo-dot"
				class:photo-dot--active={i === shown}
				onclick={() => (shown = i)}
				aria-label={`${i + 1}`}
				data-testid="galaxy-update-photo-dot-{i}"
			></button>
		{/each}
	</div>
</div>

<style>
	.photo-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
		margin-left: auto;
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
	.photo-dots {
		display: flex;
		justify-content: center;
		gap: 0.35rem;
	}
	.photo-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		border: 1.5px solid rgb(140 190 255 / 0.5);
		background: transparent;
		padding: 0;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}
	.photo-dot--active {
		background: rgb(140 190 255 / 0.85);
		border-color: rgb(140 190 255 / 0.9);
		transform: scale(1.2);
	}
	.photo-dot:hover:not(.photo-dot--active) {
		background: rgb(140 190 255 / 0.35);
		border-color: rgb(140 190 255 / 0.7);
	}
</style>
