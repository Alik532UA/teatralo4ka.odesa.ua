<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Download } from 'lucide-svelte';
	import { EMBLEM_VARIANTS } from '$lib/data/brandAssets';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
</script>

<div id="crest" class="sub-section" data-testid={`${testIdPrefix}-emblem-section`}>
	<div class="sub-header">
		<div class="sub-title-group">
			<h3 class="sub-title">
				{isEn ? 'Crest' : 'Герб'}
			</h3>
		</div>
	</div>

	<div class="emblems-grid" data-testid={`${testIdPrefix}-emblems-list`}>
		{#each EMBLEM_VARIANTS as item (item.id)}
			<div class="emblem-card" data-testid={`${testIdPrefix}-item-${item.id}`}>
				<div class="preview-stage">
					<img
						src={asset(item.previewUrl)}
						alt={isEn ? item.nameEn : item.nameUk}
						width="800"
						height="484"
						class="emblem-img"
						loading="lazy"
						data-testid={`${testIdPrefix}-img-${item.id}`}
					/>
				</div>

				<div class="card-meta">
					<div class="meta-desc">
						<strong class="meta-title">
							{isEn ? item.nameEn : item.nameUk}
						</strong>
						{#if item.descUk}
							<span class="meta-subtitle">
								{isEn ? item.descEn : item.descUk}
							</span>
						{/if}
					</div>

					<div class="dl-buttons-row">
						{#each item.downloads as dl (dl.file)}
							<a
								href={asset(dl.file)}
								download={dl.downloadName}
								class="dl-btn"
								class:dl-btn--svg={dl.format === 'SVG'}
								class:dl-btn--png={dl.format === 'PNG'}
								data-testid={`${testIdPrefix}-dl-${dl.downloadName}-btn`}
							>
								<Download size={13} aria-hidden="true" />
								<span>{dl.label}</span>
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
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

	.emblems-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
		gap: 1.25rem;
	}

	.emblem-card {
		border: 1px solid var(--color-border);
		border-radius: 16px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
	}

	.preview-stage {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 16px 16px;
		border-bottom: 1px solid var(--color-border);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		min-height: 190px;
	}

	.emblem-img {
		max-width: min(260px, 100%);
		max-height: 150px;
		height: auto;
		display: block;
		object-fit: contain;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.04));
	}

	.card-meta {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1rem;
		flex: 1;
	}

	.meta-desc {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.meta-title {
		font-size: 1.02rem;
		font-weight: 800;
		color: var(--text-title);
	}

	.meta-subtitle {
		font-size: 0.82rem;
		line-height: 1.45;
		color: var(--text-muted);
	}

	.dl-buttons-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
	}

	.dl-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.8rem;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 700;
		text-decoration: none;
		transition: filter 0.15s ease, transform 0.15s ease;
		white-space: nowrap;
	}

	.dl-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
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
