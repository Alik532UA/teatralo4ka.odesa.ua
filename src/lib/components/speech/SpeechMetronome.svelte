<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Play, Square, Minus, Plus, Volume2, VolumeX } from 'lucide-svelte';

	interface Props {
		defaultBpm?: number;
		testIdPrefix?: string;
	}

	let { defaultBpm = 80, testIdPrefix = 'metronome' }: Props = $props();

	// svelte-ignore state_referenced_locally
	let bpm = $state(defaultBpm);
	let isRunning = $state(false);
	let isMuted = $state(false);
	let beat = $state(0);
	let audioCtx: AudioContext | null = null;
	let timerId: ReturnType<typeof setInterval> | null = null;

	const PRESETS = [
		{ bpm: 60, label: '60 повільно' },
		{ bpm: 80, label: '80 спокійно' },
		{ bpm: 100, label: '100 помірно' },
		{ bpm: 120, label: '120 швидко' }
	];

	function initAudio() {
		if (!audioCtx && typeof window !== 'undefined') {
			const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (AudioContextClass) audioCtx = new AudioContextClass();
		}
		if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
	}

	function playClick(isAccent: boolean) {
		if (isMuted || !audioCtx) return;
		try {
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(isAccent ? 1000 : 750, audioCtx.currentTime);
			gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
			osc.connect(gain);
			gain.connect(audioCtx.destination);
			osc.start();
			osc.stop(audioCtx.currentTime + 0.05);
		} catch {
			// audio policy
		}
	}

	function tick() {
		beat = (beat + 1) % 4;
		playClick(beat === 0);
	}

	function toggle() {
		if (isRunning) stop();
		else start();
	}

	function start() {
		initAudio();
		isRunning = true;
		tick();
		timerId = setInterval(tick, (60 / bpm) * 1000);
	}

	function stop() {
		isRunning = false;
		if (timerId) {
			clearInterval(timerId);
			timerId = null;
		}
		beat = 0;
	}

	function setBpm(val: number) {
		bpm = Math.min(200, Math.max(40, val));
		if (isRunning) {
			if (timerId) clearInterval(timerId);
			timerId = setInterval(tick, (60 / bpm) * 1000);
		}
	}

	onDestroy(() => {
		if (timerId) clearInterval(timerId);
		if (audioCtx) audioCtx.close().catch(() => {});
	});
</script>

<div class="metronome-card" data-testid={`${testIdPrefix}-card`}>
	<div class="metronome-header">
		<span class="metronome-badge">Ритм-тренажер</span>
		<span class="metronome-title">Метроном для дикції</span>
	</div>

	<div class="metronome-body">
		<div class="metronome-display">
			<div class="bpm-counter">
				<span class="bpm-value" data-testid={`${testIdPrefix}-bpm-value`}>{bpm}</span>
				<span class="bpm-unit">BPM</span>
			</div>
			<div class="beats-row" role="group" aria-label="Пульс частки">
				{#each [0, 1, 2, 3] as i (i)}
					<span
						class="beat-dot"
						class:beat-dot--active={isRunning && beat === i}
						class:beat-dot--accent={i === 0}
					></span>
				{/each}
			</div>
		</div>

		<div class="metronome-controls">
			<button
				type="button"
				class="step-btn"
				onclick={() => setBpm(bpm - 5)}
				aria-label="Зменшити темп на 5"
				data-testid={`${testIdPrefix}-minus-5-btn`}
			>-5</button>
			<button
				type="button"
				class="step-btn"
				onclick={() => setBpm(bpm - 1)}
				aria-label="Зменшити темп на 1"
				data-testid={`${testIdPrefix}-minus-1-btn`}
			><Minus size={14} aria-hidden="true" /></button>

			<input
				type="range"
				min="40"
				max="180"
				value={bpm}
				oninput={(e) => setBpm(Number((e.target as HTMLInputElement).value))}
				class="bpm-slider"
				aria-label="Темп метронома (BPM)"
				data-testid={`${testIdPrefix}-slider`}
			/>

			<button
				type="button"
				class="step-btn"
				onclick={() => setBpm(bpm + 1)}
				aria-label="Збільшити темп на 1"
				data-testid={`${testIdPrefix}-plus-1-btn`}
			><Plus size={14} aria-hidden="true" /></button>
			<button
				type="button"
				class="step-btn"
				onclick={() => setBpm(bpm + 5)}
				aria-label="Збільшити темп на 5"
				data-testid={`${testIdPrefix}-plus-5-btn`}
			>+5</button>
		</div>

		<div class="metronome-actions">
			<button
				type="button"
				class="main-toggle-btn"
				class:main-toggle-btn--running={isRunning}
				onclick={toggle}
				data-testid={`${testIdPrefix}-toggle-btn`}
			>
				{#if isRunning}
					<Square size={16} aria-hidden="true" />
					<span>Зупинити</span>
				{:else}
					<Play size={16} aria-hidden="true" />
					<span>Старт ритму</span>
				{/if}
			</button>

			<button
				type="button"
				class="mute-btn"
				class:mute-btn--muted={isMuted}
				onclick={() => (isMuted = !isMuted)}
				aria-label={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
				data-testid={`${testIdPrefix}-mute-btn`}
			>
				{#if isMuted}
					<VolumeX size={18} aria-hidden="true" />
				{:else}
					<Volume2 size={18} aria-hidden="true" />
				{/if}
			</button>
		</div>

		<div class="presets-row">
			{#each PRESETS as p (p.bpm)}
				<button
					type="button"
					class="preset-pill"
					onclick={() => setBpm(p.bpm)}
					data-testid={`${testIdPrefix}-preset-${p.bpm}-btn`}
				>{p.label}</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.metronome-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 16px;
		padding: 1.25rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	}
	.metronome-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
	.metronome-badge {
		font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;
		background: var(--palette-orange); color: var(--palette-black); padding: 0.2rem 0.6rem; border-radius: 20px;
	}
	.metronome-title { font-size: 0.95rem; font-weight: 600; color: var(--text-title); }
	.metronome-body { display: flex; flex-direction: column; gap: 1rem; }
	.metronome-display {
		display: flex; align-items: center; justify-content: space-between;
		background: var(--color-surface); border-radius: 12px; padding: 0.75rem 1.25rem;
	}
	.bpm-counter { display: flex; align-items: baseline; gap: 0.35rem; }
	.bpm-value { font-size: 2.2rem; font-weight: 800; line-height: 1; color: var(--text-title); font-variant-numeric: tabular-nums; }
	.bpm-unit { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
	.beats-row { display: flex; gap: 0.5rem; align-items: center; }
	.beat-dot {
		width: 14px; height: 14px; border-radius: 50%;
		background: var(--color-border); transition: transform 0.08s ease, background 0.08s ease;
	}
	.beat-dot--active { background: var(--palette-blue); transform: scale(1.35); box-shadow: 0 0 10px var(--palette-blue); }
	.beat-dot--accent.beat-dot--active { background: var(--palette-red); box-shadow: 0 0 12px var(--palette-red); }
	.metronome-controls { display: flex; align-items: center; gap: 0.5rem; }
	.step-btn {
		background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px;
		min-width: 34px; height: 34px; font-size: 0.85rem; font-weight: 600; color: var(--text-title);
		display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s ease;
	}
	.step-btn:hover { background: var(--palette-yellow); color: var(--palette-black); }
	.bpm-slider { flex: 1; accent-color: var(--palette-orange); cursor: pointer; }
	.metronome-actions { display: flex; gap: 0.75rem; align-items: center; }
	.main-toggle-btn {
		flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
		padding: 0.7rem 1.25rem; border-radius: 10px; border: none; background: var(--palette-blue);
		color: var(--palette-black); font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: filter 0.15s ease;
	}
	.main-toggle-btn:hover { filter: brightness(1.08); }
	.main-toggle-btn--running { background: var(--palette-red); color: #ffffff; }
	.mute-btn {
		width: 42px; height: 42px; border-radius: 10px; border: 1px solid var(--color-border);
		background: var(--color-surface); color: var(--text-title); display: inline-flex;
		align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s ease;
	}
	.mute-btn--muted { color: var(--palette-red); }
	.presets-row { display: flex; gap: 0.4rem; flex-wrap: wrap; }
	.preset-pill {
		padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 6px; border: 1px solid var(--color-border);
		background: transparent; color: var(--text-muted); cursor: pointer; transition: all 0.15s ease;
	}
	.preset-pill:hover { background: var(--palette-yellow); color: var(--palette-black); border-color: transparent; }
</style>
