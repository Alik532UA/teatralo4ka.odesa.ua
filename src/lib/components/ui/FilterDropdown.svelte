<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown } from 'lucide-svelte';
	import { containingBlockOffset, placePanel } from '$lib/utils/dropdownPlace';

	/**
	 * Каркас випадайного списку фільтра: кнопка, підкладка й панель.
	 *
	 * ## Навіщо окремо
	 *
	 * У фільтрах реєстру таких списків два — відділення й майстри курсів, — і
	 * доти кожен ніс свою копію одного й того самого: стан «відкрито», обчислення
	 * місця через `placePanel`, поправку на контейнер, підкладку на весь екран і
	 * панель. Копії розійшлися б там, де це найважче помітити: у розташуванні на
	 * вузькому екрані.
	 *
	 * Гейт `structure.test.ts` і показав це: із другим списком файл фільтрів
	 * перевалив стелю на 62 рядки, і майже всі вони були повтором.
	 *
	 * ## Що лишається СНАЙПЕТОМ
	 *
	 * Самі варіанти малює батько: у відділень це вкладені групи з іконками, у
	 * майстрів — простий перелік із лічильниками. Спільного в них лише
	 * оболонка, тож тільки вона тут.
	 *
	 * ## Чому поправка на контейнер потрібна
	 *
	 * Панель стоїть `position: fixed`, а такі координати рахуються від вікна лише
	 * доки жоден предок не створив свого контейнера (`transform`, `filter`,
	 * `contain`). Аркуш реєстру якраз виїжджає трансформацією, тому без поправки
	 * панель з'їжджала б на його зсув — та сама вада, що з підказкою імен.
	 */
	interface Props {
		/** Підпис на кнопці: що обрано зараз. */
		label: string;
		/** Початок `data-testid`: `<prefix>-filter-btn`, `<prefix>-dropdown-menu`. */
		testIdPrefix: string;
		/** Самі варіанти — їх малює батько. */
		options: Snippet;
	}

	let { label, testIdPrefix, options }: Props = $props();

	let open = $state(false);
	let trigger = $state<HTMLButtonElement | null>(null);
	let pos = $state({ left: 0, top: 0, minWidth: 0, maxWidth: 0, maxHeight: 420, above: false });
	let offset = $state({ x: 0, y: 0 });

	function place() {
		if (!trigger) return;
		offset = containingBlockOffset(trigger);
		const raw = placePanel(trigger.getBoundingClientRect(), {
			width: window.innerWidth,
			height: window.innerHeight
		});
		pos = { ...raw, left: raw.left - offset.x, top: raw.top - offset.y };
	}

	function toggle() {
		if (open) {
			open = false;
		} else {
			place();
			open = true;
		}
	}
</script>

<div class="multi-select">
	<button
		type="button"
		class="filter-trigger"
		class:open
		bind:this={trigger}
		onclick={toggle}
		aria-expanded={open}
		aria-haspopup="listbox"
		data-testid="{testIdPrefix}-filter-btn"
	>
		<span class="filter-trigger__label">{label}</span>
		<ChevronDown
			size={14}
			strokeWidth={2.5}
			class="filter-trigger__chevron {open ? 'open' : ''}"
			aria-hidden="true"
		/>
	</button>

	{#if open}
		<!--
			Підкладка ловить натискання ПОЗА списком. Її власні координати теж
			поправлені на контейнер: інакше вона накрила б не весь екран, а
			прямокутник десь посеред сторінки.
		-->
		<div
			class="filter-backdrop"
			role="presentation"
			style={offset.x !== 0 || offset.y !== 0
				? `left: -${offset.x}px; top: -${offset.y}px; width: 100vw; height: 100vh;`
				: ''}
			onpointerdown={() => (open = false)}
			oncontextmenu={(event) => {
				event.preventDefault();
				open = false;
			}}
		></div>

		<div
			class="filter-panel"
			style="left: {pos.left}px; top: {pos.top}px; min-width: {pos.minWidth}px; max-width: {pos.maxWidth}px; max-height: {pos.maxHeight}px;"
			role="listbox"
			aria-multiselectable="true"
			data-testid="{testIdPrefix}-dropdown-menu"
		>
			{@render options()}
		</div>
	{/if}
</div>

<style>
	.multi-select {
		position: relative;
		display: inline-flex;
	}

	.filter-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 0.85rem;
		border: 1px solid rgb(255 255 255 / 0.18);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.06);
		color: var(--galaxy-text, #eaf2ff);
		font-family: inherit;
		font-size: 0.86rem;
		font-weight: 600;
		cursor: pointer;
		outline: none;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}
	.filter-trigger:hover,
	.filter-trigger:focus-visible,
	.filter-trigger.open {
		border-color: rgb(140 190 255 / 0.6);
		background: rgb(255 255 255 / 0.12);
	}

	.filter-trigger__label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.filter-trigger__chevron) {
		flex-shrink: 0;
		opacity: 0.8;
		transition: transform 0.2s ease;
	}
	:global(.filter-trigger__chevron.open) {
		transform: rotate(180deg);
	}

	.filter-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9400;
	}

	.filter-panel {
		position: fixed;
		z-index: 9401;
		width: max-content;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.4rem;
		overflow-y: auto;
		border-radius: 16px;
		background: #0b1330;
		border: 1px solid rgba(255, 255, 255, 0.18);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
	}

	/*
	 * На вузькому екрані кнопка тягнеться на всю доступну ширину: у рядку
	 * фільтрів їх декілька, і фіксована ширина витискала б останню за край.
	 */
	@media (max-width: 640px) {
		.multi-select {
			flex: 1 1 9rem;
			min-width: 0;
		}
		.filter-trigger {
			width: 100%;
			min-width: 0;
		}
	}
</style>
