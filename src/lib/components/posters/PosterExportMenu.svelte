<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Printer, Download, ChevronDown, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-svelte';
	import { exportPosterAsImage, type PosterExportFormat } from '$lib/utils/posterExport';
	import type { PosterId } from '$lib/data/posters';

	let {
		posterContainer,
		posterId,
		themeId,
		isEn = false,
		isA1 = false,
		isMultiSheet = false,
		onPrint
	}: {
		posterContainer: HTMLElement | null;
		posterId: PosterId;
		themeId: string;
		isEn?: boolean;
		isA1?: boolean;
		isMultiSheet?: boolean;
		onPrint: (scope?: 'current' | 'all-book') => void;
	} = $props();

	let isOpen = $state(false);
	let exportingFormat = $state<PosterExportFormat | null>(null);
	let menuRef = $state<HTMLElement | null>(null);

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
	}

	function handlePrintClick(scope: 'current' | 'all-book' = 'current') {
		closeMenu();
		onPrint(scope);
	}

	async function handleExport(format: 'png' | 'jpg' | 'webp') {
		if (!posterContainer || exportingFormat) return;
		closeMenu();
		exportingFormat = format;
		try {
			await exportPosterAsImage(posterContainer, format, {
				posterId,
				themeId
			});
		} catch (err) {
			console.error(`Failed to export poster as ${format}:`, err);
		} finally {
			exportingFormat = null;
		}
	}

	function onWindowClick(event: MouseEvent) {
		if (isOpen && menuRef && !menuRef.contains(event.target as Node)) {
			closeMenu();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeMenu();
		}
	}

	onMount(() => {
		window.addEventListener('click', onWindowClick);
		window.addEventListener('keydown', onKeydown);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('click', onWindowClick);
			window.removeEventListener('keydown', onKeydown);
		}
	});
</script>

<div class="export-dropdown" bind:this={menuRef}>
	<button
		type="button"
		class="action-btn action-btn--save"
		onclick={toggleMenu}
		aria-expanded={isOpen}
		aria-haspopup="menu"
		title={isEn
			? 'Save or print poster (PDF, JPG, PNG, WebP)'
			: 'Зберегти або роздрукувати афішу (PDF, JPG, PNG, WebP)'}
		data-testid="posters-save-dropdown-btn"
	>
		{#if exportingFormat}
			<span class="spin-wrap"><Loader2 size={16} aria-hidden="true" /></span>
			<span>{isEn ? `Saving ${exportingFormat.toUpperCase()}...` : `Збереження ${exportingFormat.toUpperCase()}...`}</span>
		{:else}
			<Download size={16} aria-hidden="true" />
			<span>{isEn ? 'Save / Print' : 'Зберегти / Друк'}</span>
			<span class="chevron-wrap" class:chevron-wrap--open={isOpen}>
				<ChevronDown size={14} aria-hidden="true" />
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div class="export-menu" role="menu" data-testid="posters-export-menu">
			<!-- PDF / Друк -->
			<button
				type="button"
				role="menuitem"
				class="menu-item"
				onclick={() => handlePrintClick('current')}
				data-testid="export-format-pdf-btn"
			>
				<div class="item-icon-box item-icon-box--pdf">
					<Printer size={18} aria-hidden="true" />
				</div>
				<div class="item-text">
					<span class="item-title">
						PDF {isA1 ? '(A1)' : '(A4)'}{isMultiSheet ? (isEn ? ' · Current sheet' : ' · Поточний аркуш') : ''}
					</span>
					<span class="item-desc">
						{isMultiSheet
							? (isEn ? 'Print or save visible spread/sheet' : 'Лише відкритий зараз аркуш')
							: (isEn ? 'Print or save vector PDF' : 'Друк або векторний PDF')}
					</span>
				</div>
			</button>

			{#if isMultiSheet}
				<button
					type="button"
					role="menuitem"
					class="menu-item"
					onclick={() => handlePrintClick('all-book')}
					data-testid="export-format-pdf-book-btn"
				>
					<div class="item-icon-box item-icon-box--pdf">
						<Printer size={18} aria-hidden="true" />
					</div>
					<div class="item-text">
						<span class="item-title">PDF {isA1 ? '(A1)' : '(A4)'} · {isEn ? 'Entire book' : 'Вся книга'}</span>
						<span class="item-desc">{isEn ? 'All spreads / sheets in one PDF' : 'Усі розвороти / аркуші в одному PDF'}</span>
					</div>
				</button>
			{/if}

			<div class="menu-divider" role="separator"></div>

			<!-- JPG -->
			<button
				type="button"
				role="menuitem"
				class="menu-item"
				onclick={() => handleExport('jpg')}
				data-testid="export-format-jpg-btn"
			>
				<div class="item-icon-box item-icon-box--jpg">
					<ImageIcon size={18} aria-hidden="true" />
				</div>
				<div class="item-text">
					<span class="item-title">JPG</span>
					<span class="item-desc">{isEn ? 'Universal for social media' : 'Універсальний для соцмереж'}</span>
				</div>
			</button>

			<!-- PNG -->
			<button
				type="button"
				role="menuitem"
				class="menu-item"
				onclick={() => handleExport('png')}
				data-testid="export-format-png-btn"
			>
				<div class="item-icon-box item-icon-box--png">
					<ImageIcon size={18} aria-hidden="true" />
				</div>
				<div class="item-text">
					<span class="item-title">PNG</span>
					<span class="item-desc">{isEn ? 'High clarity without loss' : 'Висока чіткість без втрат'}</span>
				</div>
			</button>

			<!-- WebP -->
			<button
				type="button"
				role="menuitem"
				class="menu-item"
				onclick={() => handleExport('webp')}
				data-testid="export-format-webp-btn"
			>
				<div class="item-icon-box item-icon-box--webp">
					<Sparkles size={18} aria-hidden="true" />
				</div>
				<div class="item-text">
					<span class="item-title">WebP</span>
					<span class="item-desc">{isEn ? 'Compact modern web image' : 'Компактний веб-формат'}</span>
				</div>
			</button>
		</div>
	{/if}
</div>

<style>
	.export-dropdown {
		position: relative;
		display: inline-flex;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 8px 14px;
		border-radius: 12px;
		font-size: 0.88rem;
		font-weight: 700;
		cursor: pointer;
		border: 1px solid var(--accent-primary, #00b5ec);
		background: var(--accent-primary, #00b5ec);
		color: var(--text-on-accent, #0f172a);
		transition: all 0.18s ease;
		box-shadow: 0 2px 8px rgba(0, 181, 236, 0.25);
	}

	.action-btn:hover {
		filter: brightness(1.06);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 181, 236, 0.35);
	}

	.chevron-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;
	}

	.chevron-wrap--open {
		transform: rotate(180deg);
	}

	.spin-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.export-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 250px;
		background: var(--bg-card, #ffffff);
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
		border-radius: 14px;
		padding: 6px;
		box-shadow:
			0 12px 32px -4px rgba(0, 0, 0, 0.18),
			0 4px 12px -2px rgba(0, 0, 0, 0.08);
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 3px;
		animation: menuFadeIn 0.15s ease-out;
	}

	@keyframes menuFadeIn {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 12px;
		border-radius: 10px;
		border: none;
		background: transparent;
		color: var(--text-main, #1e293b);
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
		width: 100%;
		box-sizing: border-box;
	}

	.menu-item:hover,
	.menu-item:focus-visible {
		background: color-mix(in srgb, var(--accent-primary, #00b5ec) 12%, transparent);
		color: var(--text-title, #0f172a);
		outline: none;
	}

	.item-icon-box {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.item-icon-box--pdf {
		background: rgba(239, 68, 68, 0.12);
		color: #dc2626;
	}

	.item-icon-box--jpg {
		background: rgba(245, 158, 11, 0.12);
		color: #d97706;
	}

	.item-icon-box--png {
		background: rgba(14, 165, 233, 0.12);
		color: #0284c7;
	}

	.item-icon-box--webp {
		background: rgba(168, 85, 247, 0.12);
		color: #9333ea;
	}

	.item-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.item-title {
		font-size: 0.92rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.item-desc {
		font-size: 0.75rem;
		color: var(--text-muted, #64748b);
		line-height: 1.2;
	}

	.menu-divider {
		height: 1px;
		background: var(--color-border, rgba(0, 0, 0, 0.08));
		margin: 3px 0;
	}
</style>
