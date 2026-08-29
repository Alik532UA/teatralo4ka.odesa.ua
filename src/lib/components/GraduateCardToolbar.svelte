<script lang="ts">
	import { t } from "svelte-i18n";
	import { X, Pencil, Rocket } from "lucide-svelte";
	import GraduateCardContactMenu from "./GraduateCardContactMenu.svelte";
	import type { ResolvedPathname } from "$app/types";

	/**
	 * Кнопки над карткою випускника.
	 *
	 * Винесено з `GraduateCard` не заради краси: там лишалося три рядки до
	 * стелі `structure.test.ts`. Картці лишилося те, чим вона є, — підкладка,
	 * вікно й анкета всередині; тут — кнопки й те, коли вони спрацьовують.
	 * Вигляд самого меню контактів поїхав далі, у `GraduateCardContactMenu`.
	 *
	 * Стан меню (`open`) СПІЛЬНИЙ з батьком, бо Escape ловить `svelte:window`
	 * у картці: перше натискання має закрити меню, друге — саму картку. Без
	 * спільного стану картка не знала б, чи меню взагалі відкрите.
	 */
	interface Props {
		/**
		 * Кнопка «зв'язатися» є лише в тих, хто анкету вже заповнив: у решти
		 * правити нема чого, і олівець вів би в порожнечу.
		 */
		hasPhoto: boolean;
		/**
		 * Адреса цього ж випускника в галактиці. `null` означає, що сторінка
		 * САМА є галактикою — там «летіти до галактики» нікуди не веде.
		 */
		galaxyHref?: ResolvedPathname | null;
		/** Спливаюче меню контактів відкрите. Двобічне: див. Escape вище. */
		open: boolean;
		onclose: () => void;
	}

	let {
		hasPhoto,
		galaxyHref = null,
		open = $bindable(),
		onclose,
	}: Props = $props();

	/**
	 * Мить, коли меню відкрилося наведенням. Без неї клік одразу після
	 * наведення закривав щойно відкрите меню: миша спершу відкриває, палець
	 * слідом клацає — і людина бачить, що кнопка «не працює».
	 */
	let hoverOpenedAt = 0;
	let closeTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleMouseEnter() {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = undefined;
		}
		if (!open) {
			open = true;
			hoverOpenedAt = Date.now();
		}
	}

	function handleMouseLeave() {
		if (open) {
			closeTimeout = setTimeout(() => {
				open = false;
				closeTimeout = undefined;
			}, 2000);
		}
	}

	function toggleContact(e: Event) {
		e.stopPropagation();
		if (open && Date.now() - hoverOpenedAt < 1000) {
			return;
		}
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = undefined;
		}
		open = !open;
		if (open) {
			hoverOpenedAt = 0;
		}
	}

	function handleContactKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			toggleContact(e);
		}
	}
</script>

<div class="card__toolbars">
	{#if galaxyHref}
		<div
			class="card__toolbar card__toolbar--left"
			data-testid="galaxy-card-left-toolbar"
		>
			<a
				href={galaxyHref}
				class="card__action card__galaxy"
				aria-label={$t("galaxy.flyToGalaxy")}
				title={$t("galaxy.flyToGalaxy")}
				data-testid="galaxy-card-fly-link"
			>
				<Rocket size={20} aria-hidden="true" />
				<span class="card__galaxy-text">{$t("galaxy.flyToGalaxy")}</span>
			</a>
		</div>
	{/if}

	<div class="card__toolbar" data-testid="galaxy-card-toolbar">
		{#if hasPhoto}
			<div
				class="contact-wrap"
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			role="group"
			aria-label={$t("common.contact", { default: "Контакти" })}
		>
			{#if open}
				<GraduateCardContactMenu />
			{/if}

			<button
				type="button"
				class="card__action card__contact"
				onclick={toggleContact}
				onmouseenter={handleMouseEnter}
				onkeydown={handleContactKeydown}
				aria-expanded={open}
				aria-label={$t("common.contact", { default: "Зв'язатися" })}
				title={$t("common.contact", { default: "Зв'язатися" })}
				data-testid="graduate-profile-edit-btn"
			>
				<Pencil size={20} aria-hidden="true" />
			</button>
		</div>
	{/if}

		<button
			type="button"
			class="card__action card__close"
			onclick={onclose}
			aria-label={$t("common.close")}
			data-testid="galaxy-card-close-btn"
		>
			<X size={20} aria-hidden="true" />
		</button>
	</div>
</div>

<style>
	/*
	 * Обгортка існує заради ВУЗЬКОГО екрана.
	 *
	 * На широкому обидва набори позиціонуються абсолютно від `.card__inner`,
	 * і зайвий блок між ними лише заважав би — тому `display: contents`,
	 * тобто власної коробки він не створює взагалі.
	 *
	 * На вузькому картка гортається, набори стають у потік — і саме там
	 * потрібен спільний рядок. Спроба розвести їх окремими `float` не
	 * тримається: `.card__inner` має `width: fit-content`, плаваючі діти в
	 * таку ширину не входять, і набори роз'їжджалися на два рядки (заміряно
	 * на 375px: лівий на 65px, правий на 109px замість одного рівня).
	 */
	.card__toolbars {
		display: contents;
	}
	.card__toolbar {
		position: absolute;
		top: -3.25rem;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 10;
		pointer-events: auto;
	}
	/* Дзеркало правого набору. `right: auto` обов'язковий: без нього обидва
	   значення діють разом і блок розтягується на всю ширину картки. */
	.card__toolbar--left {
		right: auto;
		left: 0;
	}
	.card__action {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 50%;
		background: rgb(3 6 20 / 0.75);
		color: #cfe4ff;
		cursor: pointer;
		backdrop-filter: blur(8px);
	}
	/*
	 * Перехід оголошується на модифікаторах, а НЕ на `.card__action`:
	 * `close-button-conventions.test.ts` забороняє власний `transition` на
	 * будь-якому класі кнопки закриття, бо він переважує глобальний і гасить
	 * оберт хрестика. `.card__close` цього переліку не має й не матиме.
	 */
	.card__contact,
	.card__galaxy {
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}
	/*
	 * Не коло, а «пігулка»: поруч із іконкою стоїть слово. Висота лишається
	 * 44px — та сама, що в круглих кнопок праворуч, — інакше два набори над
	 * карткою стояли б на різних рівнях.
	 */
	.card__galaxy {
		width: auto;
		grid-auto-flow: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0 0.9rem;
		border-radius: 999px;
		text-decoration: none;
	}
	.card__galaxy-text {
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
		line-height: 1;
	}
	.card__contact:hover,
	.card__galaxy:hover,
	.card__close:hover {
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.7);
		color: #fff;
	}
	.contact-wrap {
		position: relative;
	}
	@media (max-width: 768px) {
		.card__toolbars {
			display: flex;
			align-items: center;
			/*
			 * `.card__inner` — колонка з `align-items: center`, тож її діти
			 * стискаються до вмісту. Без розтягування рядок кнопок виходив
			 * завширшки 140px посеред 295px картки, і «ліворуч» з «праворуч»
			 * ставали двома сусідніми кнопками по центру.
			 */
			align-self: stretch;
			position: sticky;
			top: 0;
			z-index: 10;
		}
		.card__toolbar {
			position: static;
		}
		/*
		 * Праворуч штовхає `margin-left`, а не `justify-content`: коли лівого
		 * набору немає (сторінка сама є галактикою), `space-between` притиснув
		 * би єдиний набір ЛІВОРУЧ, тобто саме туди, куди не треба.
		 */
		.card__toolbar:last-child {
			margin-left: auto;
		}
		.card__action {
			border: none;
			background: rgb(255 255 255 / 0.12);
			color: inherit;
		}
		/*
		 * На телефоні лишається сама ракета.
		 *
		 * Рядок кнопок тут стоїть у потоці над карткою завширшки з екран, і
		 * «Летіти до галактики випускників» з'їдало б його цілком — кнопці
		 * закриття не лишалося б місця. Назва нікуди не зникає: вона в
		 * `title` та `aria-label`, тобто і для підказки, і для диктора.
		 */
		.card__galaxy {
			width: 44px;
			padding: 0;
			border-radius: 50%;
		}
		.card__galaxy-text {
			display: none;
		}
	}
</style>
