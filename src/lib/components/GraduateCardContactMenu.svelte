<script lang="ts">
	import { fly } from "svelte/transition";
	import ContactMenuBody from './ContactMenuBody.svelte';

	/**
	 * Спливаюче меню «напиши мені» біля олівця на картці випускника.
	 *
	 * Окремим файлом, бо це самодостатній віджет: аватар, підпис і чотири
	 * месенджери зі своїми стилями. У тулбарі лишається те, що стосується
	 * КНОПКИ — коли меню відкривати й закривати; тут лише те, як воно
	 * виглядає. Разом ці дві відповідальності давали файл понад типову стелю
	 * `structure.test.ts` у 300 рядків.
	 */
	interface Props {
		/**
		 * Підпис над месенджерами. Різний за місцем: у картці випускника йдеться
		 * про правки в анкеті, у вітальному вікні — про будь-яке питання.
		 *
		 * Перенос рядка задається `\n` і малюється через `<br>`, а не лишається
		 * на волю переносу за шириною: поділ на три рядки тут навмисний.
		 * Розмітка, а не `{@html}` — правило `svelte/no-at-html-tags` тут доречне,
		 * і обходити його заради двох переносів не варто.
		 */
		hint?: string;
		/**
		 * `card` — ліворуч від олівця в картці; `above` і `below` — картка над
		 * кнопкою або під нею, залежно від того, де на екрані сама кнопка.
		 */
		placement?: 'card' | 'above' | 'below';
	}

	let {
		hint = 'Привіт!)\nЩоб внести правки\n— напиши мені',
		placement = 'card'
	}: Props = $props();

</script>

<div
	class="contact-popup"
	class:contact-popup--stacked={placement !== 'card'}
	class:contact-popup--above={placement === 'above'}
	class:contact-popup--below={placement === 'below'}
	transition:fly={{ x: 10, duration: 180 }}
	data-testid="galaxy-card-contact-menu"
>
	<ContactMenuBody
		testIdPrefix="galaxy-card-contact"
		{hint}
		size={placement === 'card' ? 'strip' : 'large'}
	/>
</div>

<style>
	.contact-popup {
		position: absolute;
		top: 50%;
		right: calc(100% + 0.65rem);
		transform: translateY(-50%);
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.65rem;
		padding: 0.35rem 0.65rem;
		background: rgb(3 6 20 / 0.88);
		border: 1px solid rgb(140 190 255 / 0.28);
		border-radius: 999px;
		box-shadow: 0 8px 28px rgb(0 0 0 / 0.55);
		backdrop-filter: blur(14px);
		white-space: nowrap;
	}
	/*
	 * Над кнопкою й СТОВПЧИКОМ — той самий вигляд, що на сторінці викладача:
	 * аватар зверху, підпис, месенджери під ним.
	 *
	 * Рядком тут не стає: у картці випускника меню виїжджає збоку від олівця й
	 * має вздовж себе всю ширину сторінки, а тут воно висить над кнопкою
	 * підвалу, і той самий вміст у рядок розтягувався б на пів вікна.
	 */
	.contact-popup--stacked {
		flex-direction: column;
		align-items: center;
		gap: 0.55rem;
		right: auto;
		left: 0;
		transform: none;
		width: 260px;
		max-width: 88vw;
		padding: 1.1rem;
		border-radius: 1rem;
		white-space: normal;
		text-align: center;
		z-index: 2;
	}
	.contact-popup--above {
		top: auto;
		bottom: calc(100% + 0.6rem);
	}
	.contact-popup--below {
		top: calc(100% + 0.6rem);
		bottom: auto;
	}
	/* На вузькому меню не вміщається ліворуч від кнопки — падає під неї. */
	@media (max-width: 768px) {
		.contact-popup {
			right: auto;
			left: 0;
			top: calc(100% + 0.4rem);
			flex-direction: row;
		}
	}
</style>
