<script lang="ts">
	import { scrollbar } from '$lib/controllers/scrollbar.svelte';
	import { ui, type ScrollbarMode } from '$lib/controllers/ui.svelte';
	import { SCROLLBAR_MODES } from '$lib/config/scrollbarModes';
	import { t } from 'svelte-i18n';

	/**
	 * Меню на праву кнопку над смугою чи мінімапою.
	 *
	 * Живе в корені, а не всередині смуги, з двох причин: мінімапа має
	 * `overflow: hidden` і обрізала б його, а меню одне на всі режими — після
	 * перемикання компонент, який його відкрив, зникає разом із меню.
	 *
	 * Перелік варіантів спільний із випадайкою налаштувань і живе в
	 * `config/scrollbarModes.ts`: дві копії розійшлися б при додаванні режиму.
	 */

	/** Ширина й висота потрібні, щоб меню не вилазило за край екрана. */
	const WIDTH = 210;
	const ITEM_HEIGHT = 34;
	const PADDING = 12;

	const height = $derived(SCROLLBAR_MODES.length * ITEM_HEIGHT + PADDING * 2 + 24);

	/** Меню відкривається біля курсора, але цілком у межах вікна. */
	const position = $derived.by(() => {
		const { x, y } = scrollbar.menu;
		return {
			// Ліворуч від курсора: смуга притулена до правого краю, і меню
			// праворуч від неї просто не влізло б.
			left: Math.max(PADDING, x - WIDTH - 4),
			top: Math.min(Math.max(PADDING, y), window.innerHeight - height - PADDING)
		};
	});

	/** Смуга шириною в цю зону біля правого краю ловить праву кнопку. */
	const EDGE_PX = 20;

	/**
	 * Те саме меню для СТАНДАРТНОГО режиму.
	 *
	 * Нативну смугу малює браузер, і подій із неї сторінка не отримує: клік
	 * правою просто над нею дає системне меню, і змінити це неможливо.
	 *
	 * Прозорий елемент поверх неї — гірше рішення, ніж виглядає: він перекрив би
	 * саму смугу, і її стало б не можна ані тягнути, ані клацнути. Тому слухаємо
	 * подію на документі й дивимося на координату. Нічого не перекривається, а
	 * робоча зона — двадцять пікселів ЛІВОРУЧ від смуги.
	 *
	 * `clientWidth`, а не `innerWidth`: перший не включає нативну смугу, тож
	 * зона не залежить від її товщини в системі.
	 */
	function onDocumentContextMenu(e: MouseEvent) {
		if (scrollbar.active !== 'native') return;
		const edge = document.documentElement.clientWidth;
		if (e.clientX < edge - EDGE_PX || e.clientX > edge) return;
		e.preventDefault();
		scrollbar.openMenu(e.clientX, e.clientY);
	}

	function choose(mode: ScrollbarMode) {
		ui.setScrollbarMode(mode);
		scrollbar.closeMenu();
	}
</script>

<svelte:window oncontextmenu={onDocumentContextMenu} />

{#if scrollbar.menu.open}
	<!-- Тло: перехоплює будь-який натиск поза меню й закриває його. Права кнопка
	     теж закриває, інакше нативне меню з'явилося б поверх нашого. -->
	<div
		class="scrollbar-menu__backdrop"
		data-testid="scrollbar-menu-backdrop"
		role="presentation"
		onpointerdown={scrollbar.closeMenu}
		oncontextmenu={(e) => {
			e.preventDefault();
			scrollbar.closeMenu();
		}}
	></div>

	<div
		class="scrollbar-menu"
		style="left: {position.left}px; top: {position.top}px; width: {WIDTH}px;"
		role="menu"
		tabindex="-1"
		data-testid="scrollbar-context-menu"
		onkeydown={(e) => {
			if (e.key === 'Escape') scrollbar.closeMenu();
		}}
	>
		<span class="scrollbar-menu__title">{$t('settings.scrollbar')}</span>
		{#each SCROLLBAR_MODES as mode (mode.id)}
			<button
				type="button"
				class="scrollbar-menu__item"
				class:active={ui.scrollbarMode === mode.id}
				role="menuitemradio"
				aria-checked={ui.scrollbarMode === mode.id}
				onclick={() => choose(mode.id)}
				data-testid={`scrollbar-menu-${mode.id}-btn`}
			>
				{$t(mode.key)}
			</button>
		{/each}
	</div>
{/if}

<style>
	.scrollbar-menu__backdrop {
		position: fixed;
		inset: 0;
		/* Під меню, але над усім іншим — разом вони мусять бути нижче заставки. */
		z-index: 9500;
	}

	.scrollbar-menu {
		position: fixed;
		z-index: 9501;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.75rem;
		border-radius: var(--radius-lg);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
	}

	.scrollbar-menu__title {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-text);
		padding: 0 0.5rem 0.35rem;
	}

	.scrollbar-menu__item {
		padding: 0.45rem 0.75rem;
		border: none;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-main);
		text-align: left;
		transition: background 0.15s;
	}

	.scrollbar-menu__item:hover {
		background: color-mix(in srgb, var(--accent-primary), transparent 88%);
	}

	.scrollbar-menu__item.active {
		background: var(--accent-primary);
		color: var(--text-on-accent);
	}
</style>
