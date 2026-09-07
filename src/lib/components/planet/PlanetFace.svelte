<script lang="ts">
	import { Flower2 } from 'lucide-svelte';
	import { graduatePhoto, graduatePhotoSrcset, type GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * Обличчя учня — коло з портретом або квіткою.
	 *
	 * Спільне для всіх трьох розкладок планети. Квітка замість порожнього кола —
	 * рішення автора з першої редакції сторінки: квітка каже «тут росте», а
	 * порожнеча казала б «тут нікого».
	 *
	 * Розмір приходить ЗЗОВНІ через `--face`, а не задається тут: на орбітах він
	 * рахується з кількості учнів (`fitFaceFraction`), у сітці — сталий. Компонент
	 * не знає, у якій він розкладці, і саме тому годиться всім трьом.
	 */
	interface Props {
		student: GraduateIndexEntry;
		/** Розмір іконки-квітки: у дрібному обличчі велика квітка не влазить. */
		icon?: number;
	}

	let { student, icon = 28 }: Props = $props();
</script>

<span class="face">
	{#if student.hasPhoto}
		<img
			src={graduatePhoto(student.slug, 192)}
			srcset={graduatePhotoSrcset(student.slug)}
			sizes="96px"
			width="96"
			height="96"
			alt=""
			loading="lazy"
		/>
	{:else}
		<Flower2 size={icon} aria-hidden="true" />
	{/if}
</span>

<style>
	/*
	 * `--face` задає ТОЙ, ХТО СТАВИТЬ обличчя, і саме тому вона не оголошена
	 * тут: власне оголошення на `.face` перебило б значення, успадковане від
	 * розкладки, — у користувацьких властивостей оголошення на елементі
	 * сильніше за успадкування. Хто її задає і чому, записано в
	 * `css-variables.test.ts` → `CROSS_COMPONENT`.
	 */
	.face {
		display: grid;
		place-items: center;
		width: var(--face, 72px);
		height: var(--face, 72px);
		border-radius: 50%;
		overflow: hidden;
		background: var(--bg-card);
		border: 2px solid color-mix(in srgb, var(--accent-primary) 55%, var(--border-main));
		color: var(--accent-text);
		box-shadow: var(--shadow-main);
		transition: border-color var(--transition-base);
	}
	.face img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
