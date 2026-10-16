<script lang="ts">
	import { LEFT_MINI_ICONS, RIGHT_MINI_ICONS } from '$lib/data/posviataInvitations';

	interface Props {
		side: 'left' | 'right';
	}

	let { side }: Props = $props();

	const icons = $derived(side === 'left' ? LEFT_MINI_ICONS : RIGHT_MINI_ICONS);
</script>

<div class="posviata-icons posviata-icons--{side}" aria-hidden="true">
	{#each icons as iconId, index (`${side}-${iconId}-${index}`)}
		<img
			src={`/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon${iconId}_2026.svg`}
			alt=""
			class="mini-icon"
			width="22"
			height="22"
			loading="eager"
		/>
	{/each}
</div>

<style>
	.posviata-icons {
		position: absolute;
		top: 1.94cqi;
		bottom: 2.08cqi;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		width: 3.66cqi;
		box-sizing: border-box;
		z-index: 2;
		pointer-events: none;
	}

	.posviata-icons--left {
		left: 2.76cqi;
	}

	.posviata-icons--right {
		right: 3.06cqi;
	}

	.mini-icon {
		display: block;
		width: 3.66cqi;
		height: 3.66cqi;
		object-fit: contain;
		filter: brightness(0.35);
	}

	@media print {
		.posviata-icons {
			top: 2.66mm !important;
			bottom: 2.86mm !important;
			width: 5.03mm !important;
		}

		.posviata-icons--left {
			left: 3.78mm !important;
		}

		.posviata-icons--right {
			right: 4.20mm !important;
		}

		.mini-icon {
			width: 5.03mm !important;
			height: 5.03mm !important;
			filter: brightness(0.35) !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}
	}
</style>
