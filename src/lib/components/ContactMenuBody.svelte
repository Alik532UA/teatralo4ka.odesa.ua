<script lang="ts">
	import { asset } from '$app/paths';

	/**
	 * Вміст віконця «напиши мені»: аватар адміністратора, підпис і чотири
	 * месенджери.
	 *
	 * ## Навіщо окремо від віконець
	 *
	 * Те саме віконце малювали ДВА компоненти — `GraduateCardContactMenu` у
	 * картці випускника й `EditContactButton` на семи інших сторінках. У кожного
	 * був свій список месенджерів, своя адреса аватара й свої два тексти
	 * прохання. Розійшлися вони не в чомусь великому: у картці підпис був
	 * блакитний і щільний, на власній сторінці людини — білий і розріджений, і
	 * той самий олівець тієї самої людини давав два різні віджети. Зводити
	 * значення руками довелося вже двічі.
	 *
	 * Тут лишається те, що МУСИТЬ бути однакове: адреси месенджерів, знімок
	 * адміністратора, обидва тексти прохання й `data-testid`. Розташування й
	 * скін лишаються у віконець — вони справді різні: у картці це смужка
	 * ліворуч від кнопки, у підвалі сторінки — стовпчик над нею, у вузькому
	 * блоці — прямокутне вікно, що складається.
	 *
	 * ## Чому розмір ПРОПОМ, а не селектором зовні
	 *
	 * Стилі Svelte не проходять у дитину: батько не може задати розмір аватара
	 * всередині цього компонента, не вдаючись до `:global()`. Тому три названі
	 * розміри — і жодних чисел на місцях виклику.
	 */
	interface Props {
		/**
		 * Початок `data-testid`: `<prefix>-admin-img`, `<prefix>-hint`,
		 * `<prefix>-link-<мережа>`.
		 */
		testIdPrefix: string;
		/**
		 * Чи є в людини знімок. Від цього залежить сам текст прохання: там, де
		 * фото немає, його заразом і просять.
		 */
		hasPhoto?: boolean;
		/**
		 * Свій підпис замість типового. Потрібен вітальному вікну галактики: там
		 * ідеться не про правки в анкеті, а про будь-яке питання.
		 *
		 * Перенос рядка задається `\n` і малюється через `<br>`, а не лишається
		 * на волю переносу за шириною: поділ на три рядки навмисний. Розмітка, а
		 * не `{@html}` — правило `svelte/no-at-html-tags` тут доречне.
		 */
		hint?: string;
		/**
		 * `strip` — смужка в один рядок (картка випускника);
		 * `block` — прямокутне вікно (сторінки груп, вистав, викладачів);
		 * `large` — стовпчик, де віконце має власну ширину (вітальне вікно).
		 */
		size?: 'strip' | 'block' | 'large';
		/**
		 * `false` — лише значки месенджерів, без обличчя й без підпису.
		 *
		 * Потрібно там, де прохання написати вже СКАЗАНЕ рядком поруч: у картці
		 * «Додати виставу» стояло «Напишіть мені — і показ з'явиться в архіві», а
		 * відразу за ним це віконце казало «Привіт!) Щоб внести правки — напиши
		 * мені». Дві різні фрази про одну дію в одному рядку — і читач мусив
		 * вибирати, яка з них справжня.
		 */
		showGreeting?: boolean;
	}

	let {
		testIdPrefix,
		hasPhoto = true,
		hint,
		size = 'strip',
		showGreeting = true
	}: Props = $props();

	const ТИПОВИЙ_ПІДПИС = 'Привіт!)\nЩоб внести правки\n— напиши мені';
	const БЕЗ_ФОТО = 'Привіт!)\nЩоб надати фото чи внести\nправки — напиши мені';

	const текст = $derived(hint ?? (hasPhoto ? ТИПОВИЙ_ПІДПИС : БЕЗ_ФОТО));

	const contacts = [
		{ name: 'Telegram', url: 'https://t.me/alik532', icon: 'telegram.svg' },
		{ name: 'Viber', url: 'viber://chat?number=%2B380937251208', icon: 'viber.svg' },
		{ name: 'WhatsApp', url: 'https://wa.me/380937251208', icon: 'whatsapp.svg' },
		{ name: 'LinkedIn', url: 'https://linkedin.com/in/alik-qa-engineer', icon: 'linkedin.svg' }
	];
</script>

{#if showGreeting}
<img
	src={asset('/graduates/alik-zapolnov-96.webp')}
	alt="Алік Запольнов"
	width="28"
	height="28"
	class="avatar avatar--{size}"
	loading="eager"
	data-testid="{testIdPrefix}-admin-img"
/>

<p class="hint hint--{size}" data-testid="{testIdPrefix}-hint">
	{#each текст.split('\n') as line, i (i)}{#if i > 0}<br />{/if}{line}{/each}
</p>
{/if}

<div class="icons icons--{size}">
	{#each contacts as contact (contact.name)}
		<!--
			rel="external" — за ним правило проєкту визнає посилання зовнішнім;
			`stopPropagation` не дає натисканню закрити віконце раніше, ніж
			браузер відкриє месенджер.
		-->
		<a
			href={contact.url}
			target="_blank"
			rel="external noopener noreferrer"
			class="link link--{size}"
			aria-label={contact.name}
			title={contact.name}
			onclick={(event) => event.stopPropagation()}
			data-testid="{testIdPrefix}-link-{contact.name.toLowerCase()}"
		>
			<img src={asset(`/social_media/${contact.icon}`)} alt={contact.name} width="28" height="28" />
		</a>
	{/each}
</div>

<style>
	.avatar {
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid rgb(140 190 255 / 0.4);
		flex-shrink: 0;
	}
	.avatar--strip {
		width: 28px;
		height: 28px;
	}
	.avatar--block {
		width: 32px;
		height: 32px;
	}
	.avatar--large {
		width: 40px;
		height: 40px;
	}

	.hint {
		margin: 0;
		color: rgb(180 210 255 / 0.85);
	}
	.hint--strip {
		font-size: 0.84rem;
		line-height: 1;
	}

	/*
	 * На вузькому екрані рядки розсуваються.
	 *
	 * Смужка там не вміщається (заміряно: 343 пікселі проти 375) і віконце
	 * складається в прямокутник — три щільні рядки в ньому стоять зліплено.
	 * Правило живе тут, а не у віконця, бо стилі Svelte не проходять у дитину:
	 * підпис тепер саме тут, і дістати його зовні можна було б лише
	 * `:global()`.
	 */
	@media (max-width: 560px) {
		.hint--strip {
			line-height: 1.3;
		}
	}
	.hint--block {
		font-size: 0.82rem;
		line-height: 1.3;
		color: var(--text-main);
		white-space: nowrap;
	}
	.hint--large {
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.icons {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.35rem;
	}
	.icons--large {
		gap: 0.6rem;
	}

	.link {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		text-decoration: none;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			filter 0.2s ease;
	}
	.link--strip,
	.link--large {
		width: 38px;
		height: 38px;
	}
	.link:hover {
		transform: scale(1.1);
	}
	.link img {
		width: 28px;
		height: 28px;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.3));
	}
</style>
