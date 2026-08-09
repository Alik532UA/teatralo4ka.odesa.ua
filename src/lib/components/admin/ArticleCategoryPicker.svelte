<script lang="ts">
	import { ARTICLE_CATEGORIES, getCategoryLabel } from '$lib/config/categories';
	import { CATEGORY_CUSTOM, CATEGORY_NONE } from '$lib/utils/articleForm';
	import { locale, t } from 'svelte-i18n';
	import { get } from 'svelte/store';

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
				onclick={() => { dropdownOpen = !dropdownOpen; }}
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
				<div class="af-cat-dropdown" role="listbox" data-testid="{testPrefix}-category-dropdown-menu">
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
	.af-cat-dropdown {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		min-width: 260px;
		max-height: 320px;
		overflow-y: auto;
		background: var(--theme-dynamic-card-bg, #fff);
		border-radius: 16px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
		border: 1px solid rgba(0, 0, 0, 0.08);
		z-index: 100;
		padding: 0.35rem;
		display: flex;
		flex-direction: column;
	}
	:global(.dark-theme) .af-cat-dropdown {
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
		border-color: rgba(255, 255, 255, 0.1);
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
		color: var(--color-dark-text);
		transition: background 0.15s;
		text-align: left;
		width: 100%;
	}
	.af-cat-option:hover {
		background: rgba(33, 150, 186, 0.08);
	}
	.af-cat-option.selected {
		background: rgba(33, 150, 186, 0.12);
		color: var(--accent-primary);
	}
	.af-cat-option-uk {
		font-weight: 700;
	}
	.af-cat-option-en {
		font-size: 0.78rem;
		opacity: 0.5;
		font-weight: 500;
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
