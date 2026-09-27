<script lang="ts">
	import { asset } from '$app/paths';
	import { Sparkles } from 'lucide-svelte';

	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-particles' }: Props = $props();

	const miniIcons = [
		{ file: 't4_logo_IndividualParticles_MiniIcon02_2026.svg', name: 'Частка 02' },
		{ file: 't4_logo_IndividualParticles_MiniIcon03_2026.svg', name: 'Частка 03' },
		{ file: 't4_logo_IndividualParticles_MiniIcon04_2026.svg', name: 'Частка 04' },
		{ file: 't4_logo_IndividualParticles_MiniIcon05_2026.svg', name: 'Частка 05' },
		{ file: 't4_logo_IndividualParticles_MiniIcon06_2026.svg', name: 'Частка 06' },
		{ file: 't4_logo_IndividualParticles_MiniIcon07_2026.svg', name: 'Частка 07' },
		{ file: 't4_logo_IndividualParticles_MiniIcon08_2026.svg', name: 'Частка 08' },
		{ file: 't4_logo_IndividualParticles_MiniIcon09_2026.svg', name: 'Частка 09' },
		{ file: 't4_logo_IndividualParticles_MiniIcon10_2026.svg', name: 'Частка 10' },
		{ file: 't4_logo_IndividualParticles_MiniIcon11_2026.svg', name: 'Частка 11' },
		{ file: 't4_logo_IndividualParticles_MiniIcon12_2026.svg', name: 'Частка 12' }
	];
</script>

<div class="brand-particles-card" data-testid={`${testIdPrefix}-card`}>
	<div class="particles-header">
		<Sparkles size={16} aria-hidden="true" />
		<h3 class="particles-title">Фірмові мікро-частки (Mini-Icons)</h3>
	</div>
	<p class="particles-desc">
		Векторні мікроелементи айдентики для оформлення дипломів, афіш, соцмереж та анімацій.
	</p>
	<div class="particles-list" data-testid={`${testIdPrefix}-list`}>
		{#each miniIcons as icon (icon.file)}
			<div class="particle-item" title={icon.name}>
				<img
					src={asset(`/miniIcon/svg/${icon.file}`)}
					alt={icon.name}
					width="48"
					height="48"
					class="particle-img"
				/>
				<span class="particle-label">{icon.name.replace('Частка ', '#')}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.brand-particles-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1.25rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
	}
	.particles-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--palette-orange);
		margin-bottom: 0.25rem;
	}
	.particles-title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-title);
	}
	.particles-desc {
		margin: 0 0 1.25rem;
		font-size: 0.88rem;
		color: var(--text-muted);
	}
	.particles-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(70px, 100%), 1fr));
		gap: 0.75rem;
	}
	.particle-item {
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 0.6rem 0.4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		background: #ffffff;
		transition: transform 0.15s ease, border-color 0.15s ease;
	}
	.particle-item:hover {
		transform: scale(1.08);
		border-color: var(--palette-blue);
	}
	.particle-img {
		width: 32px;
		height: 32px;
		object-fit: contain;
	}
	.particle-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		font-weight: 700;
	}
</style>
