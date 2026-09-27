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
			nameUk: 'Сонячний жовтий',
			nameEn: 'Primary Yellow',
			roleUk: 'Головний колір світла рампи, сонячної Одеси та дитячої радості.',
			textColor: '#1d1d1d'
		},
		{
			hex: '#00b5ec',
			rgb: '0, 181, 236',
			cssVar: '--palette-blue',
			nameUk: 'Театральний блакитний',
			nameEn: 'Theatrical Cyan',
			roleUk: 'Простір уяви, чорноморська свіжість, колір маски та польоту думок.',
			textColor: '#ffffff'
		},
		{
			hex: '#e20413',
			rgb: '226, 4, 19',
			cssVar: '--palette-red',
			nameUk: 'Сценічний червоний',
			nameEn: 'Stage Red',
			roleUk: 'Театральний оксамит, динаміка дії, драматичний акцент та енергія.',
			textColor: '#ffffff'
		},
		{
			hex: '#f9b31d',
			rgb: '249, 179, 29',
			cssVar: '--palette-orange',
			nameUk: 'Теплий бурштиновий',
			nameEn: 'Warm Amber',
			roleUk: 'Теплота дружньої спільноти, софіти, свято та креативне сяйво.',
			textColor: '#1d1d1d'
		},
		{
			hex: '#1d1d1d',
			rgb: '29, 29, 29',
			cssVar: '--palette-black',
			nameUk: 'Глибокий графіт',
			nameEn: 'Deep Charcoal',
			roleUk: 'Базовий колір сцени в затемненні, контрастний текст і суворість ліній.',
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
		<p class="section-desc">
			Офіційна палітра базується на пʼяти константах, що відображають дух Одеси, сценічне мистецтво та відкритість дитячої студії.
		</p>
	</div>

	<div class="colors-list" data-testid={`${testIdPrefix}-list`}>
		{#each colors as c (c.hex)}
			<div class="color-item" data-testid={`${testIdPrefix}-item-${c.hex.replace('#', '')}`}>
				<div class="swatch" style:background-color={c.hex}>
					<span class="swatch-text" style:color={c.textColor}>{c.hex.toUpperCase()}</span>
				</div>
				<div class="color-info">
					<div class="color-header">
						<strong class="color-name">{c.nameUk}</strong>
						<span class="color-en">{c.nameEn}</span>
					</div>
					<p class="color-role">{c.roleUk}</p>

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
		margin: 0.5rem 0 0.25rem;
		font-size: clamp(1.4rem, 2.5vw, 1.8rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.section-desc {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text-muted);
		max-width: 720px;
	}
	.colors-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
		gap: 1.5rem;
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
		height: 120px;
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
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
	}
	.color-header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.color-name {
		font-size: 1.1rem;
		color: var(--text-title);
	}
	.color-en {
		font-size: 0.82rem;
		color: var(--text-muted);
	}
	.color-role {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.5;
		color: var(--text-main);
		flex: 1;
	}
	.codes-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
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
