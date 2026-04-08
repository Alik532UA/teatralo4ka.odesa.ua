<script lang="ts">
	import type { ArticleCategory } from '$lib/config/categories';
	import type { DateMode } from '$lib/services/articles';
	import { Timestamp } from 'firebase/firestore';
	import { generateSlug } from '$lib/services/admin-articles';
	import { ARTICLE_CATEGORIES } from '$lib/config/categories';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import {
		Languages, Eye, EyeOff, CheckCircle2, XCircle,
		Settings, LayoutPanelTop, FilePlus, FileEdit,
		FileDown, Paperclip, Info, AlertTriangle, ChevronLeft
	} from 'lucide-svelte';

	export interface ArticleFormData {
		category: string;
		slug: string;
		dateMode: DateMode;
		customDate: Timestamp | null;
		translations: {
			uk: { title: string; content: string; isPublished: boolean; coverUrl: string };
			en: { title: string; content: string; isPublished: boolean; coverUrl: string };
		};
	}

	interface Props {
		mode: 'create' | 'edit';
		formId: string;
		submitting: boolean;
		createdAtDate?: Date | null;
		updatedAtDate?: Date | null;
		initialCategory?: string;
		initialSlug?: string;
		initialDateMode?: DateMode;
		initialCustomDateStr?: string;
		initialDifferentCovers?: boolean;
		initialTranslations?: {
			uk?: Partial<{ title: string; content: string; isPublished: boolean; coverUrl: string }>;
			en?: Partial<{ title: string; content: string; isPublished: boolean; coverUrl: string }>;
		};
		onsubmit: (data: ArticleFormData) => void;
	}

	let {
		mode,
		formId,
		submitting,
		createdAtDate = null,
		updatedAtDate = null,
		initialCategory = 'news',
		initialSlug = '',
		initialDateMode = 'createdAt' as DateMode,
		initialCustomDateStr = new Date().toISOString().split('T')[0],
		initialDifferentCovers = false,
		initialTranslations,
		onsubmit,
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	const tp = mode === 'create' ? 'admin-article-new' : 'admin-article-edit';

	// Intentional: props used only for one-time form field initialization
	// svelte-ignore state_referenced_locally
	let category = $state<ArticleCategory | string>(initialCategory);
	// svelte-ignore state_referenced_locally
	let dateMode = $state<DateMode>(initialDateMode);
	// svelte-ignore state_referenced_locally
	let customDateStr = $state(initialCustomDateStr);
	// svelte-ignore state_referenced_locally
	let differentCovers = $state(initialDifferentCovers);
	let showUploadInfo = $state(false);
	// svelte-ignore state_referenced_locally
	let slug = $state(initialSlug);
	let activeLang = $state<'uk' | 'en'>('uk');

	// svelte-ignore state_referenced_locally
	let translations = $state({
		uk: { title: '', content: '', isPublished: mode === 'create', coverUrl: '', ...initialTranslations?.uk },
		en: { title: '', content: '', isPublished: false, coverUrl: '', ...initialTranslations?.en },
	});

	// Auto-fill slug from EN title — only for create mode, only while slug is still empty
	$effect(() => {
		if (mode !== 'create') return;
		const enTitle = translations.en.title;
		if (!slug && enTitle) slug = generateSlug(enTitle);
	});

	let slugForbiddenWarning = $state('');
	let _slugWarnTimer: ReturnType<typeof setTimeout> | null = null;

	function handleSlugInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const cursorPos = input.selectionStart ?? input.value.length;
		const raw = input.value;
		let result = '';
		let removedBeforeCursor = 0;
		let hasForbidden = false;

		for (let i = 0; i < raw.length; i++) {
			const char = raw[i];
			if (char === ' ') {
				result += '_';
			} else if (/[A-Z]/.test(char)) {
				result += char.toLowerCase();
			} else if (/[a-z0-9_]/.test(char)) {
				result += char;
			} else {
				if (i < cursorPos) removedBeforeCursor++;
				hasForbidden = true;
			}
		}

		slug = result;
		input.value = result;
		const newCursor = cursorPos - removedBeforeCursor;
		input.setSelectionRange(newCursor, newCursor);

		if (hasForbidden) {
			if (_slugWarnTimer) clearTimeout(_slugWarnTimer);
			slugForbiddenWarning = 'Деякі символи не дозволені в URL — їх було відкинуто';
			_slugWarnTimer = setTimeout(() => { slugForbiddenWarning = ''; }, 3000);
		}
	}

	$effect(() => {
		if (!differentCovers && translations.uk.coverUrl !== translations.en.coverUrl) {
			translations.en.coverUrl = translations.uk.coverUrl;
		}
	});

	function isImageUrlValid(url: string) {
		if (!url) return true;
		return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
	}

	function handleCoverInput(val: string, lang: 'uk' | 'en') {
		translations[lang].coverUrl = val;
		if (!differentCovers) {
			translations.uk.coverUrl = val;
			translations.en.coverUrl = val;
		}
	}

	function formatDate(date: Date | null): string {
		if (!date) return '---';
		return date.toISOString().split('T')[0];
	}

	function getDisplayDateValue(): string {
		if (dateMode === 'custom') return customDateStr;
		if (mode === 'edit') {
			return dateMode === 'createdAt' ? formatDate(createdAtDate) : formatDate(updatedAtDate);
		}
		return new Date().toISOString().split('T')[0];
	}

	function handleFormSubmit(e: Event) {
		e.preventDefault();
		const customDate = dateMode === 'custom' ? Timestamp.fromDate(new Date(customDateStr)) : null;
		onsubmit({ category, slug, dateMode, customDate, translations });
	}

	function saveDraftToFile() {
		const draftData = {
			category, dateMode, customDateStr, differentCovers, translations,
			version: '1.0', exportedAt: new Date().toISOString()
		};
		const blob = new Blob([JSON.stringify(draftData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		const safeTitle = translations.uk.title.slice(0, 30).replace(/[^a-z0-9а-яіїє]/gi, '_') || 'draft';
		const prefix = mode === 'create' ? 'article_draft' : 'article_edit_draft';
		a.href = url;
		a.download = `${prefix}_${safeTitle}_${new Date().toISOString().split('T')[0]}.json`;
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
			} catch {
				toast.error('Помилка при читанні файлу');
			}
		};
		reader.readAsText(file);
		(e.target as HTMLInputElement).value = '';
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
				<a href="https://freeimage.host/" target="_blank" rel="noopener noreferrer" style="color: var(--color-ocean); font-weight: 700; text-decoration: underline;">https://freeimage.host/</a>
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

<section class="admin-article-form container" style="padding: 120px 24px;">
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;">
		<div style="display: flex; align-items: center; gap: 1rem;">
			<a href="{base}/admin/articles" class="btn btn-outline" style="padding: 0.5rem 1rem;" title={$t('admin.editor.backToList')}>
				<ChevronLeft size={20} />
			</a>
			<h1 style="margin: 0; font-size: 2rem;">
				{mode === 'create' ? $t('admin.editor.newTitle') : $t('admin.editor.editTitle')}
			</h1>
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
			<button type="submit" form={formId} disabled={submitting} class="btn btn-primary" data-testid="{tp}-submit-button">
				{submitting
					? (mode === 'create' ? $t('admin.editor.saving') : $t('admin.editor.updating'))
					: (mode === 'create' ? $t('admin.editor.saveBtn') : $t('admin.editor.updateBtn'))
				}
			</button>
		</div>
	</div>

	<form id={formId} onsubmit={handleFormSubmit} style="display: flex; flex-direction: column; gap: 2rem;">
		<!-- Settings Card -->
		<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);" data-testid="{tp}-settings-card">
			<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
				<Settings size={22} />
				<h2 style="margin: 0; font-size: 1.5rem;">{$t('admin.editor.settingsSection')}</h2>
			</div>

			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2.5rem;">
				<div class="form-group">
					<label class="form-label" for="category">{$t('admin.editor.category')}</label>
					<select id="category" bind:value={category} class="form-select" data-testid="{tp}-category-select">
						{#each Object.entries(ARTICLE_CATEGORIES) as [key, labels]}
							<option value={key}>{labels.uk}</option>
						{/each}
					</select>
				</div>

				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
					<div class="form-group">
						<label class="form-label" for="dateMode">{$t('admin.editor.dateMode')}</label>
						<select id="dateMode" bind:value={dateMode} class="form-select" data-testid="{tp}-date-mode-select">
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
								value={getDisplayDateValue()}
								oninput={(e) => dateMode === 'custom' && (customDateStr = e.currentTarget.value)}
								disabled={dateMode !== 'custom'}
								class="form-input"
								data-testid="{tp}-custom-date-input"
							/>
						</div>
					{/if}
				</div>
			</div>

			<!-- Slug Section -->
			<div style="margin-bottom: 2.5rem; padding: 1.5rem; border-radius: 24px; background: rgba(0,0,0,0.02); border: 1px dashed rgba(0,0,0,0.1);" data-testid="{tp}-slug-section">
				<div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--color-deep-ocean); margin-bottom: 1rem;">
					{$t('admin.editor.slugSection')}
				</div>
				<div class="form-group">
					<label class="form-label" for="article-slug">{$t('admin.editor.slugLabel')}</label>
					<input
						type="text"
						id="article-slug"
						value={slug}
						placeholder="winter_gala_concert"
						class="form-input"
						oninput={handleSlugInput}
						data-testid="{tp}-slug-input"
					/>
					{#if slugForbiddenWarning}
						<p style="font-size: 0.75rem; color: #e11d48; margin-top: 0.35rem;">{slugForbiddenWarning}</p>
					{:else}
						<p style="font-size: 0.75rem; opacity: 0.55; margin-top: 0.35rem;">{$t('admin.editor.slugHint')}</p>
					{/if}
				</div>
			</div>

			<!-- Cover Image Section -->
			<div style="margin-bottom: 2.5rem; padding: 1.5rem; border-radius: 24px; background: rgba(0,0,0,0.02); border: 1px dashed rgba(0,0,0,0.1);" data-testid="{tp}-cover-section">
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
							data-testid="{tp}-upload-info-button"
						>
							<Info size={14} style="margin-right: 0.25rem;" />
							{$t('admin.editor.uploadFromDevice')}
						</button>
						<button
							type="button"
							class="btn btn-sm {differentCovers ? 'btn-primary' : 'btn-outline'}"
							onclick={() => differentCovers = !differentCovers}
							style="font-size: 0.75rem; padding: 0.4rem 0.8rem;"
							data-testid="{tp}-toggle-diff-covers-button"
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
										data-testid="{tp}-cover-url-input-shared"
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
										<img src={translations.uk.coverUrl} alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror={(e) => (e.currentTarget as HTMLElement).style.display = 'none'} />
									</div>
								{/if}
							</div>
						</div>
					{:else}
						{#each (['uk', 'en'] as const) as lang}
							<div class="form-group">
								<label class="form-label" for="cover-{lang}" style="font-size: 0.8rem; opacity: 0.7;">{lang === 'uk' ? $t('admin.editor.ukVersion') : $t('admin.editor.enVersion')}</label>
								<div style="display: flex; gap: 1rem; align-items: flex-start;">
									<div style="flex: 1; position: relative;">
										<input
											type="url"
											id="cover-{lang}"
											placeholder="URL для {lang}..."
											class="form-input"
											class:input-error={!isImageUrlValid(translations[lang].coverUrl)}
											bind:value={translations[lang].coverUrl}
											data-testid="{tp}-cover-url-input-{lang}"
										/>
										{#if !isImageUrlValid(translations[lang].coverUrl)}
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
									{#if translations[lang].coverUrl}
										<div class="cover-preview" style="width: 80px; height: 60px; border-radius: 8px; overflow: hidden; background: #eee; flex-shrink: 0;">
											<img src={translations[lang].coverUrl} alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror={(e) => (e.currentTarget as HTMLElement).style.display = 'none'} />
										</div>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Languages & Publication -->
			<div style="display: flex; flex-direction: column; gap: 1rem;" data-testid="{tp}-languages-section">
				<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6;">
					<Languages size={18} />
					{$t('admin.editor.langStatus')}
				</div>
				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
					{#each (['uk', 'en'] as const) as lang}
						<div
							class="lang-card"
							style="padding: 1.25rem; border-radius: 20px; border: 2px solid {activeLang === lang ? 'var(--color-ocean)' : 'rgba(0,0,0,0.05)'}; background: {activeLang === lang ? 'rgba(0, 119, 190, 0.05)' : 'transparent'}; cursor: pointer; transition: all 0.2s;"
							onclick={() => activeLang = lang}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (activeLang = lang)}
							role="button"
							tabindex="0"
							data-testid="{tp}-lang-card-{lang}"
						>
							<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
								<span style="font-weight: 700; color: var(--color-deep-ocean);">{lang === 'uk' ? 'Українська' : 'English'}</span>
								{#if translations[lang].isPublished}
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
										bind:checked={translations[lang].isPublished}
										data-testid="{tp}-published-checkbox-{lang}"
										onclick={(e) => e.stopPropagation()}
									/>
									<span class="switch-slider"></span>
								</label>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="form-group" style="margin-top: 2.5rem;">
				<label class="form-label" for="article-title">{$t('admin.editor.titleLabel')} ({activeLang === 'uk' ? 'укр' : 'англ'})</label>
				<input type="text" id="article-title" bind:value={translations[activeLang].title} required class="form-input" placeholder={$t('admin.editor.titlePlaceholder')} data-testid="{tp}-title-input" />
			</div>
		</div>

		<!-- Editor Card -->
		<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);" data-testid="{tp}-rich-text-editor-container">
			<div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-deep-ocean); margin-bottom: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem;">
				{#if mode === 'create'}
					<FilePlus size={22} />
				{:else}
					<FileEdit size={22} />
				{/if}
				<h2 style="margin: 0; font-size: 1.5rem;">{$t('admin.editor.contentLabel')} ({activeLang === 'uk' ? 'укр' : 'англ'})</h2>
			</div>
			<RichTextEditor
				bind:value={translations[activeLang].content}
				onchange={(v) => translations[activeLang].content = v}
				placeholder={$t('admin.editor.contentPlaceholder')}
				data-testid="{tp}-rich-text-editor"
			/>
		</div>

		<!-- Preview Card -->
		<div class="admin-card" style="padding: 2.5rem; border-radius: 32px; background: var(--theme-dynamic-card-bg); box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);" data-testid="{tp}-preview-card">
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

		<!-- Bottom action row -->
		<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; gap: 2rem;">
			<div style="display: flex; gap: 1rem;">
				<button type="button" class="btn btn-outline" onclick={saveDraftToFile} data-testid="{tp}-save-draft-file-button-bottom">
					<FileDown size={18} style="margin-right: 0.5rem;" />
					{$t('admin.editor.saveDraftFile')}
				</button>
				<label class="btn btn-outline" style="cursor: pointer;" data-testid="{tp}-load-draft-file-button-bottom">
					<Paperclip size={18} style="margin-right: 0.5rem;" />
					{$t('admin.editor.loadDraftFile')}
					<input type="file" accept=".json" onchange={loadDraftFromFile} style="display: none;" />
				</label>
			</div>
			<button type="submit" disabled={submitting} class="btn btn-primary btn-large" style="padding: 1rem 4rem; font-size: 1.1rem;" data-testid="{tp}-submit-button-bottom">
				{submitting
					? (mode === 'create' ? $t('admin.editor.saving') : $t('admin.editor.updating'))
					: (mode === 'create' ? $t('admin.editor.saveBtn') : $t('admin.editor.updateBtn'))
				}
			</button>
		</div>
	</form>
</section>

<style>
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

	/* ── Upload info modal ──────────────────────────────────────────────── */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--theme-dynamic-card-bg, #fff);
		border-radius: 24px;
		padding: 2rem;
		width: min(600px, 90vw);
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
	}

	.modal-content h3 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
		margin: 0;
	}
</style>
