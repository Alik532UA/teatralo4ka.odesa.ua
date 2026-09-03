<script lang="ts">
	import { Users } from 'lucide-svelte';

	/**
	 * Рядок області показу: «Показано N з M» і одне натискання, щоб побачити решту.
	 *
	 * ## Навіщо він узагалі
	 *
	 * Сторінка типово показує НЕ ВСЕ: у виставах — лише ті, чий склад відомий
	 * (255 із 733), у групах — лише випущені. Без цього рядка сторінка
	 * суперечила б власному заголовку, де стоїть повне число, і читач вважав би
	 * побачене всім, що є.
	 *
	 * ## Чому підписи приходять ГОТОВИМИ рядками
	 *
	 * Компонент був `PlaysScope` і знав про вистави все: свої ключі i18n, свої
	 * локатори, свою іконку. Коли той самий рядок знадобився переліку груп,
	 * вибір був між другою копією й параметрами. Ключі параметризувати не варто —
	 * їх тут четверо, і половина з підстановкою чисел; тому компонент став чисто
	 * подавальним: сторінка каже, ЩО написати, а він — де і як.
	 *
	 * Заодно це знімає з нього знання про семантику: «тільки з відомим складом» і
	 * «тільки випущені» — різні думки, і зводити їх до одного прапорця з двома
	 * значеннями означало б вигадати спільність, якої немає.
	 *
	 * ## Підпис кнопки — це ДІЯ, а не стан
	 *
	 * Тому `aria-pressed` тут не годиться: текст щоразу називає, що станеться
	 * після натискання. Пояснення, за яким правилом звужено, живе в `title` —
	 * воно довге, і в рядку керування стояло б замість самого керування.
	 */
	interface Props {
		/** Готовий підпис: «Показано 274 з 692» або «Показано всі 692». */
		count: string;
		/** Готовий підпис кнопки — ДІЯ: «Показати всі» / «Тільки випущені». */
		action: string;
		/** Довге пояснення правила звуження. Немає — кнопка без `title`. */
		hint?: string;
		/**
		 * Іконка перед підписом кнопки. Потрібна лише коли перелік звужують назад.
		 *
		 * `typeof Users` — та сама форма типу, що в `MasterViewToggle`: іконки
		 * lucide не збігаються з голим `Component<{}>`, бо приймають `size`.
		 */
		icon?: typeof Users | null;
		onclick: () => void;
		/** Локатори: `<префікс>-toolbar`, `-count`, `-btn`. */
		testIdPrefix: string;
	}

	let { count, action, hint, icon = null, onclick, testIdPrefix }: Props = $props();
	const Icon = $derived(icon);
</script>

<div class="scope" data-testid="{testIdPrefix}-toolbar">
	<span class="scope__count" data-testid="{testIdPrefix}-count">{count}</span>

	<button
		type="button"
		class="scope__btn"
		title={hint}
		{onclick}
		data-testid="{testIdPrefix}-btn"
	>
		{#if Icon}<Icon size={14} aria-hidden="true" />{/if}
		{action}
	</button>
</div>

<style>
	.scope {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.scope__count {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.scope__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.7rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--transition-base);
	}
	.scope__btn:hover {
		border-color: var(--accent-primary);
	}
</style>
