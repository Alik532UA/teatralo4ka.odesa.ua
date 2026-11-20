<script lang="ts">
	import { focusTrap } from '$lib/utils/focusTrap';
	import { errorLogger, type ErrorEvent, type LogLevel } from '$lib/services/errorLogger';
	import { buildLogReport } from '$lib/services/errorReport';
	import { showReportFallback } from '$lib/services/perfLog';
	import { AlertCircle, AlertTriangle, Bug, Check, Copy, Info, Trash2, X } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { t } from 'svelte-i18n';

	interface Props {
		isOpen: boolean;
		onclose: () => void;
	}

	let { isOpen, onclose }: Props = $props();

	type FilterType = 'all' | LogLevel;
	let activeFilter = $state<FilterType>('all');
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	let cache = $state<ErrorEvent[]>([]);

	$effect(() => {
		if (isOpen) {
			cache = errorLogger.getCache();
			const unsubscribe = errorLogger.subscribe(() => {
				cache = errorLogger.getCache();
			});
			return () => unsubscribe();
		}
	});

	onDestroy(() => {
		if (copyTimer) clearTimeout(copyTimer);
	});

	const errorCount = $derived(cache.filter((e) => e.level === 'error').length);
	const warnCount = $derived(cache.filter((e) => e.level === 'warn').length);
	const infoCount = $derived(cache.filter((e) => e.level === 'info').length);

	const filteredList = $derived(
		(activeFilter === 'all' ? cache : cache.filter((e) => e.level === activeFilter))
			.slice()
			.reverse()
	);

	async function handleCopy() {
		const report = buildLogReport();
		try {
			await navigator.clipboard.writeText(report);
			copied = true;
			if (copyTimer) clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 1500);
		} catch (error) {
			errorLogger.logWarning('не вдалося скопіювати звіт з модалки', { component: 'ErrorLogModal' }, error);
			showReportFallback(report);
		}
	}

	function handleClear() {
		errorLogger.clearCache();
		cache = [];
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
		}
	}

	function formatTime(iso: string): string {
		try {
			const d = new Date(iso);
			return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		} catch {
			return iso;
		}
	}
</script>

{#if isOpen}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-labelledby="error-log-modal-title"
		data-testid="error-log-modal-overlay"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
		onkeydown={handleKeydown}
		{@attach focusTrap()}
	>
		<div class="modal-card" data-testid="error-log-modal-container">
			<div class="modal-header" data-testid="error-log-modal-header">
				<div class="header-left">
					<div class="icon-wrap">
						<Bug size={18} />
					</div>
					<div>
						<h2 id="error-log-modal-title" class="modal-title" data-testid="error-log-modal-title">
							Журнал помилок та подій
						</h2>
						<span class="version-badge">v{errorLogger.appVersion}</span>
					</div>
				</div>
				<button
					type="button"
					class="btn-close"
					onclick={onclose}
					aria-label={$t('common.close')}
					data-testid="error-log-modal-close-btn"
				>
					<X size={18} />
				</button>
			</div>

			<div class="modal-toolbar">
				<div class="tabs" role="tablist" data-testid="error-log-modal-tabs">
					<button
						type="button"
						role="tab"
						aria-selected={activeFilter === 'all'}
						class="tab"
						class:tab--active={activeFilter === 'all'}
						onclick={() => (activeFilter = 'all')}
						data-testid="error-log-modal-all-tab"
					>
						Всі <span class="tab-badge">{cache.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeFilter === 'error'}
						class="tab"
						class:tab--active={activeFilter === 'error'}
						onclick={() => (activeFilter = 'error')}
						data-testid="error-log-modal-error-tab"
					>
						Помилки <span class="tab-badge tab-badge--error">{errorCount}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeFilter === 'warn'}
						class="tab"
						class:tab--active={activeFilter === 'warn'}
						onclick={() => (activeFilter = 'warn')}
						data-testid="error-log-modal-warn-tab"
					>
						Увага <span class="tab-badge tab-badge--warn">{warnCount}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeFilter === 'info'}
						class="tab"
						class:tab--active={activeFilter === 'info'}
						onclick={() => (activeFilter = 'info')}
						data-testid="error-log-modal-info-tab"
					>
						Інфо <span class="tab-badge tab-badge--info">{infoCount}</span>
					</button>
				</div>

				<div class="actions">
					<button
						type="button"
						class="btn-action"
						class:btn-action--copied={copied}
						onclick={handleCopy}
						data-testid="error-log-modal-copy-btn"
						title="Скопіювати повний текстовий звіт"
					>
						{#if copied}
							<Check size={14} />
							<span>Скопійовано</span>
						{:else}
							<Copy size={14} />
							<span>Копіювати звіт</span>
						{/if}
					</button>
					<button
						type="button"
						class="btn-action btn-action--danger"
						onclick={handleClear}
						disabled={cache.length === 0}
						data-testid="error-log-modal-clear-btn"
						title="Очистити журнал"
					>
						<Trash2 size={14} />
						<span>Очистити</span>
					</button>
				</div>
			</div>

			<div class="modal-body" data-testid="error-log-modal-list">
				{#if filteredList.length === 0}
					<div class="empty-state" data-testid="error-log-modal-empty-message">
						<Check size={28} class="empty-icon" />
						<p class="empty-text">Журнал порожній. Жодної події не зафіксовано!</p>
					</div>
				{:else}
					<div class="event-list">
						{#each filteredList as item (item.id)}
							<div class="event-card event-card--{item.level}">
								<div class="event-header">
									<div class="event-tags">
										{#if item.level === 'error'}
											<span class="level-pill level-pill--error">
												<AlertCircle size={11} /> ERROR
											</span>
											{#if item.severity}
												<span class="severity-pill severity-pill--{item.severity}">{item.severity}</span>
											{/if}
										{:else if item.level === 'warn'}
											<span class="level-pill level-pill--warn">
												<AlertTriangle size={11} /> WARN
											</span>
										{:else}
											<span class="level-pill level-pill--info">
												<Info size={11} /> INFO
											</span>
										{/if}
										<span class="meta-pill">{item.context.component || 'app'}</span>
										{#if item.context.page}
											<span class="meta-pill">{item.context.page}</span>
										{/if}
									</div>
									<time class="event-time" title={item.context.timestamp}>
										{formatTime(item.context.timestamp)}
									</time>
								</div>
								<div class="event-message">{item.message}</div>
								{#if item.stack}
									<details class="event-stack">
										<summary>Стек викликів</summary>
										<pre>{item.stack}</pre>
									</details>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10001;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
	.modal-card {
		background: var(--bg-card, #1c1c1f);
		color: var(--text-main, #ffffff);
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
		border-radius: 16px;
		width: 100%;
		max-width: 800px;
		max-height: 85dvh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 18px;
		border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: var(--bg-surface, rgba(255, 255, 255, 0.03));
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}
	.modal-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		line-height: 1.2;
		color: var(--text-title, var(--text-main, #ffffff));
	}
	.version-badge {
		font-size: 0.6875rem;
		font-family: ui-monospace, monospace;
		opacity: 0.6;
	}
	.btn-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: transparent;
		border: none;
		color: var(--text-muted, rgba(255, 255, 255, 0.7));
		cursor: pointer;
	}
	.btn-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-main, #ffffff);
	}
	.modal-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		padding: 10px 18px;
		border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
	}
	.tabs {
		display: flex;
		gap: 4px;
		background: rgba(0, 0, 0, 0.25);
		padding: 3px;
		border-radius: 8px;
	}
	.tab {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 8px;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: var(--text-muted, rgba(255, 255, 255, 0.7));
		cursor: pointer;
	}
	.tab--active {
		background: var(--bg-card, #27272a);
		color: var(--text-main, #ffffff);
	}
	.tab-badge {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 1px 4px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
	}
	.tab-badge--error {
		background: #7f1d1d;
		color: #ffffff;
	}
	.tab-badge--warn {
		background: #78350f;
		color: #ffffff;
	}
	.tab-badge--info {
		background: #1e3a8a;
		color: #ffffff;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.btn-action {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
		background: var(--bg-surface, rgba(255, 255, 255, 0.05));
		color: var(--text-main, #ffffff);
		cursor: pointer;
	}
	.btn-action:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}
	.btn-action:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn-action--copied {
		background: #237a35 !important;
		color: #ffffff !important;
		border-color: #1b5e20 !important;
	}
	.btn-action--danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.15);
		border-color: #ef4444;
		color: #ef4444;
	}
	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 14px 18px;
		background: rgba(0, 0, 0, 0.15);
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 16px;
		text-align: center;
		color: var(--text-muted, rgba(255, 255, 255, 0.6));
	}
	.empty-state :global(.empty-icon) {
		color: #22c55e;
		margin-bottom: 8px;
	}
	.empty-text {
		font-size: 0.875rem;
		margin: 0;
	}
	.event-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.event-card {
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--bg-card, #232326);
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		border-left-width: 3px;
	}
	.event-card--error {
		border-left-color: #ef4444;
	}
	.event-card--warn {
		border-left-color: #f59e0b;
	}
	.event-card--info {
		border-left-color: #3b82f6;
	}
	.event-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		margin-bottom: 4px;
		flex-wrap: wrap;
	}
	.event-tags {
		display: flex;
		align-items: center;
		gap: 5px;
		flex-wrap: wrap;
	}
	.level-pill {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.625rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 4px;
	}
	.level-pill--error {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}
	.level-pill--warn {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
	}
	.level-pill--info {
		background: rgba(59, 130, 246, 0.2);
		color: #3b82f6;
	}
	.severity-pill {
		font-size: 0.625rem;
		padding: 1px 4px;
		border-radius: 3px;
		font-weight: 600;
		text-transform: uppercase;
	}
	.severity-pill--critical {
		background: #7f1d1d;
		color: #fecaca;
	}
	.severity-pill--high {
		background: #991b1b;
		color: #fee2e2;
	}
	.severity-pill--medium {
		background: #854d0e;
		color: #fef08a;
	}
	.severity-pill--low {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-muted, #a1a1aa);
	}
	.meta-pill {
		font-size: 0.625rem;
		font-family: ui-monospace, monospace;
		padding: 1px 5px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-muted, rgba(255, 255, 255, 0.7));
	}
	.event-time {
		font-size: 0.6875rem;
		font-family: ui-monospace, monospace;
		color: var(--text-muted, rgba(255, 255, 255, 0.5));
	}
	.event-message {
		font-size: 0.8125rem;
		line-height: 1.35;
		margin: 0;
		word-break: break-word;
		font-family: ui-monospace, monospace;
	}
	.event-stack {
		margin-top: 6px;
		border-top: 1px dashed rgba(255, 255, 255, 0.1);
		padding-top: 4px;
	}
	.event-stack summary {
		font-size: 0.6875rem;
		color: var(--text-muted, rgba(255, 255, 255, 0.6));
		cursor: pointer;
	}
	.event-stack pre {
		margin: 4px 0 0 0;
		padding: 6px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.35);
		color: var(--text-muted, #cbd5e1);
		font-size: 0.6875rem;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>
