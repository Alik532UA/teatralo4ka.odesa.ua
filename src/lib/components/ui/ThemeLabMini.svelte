<script lang="ts">
	import { Palette, X } from 'lucide-svelte';
	import { themeLab } from '$lib/services/themeLab.svelte';

	/**
	 * ЗГОРНУТА ЛАБОРАТОРІЯ — те, що видно, коли вікна немає.
	 *
	 * Окремим компонентом, а не гілкою всередині вікна: це два різні стани з
	 * різною роботою. У вікна — перетягування, поля, вердикти й збереження
	 * місця; тут — дві кнопки й нічого більше.
	 *
	 * ## Навіщо цей стан узагалі
	 *
	 * Хрестик у першій редакції ховав лабораторію ЦІЛКОМ, і повернути її можна
	 * було лише сімома натисканнями `D` — тобто на планшеті ніяк. Тепер хрестик
	 * згортає сюди, а прибирає зовсім друга кнопка.
	 *
	 * Число на кнопці — скільки токенів переписано. Воно тут не для краси:
	 * згорнута лабораторія й далі МІНЯЄ кольори сайту, і забути про це легко.
	 */
	interface Props {
		/** Те саме місце, де стояло вікно: розгортається туди, звідки згорнулося. */
		position: string;
	}

	let { position }: Props = $props();
</script>

<div class="mini" style={position} data-testid="theme-lab-mini-panel">
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
		<X size={14} aria-hidden="true" />
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
		gap: 1px;
		background: #24343c;
		border-radius: 999px;
		overflow: hidden;
		box-shadow: 0 10px 28px rgb(0 0 0 / 0.4);
		font-family: ui-monospace, 'JetBrains Mono', monospace;
		font-size: 0.76rem;
	}

	.mini__open,
	.mini__hide {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 36px;
		padding: 0 0.75rem;
		border: 0;
		background: #16232a;
		color: #dfe9ee;
		font: inherit;
		cursor: pointer;
	}

	.mini__hide {
		padding: 0 0.6rem;
	}

	.mini__open:hover,
	.mini__hide:hover,
	.mini__open:focus-visible,
	.mini__hide:focus-visible {
		background: #1f5f7a;
		color: #fff;
	}

	.mini__open:focus-visible,
	.mini__hide:focus-visible {
		outline: 2px solid #4ecdf6;
		outline-offset: -2px;
	}
</style>
