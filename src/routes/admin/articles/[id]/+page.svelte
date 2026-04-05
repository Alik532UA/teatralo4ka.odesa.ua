<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { getAdminArticleById as getArticleById, updateArticle } from '$lib/services/admin-articles';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { onMount } from 'svelte';
	import { ARTICLE_CATEGORIES, type ArticleCategory } from '$lib/config/categories';
	import { Timestamp } from 'firebase/firestore';
	import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';

	let id = $derived(page.params.id);
	let category = $state<ArticleCategory | string>('news');
	let author = $state('');
	let dateMode = $state<'createdAt' | 'updatedAt' | 'custom' | 'hidden'>('createdAt');
	let customDateStr = $state(new Date().toISOString().split('T')[0]);
	let translations = $state({
		uk: { title: '', content: '', isPublished: true },
		en: { title: '', content: '', isPublished: false }
	});

	let activeLang = $state<'uk' | 'en'>('uk');
	let loading = $state(true);
	let saving = $state(false);

	onMount(async () => {
		if (!id) {
			goto(`${base}/admin/articles`);
			return;
		}
		const article = await getArticleById(id as string);
		if (article) {
			category = article.category;
			author = article.author;
			dateMode = article.dateMode || 'createdAt';
			translations = {
				uk: article.translations?.uk || { title: '', content: '', isPublished: false },
				en: article.translations?.en || { title: '', content: '', isPublished: false }
			};
			if (article.customDate?.toDate) {
				customDateStr = article.customDate.toDate().toISOString().split('T')[0];
			}
		} else {
			alert(get(t)('admin.editor.errorNotFound'));
			goto(`${base}/admin/articles`);
		}
		loading = false;
	});

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(`${base}/admin/login`);
		}
	});

	async function handleSubmit() {
		if (!id) return;
		saving = true;
		try {
			const customDate = dateMode === 'custom' ? Timestamp.fromDate(new Date(customDateStr)) : null;

			await updateArticle(id as string, {
				category,
				author,
				dateMode,
				customDate,
				translations
			});
			goto(`${base}/admin/articles`);
		} catch (e) {
			console.error(e);
			alert(get(t)('admin.editor.errorUpdate'));
		} finally {
			saving = false;
		}
	}
</script>

<section class="admin-article-edit container" style="padding: 160px 24px;">
	{#if loading}
		<p style="text-align: center;">{get(t)('admin.editor.saving')}</p>
	{:else}
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
			<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);">{$t('admin.editor.editTitle')}</h1>
			<a href="{base}/admin/articles" class="btn btn-outline">{$t('admin.editor.backToList')}</a>
		</div>

		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
			<!-- Форма -->
			<form onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 1.5rem; background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
					<div style="display: flex; flex-direction: column; gap: 0.5rem;">
						<label for="category">{$t('admin.editor.category')}</label>
						<select id="category" bind:value={category} style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;">
							{#each Object.entries(ARTICLE_CATEGORIES) as [key, labels]}
								<option value={key}>{labels.uk}</option>
							{/each}
						</select>
					</div>
					<div style="display: flex; flex-direction: column; gap: 0.5rem;">
						<label for="author">{$t('admin.editor.author')}</label>
						<input type="text" id="author" bind:value={author} style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;" />
					</div>
				</div>

				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: end;">
					<div style="display: flex; flex-direction: column; gap: 0.5rem;">
						<label for="dateMode">{$t('admin.editor.dateMode')}</label>
						<select id="dateMode" bind:value={dateMode} style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;">
							<option value="createdAt">{$t('admin.editor.dateCreatedAt')}</option>
							<option value="updatedAt">{$t('admin.editor.dateUpdatedAt')}</option>
							<option value="custom">{$t('admin.editor.dateCustom')}</option>
							<option value="hidden">{$t('admin.editor.dateHidden')}</option>
						</select>
					</div>
					{#if dateMode === 'custom'}
						<div style="display: flex; flex-direction: column; gap: 0.5rem;">
							<input type="date" bind:value={customDateStr} style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;" />
						</div>
					{/if}
				</div>

				<div style="display: flex; gap: 0.5rem; margin-top: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
					<button type="button" class="btn" class:btn-primary={activeLang === 'uk'} class:btn-outline={activeLang !== 'uk'} onclick={() => activeLang = 'uk'}>Українська</button>
					<button type="button" class="btn" class:btn-primary={activeLang === 'en'} class:btn-outline={activeLang !== 'en'} onclick={() => activeLang = 'en'}>English</button>
				</div>

				<div style="display: flex; flex-direction: column; gap: 1.5rem;">
					<div style="display: flex; flex-direction: column; gap: 0.5rem;">
						<label for="title">{$t('admin.editor.titleLabel')} ({activeLang})</label>
						<input type="text" id="title" bind:value={translations[activeLang].title} required style="padding: 0.8rem; border-radius: 12px; border: 1px solid #ddd;" />
					</div>

					<div style="display: flex; flex-direction: column; gap: 0.5rem;">
						<label for="content">{$t('admin.editor.contentLabel')} ({activeLang})</label>
						<RichTextEditor bind:value={translations[activeLang].content} onchange={(v) => translations[activeLang].content = v} />
					</div>

					<div style="display: flex; align-items: center; gap: 1rem;">
						<input type="checkbox" id="isPublished" bind:checked={translations[activeLang].isPublished} />
						<label for="isPublished">{$t('admin.editor.publishLabel')} ({activeLang})</label>
					</div>
				</div>

				<button type="submit" disabled={saving} class="btn btn-primary" style="width: 100%; border: none; margin-top: 1rem;">
					{saving ? $t('admin.editor.updating') : $t('admin.editor.updateBtn')}
				</button>
			</form>

			<!-- Попередній перегляд -->
			<div style="background: var(--theme-dynamic-card-bg); padding: 2rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow-y: auto; max-height: 850px;">
				<h2 style="margin-bottom: 1rem; opacity: 0.5;">{$t('admin.editor.preview')} ({activeLang})</h2>
				<hr style="margin-bottom: 2rem; opacity: 0.1;" />
				<div class="prose">
					<h1>{translations[activeLang].title || $t('admin.editor.titleLabel') + '...'}</h1>
					{@html DOMPurify.sanitize(marked.parse(translations[activeLang].content || $t('admin.editor.previewEmpty')) as string)}
				</div>
			</div>
		</div>
	{/if}
</section>

