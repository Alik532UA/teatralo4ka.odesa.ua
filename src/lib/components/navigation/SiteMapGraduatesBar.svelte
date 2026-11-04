<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-svelte';
	import type { Locale } from '$lib/i18n/routing';
	import { WITH_PHOTO, graduatePhoto, graduateCardHref, graduationCaption, type GraduateIndexEntry } from '$lib/data/graduates';
	import SiteMapPersonTip from './SiteMapPersonTip.svelte';

	interface Props {
		lang: Locale;
		onselect: () => void;
	}

	let { lang, onselect }: Props = $props();

	const graduates = WITH_PHOTO;
	const doubledGraduates = $derived([...graduates, ...graduates]);

	let stripEl = $state<HTMLElement | null>(null);
	let barInnerEl = $state<HTMLElement | null>(null);
	let isPlaying = $state(false);
	let isHovered = $state(false);
	let scrollDir = $state<1 | -1>(1);
	let setWidth = $state(0);
	let currentX = 0;
	let userDelta = 0;
	let userInteracted = false;

	let hoveredGraduate = $state<{ graduate: GraduateIndexEntry; x: number } | null>(null);
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function showTip(e: MouseEvent, item: GraduateIndexEntry) {
		if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
		const badge = e.currentTarget as HTMLElement, bar = barInnerEl;
		if (!badge || !bar) return;
		const badgeRect = badge.getBoundingClientRect(), barRect = bar.getBoundingClientRect();
		hoveredGraduate = { graduate: item, x: badgeRect.left + badgeRect.width / 2 - barRect.left };
	}

	function hideTip() { hideTimeout = setTimeout(() => { hoveredGraduate = null; }, 180); }
	function keepTip() { if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; } }

	$effect(() => {
		const timer = setTimeout(() => { if (!userInteracted) isPlaying = true; }, 8000);
		return () => clearTimeout(timer);
	});

	function scrollGraduates(dir: 1 | -1) { scrollDir = dir; userDelta += dir * 260; }
	function togglePlay() { userInteracted = true; isPlaying = !isPlaying; }

	function onWheel(e: WheelEvent) {
		const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
		if (delta !== 0) {
			e.preventDefault();
			scrollDir = delta > 0 ? 1 : -1;
			userDelta += delta * 0.85;
		}
	}

	$effect(() => {
		let lastTime: number | null = null, rampStart: number | null = null, rafId: number;
		const TARGET_SPEED = 16, RAMP_MS = 1500;

		const step = (time: number) => {
			if (lastTime !== null && setWidth > 0 && stripEl) {
				const dt = Math.min((time - lastTime) / 1000, 0.1);
				if (isPlaying && !isHovered) {
					if (rampStart === null) rampStart = time;
					const p = Math.min((time - rampStart) / RAMP_MS, 1);
					currentX += TARGET_SPEED * (p * p * (3 - 2 * p)) * dt * scrollDir;
				} else { rampStart = null; }

				if (Math.abs(userDelta) > 0.05) {
					const absorbed = userDelta * 0.12;
					currentX += absorbed;
					userDelta -= absorbed;
				} else if (userDelta !== 0) {
					currentX += userDelta;
					userDelta = 0;
				}

				while (currentX >= setWidth) currentX -= setWidth;
				while (currentX < 0) currentX += setWidth;

				stripEl.style.transform = `translate3d(-${currentX.toFixed(3)}px, 0, 0)`;
			}
			lastTime = time;
			rafId = requestAnimationFrame(step);
		};
		rafId = requestAnimationFrame(step);
		return () => cancelAnimationFrame(rafId);
	});
</script>

{#snippet graduateBadges(isClone: boolean)}
	{#each doubledGraduates as item, i (isClone ? `clone-${i}-${item.slug}` : `${i}-${item.slug}`)}
		<a
			href={graduateCardHref(item, lang)}
			class="sitemap-grad-badge"
			class:active={hoveredGraduate?.graduate.slug === item.slug}
			aria-label={item.name}
			onclick={onselect}
			onmouseenter={(e) => showTip(e, item)}
			onmouseleave={hideTip}
			tabindex={isClone ? -1 : undefined}
			data-testid={isClone || i >= graduates.length ? undefined : `sitemap-graduate-badge-${item.slug}`}
		>
			<img src={graduatePhoto(item.slug, 96)} alt="" width="34" height="34" class="sitemap-grad-img" loading="lazy" />
		</a>
	{/each}
{/snippet}

<div
	class="sitemap-graduates-bar"
	role="region"
	aria-label={$t('nav.schoolGraduates')}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	data-testid="sitemap-graduates-section"
>
	<div class="sitemap-graduates-bar__inner" bind:this={barInnerEl}>
		{#if hoveredGraduate}
			<SiteMapPersonTip
				name={hoveredGraduate.graduate.name}
				photo={graduatePhoto(hoveredGraduate.graduate.slug, 96)}
				countText={graduationCaption(hoveredGraduate.graduate, $t)}
				roleTitle={null}
				askText="якщо це ти, напиши мені"
				x={hoveredGraduate.x}
				onmouseenter={keepTip}
				onmouseleave={hideTip}
			/>
		{/if}

		<div class="sitemap-graduates-bar__floating-controls" data-testid="sitemap-graduates-toolbar">
			<button type="button" class="sitemap-mini-btn" onclick={() => scrollGraduates(-1)} aria-label="Назад" data-testid="sitemap-graduates-prev-btn"><ChevronLeft size={14} /></button>
			<button type="button" class="sitemap-mini-btn sitemap-mini-btn--play" class:active={isPlaying} onclick={togglePlay} aria-label={isPlaying ? $t('nav.pauseCarousel') : $t('nav.playCarousel')} data-testid="sitemap-graduates-play-toggle">
				{#if isPlaying}<Pause size={12} />{:else}<Play size={12} />{/if}
			</button>
			<button type="button" class="sitemap-mini-btn" onclick={() => scrollGraduates(1)} aria-label="Вперед" data-testid="sitemap-graduates-next-btn"><ChevronRight size={14} /></button>
		</div>

		<div
			class="sitemap-graduates-bar__track"
			onwheel={onWheel}
			data-testid="sitemap-graduates-row"
		>
			<div class="sitemap-graduates-strip" bind:this={stripEl}>
				<div class="sitemap-graduates-set" bind:clientWidth={setWidth}>{@render graduateBadges(false)}</div>
				<div class="sitemap-graduates-set" aria-hidden="true">{@render graduateBadges(true)}</div>
				<div class="sitemap-graduates-set" aria-hidden="true">{@render graduateBadges(true)}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.sitemap-graduates-bar { padding: 0.35rem 0; background: rgba(255, 255, 255, 0.015); border-top: 1px solid var(--border-main); flex-shrink: 0; width: 100%; overflow: hidden; }
	.sitemap-graduates-bar__inner { position: relative; width: 100%; display: flex; align-items: center; }
	.sitemap-graduates-bar__floating-controls { position: absolute; top: 50%; right: clamp(0.75rem, 2vw, 2rem); transform: translateY(-50%) scale(0.96); z-index: 10; display: flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.3rem; border-radius: 999px; background: rgba(10, 14, 23, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-main); opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; }
	.sitemap-graduates-bar:hover .sitemap-graduates-bar__floating-controls, .sitemap-graduates-bar:focus-within .sitemap-graduates-bar__floating-controls { opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1); }
	.sitemap-mini-btn { width: 22px; height: 22px; border-radius: 50%; border: 1px solid transparent; background: rgba(255, 255, 255, 0.08); color: #e5e7eb; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
	.sitemap-mini-btn:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
	.sitemap-mini-btn--play.active { background: rgba(56, 189, 248, 0.25); border-color: rgba(56, 189, 248, 0.4); color: var(--accent-text, #38bdf8); }
	.sitemap-graduates-bar__track { display: flex; align-items: center; overflow: hidden; width: 100%; padding: 0.1rem 0; }
	.sitemap-graduates-strip { display: flex; align-items: center; width: max-content; will-change: transform; }
	.sitemap-graduates-set { display: flex; align-items: center; gap: 0.45rem; padding-right: 0.45rem; flex-shrink: 0; }
	.sitemap-grad-badge { width: 34px; height: 34px; border-radius: 999px; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-main); background: rgba(255, 255, 255, 0.05); text-decoration: none; flex-shrink: 0; transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease; }
	.sitemap-grad-badge:hover, .sitemap-grad-badge.active { transform: scale(1.18); border-color: #ffd700; box-shadow: 0 0 10px rgba(255, 215, 0, 0.45); }
	.sitemap-grad-img { width: 100%; height: 100%; object-fit: cover; }
</style>
