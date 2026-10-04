<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { BRAND_AI_REMAKES, type BrandAiRemake } from '$lib/data/brandAiRemakes';
	import { Sparkles, X, Search } from 'lucide-svelte';
	import BrandAiModal from './BrandAiModal.svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-ai' }: Props = $props();

	const isEn = $derived($locale === 'en');
	type CategoryKey = 'all' | 'classic' | 'avant-garde' | 'expression' | 'digital';

	let activeCategory = $state<CategoryKey>('all');
	let searchQuery = $state('');
	let selectedItem = $state<BrandAiRemake | null>(null);

	const categories: { key: CategoryKey; uk: string; en: string }[] = [
		{ key: 'all', uk: 'Всі', en: 'All' },
		{ key: 'classic', uk: 'Класика', en: 'Classic' },
		{ key: 'avant-garde', uk: 'Авангард', en: 'Avant-garde' },
		{ key: 'expression', uk: 'Експресія', en: 'Expression' },
		{ key: 'digital', uk: 'Цифрові', en: 'Digital' }
	];

	const filteredItems = $derived(
		BRAND_AI_REMAKES.filter((it) => {
			if (activeCategory !== 'all' && it.category !== activeCategory) return false;
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase().trim();
			return (
				it.titleUk.toLowerCase().includes(q) ||
				it.titleEn.toLowerCase().includes(q) ||
				it.descUk.toLowerCase().includes(q) ||
				it.descEn.toLowerCase().includes(q) ||
				it.slug.toLowerCase().includes(q)
			);
		})
	);

	function navigateModal(direction: 'prev' | 'next') {
		if (!selectedItem) return;
		const list = filteredItems;
		const currIndex = list.findIndex((i) => i.slug === selectedItem?.slug);
		if (currIndex === -1) return;
		const nextIndex =
			direction === 'next' ? (currIndex + 1) % list.length : (currIndex - 1 + list.length) % list.length;
		selectedItem = list[nextIndex];
	}
</script>

<div class="brand-ai-card" data-testid={`${testIdPrefix}-card`}>
	<div class="section-heading">
		<div class="heading-row">
			<div>
				<span class="badge">
					<Sparkles size={12} aria-hidden="true" />
					<span>{isEn ? 'AI Art' : 'Експерименти'}</span>
				</span>
				<h2 class="section-title">
					{isEn ? 'AI Logo Stylizations' : 'Художні AI-стилізації логотипа'}
					<span class="count-badge">49</span>
				</h2>
			</div>
		</div>
		<p class="section-desc">
			{isEn
				? 'Artistic variations of the studio logo across world art movements: from Classicism and Baroque to Cubism, Pop Art, and cyber graphics.'
				: 'Серія художніх варіацій та стилізацій фірмового знака театру в ключових напрямах світового мистецтва — від класицизму й бароко до кубізму та сучасного диджитал-арту.'}
		</p>
	</div>

	<div class="controls-bar">
		<div class="filter-pills" role="tablist" aria-label="Фільтри категорій">
			{#each categories as cat (cat.key)}
				<button
					type="button"
					role="tab"
					aria-selected={activeCategory === cat.key}
					class="filter-pill"
					class:active={activeCategory === cat.key}
					onclick={() => (activeCategory = cat.key)}
					data-testid={`${testIdPrefix}-tab-${cat.key}`}
				>
					{isEn ? cat.en : cat.uk}
					<span class="pill-count">
						{cat.key === 'all' ? BRAND_AI_REMAKES.length : BRAND_AI_REMAKES.filter((i) => i.category === cat.key).length}
					</span>
				</button>
			{/each}
		</div>

		<div class="search-box">
			<Search size={14} class="search-icon" aria-hidden="true" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder={isEn ? 'Search style...' : 'Пошук стилю...'}
				class="search-input"
				aria-label={isEn ? 'Search style' : 'Пошук стилю'}
				data-testid={`${testIdPrefix}-search-input`}
			/>
			{#if searchQuery}
				<button
					type="button"
					class="search-clear"
					onclick={() => (searchQuery = '')}
					aria-label={isEn ? 'Clear search' : 'Очистити пошук'}
					data-testid={`${testIdPrefix}-search-clear-btn`}
				>
					<X size={12} aria-hidden="true" />
				</button>
			{/if}
		</div>
	</div>

	<div class="ai-grid" data-testid={`${testIdPrefix}-list`}>
		{#each filteredItems as item (item.slug)}
			<button
				type="button"
				class="ai-thumb-btn"
				onclick={() => (selectedItem = item)}
				aria-label={`${item.titleUk} (${item.titleEn})`}
				data-testid={`${testIdPrefix}-item-${item.slug}-btn`}
			>
				<img
					src={asset(item.src)}
					alt={`${item.titleUk} - AI logo remake`}
					width="560"
					height="560"
					loading="lazy"
					class="ai-thumb-img"
				/>
				<div class="ai-thumb-overlay">
					<span class="ai-thumb-name">{isEn ? item.titleEn : item.titleUk}</span>
				</div>
			</button>
		{/each}
	</div>

	{#if filteredItems.length === 0}
		<div class="no-results">
			<p>{isEn ? 'No styles found for your query' : 'За вашим запитом нічого не знайдено'}</p>
		</div>
	{/if}
</div>

{#if selectedItem}
	<BrandAiModal
		item={selectedItem}
		currentIndex={filteredItems.findIndex((i) => i.slug === selectedItem?.slug)}
		totalCount={filteredItems.length}
		onclose={() => (selectedItem = null)}
		onprev={() => navigateModal('prev')}
		onnext={() => navigateModal('next')}
		{testIdPrefix}
	/>
{/if}

<style>
	.brand-ai-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
		min-width: 0;
		max-width: 100%;
		box-sizing: border-box;
	}
	@media (max-width: 768px) {
		.brand-ai-card {
			background: transparent;
			border: none;
			border-radius: 0;
			padding: 0;
			box-shadow: none;
		}
	}
	.section-heading { margin-bottom: 1.5rem; }
	.heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.badge { display: inline-flex; align-items: center; gap: 0.35rem; background: var(--palette-red); color: #ffffff; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0.65rem; border-radius: 20px; }
	.section-title { margin: 0.5rem 0 0.25rem; font-size: clamp(1.4rem, 2.5vw, 1.8rem); font-weight: 800; color: var(--text-title); display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
	.count-badge { font-size: 0.95rem; font-weight: 700; background: var(--color-surface); border: 1px solid var(--color-border); padding: 0.15rem 0.55rem; border-radius: 12px; color: var(--accent-text); }
	.section-desc { margin: 0.5rem 0 0; font-size: 1rem; line-height: 1.6; color: var(--text-muted); max-width: 760px; }
	.controls-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); min-width: 0; }
	.filter-pills { display: flex; gap: 0.35rem; flex-wrap: wrap; min-width: 0; }
	.filter-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border-radius: 8px; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--text-main); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
	.filter-pill:hover { border-color: var(--accent-text); color: var(--accent-text); }
	.filter-pill.active { background: var(--accent-primary); color: var(--text-on-accent); border-color: var(--accent-primary); }
	.pill-count { font-size: 0.72rem; opacity: 0.8; }
	.search-box { position: relative; display: flex; align-items: center; min-width: 160px; max-width: 240px; flex: 1; }
	@media (max-width: 480px) { .search-box { min-width: 100%; max-width: 100%; } }
	:global(.search-box .search-icon) { position: absolute; left: 0.65rem; color: var(--text-muted); pointer-events: none; }
	.search-input { width: 100%; padding: 0.4rem 1.8rem 0.4rem 2rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--text-main); font-size: 0.82rem; }
	.search-clear { position: absolute; right: 0.5rem; background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.2rem; }
	.ai-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(84px, 100%), 1fr)); gap: 0.55rem; min-width: 0; }
	.ai-thumb-btn { position: relative; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); background: var(--color-surface); padding: 0; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; min-width: 0; }
	.ai-thumb-btn:hover, .ai-thumb-btn:focus-visible { transform: translateY(-2px) scale(1.03); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12); border-color: var(--accent-text); z-index: 1; }
	.ai-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.ai-thumb-overlay { position: absolute; inset: auto 0 0 0; background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.3) 70%, transparent 100%); padding: 0.7rem 0.35rem 0.3rem; pointer-events: none; opacity: 0.9; transition: opacity 0.15s ease; }
	.ai-thumb-btn:hover .ai-thumb-overlay { opacity: 1; }
	.ai-thumb-name { font-size: 0.68rem; font-weight: 700; color: #ffffff; display: block; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8); }
	.no-results { text-align: center; padding: 2rem 1rem; color: var(--text-muted); }
</style>
