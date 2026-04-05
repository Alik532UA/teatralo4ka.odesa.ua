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
	import { Languages, Eye, EyeOff, CheckCircle2, XCircle, Settings, ChevronLeft, LayoutPanelTop, FileEdit } from 'lucide-svelte';

	let id = $derived(page.params.id);
	let category = $state<ArticleCategory | string>('news');
	let dateMode = $state<'createdAt' | 'updatedAt' | 'custom' | 'hidden'>('createdAt');
	let customDateStr = $state(new Date().toISOString().split('T')[0]);
	let translations = $state({
		uk: { title: '', content: '', isPublished: true },
		en: { title: '', content: '', isPublished: false }
	});

	let activeLang = $state<'uk' | 'en'>('uk');
	let loading = $state(true);
	let saving = $state(false);
	
	let createdAtDate = $state<Date | null>(null);
	let updatedAtDate = $state<Date | null>(null);

	onMount(async () => {
		if (!id) {
			goto(`${base}/admin/articles`);
			return;
		}
		const article = await getArticleById(id as string);
		if (article) {
			category = article.category;
			dateMode = article.dateMode || 'createdAt';
			translations = {
				uk: article.translations?.uk || { title: '', content: '', isPublished: false },
				en: article.translations?.en || { title: '', content: '', isPublished: false }
			};
			if (article.customDate?.toDate) {
				customDateStr = article.customDate.toDate().toISOString().split('T')[0];
			}
			
			if ((article as any).createdAt?.toDate) createdAtDate = (article as any).createdAt.toDate();
			if ((article as any).updatedAt?.toDate) updatedAtDate = (article as any).updatedAt.toDate();
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

	function formatDate(date: Date | null): string {
		if (!date) return '---';
		return date.toISOString().split('T')[0];
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!id) return;
		saving = true;
		try {
			const customDate = dateMode === 'custom' ? Timestamp.fromDate(new Date(customDateStr)) : null;

			await updateArticle(id as string, {
				category,
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

<section class="admin-article-edit container" style="padding: 120px 24px;">
	{#if loading}
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem;">
			<div class="loader"></div>
			<p>{get(t)('admin.editor.saving')}</p>
		</div>
	{:else}
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;">
			<div style="display: flex; align-items: center; gap: 1rem;">
				<a href="{base}/admin/articles" class="btn btn-outline" style="padding: 0.5rem 1rem;" title="Назад до списку">
					<ChevronLeft size={20} />
				</a>
				<h1 style="margin: 0; font-size: 2rem;">{$t('admin.editor.editTitle')}</h1>
			</div>
			
			<button type="submit" form="edit-form" disabled={saving} class="btn btn-primary" data-testid="admin-article-edit-submit-btn">
				{saving ? $t('admin.editor.updating') : $t('admin.editor.updateBtn')}
			</button>
		</div>

		<form id="edit-form" onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 2rem;">
			<!-- Container 1: Settings -->
			<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);">
				<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
					<Settings size={22} />
					<h2 style="margin: 0; font-size: 1.5rem;">Налаштування публікації</h2>
				</div>

				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2.5rem;">
					<div class="form-group">
						<label class="form-label" for="category">{$t('admin.editor.category')}</label>
						<select id="category" bind:value={category} class="form-select" data-testid="admin-article-edit-category-select">
							{#each Object.entries(ARTICLE_CATEGORIES) as [key, labels]}
								<option value={key}>{labels.uk}</option>
							{/each}
						</select>
					</div>

					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
						<div class="form-group">
							<label class="form-label" for="dateMode">{$t('admin.editor.dateMode')}</label>
							<select id="dateMode" bind:value={dateMode} class="form-select" data-testid="admin-article-edit-date-mode-select">
								<option value="createdAt">{$t('admin.editor.dateCreatedAt')}</option>
								<option value="updatedAt">{$t('admin.editor.dateUpdatedAt')}</option>
								<option value="custom">{$t('admin.editor.dateCustom')}</option>
								<option value="hidden">{$t('admin.editor.dateHidden')}</option>
							</select>
						</div>

						{#if dateMode !== 'hidden'}
							<div class="form-group">
								<label class="form-label" for="customDate">Дата відображення</label>
								<input 
									type="date" 
									id="customDate"
									value={dateMode === 'custom' ? customDateStr : (dateMode === 'createdAt' ? formatDate(createdAtDate) : formatDate(updatedAtDate))} 
									oninput={(e) => dateMode === 'custom' && (customDateStr = e.currentTarget.value)}
									disabled={dateMode !== 'custom'}
									class="form-input"
									data-testid="admin-article-edit-custom-date-input" 
								/>
							</div>
						{/if}
					</div>
				</div>

				<!-- Languages & Publication -->
				<div style="display: flex; flex-direction: column; gap: 1rem;">
					<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6;">
						<Languages size={18} />
						Мови та статус
					</div>
					
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
						{#each ['uk', 'en'] as lang}
							<div 
								class="lang-card"
								style="padding: 1.25rem; border-radius: 20px; border: 2px solid {activeLang === lang ? 'var(--color-ocean)' : 'rgba(0,0,0,0.05)'}; background: {activeLang === lang ? 'rgba(0, 119, 190, 0.05)' : 'transparent'}; cursor: pointer; transition: all 0.2s;"
								onclick={() => activeLang = lang as 'uk' | 'en'}
								onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (activeLang = lang as 'uk' | 'en')}
								role="button"
								tabindex="0"
							>
								<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
									<span style="font-weight: 700; color: var(--color-deep-ocean);">{lang === 'uk' ? 'Українська' : 'English'}</span>
									{#if translations[lang as 'uk' | 'en'].isPublished}
										<div style="color: #22c55e; display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 700;">
											<CheckCircle2 size={16} /> Опубліковано
										</div>
									{:else}
										<div style="color: #94a3b8; display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 700;">
											<EyeOff size={16} /> Чернетка
										</div>
									{/if}
								</div>

								<div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; cursor: pointer; color: var(--color-dark-text);">
									<input 
										type="checkbox" 
										class="form-checkbox"
										bind:checked={translations[lang as 'uk' | 'en'].isPublished} 
										data-testid="admin-article-edit-published-checkbox-{lang}"
										onclick={(e) => e.stopPropagation()}
									/>
									<span>Публікувати цю версію</span>
								</div>
							</div>

						{/each}
					</div>
				</div>

				<div class="form-group" style="margin-top: 2.5rem;">
					<label class="form-label" for="title">Заголовок статті ({activeLang === 'uk' ? 'укр' : 'англ'})</label>
					<input type="text" id="title" bind:value={translations[activeLang].title} required class="form-input" placeholder="Введіть заголовок..." data-testid="admin-article-edit-title-input" />
				</div>
			</div>

			<!-- Container 2: Editor -->
			<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);" data-testid="admin-article-edit-rich-text-editor-container">
				<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
					<FileEdit size={22} />
					<h2 style="margin: 0; font-size: 1.5rem;">Контент статті ({activeLang === 'uk' ? 'укр' : 'англ'})</h2>
				</div>
				<RichTextEditor bind:value={translations[activeLang].content} onchange={(v) => translations[activeLang].content = v} data-testid="admin-article-edit-rich-text-editor" />
			</div>

			<!-- Container 3: Preview -->
			<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);">
				<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
					<LayoutPanelTop size={22} />
					<h2 style="margin: 0; font-size: 1.5rem;">Попередній перегляд</h2>
					<div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: {translations[activeLang].isPublished ? '#22c55e' : '#94a3b8'}">
						{#if translations[activeLang].isPublished}
							<Eye size={18} /> Опубліковано ({activeLang})
						{:else}
							<EyeOff size={18} /> Чернетка ({activeLang})
						{/if}
					</div>
				</div>

				<div class="preview-container" style="background: var(--theme-dynamic-section-bg); padding: 3rem; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05);">
					<article class="prose" style="max-width: 1000px; margin: 0 auto;">
						<h1 style="font-size: 3rem; margin-top: 0;">{translations[activeLang].title || 'Заголовок статті...'}</h1>
						{@html DOMPurify.sanitize(marked.parse(translations[activeLang].content || 'Тут з’явиться вміст статті...') as string)}
					</article>
				</div>
			</div>

			<div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
				<button type="submit" disabled={saving} class="btn btn-primary btn-large" style="padding: 1rem 4rem; font-size: 1.1rem;" data-testid="admin-article-edit-submit-btn-bottom">
					{saving ? $t('admin.editor.updating') : $t('admin.editor.updateBtn')}
				</button>
			</div>
		</form>
	{/if}
</section>

<style>
	.loader {
		width: 48px;
		height: 48px;
		border: 5px solid var(--color-ocean);
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.lang-card:hover {
		border-color: var(--color-ocean) !important;
		opacity: 0.9;
	}

	.btn-large {
		height: 60px;
		border-radius: 30px;
	}

	:global(.prose img) {
		max-width: 100%;
		border-radius: 24px;
		margin: 2rem 0;
		box-shadow: 0 10px 40px rgba(0,0,0,0.1);
	}
</style>
