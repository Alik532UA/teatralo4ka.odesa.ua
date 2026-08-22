<script lang="ts">
	import { t } from 'svelte-i18n';
	import { LayoutGrid, Image as ImageIcon, Grid2X2 } from 'lucide-svelte';

	export type ViewMode = 'cards' | 'gallery' | 'compact';

	interface Props {
		viewMode: ViewMode;
		onchange: (mode: ViewMode) => void;
	}

	let { viewMode, onchange }: Props = $props();
</script>

<div class="view-toggle" role="group" aria-label={$t('galaxy.viewModes.viewLabel', { default: 'Режим відображення' })} data-testid="residents-adults-view-toggle">
	<button
		type="button"
		class="view-btn"
		class:view-btn--active={viewMode === 'cards'}
		onclick={() => onchange('cards')}
		title={$t('galaxy.viewModes.cards', { default: 'Картки' })}
		data-testid="residents-adults-view-btn-cards"
	>
		<LayoutGrid size={18} aria-hidden="true" />
		<span>{$t('galaxy.viewModes.cards', { default: 'Картки' })}</span>
	</button>

	<button
		type="button"
		class="view-btn"
		class:view-btn--active={viewMode === 'gallery'}
		onclick={() => onchange('gallery')}
		title={$t('galaxy.viewModes.gallery', { default: 'Галерея' })}
		data-testid="residents-adults-view-btn-gallery"
	>
		<ImageIcon size={18} aria-hidden="true" />
		<span>{$t('galaxy.viewModes.gallery', { default: 'Галерея' })}</span>
	</button>

	<button
		type="button"
		class="view-btn"
		class:view-btn--active={viewMode === 'compact'}
		onclick={() => onchange('compact')}
		title={$t('galaxy.viewModes.compact', { default: 'Компактно' })}
		data-testid="residents-adults-view-btn-compact"
	>
		<Grid2X2 size={18} aria-hidden="true" />
		<span>{$t('galaxy.viewModes.compact', { default: 'Компактно' })}</span>
	</button>
</div>

<style>
	.view-toggle {
		display: inline-flex;
		align-items: center;
		padding: 4px;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-full, 9999px);
		box-shadow: var(--shadow-main);
		gap: 4px;
		flex-shrink: 0;
	}

	.view-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: var(--radius-full, 9999px);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.view-btn:hover {
		color: var(--text-title);
		background: var(--bg-surface);
	}

	.view-btn--active {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
	}
</style>
