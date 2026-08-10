<script lang="ts">
	import { tick } from 'svelte';
	import { placePanel } from '$lib/utils/dropdownPlace';

	/**
	 * Випадаючий список із власним виглядом і поведінкою нативного.
	 *
	 * Нативний `<select>` має правильний UX і посередній вигляд; попередня власна
	 * випадайка — навпаки. Дві речі, через які власна була гіршою, вирішені саме
	 * тут, і обидві помітні лише на краю екрана:
	 *
	 * 1. **Напрямок.** Панель відкривається вниз, а якщо там не влазить — угору.
	 *    Раніше вона просто обрізалася кінцем сторінки, і останні пункти були
	 *    недосяжні. Нативний список так не робить ніколи.
	 * 2. **Обрізання предком.** Панель `position: fixed`, а не `absolute`. У
	 *    `absolute` її ріже перший предок з `overflow`, а в адмінці такі картки
	 *    всюди — і побачити це можна лише на конкретній сторінці з конкретною
	 *    висотою.
	 *
	 * Клавіатура зроблена навмисно: заміна нативного елемента на `<div>`-и
	 * забирає її безкоштовно, і без цього блоку кожна така заміна була б
	 * погіршенням доступності, а не покращенням вигляду.
	 */

	export interface SelectOption {
		value: string;
		label: string;
		/** Друга мова або уточнення — праворуч, тьмяно. */
		hint?: string;
		disabled?: boolean;
	}

	interface Props {
		value: string;
		options: SelectOption[];
		disabled?: boolean;
		/** Що показати, коли жоден пункт не збігається зі значенням. */
		placeholder?: string;
		testId: string;
		ariaLabel?: string;
		/** Клас на кнопку — щоб вписатися в розміри наявних місць. */
		class?: string;
	}

	let {
		value = $bindable(),
		options,
		disabled = false,
		placeholder = '',
		testId,
		ariaLabel,
		class: className = ''
	}: Props = $props();

	let open = $state(false);
	let trigger = $state<HTMLButtonElement | null>(null);
	let panel = $state<HTMLElement | null>(null);
	/** Пункт під клавіатурним курсором. -1 — жодного. */
	let activeIndex = $state(-1);
	let pos = $state({ left: 0, top: 0, width: 0, maxHeight: 320, above: false });

	const selected = $derived(options.find((o) => o.value === value));
	const label = $derived(selected?.label ?? placeholder);

	/** Геометрія спільна з рештою випадайок і перевірена окремо. */
	function place() {
		if (!trigger) return;
		pos = placePanel(trigger.getBoundingClientRect(), {
			width: window.innerWidth,
			height: window.innerHeight
		});
	}

	async function openPanel() {
		if (disabled) return;
		place();
		open = true;
		activeIndex = options.findIndex((o) => o.value === value);
		await tick();
		scrollActiveIntoView();
	}

	function close(returnFocus = true) {
		open = false;
		activeIndex = -1;
		if (returnFocus) trigger?.focus();
	}

	function choose(option: SelectOption) {
		if (option.disabled) return;
		value = option.value;
		close();
	}

	function scrollActiveIntoView() {
		if (!panel || activeIndex < 0) return;
		const el = panel.children[activeIndex] as HTMLElement | undefined;
		el?.scrollIntoView({ block: 'nearest' });
	}

	/** Наступний доступний пункт у заданому напрямку; вимкнені пропускаються. */
	function move(step: 1 | -1) {
		if (!options.length) return;
		let i = activeIndex;
		for (let n = 0; n < options.length; n++) {
			i = (i + step + options.length) % options.length;
			if (!options[i].disabled) {
				activeIndex = i;
				scrollActiveIntoView();
				return;
			}
		}
	}

	function onTriggerKeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				openPanel();
			}
			return;
		}

		switch (e.key) {
			case 'Escape':
				e.preventDefault();
				close();
				break;
			case 'ArrowDown':
				e.preventDefault();
				move(1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				move(-1);
				break;
			case 'Home':
				e.preventDefault();
				activeIndex = -1;
				move(1);
				break;
			case 'End':
				e.preventDefault();
				activeIndex = 0;
				move(-1);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (activeIndex >= 0) choose(options[activeIndex]);
				break;
			case 'Tab':
				// Не перехоплюємо: Tab мусить іти далі по формі, лише закриваємо.
				close(false);
				break;
		}
	}

	/**
	 * Поки панель відкрита, вона мусить триматися кнопки.
	 *
	 * `position: fixed` не рухається разом зі сторінкою, тож без перерахунку
	 * панель «відклеїлася» б від кнопки при прокрутці. `capture: true` потрібен,
	 * бо прокрутка часто відбувається у внутрішньому блоці, а не у вікні.
	 */
	$effect(() => {
		if (!open) return;
		const onMove = () => place();
		window.addEventListener('scroll', onMove, { passive: true, capture: true });
		window.addEventListener('resize', onMove);
		return () => {
			window.removeEventListener('scroll', onMove, { capture: true });
			window.removeEventListener('resize', onMove);
		};
	});
</script>

<div class="sel-wrap">
	<button
		type="button"
		class="sel-trigger {className}"
		class:open
		{disabled}
		bind:this={trigger}
		onclick={() => (open ? close() : openPanel())}
		onkeydown={onTriggerKeydown}
		role="combobox"
		aria-expanded={open}
		aria-haspopup="listbox"
		aria-controls="{testId}-menu"
		aria-label={ariaLabel}
		aria-activedescendant={open && activeIndex >= 0 ? `${testId}-opt-${activeIndex}` : undefined}
		data-testid={testId}
	>
		<span class="sel-value" class:sel-value--empty={!selected}>{label}</span>
		<svg
			class="sel-chevron"
			class:open
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg
		>
	</button>
</div>

{#if open}
	<!-- Тло ловить будь-який натиск поза панеллю. Права кнопка теж закриває:
	     інакше поверх нашої панелі з'явилося б нативне меню. -->
	<div
		class="sel-backdrop"
		role="presentation"
		onpointerdown={() => close(false)}
		oncontextmenu={(e) => {
			e.preventDefault();
			close(false);
		}}
	></div>

	<div
		class="sel-panel"
		style="left: {pos.left}px; top: {pos.top}px; width: {pos.width}px; max-height: {pos.maxHeight}px;"
		role="listbox"
		id="{testId}-menu"
		bind:this={panel}
		data-testid="{testId}-menu"
	>
		{#each options as option, i (option.value)}
			<button
				type="button"
				class="sel-option"
				class:selected={option.value === value}
				class:active={i === activeIndex}
				disabled={option.disabled}
				id="{testId}-opt-{i}"
				role="option"
				aria-selected={option.value === value}
				onclick={() => choose(option)}
				onpointerenter={() => (activeIndex = i)}
				data-testid="{testId}-option-{option.value || 'empty'}"
			>
				<span class="sel-option-label">{option.label}</span>
				{#if option.hint}<span class="sel-option-hint">{option.hint}</span>{/if}
			</button>
		{/each}
	</div>
{/if}

<style>
	.sel-wrap {
		display: inline-flex;
		min-width: 0;
	}

	.sel-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.6rem 0.85rem;
		border: 2px solid var(--color-border);
		border-radius: 12px;
		background: var(--bg-card);
		color: var(--text-main);
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		text-align: left;
		transition:
			border-color 0.2s,
			background 0.2s;
	}

	.sel-trigger:hover:not(:disabled) {
		border-color: var(--accent-primary);
	}

	.sel-trigger.open {
		border-color: var(--accent-primary);
	}

	.sel-trigger:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}

	.sel-trigger:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.sel-value {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sel-value--empty {
		opacity: 0.6;
		font-weight: 500;
	}

	.sel-chevron {
		flex-shrink: 0;
		transition: transform 0.2s;
	}

	.sel-chevron.open {
		transform: rotate(180deg);
	}

	.sel-backdrop {
		position: fixed;
		inset: 0;
		/* Під панеллю, але над вмістом. Нижче заставки (10000) і меню смуги (9500). */
		z-index: 9400;
	}

	.sel-panel {
		position: fixed;
		z-index: 9401;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem;
		overflow-y: auto;
		border-radius: 16px;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
	}

	:global(.dark-theme) .sel-panel {
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
	}

	.sel-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 0.55rem 0.9rem;
		border: none;
		border-radius: 10px;
		background: none;
		color: var(--text-main);
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		flex-shrink: 0;
	}

	.sel-option.active {
		background: color-mix(in srgb, var(--accent-primary), transparent 92%);
	}

	.sel-option.selected {
		background: color-mix(in srgb, var(--accent-primary), transparent 88%);
		color: var(--accent-primary);
	}

	.sel-option:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: none;
	}

	.sel-option-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sel-option-hint {
		font-size: 0.78rem;
		font-weight: 500;
		opacity: 0.5;
		flex-shrink: 0;
	}
</style>
