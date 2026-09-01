<script lang="ts">
	import { t } from 'svelte-i18n';
	import { List, GraduationCap, Globe, Theater, Plus, Menu, X } from 'lucide-svelte';
	import { localizedPath, type Locale } from '$lib/i18n/routing';

	/**
	 * Керування сценою галактики: переліки й кнопка анкети.
	 *
	 * ## Навіщо окремо від сторінки
	 *
	 * Не заради розміру, хоч сторінка й стояла біля стелі. На телефоні ці п'ять
	 * кнопок ховаються за одну, і разом із ними в сторінку прийшли б власний стан
	 * «меню відкрите», медіазапит і два набори розкладки. Сторінка ж відповідає за
	 * інше — за адресу, картку й реєстр.
	 *
	 * ## Чому меню саме на телефоні
	 *
	 * Заміряно: п'ять кнопок у рядок потребують близько 620 пікселів. На 375
	 * вони переносяться у три ряди й з'їдають чверть екрана — тобто саму
	 * галактику, заради якої сторінка й існує. Тому нижче 640 лишається один
	 * значок, а рядок розкривається стовпчиком над ним.
	 *
	 * Показ і ховання — КЛАСАМИ, а не умовою в розмітці: інакше при зміні ширини
	 * кнопки перестворювалися б, і фокус із відкритого меню злітав би на початок
	 * сторінки.
	 */
	interface Props {
		/** Скільком випускникам є сторінка — число поруч із «Всі». */
		total: number;
		locale: Locale;
		onopenroster: () => void;
		onopenform: () => void;
	}

	let { total, locale, onopenroster, onopenform }: Props = $props();

	let menuOpen = $state(false);

	/** На телефоні перелік і анкета ховаються за один значок. */
	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	/**
	 * Натиснули щось у меню — меню згортається.
	 *
	 * Інакше після відкриття реєстру воно лишалося б розкритим за ним і
	 * визирало б з-під аркуша, коли той закриють.
	 */
	function pick(дія: () => void) {
		дія();
		menuOpen = false;
	}
</script>

<div class="stage__controls" class:stage__controls--open={menuOpen}>
	<!--
		Значок-перемикач: на широкому екрані його немає (CSS), на телефоні він
		єдине, що видно, доки меню згорнуте.
	-->
	<button
		type="button"
		class="stage__menu-btn"
		onclick={toggleMenu}
		aria-expanded={menuOpen}
		title={$t('galaxy.stageMenu', { default: 'Переліки' })}
		aria-label={$t('galaxy.stageMenu', { default: 'Переліки' })}
		data-testid="galaxy-stage-menu-btn"
	>
		{#if menuOpen}
			<X size={20} aria-hidden="true" />
		{:else}
			<Menu size={20} aria-hidden="true" />
		{/if}
	</button>

	<div class="stage__items">
		<button
			type="button"
			class="stage__roster-btn"
			onclick={() => pick(onopenroster)}
			data-testid="galaxy-open-roster-btn"
		>
			<List size={18} aria-hidden="true" />
			<span>{$t('galaxy.all')}</span>
			<span class="stage__total" data-testid="galaxy-roster-total-count">{total}</span>
		</button>

		<a
			class="stage__roster-btn stage__roster-btn--nav"
			href={localizedPath('/projects/galaxy-graduates/groups/', locale)}
			data-testid="galaxy-groups-link"
		>
			<GraduationCap size={18} aria-hidden="true" />
			<span>{$t('galaxy.groupsTitle')}</span>
		</a>

		<a
			class="stage__roster-btn stage__roster-btn--nav"
			href={localizedPath('/projects/galaxy-graduates/festivals/', locale)}
			data-testid="galaxy-festivals-link"
		>
			<Globe size={18} aria-hidden="true" />
			<span>{$t('galaxy.festivalsTitle')}</span>
		</a>

		<!--
			Вистави — третій перелік поруч із групами й фестивалями. Доти сторінки
			вистав існували, але дістатися до них можна було лише з чужої анкети чи
			репертуару групи: спільного входу не було, і адреса /plays/ віддавала 404.
		-->
		<a
			class="stage__roster-btn stage__roster-btn--nav"
			href={localizedPath('/projects/galaxy-graduates/plays/', locale)}
			data-testid="galaxy-plays-link"
		>
			<Theater size={18} aria-hidden="true" />
			<span>{$t('galaxy.playsTitle')}</span>
		</a>

		<button
			type="button"
			class="stage__add-btn"
			onclick={() => pick(onopenform)}
			title={$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}
			aria-label={$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}
			data-testid="galaxy-open-form-btn"
		>
			<Plus size={20} aria-hidden="true" />
		</button>
	</div>
</div>

<style>
	.stage__controls {
		position: absolute;
		z-index: 3;
		left: clamp(0.75rem, 2vw, 1.5rem);
		right: clamp(0.75rem, 2vw, 1.5rem);
		bottom: clamp(0.75rem, 2vh, 1.5rem);
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}

	.stage__items {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}

	/* На широкому екрані перемикача немає — усі кнопки й так у рядку. */
	.stage__menu-btn {
		display: none;
	}

	.stage__roster-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: 999px;
		background: rgb(5 10 31 / 0.72);
		color: var(--galaxy-text);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.stage__roster-btn:hover {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}

	.stage__add-btn {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid rgb(140 190 255 / 0.4);
		border-radius: 50%;
		background: rgb(5 10 31 / 0.72);
		color: #cfe4ff;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition:
			transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.stage__add-btn:hover {
		background: rgb(12 22 56 / 0.9);
		border-color: rgb(140 190 255 / 0.8);
		color: #fff;
		transform: rotate(90deg) scale(1.08);
	}

	.stage__add-btn:active {
		transform: rotate(90deg) scale(0.92);
	}

	.stage__total {
		opacity: 0.65;
		font-variant-numeric: tabular-nums;
	}

	/*
	 * Телефон: усе за одним значком.
	 *
	 * Межа 640 — не кругле число зі стелі: п'ять кнопок у рядок займають
	 * близько 620 пікселів, і нижче цього вони переносяться, з'їдаючи чверть
	 * екрана. Стовпчик відкривається ВГОРУ, бо сам рядок стоїть біля нижнього
	 * краю.
	 */
	@media (max-width: 640px) {
		.stage__menu-btn {
			display: grid;
			place-items: center;
			width: 44px;
			height: 44px;
			border: 1px solid rgb(255 255 255 / 0.22);
			border-radius: 999px;
			background: rgb(5 10 31 / 0.72);
			color: var(--galaxy-text);
			cursor: pointer;
			backdrop-filter: blur(8px);
		}

		.stage__items {
			display: none;
		}

		.stage__controls--open .stage__items {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			order: -1;
		}

		.stage__controls--open {
			flex-direction: column;
			align-items: flex-end;
		}

		/* У стовпчику підпис має вести за собою всю ширину плашки. */
		.stage__controls--open .stage__roster-btn {
			justify-content: flex-start;
			width: 100%;
		}
	}
</style>
