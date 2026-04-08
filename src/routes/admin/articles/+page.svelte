<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { deleteArticle, fetchAllArticles } from '$lib/services/admin-articles';
	import { getDisplayDate, type Article } from '$lib/services/articles';
	import { ARTICLE_CATEGORIES, type ArticleCategory } from '$lib/config/categories';
	import { locale, t } from 'svelte-i18n';
	import { get } from 'svelte/store';

	let articles = $state<Article[]>([]);
	let loading = $state(true);

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
			toast.success('Статтю видалено');
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.editor.errorUpdate'));
		}
	}

	function formatDate(article: Article) {
		const timestamp = getDisplayDate(article);
		if (!timestamp) return get(t)('admin.editor.dateHidden');
		return timestamp.toDate().toLocaleDateString('uk-UA');
	}
</script>

<section class="admin-articles container" style="padding: 160px 24px;" data-testid="admin-articles-section-container">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;" data-testid="admin-articles-header-group">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);" data-testid="admin-articles-title-label">{$t('admin.articles.title')}</h1>
		<div style="display: flex; gap: 1rem;" data-testid="admin-articles-actions-group">
			<a href="{base}/admin" class="btn btn-outline" data-testid="admin-articles-back-button">{$t('admin.articles.backToPanel')}</a>
			<a href="{base}/admin/articles/new" class="btn btn-primary" data-testid="admin-articles-create-button">+ {$t('admin.articles.createBtn')}</a>
		</div>
	</div>

	<div style="background: var(--theme-dynamic-card-bg); border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden;" data-testid="admin-articles-table-container">
		{#if loading}
			<p style="padding: 3rem; text-align: center;" data-testid="admin-articles-loading-label">{$t('admin.articles.loading')}</p>
		{:else if articles.length === 0}
			<p style="padding: 3rem; text-align: center; opacity: 0.5;" data-testid="admin-articles-empty-label">{$t('admin.articles.noArticles')}</p>
		{:else}
			<table style="width: 100%; border-collapse: collapse; text-align: left;" data-testid="admin-articles-list-table">
				<thead>
					   <tr style="background: var(--theme-dynamic-section-bg); border-bottom: 1px solid var(--color-border);" data-testid="admin-articles-table-header-row">
						<th style="padding: 1.5rem;">{$t('admin.articles.tableTitle')}</th>
						<th style="padding: 1.5rem;">{$t('admin.articles.tableCategory')}</th>
						<th style="padding: 1.5rem;">{$t('admin.articles.tableDate')}</th>
						<th style="padding: 1.5rem;">{$t('admin.articles.tableStatus')}</th>
						<th style="padding: 1.5rem; text-align: right;">{$t('admin.articles.tableActions')}</th>
					</tr>
				</thead>
				<tbody>
					{#each articles as article}
						<tr style="border-bottom: 1px solid #f5f5f5;" data-testid={`admin-articles-row-${article.id}-group`}>
							<td style="padding: 1.5rem; font-weight: 600;" data-testid={`admin-articles-row-${article.id}-title`}>{article.translations?.uk?.title || 'No Title'}</td>
							<td style="padding: 1.5rem;" data-testid={`admin-articles-row-${article.id}-category`}>{ARTICLE_CATEGORIES[article.category as ArticleCategory]?.uk || article.category}</td>
							<td style="padding: 1.5rem;" data-testid={`admin-articles-row-${article.id}-date`}>{formatDate(article)}</td>
							<td style="padding: 1.5rem;" data-testid={`admin-articles-row-${article.id}-status`}>
								<span style="color: {article.translations?.uk?.isPublished ? '#2e7d32' : '#f5a623'};">
									UK: {article.translations?.uk?.isPublished ? '●' : '○'}
								</span>
								<span style="margin-left: 1rem; color: {article.translations?.en?.isPublished ? '#2e7d32' : '#f5a623'};">
									EN: {article.translations?.en?.isPublished ? '●' : '○'}
								</span>
							</td>
							<td style="padding: 1.5rem; text-align: right;">
								<div style="display: flex; gap: 0.5rem; justify-content: flex-end;" data-testid={`admin-articles-row-${article.id}-actions`}>
									<a href="{base}/admin/articles/{article.id}" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;" data-testid={`admin-articles-edit-${article.id}-button`}>{$t('admin.articles.edit')}</a>
									   <button onclick={() => handleDelete(article.id)} class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.9rem; color: var(--color-danger, #d32f2f); border: 1px solid var(--color-danger, #d32f2f); background: none; border-radius: 12px; cursor: pointer;" data-testid={`admin-articles-delete-${article.id}-button`}>{$t('admin.articles.delete')}</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>
