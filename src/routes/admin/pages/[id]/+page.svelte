<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { getAdminArticleById, updateArticle } from '$lib/services/admin-articles';
	import { onMount } from 'svelte';
	import type { DateMode } from '$lib/services/articles';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import ArticleForm, { type ArticleFormData } from '$lib/components/admin/ArticleForm.svelte';

	const id = $derived(page.params.id);
	let loading = $state(true);
	let saving = $state(false);
	let createdAtDate = $state<Date | null>(null);
	let updatedAtDate = $state<Date | null>(null);
	let articleData = $state<{
		category: string;
		slug: string;
		dateMode: DateMode;
		customDateStr: string;
		differentCovers: boolean;
		translations: {
			uk: { title: string; content: string; isPublished: boolean; coverUrl: string };
			en: { title: string; content: string; isPublished: boolean; coverUrl: string };
		};
	} | null>(null);

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(`${base}/admin/login`);
		}
	});

	onMount(async () => {
		if (!id) { goto(`${base}/admin/pages`); return; }
		const article = await getAdminArticleById(id as string);
		if (article) {
			const translations = {
				uk: { coverUrl: '', ...article.translations?.uk } as { title: string; content: string; isPublished: boolean; coverUrl: string },
				en: { coverUrl: '', ...article.translations?.en } as { title: string; content: string; isPublished: boolean; coverUrl: string }
			};
			articleData = {
				category: article.category,
				slug: article.slug ?? '',
				dateMode: article.dateMode || 'hidden',
				customDateStr: (article as any).customDate?.toDate
					? (article as any).customDate.toDate().toISOString().split('T')[0]
					: new Date().toISOString().split('T')[0],
				differentCovers: translations.uk.coverUrl !== translations.en.coverUrl,
				translations,
			};
			if ((article as any).createdAt?.toDate) createdAtDate = (article as any).createdAt.toDate();
			if ((article as any).updatedAt?.toDate) updatedAtDate = (article as any).updatedAt.toDate();
		} else {
			toast.error(get(t)('admin.editor.errorNotFound'));
			goto(`${base}/admin/pages`);
		}
		loading = false;
	});

	async function handleSubmit(data: ArticleFormData) {
		if (!id) return;
		if (!data.slug?.trim()) {
			toast.error(get(t)('admin.pages.slugRequired'));
			return;
		}
		saving = true;
		try {
			await updateArticle(id as string, { ...data, type: 'page' });
			toast.success(get(t)('admin.dashboard.saveSuccess') || 'Сторінку оновлено');
			goto(`${base}/admin/pages`);
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.editor.errorUpdate'));
		} finally {
			saving = false;
		}
	}
</script>

{#if loading}
	<section class="container" style="padding: 120px 24px;">
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem;">
			<div class="loader"></div>
			<p>{get(t)('admin.editor.saving')}</p>
		</div>
	</section>
{:else if articleData}
	<ArticleForm
		mode="edit"
		formId="edit-page-form"
		submitting={saving}
		{createdAtDate}
		{updatedAtDate}
		initialCategory={articleData.category}
		initialSlug={articleData.slug}
		initialDateMode={articleData.dateMode}
		initialCustomDateStr={articleData.customDateStr}
		initialDifferentCovers={articleData.differentCovers}
		initialTranslations={articleData.translations}
		onsubmit={handleSubmit}
	/>
{/if}
