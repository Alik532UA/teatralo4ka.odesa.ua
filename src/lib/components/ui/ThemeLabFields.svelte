<script lang="ts">
	import { LAB_PAIRS, LAB_TOKENS, pairPasses, pairRatio } from '$lib/services/themeLab.svelte';
	import { AA_NORMAL } from '$lib/utils/contrast';

	/**
	 * ЩО ПРАВЛЯТЬ і ЩО З ЦЬОГО ВИЙШЛО — тринадцять полів і вісім вердиктів.
	 *
	 * ## Чому окремо від вікна
	 *
	 * Не заради стелі рядків, хоч вона й показала шов: у вікні (`ThemeLab`) уся
	 * логіка ПОВЕДІНКИ — перетягування, згортання, збереження місця, — а тут
	 * жодної. Тут лише поля й арифметика над ними, і саме тому цей файл нічого
	 * не знає ні про режими, ні про сховище.
	 *
	 * ## Чому два поля на кожен токен
	 *
	 * `input[type=color]` дає системну піпетку — це те, чим дизайнер справді
	 * набирає колір, і на планшеті теж. Але вписати точний `#0F4C75` із макета в
	 * піпетці незручно, тож поруч текстове поле. Обидва пишуть в одне значення.
	 *
	 * ## Чому вердикт червоніє одразу
	 *
	 * Гейт контрасту в CI валить збірку, і дізнаватися про це через день —
	 * найдорожчий зі способів. Числа рахує та сама формула, що й гейт
	 * (`utils/contrast`), тож «зелено тут» і «зелено в CI» — це одне число.
	 */
	interface Props {
		/** Показані значення: переписане дизайнером або чинне з документа. */
		shown: Record<string, string>;
		onchange: (token: string, value: string) => void;
	}

	let { shown, onchange }: Props = $props();

	/** `#0f4c75` для піпетки: вона не приймає ні назв, ні `rgb()`. */
	const дляПіпетки = (значення: string) => (/^#[0-9a-f]{6}$/i.test(значення) ? значення : '#000000');
</script>

<ul class="tokens" data-testid="theme-lab-tokens-list">
	{#each LAB_TOKENS as токен (токен.name)}
		<li class="token">
			<label class="token__label" for="lab-{токен.name}">
				<code>{токен.name}</code>
				<small>{токен.role}</small>
			</label>
			<span class="token__inputs">
				<input
					id="lab-{токен.name}"
					class="token__pick"
					type="color"
					value={дляПіпетки(shown[токен.name] ?? '')}
					oninput={(e) => onchange(токен.name, e.currentTarget.value)}
					aria-label="{токен.name}: піпетка"
					data-testid="theme-lab-{токен.name.slice(2)}-input"
				/>
				<input
					class="token__hex"
					type="text"
					spellcheck="false"
					value={shown[токен.name] ?? ''}
					oninput={(e) => onchange(токен.name, e.currentTarget.value)}
					aria-label="{токен.name}: код кольору"
					data-testid="theme-lab-{токен.name.slice(2)}-hex-input"
				/>
			</span>
		</li>
	{/each}
</ul>

<section class="pairs" aria-labelledby="lab-pairs-title">
	<h3 id="lab-pairs-title" class="pairs__title">Контраст, поріг {AA_NORMAL}</h3>
	<ul data-testid="theme-lab-pairs-list">
		{#each LAB_PAIRS as пара (пара.fg + пара.bg)}
			{@const відношення = pairRatio(пара, shown)}
			{@const пройшло = pairPasses(пара, shown)}
			<li class="pair" class:pair--bad={пройшло === false}>
				<span class="pair__label">{пара.label}</span>
				<span
					class="pair__value"
					data-testid="theme-lab-{пара.fg.slice(2)}-on-{пара.bg.slice(2)}-value"
				>
					{відношення === null ? '—' : відношення.toFixed(2)}
				</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	/*
	 * ВЛАСНІ КОЛЬОРИ, а не токени теми — єдиний випадок у проєкті, коли це
	 * правильно. Панель показує, як виглядають токени; якби вона сама була ними
	 * пофарбована, то міняла б вигляд разом із тим, що дизайнер править, і при
	 * невдалій парі ставала б нечитною рівно тоді, коли потрібна найбільше.
	 */
	.tokens,
	.pairs ul {
		display: grid;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.token {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem;
	}

	.token__label {
		display: grid;
		min-width: 0;
	}

	.token__label code {
		color: #cfe3ec;
		font-size: 0.74rem;
	}

	.token__label small {
		color: #7d95a1;
		font-size: 0.66rem;
		line-height: 1.25;
	}

	.token__inputs {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.token__pick {
		width: 30px;
		height: 30px;
		padding: 0;
		border: 1px solid #33454e;
		border-radius: 6px;
		background: none;
		cursor: pointer;
	}

	.token__hex {
		/* 10ch, а не 8: «#0f4c75» — сім знаків, і у восьми вони обрізалися разом
		   із ґраткою. Заміряно на знімку: у полі стояло «#2b0b2». */
		width: 10ch;
		padding: 0.2rem 0.35rem;
		border: 1px solid #33454e;
		border-radius: 6px;
		background: #050a0d;
		color: #dfe9ee;
		font: inherit;
	}

	.token__pick:focus-visible,
	.token__hex:focus-visible {
		outline: 2px solid #4ecdf6;
		outline-offset: 1px;
	}

	.pairs__title {
		margin: 0.35rem 0 0.3rem;
		font-size: 0.74rem;
		font-weight: 600;
		color: #8fa6b1;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.pair {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		background: #121e24;
	}

	.pair__label {
		color: #a9bfc9;
		font-size: 0.7rem;
	}

	.pair__value {
		font-variant-numeric: tabular-nums;
		color: #7ee2a8;
	}

	/* Червоне — не прикраса: рівно ці пари й завалять гейт у CI. */
	.pair--bad {
		background: #2a1417;
	}

	.pair--bad .pair__value {
		color: #ff9a8c;
	}
</style>
