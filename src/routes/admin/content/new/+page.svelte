<script lang="ts">
	import ArticleForm from '$lib/components/admin/ArticleForm.svelte';
	import type { ArticleFormData } from '$lib/components/admin/ArticleForm.svelte';
	import { addArticle } from '$lib/services/admin-articles';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { page } from '$app/state';
	import type { ContentType } from '$lib/services/articles';

	let submitting = $state(false);

	// Read initial type from URL query: ?type=article|page|page_project
	const urlType = page.url.searchParams.get('type');
	const initialType: ContentType = (urlType === 'page' || urlType === 'page_project') ? urlType : 'article';

	const initialCategory = initialType === 'article' ? 'news' : '';
	const initialDateMode = initialType === 'article' ? 'createdAt' as const : 'hidden' as const;

	async function handleSubmit(data: ArticleFormData) {
		if (data.contentType !== 'article' && !data.slug.trim()) {
			toast.error(get(t)('admin.pages.slugRequired'));
			return;
		}
		submitting = true;
		try {
			const { contentType, ...rest } = data;
			await addArticle({ ...rest, author: '', type: contentType });
			toast.success(get(t)('admin.editor.saveBtn'));
			goto(`${base}/admin/content`);
		} catch (e: any) {
			toast.error(e.message || get(t)('admin.editor.errorSave'));
		} finally {
			submitting = false;
		}
	}
</script>

<ArticleForm
	mode="create"
	formId="new-content-form"
	{submitting}
	initialCategory={initialCategory}
	initialDateMode={initialDateMode}
	contentType={initialType}
	onsubmit={handleSubmit}
/>
