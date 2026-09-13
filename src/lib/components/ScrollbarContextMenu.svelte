<script lang="ts">
	import { scrollbar } from '$lib/controllers/scrollbar.svelte';
	import { endless } from '$lib/controllers/endless.svelte';
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

	/**
	 * Ширина й висота потрібні, щоб меню не вилазило за край екрана.
	 *
	 * 260, а не 210: на 210 переносилися на два рядки і «Мінімапа мінімальна»,
	 * і «Доводка наведенням» поруч із тумблером. Підпис, розірваний надвоє в
	 * меню з чотирьох рядків, читається як два окремі пункти.
	 *
	 * Число заміряне, а не вгадане: обидва найдовші підписи беруть по 166 px
	 * (`measureText` у 600 13.6px e-Ukraine). Рядок із тумблером лишає під текст
	 * `WIDTH − 24` падінга панелі `− 44` тумблера `− 12` проміжку, тобто 180 px
	 * при 260 — чотирнадцять запасу. На 240 виходило 158, і бракувало восьми.
	 */
	const WIDTH = 260;
	const ITEM_HEIGHT = 34;
	const PADDING = 12;

	/**
	 * Чекбокс доводки показується, лише поки малює НАША смуга.
	 *
	 * Умова на `active`, а не на `ui.scrollbarMode`, і різниця не косметична
	 * (HOLD-SCROLL § 1.3): на сенсорному екрані й у вікні, вужчому за 1100 px
	 * під мінімапу, режим лишається `custom`/`minimap`, а малює нативна смуга.
	 * Написане на режимі показало б перемикач там, де наводити нема на що.
	 */
	const showHold = $derived(scrollbar.active !== 'native');

	/**
	 * Тумблер зациклення — за тим самим правилом, що чекбокс доводки вище:
	 * показуємо лише там, де вмикати справді є що.
	 *
	 * `endless.supported` — це десктоп із мишею і вікно від 1025 px, тобто
	 * ширина, з якої підвал стає `fixed` і перестає бути кінцем сторінки.
	 * Умова навмисно не згадує, що ми на головній: настройка зберігається на
	 * весь сайт, і перемикач, який зникає зі сторінки на сторінку, читався б як
	 * збій. Що вона стосується головної, каже сам підпис.
	 */
	const showEndless = $derived(endless.supported);

	/**
	 * Висота ВСЬОГО стека — обох панелей разом із проміжком, — і вона МІРЯЄТЬСЯ.
	 *
	 * Арифметика лишається тільки як значення до першого кадру: рядок — це
	 * падінг плюс лінійний бокс, а лінійний бокс залежить від шрифта теми, від
	 * того, чи переніс підпис, і від висоти тумблера. Поки панель була одна,
	 * похибка була дрібною; з другою панеллю, її падінгом і проміжком угадувати
	 * стало нічим. Помилка тут видно як меню, що звисає за нижній край екрана.
	 */
	let height = $state(SCROLLBAR_MODES.length * ITEM_HEIGHT + PADDING * 2 + 24);

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

	<!-- Стек двох ПАНЕЛЕЙ, а не одна панель із роздільником.
	     Перелік режимів — вибір одного з чотирьох; доводка — незалежна настройка.
	     Окремий контейнер каже це саме собою, без пояснень (SCROLLBAR § 7.4). -->
	<div
		class="scrollbar-menu-stack"
		bind:offsetHeight={height}
		style="left: {position.left}px; top: {position.top}px; width: {WIDTH}px;"
		onkeydown={(e) => {
			if (e.key === 'Escape') scrollbar.closeMenu();
		}}
		role="presentation"
	>
	<div
		class="scrollbar-menu"
		role="menu"
		tabindex="-1"
		data-testid="scrollbar-context-menu"
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

	{#if showHold || showEndless}
		<!-- Тумблер, а не галочка, і той самий, що в адмінці (`.switch-*` у
			 global.css): у проєкті вже є один вигляд «увімк/вимк», і другий
			 вигадувати нема підстав.

			 Нативний `<input type="checkbox">` під ним, а не кнопка з
			 `aria-checked`: це справжній елемент форми — фокус, пробіл, читалка
			 й `:disabled` дістаються задарма. Панель НЕ закривається на
			 перемиканні: зворотний зв'язок про стан — сам тумблер, і панель, що
			 зникла раніше, ніж він доїхав, лишає без відповіді на «то
			 ввімкнулося чи ні». -->
		<div class="scrollbar-menu scrollbar-menu--hold">
			{#if showHold}
				<!-- Пара назв `-label` + `-toggle` — та сама, що в рядках адмінки:
					 сам `input` прихований (0×0, opacity 0), тож натискати треба
					 підпис, а читати стан — з поля. -->
				<label class="switch-label scrollbar-hold__label" data-testid="scrollbar-hold-label">
					<span class="scrollbar-hold__text">{$t('settings.scrollbarHold')}</span>
					<input
						type="checkbox"
						class="switch-input"
						checked={ui.holdScroll}
						onchange={() => ui.setHoldScroll(!ui.holdScroll)}
						data-testid="scrollbar-hold-toggle"
					/>
					<span class="switch-slider"></span>
				</label>
			{/if}
			{#if showEndless}
				<label class="switch-label scrollbar-hold__label" data-testid="scrollbar-endless-label">
					<span class="scrollbar-hold__text">{$t('settings.scrollbarEndless')}</span>
					<input
						type="checkbox"
						class="switch-input"
						checked={ui.endlessScroll}
						onchange={() => ui.setEndlessScroll(!ui.endlessScroll)}
						data-testid="scrollbar-endless-toggle"
					/>
					<span class="switch-slider"></span>
				</label>
			{/if}
		</div>
	{/if}
	</div>
{/if}

<style>
	.scrollbar-menu__backdrop {
		position: fixed;
		inset: 0;
		/* Під меню, але над усім іншим — разом вони мусять бути нижче заставки. */
		z-index: 9500;
	}

	/* Позиціонується стек; панелі всередині — звичайний потік. */
	.scrollbar-menu-stack {
		position: fixed;
		z-index: 9501;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.scrollbar-menu {
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

	/* Друга панель: один рядок, тож вертикальний падінг менший за панель
	   переліку — інакше вона виглядала б порожньою коробкою навколо тумблера. */
	.scrollbar-menu--hold {
		padding: 0.5rem 0.75rem;
	}

	.scrollbar-hold__label {
		/* Підпис ліворуч, тумблер праворуч — як у рядках адмінки. */
		justify-content: space-between;
		width: 100%;
		gap: 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.scrollbar-hold__text {
		/* Переносити нема куди: панель завширшки з меню, і два рядки біля
		   тумблера читаються як два різні пункти. */
		min-width: 0;
	}

	/* Обведення на тумблері, а не на прихованому `input` (той 0×0 і не видно). */
	.scrollbar-hold__label:focus-within .switch-slider {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}
</style>
