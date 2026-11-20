<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Search, X } from 'lucide-svelte';

	/**
	 * Поле пошуку зі лічильником знайденого й кнопкою очищення.
	 *
	 * ## Звідки взялося
	 *
	 * Було `adults/MasterSearch.svelte` — поле пошуку сторінки викладачів із
	 * зашитим написом і зашитими локаторами. Коли пошук попросили ще й у перелік
	 * груп, вибір став між третьою копією (на сторінці вистав пошук свій,
	 * інлайновий) і спільним компонентом. Копія тут дорога не розміткою, а
	 * дрібницями, яких у ній не видно: власний хрестик замість системного (у
	 * Safari того немає), `aria-live` на лічильнику (без нього читач із
	 * диктором не дізнається, що список спорожнів) і підпис для поля, якого око
	 * не бачить.
	 *
	 * ## Що параметризовано, а що ні
	 *
	 * Написи й локатори — параметри, бо вони про СТОРІНКУ. Порожній стан теж:
	 * «Нікого не знайдено» правда про людей і неправда про групи.
	 *
	 * `galaxy.searchFound` («Знайдено») лишився зашитим — він однаковий для
	 * будь-якої сутності, і параметр на нього був би параметром заради симетрії.
	 *
	 * ## Плейсхолдер як бігуща строка
	 *
	 * Довгі підказки («Пошук за іменем або предметом») в компактному інпуті
	 * обрізалися. Замість статичного зрізаного тексту підказка плавно й повільно
	 * рухається бігущою строкою (з паузою при hover/focus), поки поле порожнє.
	 */
	interface Props {
		value: string;
		onchange: (value: string) => void;
		/** Скільки записів лишилося після фільтра — показуємо лише коли шукають. */
		found?: number;
		/** Ключ i18n для напису в полі й для його підпису. */
		placeholderKey: string;
		/** Ключ i18n для «нічого не знайдено»: він залежить від сутності. */
		nothingKey: string;
		/** Префікс локаторів: `<префікс>-input`, `-clear-btn`, `-count-text`. */
		testid: string;
	}

	let { value, onchange, found, placeholderKey, nothingKey, testid }: Props = $props();
	const id = $props.id();
</script>

<div class="search-field">
	<label class="search-field__field" for="{id}-input">
		<Search size={18} aria-hidden="true" class="search-field__icon" />
		<span class="visually-hidden">{$t(placeholderKey)}</span>
		<div class="search-field__input-wrap">
			<input
				id="{id}-input"
				type="search"
				class="search-field__input"
				placeholder={$t(placeholderKey)}
				aria-label={$t(placeholderKey)}
				{value}
				oninput={(e) => onchange((e.currentTarget as HTMLInputElement).value)}
				data-testid="{testid}-input"
			/>
			{#if !value}
				<div class="search-field__ticker" aria-hidden="true">
					<div class="search-field__ticker-track">
						<span class="search-field__ticker-item">{$t(placeholderKey)}</span>
						<span class="search-field__ticker-item" aria-hidden="true">{$t(placeholderKey)}</span>
					</div>
				</div>
			{/if}
		</div>
		{#if value}
			<button
				type="button"
				class="search-field__clear"
				onclick={() => onchange('')}
				aria-label={$t('common.clear')}
				title={$t('common.clear')}
				data-testid="{testid}-clear-btn"
			>
				<X size={16} aria-hidden="true" />
			</button>
		{/if}
	</label>

	{#if value}
		<!-- `aria-live`, бо результат змінюється без перезавантаження: без цього
		     людина з екранним читачем не дізналася б, що список став порожнім. -->
		<p class="search-field__count" aria-live="polite" data-testid="{testid}-count-text">
			{#if found === 0}
				{$t(nothingKey)}
			{:else}
				{$t('galaxy.searchFound')}: {found}
			{/if}
		</p>
	{/if}
</div>

<style>
	.search-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: min(280px, 100%);
	}

	.search-field__field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: var(--hairline-width) solid var(--border-main);
		border-radius: 999px;
		background: var(--bg-surface);
		color: var(--text-muted);
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.search-field__field:focus-within {
		border-color: var(--accent-primary);
		background: var(--bg-card);
	}

	.search-field__input-wrap {
		position: relative;
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.search-field__input {
		width: 100%;
		min-width: 0;
		border: none;
		background: transparent;
		color: var(--text-main);
		font: inherit;
		font-size: 0.95rem;
		position: relative;
		z-index: 2;
	}

	.search-field__input::placeholder {
		color: transparent;
	}

	.search-field__input:focus {
		outline: none;
	}

	/* Власний хрестик замість системного: у Safari його немає зовсім, тож без
	   цього кнопка очищення була б лише в частині браузерів. */
	.search-field__input::-webkit-search-cancel-button {
		display: none;
	}

	.search-field__ticker {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		overflow: hidden;
		pointer-events: none;
		z-index: 1;
		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 6px,
			black calc(100% - 10px),
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 6px,
			black calc(100% - 10px),
			transparent 100%
		);
	}

	.search-field__ticker-track {
		display: flex;
		white-space: nowrap;
		width: max-content;
		will-change: transform;
		animation: search-ticker 18s linear infinite;
	}

	.search-field__field:hover .search-field__ticker-track,
	.search-field__field:focus-within .search-field__ticker-track {
		animation-play-state: paused;
	}

	.search-field__field:focus-within .search-field__ticker {
		opacity: 0.45;
	}

	.search-field__ticker-item {
		display: inline-block;
		padding-right: 3.5rem;
		color: var(--text-muted);
		font: inherit;
		font-size: 0.95rem;
		line-height: 1;
		white-space: nowrap;
	}

	@keyframes search-ticker {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.search-field__ticker-track {
			animation: none;
		}
	}

	.search-field__clear {
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

	.search-field__clear:hover {
		color: var(--text-main);
		background: var(--bg-card);
	}

	.search-field__count {
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
