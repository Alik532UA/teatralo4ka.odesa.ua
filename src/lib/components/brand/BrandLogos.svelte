<script lang="ts">
	import { asset } from '$app/paths';
	import { Download, ShieldCheck, AlertTriangle } from 'lucide-svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-logos' }: Props = $props();

	const VECTOR_MASKS = [
		{ name: 'Дві маски', file: 't4_logo_IndividualParticles_MasksTwo_2026.svg', dl: 'masks-two.svg', testId: 'masks-two' },
		{ name: 'Синя маска', file: 't4_logo_IndividualParticles_MaskBlue_2026.svg', dl: 'mask-blue.svg', testId: 'mask-blue' },
		{ name: 'Червона маска', file: 't4_logo_IndividualParticles_MaskRed_2026.svg', dl: 'mask-red.svg', testId: 'mask-red' }
	];
</script>

<div class="brand-logos-card" data-testid={`${testIdPrefix}-card`}>
	<div class="section-heading">
		<span class="badge">Айдентика</span>
		<h2 class="section-title">Логотип та фірмові знаки</h2>
		<p class="section-desc">
			Знак школи поєднує класичні театральні маски та динамічні летючі частки, що символізують дітей на сцені та творчий пошук.
		</p>
	</div>

	<div class="logos-grid">
		<div class="logo-box logo-box--main">
			<div class="logo-preview-stage">
				<img
					src={asset('/logo/png/logo-800px484px.png')}
					alt="Головний логотип Одеської театральної школи"
					width="800"
					height="484"
					class="logo-img logo-img--full"
					data-testid={`${testIdPrefix}-main-img`}
				/>
			</div>
			<div class="logo-meta">
				<div class="meta-text">
					<strong class="logo-name">Головний фірмовий знак (Full Logo)</strong>
					<span class="logo-specs">Растровий майстер-формат високої роздільності</span>
				</div>
				<a
					href={asset('/logo/png/logo-800px484px.png')}
					download="teatralo4ka-logo.png"
					class="dl-btn"
					data-testid={`${testIdPrefix}-download-main-link`}
				>
					<Download size={14} aria-hidden="true" />
					<span>PNG (800×484)</span>
				</a>
			</div>
		</div>

		<div class="vector-cards-grid">
			{#each VECTOR_MASKS as mask (mask.file)}
				<div class="vector-card">
					<div class="vector-preview">
						<img
							src={asset(`/logo/svg/${mask.file}`)}
							alt={mask.name}
							width="160"
							height="160"
							class="vector-img"
						/>
					</div>
					<div class="vector-meta">
						<strong class="vector-name">{mask.name}</strong>
						<a
							href={asset(`/logo/svg/${mask.file}`)}
							download={mask.dl}
							class="dl-link"
							data-testid={`${testIdPrefix}-download-${mask.testId}-link`}
						>
							<Download size={12} aria-hidden="true" /> SVG
						</a>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="rules-row">
		<div class="rule-card rule-card--good">
			<div class="rule-header">
				<span class="rule-icon--good"><ShieldCheck size={18} /></span>
				<strong>Охоронна зона та правила:</strong>
			</div>
			<ul class="rules-list">
				<li>Мінімальний відступ навколо логотипа дорівнює висоті малої маски.</li>
				<li>Розміщувати на контрастному світлому або темному тлі без зайвих шумів.</li>
				<li>Зберігати цілісність композиції та пропорції сторін 1:1 або 800:484.</li>
			</ul>
		</div>

		<div class="rule-card rule-card--bad">
			<div class="rule-header">
				<span class="rule-icon--bad"><AlertTriangle size={18} /></span>
				<strong>Неприпустимо:</strong>
			</div>
			<ul class="rules-list">
				<li>Не деформувати, не стискати і не розтягувати пропорції логотипа.</li>
				<li>Не змінювати фірмові кольори масок на випадкові відтінки.</li>
				<li>Не додавати сторонні важкі тіні чи градієнтні обведення.</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.brand-logos-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1.25rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
	}
	.section-heading { margin-bottom: 2rem; }
	.badge {
		background: var(--palette-red);
		color: #ffffff;
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
	.logos-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
	.logo-box {
		border: 1px solid var(--color-border);
		border-radius: 16px;
		overflow: hidden;
		background: var(--color-surface);
	}
	.logo-preview-stage {
		padding: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ffffff;
		border-bottom: 1px solid var(--color-border);
	}
	.logo-img--full { max-width: min(320px, 100%); height: auto; display: block; }
	.logo-meta {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.meta-text { display: flex; flex-direction: column; gap: 0.2rem; }
	.logo-name { color: var(--text-title); font-size: 1rem; }
	.logo-specs { color: var(--text-muted); font-size: 0.85rem; }
	.dl-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		background: var(--palette-blue);
		color: var(--palette-black);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 700;
		transition: filter 0.15s ease;
	}
	.dl-btn:hover { filter: brightness(1.1); }
	.vector-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
		gap: 1.25rem;
	}
	.vector-card {
		border: 1px solid var(--color-border);
		border-radius: 14px;
		overflow: hidden;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
	}
	.vector-preview {
		padding: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ffffff;
		border-bottom: 1px solid var(--color-border);
		min-height: 140px;
	}
	.vector-img { max-width: 90px; height: auto; }
	.vector-meta {
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.vector-name { font-size: 0.88rem; color: var(--text-title); }
	.dl-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--palette-blue);
		text-decoration: none;
	}
	.dl-link:hover { text-decoration: underline; }
	.rules-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
		gap: 1.5rem;
	}
	.rule-card { border-radius: 14px; padding: 1.25rem; }
	.rule-card--good { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); }
	.rule-card--bad { background: rgba(226, 4, 19, 0.08); border: 1px solid rgba(226, 4, 19, 0.2); }
	.rule-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text-title); }
	.rule-icon--good { color: #10b981; }
	.rule-icon--bad { color: var(--palette-red); }
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
