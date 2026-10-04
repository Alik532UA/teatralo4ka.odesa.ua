<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Download } from 'lucide-svelte';
	import { SEPARATE_ELEMENTS } from '$lib/data/brandAssets';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');

	const gridElements = $derived(SEPARATE_ELEMENTS.filter((e) => e.id !== 'text-url'));
	const urlElement = $derived(SEPARATE_ELEMENTS.find((e) => e.id === 'text-url'));
</script>

<div id="elements" class="sub-section" data-testid={`${testIdPrefix}-separate-elements-section`}>
	<div class="sub-header">
		<div class="sub-title-group">
			<h3 class="sub-title">
				{isEn ? 'Isolated Graphic Elements' : 'Окремі елементи'}
			</h3>
		</div>
	</div>

	<!-- 4-column matrix: Row 1 = Color/Yellow, Row 2 = White, Row 3 = Outline -->
	<div class="elements-grid" data-testid={`${testIdPrefix}-elements-list`}>
		{#each gridElements as elem (elem.id)}
			<div class="element-card" data-testid={`${testIdPrefix}-item-${elem.id}`}>
				<div class="element-preview">
					<img
						src={asset(elem.previewUrl)}
						alt={isEn ? elem.nameEn : elem.nameUk}
						width="160"
						height="80"
						class="element-img"
						loading="lazy"
					/>
				</div>
				<div class="element-meta">
					<span class="element-name" title={isEn ? elem.nameEn : elem.nameUk}>
						{isEn ? elem.nameEn : elem.nameUk}
					</span>
					<div class="dl-buttons-row">
						{#each elem.downloads as dl (dl.file)}
							<a
								href={asset(dl.file)}
								download={dl.downloadName}
								class="dl-btn"
								class:dl-btn--svg={dl.format === 'SVG'}
								class:dl-btn--png={dl.format === 'PNG'}
								data-testid={`${testIdPrefix}-dl-${elem.id}-${dl.format}-btn`}
							>
								<Download size={12} aria-hidden="true" />
								<span>{dl.label}</span>
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Bottom Card: Фірмовий вигин напису URL -->
	{#if urlElement}
		<div class="url-card" data-testid={`${testIdPrefix}-item-${urlElement.id}`}>
			<div class="url-preview">
				<img
					src={asset(urlElement.previewUrl)}
					alt={isEn ? urlElement.nameEn : urlElement.nameUk}
					width="440"
					height="80"
					class="url-img"
					loading="lazy"
				/>
			</div>
			<div class="url-meta">
				<div class="url-desc-group">
					<strong class="url-title">
						{isEn ? urlElement.nameEn : urlElement.nameUk}
					</strong>
					{#if urlElement.descUk}
						<span class="url-sub">
							{isEn ? urlElement.descEn : urlElement.descUk}
						</span>
					{/if}
				</div>

				<div class="dl-buttons-row">
					{#each urlElement.downloads as dl (dl.file)}
						<a
							href={asset(dl.file)}
							download={dl.downloadName}
							class="dl-btn"
							class:dl-btn--svg={dl.format === 'SVG'}
							class:dl-btn--png={dl.format === 'PNG'}
							data-testid={`${testIdPrefix}-dl-${urlElement.id}-${dl.format}-btn`}
						>
							<Download size={13} aria-hidden="true" />
							<span>{dl.label}</span>
						</a>
					{/each}
				</div>
			</div>
		</div>
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

	.elements-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1.15rem;
		margin-bottom: 1.25rem;
	}

	@media (max-width: 992px) {
		.elements-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 520px) {
		.elements-grid {
			grid-template-columns: 1fr;
		}
	}

	.element-card {
		border: 1px solid var(--color-border);
		border-radius: 12px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
	}

	.element-preview {
		padding: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 14px 14px;
		border-bottom: 1px solid var(--color-border);
		min-height: 120px;
	}

	.element-img {
		max-width: 100%;
		max-height: 80px;
		object-fit: contain;
	}

	.element-meta {
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.element-name {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-title);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dl-buttons-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}

	.dl-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.38rem 0.7rem;
		border-radius: 7px;
		font-size: 0.78rem;
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

	/* URL Card */
	.url-card {
		border: 1px solid var(--color-border);
		border-radius: 14px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
	}

	.url-preview {
		padding: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 14px 14px;
		border-bottom: 1px solid var(--color-border);
		min-height: 90px;
	}

	.url-img {
		max-width: min(440px, 90%);
		height: auto;
		display: block;
		object-fit: contain;
	}

	.url-meta {
		padding: 1rem 1.25rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.url-desc-group {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.url-title {
		font-size: 0.95rem;
		color: var(--text-title);
	}

	.url-sub {
		font-size: 0.82rem;
		color: var(--text-muted);
	}
</style>
