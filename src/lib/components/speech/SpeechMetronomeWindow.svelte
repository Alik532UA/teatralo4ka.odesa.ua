<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { Activity, X, Volume2 } from 'lucide-svelte';
	import SpeechMetronome from '$lib/components/speech/SpeechMetronome.svelte';

	interface Props {
		defaultBpm?: number;
		testIdPrefix?: string;
	}

	let { defaultBpm = 84, testIdPrefix = 'speech-metronome-window' }: Props = $props();

	const isEn = $derived($locale === 'en');
	let isMetronomeOpen = $state(false);
	let isMetronomeRunning = $state(false);

	$effect(() => {
		if (!isMetronomeOpen || typeof window === 'undefined') return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') isMetronomeOpen = false;
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});
</script>

<!-- Кнопка відкриття метронома праворуч (Floating Action Button) -->
<button
	type="button"
	class="metronome-fab"
	class:metronome-fab--active={isMetronomeOpen}
	class:metronome-fab--running={isMetronomeRunning}
	onclick={() => (isMetronomeOpen = !isMetronomeOpen)}
	aria-expanded={isMetronomeOpen}
	aria-controls="diction-metronome-panel"
	aria-label={isEn ? 'Toggle metronome rhythm trainer' : 'Відкрити вікно метронома для дикції'}
	data-testid={`${testIdPrefix}-toggle-btn`}
>
	<span class="metronome-fab__icon">
		<Activity size={18} aria-hidden="true" />
	</span>
	<span class="metronome-fab__label">
		<span class="metronome-fab__title">{isEn ? 'Metronome' : 'Метроном'}</span>
		<span class="metronome-fab__status">
			{#if isMetronomeRunning}
				{isEn ? 'Active beat' : 'Ритм іде...'}
			{:else}
				{isEn ? 'Rhythm trainer' : 'Ритм-тренажер'}
			{/if}
		</span>
	</span>
</button>

<!-- Плаваюча панель метронома праворуч -->
<div
	id="diction-metronome-panel"
	class="metronome-window"
	class:is-open={isMetronomeOpen}
	aria-hidden={!isMetronomeOpen}
	data-testid={`${testIdPrefix}-panel`}
>
	<div class="metronome-window__header">
		<div class="metronome-window__title-box">
			<span class="metronome-window__icon" aria-hidden="true">
				<Activity size={16} />
			</span>
			<span class="metronome-window__title">{isEn ? 'Metronome for Diction' : 'Метроном для дикції'}</span>
		</div>
		<button
			type="button"
			class="metronome-window__close-btn"
			onclick={() => (isMetronomeOpen = false)}
			aria-label={isEn ? 'Close metronome' : 'Закрити вікно метронома'}
			data-testid={`${testIdPrefix}-close-btn`}
		>
			<X size={16} aria-hidden="true" />
		</button>
	</div>

	<div class="metronome-window__body">
		<SpeechMetronome
			{defaultBpm}
			bind:isRunning={isMetronomeRunning}
			testIdPrefix={`${testIdPrefix}-metronome`}
		/>

		<div class="advice-card" data-testid={`${testIdPrefix}-advice-card`}>
			<div class="advice-header">
				<Volume2 size={16} aria-hidden="true" />
				<span class="advice-title">{isEn ? 'Methodology' : 'Методичні поради'}</span>
			</div>
			<ul class="advice-list">
				<li>{isEn ? 'Start slowly (60–70 BPM), strictly checking tongue and lip positions.' : 'Починайте в повільному темпі (60–70 BPM), відчуваючи положення язика та щелепи.'}</li>
				<li>{isEn ? 'Keep sound energy focused on consonants without muffling vowels.' : 'Чітко вистрілюйте приголосні, не «ковтаючи» закінчення складів.'}</li>
				<li>{isEn ? 'Gradually accelerate to 100–120 BPM once accuracy is solid.' : 'Прискорюйте метроном лише тоді, коли всі склади звучать кришталево чисто.'}</li>
			</ul>
		</div>
	</div>
</div>

<style>
	/* ─── Floating Metronome Trigger & Panel (Праворуч) ─── */
	.metronome-fab {
		position: fixed;
		top: calc(var(--header-height, 72px) + 20px);
		right: 24px;
		z-index: 70;
		display: inline-flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.6rem 1.1rem;
		border-radius: 9999px;
		background: var(--bg-card);
		border: 1.5px solid var(--color-border);
		box-shadow: 0 6px 22px rgba(0, 0, 0, 0.14);
		color: var(--text-title);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		backdrop-filter: blur(10px);
	}
	.metronome-fab:hover {
		transform: translateY(-2px);
		border-color: var(--accent-text);
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
	}
	.metronome-fab--active {
		border-color: var(--palette-yellow);
		background: var(--color-surface);
	}
	.metronome-fab--running {
		border-color: var(--palette-orange);
		box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.25), 0 8px 28px rgba(0, 0, 0, 0.2);
	}
	.metronome-fab__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--palette-orange);
	}
	.metronome-fab--running .metronome-fab__icon {
		animation: pulse-beat 0.8s infinite alternate;
	}
	@keyframes pulse-beat {
		from { transform: scale(1); }
		to { transform: scale(1.2); }
	}
	.metronome-fab__label {
		display: flex;
		flex-direction: column;
		text-align: left;
		line-height: 1.2;
	}
	.metronome-fab__title {
		font-size: 0.85rem;
		font-weight: 800;
	}
	.metronome-fab__status {
		font-size: 0.68rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 700;
	}
	.metronome-fab--running .metronome-fab__status {
		color: var(--palette-orange);
	}

	.metronome-window {
		position: fixed;
		top: calc(var(--header-height, 72px) + 74px);
		right: 24px;
		z-index: 75;
		width: 330px;
		max-width: calc(100vw - 32px);
		max-height: calc(100dvh - var(--header-height, 72px) - 96px);
		overflow-y: auto;
		scrollbar-width: thin;
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		box-shadow: 0 16px 44px rgba(0, 0, 0, 0.24);
		display: flex;
		flex-direction: column;
		transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s;
	}
	.metronome-window:not(.is-open) {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transform: translateY(-8px) scale(0.96);
	}
	.metronome-window.is-open {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
		transform: translateY(0) scale(1);
	}
	.metronome-window__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1rem 0.6rem;
		border-bottom: 1px solid var(--color-border);
	}
	.metronome-window__title-box {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--text-title);
		font-size: 0.85rem;
		font-weight: 800;
	}
	.metronome-window__icon {
		color: var(--palette-orange);
		display: inline-flex;
	}
	.metronome-window__close-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.metronome-window__close-btn:hover {
		color: var(--text-title);
		border-color: var(--accent-text);
		transform: scale(1.05);
	}
	.metronome-window__body {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.advice-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.advice-header {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--palette-orange);
	}
	.advice-title {
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--text-title);
	}
	.advice-list {
		margin: 0;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.45;
	}

	@media (max-width: 768px) {
		.metronome-fab {
			top: auto;
			bottom: 24px;
			right: 16px;
		}
		.metronome-window {
			top: auto;
			bottom: 84px;
			right: 16px;
		}
	}
</style>
