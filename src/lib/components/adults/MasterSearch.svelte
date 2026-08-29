<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Search, X } from 'lucide-svelte';

	interface Props {
		value: string;
		onchange: (value: string) => void;
		/** Скільки людей лишилося після фільтра — показуємо лише коли шукають. */
		found?: number;
	}

	let { value, onchange, found }: Props = $props();
	const id = $props.id();
</script>

<div class="master-search">
	<label class="master-search__field" for="{id}-input">
		<Search size={18} aria-hidden="true" class="master-search__icon" />
		<span class="visually-hidden">{$t('galaxy.searchMasters')}</span>
		<input
			id="{id}-input"
			type="search"
			class="master-search__input"
			placeholder={$t('galaxy.searchMasters')}
			{value}
			oninput={(e) => onchange((e.currentTarget as HTMLInputElement).value)}
			data-testid="residents-adults-search-input"
		/>
		{#if value}
			<button
				type="button"
				class="master-search__clear"
				onclick={() => onchange('')}
				aria-label={$t('common.clear')}
				title={$t('common.clear')}
				data-testid="residents-adults-search-clear-btn"
			>
				<X size={16} aria-hidden="true" />
			</button>
		{/if}
	</label>

	{#if value}
		<!-- `aria-live`, бо результат змінюється без перезавантаження: без цього
		     людина з екранним читачем не дізналася б, що список став порожнім. -->
		<p class="master-search__count" aria-live="polite" data-testid="residents-adults-search-count-text">
			{#if found === 0}
				{$t('galaxy.searchNothing')}
			{:else}
				{$t('galaxy.searchFound')}: {found}
			{/if}
		</p>
	{/if}
</div>

<style>
	.master-search {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: min(280px, 100%);
	}

	.master-search__field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-main);
		border-radius: 999px;
		background: var(--bg-surface);
		color: var(--text-muted);
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.master-search__field:focus-within {
		border-color: var(--accent-primary);
		background: var(--bg-card);
	}

	.master-search__input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		color: var(--text-main);
		font: inherit;
		font-size: 0.95rem;
	}

	.master-search__input:focus {
		outline: none;
	}

	/* Власний хрестик замість системного: у Safari його немає зовсім, тож без
	   цього кнопка очищення була б лише в частині браузерів. */
	.master-search__input::-webkit-search-cancel-button {
		display: none;
	}

	.master-search__clear {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.master-search__clear:hover {
		color: var(--text-main);
		background: var(--bg-card);
	}

	.master-search__count {
		margin: 0;
		padding-left: 0.75rem;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
