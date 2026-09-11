<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { Check, ClipboardPaste, Copy, GripVertical, RotateCcw, X } from 'lucide-svelte';
	import { ui } from '$lib/controllers/ui.svelte';
	import { currentColor, LAB_TOKENS, themeLab } from '$lib/services/themeLab.svelte';
	import ThemeLabFields from './ThemeLabFields.svelte';
	import ThemeLabMini from './ThemeLabMini.svelte';
	import { createWindowDrag } from '$lib/utils/windowDrag.svelte';

	/**
	 * Панель лабораторії кольорів. Навіщо вона взагалі — у докблоці
	 * `services/themeLab`; тут лише про те, як вона поводиться на екрані.
	 *
	 * ## Чому збоку й вузька, а не по центру
	 *
	 * Уся суть — бачити САЙТ, поки правиш колір. Модалка по центру закрила б рівно
	 * те, заради чого її відкрили. Тому смуга праворуч, а сторінка лишається
	 * видимою й робочою: по ній можна ходити, не закриваючи панель.
	 *
	 * Самі поля й вердикти живуть у `ThemeLabFields`: тут — ПОВЕДІНКА вікна
	 * (перетягування, згортання, збереження місця), там — вміст і арифметика
	 * над ним.
	 *
	 * ## Чому вікно рухається, а не стоїть праворуч
	 *
	 * Прохання автора, і причина видна з першого ж використання: смуга праворуч
	 * закриває саме той край сторінки, де в цьому проєкті стоять і перемикач
	 * вигляду планети, і кнопка «Галактика випускників», і половина карток. Що
	 * саме треба побачити, знає лише той, хто дивиться, — тож місце обирає він.
	 */

	/* Показані значення полів: або переписане дизайнером, або чинне з документа. */
	let показані = $state<Record<string, string>>({});
	let скопійовано = $state(false);
	let таймер: ReturnType<typeof setTimeout> | undefined;

	/** Перечитати поля з документа. Переписане читається назад як переписане:
	    інлайновий стиль на `html` сильніший за будь-яку тему, тож нічого не
	    губиться, а решта токенів оновлюється. */
	function перечитати() {
		const зчитані: Record<string, string> = {};
		for (const { name } of LAB_TOKENS) зчитані[name] = currentColor(name) || (показані[name] ?? '');
		показані = зчитані;
	}

	/*
	 * Читання документа — лише після монтування: `currentColor` міряє пробним
	 * елементом, а на сервері документа немає.
	 */
	onMount(() => {
		перечитати();
		return () => clearTimeout(таймер);
	});

	/**
	 * ЗМІНА ТЕМИ ПЕРЕЧИТУЄ ПОЛЯ.
	 *
	 * Без цього виходило те, що знайшов автор: перемкнув тему, а в лабораторії
	 * лишилися кольори попередньої, і єдиний спосіб їх оновити — змінити щось
	 * навмання, щоб розблокувати «Скинути», і скинути.
	 *
	 * `untrack` обов'язковий: усередині читається `показані`, і без нього ефект
	 * перезапускався б від власного запису. Залежність тут рівно одна — тема.
	 */
	$effect(() => {
		void ui.theme;
		untrack(() => перечитати());
	});

	/* Арифметика перетягування — у `utils/windowDrag`; тут лише те, куди класти. */
	const тяга = createWindowDrag({
		frame: (ручка) => ручка.closest('.lab'),
		onMove: (місце) => (themeLab.spot = місце),
		onEnd: () => themeLab.setSpot(themeLab.spot)
	});

	/**
	 * КЛАВІАТУРНИЙ ЕКВІВАЛЕНТ перетягування: перекинути на інший бік.
	 *
	 * Ручка — справжня кнопка, і не заради лінтера: тягнути можна лише мишею чи
	 * пальцем, тобто без цього вікно було б нерухоме для того, хто ходить
	 * клавіатурою. Двох кутів досить — уся задача в тому, щоб вікно не затуляло
	 * те, на що дивляться, а сторона тут вирішує все.
	 *
	 * Після справжнього перетягування натиск ігнорується: `pointerup` тягне за
	 * собою `click`, і без цього кожне перетягування закінчувалося б стрибком.
	 */
	function перекинути() {
		if (тяга.takeMoved()) return;
		const праворуч = (themeLab.spot?.x ?? window.innerWidth) > window.innerWidth / 2;
		themeLab.setSpot({ x: праворуч ? 8 : Math.max(8, window.innerWidth - 348), y: 8 });
	}

	/** Місце вікна: збережене або праворуч згори, як було до перетягування. */
	const розташування = $derived(
		themeLab.spot
			? `left: ${themeLab.spot.x}px; top: ${themeLab.spot.y}px;`
			: 'right: 0; top: 0;'
	);

	function змінити(token: string, значення: string) {
		показані = { ...показані, [token]: значення };
		themeLab.setColor(token, значення);
	}

	function скинути() {
		themeLab.reset();
		перечитати();
	}

	/**
	 * ВСТАВКА готового блоку — і запасне поле, коли буфер недоступний.
	 *
	 * Прохання автора: «скопіювати кольори можна, а ось знову їх вставити ні».
	 * Розбір самого розбору — у `themeLab.fromCss`.
	 *
	 * Читання буфера, на відміну від запису, браузер питає дозволом і в частині
	 * випадків відмовляє мовчки (інший контекст, Safari, налаштування). Тому
	 * відмова не з'їдає дію: замість неї відкривається поле, куди блок
	 * вставляють руками. Той самий прийом, що в звіті бета-тестування
	 * (`BETA-REPORT-FALLBACK`): інструмент не має права зникати разом із
	 * дозволом, якого він не контролює.
	 */
	let вставкаВручну = $state(false);
	let текстВставки = $state('');
	let взято = $state<number | null>(null);

	function застосуватиБлок(css: string) {
		const скільки = themeLab.fromCss(css);
		взято = скільки;
		clearTimeout(таймерВставки);
		таймерВставки = setTimeout(() => (взято = null), 2600);
		if (скільки > 0) {
			перечитати();
			вставкаВручну = false;
			текстВставки = '';
		}
	}

	let таймерВставки: ReturnType<typeof setTimeout>;

	async function вставити() {
		try {
			const css = await navigator.clipboard.readText();
			if (css.trim()) {
				застосуватиБлок(css);
				return;
			}
		} catch {
			// Дозволу немає — нижче відкриється поле.
		}
		вставкаВручну = true;
	}

	async function копіювати() {
		const css = themeLab.toCss(ui.theme);
		try {
			await navigator.clipboard.writeText(css);
		} catch {
			// Буфер може бути недоступний (немає дозволу, не той контекст) — тоді
			// лишається сам блок на екрані, і його можна виділити руками.
		}
		скопійовано = true;
		clearTimeout(таймер);
		таймер = setTimeout(() => (скопійовано = false), 1600);
	}
</script>

{#if themeLab.mode === 'mini'}
	<ThemeLabMini position={розташування} />
{:else}
<aside
	class="lab"
	class:lab--dragging={тяга.dragging}
	style={розташування}
	aria-label="Лабораторія кольорів"
	data-testid="theme-lab-panel"
>
	<header class="lab__head">
		<!--
			Ручка окремою кнопкою, а не всією шапкою: по-перше, тоді натиск на
			хрестик поруч не зрушував би вікно; по-друге, кнопка має клавіатурну
			дію — перекинути на інший бік, — і без неї вікно було б нерухоме для
			того, хто не користується мишею.
		-->
		<button
			type="button"
			class="lab__grip"
			onpointerdown={тяга.down}
			onpointermove={тяга.move}
			onpointerup={тяга.up}
			onpointercancel={тяга.up}
			onclick={перекинути}
			aria-label="Перемістити вікно: тягніть або натисніть, щоб перекинути на інший бік"
			data-testid="theme-lab-move-btn"
		>
			<GripVertical size={16} aria-hidden="true" />
		</button>
		<span class="lab__title">Кольори теми</span>
		<button
			type="button"
			class="lab__close close-btn"
			onclick={() => themeLab.setMode('mini')}
			aria-label="Згорнути лабораторію"
			data-testid="theme-lab-close-btn"
		>
			<X size={18} aria-hidden="true" />
		</button>
	</header>

	<!--
		Прокручується ВМІСТ, а не все вікно. Доти `overflow-y` стояв на самій
		лабораторії, і заголовок із хрестиком їхав угору разом із полями — тобто
		закрити вікно, догорнувши до низу, було нічим.
	-->
	<div class="lab__body">
	<p class="lab__hint">
		Правки видно лише вам і лише в цьому браузері. Сайт вони не міняють — готовий CSS
		віддає кнопка внизу.
	</p>

	<ThemeLabFields shown={показані} onchange={змінити} />

	<footer class="lab__foot">
		<button
			type="button"
			class="lab__btn lab__btn--main"
			onclick={копіювати}
			data-testid="theme-lab-copy-btn"
		>
			{#if скопійовано}
				<Check size={16} aria-hidden="true" /> Скопійовано
			{:else}
				<Copy size={16} aria-hidden="true" /> Скопіювати CSS
			{/if}
		</button>
		<button
			type="button"
			class="lab__btn"
			onclick={вставити}
			data-testid="theme-lab-paste-btn"
		>
			<ClipboardPaste size={16} aria-hidden="true" />
			{взято === null ? 'Вставити CSS' : взято > 0 ? `Взято ${взято}` : 'Кольорів не знайдено'}
		</button>
		<button
			type="button"
			class="lab__btn"
			onclick={скинути}
			disabled={themeLab.changedCount === 0}
			data-testid="theme-lab-reset-btn"
		>
			<RotateCcw size={16} aria-hidden="true" /> Скинути
			{themeLab.changedCount > 0 ? `(${themeLab.changedCount})` : ''}
		</button>
	</footer>

	{#if вставкаВручну}
		<!--
			Запасний шлях: буфер не дав прочитати себе, тож блок вставляють сюди.
			Поле з'являється лише в цьому разі — постійне поруч із кнопкою було б
			другим способом зробити те саме й питанням «а це для чого».
		-->
		<div class="lab__paste">
			<textarea
				class="lab__paste-area"
				rows="4"
				spellcheck="false"
				placeholder="Вставте сюди блок теми"
				bind:value={текстВставки}
				aria-label="Блок CSS для вставки"
				data-testid="theme-lab-paste-input"
			></textarea>
			<button
				type="button"
				class="lab__btn lab__btn--main"
				onclick={() => застосуватиБлок(текстВставки)}
				data-testid="theme-lab-paste-apply-btn"
			>
				Застосувати
			</button>
		</div>
	{/if}

	<pre class="lab__css" data-testid="theme-lab-css-text">{themeLab.toCss(ui.theme)}</pre>
	</div>
</aside>
{/if}

<style>
	.lab__paste {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}
	.lab__paste-area {
		width: 100%;
		resize: vertical;
		font-family: ui-monospace, monospace;
		font-size: 0.78rem;
		padding: 0.4rem 0.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-main);
		background: var(--bg-page);
		color: var(--text-main);
	}

	/*
	 * ВЛАСНІ КОЛЬОРИ, а не токени теми — єдиний випадок у проєкті, коли це
	 * правильно. Панель показує, як виглядають токени; якби вона сама була ними
	 * пофарбована, то міняла б вигляд разом із тим, що дизайнер править, і при
	 * невдалій парі ставала б нечитною рівно тоді, коли потрібна найбільше.
	 */
	.lab {
		position: fixed;
		z-index: 9000;
		width: min(340px, 92vw);
		/* Не `bottom: 0`: вікно рухається, і прибита нижня межа розтягувала б
		   його від будь-якої позиції до низу екрана. Висоту задає вміст, стеля —
		   екран, а зайве прокручується всередині. */
		max-height: min(92dvh, 780px);
		display: flex;
		flex-direction: column;
		padding: 0.85rem;
		/* `hidden`, бо прокрутка переїхала всередину, на `.lab__body`: інакше
		   було б дві стрічки — зовнішня їхала б разом із заголовком. */
		overflow: hidden;
		background: #0d1418;
		border: 1px solid #24343c;
		border-radius: 12px;
		color: #dfe9ee;
		font-family: ui-monospace, 'JetBrains Mono', monospace;
		font-size: 0.78rem;
		line-height: 1.45;
		box-shadow: 0 18px 44px rgb(0 0 0 / 0.45);
	}

	/* Поки тягнуть — не виділяти текст під пальцем і не гортати сторінку. */
	.lab--dragging {
		user-select: none;
	}

	.lab__head {
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid #1c2a31;
	}

	.lab__body {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.75rem;
		overflow-y: auto;
		/* Прокрутка спиняється тут і не «перекидається» на сторінку під вікном. */
		overscroll-behavior: contain;
	}

	.lab__title {
		margin-right: auto;
	}

	.lab__grip {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: none;
		color: #7d95a1;
		cursor: grab;
		/* `none`, а не `pan-y`: інакше браузер вважає рух пальцем прокруткою
		   сторінки й забирає його в себе на першому ж пікселі. */
		touch-action: none;
	}

	.lab__grip:hover,
	.lab__grip:focus-visible {
		background: #16232a;
		color: #dfe9ee;
	}

	.lab__grip:focus-visible {
		outline: 2px solid #4ecdf6;
		outline-offset: 1px;
	}

	.lab--dragging .lab__grip {
		cursor: grabbing;
	}

	.lab__hint {
		margin: 0;
		color: #8fa6b1;
	}

	.lab__foot {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.lab__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 34px;
		padding: 0 0.7rem;
		border: 1px solid #33454e;
		border-radius: 8px;
		background: #16232a;
		color: #dfe9ee;
		font: inherit;
		cursor: pointer;
	}

	.lab__btn--main {
		background: #1f5f7a;
		border-color: #2a7d9e;
		color: #fff;
	}

	.lab__btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/*
	 * `flex: none` обов'язковий: вікно — колонка з обмеженою висотою, і без цього
	 * останній елемент стискався до кількох пікселів разом із текстом усередині:
	 * у блоці було видно лише верхівку літер.
	 */
	.lab__css {
		flex: none;
		margin: 0;
		padding: 0.5rem;
		border: 1px solid #24343c;
		border-radius: 8px;
		background: #050a0d;
		color: #9fd7ee;
		font-size: 0.7rem;
		white-space: pre-wrap;
		overflow-x: auto;
	}
</style>
