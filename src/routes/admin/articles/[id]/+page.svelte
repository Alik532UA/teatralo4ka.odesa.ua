<script lang="ts">
	import { authService } from '$lib/states/auth.svelte';
	import { toast } from '$lib/states/toast.svelte';
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
	import { Languages, Eye, EyeOff, CheckCircle2, XCircle, Settings, ChevronLeft, LayoutPanelTop, FileEdit, FilePlus, FileDown, Paperclip, Info, AlertTriangle } from 'lucide-svelte';

	let id = $derived(page.params.id);
	let category = $state<ArticleCategory | string>('news');
	let dateMode = $state<'createdAt' | 'updatedAt' | 'custom' | 'hidden'>('createdAt');
	let customDateStr = $state(new Date().toISOString().split('T')[0]);
	let differentCovers = $state(false);
	let showUploadInfo = $state(false);
	let translations = $state({
		uk: { title: '', content: '', isPublished: true, coverUrl: '' },
		en: { title: '', content: '', isPublished: false, coverUrl: '' }
	});

	function isImageUrlValid(url: string) {
		if (!url) return true;
		return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
	}

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
				uk: { coverUrl: '', ...article.translations?.uk },
				en: { coverUrl: '', ...article.translations?.en }
			};

			if (translations.uk.coverUrl !== translations.en.coverUrl) {
				differentCovers = true;
			}

			if (article.customDate?.toDate) {
				customDateStr = article.customDate.toDate().toISOString().split('T')[0];
			}
			
			if ((article as any).createdAt?.toDate) createdAtDate = (article as any).createdAt.toDate();
			if ((article as any).updatedAt?.toDate) updatedAtDate = (article as any).updatedAt.toDate();
		} else {
			toast.error(get(t)('admin.editor.errorNotFound'));
			goto(`${base}/admin/articles`);
		}
		loading = false;
	});

	$effect(() => {
		if (!differentCovers && translations.uk.coverUrl !== translations.en.coverUrl) {
			translations.en.coverUrl = translations.uk.coverUrl;
		}
	});

	function handleCoverInput(val: string, lang: 'uk' | 'en') {
		translations[lang].coverUrl = val;
		if (!differentCovers) {
			translations.uk.coverUrl = val;
			translations.en.coverUrl = val;
		}
	}

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
			toast.success(get(t)('admin.dashboard.saveSuccess') || 'Статтю оновлено');
			goto(`${base}/admin/articles`);
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || get(t)('admin.editor.errorUpdate'));
		} finally {
			saving = false;
		}
	}

	function saveDraftToFile() {
		const draftData = {
			category,
			dateMode,
			customDateStr,
			differentCovers,
			translations,
			version: '1.0',
			exportedAt: new Date().toISOString()
		};
		const blob = new Blob([JSON.stringify(draftData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		const safeTitle = translations.uk.title.slice(0, 30).replace(/[^a-z0-9а-яіїє]/gi, '_') || 'draft';
		a.href = url;
		a.download = `article_edit_draft_${safeTitle}_${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success(get(t)('admin.editor.saveDraftFile'));
	}

	function loadDraftFromFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const data = JSON.parse(event.target?.result as string);
				category = data.category || category;
				dateMode = data.dateMode || dateMode;
				customDateStr = data.customDateStr || customDateStr;
				differentCovers = data.differentCovers || false;
				if (data.translations) {
					translations = {
						uk: { ...translations.uk, ...data.translations.uk },
						en: { ...translations.en, ...data.translations.en }
					};
				}
				toast.success(get(t)('admin.editor.loadDraftFile'));
			} catch (err) {
				toast.error('Помилка при читанні файлу');
			}
		};
		reader.readAsText(file);
		(e.target as HTMLInputElement).value = ''; // Reset input
	}
</script>

{#if showUploadInfo}
	<div class="modal-overlay" style="z-index: 11000;" onclick={() => showUploadInfo = false} role="presentation">
		<div class="modal-content" style="max-width: 600px;" onclick={(e) => e.stopPropagation()} role="presentation">
			<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
				<h3 style="margin: 0;">{$t('admin.editor.uploadInstructionTitle')}</h3>
				<button class="btn btn-sm btn-outline" onclick={() => showUploadInfo = false}><XCircle size={20} /></button>
			</div>
			
			<div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.95rem; line-height: 1.6;">
				<p>{$t('admin.editor.uploadInstructionText')}</p>
				<a href="https://freeimage.host/" target="_blank" style="color: var(--color-ocean); font-weight: 700; text-decoration: underline;">https://freeimage.host/</a>
				
				<div style="background: rgba(0,0,0,0.03); padding: 1.25rem; border-radius: 16px; border-left: 4px solid var(--color-golden);">
					<p style="margin-bottom: 0.5rem;">{$t('admin.editor.uploadStep1')}</p>
					<p style="margin-bottom: 0.5rem;">{$t('admin.editor.uploadStep2')}</p>
					<p style="margin-bottom: 0.5rem; font-weight: 700; color: #e11d48;">{$t('admin.editor.uploadStep3')}</p>
					<p style="margin: 0;">{$t('admin.editor.uploadStep4')}</p>
				</div>
			</div>

			<div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
				<button class="btn btn-primary" onclick={() => showUploadInfo = false}>Зрозумів</button>
			</div>
		</div>
	</div>
{/if}

<section class="admin-article-edit container" style="padding: 120px 24px;">
	{#if loading}
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem;">
			<div class="loader"></div>
			<p>{get(t)('admin.editor.saving')}</p>
		</div>
	{:else}
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;">
			<div style="display: flex; align-items: center; gap: 1rem;">
				<a href="{base}/admin/articles" class="btn btn-outline" style="padding: 0.5rem 1rem;" title={$t('admin.editor.backToList')}>
					<ChevronLeft size={20} />
				</a>
				<h1 style="margin: 0; font-size: 2rem;">{$t('admin.editor.editTitle')}</h1>
			</div>
			
			<div style="display: flex; gap: 1rem;">
				<div class="draft-actions" style="display: flex; gap: 0.5rem;">
					<button type="button" class="btn btn-outline" onclick={saveDraftToFile} title={$t('admin.editor.saveDraftFile')}>
						<FileDown size={18} />
					</button>
					<label class="btn btn-outline" style="cursor: pointer;" title={$t('admin.editor.loadDraftFile')}>
						<Paperclip size={18} />
						<input type="file" accept=".json" onchange={loadDraftFromFile} style="display: none;" />
					</label>
				</div>
				<button type="submit" form="edit-form" disabled={saving} class="btn btn-primary" data-testid="admin-article-edit-submit-button">
					{saving ? $t('admin.editor.updating') : $t('admin.editor.updateBtn')}
				</button>
			</div>
		</div>

		<form id="edit-form" onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 2rem;">
			<!-- Container 1: Settings -->
			<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);" data-testid="admin-article-edit-settings-card">
				<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
					<Settings size={22} />
					<h2 style="margin: 0; font-size: 1.5rem;">{$t('admin.editor.settingsSection')}</h2>
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
								<label class="form-label" for="customDate">{$t('admin.editor.displayDate')}</label>
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

				<!-- Cover Image Section -->
				<div style="margin-bottom: 2.5rem; padding: 1.5rem; border-radius: 24px; background: rgba(0,0,0,0.02); border: 1px dashed rgba(0,0,0,0.1);" data-testid="admin-article-edit-cover-section">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
						<div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--color-deep-ocean);">
							<LayoutPanelTop size={18} />
							{$t('admin.editor.coverSection')}
						</div>
						<div style="display: flex; gap: 0.5rem;">
							<button 
								type="button" 
								class="btn btn-sm btn-outline" 
								onclick={() => showUploadInfo = true}
								style="font-size: 0.75rem; padding: 0.4rem 0.8rem;"
								data-testid="admin-article-edit-upload-info-button"
							>
								<Info size={14} style="margin-right: 0.25rem;" />
								{$t('admin.editor.uploadFromDevice')}
							</button>
							<button 
								type="button" 
								class="btn btn-sm {differentCovers ? 'btn-primary' : 'btn-outline'}" 
								onclick={() => differentCovers = !differentCovers}
								style="font-size: 0.75rem; padding: 0.4rem 0.8rem;"
								data-testid="admin-article-edit-toggle-diff-covers-button"
							>
								{differentCovers ? $t('admin.editor.coverShared') : $t('admin.editor.coverDifferent')}
							</button>
						</div>
					</div>

					<div style="display: grid; grid-template-columns: {differentCovers ? '1fr 1fr' : '1fr'}; gap: 2rem;">
						{#if !differentCovers}
							<div class="form-group">
								<div style="display: flex; gap: 1.5rem; align-items: flex-start;">
									<div style="flex: 1; position: relative;">
										<input 
											type="url" 
											placeholder="https://example.com/image.jpg" 
											class="form-input"
											class:input-error={!isImageUrlValid(translations.uk.coverUrl)}
											value={translations.uk.coverUrl}
											oninput={(e) => handleCoverInput(e.currentTarget.value, 'uk')}
											data-testid="admin-article-edit-cover-url-input-shared"
										/>
										{#if !isImageUrlValid(translations.uk.coverUrl)}
											<button 
												type="button"
												onclick={() => showUploadInfo = true}
												style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #e11d48; cursor: pointer;"
												title={$t('admin.editor.urlWarning')}
											>
												<AlertTriangle size={18} />
											</button>
										{/if}
										<p style="font-size: 0.75rem; opacity: 0.6; margin-top: 0.5rem;">{$t('admin.editor.coverSharedHint')}</p>
									</div>
									{#if translations.uk.coverUrl}
										<div class="cover-preview" style="width: 120px; height: 80px; border-radius: 12px; overflow: hidden; background: #eee; flex-shrink: 0; box-shadow: var(--shadow-sm);">
											<img 
												src={translations.uk.coverUrl} 
												alt="Preview" 
												style="width: 100%; height: 100%; object-fit: cover;" 
												onerror={(e) => (e.currentTarget as HTMLElement).style.display = 'none'} 
											/>
										</div>
									{/if}
								</div>
							</div>
						{:else}
							{#each ['uk', 'en'] as lang}
								<div class="form-group">
									<label class="form-label" for={`cover-${lang}`} style="font-size: 0.8rem; opacity: 0.7;">{lang === 'uk' ? $t('admin.editor.ukVersion') : $t('admin.editor.enVersion')}</label>
									<div style="display: flex; gap: 1rem; align-items: flex-start;">
										<div style="flex: 1; position: relative;">
											<input 
												type="url" 
												id={`cover-${lang}`}
												placeholder="URL для {lang}..." 
												class="form-input"
												class:input-error={!isImageUrlValid(translations[lang as 'uk'|'en'].coverUrl)}
												bind:value={translations[lang as 'uk'|'en'].coverUrl}
												data-testid={`admin-article-edit-cover-url-input-${lang}`}
											/>
											{#if !isImageUrlValid(translations[lang as 'uk'|'en'].coverUrl)}
												<button 
													type="button"
													onclick={() => showUploadInfo = true}
													style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #e11d48; cursor: pointer;"
													title={$t('admin.editor.urlWarning')}
												>
													<AlertTriangle size={18} />
												</button>
											{/if}
										</div>
										{#if translations[lang as 'uk'|'en'].coverUrl}
											<div class="cover-preview" style="width: 80px; height: 60px; border-radius: 8px; overflow: hidden; background: #eee; flex-shrink: 0;">
												<img 
													src={translations[lang as 'uk'|'en'].coverUrl} 
													alt="Preview" 
													style="width: 100%; height: 100%; object-fit: cover;" 
													onerror={(e) => (e.currentTarget as HTMLElement).style.display = 'none'}
												/>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Languages & Publication -->
				<div style="display: flex; flex-direction: column; gap: 1rem;" data-testid="admin-article-edit-languages-section">
					<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6;">
						<Languages size={18} />
						{$t('admin.editor.langStatus')}
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
								data-testid={`admin-article-edit-lang-card-${lang}`}
							>
								<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
									<span style="font-weight: 700; color: var(--color-deep-ocean);">{lang === 'uk' ? 'Українська' : 'English'}</span>
									{#if translations[lang as 'uk' | 'en'].isPublished}
										<div style="color: #22c55e; display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 700;">
											<CheckCircle2 size={16} /> {$t('admin.editor.published')}
										</div>
									{:else}
										<div style="color: #94a3b8; display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 700;">
											<EyeOff size={16} /> {$t('admin.editor.draft')}
										</div>
									{/if}
								</div>

								<div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 0.9rem; color: var(--color-dark-text);">
									<span style="opacity: 0.7;">{$t('admin.editor.publishLabel')}</span>
									<label class="switch-label">
										<input 
											type="checkbox" 
											class="switch-input"
											bind:checked={translations[lang as 'uk' | 'en'].isPublished} 
											data-testid="admin-article-edit-published-checkbox-{lang}"
											onclick={(e) => e.stopPropagation()}
										/>
										<span class="switch-slider"></span>
									</label>
								</div>							</div>

						{/each}
					</div>
				</div>

				<div class="form-group" style="margin-top: 2.5rem;">
					<label class="form-label" for="title">{$t('admin.editor.titleLabel')} ({activeLang === 'uk' ? 'укр' : 'англ'})</label>
					<input type="text" id="title" bind:value={translations[activeLang].title} required class="form-input" placeholder={$t('admin.editor.titlePlaceholder')} data-testid="admin-article-edit-title-input" />
				</div>
			</div>

			<!-- Container 2: Editor -->
			<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);" data-testid="admin-article-edit-rich-text-editor-container">
				<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
					<FileEdit size={22} />
					<h2 style="margin: 0; font-size: 1.5rem;">{$t('admin.editor.contentLabel')} ({activeLang === 'uk' ? 'укр' : 'англ'})</h2>
				</div>
				<RichTextEditor 
					bind:value={translations[activeLang].content} 
					onchange={(v) => translations[activeLang].content = v} 
					placeholder={$t('admin.editor.contentPlaceholder')}
					data-testid="admin-article-edit-rich-text-editor" 
				/>
			</div>

			<!-- Container 3: Preview -->
			<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);" data-testid="admin-article-edit-preview-card">
				<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
					<LayoutPanelTop size={22} />
					<h2 style="margin: 0; font-size: 1.5rem;">{$t('admin.editor.preview')}</h2>
					<div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: {translations[activeLang].isPublished ? '#22c55e' : '#94a3b8'}">
						{#if translations[activeLang].isPublished}
							<Eye size={18} /> {$t('admin.editor.published')} ({activeLang})
						{:else}
							<EyeOff size={18} /> {$t('admin.editor.draft')} ({activeLang})
						{/if}
					</div>
				</div>

				<div class="preview-container" style="background: var(--theme-dynamic-section-bg); padding: 3rem; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05);">
					<article class="prose" style="max-width: 1000px; margin: 0 auto;">
						<h1 style="font-size: 3rem; margin-top: 0;">{translations[activeLang].title || $t('admin.editor.titlePlaceholder')}</h1>
						{@html DOMPurify.sanitize(marked.parse(translations[activeLang].content || $t('admin.editor.previewEmpty')) as string)}
					</article>
				</div>
			</div>

			<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; gap: 2rem;">
				<div style="display: flex; gap: 1rem;">
					<button type="button" class="btn btn-outline" onclick={saveDraftToFile} data-testid="admin-article-edit-save-draft-file-button-bottom">
						<FileDown size={18} style="margin-right: 0.5rem;" />
						{$t('admin.editor.saveDraftFile')}
					</button>
					<label class="btn btn-outline" style="cursor: pointer;" data-testid="admin-article-edit-load-draft-file-button-bottom">
						<Paperclip size={18} style="margin-right: 0.5rem;" />
						{$t('admin.editor.loadDraftFile')}
						<input type="file" accept=".json" onchange={loadDraftFromFile} style="display: none;" />
					</label>
				</div>
				<button type="submit" disabled={saving} class="btn btn-primary btn-large" style="padding: 1rem 4rem; font-size: 1.1rem;" data-testid="admin-article-edit-submit-button-bottom">
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

	.form-input.input-error {
		border-color: #e11d48;
		background: rgba(225, 29, 72, 0.02);
	}

	:global(.prose img) {
		max-width: 100%;
		border-radius: 24px;
		margin: 2rem 0;
		box-shadow: 0 10px 40px rgba(0,0,0,0.1);
	}
</style>
