<script lang="ts">
	import { ClipboardPaste, Save, Trash2 } from 'lucide-svelte';
	import { themeLab } from '$lib/services/themeLab.svelte';
	import { labPresets, MAX_PRESETS } from '$lib/services/themeLabPresets.svelte';

	/**
	 * ЗВІДКИ ВЗЯТИ ГОТОВИЙ НАБІР — два шляхи в одному місці.
	 *
	 * Вставка блоку (обмін із файлами тем) і власні набори (перебір усередині
	 * сеансу) відповідають на одне питання дизайнера: «поверни те, що вже
	 * було». Тому вони поруч, а не в різних кутах панелі.
	 *
	 * ## Чому окремий компонент
	 *
	 * Коли вставка була одна, місця їй вистачало в підвалі вікна — і саме так
	 * її й зробили. З появою наборів у цього кута з'явився свій шов:
	 * «бібліотека» проти «поведінка вікна». Попереднє рішення не було
	 * помилкою — воно було правильним для того складу.
	 */
	interface Props {
		/** Перечитати поля після заміни набору. */
		onapplied: () => void;
	}

	let { onapplied }: Props = $props();

	let вручну = $state(false);
	let текст = $state('');
	let взято = $state<number | null>(null);
	let ім_я = $state('');
	let таймер: ReturnType<typeof setTimeout>;

	function застосувати(css: string) {
		const скільки = themeLab.fromCss(css);
		взято = скільки;
		clearTimeout(таймер);
		таймер = setTimeout(() => (взято = null), 2600);
		if (скільки > 0) {
			onapplied();
			вручну = false;
			текст = '';
		}
	}

	/**
	 * Читання буфера браузер питає дозволом і часом відмовляє мовчки — на
	 * відміну від запису. Відмова не з'їдає дію: відкривається поле, куди блок
	 * вставляють руками (той самий прийом, що в звіті бета-тестування).
	 */
	async function вставити() {
		try {
			const css = await navigator.clipboard.readText();
			if (css.trim()) {
				застосувати(css);
				return;
			}
		} catch {
			/* дозволу немає — нижче відкриється поле */
		}
		вручну = true;
	}

	function зберегти() {
		if (labPresets.save(ім_я, themeLab.colors)) ім_я 	= '';
	}

	function завантажити(name: string) {
		const набір = labPresets.get(name);
		if (!набір) return;
		themeLab.replaceAll(набір.colors);
		onapplied();
	}
</script>

<section class="presets" aria-labelledby="lab-presets-title">
	<h3 id="lab-presets-title" class="presets__title">Набори</h3>

	<div class="presets__row">
		<input
			class="presets__name"
			type="text"
			placeholder="Назва набору"
			bind:value={ім_я}
			aria-label="Назва набору"
			data-testid="theme-lab-preset-name-input"
		/>
		<button
			type="button"
			class="presets__btn"
			onclick={зберегти}
			disabled={!ім_я.trim() || themeLab.changedCount === 0}
			title={labPresets.full ? `Місць лише ${MAX_PRESETS} — звільніть одне` : 'Записати поточні кольори'}
			data-testid="theme-lab-preset-save-btn"
		>
			<Save size={14} aria-hidden="true" /> Зберегти
		</button>
		<button
			type="button"
			class="presets__btn"
			onclick={вставити}
			data-testid="theme-lab-paste-btn"
		>
			<ClipboardPaste size={14} aria-hidden="true" />
			{взято === null ? 'Вставити CSS' : взято > 0 ? `Взято ${взято}` : 'Кольорів не знайдено'}
		</button>
	</div>

	{#if вручну}
		<div class="presets__paste">
			<textarea
				rows="4"
				spellcheck="false"
				placeholder="Вставте сюди блок теми"
				bind:value={текст}
				aria-label="Блок CSS для вставки"
				data-testid="theme-lab-paste-input"
			></textarea>
			<button
				type="button"
				class="presets__btn"
				onclick={() => застосувати(текст)}
				data-testid="theme-lab-paste-apply-btn"
			>
				Застосувати
			</button>
		</div>
	{/if}

	{#if labPresets.items.length}
		<ul class="presets__list" data-testid="theme-lab-presets-list">
			{#each labPresets.items as набір (набір.name)}
				<li class="presets__item">
					<button
						type="button"
						class="presets__load"
						onclick={() => завантажити(набір.name)}
						data-testid="theme-lab-preset-{набір.name}-load-btn"
					>
						{набір.name}
						<small>{Object.keys(набір.colors).length}</small>
					</button>
					<button
						type="button"
						class="presets__drop"
						onclick={() => labPresets.remove(набір.name)}
						aria-label="Прибрати набір {набір.name}"
						data-testid="theme-lab-preset-{набір.name}-remove-btn"
					>
						<Trash2 size={13} aria-hidden="true" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.presets {
		border-top: 1px solid var(--border-main);
		padding-top: 0.5rem;
		margin-bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.presets__title {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 700;
	}
	.presets__row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.presets__name {
		flex: 1 1 7rem;
		min-width: 0;
		padding: 0.25rem 0.4rem;
		border-radius: 6px;
		border: 1px solid var(--border-main);
		background: var(--bg-page);
		color: var(--text-main);
		font-size: 0.8rem;
	}
	.presets__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		border: 1px solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		font-size: 0.78rem;
		cursor: pointer;
	}
	.presets__btn:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.presets__paste {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.presets__paste textarea {
		width: 100%;
		resize: vertical;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		padding: 0.35rem 0.45rem;
		border-radius: 6px;
		border: 1px solid var(--border-main);
		background: var(--bg-page);
		color: var(--text-main);
	}
	.presets__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.presets__item {
		display: flex;
		gap: 0.25rem;
	}
	.presets__load {
		flex: 1;
		text-align: left;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.25rem 0.45rem;
		border-radius: 6px;
		border: 1px solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		font-size: 0.8rem;
		cursor: pointer;
	}
	.presets__load small {
		color: var(--text-muted);
	}
	.presets__drop {
		padding: 0.25rem 0.35rem;
		border-radius: 6px;
		border: 1px solid var(--border-main);
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}
	.presets__load:hover,
	.presets__drop:hover {
		border-color: var(--accent-primary);
	}
</style>
