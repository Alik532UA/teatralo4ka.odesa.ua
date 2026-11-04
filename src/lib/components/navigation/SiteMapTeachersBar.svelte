<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-svelte';
	import { withLocale, type Locale } from '$lib/i18n/routing';
	import { getListedMasters, mastersByMentions, masterSection, type MasterSection, type Master } from '$lib/data/masters';
	import SiteMapPersonTip from './SiteMapPersonTip.svelte';

	interface Props {
		lang: Locale;
		onselect: () => void;
	}

	let { lang, onselect }: Props = $props();

	const SECTIONS: MasterSection[] = [
		'administration', 'heads', 'directors', 'speech', 'artists',
		'choreographers', 'vocalists', 'musicians', 'accompanists',
		'teachers', 'production', 'it', 'support'
	];
	const ADMIN_ORDER = ['olena-tkach', 'oksana-panchenko', 'natalia-shalashna', 'tetiana-korenchuk', 'sofiia-tkach'];
	const SUPPORT_ORDER = ['natalia-stoianova', 'olena-haraieva', 'daria-dias-valdis', 'burlak', 'yurii-drankov', 'viktor-kurov', 'natalia-lytvynova', 'artur-lytvynenko', 'filarena-sukhanova'];

	const mentionsMap = new Map(mastersByMentions().map((e) => [e.master.id, e.mentions]));
	const allActive = getListedMasters().filter((m) => m.status === 'active');

	function sortCategory(cat: MasterSection, items: typeof allActive) {
		const order = cat === 'administration' ? ADMIN_ORDER : cat === 'support' ? SUPPORT_ORDER : null;
		if (order) {
			return [...items].sort((a, b) => {
				const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
				if (ia !== -1 && ib !== -1) return ia - ib;
				return ia !== -1 ? -1 : ib !== -1 ? 1 : 0;
			});
		}
		return [...items].sort((a, b) => {
			const diff = (mentionsMap.get(b.id) ?? 0) - (mentionsMap.get(a.id) ?? 0);
			if (diff !== 0) return diff;
			const pa = a.photo ? 0 : 1, pb = b.photo ? 0 : 1;
			if (pa !== pb) return pa - pb;
			return a.displayName.localeCompare(b.displayName, 'uk');
		});
	}

	const teachers = SECTIONS.flatMap((sec) => sortCategory(sec, allActive.filter((m) => masterSection(m) === sec)));
	const doubledTeachers = $derived([...teachers, ...teachers]);

	function pluralMentions(count: number): string {
		const abs = Math.abs(count), d10 = abs % 10, d100 = abs % 100;
		if (d100 >= 11 && d100 <= 19) return `${count} згадок в анкетах`;
		if (d10 === 1) return `${count} згадка в анкеті`;
		if (d10 >= 2 && d10 <= 4) return `${count} згадки в анкетах`;
		return `${count} згадок в анкетах`;
	}

	let stripEl = $state<HTMLElement | null>(null);
	let barInnerEl = $state<HTMLElement | null>(null);
	let isPlaying = $state(false);
	let isHovered = $state(false);
	let scrollDir = $state<1 | -1>(1);
	let setWidth = $state(0);
	let currentX = 0;
	let userDelta = 0;
	let userInteracted = false;

	let hoveredTeacher = $state<{ master: Master; mentions: number; x: number } | null>(null);
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function showTip(e: MouseEvent, item: Master, mentions: number) {
		if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
		const badge = e.currentTarget as HTMLElement, bar = barInnerEl;
		if (!badge || !bar) return;
		const badgeRect = badge.getBoundingClientRect(), barRect = bar.getBoundingClientRect();
		hoveredTeacher = { master: item, mentions, x: badgeRect.left + badgeRect.width / 2 - barRect.left };
	}

	function hideTip() { hideTimeout = setTimeout(() => { hoveredTeacher = null; }, 180); }
	function keepTip() { if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; } }

	$effect(() => {
		const timer = setTimeout(() => { if (!userInteracted) isPlaying = true; }, 5000);
		return () => clearTimeout(timer);
	});

	function scrollTeachers(dir: 1 | -1) { scrollDir = dir; userDelta += dir * 260; }
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
		const TARGET_SPEED = 13, RAMP_MS = 1500;

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

{#snippet teacherBadges(isClone: boolean)}
	{#each doubledTeachers as item, i (isClone ? `clone-${i}-${item.id}` : `${i}-${item.id}`)}
		{@const mentions = mentionsMap.get(item.id) ?? 0}
		<a
			href={withLocale(`/residents/adults/${item.slug}`, lang)}
			class="sitemap-teacher-badge"
			class:active={hoveredTeacher?.master.id === item.id}
			aria-label={item.displayName}
			onclick={onselect}
			onmouseenter={(e) => showTip(e, item, mentions)}
			onmouseleave={hideTip}
			tabindex={isClone ? -1 : undefined}
			data-testid={isClone || i >= teachers.length ? undefined : `sitemap-teacher-badge-${item.slug}`}
		>
			{#if item.photo}
				<img src={item.photo} alt="" width="34" height="34" class="sitemap-teacher-img" loading="lazy" />
			{:else}
				<span class="sitemap-teacher-letter" aria-hidden="true">{item.displayName.charAt(0)}</span>
			{/if}
		</a>
	{/each}
{/snippet}

<div
	class="sitemap-teachers-bar"
	role="region"
	aria-label={$t('nav.schoolTeachers')}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	data-testid="sitemap-teachers-section"
>
	<div class="sitemap-teachers-bar__inner" bind:this={barInnerEl}>
		{#if hoveredTeacher}
			<SiteMapPersonTip
				name={hoveredTeacher.master.displayName}
				photo={hoveredTeacher.master.photo}
				countText={hoveredTeacher.mentions > 0 ? pluralMentions(hoveredTeacher.mentions) : null}
				roleTitle={hoveredTeacher.master.roleTitle}
				askText="якщо це твій викладач, то напиши мені"
				x={hoveredTeacher.x}
				onmouseenter={keepTip}
				onmouseleave={hideTip}
			/>
		{/if}

		<div class="sitemap-teachers-bar__floating-controls" data-testid="sitemap-teachers-toolbar">
			<button type="button" class="sitemap-mini-btn" onclick={() => scrollTeachers(-1)} aria-label="Назад" data-testid="sitemap-teachers-prev-btn"><ChevronLeft size={14} /></button>
			<button type="button" class="sitemap-mini-btn sitemap-mini-btn--play" class:active={isPlaying} onclick={togglePlay} aria-label={isPlaying ? $t('nav.pauseCarousel') : $t('nav.playCarousel')} data-testid="sitemap-teachers-play-toggle">
				{#if isPlaying}<Pause size={12} />{:else}<Play size={12} />{/if}
			</button>
			<button type="button" class="sitemap-mini-btn" onclick={() => scrollTeachers(1)} aria-label="Вперед" data-testid="sitemap-teachers-next-btn"><ChevronRight size={14} /></button>
		</div>

		<div
			class="sitemap-teachers-bar__track"
			onwheel={onWheel}
			data-testid="sitemap-teachers-row"
		>
			<div class="sitemap-teachers-strip" bind:this={stripEl}>
				<div class="sitemap-teachers-set" bind:clientWidth={setWidth}>{@render teacherBadges(false)}</div>
				<div class="sitemap-teachers-set" aria-hidden="true">{@render teacherBadges(true)}</div>
				<div class="sitemap-teachers-set" aria-hidden="true">{@render teacherBadges(true)}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.sitemap-teachers-bar { padding: 0.35rem 0; background: rgba(255, 255, 255, 0.02); border-top: 1px solid var(--border-main); flex-shrink: 0; width: 100%; overflow: hidden; }
	.sitemap-teachers-bar__inner { position: relative; width: 100%; display: flex; align-items: center; }
	.sitemap-teachers-bar__floating-controls { position: absolute; top: 50%; right: clamp(0.75rem, 2vw, 2rem); transform: translateY(-50%) scale(0.96); z-index: 10; display: flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.3rem; border-radius: 999px; background: rgba(10, 14, 23, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-main); opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; }
	.sitemap-teachers-bar:hover .sitemap-teachers-bar__floating-controls, .sitemap-teachers-bar:focus-within .sitemap-teachers-bar__floating-controls { opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1); }
	.sitemap-mini-btn { width: 22px; height: 22px; border-radius: 50%; border: 1px solid transparent; background: rgba(255, 255, 255, 0.08); color: #e5e7eb; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
	.sitemap-mini-btn:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
	.sitemap-mini-btn--play.active { background: rgba(56, 189, 248, 0.25); border-color: rgba(56, 189, 248, 0.4); color: var(--accent-text, #38bdf8); }
	.sitemap-teachers-bar__track { display: flex; align-items: center; overflow: hidden; width: 100%; padding: 0.1rem 0; }
	.sitemap-teachers-strip { display: flex; align-items: center; width: max-content; will-change: transform; }
	.sitemap-teachers-set { display: flex; align-items: center; gap: 0.45rem; padding-right: 0.45rem; flex-shrink: 0; }
	.sitemap-teacher-badge { width: 34px; height: 34px; border-radius: 999px; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-main); background: rgba(255, 255, 255, 0.05); text-decoration: none; flex-shrink: 0; transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease; }
	.sitemap-teacher-badge:hover, .sitemap-teacher-badge.active { transform: scale(1.18); border-color: #ffd700; box-shadow: 0 0 10px rgba(255, 215, 0, 0.45); }
	.sitemap-teacher-img { width: 100%; height: 100%; object-fit: cover; }
	.sitemap-teacher-letter { font-size: 0.8rem; font-weight: 700; color: #fff; }
</style>
