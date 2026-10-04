<script lang="ts">
	import { Check, Copy } from 'lucide-svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-colors' }: Props = $props();

	let copiedColor = $state<string | null>(null);

	const colors = [
		{
			hex: '#ffed00',
			rgb: '255, 237, 0',
			cssVar: '--palette-yellow',
			textColor: '#1d1d1d'
		},
		{
			hex: '#00b5ec',
			rgb: '0, 181, 236',
			cssVar: '--palette-blue',
			textColor: '#1d1d1d'
		},
		{
			hex: '#e20413',
			rgb: '226, 4, 19',
			cssVar: '--palette-red',
			textColor: '#ffffff'
		},
		{
			hex: '#f9b31d',
			rgb: '249, 179, 29',
			cssVar: '--palette-orange',
			textColor: '#1d1d1d'
		},
		{
			hex: '#1d1d1d',
			rgb: '29, 29, 29',
			cssVar: '--palette-black',
			textColor: '#ffffff'
		}
	];

	async function copyToClipboard(val: string) {
		try {
			await navigator.clipboard.writeText(val);
			copiedColor = val;
			setTimeout(() => {
				if (copiedColor === val) copiedColor = null;
			}, 2000);
		} catch {
			// fallback
		}
	}
</script>

<div class="brand-colors-card" data-testid={`${testIdPrefix}-card`}>
	<div class="section-heading">
		<span class="badge">Палітра</span>
		<h2 class="section-title">Фірмові кольори</h2>
	</div>

	<div class="colors-list" data-testid={`${testIdPrefix}-list`}>
		{#each colors as c (c.hex)}
			<div class="color-item" data-testid={`${testIdPrefix}-item-${c.hex.replace('#', '')}`}>
				<div class="swatch" style:background-color={c.hex}>
					<span class="swatch-text" style:color={c.textColor}>{c.hex.toUpperCase()}</span>
				</div>
				<div class="color-info">
					<div class="codes-list">
						<button
							type="button"
							class="code-btn"
							onclick={() => copyToClipboard(c.hex)}
							aria-label={`Скопіювати ${c.hex}`}
							data-testid={`${testIdPrefix}-copy-hex-btn-${c.hex.replace('#', '')}`}
						>
							<span class="code-label">HEX:</span>
							<code>{c.hex}</code>
							{#if copiedColor === c.hex}
								<span class="copied-icon"><Check size={12} /></span>
							{:else}
								<Copy size={12} />
							{/if}
						</button>

						<button
							type="button"
							class="code-btn"
							onclick={() => copyToClipboard(`rgb(${c.rgb})`)}
							aria-label={`Скопіювати RGB ${c.rgb}`}
							data-testid={`${testIdPrefix}-copy-rgb-btn-${c.hex.replace('#', '')}`}
						>
							<span class="code-label">RGB:</span>
							<code>{c.rgb}</code>
							{#if copiedColor === `rgb(${c.rgb})`}
								<span class="copied-icon"><Check size={12} /></span>
							{:else}
								<Copy size={12} />
							{/if}
						</button>

						<div class="css-var-pill">
							<span>CSS:</span>
							<code>{c.cssVar}</code>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.brand-colors-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1.25rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
	}
	.section-heading {
		margin-bottom: 2rem;
	}
	.badge {
		background: var(--palette-yellow);
		color: var(--palette-black);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
	}
	.section-title {
		margin: 0.5rem 0 0;
		font-size: clamp(1.4rem, 2.5vw, 1.8rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.colors-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
		gap: 1.25rem;
	}
	.color-item {
		border: 1px solid var(--color-border);
		border-radius: 16px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	.color-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}
	.swatch {
		height: 100px;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		padding: 0.75rem 1rem;
	}
	.swatch-text {
		font-size: 0.85rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		background: rgba(0, 0, 0, 0.2);
		padding: 0.2rem 0.5rem;
		border-radius: 6px;
		backdrop-filter: blur(4px);
	}
	.color-info {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.codes-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.code-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.35rem 0.65rem;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--bg-card);
		color: var(--text-main);
		font-size: 0.82rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.code-btn:hover {
		background: var(--palette-yellow);
		color: var(--palette-black);
		border-color: transparent;
	}
	.code-label {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 700;
	}
	.copied-icon {
		color: #10b981;
	}
	.css-var-pill {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.35rem 0.65rem;
		border-radius: 6px;
		background: rgba(0, 0, 0, 0.03);
		font-size: 0.78rem;
		color: var(--text-muted);
	}
</style>
