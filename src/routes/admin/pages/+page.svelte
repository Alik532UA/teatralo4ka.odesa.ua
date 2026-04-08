<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { deleteArticle, fetchAllPages } from '$lib/services/admin-articles';
	import type { Article } from '$lib/services/articles';
	import { locale, t } from 'svelte-i18n';
	import { get } from 'svelte/store';

	let pages = $state<Article[]>([]);
	let loading = $state(true);

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

<section class="admin-pages container" style="padding: 160px 24px;" data-testid="admin-pages-section-container">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;" data-testid="admin-pages-header-group">
		<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);" data-testid="admin-pages-title-label">{$t('admin.pages.title')}</h1>
		<div style="display: flex; gap: 1rem;" data-testid="admin-pages-actions-group">
			<a href="{base}/admin" class="btn btn-outline" data-testid="admin-pages-back-button">{$t('admin.pages.backToPanel')}</a>
			<a href="{base}/admin/pages/new" class="btn btn-primary" data-testid="admin-pages-create-button">+ {$t('admin.pages.createBtn')}</a>
		</div>
	</div>

	<div style="background: var(--theme-dynamic-card-bg); border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden;" data-testid="admin-pages-table-container">
		{#if loading}
			<p style="padding: 3rem; text-align: center;" data-testid="admin-pages-loading-label">{$t('admin.pages.loading')}</p>
		{:else if pages.length === 0}
			<p style="padding: 3rem; text-align: center; opacity: 0.5;" data-testid="admin-pages-empty-label">{$t('admin.pages.noPages')}</p>
		{:else}
			<table style="width: 100%; border-collapse: collapse; text-align: left;" data-testid="admin-pages-list-table">
				<thead>
					<tr style="background: var(--theme-dynamic-section-bg); border-bottom: 1px solid var(--color-border);" data-testid="admin-pages-table-header-row">
						<th style="padding: 1.5rem;">{$t('admin.articles.tableTitle')}</th>
						<th style="padding: 1.5rem;">URL</th>
						<th style="padding: 1.5rem;">{$t('admin.articles.tableStatus')}</th>
						<th style="padding: 1.5rem; text-align: right;">{$t('admin.articles.tableActions')}</th>
					</tr>
				</thead>
				<tbody>
					{#each pages as page}
						<tr style="border-bottom: 1px solid #f5f5f5;" data-testid={`admin-pages-row-${page.id}-group`}>
							<td style="padding: 1.5rem; font-weight: 600;" data-testid={`admin-pages-row-${page.id}-title`}>{page.translations?.uk?.title || 'No Title'}</td>
							<td style="padding: 1.5rem; font-family: monospace; font-size: 0.9rem;" data-testid={`admin-pages-row-${page.id}-slug`}>/{page.slug || '—'}</td>
							<td style="padding: 1.5rem;" data-testid={`admin-pages-row-${page.id}-status`}>
								<span style="color: {page.translations?.uk?.isPublished ? '#2e7d32' : '#f5a623'};">
									UK: {page.translations?.uk?.isPublished ? '●' : '○'}
								</span>
								<span style="margin-left: 1rem; color: {page.translations?.en?.isPublished ? '#2e7d32' : '#f5a623'};">
									EN: {page.translations?.en?.isPublished ? '●' : '○'}
								</span>
							</td>
							<td style="padding: 1.5rem; text-align: right;">
								<div style="display: flex; gap: 0.5rem; justify-content: flex-end;" data-testid={`admin-pages-row-${page.id}-actions`}>
									<a href="{base}/admin/pages/{page.id}" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;" data-testid={`admin-pages-edit-${page.id}-button`}>{$t('admin.articles.edit')}</a>
									<button onclick={() => handleDelete(page.id)} class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.9rem; color: var(--color-danger, #d32f2f); border: 1px solid var(--color-danger, #d32f2f); background: none; border-radius: 12px; cursor: pointer;" data-testid={`admin-pages-delete-${page.id}-button`}>{$t('admin.articles.delete')}</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>
