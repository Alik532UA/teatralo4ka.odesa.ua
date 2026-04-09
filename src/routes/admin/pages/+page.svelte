<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { deleteArticle, fetchAllPages, updateArticle } from '$lib/services/admin-articles';
	import { getDisplayDate, type Article } from '$lib/services/articles';
	import { t, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { Search, FilePlus, Filter, Calendar } from 'lucide-svelte';

	let pages = $state<Article[]>([]);
	let loading = $state(true);
	let search = $state('');
	let togglingId = $state<string | null>(null);

	// Filters
	let filterStatus = $state<'all' | 'published' | 'draft'>('all');
	let filterYear = $state('all');

	const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';
	const isSuperAdmin = $derived(authService.profile?.isSuperAdmin === true);
	const permissions = $derived(authService.profile?.projects?.[PROJECT_ID]?.permissions);
	const canCreate = $derived(isSuperAdmin || permissions?.canCreatePages === true);
	const canDelete = $derived(isSuperAdmin || permissions?.canDeletePages === true);

	const availableYears = $derived.by(() => {
		const years = new Set<string>();
		pages.forEach(p => {
			const ts = getDisplayDate(p);
			if (ts) years.add(ts.toDate().getFullYear().toString());
		});
		return Array.from(years).sort((a, b) => b.localeCompare(a));
	});

	const sorted = $derived.by(() => {
		return [...pages].sort((a, b) => {
			const dateA = getDisplayDate(a)?.toMillis() || 0;
			const dateB = getDisplayDate(b)?.toMillis() || 0;
			return dateB - dateA;
		});
	});

	const filtered = $derived.by(() => {
		const currentLang = ($locale as 'uk' | 'en') || 'uk';
		return sorted.filter(p => {
			// Search
			const title = p.translations?.[currentLang]?.title || '';
			const excerpt = (p.translations?.[currentLang]?.content || '').replace(/[#*`_\[\]()]/g, '');
			const searchMatch = !search.trim() || 
				title.toLowerCase().includes(search.toLowerCase()) ||
				excerpt.toLowerCase().includes(search.toLowerCase());
			
			if (!searchMatch) return false;

			// Status
			if (filterStatus !== 'all') {
				const isPub = p.translations?.[currentLang]?.isPublished === true;
				if (filterStatus === 'published' && !isPub) return false;
				if (filterStatus === 'draft' && isPub) return false;
			}

			// Year
			if (filterYear !== 'all') {
				const ts = getDisplayDate(p);
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
		pages = await fetchAllPages();
		loading = false;
	}

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(`${base}/admin/login`);
		} else {
			loadAll();
		}
	});

	async function handleDelete(id: string | undefined) {
		if (!id || !(await toast.confirm(get(t)('admin.pages.deleteConfirm')))) return;
		try {
			await deleteArticle(id);
			pages = pages.filter(p => p.id !== id);
			toast.success(get(t)('admin.pages.deleted'));
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.pages.deleteError'));
		}
	}

	async function togglePublish(article: Article, lang: 'uk' | 'en') {
		if (!article.id || togglingId) return;
		
		const canEdit = isSuperAdmin || permissions?.canEditPages === true;
		if (!canEdit) {
			toast.error('У вас немає прав для зміни статусу публікації');
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
				translations: newTranslations as any,
				type: 'page'
			});

			const idx = pages.findIndex(p => p.id === article.id);
			if (idx !== -1) {
				pages[idx].translations = newTranslations as any;
			}
			
			toast.success(lang === 'uk' ? 'Статус UA оновлено' : 'Статус EN оновлено');
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || 'Помилка оновлення статусу');
		} finally {
			togglingId = null;
		}
	}

	function formatDate(page: Article) {
		const timestamp = getDisplayDate(page);
		if (!timestamp) return get(t)('admin.editor.dateHidden');
		return timestamp.toDate().toLocaleDateString($locale === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function getExcerpt(page: Article) {
		const currentLang = ($locale as 'uk' | 'en') || 'uk';
		const content = page.translations?.[currentLang]?.content || '';
		const plainText = content.replace(/[#*`_\[\]()]/g, '').replace(/<[^>]*>/g, '');
		return plainText.length > 120 ? plainText.slice(0, 120) + '...' : plainText;
	}

	function getTitle(page: Article) {
		const currentLang = ($locale as 'uk' | 'en') || 'uk';
		return page.translations?.[currentLang]?.title || 'Untitled';
	}

	function getCoverUrl(page: Article): string {
		return page.translations?.uk?.coverUrl || page.translations?.en?.coverUrl || '';
	}
</script>

<section class="pl-page container" data-testid="admin-pages-section-container">
	<!-- Header -->
	<div class="pl-header" data-testid="admin-pages-header-group">
		<div class="pl-title-group">
			<a href="{base}/admin" class="pl-back-btn" data-testid="admin-pages-back-button" title={$t('admin.pages.backToPanel')}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
			</a>
			<h1 class="pl-title" data-testid="admin-pages-title-label">{$t('admin.pages.title')}</h1>
			{#if !loading}
				<span class="pl-count">{pages.length}</span>
			{/if}
		</div>
		{#if canCreate}
			<a href="{base}/admin/pages/new" class="btn btn-primary pl-create-btn" data-testid="admin-pages-create-button">
				<FilePlus size={18} style="margin-right: 0.5rem;" />
				{$t('admin.pages.createBtn')}
			</a>
		{/if}
	</div>

	<!-- Filters Bar -->
	<div class="al-filters-bar">
		<div class="al-search-box">
			<Search size={18} class="al-search-icon" />
			<input type="text" bind:value={search} placeholder={$t('admin.articles.search')} data-testid="admin-pages-search-input" />
		</div>

		<div class="al-filter-groups">
			<div class="mode-toggle-group">
				<button class="mode-btn" class:active={filterStatus === 'all'} onclick={() => filterStatus = 'all'}>Всі</button>
				<button class="mode-btn" class:active={filterStatus === 'published'} onclick={() => filterStatus = 'published'}>Опубліковані</button>
				<button class="mode-btn" class:active={filterStatus === 'draft'} onclick={() => filterStatus = 'draft'}>Чернетки</button>
			</div>

			<div class="select-wrapper">
				<Calendar size={14} class="select-icon" />
				<select class="al-filter-select" bind:value={filterYear}>
					<option value="all">Всі роки</option>
					{#each availableYears as year}
						<option value={year}>{year} рік</option>
					{:else}
						<!-- No years found -->
					{/each}
					<option value="none">Без дати</option>
				</select>
			</div>
		</div>
	</div>

	<div class="pl-list" data-testid="admin-pages-table-container">
		{#if loading}
			{#each [1,2,3] as _}
				<div class="al-skeleton"></div>
			{/each}
		{:else if filtered.length === 0}
			<div class="al-empty">
				<Search size={48} opacity={0.2} />
				<p>{search ? ($t('admin.pages.noResults') || 'Нічого не знайдено') : $t('admin.pages.noPages')}</p>
			</div>
		{:else}
			{#each filtered as page (page.id)}
				<div class="pl-card" data-testid={`admin-pages-row-${page.id}-group`}>
					<!-- Thumbnail -->
					<div class="pl-thumb" class:pl-thumb-empty={!getCoverUrl(page)}>
						{#if getCoverUrl(page)}
							<img src={getCoverUrl(page)} alt="" loading="lazy" />
						{:else}
							<Search size={24} opacity={0.3} />
						{/if}
					</div>

					<!-- Info -->
					<div class="pl-info">
						<div class="pl-info-top">
							<span class="pl-date" data-testid={`admin-pages-row-${page.id}-date`}>{formatDate(page)}</span>
						</div>
						<h3 class="pl-page-title" data-testid={`admin-pages-row-${page.id}-title`}>{getTitle(page)}</h3>
						<p class="al-excerpt">{getExcerpt(page)}</p>
					</div>

					<!-- Status badges -->
					<div class="pl-langs" data-testid={`admin-pages-row-${page.id}-status`}>
						<button 
							class="pl-lang-badge {page.translations?.uk?.isPublished ? 'published' : 'draft'}"
							class:is-toggling={togglingId === `${page.id}-uk`}
							onclick={() => togglePublish(page, 'uk')}
							title={page.translations?.uk?.isPublished ? 'Зняти з публікації (UA)' : 'Опублікувати (UA)'}
							disabled={!!togglingId}
						>
							UA
						</button>
						<button 
							class="pl-lang-badge {page.translations?.en?.isPublished ? 'published' : 'draft'}"
							class:is-toggling={togglingId === `${page.id}-en`}
							onclick={() => togglePublish(page, 'en')}
							title={page.translations?.en?.isPublished ? 'Зняти з публікації (EN)' : 'Опублікувати (EN)'}
							disabled={!!togglingId}
						>
							EN
						</button>
					</div>

					<!-- Actions -->
					<div class="pl-actions" data-testid={`admin-pages-row-${page.id}-actions`}>
						<a href="{base}/admin/pages/{page.id}" class="pl-action-btn pl-edit-btn" data-testid={`admin-pages-edit-${page.id}-button`} title={$t('admin.articles.edit')}>
							<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
							<span>{$t('admin.articles.edit')}</span>
						</a>
						{#if canDelete}
							<button onclick={() => handleDelete(page.id)} class="pl-action-btn pl-delete-btn" data-testid={`admin-pages-delete-${page.id}-button`} title={$t('admin.articles.delete')}>
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
.pl-page { padding: 140px 24px 80px; }

/* Header */
.pl-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; }
.pl-title-group { display: flex; align-items: center; gap: 1rem; }
.pl-back-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--color-border); color: var(--color-muted-text); text-decoration: none; flex-shrink: 0; transition: all 0.15s; }
.pl-back-btn:hover { border-color: var(--color-sea-blue); color: var(--color-sea-blue); }
.pl-title { font-family: var(--font-heading); color: var(--color-deep-ocean); font-size: 1.8rem; margin: 0; }
.pl-count { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; padding: 0 8px; background: var(--color-sea-blue); color: #fff; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
.pl-create-btn { display: flex; align-items: center; white-space: nowrap; }

/* Filter Bar shared styles */
.al-filters-bar { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 2rem; align-items: center; background: var(--theme-dynamic-card-bg); padding: 1.25rem; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
.al-search-box { flex: 1; min-width: 280px; position: relative; display: flex; align-items: center; }
:global(.al-search-icon) { position: absolute; left: 1rem; color: var(--color-sea-blue); opacity: 0.5; }
.al-search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; border-radius: 14px; border: 2px solid var(--color-border); background: var(--color-surface); font-size: 0.95rem; transition: all 0.2s; color: var(--color-dark-text); }
.al-search-box input:focus { outline: none; border-color: var(--color-sea-blue); box-shadow: 0 0 0 4px rgba(33, 150, 186, 0.1); }
.al-filter-groups { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
.select-wrapper { position: relative; display: flex; align-items: center; }
:global(.select-icon) { position: absolute; left: 0.85rem; color: var(--color-sea-blue); opacity: 0.6; pointer-events: none; }
.al-filter-select { padding: 0.55rem 1rem 0.55rem 2.25rem; border-radius: 12px; border: 2px solid var(--color-border); background: var(--color-surface); color: var(--color-dark-text); font-weight: 700; font-size: 0.82rem; cursor: pointer; outline: none; appearance: none; min-width: 140px; transition: all 0.2s; }
.al-filter-select:hover { border-color: var(--color-sea-blue); }
.al-filter-select:focus { border-color: var(--color-sea-blue); box-shadow: 0 0 0 4px rgba(33, 150, 186, 0.1); }

.mode-toggle-group { display: flex; background: var(--color-ice-blue); padding: 0.25rem; border-radius: 12px; border: 1px solid rgba(0, 95, 174, 0.08); }
:global(.dark-theme) .mode-toggle-group { background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.1); }
.mode-btn { padding: 0.4rem 1rem; border-radius: 10px; border: none; background: transparent; font-size: 0.82rem; font-weight: 700; color: var(--color-muted-text); cursor: pointer; transition: all 0.2s; }
.mode-btn.active { background: white; color: var(--color-sea-blue); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
:global(.dark-theme) .mode-btn.active { background: var(--color-sea-blue); color: white; }

/* List */
.pl-list { display: flex; flex-direction: column; gap: 0.75rem; }
.pl-card { display: flex; align-items: center; gap: 1.5rem; background: var(--theme-dynamic-card-bg); border: 1px solid var(--color-border); border-radius: 24px; padding: 1.25rem; transition: all 0.2s; }
.pl-card:hover { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04); border-color: var(--color-sea-blue-light, #3aacce); transform: translateX(4px); }
.pl-thumb { width: 84px; height: 84px; border-radius: 16px; overflow: hidden; flex-shrink: 0; background: var(--color-border); display: flex; align-items: center; justify-content: center; }
.pl-thumb img { width: 100%; height: 100%; object-fit: cover; }
.pl-thumb-empty { background: var(--theme-dynamic-section-bg, #f8f9fa); color: var(--color-muted-text); }
.pl-info { flex: 1; min-width: 0; }
.pl-info-top { margin-bottom: 0.5rem; }
.pl-date { font-size: 0.8rem; font-weight: 600; color: var(--color-muted-text); opacity: 0.8; }
.pl-page-title { font-size: 1.15rem; font-weight: 700; color: var(--color-dark-text); margin: 0; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.al-excerpt { font-size: 0.88rem; line-height: 1.5; opacity: 0.5; margin-top: 0.4rem; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Status */
.pl-langs { display: flex; flex-direction: column; gap: 0.4rem; flex-shrink: 0; }
.pl-lang-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.05em; border: none; cursor: pointer; font-family: inherit; }
.pl-lang-badge.published { background: rgba(16, 185, 129, 0.12); color: #059669; }
.pl-lang-badge.draft { background: rgba(245, 166, 35, 0.15); color: #d97706; }
:global(.dark-theme) .pl-lang-badge.published { background: rgba(52, 211, 153, 0.18); color: #6ee7b7; }
:global(.dark-theme) .pl-lang-badge.draft { background: rgba(245, 166, 35, 0.2); color: #fbbf24; }
.pl-lang-badge:hover:not(:disabled) { filter: brightness(0.9); transform: translateY(-1px); }
.pl-lang-badge.is-toggling { opacity: 0.5; pointer-events: none; }
.pl-lang-badge.published::before { content: '●'; font-size: 0.6em; }
.pl-lang-badge.draft::before    { content: '○'; font-size: 0.6em; }

/* Actions */
.pl-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.pl-action-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1rem; border-radius: 14px; font-size: 0.85rem; font-weight: 700; cursor: pointer; text-decoration: none; border: 2px solid transparent; transition: all 0.2s; }
.pl-edit-btn { background: var(--color-ice-blue); color: var(--color-sea-blue); }
.pl-edit-btn:hover { background: var(--color-sea-blue); color: #fff; box-shadow: 0 4px 12px rgba(33, 150, 186, 0.2); }
.pl-delete-btn { background: none; color: var(--color-muted-text); border-color: var(--color-border); padding: 0.55rem; }
.pl-delete-btn:hover { background: rgba(239, 68, 68, 0.08); border-color: #ef4444; color: #ef4444; }

/* Skeleton */
.al-skeleton { height: 110px; border-radius: 24px; background: linear-gradient(90deg, var(--color-border) 25%, rgba(200,221,230,0.4) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: al-shimmer 1.4s ease-in-out infinite; margin-bottom: 0.75rem; }
@keyframes al-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Empty state */
.al-empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; color: var(--color-muted-text); text-align: center; }
.al-empty p { margin: 0; font-size: 1rem; font-weight: 600; opacity: 0.7; }

/* Responsive */
@media (max-width: 1024px) { .al-filters-bar { flex-direction: column; align-items: stretch; } .al-search-box { width: 100%; } }
@media (max-width: 640px) { .pl-card { gap: 1rem; padding: 1rem; } .pl-thumb { width: 60px; height: 60px; border-radius: 12px; } .pl-page-title { font-size: 1rem; } .al-excerpt { display: none; } .pl-edit-btn span { display: none; } .pl-edit-btn { padding: 0.55rem; } .pl-langs { flex-direction: row; gap: 0.35rem; } }
</style>