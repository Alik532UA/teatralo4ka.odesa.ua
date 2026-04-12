<script lang="ts">
	import type { MenuLinkType } from '$lib/services/settings';
	import { t } from 'svelte-i18n';

	interface Props {
		linkType: MenuLinkType;
		href: string;
		labelUk?: string;
		labelEn?: string;
		showLabels?: boolean;
		articlesList: { slug: string; path: string; titleUk: string; titleEn: string }[];
		articlesLoading: boolean;
		knownPages: { value: string; labelUk: string; labelEn: string }[];
		onLoadArticles: () => void;
		onchange: (patch: { linkType?: MenuLinkType; href?: string; labelUk?: string; labelEn?: string }) => void;
	}

	let {
		linkType,
		href,
		labelUk = '',
		labelEn = '',
		showLabels = false,
		articlesList,
		articlesLoading,
		knownPages,
		onLoadArticles,
		onchange,
	}: Props = $props();

	function setLinkType(t: MenuLinkType) {
		if (t === linkType) return;
		let newHref = href;
		let patch: Parameters<typeof onchange>[0] = { linkType: t };
		if (t === 'page') {
			newHref = knownPages[0]?.value ?? '/';
			patch.href = newHref;
			if (showLabels) {
				const page = knownPages.find(p => p.value === newHref);
				patch.labelUk = page?.labelUk ?? newHref;
				patch.labelEn = page?.labelEn ?? newHref;
			}
		} else if (t === 'article') {
			onLoadArticles();
			newHref = '';
			patch.href = '';
		} else {
			newHref = '';
			patch.href = '';
		}
		onchange(patch);
	}

	function selectPage(value: string) {
		const page = knownPages.find(p => p.value === value);
		const patch: Parameters<typeof onchange>[0] = { href: value };
		if (showLabels && page) {
			patch.labelUk = page.labelUk;
			patch.labelEn = page.labelEn;
		}
		onchange(patch);
	}

	function selectArticle(path: string) {
		const article = articlesList.find(a => a.path === path);
		const patch: Parameters<typeof onchange>[0] = { href: path };
		if (showLabels && article) {
			patch.labelUk = article.titleUk;
			patch.labelEn = article.titleEn;
		}
		onchange(patch);
	}
</script>

<div class="link-picker">
	<div class="mode-toggle-group" style="align-self: flex-start; margin-bottom: 0.5rem;">
		<button 
			type="button" 
			class="mode-btn" 
			class:active={linkType === 'page'} 
			onclick={() => setLinkType('page')}
		>
			{$t('admin.menuEditor.typePage')}
		</button>
		<button 
			type="button" 
			class="mode-btn" 
			class:active={linkType === 'article'} 
			onclick={() => setLinkType('article')}
		>
			{$t('admin.menuEditor.typeArticle')}
		</button>
		<button 
			type="button" 
			class="mode-btn" 
			class:active={linkType === 'url'} 
			onclick={() => setLinkType('url')}
		>
			{$t('admin.menuEditor.typeUrl')}
		</button>
	</div>

	{#if linkType === 'page'}
		<select
			class="lp-select"
			value={href}
			onchange={(e) => selectPage((e.target as HTMLSelectElement).value)}
		>
			{#each knownPages as p}
				<option value={p.value}>{p.labelUk}</option>
			{/each}
		</select>
	{:else if linkType === 'article'}
		{#if articlesLoading}
			<p class="lp-hint">{$t('admin.menuEditor.loadingArticles')}</p>
		{:else}
			<select
				class="lp-select"
				value={href}
				onchange={(e) => selectArticle((e.target as HTMLSelectElement).value)}
			>
				<option value="">{$t('admin.menuEditor.selectArticle')}</option>
				{#each articlesList as a}
					<option value={a.path}>{a.titleUk} ({a.path})</option>
				{/each}
			</select>
		{/if}
	{:else}
		<input
			type="url"
			class="lp-select"
			placeholder="https://…"
			value={href}
			oninput={(e) => onchange({ href: (e.target as HTMLInputElement).value })}
		/>
	{/if}

	{#if showLabels}
		<div class="lp-labels">
			<div>
				<span class="lp-label-hint">{$t('admin.menuEditor.labelUk')}</span>
				<input
					type="text"
					class="lp-select"
					value={labelUk}
					oninput={(e) => onchange({ labelUk: (e.target as HTMLInputElement).value })}
				/>
			</div>
			<div>
				<span class="lp-label-hint">{$t('admin.menuEditor.labelEn')}</span>
				<input
					type="text"
					class="lp-select"
					value={labelEn}
					oninput={(e) => onchange({ labelEn: (e.target as HTMLInputElement).value })}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.link-picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mode-toggle-group {
		display: flex;
		background: var(--color-ice-blue);
		padding: 0.25rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 95, 174, 0.08);
	}

	:global(.dark-theme) .mode-toggle-group {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.mode-btn {
		padding: 0.4rem 1.25rem;
		border: none;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-muted-text);
		transition: all 0.2s;
	}

	.mode-btn:hover:not(.active) {
		background: rgba(33, 150, 186, 0.08);
		color: var(--color-sea-blue);
	}

	.mode-btn.active {
		background: white;
		color: var(--color-sea-blue);
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	:global(.dark-theme) .mode-btn.active {
		background: var(--color-sea-blue);
		color: white;
	}

	.lp-select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--color-border);
		border-radius: 10px;
		font-size: 0.9rem;
		background: var(--color-surface);
		color: var(--color-dark-text);
	}

	.lp-select:focus {
		outline: none;
		border-color: var(--color-sea-blue);
	}

	.lp-hint {
		font-size: 0.85rem;
		color: var(--color-muted-text);
	}

	.lp-labels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.lp-label-hint {
		display: block;
		font-size: 0.75rem;
		color: var(--color-muted-text);
		margin-bottom: 0.2rem;
	}
</style>
