<script lang="ts">
	import { tick } from 'svelte';
	import { Palette, X, Check } from 'lucide-svelte';
	import { POSTER_THEMES } from '$lib/data/posters';

	interface Props {
		selectedTheme: string;
		isEn?: boolean;
		compact?: boolean;
		onSelect: (themeId: string) => void;
	}

	let { selectedTheme, isEn = false, compact = false, onSelect }: Props = $props();

	let open = $state(false);
	let toggleButton = $state<HTMLButtonElement | null>(null);

	async function close() {
		open = false;
		await tick();
		toggleButton?.focus();
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (!open || event.key !== 'Escape') return;
		void close();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="poster-theme-picker" data-testid="poster-theme-picker-container">
	<button
		type="button"
		class="picker-toggle-btn"
		class:active={open}
		bind:this={toggleButton}
		onclick={() => (open ? close() : (open = true))}
		aria-expanded={open}
		aria-controls="poster-theme-panel"
		aria-label={isEn ? 'Poster background color' : 'Фон афіші'}
		title={isEn ? 'Poster background color' : 'Фон афіші'}
		data-testid="poster-theme-open-btn"
	>
		<Palette size={16} aria-hidden="true" />
		<span>{isEn ? 'Background' : 'Фон'}</span>
	</button>

	{#if open}
		<div
			class="picker-panel"
			class:compact
			id="poster-theme-panel"
			role="group"
			aria-label={isEn ? 'Poster background' : 'Фон афіші'}
			data-testid="poster-theme-panel"
		>
			<div class="panel-header">
				<div class="panel-title-wrap">
					<span class="panel-title">{isEn ? 'Poster Background' : 'Фон афіші'}</span>
					<span class="panel-subtitle">{isEn ? 'Solid color (no gradient)' : 'Однотонний колір (без градієнта)'}</span>
				</div>
				<button
					type="button"
					class="panel-close-btn"
					onclick={close}
					aria-label={isEn ? 'Close' : 'Закрити'}
					data-testid="poster-theme-close-btn"
				>
					<X size={15} aria-hidden="true" />
				</button>
			</div>

			<div class="theme-grid">
				{#each POSTER_THEMES as theme (theme.id)}
					{@const isSelected = selectedTheme === theme.id}
					<button
						type="button"
						class="theme-btn"
						class:theme-btn--active={isSelected}
						onclick={() => onSelect(theme.id)}
						data-testid={`poster-theme-${theme.id}-btn`}
					>
						<span
							class="color-chip"
							style:background-color={theme.color}
							aria-hidden="true"
						>
							{#if isSelected}
								<Check size={14} class="check-icon" aria-hidden="true" />
							{/if}
						</span>
						<span class="theme-name">{isEn ? theme.nameEn : theme.nameUk}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.poster-theme-picker {
		position: relative;
		z-index: 40;
	}

	.poster-theme-picker:focus-within {
		z-index: 100;
	}

	.picker-toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-main);
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.picker-toggle-btn:hover,
	.picker-toggle-btn.active {
		background: color-mix(in srgb, var(--bg-surface), var(--text-main) 6%);
		border-color: var(--accent-primary);
		color: var(--accent-text, #0077c8);
	}

	.picker-panel {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		z-index: 100;
		width: 340px;
		max-width: calc(100vw - 32px);
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 18px;
		padding: 12px;
		box-shadow:
			0 16px 36px -6px rgba(0, 0, 0, 0.28),
			0 4px 12px rgba(0, 0, 0, 0.08);
		box-sizing: border-box;
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-title-wrap {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.panel-title {
		font-size: 0.925rem;
		font-weight: 800;
		color: var(--text-title);
	}

	.panel-subtitle {
		font-size: 0.725rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.panel-close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid var(--color-border);
		background: var(--bg-surface);
		color: var(--text-muted);
		cursor: pointer;
	}

	.panel-close-btn:hover {
		background: color-mix(in srgb, var(--bg-surface), var(--text-main) 10%);
		color: var(--text-title);
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
	}

	.theme-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 9px;
		border-radius: 10px;
		border: 1.5px solid var(--color-border);
		background: var(--bg-surface);
		cursor: pointer;
		text-align: left;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
		transition: all 0.15s ease;
	}

	.theme-btn:hover {
		background: color-mix(in srgb, var(--bg-surface), var(--text-main) 6%);
		border-color: var(--accent-primary);
	}

	.theme-btn--active {
		border-color: var(--accent-primary);
		background: color-mix(in srgb, var(--bg-surface), var(--accent-primary) 18%);
	}

	.color-chip {
		position: relative;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 1.5px solid rgba(0, 0, 0, 0.2);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}

	:global(.check-icon) {
		color: #0f172a;
		stroke-width: 3;
	}

	.theme-name {
		font-size: 0.775rem;
		font-weight: 700;
		color: var(--text-main);
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.theme-btn--active .theme-name {
		color: var(--text-title);
	}
</style>
