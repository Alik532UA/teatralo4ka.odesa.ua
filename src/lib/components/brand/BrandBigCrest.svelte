<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { SlidersHorizontal, Grid } from 'lucide-svelte';
	import BrandBigCrestCreator from './BrandBigCrestCreator.svelte';
	import BrandBigCrestGrid from './BrandBigCrestGrid.svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
	let showAllBigGrid = $state<boolean>(true);
</script>

<div id="crest-in-hands" class="sub-section" data-testid={`${testIdPrefix}-big-emblem-section`}>
	<div class="sub-header">
		<div class="sub-title-group">
			<h3 class="sub-title">
				{isEn ? 'Crest in Hands' : 'Герб у долоньках'}
			</h3>
		</div>

		<button
			type="button"
			class="view-mode-btn"
			onclick={() => (showAllBigGrid = !showAllBigGrid)}
			aria-pressed={showAllBigGrid}
			data-testid={`${testIdPrefix}-view-mode-toggle`}
		>
			{#if showAllBigGrid}
				<SlidersHorizontal size={14} aria-hidden="true" />
				<span>{isEn ? 'Interactive View' : 'Режим селектора'}</span>
			{:else}
				<Grid size={14} aria-hidden="true" />
				<span>{isEn ? 'Show All 14' : 'Показати всі 14'}</span>
			{/if}
		</button>
	</div>

	{#if !showAllBigGrid}
		<BrandBigCrestCreator {testIdPrefix} />
	{:else}
		<BrandBigCrestGrid {testIdPrefix} />
	{/if}
</div>

<style>
	.sub-section {
		margin-bottom: 2.5rem;
		padding-bottom: 2.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.sub-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.sub-title-group {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.sub-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-title);
	}

	.view-mode-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		border-radius: 8px;
		background: transparent;
		border: 1px solid var(--color-border);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-title);
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.view-mode-btn:hover {
		border-color: var(--accent-text);
		background: rgba(0, 181, 236, 0.05);
	}
</style>
