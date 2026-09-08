<script lang="ts">
	import { GripVertical, Palette, X } from 'lucide-svelte';
	import { themeLab } from '$lib/services/themeLab.svelte';
	import { createWindowDrag } from '$lib/utils/windowDrag.svelte';

	/**
	 * ЗГОРНУТА ЛАБОРАТОРІЯ — те, що видно, коли вікна немає.
	 *
	 * Окремим компонентом, а не гілкою всередині вікна: це два різні стани з
	 * різною роботою. У вікна — поля, вердикти й збереження; тут три кнопки.
	 *
	 * ## Навіщо цей стан узагалі
	 *
	 * Хрестик у першій редакції ховав лабораторію ЦІЛКОМ, і повернути її можна
	 * було лише сімома натисканнями `D` — тобто на планшеті ніяк. Тепер хрестик
	 * згортає сюди, а прибирає зовсім кнопка на самій пілюлі.
	 *
	 * ## Чому три кнопки, а не дві
	 *
	 * Автор написав: «натискаєш кнопку закрити — розгортається вікно». На
	 * зібраній статиці послідовність правильна, тож справа не в обробнику — а в
	 * розмірі й сусідстві. Хрестик був 33 × 36 px і стояв упритул до вдесятеро
	 * ширшої кнопки «Кольори»: промах на два пікселі відкривав вікно замість
	 * того, щоб прибрати пілюлю.
	 *
	 * Тому тепер: усі три кнопки не нижчі за ціль дотику 44 px (WCAG 2.2
	 * SC 2.5.8), між ними видима межа, а ліворуч з'явилася ручка — вона й
	 * відсуває хрестик від центру уваги, і робить пілюлю рухомою.
	 *
	 * ## Чому пілюля теж рухається
	 *
	 * Прохання автора, і причина та сама, що у вікна: вона стоїть поверх
	 * сторінки й може накрити саме те, на що дивляться. Арифметика спільна з
	 * вікном (`utils/windowDrag`), тож поведінка однакова — і тягнеться, і
	 * перекидається на інший бік натиском.
	 *
	 * Число на кнопці — скільки токенів переписано. Воно тут не для краси:
	 * згорнута лабораторія й далі МІНЯЄ кольори сайту, і забути про це легко.
	 */
	interface Props {
		/** Те саме місце, де стояло вікно: розгортається туди, звідки згорнулося. */
		position: string;
	}

	let { position }: Props = $props();

	const тяга = createWindowDrag({
		frame: (ручка) => ручка.closest('.mini'),
		onMove: (місце) => (themeLab.spot = місце),
		onEnd: () => themeLab.setSpot(themeLab.spot)
	});

	/** Після справжнього перетягування натиск ігнорується — інакше пілюля стрибала б. */
	function перекинути() {
		if (тяга.takeMoved()) return;
		const праворуч = (themeLab.spot?.x ?? window.innerWidth) > window.innerWidth / 2;
		themeLab.setSpot({ x: праворуч ? 8 : Math.max(8, window.innerWidth - 240), y: 8 });
	}
</script>

<div class="mini" class:mini--dragging={тяга.dragging} style={position} data-testid="theme-lab-mini-panel">
	<button
		type="button"
		class="mini__grip"
		onpointerdown={тяга.down}
		onpointermove={тяга.move}
		onpointerup={тяга.up}
		onpointercancel={тяга.up}
		onclick={перекинути}
		aria-label="Перемістити: тягніть або натисніть, щоб перекинути на інший бік"
		data-testid="theme-lab-mini-move-btn"
	>
		<GripVertical size={16} aria-hidden="true" />
	</button>
	<button
		type="button"
		class="mini__open"
		onclick={() => themeLab.setMode('open')}
		data-testid="theme-lab-expand-btn"
	>
		<Palette size={16} aria-hidden="true" />
		<span>Кольори{themeLab.changedCount > 0 ? ` (${themeLab.changedCount})` : ''}</span>
	</button>
	<button
		type="button"
		class="mini__hide close-btn"
		onclick={() => themeLab.setMode('hidden')}
		aria-label="Прибрати лабораторію"
		data-testid="theme-lab-hide-btn"
	>
		<X size={16} aria-hidden="true" />
	</button>
</div>

<style>
	/* Власні кольори, не токени теми: інакше кнопка зникала б рівно тоді, коли
	   дизайнер завів тему в нечитний стан і хоче її поправити. */
	.mini {
		position: fixed;
		z-index: 9000;
		display: flex;
		align-items: stretch;
		/* Проміжок у піксель на темнішому тлі — це і є видима межа між кнопками. */
		gap: 1px;
		background: #24343c;
		border-radius: 999px;
		overflow: hidden;
		box-shadow: 0 10px 28px rgb(0 0 0 / 0.4);
		font-family: ui-monospace, 'JetBrains Mono', monospace;
		font-size: 0.76rem;
	}

	.mini button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		/* 44 px — ціль дотику (WCAG 2.2 SC 2.5.8). Доти хрестик мав 36 і сусідив
		   з удесятеро ширшою кнопкою: промах відкривав вікно замість прибрати. */
		min-height: 44px;
		border: 0;
		background: #16232a;
		color: #dfe9ee;
		font: inherit;
		cursor: pointer;
	}

	.mini__grip {
		width: 34px;
		padding: 0;
		color: #7d95a1;
		cursor: grab;
		/* `none`, а не `pan-y`: інакше браузер вважає рух пальцем прокруткою
		   сторінки й забирає його собі на першому ж пікселі. */
		touch-action: none;
	}

	.mini--dragging .mini__grip {
		cursor: grabbing;
	}

	.mini__open {
		padding: 0 0.85rem;
	}

	.mini__hide {
		width: 46px;
		padding: 0;
	}

	.mini button:hover,
	.mini button:focus-visible {
		background: #1f5f7a;
		color: #fff;
	}

	.mini button:focus-visible {
		outline: 2px solid #4ecdf6;
		outline-offset: -2px;
	}
</style>
