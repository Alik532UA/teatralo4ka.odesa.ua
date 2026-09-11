<script lang="ts">
	import { Pipette, Sparkles } from 'lucide-svelte';
	import { LAB_PAIRS, LAB_TOKENS, pairPasses, pairRatio, themeLab } from '$lib/services/themeLab.svelte';
	import { AA_NORMAL } from '$lib/utils/contrast';
	import { suggestShade } from '$lib/utils/themeAudit';

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

	/**
	 * ПАЛІТРА ВЖИТОГО: кожен колір теми — один раз, із переліком його ролей.
	 *
	 * Прохання автора: «при виборі кольору щоб можна було не лише свій, а і на
	 * вибір з тих, що в інших ячейках, якщо хочеться однаковий, щоб не
	 * запам'ятовувати». Саме так тема й будується: тло сторінки й тло підвалу
	 * часто одне, акцент кнопки й акцентний текст — теж, — і доти повторити
	 * колір можна було, лише переписавши його шістнадцятковий код руками.
	 *
	 * Ключ — значення в нижньому регістрі: `#FFF` і `#fff` це один колір, і два
	 * зразки поруч виглядали б як вибір, якого немає. Показаний при цьому
	 * перший написаний варіант — те, що дизайнер бачить у своєму ж полі.
	 *
	 * Підказка несе РОЛІ, а не назви токенів: «тло всієї сторінки, підвал»
	 * відповідає на питання «а це звідки», а `--bg-page, --bg-footer` лише
	 * повторює те, що й так написано поруч.
	 */
	const палітра = $derived.by(() => {
		/* Звичайний обʼєкт, а не `Map`: збірка тимчасова й перебудовується щоразу
		   заново, тож реактивна обгортка тут була б витратою без покупця — і саме
		   на це сварився б `svelte/prefer-svelte-reactivity`. */
		const зібране: Record<string, { значення: string; ролі: string[] }> = {};
		const порядок: string[] = [];
		for (const { name, role } of LAB_TOKENS) {
			const значення = (shown[name] ?? '').trim();
			if (!значення) continue;
			const ключ = значення.toLowerCase();
			if (зібране[ключ]) зібране[ключ].ролі.push(role);
			else {
				зібране[ключ] = { значення, ролі: [role] };
				порядок.push(ключ);
			}
		}
		return порядок.map((k) => зібране[k]);
	});

	/**
	 * Чи переписаний токен — і чим він був.
	 *
	 * Лічильник на кнопці скидання казав «сім», але не казав, ЯКІ сім і чим вони
	 * були, — а це перше питання, коли колір розлюбили. Знімок робиться при
	 * відкритті панелі (`themeLab.baseline`), тож «було» тут — це тема, а не
	 * попередній крок правки: історія кроків живе в скасуванні поруч.
	 */
	const змінено = (token: string) => Boolean(themeLab.colors[token]);
	const було = (token: string) => themeLab.baseline[token] ?? '';

	/**
	 * Піпетка з ЕКРАНА, а не з поля вибору кольору.
	 *
	 * `EyeDropper` дає взяти колір із будь-чого на екрані — з макета, відкритого
	 * поруч, зі скріншота, із сусідньої вкладки. Саме так дизайнер і приносить
	 * колір, і доти це означало переписати код очима.
	 *
	 * API є не скрізь (сьогодні Chromium), тож кнопки просто немає там, де його
	 * немає: обіцяна й неробоча кнопка гірша за відсутню.
	 */
	const піпеткаЄ = typeof window !== 'undefined' && 'EyeDropper' in window;

	async function зЕкрана(token: string) {
		if (!window.EyeDropper) return;
		try {
			const { sRGBHex } = await new window.EyeDropper().open();
			if (sRGBHex) onchange(token, sRGBHex);
		} catch {
			/* Скасували вибір клавішею Esc — це не помилка. */
		}
	}

	/** Палітра без власного кольору токена — інакше зразок нічого не змінював би. */
	const інші = (token: string) =>
		палітра.filter(
			(к) => к.значення.toLowerCase() !== (shown[token] ?? '').trim().toLowerCase()
		);
</script>

<ul class="tokens" data-testid="theme-lab-tokens-list">
	{#each LAB_TOKENS as токен (токен.name)}
		{@const чужі = інші(токен.name)}
		<li class="token">
			<label class="token__label" for="lab-{токен.name}">
				<code>
					{токен.name}
					{#if змінено(токен.name)}
						<!-- Крапка каже «переписано», підказка — чим було. -->
						<span
							class="token__dot"
							title="Було: {було(токен.name) || 'невідомо'}"
							data-testid="theme-lab-{токен.name.slice(2)}-changed-badge">•</span
						>
					{/if}
				</code>
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
				{#if піпеткаЄ}
					<button
						type="button"
						class="token__eyedrop"
						onclick={() => зЕкрана(токен.name)}
						aria-label="{токен.name}: узяти колір з екрана"
						title="Узяти колір з екрана"
						data-testid="theme-lab-{токен.name.slice(2)}-eyedrop-btn"
					>
						<Pipette size={13} aria-hidden="true" />
					</button>
				{/if}
			</span>

			<!--
				Кольори, вже вжиті в темі. Свій власний не показується: зразок, що
				нічого не міняє, читався б як несправний.
			-->
			{#if чужі.length}
				<span class="token__palette" data-testid="theme-lab-{токен.name.slice(2)}-palette-list">
					{#each чужі as колір (колір.значення)}
						<button
							type="button"
							class="token__swatch"
							style="background: {колір.значення}"
							title="{колір.значення} — {колір.ролі.join(', ')}"
							aria-label="{токен.name}: узяти {колір.значення} ({колір.ролі.join(', ')})"
							onclick={() => onchange(токен.name, колір.значення)}
							data-testid="theme-lab-{токен.name.slice(2)}-swatch-{колір.значення.replace(
								'#',
								''
							)}-btn"
						></button>
					{/each}
				</span>
			{/if}
		</li>
	{/each}
</ul>

<section class="pairs" aria-labelledby="lab-pairs-title">
	<h3 id="lab-pairs-title" class="pairs__title">Контраст, поріг {AA_NORMAL}</h3>
	<ul data-testid="theme-lab-pairs-list">
		{#each LAB_PAIRS as пара (пара.fg + пара.bg)}
			{@const відношення = pairRatio(пара, shown)}
			{@const пройшло = pairPasses(пара, shown)}
			{@const порада = пройшло === false ? suggestShade(shown[пара.fg] ?? '', shown[пара.bg] ?? '') : null}
			<li class="pair" class:pair--bad={пройшло === false}>
				<span class="pair__label">{пара.label}</span>
				<span
					class="pair__value"
					data-testid="theme-lab-{пара.fg.slice(2)}-on-{пара.bg.slice(2)}-value"
				>
					{відношення === null ? '—' : відношення.toFixed(2)}
				</span>
				<!--
					Коли пара не проходить, панель доти лише повідомляла про це й
					замовкала — а дизайнер сидів і вгадував, наскільки темнішати.
					Тут пропонується НАЙБЛИЖЧИЙ відтінок того самого кольору, який
					уже проходить: рухається текст, а не тло (розбір — у
					`utils/themeAudit`).
				-->
				{#if порада}
					<button
						type="button"
						class="pair__fix"
						style="--fix: {порада.value}"
						onclick={() => onchange(пара.fg, порада.value)}
						title="Зробити {порада.direction === 'darker' ? 'темнішим' : 'світлішим'}: {порада.value} — вийде {порада.ratio.toFixed(2)}"
						data-testid="theme-lab-{пара.fg.slice(2)}-on-{пара.bg.slice(2)}-fix-btn"
					>
						<Sparkles size={12} aria-hidden="true" />
						{порада.value}
					</button>
				{/if}
			</li>
		{/each}
	</ul>
</section>

<style>
	.token__dot {
		color: var(--accent-text);
		font-size: 1.1em;
		line-height: 1;
		cursor: help;
	}
	.token__eyedrop {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.25rem;
		border-radius: 5px;
		border: 1px solid var(--border-main);
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}
	.token__eyedrop:hover {
		color: var(--accent-text);
		border-color: var(--accent-primary);
	}
	.pair__fix {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		margin-left: 0.3rem;
		padding: 0.05rem 0.3rem;
		border-radius: 5px;
		border: 1px solid var(--fix);
		background: none;
		color: var(--text-main);
		font-family: ui-monospace, monospace;
		font-size: 0.72rem;
		cursor: pointer;
	}
	.pair__fix:hover {
		background: var(--fix);
	}

	/*
	 * Палітра стоїть ПІД полями, на всю ширину рядка: збоку вона з'їдала б
	 * місце в текстового поля, а саме туди вписують код із макета.
	 */
	.token__palette {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		margin-top: 2px;
	}
	.token__swatch {
		width: 16px;
		height: 16px;
		padding: 0;
		border-radius: 4px;
		border: 1px solid var(--border-main);
		cursor: pointer;
		transition: transform 0.15s;
	}
	.token__swatch:hover {
		transform: scale(1.18);
	}
	.token__swatch:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}

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
