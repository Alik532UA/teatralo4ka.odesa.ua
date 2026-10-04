<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Download } from 'lucide-svelte';
	import { BIG_EMBLEM_VARIANTS } from '$lib/data/brandAssets';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
</script>

<div class="big-grid" data-testid={`${testIdPrefix}-big-list`}>
	{#each BIG_EMBLEM_VARIANTS as item (item.id)}
		<div class="big-grid-card">
			<div class="big-grid-preview">
				<img
					src={asset(item.previewUrl)}
					alt={isEn ? item.nameEn : item.nameUk}
					width="260"
					height="130"
					class="grid-thumb"
					loading="lazy"
				/>
			</div>
			<div class="big-grid-meta">
				<strong class="grid-name">{isEn ? item.nameEn : item.nameUk}</strong>
				<span class="grid-res">{item.resolution} px • {item.year}</span>
				<div class="dl-buttons-row">
					{#if item.svgFile}
						<a
							href={asset(item.svgFile)}
							download={item.svgFile.split('/').pop()}
							class="dl-btn dl-btn--svg"
							data-testid={`${testIdPrefix}-dl-svg-${item.id}-btn`}
						>
							<Download size={13} aria-hidden="true" />
							<span>SVG</span>
						</a>
					{/if}
					<a
						href={asset(item.fullFile)}
						download={item.downloadName}
						class="dl-btn dl-btn--png"
						data-testid={`${testIdPrefix}-dl-png-${item.id}-btn`}
					>
						<Download size={13} aria-hidden="true" />
						<span>PNG ({item.resolution})</span>
					</a>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.big-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25rem;
	}

	@media (min-width: 640px) {
		.big-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.big-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.big-grid-card:nth-child(1) {
			grid-column: 1 / span 2;
			max-width: 320px;
			width: 100%;
			margin: 0 auto;
		}

		.big-grid-card:nth-child(2) {
			grid-column: 3 / span 2;
			max-width: 320px;
			width: 100%;
			margin: 0 auto;
		}
	}

	.big-grid-card {
		border: 1px solid var(--color-border);
		border-radius: 14px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
	}

	.big-grid-preview {
		padding: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 16px 16px;
		border-bottom: 1px solid var(--color-border);
		min-height: 160px;
	}

	.grid-thumb {
		max-width: 100%;
		max-height: 130px;
		object-fit: contain;
	}

	.big-grid-meta {
		padding: 1rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.grid-name {
		font-size: 0.92rem;
		color: var(--text-title);
	}

	.grid-res {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.dl-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.48rem 0.85rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 700;
		text-decoration: none;
		transition: filter 0.15s ease, transform 0.15s ease;
		white-space: nowrap;
		width: fit-content;
	}

	.dl-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.dl-buttons-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}

	.dl-btn--png {
		background: var(--palette-blue);
		color: var(--palette-black);
	}

	.dl-btn--svg {
		background: rgba(0, 181, 236, 0.14);
		color: var(--accent-text);
		border: 1px solid rgba(0, 181, 236, 0.3);
	}
</style>
