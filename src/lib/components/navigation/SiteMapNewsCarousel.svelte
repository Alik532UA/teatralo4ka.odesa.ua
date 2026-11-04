<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-svelte';
	import { withLocale, type Locale } from '$lib/i18n/routing';
	import { codeNewsCards } from '$lib/config/codeNews';

	interface Props {
		lang: Locale;
		onselect: () => void;
	}

	let { lang, onselect }: Props = $props();

	const newsCards = $derived(codeNewsCards(lang).slice(0, 12));
	const doubledCards = $derived([...newsCards, ...newsCards]);

	let isPlaying = $state(false);
	let isHovered = $state(false);
	let scrollDir = $state<1 | -1>(1);
	let stripEl = $state<HTMLElement | null>(null);
	let setWidth = $state(0);
	let currentX = 0;
	let userDelta = 0;
	let userInteracted = false;

	$effect(() => {
		const timer = setTimeout(() => { if (!userInteracted) isPlaying = true; }, 11000);
		return () => clearTimeout(timer);
	});

	function nextNews() { scrollDir = 1; userDelta += 290; }
	function prevNews() { scrollDir = -1; userDelta -= 290; }
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
		const TARGET_SPEED = 10, RAMP_MS = 1500;

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

{#snippet cardItems(isClone: boolean)}
	{#each doubledCards as card, i (isClone ? `clone-${i}-${card.id}` : `${i}-${card.id}`)}
		<a
			href={withLocale(`/news/${card.id}`, lang)}
			class="sitemap-news-card"
			onclick={onselect}
			tabindex={isClone ? -1 : undefined}
			data-testid={isClone || i >= newsCards.length ? undefined : `sitemap-news-card-${card.id}`}
		>
			{#if card.coverUrl}
				<img src={card.coverUrl} alt="" width="64" height="48" class="sitemap-news-card__img" loading="lazy" />
			{/if}
			<div class="sitemap-news-card__info">
				<span class="sitemap-news-card__date">{card.date}</span>
				<span class="sitemap-news-card__title">{card.title}</span>
			</div>
		</a>
	{/each}
{/snippet}

<div
	class="sitemap-news"
	role="region"
	aria-label={$t('nav.latestNews')}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	data-testid="sitemap-news-section"
>
	<div class="sitemap-news__floating-controls" data-testid="sitemap-news-toolbar">
		<button type="button" class="sitemap-news-btn" onclick={prevNews} aria-label="Попередня новина" data-testid="sitemap-news-prev-btn"><ChevronLeft size={14} /></button>
		<button type="button" class="sitemap-news-btn sitemap-news-btn--play" class:active={isPlaying} onclick={togglePlay} aria-label={isPlaying ? $t('nav.pauseCarousel') : $t('nav.playCarousel')} data-testid="sitemap-news-play-toggle">
			{#if isPlaying}<Pause size={12} />{:else}<Play size={12} />{/if}
		</button>
		<button type="button" class="sitemap-news-btn" onclick={nextNews} aria-label="Наступна новина" data-testid="sitemap-news-next-btn"><ChevronRight size={14} /></button>
	</div>

	<div
		class="sitemap-news__track"
		onwheel={onWheel}
		data-testid="sitemap-news-list"
	>
		<div class="sitemap-news-strip" bind:this={stripEl}>
			<div class="sitemap-track-set" bind:clientWidth={setWidth}>{@render cardItems(false)}</div>
			<div class="sitemap-track-set" aria-hidden="true">{@render cardItems(true)}</div>
			<div class="sitemap-track-set" aria-hidden="true">{@render cardItems(true)}</div>
		</div>
	</div>
</div>

<style>
	.sitemap-news { position: relative; width: 100%; display: flex; align-items: center; overflow: hidden; }
	.sitemap-news__floating-controls { position: absolute; top: 50%; right: clamp(0.75rem, 2vw, 2rem); transform: translateY(-50%) scale(0.96); z-index: 10; display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.35rem; border-radius: 999px; background: rgba(10, 14, 23, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-main); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4); opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; }
	.sitemap-news:hover .sitemap-news__floating-controls, .sitemap-news:focus-within .sitemap-news__floating-controls { opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1); }
	.sitemap-news-btn { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 1px solid transparent; background: rgba(255, 255, 255, 0.08); color: var(--text-main, #e5e7eb); cursor: pointer; }
	.sitemap-news-btn:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
	.sitemap-news-btn--play.active { background: rgba(56, 189, 248, 0.25); border-color: rgba(56, 189, 248, 0.4); color: var(--accent-text, #38bdf8); }
	.sitemap-news__track { display: flex; width: 100%; overflow: hidden; padding: 0.15rem 0; }
	.sitemap-news-strip { display: flex; align-items: center; width: max-content; will-change: transform; }
	.sitemap-track-set { display: flex; align-items: center; gap: clamp(0.5rem, 0.4vw, 0.85rem); padding-right: clamp(0.5rem, 0.4vw, 0.85rem); flex-shrink: 0; }
	.sitemap-news-card { flex: 0 0 clamp(220px, 15vw, 290px); height: clamp(52px, 6vh, 60px); display: flex; align-items: center; gap: 0.55rem; padding: 0.35rem 0.55rem; border-radius: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-main); text-decoration: none; transition: background-color 0.15s ease, border-color 0.15s ease; }
	.sitemap-news-card:hover { background: rgba(255, 255, 255, 0.09); border-color: rgba(56, 189, 248, 0.4); }
	.sitemap-news-card__img { width: clamp(50px, 3.5vw, 62px); height: clamp(40px, 4.5vh, 48px); object-fit: cover; border-radius: 4px; flex-shrink: 0; }
	.sitemap-news-card__info { display: flex; flex-direction: column; gap: 0.15rem; overflow: hidden; min-width: 0; }
	.sitemap-news-card__date { font-size: clamp(0.65rem, 0.5vw, 0.75rem); color: var(--text-muted, #9ca3af); }
	.sitemap-news-card__title { font-size: clamp(0.72rem, 0.55vw, 0.85rem); font-weight: 500; color: var(--text-main, #f3f4f6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
