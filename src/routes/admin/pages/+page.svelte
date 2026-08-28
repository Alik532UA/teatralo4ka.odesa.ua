<script lang="ts">
	import { authService } from '$lib/controllers/auth.svelte';
	import { toast } from '$lib/controllers/toast.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { deleteArticle, fetchAllPages, updateArticle } from '$lib/services/admin-articles';
	import { logError } from '$lib/services/firebaseErrors';
	import { getDisplayDate, type Article, type StoredArticle } from '$lib/services/articles';
	import { t, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { ArrowLeft, Calendar, FilePlus, Search, SquarePen, Trash2 } from 'lucide-svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { getContentExcerpt } from '$lib/utils/renderContent';

	let pages = $state<StoredArticle[]>([]);
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
		// Локальний тимчасовий набір усередині $derived.by: живе один прохід,
		// назовні віддається масивом. SvelteSet тут лише додав би обгортку.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
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
		const currentLang = (get(locale) as 'uk' | 'en') || 'uk';
		return sorted.filter(p => {
			// Search
			const title = p.translations?.[currentLang]?.title || '';
			const excerpt = (p.translations?.[currentLang]?.content || '').replace(/[#*`_[\]()]/g, '');
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
			goto(resolve('/admin/login'));
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
		} catch (e: unknown) {
			logError(e);
			toast.error(e instanceof Error ? e.message : get(t)('admin.pages.deleteError'));
		}
	}

	async function togglePublish(article: Article, lang: 'uk' | 'en') {
		if (!article.id || togglingId) return;
		
		const canEdit = isSuperAdmin || permissions?.canEditPages === true;
		if (!canEdit) {
			toast.error($t('admin.content.noPermissionToggle'));
			return;
		}

		togglingId = `${article.id}-${lang}`;
		try {
			const currentStatus = article.translations?.[lang]?.isPublished ?? false;
			const newTranslations = {
				uk: { ...article.translations.uk },
				en: { ...article.translations.en },
				[lang]: {
					...article.translations[lang],
					isPublished: !currentStatus
				}
			};

			await updateArticle(article.id, {
				translations: newTranslations,
				type: 'page'
			});

			const idx = pages.findIndex(p => p.id === article.id);
			if (idx !== -1) {
				pages[idx].translations = newTranslations;
			}
			
			toast.success($t('admin.content.statusUpdated', { values: { lang: lang.toUpperCase() } }));
		} catch (e: unknown) {
			logError(e);
			toast.error(e instanceof Error ? e.message : $t('admin.content.statusUpdateError'));
		} finally {
			togglingId = null;
		}
	}

	function formatDate(page: Article) {
		const timestamp = getDisplayDate(page);
		if (!timestamp) return get(t)('admin.editor.dateHidden');
		return timestamp.toDate().toLocaleDateString(get(locale) === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function getExcerpt(page: Article) {
		const currentLang = (get(locale) as 'uk' | 'en') || 'uk';
		const translation = page.translations?.[currentLang];
		// Спільний помічник замість власної копії — див. admin/content.
		// Викидання самих лише дужок склеювало підпис посилання з адресою.
		return getContentExcerpt(translation?.content || '', translation?.contentFormat, 120);
	}

	function getTitle(page: Article) {
		const currentLang = (get(locale) as 'uk' | 'en') || 'uk';
		return page.translations?.[currentLang]?.title || '';
	}

	function getCoverUrl(page: Article): string {
		return page.translations?.uk?.coverUrl || page.translations?.en?.coverUrl || '';
	}
</script>

<section class="pl-page container" data-testid="admin-pages-section-container">
	<!-- Header -->
	<div class="pl-header" data-testid="admin-pages-header">
		<div class="pl-title-group">
			<a href={resolve('/admin')} class="pl-back-btn" data-testid="admin-pages-back-btn" title={$t('admin.pages.backToPanel')}>
				<ArrowLeft size={20} aria-hidden="true" />
			</a>
			<h1 class="pl-title" data-testid="admin-pages-title">{$t('admin.pages.title')}</h1>
			{#if !loading}
				<span class="pl-count">{pages.length}</span>
			{/if}
		</div>
		{#if canCreate}
			<a href={resolve('/admin/pages/new')} class="btn btn-primary pl-create-btn" data-testid="admin-pages-create-btn">
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
				<button class="mode-btn" class:active={filterStatus === 'all'} onclick={() => filterStatus = 'all'}>{$t('admin.content.filterAll')}</button>
				<button class="mode-btn" class:active={filterStatus === 'published'} onclick={() => filterStatus = 'published'}>{$t('admin.content.filterPublished')}</button>
				<button class="mode-btn" class:active={filterStatus === 'draft'} onclick={() => filterStatus = 'draft'}>{$t('admin.content.filterDraft')}</button>
			</div>

			<Select
				bind:value={filterYear}
				options={[
					{ value: 'all', label: $t('admin.content.allYears') },
					...availableYears.map((year) => ({
						value: String(year),
						label: $t('admin.content.yearSuffix', { values: { year } })
					})),
					{ value: 'none', label: $t('admin.content.noDate') }
				]}
				ariaLabel={$t('admin.content.allYears')}
				testId="admin-pages-filter-year-select"
			>
				{#snippet leading()}<Calendar size={14} />{/snippet}
			</Select>
		</div>
	</div>

	<div class="pl-list" data-testid="admin-pages-table-container">
		{#if loading}
			{#each [1,2,3] as n (n)}
				<div class="al-skeleton"></div>
			{/each}
		{:else if filtered.length === 0}
			<div class="al-empty">
				<Search size={48} opacity={0.2} />
				<p>{search ? $t('admin.pages.noResults') : $t('admin.pages.noPages')}</p>
			</div>
		{:else}
			{#each filtered as page (page.id)}
				<div class="pl-card" data-testid={`admin-pages-row-${page.id}-container`}>
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
							title={page.translations?.uk?.isPublished ? $t('admin.content.unpublish', { values: { lang: 'UA' } }) : $t('admin.content.publish', { values: { lang: 'UA' } })}
							disabled={!!togglingId}
						>
							UA
						</button>
						<button 
							class="pl-lang-badge {page.translations?.en?.isPublished ? 'published' : 'draft'}"
							class:is-toggling={togglingId === `${page.id}-en`}
							onclick={() => togglePublish(page, 'en')}
							title={page.translations?.en?.isPublished ? $t('admin.content.unpublish', { values: { lang: 'EN' } }) : $t('admin.content.publish', { values: { lang: 'EN' } })}
							disabled={!!togglingId}
						>
							EN
						</button>
					</div>

					<!-- Actions -->
					<div class="pl-actions" data-testid={`admin-pages-row-${page.id}-actions`}>
						<a href={resolve('/admin/pages/[id]', { id: page.id })} class="pl-action-btn pl-edit-btn" data-testid={`admin-pages-edit-${page.id}-btn`} title={$t('admin.articles.edit')}>
							<SquarePen size={17} aria-hidden="true" />
							<span>{$t('admin.articles.edit')}</span>
						</a>
						{#if canDelete}
							<button onclick={() => handleDelete(page.id)} class="pl-action-btn pl-delete-btn" data-testid={`admin-pages-delete-${page.id}-btn`} title={$t('admin.articles.delete')}>
								<Trash2 size={17} aria-hidden="true" />
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
.pl-back-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.pl-title { font-family: var(--font-heading); color: var(--text-title); font-size: 1.8rem; margin: 0; }
.pl-count { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; padding: 0 8px; background: var(--accent-primary); color: var(--text-on-accent); border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
.pl-create-btn { display: flex; align-items: center; white-space: nowrap; }

/* Filter Bar shared styles */
.al-filters-bar { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 2rem; align-items: center; background: var(--bg-card); padding: 1.25rem; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
.al-search-box { flex: 1; min-width: 280px; position: relative; display: flex; align-items: center; }
:global(.al-search-icon) { position: absolute; left: 1rem; color: var(--accent-primary); opacity: 0.5; }
.al-search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; border-radius: 14px; border: 2px solid var(--color-border); background: var(--color-surface); font-size: 0.95rem; transition: all 0.2s; color: var(--color-dark-text); }
.al-search-box input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 4px rgba(33, 150, 186, 0.1); }
.al-filter-groups { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
:global(.select-icon) { position: absolute; left: 0.85rem; color: var(--accent-primary); opacity: 0.6; pointer-events: none; }
.mode-toggle-group { display: flex; background: var(--color-ice-blue); padding: 0.25rem; border-radius: 12px; border: 1px solid rgba(0, 95, 174, 0.08); }
:global(.dark-theme) .mode-toggle-group { background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.1); }
.mode-btn { padding: 0.4rem 1rem; border-radius: 10px; border: none; background: transparent; font-size: 0.82rem; font-weight: 700; color: var(--color-muted-text); cursor: pointer; transition: all 0.2s; }
.mode-btn.active { background: var(--bg-card); color: var(--accent-text); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
:global(.dark-theme) .mode-btn.active { background: var(--accent-primary); color: var(--text-on-accent); }

/* List */
.pl-list { display: flex; flex-direction: column; gap: 0.75rem; }
.pl-card { display: flex; align-items: center; gap: 1.5rem; background: var(--bg-card); border: 1px solid var(--color-border); border-radius: 24px; padding: 1.25rem; transition: all 0.2s; }
.pl-card:hover { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border-color: var(--accent-primary-light, #3aacce); }
.pl-thumb { width: 84px; height: 84px; border-radius: 16px; overflow: hidden; flex-shrink: 0; background: var(--color-border); display: flex; align-items: center; justify-content: center; }
.pl-thumb img { width: 100%; height: 100%; object-fit: cover; }
.pl-thumb-empty { background: var(--bg-surface); color: var(--color-muted-text); }
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
.pl-edit-btn { background: var(--color-ice-blue); color: var(--accent-text); }
.pl-edit-btn:hover { background: var(--accent-primary); color: var(--text-on-accent); box-shadow: 0 4px 12px rgba(33, 150, 186, 0.2); }
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