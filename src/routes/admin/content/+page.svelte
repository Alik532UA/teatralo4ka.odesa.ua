<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { deleteArticle, fetchAllContent, addArticle, updateArticle } from '$lib/services/admin-articles';
	import { getDisplayDate, type Article, type ContentType } from '$lib/services/articles';
	import { ARTICLE_CATEGORIES, getCategoryLabel, type ArticleCategory } from '$lib/config/categories';
	import { t, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { Timestamp } from 'firebase/firestore';
	import { Paperclip, Search, Calendar, Tag, FileText, Globe, Folder } from 'lucide-svelte';

	let allItems = $state<Article[]>([]);
	let loading = $state(true);
	let search = $state('');
	let importing = $state(false);
	let togglingId = $state<string | null>(null);

	// Filters
	let filterType = $state<'all' | 'article' | 'page' | 'page_project'>('all');
	let filterStatus = $state<'all' | 'published' | 'draft'>('all');
	let filterCategory = $state('all');
	let filterYear = $state('all');

	const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';
	const isSuperAdmin = $derived(authService.profile?.isSuperAdmin === true);
	const permissions = $derived(authService.profile?.projects?.[PROJECT_ID]?.permissions);
	const canCreateArticle = $derived(isSuperAdmin || permissions?.canCreateArticles === true);
	const canCreatePage = $derived(isSuperAdmin || permissions?.canCreatePages === true);
	const canCreate = $derived(canCreateArticle || canCreatePage);
	const canDeleteArticle = $derived(isSuperAdmin || permissions?.canDeleteArticles === true);
	const canDeletePage = $derived(isSuperAdmin || permissions?.canDeletePages === true);

	function getItemType(item: Article): ContentType {
		return item.type || 'article';
	}

	function canDeleteItem(item: Article): boolean {
		const type = getItemType(item);
		if (type === 'article') return canDeleteArticle;
		return canDeletePage; // page and page_project share page permissions
	}

	function canEditItem(item: Article): boolean {
		const type = getItemType(item);
		if (type === 'article') return isSuperAdmin || permissions?.canEditArticles === true;
		return isSuperAdmin || permissions?.canEditPages === true;
	}

	const typeCounts = $derived.by(() => {
		const counts = { all: allItems.length, article: 0, page: 0, page_project: 0 };
		allItems.forEach(a => {
			const type = getItemType(a);
			if (type in counts) counts[type as keyof typeof counts]++;
		});
		return counts;
	});

	const availableYears = $derived.by(() => {
		const years = new Set<string>();
		allItems.forEach(a => {
			const ts = getDisplayDate(a);
			if (ts) years.add(ts.toDate().getFullYear().toString());
		});
		return Array.from(years).sort((a, b) => b.localeCompare(a));
	});

	const sorted = $derived.by(() => {
		return [...allItems].sort((a, b) => {
			const dateA = getDisplayDate(a)?.toMillis() || 0;
			const dateB = getDisplayDate(b)?.toMillis() || 0;
			return dateB - dateA;
		});
	});

	const filtered = $derived.by(() => {
		const currentLang = ($locale as 'uk' | 'en') || 'uk';
		return sorted.filter(a => {
			// Type filter
			if (filterType !== 'all' && getItemType(a) !== filterType) return false;

			// Search filter
			const title = a.translations?.[currentLang]?.title || '';
			const excerpt = (a.translations?.[currentLang]?.content || '').replace(/[#*`_\[\]()]/g, '');
			const searchMatch = !search.trim() || 
				title.toLowerCase().includes(search.toLowerCase()) ||
				excerpt.toLowerCase().includes(search.toLowerCase()) ||
				a.category?.toLowerCase().includes(search.toLowerCase());
			
			if (!searchMatch) return false;

			// Status filter
			if (filterStatus !== 'all') {
				const isPub = a.translations?.[currentLang]?.isPublished === true;
				if (filterStatus === 'published' && !isPub) return false;
				if (filterStatus === 'draft' && isPub) return false;
			}

			// Category filter
			if (filterCategory !== 'all' && a.category !== filterCategory) return false;

			// Year filter
			if (filterYear !== 'all') {
				const ts = getDisplayDate(a);
				if (filterYear === 'none') {
					if (ts) return false;
				} else {
					if (!ts || ts.toDate().getFullYear().toString() !== filterYear) return false;
				}
			}

			return true;
		});
	});

	async function loadAll() {
		loading = true;
		allItems = await fetchAllContent();
		loading = false;
	}

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(`${base}/admin/login`);
		} else {
			loadAll();
		}
	});

	async function handleDelete(item: Article) {
		if (!item.id) return;
		const type = getItemType(item);
		const confirmMsg = type === 'article' 
			? get(t)('admin.articles.deleteConfirm') 
			: get(t)('admin.pages.deleteConfirm');
		if (!(await toast.confirm(confirmMsg))) return;
		try {
			await deleteArticle(item.id);
			allItems = allItems.filter(a => a.id !== item.id);
			toast.success(type === 'article' 
				? get(t)('admin.articles.deleteSuccess') 
				: get(t)('admin.pages.deleted'));
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.editor.errorUpdate'));
		}
	}

	async function togglePublish(article: Article, lang: 'uk' | 'en') {
		if (!article.id || togglingId) return;
		
		if (!canEditItem(article)) {
			toast.error(get(t)('admin.content.noPermissionToggle'));
			return;
		}

		togglingId = `${article.id}-${lang}`;
		try {
			const currentStatus = article.translations?.[lang]?.isPublished ?? false;
			const newTranslations = {
				...article.translations,
				[lang]: {
					...article.translations?.[lang],
					isPublished: !currentStatus
				}
			};

			await updateArticle(article.id, {
				translations: newTranslations as any
			});

			const idx = allItems.findIndex(a => a.id === article.id);
			if (idx !== -1) {
				allItems[idx].translations = newTranslations as any;
			}
			
			toast.success(get(t)('admin.content.statusUpdated', { values: { lang: lang.toUpperCase() } }));
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.content.statusUpdateError'));
		} finally {
			togglingId = null;
		}
	}

	function formatDate(article: Article) {
		const timestamp = getDisplayDate(article);
		if (!timestamp) return get(t)('admin.editor.dateHidden');
		return timestamp.toDate().toLocaleDateString($locale === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function getExcerpt(article: Article) {
		const currentLang = ($locale as 'uk' | 'en') || 'uk';
		const content = article.translations?.[currentLang]?.content || '';
		const plainText = content.replace(/[#*`_\[\]()]/g, '').replace(/<[^>]*>/g, '');
		return plainText.length > 120 ? plainText.slice(0, 120) + '...' : plainText;
	}

	function getTitle(article: Article) {
		const currentLang = ($locale as 'uk' | 'en') || 'uk';
		return article.translations?.[currentLang]?.title || 'Untitled';
	}

	function getCoverUrl(article: Article): string {
		return article.translations?.uk?.coverUrl || article.translations?.en?.coverUrl || '';
	}

	function getTypeBadge(item: Article): { label: string; class: string } {
		const type = getItemType(item);
		switch (type) {
			case 'page': return { label: get(t)('admin.content.badgePage'), class: 'cl-type-page' };
			case 'page_project': return { label: get(t)('admin.content.badgeProject'), class: 'cl-type-project' };
			default: return { label: get(t)('admin.content.badgeArticle'), class: 'cl-type-article' };
		}
	}

	async function handleBulkLoad(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (!files || files.length === 0) return;
		
		importing = true;
		let loaded = 0;
		let failed = 0;

		for (const file of files) {
			try {
				const result = await new Promise<string | null>((resolve) => {
					const reader = new FileReader();
					reader.onload = (event) => resolve(event.target?.result as string);
					reader.onerror = () => resolve(null);
					reader.readAsText(file);
				});

				if (!result) { failed++; continue; }

				const data = JSON.parse(result);
				const customDate = data.dateMode === 'custom' && data.customDateStr 
					? Timestamp.fromDate(new Date(data.customDateStr)) 
					: null;

				await addArticle({
					category: data.category || 'news',
					slug: data.slug || '',
					dateMode: data.dateMode || 'createdAt',
					customDate,
					translations: data.translations,
					author: '',
					type: data.type || 'article'
				});
				loaded++;
			} catch (err) {
				console.error('Failed to import from file:', (err as Error).message);
				failed++;
			}
		}

		if (loaded > 0) {
			toast.success(get(t)('admin.content.importSuccess', { values: { count: loaded } }));
			await loadAll();
		}
		if (failed > 0) {
			toast.error(get(t)('admin.content.importError', { values: { count: failed } }));
		}
		
		importing = false;
		(e.target as HTMLInputElement).value = '';
	}
</script>

<section class="cl-page container" data-testid="admin-content-section-container">
	<!-- Header -->
	<div class="cl-header" data-testid="admin-content-header-group">
		<div class="cl-title-group">
			<a href="{base}/admin" class="cl-back-btn" data-testid="admin-content-back-button" title={$t('admin.articles.backToPanel')}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
			</a>
			<h1 class="cl-title" data-testid="admin-content-title-label">{$t('admin.content.title')}</h1>
			{#if !loading}
				<span class="cl-count">{allItems.length}</span>
			{/if}
		</div>
		<div class="cl-header-actions" data-testid="admin-content-header-actions-group">
			{#if canCreate}
				<label class="cl-icon-btn cl-import-btn" title={$t('admin.editor.loadDraftFile')} data-testid="admin-content-import-button">
					{#if importing}
						<div class="cl-mini-spinner"></div>
					{:else}
						<Paperclip size={18} />
					{/if}
					<input type="file" accept=".json" multiple onchange={handleBulkLoad} style="display: none;" disabled={importing} />
				</label>
				<a href="{base}/admin/content/new" class="btn btn-primary cl-create-btn" data-testid="admin-content-create-button">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
					{$t('admin.content.createBtn')}
				</a>
			{/if}
		</div>
	</div>

	<!-- Type Tabs -->
	<div class="cl-type-tabs">
		<button class="cl-type-tab" class:active={filterType === 'all'} onclick={() => filterType = 'all'}>
			{$t('admin.content.allTypes')}
			<span class="cl-tab-count">{typeCounts.all}</span>
		</button>
		<button class="cl-type-tab" class:active={filterType === 'article'} onclick={() => filterType = 'article'}>
			<FileText size={15} />
			{$t('admin.content.typeArticle')}
			<span class="cl-tab-count">{typeCounts.article}</span>
		</button>
		<button class="cl-type-tab" class:active={filterType === 'page'} onclick={() => filterType = 'page'}>
			<Globe size={15} />
			{$t('admin.content.typePage')}
			<span class="cl-tab-count">{typeCounts.page}</span>
		</button>
		<button class="cl-type-tab" class:active={filterType === 'page_project'} onclick={() => filterType = 'page_project'}>
			<Folder size={15} />
			{$t('admin.content.typeProject')}
			<span class="cl-tab-count">{typeCounts.page_project}</span>
		</button>
	</div>

	<!-- Filters Bar -->
	<div class="cl-filters-bar">
		<div class="cl-search-box">
			<Search size={18} class="cl-search-icon" />
			<input type="text" bind:value={search} placeholder={$t('admin.content.search')} data-testid="admin-content-search-input" />
		</div>

		<div class="cl-filter-groups">
			<div class="mode-toggle-group">
				<button class="mode-btn" class:active={filterStatus === 'all'} onclick={() => filterStatus = 'all'}>{$t('admin.content.filterAll')}</button>
				<button class="mode-btn" class:active={filterStatus === 'published'} onclick={() => filterStatus = 'published'}>{$t('admin.content.filterPublished')}</button>
				<button class="mode-btn" class:active={filterStatus === 'draft'} onclick={() => filterStatus = 'draft'}>{$t('admin.content.filterDraft')}</button>
			</div>

			{#if filterType === 'all' || filterType === 'article'}
				<div class="select-wrapper">
					<Tag size={14} class="select-icon" />
					<select class="cl-filter-select" bind:value={filterCategory}>
						<option value="all">{$t('admin.content.allCategories')}</option>
						{#each Object.entries(ARTICLE_CATEGORIES) as [key, labels]}
							<option value={key}>{labels.uk}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="select-wrapper">
				<Calendar size={14} class="select-icon" />
				<select class="cl-filter-select" bind:value={filterYear}>
					<option value="all">{$t('admin.content.allYears')}</option>
					{#each availableYears as year}
						<option value={year}>{year}</option>
					{/each}
					<option value="none">{$t('admin.content.noDate')}</option>
				</select>
			</div>
		</div>
	</div>

	<!-- List -->
	<div class="cl-list" data-testid="admin-content-table-container">
		{#if loading}
			{#each [1,2,3,4] as _}
				<div class="cl-skeleton"></div>
			{/each}
		{:else if filtered.length === 0}
			<div class="cl-empty" data-testid="admin-content-empty-label">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
				<p>{search ? $t('admin.content.noResults') : $t('admin.content.noItems')}</p>
			</div>
		{:else}
			{#each filtered as item (item.id)}
				{@const badge = getTypeBadge(item)}
				<div class="cl-card" data-testid={`admin-content-row-${item.id}-group`}>
					<!-- Thumbnail -->
					<div class="cl-thumb" class:cl-thumb-empty={!getCoverUrl(item)}>
						{#if getCoverUrl(item)}
							<img src={getCoverUrl(item)} alt="" loading="lazy" />
						{:else}
							<Paperclip size={24} opacity={0.3} />
						{/if}
					</div>

					<!-- Info -->
					<div class="cl-info">
						<div class="cl-info-top">
							<span class="cl-type-badge {badge.class}">{badge.label}</span>
							{#if item.category}
								<span class="cl-category" data-testid={`admin-content-row-${item.id}-category`}>
								{getCategoryLabel(item.category, ($locale as 'uk' | 'en') || 'uk')}
								</span>
							{/if}
							<span class="cl-date" data-testid={`admin-content-row-${item.id}-date`}>{formatDate(item)}</span>
						</div>
						<h3 class="cl-item-title" data-testid={`admin-content-row-${item.id}-title`}>{getTitle(item)}</h3>
						<p class="cl-excerpt">{getExcerpt(item)}</p>
					</div>

					<!-- Status badges -->
					<div class="cl-langs" data-testid={`admin-content-row-${item.id}-status`}>
						<button 
							class="cl-lang-badge {item.translations?.uk?.isPublished ? 'published' : 'draft'}"
							class:is-toggling={togglingId === `${item.id}-uk`}
							onclick={() => togglePublish(item, 'uk')}
							title={item.translations?.uk?.isPublished ? 'Зняти з публікації (UA)' : 'Опублікувати (UA)'}
							disabled={!!togglingId}
						>
							UA
						</button>
						<button 
							class="cl-lang-badge {item.translations?.en?.isPublished ? 'published' : 'draft'}"
							class:is-toggling={togglingId === `${item.id}-en`}
							onclick={() => togglePublish(item, 'en')}
							title={item.translations?.en?.isPublished ? 'Зняти з публікації (EN)' : 'Опублікувати (EN)'}
							disabled={!!togglingId}
						>
							EN
						</button>
					</div>

					<!-- Actions -->
					<div class="cl-actions" data-testid={`admin-content-row-${item.id}-actions`}>
						<a href="{base}/admin/content/{item.id}" class="cl-action-btn cl-edit-btn" data-testid={`admin-content-edit-${item.id}-button`} title={$t('admin.articles.edit')}>
							<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
							<span>{$t('admin.articles.edit')}</span>
						</a>
						{#if canDeleteItem(item)}
							<button onclick={() => handleDelete(item)} class="cl-action-btn cl-delete-btn" data-testid={`admin-content-delete-${item.id}-button`} title={$t('admin.articles.delete')}>
								<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
.cl-page {
	padding: 140px 24px 80px;
}

/* Header */
.cl-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 2rem;
	gap: 1rem;
}
.cl-title-group {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.cl-back-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: 2px solid var(--color-border);
	color: var(--color-muted-text);
	text-decoration: none;
	flex-shrink: 0;
	transition: border-color 0.15s, color 0.15s;
}
.cl-back-btn:hover {
	border-color: var(--color-sea-blue);
	color: var(--color-sea-blue);
}
.cl-title {
	font-family: var(--font-heading);
	color: var(--color-deep-ocean);
	font-size: 1.8rem;
	margin: 0;
}
.cl-count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	height: 28px;
	padding: 0 8px;
	background: var(--color-sea-blue);
	color: #fff;
	border-radius: 20px;
	font-size: 0.8rem;
	font-weight: 700;
}
.cl-create-btn {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	white-space: nowrap;
}

/* Header Actions */
.cl-header-actions {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}
.cl-icon-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 14px;
	border: 2px solid var(--color-border);
	background: none;
	color: var(--color-muted-text);
	cursor: pointer;
	transition: all 0.15s;
}
.cl-icon-btn:hover:not(:disabled) {
	border-color: var(--color-sea-blue);
	color: var(--color-sea-blue);
	background: rgba(33, 150, 186, 0.05);
}
.cl-import-btn {
	background: var(--theme-dynamic-card-bg);
}

.cl-mini-spinner {
	width: 18px;
	height: 18px;
	border: 2px solid rgba(33, 150, 186, 0.2);
	border-top-color: var(--color-sea-blue);
	border-radius: 50%;
	animation: cl-spin 0.8s linear infinite;
}
@keyframes cl-spin {
	to { transform: rotate(360deg); }
}

/* Type Tabs */
.cl-type-tabs {
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.25rem;
	flex-wrap: wrap;
}
.cl-type-tab {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.6rem 1.25rem;
	border-radius: 14px;
	border: 2px solid var(--color-border);
	background: var(--theme-dynamic-card-bg);
	color: var(--color-muted-text);
	font-size: 0.88rem;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.2s;
}
.cl-type-tab:hover:not(.active) {
	border-color: var(--color-sea-blue);
	color: var(--color-sea-blue);
}
.cl-type-tab.active {
	border-color: var(--color-sea-blue);
	background: var(--color-sea-blue);
	color: #fff;
}
.cl-tab-count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 22px;
	height: 22px;
	padding: 0 6px;
	border-radius: 12px;
	font-size: 0.72rem;
	font-weight: 800;
	background: rgba(0, 0, 0, 0.08);
}
.cl-type-tab.active .cl-tab-count {
	background: rgba(255, 255, 255, 0.25);
}

/* Filters Bar */
.cl-filters-bar {
	display: flex;
	flex-wrap: wrap;
	gap: 1.25rem;
	margin-bottom: 2rem;
	align-items: center;
	background: var(--theme-dynamic-card-bg);
	padding: 1.25rem;
	border-radius: 24px;
	border: 1px solid rgba(0,0,0,0.05);
	box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.cl-search-box {
	flex: 1;
	min-width: 280px;
	position: relative;
	display: flex;
	align-items: center;
}
:global(.cl-search-icon) {
	position: absolute;
	left: 1rem;
	color: var(--color-sea-blue);
	opacity: 0.5;
}
.cl-search-box input {
	width: 100%;
	padding: 0.75rem 1rem 0.75rem 3rem;
	border-radius: 14px;
	border: 2px solid var(--color-border);
	background: var(--color-surface);
	font-size: 0.95rem;
	transition: all 0.2s;
	color: var(--color-dark-text);
}
.cl-search-box input:focus {
	outline: none;
	border-color: var(--color-sea-blue);
	box-shadow: 0 0 0 4px rgba(33, 150, 186, 0.1);
}

.cl-filter-groups {
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
	align-items: center;
}

.select-wrapper {
	position: relative;
	display: flex;
	align-items: center;
}
:global(.select-icon) {
	position: absolute;
	left: 0.85rem;
	color: var(--color-sea-blue);
	opacity: 0.6;
	pointer-events: none;
}

.cl-filter-select {
	padding: 0.55rem 1rem 0.55rem 2.25rem;
	border-radius: 12px;
	border: 2px solid var(--color-border);
	background: var(--color-surface);
	color: var(--color-dark-text);
	font-weight: 700;
	font-size: 0.82rem;
	cursor: pointer;
	outline: none;
	appearance: none;
	min-width: 140px;
	transition: all 0.2s;
}
.cl-filter-select:hover {
	border-color: var(--color-sea-blue);
}
.cl-filter-select:focus {
	border-color: var(--color-sea-blue);
	box-shadow: 0 0 0 4px rgba(33, 150, 186, 0.1);
}

/* List */
.cl-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

/* Card */
.cl-card {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	background: var(--theme-dynamic-card-bg);
	border: 1px solid var(--color-border);
	border-radius: 24px;
	padding: 1.25rem;
	transition: all 0.2s;
}
.cl-card:hover {
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
	border-color: var(--color-sea-blue-light, #3aacce);
	transform: translateX(4px);
}

/* Thumbnail */
.cl-thumb {
	width: 84px;
	height: 84px;
	border-radius: 16px;
	overflow: hidden;
	flex-shrink: 0;
	background: var(--color-border);
}
.cl-thumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.cl-thumb-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--theme-dynamic-section-bg, #f8f9fa);
	color: var(--color-muted-text);
}

/* Info */
.cl-info {
	flex: 1;
	min-width: 0;
}
.cl-info-top {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.5rem;
	flex-wrap: wrap;
}
.cl-type-badge {
	font-size: 0.68rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	padding: 3px 10px;
	border-radius: 20px;
}
.cl-type-article {
	background: rgba(59, 130, 246, 0.1);
	color: #2563eb;
}
.cl-type-page {
	background: rgba(16, 185, 129, 0.1);
	color: #059669;
}
.cl-type-project {
	background: rgba(168, 85, 247, 0.1);
	color: #7c3aed;
}
:global(.dark-theme) .cl-type-article {
	background: rgba(96, 165, 250, 0.15);
	color: #93bbfd;
}
:global(.dark-theme) .cl-type-page {
	background: rgba(52, 211, 153, 0.15);
	color: #6ee7b7;
}
:global(.dark-theme) .cl-type-project {
	background: rgba(192, 132, 252, 0.15);
	color: #c4b5fd;
}
.cl-category {
	font-size: 0.7rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-sea-blue);
	background: rgba(33, 150, 186, 0.08);
	padding: 3px 12px;
	border-radius: 20px;
}
.cl-date {
	font-size: 0.8rem;
	font-weight: 600;
	color: var(--color-muted-text);
	opacity: 0.8;
}
.cl-item-title {
	font-size: 1.15rem;
	font-weight: 700;
	color: var(--color-dark-text);
	margin: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.3;
}
.cl-excerpt {
	font-size: 0.88rem;
	line-height: 1.5;
	opacity: 0.5;
	margin-top: 0.4rem;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

/* Lang badges */
.cl-langs {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	flex-shrink: 0;
}
.cl-lang-badge {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.72rem;
	font-weight: 800;
	padding: 4px 12px;
	border-radius: 20px;
	letter-spacing: 0.05em;
	border: none;
	cursor: pointer;
	font-family: inherit;
}
.cl-lang-badge.published {
	background: rgba(16, 185, 129, 0.12);
	color: #059669;
}
.cl-lang-badge.draft {
	background: rgba(245, 166, 35, 0.15);
	color: #d97706;
}
:global(.dark-theme) .cl-lang-badge.published {
	background: rgba(52, 211, 153, 0.18);
	color: #6ee7b7;
}
:global(.dark-theme) .cl-lang-badge.draft {
	background: rgba(245, 166, 35, 0.2);
	color: #fbbf24;
}
.cl-lang-badge:hover:not(:disabled) {
	filter: brightness(0.9);
	transform: translateY(-1px);
}
.cl-lang-badge.is-toggling {
	opacity: 0.5;
	pointer-events: none;
}
.cl-lang-badge.published::before { content: '●'; font-size: 0.6em; }
.cl-lang-badge.draft::before    { content: '○'; font-size: 0.6em; }

/* Actions */
.cl-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-shrink: 0;
}
.cl-action-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.55rem 1rem;
	border-radius: 14px;
	font-size: 0.85rem;
	font-weight: 700;
	cursor: pointer;
	text-decoration: none;
	border: 2px solid transparent;
	transition: all 0.2s;
}
.cl-edit-btn {
	background: var(--color-ice-blue);
	color: var(--color-sea-blue);
}
.cl-edit-btn:hover {
	background: var(--color-sea-blue);
	color: #fff;
	box-shadow: 0 4px 12px rgba(33, 150, 186, 0.2);
}
.cl-delete-btn {
	background: none;
	color: var(--color-muted-text);
	border-color: var(--color-border);
	padding: 0.55rem;
}
.cl-delete-btn:hover {
	background: rgba(239, 68, 68, 0.08);
	border-color: #ef4444;
	color: #ef4444;
}

/* Mode toggle */
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
	padding: 0.4rem 1rem;
	border-radius: 10px;
	border: none;
	background: transparent;
	font-size: 0.82rem;
	font-weight: 700;
	color: var(--color-muted-text);
	cursor: pointer;
	transition: all 0.2s;
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

/* Skeleton */
.cl-skeleton {
	height: 110px;
	border-radius: 24px;
	background: linear-gradient(90deg, var(--color-border) 25%, rgba(200,221,230,0.4) 50%, var(--color-border) 75%);
	background-size: 200% 100%;
	animation: cl-shimmer 1.4s ease-in-out infinite;
}
@keyframes cl-shimmer {
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

/* Empty state */
.cl-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 4rem 2rem;
	color: var(--color-muted-text);
	text-align: center;
}
.cl-empty p { margin: 0; font-size: 1rem; font-weight: 600; opacity: 0.7; }

/* Responsive */
@media (max-width: 1024px) {
	.cl-filters-bar { flex-direction: column; align-items: stretch; }
	.cl-search-box { width: 100%; }
}
@media (max-width: 640px) {
	.cl-card { gap: 1rem; padding: 1rem; }
	.cl-thumb { width: 60px; height: 60px; border-radius: 12px; }
	.cl-item-title { font-size: 1rem; }
	.cl-excerpt { display: none; }
	.cl-edit-btn span { display: none; }
	.cl-edit-btn { padding: 0.55rem; }
	.cl-langs { flex-direction: row; gap: 0.35rem; }
	.cl-type-tabs { gap: 0.35rem; }
	.cl-type-tab { padding: 0.5rem 0.75rem; font-size: 0.78rem; }
}
</style>
