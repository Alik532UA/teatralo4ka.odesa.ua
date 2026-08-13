<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { Search, X, FileText, Newspaper } from 'lucide-svelte';
	import { newsEntries, pageEntries } from '$lib/services/searchIndex';
	import { MIN_QUERY_LENGTH, searchEntries, type SearchEntry, type SearchHit } from '$lib/utils/siteSearch';

	/**
	 * Пошук по сайту накладкою.
	 *
	 * Уся логіка зіставлення й ранжування — у `utils/siteSearch`, і перевірена
	 * окремо. Тут лишилося малювання, клавіатура й одна річ, варта уваги:
	 * сторінки додаються ОДРАЗУ, а новини доїжджають, коли прийдуть із Firestore.
	 * Через це поле не блокується очікуванням мережі — по сторінках можна шукати
	 * з першого символу.
	 */

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	let query = $state('');
	let input = $state<HTMLInputElement | null>(null);
	/** Пункт під клавіатурним курсором. */
	let activeIndex = $state(0);
	/** Посилання результатів — щоб стрілки могли переносити фокус. */
	let hitLinks = $state.raw<(HTMLAnchorElement | null)[]>([]);
	let news = $state.raw<SearchEntry[]>([]);
	let newsLoading = $state(false);

	const lang = $derived(($locale === 'en' ? 'en' : 'uk') as 'uk' | 'en');

	/**
	 * Сторінки шукаються за всіма мовами сайту.
	 */
	const pages = $derived(pageEntries());
	const hits = $derived<SearchHit[]>(searchEntries([...pages, ...news], query, 20, lang));

	const tooShort = $derived(query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH);

	/** Фокус у поле одразу: накладку відкривають, щоб друкувати. */
	$effect(() => {
		if (open) input?.focus();
	});

	/** Новини — один запит на сеанс за всіма мовами, коли пошук відкрили. */
	$effect(() => {
		if (!open || news.length > 0 || newsLoading) return;
		newsLoading = true;
		newsEntries()
			.then((list) => (news = list))
			.finally(() => (newsLoading = false));
	});

	// Курсор повертається на початок, щойно змінився запит: інакше він указував би
	// на пункт, якого в новому списку вже немає.
	$effect(() => {
		// Явне читання створює залежність — це не мертвий вираз.
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		query;
		activeIndex = 0;
	});

	function close() {
		query = '';
		activeIndex = 0;
		onclose();
	}

	/**
	 * Стрілки переносять ФОКУС на посилання, а не малюють власний курсор.
	 *
	 * Результати — справжні `<a>`, тож Enter, середній клік і «копіювати адресу»
	 * працюють самі, без жодного коду. Через це ж тут немає `role="listbox"`:
	 * список посилань і listbox — різні речі, і читалка мусить сказати «посилання».
	 */
	function move(step: 1 | -1) {
		if (!hits.length) return;
		activeIndex = (activeIndex + step + hits.length) % hits.length;
		hitLinks[activeIndex]?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			move(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			move(-1);
		}
	}
</script>

{#if open}
	<div
		class="search__backdrop"
		role="presentation"
		onpointerdown={close}
		data-testid="search-backdrop"
	></div>

	<div
		class="search__panel"
		role="dialog"
		aria-modal="true"
		aria-label={$t('search.title')}
		data-testid="search-modal"
	>
		<div class="search__field">
			<Search size={18} aria-hidden="true" />
			<input
				type="search"
				class="search__input"
				bind:this={input}
				bind:value={query}
				onkeydown={onKeydown}
				placeholder={$t('search.placeholder')}
				aria-label={$t('search.placeholder')}
				aria-controls="search-results"
				autocomplete="off"
				data-testid="search-input"
			/>
			<button
				type="button"
				class="search__close"
				onclick={close}
				aria-label={$t('search.close')}
				data-testid="search-close-btn"
			>
				<X size={18} />
			</button>
		</div>

		<div class="search__results" id="search-results" data-testid="search-results-list">
			{#if tooShort}
				<p class="search__note" data-testid="search-too-short-status">
					{$t('search.tooShort', { values: { min: MIN_QUERY_LENGTH } })}
				</p>
			{:else if !query.trim()}
				<p class="search__note" data-testid="search-empty-status">{$t('search.hint')}</p>
			{:else if hits.length === 0}
				<p class="search__note" data-testid="search-no-results-status">
					{$t('search.nothing', { values: { query: query.trim() } })}
				</p>
			{:else}
				{#each hits as hit, i (hit.id)}
					<a
						class="search__hit"
						class:active={i === activeIndex}
						href={hit.href}
						bind:this={hitLinks[i]}
						onclick={close}
						onkeydown={onKeydown}
						onfocus={() => (activeIndex = i)}
						onpointerenter={() => (activeIndex = i)}
						data-testid="search-hit-{hit.kind}-link"
					>
						<span class="search__hit-icon" aria-hidden="true">
							{#if hit.kind === 'news'}<Newspaper size={15} />{:else}<FileText size={15} />{/if}
						</span>
						<span class="search__hit-body">
							<span class="search__hit-title">{hit.title}</span>
							{#if hit.snippet}<span class="search__hit-snippet">{hit.snippet}</span>{/if}
						</span>
						<span class="search__hit-kind">
							{hit.kind === 'news' ? $t('search.kindNews') : $t('search.kindPage')}
						</span>
					</a>
				{/each}
			{/if}

			<!-- Новини доїжджають окремо: сторінки шукаються, поки триває запит. -->
			{#if newsLoading && query.trim()}
				<p class="search__note search__note--quiet" data-testid="search-news-loading-status">
					{$t('search.loadingNews')}
				</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.search__backdrop {
		position: fixed;
		inset: 0;
		/* Нижче заставки (10000), вище решти. */
		z-index: 9600;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(2px);
	}

	.search__panel {
		position: fixed;
		z-index: 9601;
		top: calc(var(--header-height, 72px) + 12px);
		left: 50%;
		transform: translateX(-50%);
		width: min(640px, calc(100vw - 2rem));
		max-height: calc(100dvh - var(--header-height, 72px) - 3rem);
		display: flex;
		flex-direction: column;
		border-radius: 18px;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
		overflow: hidden;
	}

	.search__field {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.85rem 1rem;
		border-bottom: 1px solid var(--border-main);
		color: var(--accent-primary);
		flex-shrink: 0;
	}

	.search__input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		outline: none;
		font-family: inherit;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-main);
	}

	.search__input::-webkit-search-cancel-button,
	.search__input::-webkit-search-decoration,
	.search__input::-webkit-search-results-button,
	.search__input::-webkit-search-results-decoration {
		-webkit-appearance: none;
		appearance: none;
		display: none;
	}

	.search__input::placeholder {
		color: var(--color-muted-text);
		font-weight: 500;
	}

	.search__close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: none;
		color: var(--color-muted-text);
		cursor: pointer;
		flex-shrink: 0;
	}

	.search__close:hover {
		background: color-mix(in srgb, var(--accent-primary), transparent 90%);
		color: var(--accent-primary);
	}

	.search__results {
		overflow-y: auto;
		padding: 0.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.search__note {
		margin: 0;
		padding: 1.1rem 1rem;
		font-size: 0.88rem;
		color: var(--color-muted-text);
		text-align: center;
	}

	.search__note--quiet {
		padding: 0.5rem 1rem;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.search__hit {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: none;
		border-radius: 12px;
		background: none;
		color: var(--text-main);
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		flex-shrink: 0;
	}

	.search__hit.active {
		background: color-mix(in srgb, var(--accent-primary), transparent 90%);
	}

	.search__hit-icon {
		display: inline-flex;
		margin-top: 0.15rem;
		color: var(--accent-primary);
		opacity: 0.7;
		flex-shrink: 0;
	}

	.search__hit-body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		flex: 1;
		min-width: 0;
	}

	.search__hit-title {
		font-size: 0.92rem;
		font-weight: 700;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search__hit-snippet {
		font-size: 0.8rem;
		color: var(--color-muted-text);
		/* Два рядки — далі трикрапка: фрагмент допомагає зорієнтуватися, а не
		   заміняє саму сторінку. */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.search__hit-kind {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-muted-text);
		opacity: 0.6;
		flex-shrink: 0;
		margin-top: 0.2rem;
	}

	@media (max-width: 768px) {
		.search__panel {
			top: 0.75rem;
			width: calc(100vw - 1.5rem);
			max-height: calc(100dvh - 1.5rem);
		}
	}
</style>
