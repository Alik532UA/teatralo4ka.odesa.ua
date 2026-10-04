<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { ShieldCheck, AlertTriangle } from 'lucide-svelte';
	import { brandGridTheme } from '$lib/services/brandGridTheme.svelte';
	import BrandCrest from './BrandCrest.svelte';
	import BrandBigCrest from './BrandBigCrest.svelte';
	import BrandElements from './BrandElements.svelte';
	import BrandAvatars from './BrandAvatars.svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const isEn = $derived($locale === 'en');
</script>

<div
	class="brand-logos-card"
	class:theme--dark-grid={brandGridTheme.current === 'dark'}
	data-testid={`${testIdPrefix}-card`}
>
	<!-- 1. Header Section with Checkerboard Toggle -->
	<div class="section-heading">
		<div class="heading-top-row">
			<span class="badge">{isEn ? 'Identity & Crests' : 'Айдентика та герби'}</span>

			<div class="checker-toggle" role="group" aria-label={isEn ? 'Transparency grid' : 'Тло прозорості'}>
				<span class="toggle-label">{isEn ? 'Grid:' : 'Шахматка:'}</span>
				<div class="toggle-pills">
					<button
						type="button"
						class="toggle-btn"
						class:active={brandGridTheme.current === 'light'}
						onclick={() => brandGridTheme.set('light')}
						title={isEn ? 'Light checkerboard' : 'Світла шахматка'}
						data-testid={`${testIdPrefix}-grid-theme-light-toggle`}
					>
						<span class="grid-icon grid-icon--light" aria-hidden="true"></span>
						<span>{isEn ? 'Light' : 'Світла'}</span>
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:active={brandGridTheme.current === 'dark'}
						onclick={() => brandGridTheme.set('dark')}
						title={isEn ? 'Dark checkerboard' : 'Темна шахматка'}
						data-testid={`${testIdPrefix}-grid-theme-dark-toggle`}
					>
						<span class="grid-icon grid-icon--dark" aria-hidden="true"></span>
						<span>{isEn ? 'Dark' : 'Темна'}</span>
					</button>
				</div>
			</div>
		</div>

		<h2 class="section-title">
			{isEn ? 'Logo, Crests & Brand Graphics' : 'Логотип, герби та фірмові знаки'}
		</h2>
		<p class="section-desc">
			{isEn
				? 'The official visual constants: Crest, Crest in hands, social avatars, and isolated brand elements.'
				: 'Офіційні константи стилю: Герб, Герб у долоньках, афішні аватарки та окремі графічні елементи.'}
		</p>
	</div>

	<!-- 2. Crest Section (Герб) -->
	<BrandCrest {testIdPrefix} />

	<!-- 3. Big Crest Section (Великий Герб) -->
	<BrandBigCrest {testIdPrefix} />

	<!-- 4. Isolated Elements (Окремі елементи) -->
	<BrandElements {testIdPrefix} />

	<!-- 5. Social Avatars (Аватарки) -->
	<BrandAvatars {testIdPrefix} />

	<!-- 6. Usage Rules -->
	<div class="rules-row">
		<div class="rule-card rule-card--good">
			<div class="rule-header">
				<span class="rule-icon--good"><ShieldCheck size={18} /></span>
				<strong>{isEn ? 'Clear Space & Rules:' : 'Охоронна зона та правила:'}</strong>
			</div>
			<ul class="rules-list">
				<li>
					{isEn
						? 'Minimum clear space around the emblem equals the height of the smaller mask.'
						: 'Мінімальний відступ навколо логотипа дорівнює висоті малої маски.'}
				</li>
				<li>
					{isEn
						? 'Place on high-contrast backgrounds (light or dark) without visual clutter.'
						: 'Розміщувати на контрастному світлому або темному тлі без зайвих шумів.'}
				</li>
				<li>
					{isEn
						? 'Maintain composition aspect ratios (1:1 for avatars or 800:484 for master crest).'
						: 'Зберігати цілісність композиції та пропорції сторін 1:1 або 800:484.'}
				</li>
			</ul>
		</div>

		<div class="rule-card rule-card--bad">
			<div class="rule-header">
				<span class="rule-icon--bad"><AlertTriangle size={18} /></span>
				<strong>{isEn ? 'Strictly Prohibited:' : 'Неприпустимо:'}</strong>
			</div>
			<ul class="rules-list">
				<li>
					{isEn
						? 'Do not distort, stretch, or alter the proportions of any brandmark.'
						: 'Не деформувати, не стискати і не розтягувати пропорції логотипа.'}
				</li>
				<li>
					{isEn
						? 'Do not alter official brand palette colors to random hues.'
						: 'Не змінювати фірмові кольори масок на випадкові відтінки.'}
				</li>
				<li>
					{isEn
						? 'Do not apply heavy dropshadows, filters, or unauthorized gradients.'
						: 'Не додавати сторонні важкі тіні чи градієнтні обведення.'}
				</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.brand-logos-card {
		--checker-c1: #ffffff;
		--checker-c2: #e5e7eb;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1rem, 3vw, 2.25rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
		min-width: 0;
		max-width: 100%;
		box-sizing: border-box;
	}

	@media (max-width: 768px) {
		.brand-logos-card {
			background: transparent;
			border: none;
			border-radius: 0;
			padding: 0;
			box-shadow: none;
		}
	}

	.brand-logos-card.theme--dark-grid {
		--checker-c1: #23252a;
		--checker-c2: #141518;
	}

	.section-heading {
		margin-bottom: 2.25rem;
	}

	.heading-top-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.checker-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.toggle-pills {
		display: inline-flex;
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
		border: 1px solid var(--color-border);
		padding: 0.2rem;
		border-radius: 10px;
		gap: 0.2rem;
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: transparent;
		border: none;
		padding: 0.3rem 0.65rem;
		border-radius: 7px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-muted);
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.toggle-btn.active {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	.grid-icon {
		width: 13px;
		height: 13px;
		border-radius: 3px;
		display: inline-block;
		border: 1px solid rgba(0, 0, 0, 0.15);
	}

	.grid-icon--light {
		background-color: #ffffff;
		background-image: repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%);
		background-size: 6px 6px;
	}

	.grid-icon--dark {
		background-color: #23252a;
		background-image: repeating-conic-gradient(#141518 0% 25%, #23252a 0% 50%);
		background-size: 6px 6px;
		border-color: rgba(255, 255, 255, 0.25);
	}

	.badge {
		background: var(--palette-red);
		color: #ffffff;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
		display: inline-block;
		margin-bottom: 0.5rem;
	}

	.section-title {
		margin: 0 0 0.4rem;
		font-size: clamp(1.5rem, 2.7vw, 1.95rem);
		font-weight: 800;
		color: var(--text-title);
	}

	.section-desc {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text-muted);
		max-width: 760px;
	}

	/* Rules Row */
	.rules-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
		gap: 1.25rem;
		min-width: 0;
	}

	.rule-card {
		border-radius: 14px;
		padding: 1.1rem;
		min-width: 0;
		box-sizing: border-box;
	}

	.rule-card--good {
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.rule-card--bad {
		background: rgba(226, 4, 19, 0.08);
		border: 1px solid rgba(226, 4, 19, 0.2);
	}

	.rule-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.95rem;
		color: var(--text-title);
	}

	.rule-icon--good {
		color: #10b981;
	}

	.rule-icon--bad {
		color: var(--palette-red);
	}

	.rules-list {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.85rem;
		line-height: 1.55;
		color: var(--text-main);
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
</style>
