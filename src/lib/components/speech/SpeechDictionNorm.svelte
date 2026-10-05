<script lang="ts">
	import rawExercises from '$lib/data/stage-speech/diction-norm.data.json';
	import { ArrowLeft, ArrowRight, BookOpen, Volume2 } from 'lucide-svelte';

	interface ExerciseItem {
		pattern: string;
		phrase: string;
	}

	interface Exercise {
		id: number;
		title: string;
		sounds: string;
		rule: string;
		groups: ExerciseItem[][];
	}

	interface Props {
		testIdPrefix?: string;
		currentIdx?: number;
	}

	let { testIdPrefix = 'diction-norm', currentIdx = $bindable(0) }: Props = $props();

	const exercises = rawExercises as Exercise[];
	let cardEl = $state<HTMLElement | null>(null);

	const current = $derived(exercises[currentIdx]);
	const prevExercise = $derived(currentIdx > 0 ? exercises[currentIdx - 1] : null);
	const nextExercise = $derived(currentIdx < exercises.length - 1 ? exercises[currentIdx + 1] : null);

	function setIdx(i: number, scroll = false) {
		currentIdx = Math.max(0, Math.min(exercises.length - 1, i));
		if (scroll && cardEl && typeof window !== 'undefined') {
			const rect = cardEl.getBoundingClientRect();
			if (rect.top < 80) {
				const top = rect.top + window.scrollY - 90;
				window.scrollTo({ top, behavior: 'smooth' });
			}
		}
	}
</script>

<div class="diction-hub" data-testid={`${testIdPrefix}-container`}>
	<nav class="exercise-nav" aria-label="Вибір вправи за звуками">
		<div class="chips-scroll">
			{#each exercises as ex, i (ex.id)}
				<button
					type="button"
					class="nav-chip"
					class:nav-chip--active={i === currentIdx}
					onclick={() => setIdx(i, true)}
					data-testid={`${testIdPrefix}-chip-btn-${ex.id}`}
				>
					<span class="chip-num">#{ex.id}</span>
					<span class="chip-sound">{ex.sounds}</span>
				</button>
			{/each}
		</div>
	</nav>

	<article class="exercise-card" bind:this={cardEl} data-testid={`${testIdPrefix}-panel`}>
		<header class="exercise-header">
			<div class="header-main">
				<span class="exercise-badge">
					<BookOpen size={13} aria-hidden="true" />
					<span>{current.title}</span>
				</span>
				<h2 class="exercise-title">Звуки: {current.sounds}</h2>
			</div>

			<div class="exercise-stepper">
				<button
					type="button"
					class="step-btn"
					disabled={currentIdx === 0}
					onclick={() => setIdx(currentIdx - 1, true)}
					title="Попередня вправа"
					data-testid={`${testIdPrefix}-prev-btn`}
				>
					<ArrowLeft size={16} aria-hidden="true" />
					<span>Попередня</span>
				</button>
				<span class="step-indicator">{currentIdx + 1} / {exercises.length}</span>
				<button
					type="button"
					class="step-btn"
					disabled={currentIdx === exercises.length - 1}
					onclick={() => setIdx(currentIdx + 1, true)}
					title="Наступна вправа"
					data-testid={`${testIdPrefix}-next-btn`}
				>
					<span>Наступна</span>
					<ArrowRight size={16} aria-hidden="true" />
				</button>
			</div>
		</header>

		<div class="rule-box" data-testid={`${testIdPrefix}-rule-banner`}>
			<span class="rule-icon" aria-hidden="true"><Volume2 size={20} /></span>
			<div class="diction-rule-content">
				<strong class="rule-title">Артикуляційне правило:</strong>
				<p class="rule-text">{current.rule}</p>
			</div>
		</div>

		<div class="groups-container">
			{#each current.groups as grp, gIdx (gIdx)}
				<div class="rhyme-group">
					{#each grp as item, itemIdx (itemIdx)}
						<div class="rhyme-row">
							{#if item.pattern}
								<span class="rhyme-pattern">{item.pattern}</span>
								<span class="rhyme-divider" aria-hidden="true">—</span>
							{/if}
							<span class="rhyme-phrase">{item.phrase}</span>
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<footer class="exercise-footer" data-testid={`${testIdPrefix}-footer-stepper`}>
			<button
				type="button"
				class="footer-step-btn footer-step-btn--prev"
				disabled={!prevExercise}
				onclick={() => setIdx(currentIdx - 1, true)}
				data-testid={`${testIdPrefix}-bottom-prev-btn`}
			>
				<span class="footer-step-arrow" aria-hidden="true"><ArrowLeft size={16} /></span>
				<div class="footer-step-meta">
					<span class="footer-step-label">Попередня вправа</span>
					{#if prevExercise}
						<span class="footer-step-target">#{prevExercise.id} {prevExercise.sounds}</span>
					{/if}
				</div>
			</button>

			<div class="footer-step-center">
				<span class="footer-step-count">{currentIdx + 1} з {exercises.length}</span>
				<span class="footer-step-name">{current.sounds}</span>
			</div>

			<button
				type="button"
				class="footer-step-btn footer-step-btn--next"
				disabled={!nextExercise}
				onclick={() => setIdx(currentIdx + 1, true)}
				data-testid={`${testIdPrefix}-bottom-next-btn`}
			>
				<div class="footer-step-meta footer-step-meta--right">
					<span class="footer-step-label">Наступна вправа</span>
					{#if nextExercise}
						<span class="footer-step-target">#{nextExercise.id} {nextExercise.sounds}</span>
					{/if}
				</div>
				<span class="footer-step-arrow footer-step-arrow--accent" aria-hidden="true"><ArrowRight size={16} /></span>
			</button>
		</footer>
	</article>
</div>

<style>
	.diction-hub { display: flex; flex-direction: column; gap: 1.5rem; min-width: 0; max-width: 100%; }
	.exercise-nav {
		background: var(--bg-card); border: 1px solid var(--color-border);
		border-radius: 16px; padding: 0.75rem;
		min-width: 0; max-width: 100%;
	}
	.chips-scroll {
		display: flex; flex-wrap: wrap; gap: 0.5rem;
		max-width: 100%;
	}
	.nav-chip {
		display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem;
		border-radius: 10px; border: 1px solid transparent; background: var(--color-surface);
		color: var(--text-muted); font-size: 0.88rem; font-weight: 700; cursor: pointer;
		white-space: nowrap; transition: all 0.15s ease;
	}
	.nav-chip:hover { color: var(--text-title); border-color: var(--color-border); }
	.nav-chip--active {
		background: var(--palette-yellow); color: var(--palette-black); border-color: transparent;
	}
	.chip-num { font-size: 0.75rem; opacity: 0.8; }
	.exercise-card {
		background: var(--bg-card); border: 1px solid var(--color-border);
		border-radius: 20px; padding: clamp(1rem, 3vw, 2rem); display: flex; flex-direction: column; gap: 1.5rem;
		min-width: 0; max-width: 100%;
	}
	.exercise-header {
		display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
		gap: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1.25rem;
	}
	.header-main { display: flex; flex-direction: column; gap: 0.4rem; }
	.exercise-badge {
		display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem;
		font-weight: 800; text-transform: uppercase; color: var(--warning-color);
	}
	.exercise-title { margin: 0; font-size: 1.6rem; font-weight: 800; color: var(--text-title); }
	.exercise-stepper { display: flex; align-items: center; gap: 0.75rem; }
	.step-btn {
		display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem;
		border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-surface);
		color: var(--text-title); font-size: 0.85rem; font-weight: 600; cursor: pointer;
		transition: all 0.15s ease;
	}
	.step-btn:hover:not(:disabled) { border-color: var(--accent-text); color: var(--accent-text); }
	.step-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.step-indicator { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
	.rule-box {
		display: flex; gap: 1rem; padding: 1.1rem 1.4rem; background: var(--color-surface);
		border: 1px solid var(--color-border); border-left: 4px solid var(--palette-orange);
		border-radius: 12px;
	}
	.rule-icon { color: var(--palette-orange); flex-shrink: 0; margin-top: 0.15rem; }
	.diction-rule-content { display: flex; flex-direction: column; gap: 0.3rem; }
	.rule-title { font-size: 0.9rem; font-weight: 700; color: var(--text-title); }
	.rule-text { margin: 0; font-size: 0.95rem; line-height: 1.5; color: var(--text-muted); }
	.groups-container {
		display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
		gap: 1.25rem;
	}
	.rhyme-group {
		background: var(--color-surface); border: 1px solid var(--color-border);
		border-radius: 14px; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem;
	}
	.rhyme-row { display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.98rem; flex-wrap: wrap; }
	.rhyme-pattern {
		font-family: var(--font-heading, monospace); font-weight: 800;
		color: var(--accent-text, var(--palette-orange)); white-space: nowrap;
	}
	.rhyme-divider { color: var(--text-muted); opacity: 0.5; }
	.rhyme-phrase { color: var(--text-title); font-weight: 600; word-break: break-word; }

	/* ─── Bottom Footer Stepper ─── */
	.exercise-footer {
		display: flex; align-items: center; justify-content: space-between;
		gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);
	}
	.footer-step-btn {
		display: inline-flex; align-items: center; gap: 0.75rem; padding: 0.7rem 1.1rem;
		border-radius: 12px; background: var(--color-surface); border: 1px solid var(--color-border);
		color: var(--text-title); cursor: pointer; transition: all 0.18s ease;
	}
	.footer-step-btn:hover:not(:disabled) {
		border-color: var(--accent-text); transform: translateY(-2px);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
	}
	.footer-step-btn:disabled { opacity: 0.35; cursor: not-allowed; }
	.footer-step-btn--next {
		background: var(--palette-yellow); color: var(--palette-black);
		border-color: transparent; font-weight: 700;
	}
	.footer-step-btn--next:hover:not(:disabled) { filter: brightness(1.05); }
	.footer-step-arrow { display: inline-flex; align-items: center; justify-content: center; }
	.footer-step-meta { display: flex; flex-direction: column; gap: 0.15rem; text-align: left; }
	.footer-step-meta--right { text-align: right; }
	.footer-step-label {
		font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; opacity: 0.8;
	}
	.footer-step-target { font-size: 0.92rem; font-weight: 800; }
	.footer-step-center { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
	.footer-step-count { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
	.footer-step-name { font-size: 0.95rem; font-weight: 800; color: var(--text-title); }

	@media (max-width: 600px) {
		.exercise-footer { flex-direction: column; align-items: stretch; }
		.footer-step-btn { justify-content: center; width: 100%; }
		.footer-step-btn--prev { order: 2; }
		.footer-step-center { order: 1; margin-bottom: 0.5rem; }
		.footer-step-btn--next { order: 3; }
	}
</style>
