<script lang="ts">
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { t } from "svelte-i18n";

	let { size = 'large' }: { size?: 'large' | 'small' } = $props();

	const dimensions = {
		large: { width: 140, height: 140 },
		small: { width: 80, height: 80 }
	};

	const d = $derived(dimensions[size]);
	
	// status: 'hidden' -> 'appearing' -> 'idle'
	let status = $state<'hidden' | 'appearing' | 'idle'>('hidden');

	onMount(() => {
		if (browser) {
			const handleExit = () => {
				status = 'appearing';
				// 0.4s delay + 0.8s duration = 1.2s sequence. Buffer to 1.5s.
				setTimeout(() => { status = 'idle'; }, 1500);
			};

			const splash = document.getElementById('app-splash');
			
			// Case 1: Splash is not in DOM or explicitly hidden (warm start)
			if (!splash || splash.style.display === 'none') {
				status = 'idle';
			}
			// Case 2: Splash is already exiting (triggered in +page.svelte)
			else if (splash.classList.contains('splash-exit')) {
				handleExit();
			}
			// Case 3: Wait for custom event dispatched from +page.svelte
			else {
				window.addEventListener('splash-logo-start', handleExit, { once: true });
			}
		}
	});
</script>

<div 
	class="logo-container" 
	style="width: {d.width}px; height: {d.height}px;"
	data-status={status}
>
	<img
		src="{base}/logo/svg/t4_logo_IndividualParticles_MaskRed_2026.svg"
		alt={$t('common.logoAlt')}
		class="logo-svg logo-red"
		width={d.width}
		height={d.height}
	/>
	<img
		src="{base}/logo/svg/t4_logo_IndividualParticles_MaskBlue_2026.svg"
		alt={$t('common.logoAlt')}
		class="logo-svg logo-blue"
		width={d.width}
		height={d.height}
	/>
</div>

<style>
	.logo-container {
		position: relative;
		flex-shrink: 0;
		opacity: 0;
	}

	/* Show container only when not 'hidden' */
	.logo-container[data-status="appearing"],
	.logo-container[data-status="idle"] {
		opacity: 1;
	}

	.logo-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	/* ── IDLE STATE (Constant Pulse) ─────────────────────────────────── */
	.logo-container[data-status="idle"] .logo-svg {
		animation: logo-pulse 4s ease-in-out infinite;
	}
	.logo-container[data-status="idle"] .logo-red {
		animation-delay: 0.1s;
	}

	/* ── APPEARING STATE (One-time Animation) ────────────────────────── */
	/* We use 'both' to ensure opacity:0 during delay and opacity:1 after finish */
	.logo-container[data-status="appearing"] .logo-blue {
		animation: logo-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.logo-container[data-status="appearing"] .logo-red {
		animation: logo-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
	}

	@keyframes logo-appear {
		0% { opacity: 0; transform: scale(0.8); }
		100% { opacity: 1; transform: scale(1); }
	}

	@keyframes logo-pulse {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.02); opacity: 0.95; }
	}
</style>
