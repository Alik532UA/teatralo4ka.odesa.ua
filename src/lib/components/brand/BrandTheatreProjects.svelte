<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Download } from 'lucide-svelte';
	import { THEATRE_PROJECT_ASSETS } from '$lib/data/brandAssets';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
</script>

<div id="theatre-projects" class="sub-section" data-testid={`${testIdPrefix}-theatre-projects-section`}>
	<div class="sub-header">
		<div class="sub-title-group">
			<h3 class="sub-title">
				{isEn ? 'Theatre Projects: UArt & PRO.THEATRE' : 'Театральні проєкти: UArt та PRO.ТЕАТР'}
			</h3>
			<p class="sub-desc">
				{isEn
					? 'Official square and transparent cut-out logos of the Educational Theatre "UArt" and NGO "PRO.THEATRE" in light and dark editions.'
					: 'Офіційні квадратні та прозорі векторні логотипи Навчального театру «UArt» та ГО «PRO.ТЕАТР» у світлій та темній версіях.'}
			</p>
		</div>
	</div>

	<div class="projects-grid" data-testid={`${testIdPrefix}-theatre-projects-list`}>
		{#each THEATRE_PROJECT_ASSETS as item (item.id)}
			<div class="project-card" data-testid={`${testIdPrefix}-project-${item.id}-card`}>
				<div class="project-preview" data-testid={`${testIdPrefix}-preview-${item.id}-panel`}>
					<img
						src={asset(item.previewUrl)}
						alt={isEn ? item.nameEn : item.nameUk}
						width="200"
						height="200"
						class="project-img"
						class:project-img--transparent={item.id.includes('transparent')}
						loading="lazy"
						data-testid={`${testIdPrefix}-img-${item.id}`}
					/>
				</div>

				<div class="project-meta">
					<div class="meta-desc">
						<strong class="project-title">{isEn ? item.nameEn : item.nameUk}</strong>
						{#if item.descUk}
							<span class="project-desc">{isEn ? item.descEn : item.descUk}</span>
						{/if}
					</div>

					<div class="dl-buttons-row">
						{#each item.downloads as dl (dl.file)}
							<a
								href={asset(dl.file)}
								download={dl.downloadName}
								class="dl-btn"
								data-testid={`${testIdPrefix}-dl-${item.id}-btn`}
							>
								<Download size={13} aria-hidden="true" />
								{#if dl.label.includes('(')}
									{@const parts = dl.label.split('(')}
									<span>{parts[0]}<span class="btn-res">({parts[1]}</span></span>
								{:else}
									<span>{dl.label}</span>
								{/if}
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
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 1.25rem;
	}

	.sub-title-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.sub-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-title);
	}

	.sub-desc {
		margin: 0;
		font-size: 0.88rem;
		color: var(--text-muted);
		line-height: 1.45;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
		gap: 1.25rem;
	}

	.project-card {
		border: 1px solid var(--color-border);
		border-radius: 14px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		transition: border-color 0.15s ease;
	}

	.project-card:hover {
		border-color: var(--accent-text);
	}

	.project-preview {
		padding: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 16px 16px;
		border-bottom: 1px solid var(--color-border);
		min-height: 180px;
	}

	.project-img {
		max-width: 180px;
		max-height: 180px;
		width: 100%;
		height: auto;
		display: block;
		object-fit: contain;
		border-radius: 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.project-img--transparent {
		border-radius: 0;
		box-shadow: none;
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
		max-width: 210px;
	}

	.project-meta {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.85rem;
		flex: 1;
	}

	.meta-desc {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.project-title {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.35;
	}

	.project-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	.dl-buttons-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.dl-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.65rem;
		border-radius: 8px;
		font-size: 0.76rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.15s ease;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		color: var(--text-title);
	}

	.dl-btn:hover {
		border-color: var(--accent-text);
		color: var(--accent-text);
		background: rgba(0, 181, 236, 0.08);
	}

	.btn-res {
		font-size: 0.62rem;
		opacity: 0.75;
		margin-left: 0.15rem;
	}
</style>

