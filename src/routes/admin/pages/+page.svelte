<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { deleteArticle, fetchAllPages } from '$lib/services/admin-articles';
	import type { Article } from '$lib/services/articles';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';

	let pages = $state<Article[]>([]);
	let loading = $state(true);
	let search = $state('');

	const filtered = $derived(
		search.trim()
			? pages.filter(p =>
				p.translations?.uk?.title?.toLowerCase().includes(search.toLowerCase()) ||
				p.translations?.en?.title?.toLowerCase().includes(search.toLowerCase()) ||
				p.slug?.toLowerCase().includes(search.toLowerCase())
			)
			: pages
	);

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
		<a href="{base}/admin/pages/new" class="btn btn-primary pl-create-btn" data-testid="admin-pages-create-button">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
			{$t('admin.pages.createBtn')}
		</a>
	</div>

	<!-- Search -->
	{#if !loading && pages.length > 0}
		<div class="pl-search-wrap">
			<svg class="pl-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
			<input class="pl-search" type="search" placeholder={$t('admin.articles.search') || 'Пошук...'} bind:value={search} />
		</div>
	{/if}

	<!-- List -->
	<div class="pl-list" data-testid="admin-pages-table-container">
		{#if loading}
			{#each [1,2,3] as _}
				<div class="pl-skeleton"></div>
			{/each}
		{:else if filtered.length === 0}
			<div class="pl-empty" data-testid="admin-pages-empty-label">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
				<p>{search ? ($t('admin.articles.noResults') || 'Нічого не знайдено') : $t('admin.pages.noPages')}</p>
			</div>
		{:else}
			{#each filtered as page (page.id)}
				<div class="pl-card" data-testid={`admin-pages-row-${page.id}-group`}>
					<!-- Page icon -->
					<div class="pl-icon-wrap">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
					</div>

					<!-- Main info -->
					<div class="pl-info">
						<h3 class="pl-page-title" data-testid={`admin-pages-row-${page.id}-title`}>
							{page.translations?.uk?.title || page.translations?.en?.title || 'No Title'}
						</h3>
						{#if page.translations?.en?.title && page.translations.en.title !== page.translations?.uk?.title}
							<p class="pl-en-title">{page.translations.en.title}</p>
						{/if}
						<div class="pl-slug-wrap" data-testid={`admin-pages-row-${page.id}-slug`}>
							<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
							<code class="pl-slug">/{page.slug || '—'}</code>
						</div>
					</div>

					<!-- Status badges -->
					<div class="pl-langs" data-testid={`admin-pages-row-${page.id}-status`}>
						<span class="pl-lang-badge {page.translations?.uk?.isPublished ? 'published' : 'draft'}">UA</span>
						<span class="pl-lang-badge {page.translations?.en?.isPublished ? 'published' : 'draft'}">EN</span>
					</div>

					<!-- Actions -->
					<div class="pl-actions" data-testid={`admin-pages-row-${page.id}-actions`}>
						<a href="{base}/admin/pages/{page.id}" class="pl-action-btn pl-edit-btn" data-testid={`admin-pages-edit-${page.id}-button`} title={$t('admin.articles.edit')}>
							<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
							<span>{$t('admin.articles.edit')}</span>
						</a>
						<button onclick={() => handleDelete(page.id)} class="pl-action-btn pl-delete-btn" data-testid={`admin-pages-delete-${page.id}-button`} title={$t('admin.articles.delete')}>
							<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
.pl-page {
	padding: 140px 24px 80px;
}

/* Header */
.pl-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 2rem;
	gap: 1rem;
}
.pl-title-group {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.pl-back-btn {
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
.pl-back-btn:hover {
	border-color: var(--color-sea-blue);
	color: var(--color-sea-blue);
}
.pl-title {
	font-family: var(--font-heading);
	color: var(--color-deep-ocean);
	font-size: 1.8rem;
	margin: 0;
}
.pl-count {
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
.pl-create-btn {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	white-space: nowrap;
}

/* Search */
.pl-search-wrap {
	position: relative;
	margin-bottom: 1.5rem;
}
.pl-search-icon {
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: var(--color-muted-text);
	pointer-events: none;
}
.pl-search {
	width: 100%;
	padding: 0.75rem 1rem 0.75rem 2.75rem;
	border: 2px solid var(--color-border);
	border-radius: 16px;
	background: var(--theme-dynamic-card-bg);
	color: var(--color-dark-text);
	font-size: 0.95rem;
	outline: none;
	transition: border-color 0.15s;
	box-sizing: border-box;
}
.pl-search:focus {
	border-color: var(--color-sea-blue);
}

/* List */
.pl-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

/* Card */
.pl-card {
	display: flex;
	align-items: center;
	gap: 1.25rem;
	background: var(--theme-dynamic-card-bg);
	border: 1px solid var(--color-border);
	border-radius: 20px;
	padding: 1rem 1.25rem;
	transition: box-shadow 0.2s, border-color 0.2s;
}
.pl-card:hover {
	box-shadow: 0 6px 24px rgba(33, 150, 186, 0.1);
	border-color: var(--color-sea-blue-light, #3aacce);
}

/* Icon */
.pl-icon-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 54px;
	height: 54px;
	border-radius: 14px;
	background: rgba(33, 150, 186, 0.08);
	color: var(--color-sea-blue);
	flex-shrink: 0;
}

/* Info */
.pl-info {
	flex: 1;
	min-width: 0;
}
.pl-page-title {
	font-size: 1rem;
	font-weight: 700;
	color: var(--color-dark-text);
	margin: 0 0 0.2rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.pl-en-title {
	font-size: 0.8rem;
	color: var(--color-muted-text);
	margin: 0 0 0.3rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.pl-slug-wrap {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	color: var(--color-muted-text);
}
.pl-slug {
	font-family: monospace;
	font-size: 0.78rem;
	color: var(--color-sea-blue);
	background: rgba(33, 150, 186, 0.08);
	padding: 1px 8px;
	border-radius: 6px;
}

/* Lang badges */
.pl-langs {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	flex-shrink: 0;
}
.pl-lang-badge {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 0.72rem;
	font-weight: 700;
	padding: 3px 10px;
	border-radius: 20px;
	letter-spacing: 0.04em;
}
.pl-lang-badge.published {
	background: rgba(16, 185, 129, 0.12);
	color: #065f46;
}
.pl-lang-badge.draft {
	background: rgba(245, 166, 35, 0.15);
	color: #92400e;
}
.pl-lang-badge.published::before { content: '●'; font-size: 0.6em; }
.pl-lang-badge.draft::before    { content: '○'; font-size: 0.6em; }

/* Actions */
.pl-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-shrink: 0;
}
.pl-action-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.45rem 0.9rem;
	border-radius: 12px;
	font-size: 0.82rem;
	font-weight: 600;
	cursor: pointer;
	text-decoration: none;
	border: 2px solid transparent;
	transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.pl-edit-btn {
	background: rgba(33, 150, 186, 0.1);
	color: var(--color-sea-blue);
}
.pl-edit-btn:hover {
	background: var(--color-sea-blue);
	color: #fff;
}
.pl-delete-btn {
	background: none;
	color: var(--color-muted-text);
	border-color: var(--color-border);
	padding: 0.45rem;
}
.pl-delete-btn:hover {
	background: rgba(239, 68, 68, 0.1);
	border-color: #ef4444;
	color: #ef4444;
}

/* Skeleton */
.pl-skeleton {
	height: 82px;
	border-radius: 20px;
	background: linear-gradient(90deg, var(--color-border) 25%, rgba(200,221,230,0.4) 50%, var(--color-border) 75%);
	background-size: 200% 100%;
	animation: pl-shimmer 1.4s ease-in-out infinite;
}
@keyframes pl-shimmer {
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

/* Empty state */
.pl-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 4rem 2rem;
	color: var(--color-muted-text);
	text-align: center;
}
.pl-empty p { margin: 0; font-size: 1rem; }

/* Responsive */
@media (max-width: 640px) {
	.pl-icon-wrap { width: 42px; height: 42px; border-radius: 10px; }
	.pl-page-title { font-size: 0.9rem; }
	.pl-edit-btn span { display: none; }
	.pl-edit-btn { padding: 0.45rem; }
	.pl-langs { flex-direction: row; }
}
</style>
