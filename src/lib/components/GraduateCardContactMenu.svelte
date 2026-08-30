<script lang="ts">
	import { fly } from "svelte/transition";
	import { asset } from "$app/paths";

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

	const contacts = [
		{ name: "Telegram", url: "https://t.me/alik532", icon: "telegram.svg" },
		{
			name: "Viber",
			url: "viber://chat?number=%2B380937251208",
			icon: "viber.svg",
		},
		{
			name: "WhatsApp",
			url: "https://wa.me/380937251208",
			icon: "whatsapp.svg",
		},
		{
			name: "LinkedIn",
			url: "https://linkedin.com/in/alik-qa-engineer",
			icon: "linkedin.svg",
		},
	];
</script>

<div
	class="contact-popup"
	class:contact-popup--stacked={placement !== 'card'}
	class:contact-popup--above={placement === 'above'}
	class:contact-popup--below={placement === 'below'}
	transition:fly={{ x: 10, duration: 180 }}
	data-testid="galaxy-card-contact-menu"
>
	<img
		src={asset("/graduates/alik-zapolnov-96.webp")}
		alt="Алік Запольнов"
		width="28"
		height="28"
		class="contact-popup__avatar"
		loading="eager"
		data-testid="galaxy-card-contact-admin-img"
	/>
	<p class="contact-popup__hint" data-testid="galaxy-card-contact-hint">
		{#each hint.split('\n') as line, i (i)}{#if i > 0}<br />{/if}{line}{/each}
	</p>
	<div class="contact-popup__icons">
		{#each contacts as c (c.name)}
			<!-- rel="external" — див. GraduateProfileView: саме за ним правило
			     визнає посилання зовнішнім. -->
			<a
				href={c.url}
				target="_blank"
				rel="external noopener noreferrer"
				class="contact-popup__link"
				aria-label={c.name}
				title={c.name}
				onclick={(e) => e.stopPropagation()}
				data-testid="galaxy-card-contact-link-{c.name.toLowerCase()}"
			>
				<img
					src={asset(`/social_media/${c.icon}`)}
					alt={c.name}
					width="28"
					height="28"
					loading="eager"
				/>
			</a>
		{/each}
	</div>
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
	.contact-popup--stacked .contact-popup__avatar {
		width: 40px;
		height: 40px;
	}
	.contact-popup--stacked .contact-popup__hint {
		font-size: 0.9rem;
		line-height: 1.4;
	}
	.contact-popup--stacked .contact-popup__icons {
		gap: 0.6rem;
	}
	.contact-popup__avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid rgb(140 190 255 / 0.4);
		flex-shrink: 0;
	}
	.contact-popup__hint {
		margin: 0;
		font-size: 0.84rem;
		color: rgb(180 210 255 / 0.85);
		line-height: 1;
	}
	.contact-popup__icons {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.35rem;
	}
	.contact-popup__link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		text-decoration: none;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			filter 0.2s ease;
	}
	.contact-popup__link:hover {
		transform: scale(1.18);
		filter: drop-shadow(0 0 8px rgb(140 190 255 / 0.5));
	}
	.contact-popup__link img {
		width: 28px;
		height: 28px;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.3));
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
