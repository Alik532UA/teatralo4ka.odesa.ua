<script lang="ts">
	import { ARTICLE_CATEGORIES, getCategoryLabel } from '$lib/config/categories';
	import { CATEGORY_CUSTOM, CATEGORY_NONE } from '$lib/utils/articleForm';
	import { locale, t } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { placePanel } from '$lib/utils/dropdownPlace';

	/**
	 * Вибір категорії: без категорії / зі списку / власна двома мовами.
	 *
	 * Компонент віддає назовні лише те, що зберігається: обране значення і два
	 * поля власної назви. Складання їх у рядок для бази — не його справа, цим
	 * займається `formatCategory` у батька; тут немає жодного знання про
	 * роздільник `||`.
	 *
	 * `catDropdownOpen` навмисно лишився ЛОКАЛЬНИМ станом: батько ним не
	 * користувався ніде, крім цієї розмітки, і виносити його в пропи означало б
	 * зробити видимим те, що є суто внутрішнім.
	 */
	interface Props {
		/** Ключ категорії або службове значення CATEGORY_NONE / CATEGORY_CUSTOM. */
		selection: string;
		customUk: string;
		customEn: string;
		/** Префікс data-testid форми. */
		testPrefix: string;
	}

	let {
		selection = $bindable(),
		customUk = $bindable(),
		customEn = $bindable(),
		testPrefix
	}: Props = $props();

	let dropdownOpen = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let pos = $state({ left: 0, top: 0, minWidth: 0, maxWidth: 0, maxHeight: 320, above: false });

	/**
	 * Панель відкривається вниз, а коли там не влазить — угору.
	 *
	 * Раніше вона була `position: absolute` і завжди вниз: на статті, де блок
	 * категорії стоїть низько, останні пункти обрізалися кінцем сторінки й були
	 * недосяжні. Геометрія спільна з рештою випадайок і перевірена окремо —
	 * `utils/dropdownPlace`.
	 *
	 * `fixed`, а не `absolute`, ще й тому, що в адмінці панель ріже перша ж
	 * картка з `overflow`.
	 */
	function place() {
		if (!triggerEl) return;
		pos = placePanel(
			triggerEl.getBoundingClientRect(),
			{ width: window.innerWidth, height: window.innerHeight },
			{ minWidth: 260 }
		);
	}

	function toggle() {
		if (!dropdownOpen) place();
		dropdownOpen = !dropdownOpen;
	}

	// Поки відкрито, панель мусить триматися кнопки: `fixed` сама за сторінкою не
	// їде. `capture` — бо прокрутка часто йде у внутрішньому блоці, а не у вікні.
	$effect(() => {
		if (!dropdownOpen) return;
		const onMove = () => place();
		window.addEventListener('scroll', onMove, { passive: true, capture: true });
		window.addEventListener('resize', onMove);
		return () => {
			window.removeEventListener('scroll', onMove, { capture: true });
			window.removeEventListener('resize', onMove);
		};
	});

	const isFromList = $derived(selection !== CATEGORY_NONE && selection !== CATEGORY_CUSTOM);

	/** Підпис обраної зі списку категорії; для службових значень порожній. */
	function selectedLabel(): string {
		if (!isFromList || !selection) return '';
		return getCategoryLabel(selection, (get(locale) as 'uk' | 'en') || 'uk');
	}

	function choose(key: string) {
		selection = key;
		dropdownOpen = false;
	}
</script>

<div class="af-cat-group">
	<div class="mode-toggle-group af-cat-toggles">
		<!-- 1. Без категорії -->
		<button
			type="button"
			class="mode-btn"
			class:active={selection === CATEGORY_NONE}
			onclick={() => { selection = CATEGORY_NONE; dropdownOpen = false; }}
			data-testid="{testPrefix}-category-none-btn"
		>
			{$t('admin.editor.categoryNone')}
		</button>

		<!-- 2. Зі списку -->
		<div class="af-cat-choose-wrap">
			<button
				type="button"
				class="mode-btn af-cat-choose-btn"
				class:active={isFromList}
				bind:this={triggerEl}
				onclick={toggle}
				onkeydown={(e) => { if (e.key === 'Escape') dropdownOpen = false; }}
				aria-expanded={dropdownOpen}
				aria-haspopup="listbox"
				data-testid="{testPrefix}-category-select"
			>
				{#if isFromList && selectedLabel()}
					{selectedLabel()}
				{:else}
					{$t('admin.editor.categoryChoose')}
				{/if}
				<svg class="af-cat-chevron" class:open={dropdownOpen} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
			</button>
			{#if dropdownOpen}
				<!-- Тло: натиск поза панеллю закриває її. Раніше закрити можна було
				     лише повторним кліком по самій кнопці. -->
				<div
					class="af-cat-backdrop"
					role="presentation"
					onpointerdown={() => (dropdownOpen = false)}
				></div>
				<div
					class="af-cat-dropdown"
					style="left: {pos.left}px; top: {pos.top}px; min-width: {pos.minWidth}px; max-width: {pos.maxWidth}px; max-height: {pos.maxHeight}px;"
					role="listbox"
					data-testid="{testPrefix}-category-dropdown-menu"
				>
					{#each Object.entries(ARTICLE_CATEGORIES) as [key, labels] (key)}
						<button
							type="button"
							class="af-cat-option"
							class:selected={selection === key}
							onclick={() => choose(key)}
							role="option"
							aria-selected={selection === key}
							data-testid="{testPrefix}-category-option-{key}"
						>
							<span class="af-cat-option-uk">{labels.uk}</span>
							<span class="af-cat-option-en">{labels.en}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- 3. Власна, двома мовами -->
		<button
			type="button"
			class="mode-btn af-cat-custom-btn"
			class:active={selection === CATEGORY_CUSTOM}
			onclick={() => { selection = CATEGORY_CUSTOM; dropdownOpen = false; }}
			data-testid="{testPrefix}-category-custom-btn"
		>
			{$t('admin.editor.categoryCustom')}
		</button>
	</div>

	{#if selection === CATEGORY_CUSTOM}
		<div class="af-cat-custom-fields">
			<div class="af-cat-custom-field">
				<span class="af-cat-custom-lang">UA</span>
				<input
					type="text"
					bind:value={customUk}
					placeholder={$t('admin.editor.categoryCustomPlaceholderUk')}
					maxlength="24"
					class="form-input"
					data-testid="{testPrefix}-category-custom-uk-input"
				/>
			</div>
			<div class="af-cat-custom-field">
				<span class="af-cat-custom-lang">EN</span>
				<input
					type="text"
					bind:value={customEn}
					placeholder={$t('admin.editor.categoryCustomPlaceholderEn')}
					maxlength="24"
					class="form-input"
					data-testid="{testPrefix}-category-custom-en-input"
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	/*
	 * Скопійовано з ArticleForm ДОСЛІВНО.
	 *
	 * Svelte скоупить стилі по компоненту, тож правила батька на розмітку
	 * дочірнього не діють. Після винесення цього компонента три кнопки
	 * категорії втратили вигляд групи-перемикача і стали простим стовпчиком
	 * — саме це й помітив користувач.
	 *
	 * Глобалізувати не можна: у проєкті сім копій `.mode-*`, і вони
	 * ВІДРІЗНЯЮТЬСЯ (порівняйте padding тут і в admin/articles). Спільний
	 * файл змінив би вигляд решти сторінок. Дублювання лишається боргом,
	 * але точну копію видно й вона нічого не ламає.
	 */
	.mode-toggle-group {
		display: flex;
		background: var(--color-ice-blue);
		padding: 0.25rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 95, 174, 0.08);
		align-self: flex-start;
	}

	:global(.dark-theme) .mode-toggle-group {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.mode-btn {
		padding: 0.4rem 1.25rem;
		border: none;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-muted-text);
		transition: all 0.2s;
	}

	.mode-btn:hover:not(.active) {
		background: rgba(33, 150, 186, 0.08);
		color: var(--accent-primary);
	}

	.mode-btn.active {
		background: var(--bg-card);
		color: var(--accent-primary);
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	:global(.dark-theme) .mode-btn.active {
		background: var(--accent-primary);
		color: white;
	}

	.af-cat-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.af-cat-toggles {
		flex-wrap: wrap;
	}
	.af-cat-choose-wrap {
		position: relative;
	}
	.af-cat-choose-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.af-cat-chevron {
		transition: transform 0.2s;
		flex-shrink: 0;
	}
	.af-cat-chevron.open {
		transform: rotate(180deg);
	}
	.af-cat-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9400;
	}
	.af-cat-dropdown {
		/* fixed, а не absolute: положення й висоту рахує скрипт, і саме так панель
		   не ріже ані картка з overflow, ані кінець сторінки. */
		position: fixed;
		/* Ширина за вмістом у межах від `placePanel`: двомовні підписи інакше
		   обрізаються навіть за наявного місця. */
		width: max-content;
		overflow-y: auto;
		/* --bg-card, а не --theme-dynamic-card-bg: остання не визначена ніде в
		   проєкті, тож завжди спрацьовував запасний #fff — біла панель у темній
		   темі. Тут і далі вживаються токени тем, які справді існують. */
		background: var(--bg-card);
		border-radius: 16px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
		border: 1px solid var(--border-main);
		z-index: 9401;
		padding: 0.35rem;
		display: flex;
		flex-direction: column;
	}
	/* Межу тут не чіпаємо: --border-main уже темозалежна. Лишається лише
	   глибша тінь — на темному тлі слабка просто не видно. */
	:global(.dark-theme) .af-cat-dropdown {
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
	}
	.af-cat-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.55rem 1rem;
		border: none;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-main);
		transition: background 0.15s;
		text-align: left;
		width: 100%;
	}
	.af-cat-option:hover {
		background: color-mix(in srgb, var(--accent-primary), transparent 92%);
	}
	.af-cat-option.selected {
		background: color-mix(in srgb, var(--accent-primary), transparent 88%);
		color: var(--accent-primary);
	}
	/* Стискається спершу англійська підказка, і лише потім активна мова — див.
	   те саме пояснення в `ui/Select.svelte`. */
	.af-cat-option-uk {
		font-weight: 700;
		flex-shrink: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.af-cat-option-en {
		font-size: 0.78rem;
		opacity: 0.5;
		font-weight: 500;
		flex-shrink: 999;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.af-cat-custom-fields {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.af-cat-custom-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 180px;
	}
	.af-cat-custom-lang {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--color-muted-text);
		opacity: 0.6;
		min-width: 22px;
		text-align: center;
		flex-shrink: 0;
	}
	.af-cat-custom-field .form-input {
		flex: 1;
	}

</style>
