<script lang="ts">
	import { Play, Pause, RotateCcw, History, Sparkles } from 'lucide-svelte';
	import type { HistoryDailySnapshot } from '$lib/data/stats';

	interface Props {
		snapshots: HistoryDailySnapshot[];
		selectedIndex: number;
		currentLang: 'uk' | 'en';
	}

	let {
		snapshots,
		selectedIndex = $bindable(),
		currentLang
	}: Props = $props();

	let isPlaying = $state(false);
	let playInterval: ReturnType<typeof setInterval> | null = null;

	const isEn = $derived(currentLang === 'en');
	const maxIndex = $derived(Math.max(0, snapshots.length - 1));
	const currentSnapshot = $derived<HistoryDailySnapshot | undefined>(snapshots[selectedIndex]);
	const isToday = $derived(selectedIndex >= maxIndex);

	function formatDate(dateStr: string): string {
		try {
			const [y, m, d] = dateStr.split('-').map(Number);
			const date = new Date(y, m - 1, d);
			return new Intl.DateTimeFormat(isEn ? 'en-US' : 'uk-UA', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}).format(date);
		} catch {
			return dateStr;
		}
	}

	function formatShortDate(dateStr: string): string {
		try {
			const [y, m, d] = dateStr.split('-').map(Number);
			const date = new Date(y, m - 1, d);
			return new Intl.DateTimeFormat(isEn ? 'en-US' : 'uk-UA', {
				day: 'numeric',
				month: 'short'
			}).format(date);
		} catch {
			return dateStr;
		}
	}

	function stopPlayback() {
		isPlaying = false;
		if (playInterval) {
			clearInterval(playInterval);
			playInterval = null;
		}
	}

	function togglePlayback() {
		if (isPlaying) {
			stopPlayback();
		} else {
			if (selectedIndex >= maxIndex) {
				selectedIndex = 0;
			}
			isPlaying = true;
			playInterval = setInterval(() => {
				if (selectedIndex < maxIndex) {
					selectedIndex++;
				} else {
					stopPlayback();
				}
			}, 700);
		}
	}

	function jumpToToday() {
		stopPlayback();
		selectedIndex = maxIndex;
	}

	$effect(() => {
		return () => {
			if (playInterval) clearInterval(playInterval);
		};
	});
</script>

{#if snapshots.length > 1}
	<section class="timeline-card" aria-label={isEn ? 'History timeline' : 'Хроніка наповнення архіву'}>
		<div class="timeline-header">
			<div class="timeline-title-wrap">
				<History size={18} class="timeline-icon" aria-hidden="true" />
				<h2 class="timeline-title">
					{isEn ? 'Archive History Timeline' : 'Хроніка наповнення архіву'}
				</h2>
				{#if isToday}
					<span class="timeline-badge timeline-badge--live">
						<Sparkles size={13} aria-hidden="true" />
						<span>{isEn ? 'Today (Live)' : 'Сьогодні (Актуальні дані)'}</span>
					</span>
				{:else}
					<span class="timeline-badge timeline-badge--history">
						<span>{isEn ? 'Archive snapshot' : 'Архівний зріз на 00:00'}</span>
					</span>
				{/if}
			</div>

			<div class="timeline-actions">
				<button
					type="button"
					class="timeline-btn timeline-btn--play"
					onclick={togglePlayback}
					aria-label={isPlaying ? (isEn ? 'Pause animation' : 'Призупинити') : (isEn ? 'Play timeline animation' : 'Запустити хроніку')}
					data-testid="stats-timeline-play-btn"
				>
					{#if isPlaying}
						<Pause size={16} aria-hidden="true" />
						<span>{isEn ? 'Pause' : 'Пауза'}</span>
					{:else}
						<Play size={16} aria-hidden="true" />
						<span>{isEn ? 'Play History' : '▶ Хроніка'}</span>
					{/if}
				</button>

				{#if !isToday}
					<button
						type="button"
						class="timeline-btn timeline-btn--reset"
						onclick={jumpToToday}
						aria-label={isEn ? 'Jump to today' : 'Повернутися до сьогодні'}
						data-testid="stats-timeline-reset-btn"
					>
						<RotateCcw size={14} aria-hidden="true" />
						<span>{isEn ? 'To Today' : 'До сьогодні'}</span>
					</button>
				{/if}
			</div>
		</div>

		<div class="timeline-controls">
			<input
				type="range"
				class="timeline-slider"
				min="0"
				max={maxIndex}
				step="1"
				bind:value={selectedIndex}
				oninput={() => {
					if (isPlaying) stopPlayback();
				}}
				aria-label={isEn ? 'Timeline date slider' : 'Повзунок дат хроніки'}
			/>

			<div class="timeline-scale">
				<span class="timeline-date-edge">{formatShortDate(snapshots[0].date)}</span>
				<div class="timeline-current-bubble">
					<strong class="timeline-bubble-date">
						{currentSnapshot ? formatDate(currentSnapshot.date) : ''}
					</strong>
					{#if currentSnapshot}
						<span class="timeline-bubble-score">
							{currentSnapshot.overallPercent}%
						</span>
					{/if}
				</div>
				<span class="timeline-date-edge">{isEn ? 'Today' : 'Сьогодні'}</span>
			</div>
		</div>
	</section>
{/if}

<style>
	.timeline-card {
		margin-bottom: 24px;
		padding: 18px 20px;
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}
	.timeline-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		margin-bottom: 18px;
	}
	.timeline-title-wrap { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
	:global(.timeline-icon) { color: var(--accent-primary); }
	.timeline-title { margin: 0; font-size: 1.12rem; font-weight: 700; color: var(--text-title); }
	.timeline-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 9px;
		font-size: 0.76rem;
		font-weight: 600;
		border-radius: 20px;
	}
	.timeline-badge--live {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		border: 1px solid rgba(16, 185, 129, 0.3);
	}
	.timeline-badge--history {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.3);
	}
	.timeline-actions { display: flex; align-items: center; gap: 8px; }
	.timeline-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px;
		font-size: 0.82rem;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
	}
	.timeline-btn--play {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		border: 1px solid transparent;
	}
	.timeline-btn--play:hover { transform: translateY(-1px); filter: brightness(1.1); }
	.timeline-btn--reset {
		background: var(--bg-card);
		color: var(--text-title);
		border: 1px solid var(--border-main);
	}
	.timeline-btn--reset:hover {
		background: var(--bg-surface);
		border-color: var(--accent-primary);
		color: var(--text-title);
	}
	.timeline-controls { display: flex; flex-direction: column; gap: 10px; }
	.timeline-slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: var(--border-main);
		cursor: pointer;
		accent-color: var(--accent-primary);
		margin: 6px 0 2px;
	}
	.timeline-slider:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}
	.timeline-scale {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.timeline-date-edge { font-weight: 500; }
	.timeline-current-bubble {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(245, 158, 11, 0.12);
		border: 1px solid rgba(245, 158, 11, 0.25);
		padding: 3px 10px;
		border-radius: 20px;
	}
	.timeline-bubble-date { color: var(--text-title); font-size: 0.84rem; }
	.timeline-bubble-score {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		font-weight: 800;
		font-size: 0.76rem;
		padding: 1px 6px;
		border-radius: 10px;
	}
</style>
