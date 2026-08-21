<script lang="ts">
	import { graduatePhoto, graduatePhotoSrcset, type GraduateIndexEntry } from '$lib/data/graduates';

	interface Props {
		graduate: GraduateIndexEntry;
		/** `photo` — анкету заповнено, є портрет. `plain` — лише ім'я. */
		kind: 'photo' | 'plain';
		onselect: () => void;
	}

	let { graduate, kind, onselect }: Props = $props();
</script>

<!--
	Зірка — справжня кнопка, а не піксель на канвасі.

	Це не зручність розробки: ціль на canvas неможливо ані сфокусувати з
	клавіатури, ані озвучити читалкою, ані виміряти гейтом `e2e/touch-targets`, а
	зображення втратило б `srcset` і на телефоні з DPR 3 стало б мутним.

	Жодних обробників наведення: зупинку, збільшення й показ підпису робить CSS
	через `:hover` і `:focus-visible`.
-->
<button
	type="button"
	class="star star--{kind}"
	onclick={onselect}
	data-testid="galaxy-{graduate.slug}-btn"
>
	{#if kind === 'photo'}
		<img
			class="star__photo"
			src={graduatePhoto(graduate.slug, 96)}
			srcset={graduatePhotoSrcset(graduate.slug)}
			sizes="(hover: hover) 176px, 96px"
			width="96"
			height="96"
			loading="lazy"
			decoding="async"
			alt={graduate.name}
		/>
	{:else}
		<span class="star__dot" aria-hidden="true"></span>
	{/if}

	<span class="star__label">
		{graduate.name}{#if graduate.graduationYear}<span class="star__year"
				>{graduate.graduationYear}</span
			>{/if}
	</span>
</button>

<style>
	.star {
		display: grid;
		place-items: center;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		/*
		 * 56px — понад обов'язковий мінімум WCAG 2.2 (24) і понад власний стандарт
		 * проєкту (44). Гейт `e2e/touch-targets` це міряє.
		 *
		 * Запас навколо видимого кола тут не косметичний: зірка рухається, і саме
		 * прозорі поля дають курсору «схопити» її раніше, ніж він дістанеться до
		 * самого обличчя. Без них у ціль 44px, що їде, влучити важко.
		 */
		width: 56px;
		height: 56px;
		transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.star:hover,
	.star:focus-visible {
		transform: scale(1.9);
	}

	.star__photo {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
		filter: brightness(0.85) saturate(0.9);
		/* `outline`, а не `box-shadow` із розмиттям: обведення без blur не змушує
		   перемальовувати шар на кожному кадрі руху. */
		outline: 1px solid rgb(255 255 255 / 0.4);
		outline-offset: -1px;
		transition: filter 280ms ease;
	}

	.star:hover .star__photo,
	.star:focus-visible .star__photo {
		filter: brightness(1.05) saturate(1);
	}

	/* Зірка без обличчя навмисно схожа на фонову — доки на неї не навели.
	   Світіння градієнтом, а не `box-shadow`: тінь на елементі, що рухається
	   щокадру, змушує перемальовувати шар. */
	.star__dot {
		width: 24px;
		height: 24px;
		background: radial-gradient(
			circle,
			rgb(234 242 255 / 0.9) 0 3px,
			rgb(180 214 255 / 0.35) 5px,
			transparent 60%
		);
		opacity: 0.7;
		transition: opacity 280ms ease;
	}

	.star--plain:hover .star__dot,
	.star--plain:focus-visible .star__dot {
		opacity: 1;
	}

	.star__label {
		position: absolute;
		top: calc(100% - 6px);
		left: 50%;
		translate: -50% 0;
		display: flex;
		gap: 0.35em;
		padding: 3px 7px;
		border-radius: 6px;
		background: rgb(5 10 31 / 0.85);
		color: var(--galaxy-text);
		font-size: 0.7rem;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 180ms ease;
		pointer-events: none;
		/* Підпис не масштабується разом із зіркою: інакше текст стає розмитим. */
		scale: calc(1 / 1.9);
	}

	.star:hover .star__label,
	.star:focus-visible .star__label {
		opacity: 1;
	}

	.star__year {
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}

	@media (prefers-reduced-motion: reduce) {
		.star {
			transition: none;
		}
	}
</style>
