<script lang="ts">
	import { asset } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { Download } from 'lucide-svelte';
	import { AVATAR_ASSETS } from '$lib/data/brandAssets';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
</script>

<div id="avatars" class="sub-section" data-testid={`${testIdPrefix}-avatars-section`}>
	<div class="sub-header">
		<div class="sub-title-group">
			<h3 class="sub-title">
				{isEn ? 'Social Media Avatars (1200×1200)' : 'Аватарки для соцмереж (1200×1200)'}
			</h3>
		</div>
	</div>

	<div class="avatars-grid">
		{#each AVATAR_ASSETS as av (av.id)}
			<div class="avatar-card">
				<div class="avatar-preview">
					<img
						src={asset(av.previewUrl)}
						alt={isEn ? av.nameEn : av.nameUk}
						width="160"
						height="160"
						class="avatar-img"
						class:avatar-img--round={av.id === 'avatar-round'}
						loading="lazy"
					/>
				</div>
				<div class="avatar-meta">
					<strong class="avatar-title">{isEn ? av.nameEn : av.nameUk}</strong>
					<span class="avatar-desc">{isEn ? av.descEn : av.descUk}</span>

					{#each av.downloads as dl (dl.file)}
						<a
							href={asset(dl.file)}
							download={dl.downloadName}
							class="dl-btn dl-btn--png"
							data-testid={`${testIdPrefix}-dl-${av.id}-btn`}
						>
							<Download size={12} aria-hidden="true" />
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

	.avatars-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
		gap: 1.25rem;
	}

	@media (max-width: 900px) {
		.avatars-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.55rem;
		}

		.avatar-preview {
			padding: 0.75rem;
			min-height: 100px;
		}

		.avatar-img {
			max-width: 65px;
		}

		.avatar-meta {
			padding: 0.5rem 0.4rem;
			gap: 0.35rem;
		}

		.avatar-title {
			font-size: 0.78rem;
			line-height: 1.35;
			word-break: break-word;
		}

		.avatar-desc {
			display: none;
		}

		.dl-btn {
			padding: 0.24rem 0.36rem;
			font-size: 0.7rem;
			gap: 0.18rem;
			border-radius: 7px;
		}

		.btn-res {
			font-size: 0.5rem;
			letter-spacing: -0.03em;
		}
	}

	.avatar-card {
		border: 1px solid var(--color-border);
		border-radius: 14px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.avatar-preview {
		padding: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--checker-c1, #ffffff);
		background-image: repeating-conic-gradient(var(--checker-c2, #e5e7eb) 0% 25%, var(--checker-c1, #ffffff) 0% 50%);
		background-position: 0 0;
		background-size: 14px 14px;
		border-bottom: 1px solid var(--color-border);
		min-height: 150px;
	}

	.avatar-img {
		max-width: 100px;
		height: auto;
		object-fit: contain;
	}

	.avatar-img--round {
		border-radius: 50%;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
	}

	.avatar-meta {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.avatar-title {
		font-size: 0.95rem;
		color: var(--text-title);
	}

	.avatar-desc {
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.45;
		margin-bottom: 0.4rem;
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

	.btn-res {
		font-size: 0.72rem;
		font-weight: 500;
		opacity: 0.9;
	}

	.dl-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.dl-btn--png {
		background: var(--palette-blue);
		color: var(--palette-black);
	}
</style>
