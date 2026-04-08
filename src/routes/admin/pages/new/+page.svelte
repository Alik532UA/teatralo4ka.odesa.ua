<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { addArticle } from '$lib/services/admin-articles';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import ArticleForm, { type ArticleFormData } from '$lib/components/admin/ArticleForm.svelte';

	let submitting = $state(false);

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(`${base}/admin/login`);
		}
	});

	async function handleSubmit(data: ArticleFormData) {
		if (!data.slug?.trim()) {
			toast.error(get(t)('admin.pages.slugRequired'));
			return;
		}
		submitting = true;
		try {
			await addArticle({ ...data, type: 'page', author: '' });
			toast.success(get(t)('admin.dashboard.saveSuccess') || 'Сторінку створено');
			goto(`${base}/admin/pages`);
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.editor.errorSave'));
		} finally {
			submitting = false;
		}
	}
</script>

<ArticleForm mode="create" formId="new-page-form" {submitting} onsubmit={handleSubmit} />
