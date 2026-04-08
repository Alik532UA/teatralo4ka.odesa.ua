<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { deleteArticle, fetchAllArticles } from '$lib/services/admin-articles';
	import { getDisplayDate, type Article } from '$lib/services/articles';
	import { ARTICLE_CATEGORIES, type ArticleCategory } from '$lib/config/categories';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';

	let articles = $state<Article[]>([]);
	let loading = $state(true);
	let search = $state('');

	const filtered = $derived(
		search.trim()
			? articles.filter(a =>
				a.translations?.uk?.title?.toLowerCase().includes(search.toLowerCase()) ||
				a.translations?.en?.title?.toLowerCase().includes(search.toLowerCase()) ||
				a.category?.toLowerCase().includes(search.toLowerCase())
			)
			: articles
	);

	async function loadAll() {
		loading = true;
		articles = await fetchAllArticles();
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
		if (!id || !(await toast.confirm(get(t)('admin.articles.deleteConfirm')))) return;
		try {
			await deleteArticle(id);
			articles = articles.filter(a => a.id !== id);
			toast.success(get(t)('admin.articles.deleteSuccess') || 'Статтю видалено');
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.editor.errorUpdate'));
		}
	}

	function formatDate(article: Article) {
		const timestamp = getDisplayDate(article);
		if (!timestamp) return get(t)('admin.editor.dateHidden');
		return timestamp.toDate().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function getCoverUrl(article: Article): string {
		return article.translations?.uk?.coverUrl || article.translations?.en?.coverUrl || '';
	}
</script>

<section class="al-page container" data-testid="admin-articles-section-container">
	<!-- Header -->
	<div class="al-header" data-testid="admin-articles-header-group">
		<div class="al-title-group">
			<a href="{base}/admin" class="al-back-btn" data-testid="admin-articles-back-button" title={$t('admin.articles.backToPanel')}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
			</a>
			<h1 class="al-title" data-testid="admin-articles-title-label">{$t('admin.articles.title')}</h1>
			{#if !loading}
				<span class="al-count">{articles.length}</span>
			{/if}
		</div>
		<a href="{base}/admin/articles/new" class="btn btn-primary al-create-btn" data-testid="admin-articles-create-button">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
			{$t('admin.articles.createBtn')}
		</a>
	</div>

	<!-- Search -->
	{#if !loading && articles.length > 0}
		<div class="al-search-wrap">
			<svg class="al-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
			<input class="al-search" type="search" placeholder={$t('admin.articles.search') || 'Пошук...'} bind:value={search} />
		</div>
	{/if}

	<!-- List -->
	<div class="al-list" data-testid="admin-articles-table-container">
		{#if loading}
			{#each [1,2,3,4] as _}
				<div class="al-skeleton"></div>
			{/each}
		{:else if filtered.length === 0}
			<div class="al-empty" data-testid="admin-articles-empty-label">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
				<p>{search ? ($t('admin.articles.noResults') || 'Нічого не знайдено') : $t('admin.articles.noArticles')}</p>
			</div>
		{:else}
			{#each filtered as article (article.id)}
				<div class="al-card" data-testid={`admin-articles-row-${article.id}-group`}>
					<!-- Cover thumbnail -->
					{#if getCoverUrl(article)}
						<div class="al-thumb">
							<img src={getCoverUrl(article)} alt="" loading="lazy" />
						</div>
					{:else}
						<div class="al-thumb al-thumb-empty">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".35"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
						</div>
					{/if}

					<!-- Main info -->
					<div class="al-info">
						<div class="al-info-top">
							<span class="al-category" data-testid={`admin-articles-row-${article.id}-category`}>
								{ARTICLE_CATEGORIES[article.category as ArticleCategory]?.uk || article.category}
							</span>
							<span class="al-date" data-testid={`admin-articles-row-${article.id}-date`}>{formatDate(article)}</span>
						</div>
						<h3 class="al-article-title" data-testid={`admin-articles-row-${article.id}-title`}>
							{article.translations?.uk?.title || article.translations?.en?.title || 'No Title'}
						</h3>
						{#if article.translations?.en?.title && article.translations.en.title !== article.translations?.uk?.title}
							<p class="al-en-title">{article.translations.en.title}</p>
						{/if}
					</div>

					<!-- Status badges -->
					<div class="al-langs" data-testid={`admin-articles-row-${article.id}-status`}>
						<span class="al-lang-badge {article.translations?.uk?.isPublished ? 'published' : 'draft'}">
							UA
						</span>
						<span class="al-lang-badge {article.translations?.en?.isPublished ? 'published' : 'draft'}">
							EN
						</span>
					</div>

					<!-- Actions -->
					<div class="al-actions" data-testid={`admin-articles-row-${article.id}-actions`}>
						<a href="{base}/admin/articles/{article.id}" class="al-action-btn al-edit-btn" data-testid={`admin-articles-edit-${article.id}-button`} title={$t('admin.articles.edit')}>
							<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
							<span>{$t('admin.articles.edit')}</span>
						</a>
						<button onclick={() => handleDelete(article.id)} class="al-action-btn al-delete-btn" data-testid={`admin-articles-delete-${article.id}-button`} title={$t('admin.articles.delete')}>
							<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
.al-page {
	padding: 140px 24px 80px;
}

/* Header */
.al-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 2rem;
	gap: 1rem;
}
.al-title-group {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.al-back-btn {
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
.al-back-btn:hover {
	border-color: var(--color-sea-blue);
	color: var(--color-sea-blue);
}
.al-title {
	font-family: var(--font-heading);
	color: var(--color-deep-ocean);
	font-size: 1.8rem;
	margin: 0;
}
.al-count {
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
.al-create-btn {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	white-space: nowrap;
}

/* Search */
.al-search-wrap {
	position: relative;
	margin-bottom: 1.5rem;
}
.al-search-icon {
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: var(--color-muted-text);
	pointer-events: none;
}
.al-search {
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
.al-search:focus {
	border-color: var(--color-sea-blue);
}

/* List */
.al-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

/* Card */
.al-card {
	display: flex;
	align-items: center;
	gap: 1.25rem;
	background: var(--theme-dynamic-card-bg);
	border: 1px solid var(--color-border);
	border-radius: 20px;
	padding: 1rem 1.25rem;
	transition: box-shadow 0.2s, border-color 0.2s;
}
.al-card:hover {
	box-shadow: 0 6px 24px rgba(33, 150, 186, 0.1);
	border-color: var(--color-sea-blue-light, #3aacce);
}

/* Thumbnail */
.al-thumb {
	width: 72px;
	height: 72px;
	border-radius: 14px;
	overflow: hidden;
	flex-shrink: 0;
	background: var(--color-border);
}
.al-thumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.al-thumb-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--theme-dynamic-section-bg, #f8f9fa);
	color: var(--color-muted-text);
}

/* Info */
.al-info {
	flex: 1;
	min-width: 0;
}
.al-info-top {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.35rem;
	flex-wrap: wrap;
}
.al-category {
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--color-sea-blue);
	background: rgba(33, 150, 186, 0.1);
	padding: 2px 10px;
	border-radius: 20px;
}
.al-date {
	font-size: 0.8rem;
	color: var(--color-muted-text);
}
.al-article-title {
	font-size: 1rem;
	font-weight: 700;
	color: var(--color-dark-text);
	margin: 0 0 0.2rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.al-en-title {
	font-size: 0.8rem;
	color: var(--color-muted-text);
	margin: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* Lang badges */
.al-langs {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	flex-shrink: 0;
}
.al-lang-badge {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 0.72rem;
	font-weight: 700;
	padding: 3px 10px;
	border-radius: 20px;
	letter-spacing: 0.04em;
}
.al-lang-badge.published {
	background: rgba(16, 185, 129, 0.12);
	color: #065f46;
}
.al-lang-badge.draft {
	background: rgba(245, 166, 35, 0.15);
	color: #92400e;
}
.al-lang-badge.published::before { content: '●'; font-size: 0.6em; }
.al-lang-badge.draft::before    { content: '○'; font-size: 0.6em; }

/* Actions */
.al-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-shrink: 0;
}
.al-action-btn {
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
.al-edit-btn {
	background: rgba(33, 150, 186, 0.1);
	color: var(--color-sea-blue);
	border-color: transparent;
}
.al-edit-btn:hover {
	background: var(--color-sea-blue);
	color: #fff;
}
.al-delete-btn {
	background: none;
	color: var(--color-muted-text);
	border-color: var(--color-border);
	padding: 0.45rem;
}
.al-delete-btn:hover {
	background: rgba(239, 68, 68, 0.1);
	border-color: #ef4444;
	color: #ef4444;
}

/* Skeleton */
.al-skeleton {
	height: 98px;
	border-radius: 20px;
	background: linear-gradient(90deg, var(--color-border) 25%, rgba(200,221,230,0.4) 50%, var(--color-border) 75%);
	background-size: 200% 100%;
	animation: al-shimmer 1.4s ease-in-out infinite;
}
@keyframes al-shimmer {
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

/* Empty state */
.al-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 4rem 2rem;
	color: var(--color-muted-text);
	text-align: center;
}
.al-empty p { margin: 0; font-size: 1rem; }

/* Responsive */
@media (max-width: 640px) {
	.al-card { gap: 0.75rem; padding: 0.75rem; }
	.al-thumb { width: 54px; height: 54px; border-radius: 10px; }
	.al-date { white-space: nowrap; }
	.al-article-title { font-size: 0.9rem; }
	.al-en-title { display: none; }
	.al-edit-btn span { display: none; }
	.al-edit-btn { padding: 0.45rem; }
	.al-langs { flex-direction: row; gap: 0.3rem; }
	.al-lang-badge { padding: 2px 7px; font-size: 0.65rem; }
}
</style>
