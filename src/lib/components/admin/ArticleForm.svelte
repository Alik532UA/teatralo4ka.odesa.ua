<script lang="ts">
	import type { ArticleCategory } from '$lib/config/categories';
	import type { ContentFormat, ContentType, DateMode } from '$lib/services/articles';
	import { Timestamp } from 'firebase/firestore';
	import { generateSlug } from '$lib/services/admin-articles';
	import { ARTICLE_CATEGORIES } from '$lib/config/categories';
	import { renderContent } from '$lib/utils/renderContent';
	import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
	import { toast } from '$lib/states/toast.svelte';
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import {
		Languages, Eye, EyeOff, CheckCircle2, XCircle,
		Settings, LayoutPanelTop, FilePlus, FileEdit,
		FileDown, Paperclip, Info, AlertTriangle, ChevronLeft,
		FileText, Globe, Folder
	} from 'lucide-svelte';

	export interface ArticleFormData {
		contentType: ContentType;
		category: string;
		slug: string;
		dateMode: DateMode;
		customDate: Timestamp | null;
		translations: {
			uk: { title: string; content: string; isPublished: boolean; coverUrl: string; contentFormat: ContentFormat };
			en: { title: string; content: string; isPublished: boolean; coverUrl: string; contentFormat: ContentFormat };
		};
	}

	interface Props {
		mode: 'create' | 'edit';
		formId: string;
		submitting: boolean;
		contentType?: ContentType;
		createdAtDate?: Date | null;
		updatedAtDate?: Date | null;
		initialCategory?: string;
		initialSlug?: string;
		initialDateMode?: DateMode;
		initialCustomDateStr?: string;
		initialDifferentCovers?: boolean;
		initialTranslations?: {
			uk?: Partial<{ title: string; content: string; isPublished: boolean; coverUrl: string; contentFormat: ContentFormat }>;
			en?: Partial<{ title: string; content: string; isPublished: boolean; coverUrl: string; contentFormat: ContentFormat }>;
		};
		onsubmit: (data: ArticleFormData) => void;
	}

	let {
		mode,
		formId,
		submitting,
		contentType = 'article',
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

	// svelte-ignore state_referenced_locally
	let selectedType = $state<ContentType>(contentType);

	function handleTypeChange(newType: ContentType) {
		if (newType === selectedType) return;
		selectedType = newType;
		// Auto-adjust defaults when switching type
		if (newType === 'article') {
			if (!category) { categorySelection = 'news'; }
			if (dateMode === 'hidden') { dateMode = 'createdAt'; }
		} else {
			if (category === 'news' || categorySelection === 'news') { categorySelection = '__none__'; }
			dateMode = 'hidden';
		}
	}

	// Intentional: props used only for one-time form field initialization
	// svelte-ignore state_referenced_locally
	let category = $state<string>(initialCategory);
	let categorySelection = $state<string>('');
	let customCategoryUk = $state('');
	let customCategoryEn = $state('');
	let catDropdownOpen = $state(false);

	// Initialize selection based on initialCategory
	$effect.pre(() => {
		if (!initialCategory) {
			categorySelection = '__none__';
		} else if (initialCategory in ARTICLE_CATEGORIES) {
			categorySelection = initialCategory;
		} else {
			categorySelection = '__custom__';
			if (initialCategory.includes('||')) {
				const [uk, en] = initialCategory.split('||');
				customCategoryUk = uk || '';
				customCategoryEn = en || '';
			} else {
				customCategoryUk = initialCategory;
				customCategoryEn = '';
			}
		}
	});

	// Sync final category value whenever selection or custom text changes
	$effect(() => {
		if (categorySelection === '__none__') {
			category = '';
		} else if (categorySelection === '__custom__') {
			const uk = customCategoryUk.trim();
			const en = customCategoryEn.trim();
			category = en ? `${uk}||${en}` : uk;
		} else {
			category = categorySelection;
		}
	});

	function selectCategory(key: string) {
		categorySelection = key;
		catDropdownOpen = false;
	}

	function getSelectedCategoryLabel(): string {
		if (categorySelection === '__none__' || categorySelection === '__custom__' || !categorySelection) return '';
		const labels = ARTICLE_CATEGORIES[categorySelection as keyof typeof ARTICLE_CATEGORIES];
		return labels ? labels.uk : categorySelection;
	}

	// Firestore rule limits — must stay in sync with firestore.rules
	const CUSTOM_DATE_MIN = '1990-01-01';
	const CUSTOM_DATE_MAX = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })();
	const MAX_TITLE_LEN = 150;
	const MAX_CONTENT_LEN = 50000;
	const MAX_CATEGORY_LEN = 50;
	const MAX_COVER_URL_LEN = 2048;
	const MAX_SLUG_LEN = 100;

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
		uk: { title: '', content: '', isPublished: mode === 'create', coverUrl: '', contentFormat: 'markdown' as ContentFormat, ...initialTranslations?.uk },
		en: { title: '', content: '', isPublished: false, coverUrl: '', contentFormat: 'markdown' as ContentFormat, ...initialTranslations?.en },
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

	function setDatePreset(preset: 'createdAt' | 'updatedAt' | 'today' | 'hidden') {
		if (preset === 'hidden') {
			dateMode = 'hidden';
			return;
		}
		
		dateMode = 'custom';
		let targetDate: Date | null = new Date();
		
		if (preset === 'createdAt') targetDate = createdAtDate || new Date();
		else if (preset === 'updatedAt') targetDate = updatedAtDate || new Date();
		
		customDateStr = targetDate.toISOString().split('T')[0];
	}

	function handleFormSubmit(e: Event) {
		e.preventDefault();

		// ── Validate date range (mirrors firestore.rules customDate constraint) ──────
		if (dateMode === 'custom') {
			const d = new Date(customDateStr);
			const minD = new Date(CUSTOM_DATE_MIN);
			const maxD = new Date(CUSTOM_DATE_MAX);
			if (isNaN(d.getTime()) || d < minD || d > maxD) {
				toast.error(`Дата публікації має бути між 01.01.1990 і ${maxD.toLocaleDateString('uk-UA')}`);
				return;
			}
		}

		// ── Validate category length ───────────────────────────────────────────────
		if (category.length > MAX_CATEGORY_LEN) {
			toast.error(`Категорія перевищує ${MAX_CATEGORY_LEN} символів (зараз: ${category.length})`);
			return;
		}

		// ── Validate title & content per language ──────────────────────────────────
		for (const lang of ['uk', 'en'] as const) {
			if (translations[lang].title.length > MAX_TITLE_LEN) {
				toast.error(`Заголовок (${lang.toUpperCase()}) перевищує ${MAX_TITLE_LEN} символів`);
				return;
			}
			if (translations[lang].content.length > MAX_CONTENT_LEN) {
				toast.error(`Вміст (${lang.toUpperCase()}) перевищує ${MAX_CONTENT_LEN.toLocaleString()} символів`);
				return;
			}
		}

		const customDate = dateMode === 'custom' ? Timestamp.fromDate(new Date(customDateStr)) : null;
		onsubmit({ contentType: selectedType, category, slug, dateMode, customDate, translations });
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
		const files = (e.target as HTMLInputElement).files;
		if (!files || files.length === 0) return;
		let loaded = 0;
		let failed = 0;
		for (const file of files) {
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
					loaded++;
				} catch {
					failed++;
				}
				if (loaded + failed === files.length) {
					if (loaded > 0) toast.success(get(t)('admin.editor.loadDraftFile'));
					if (failed > 0) toast.error(get(t)('admin.editor.draftFileError'));
				}
			};
			reader.readAsText(file);
		}
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

<section class="admin-article-form container" style="padding: 120px 24px 80px;">
	<div class="af-header">
		<div class="af-title-group">
			<a href="{base}/admin/content" class="af-back-btn" title={$t('admin.editor.backToList')}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
			</a>
			<h1 class="af-title">
				{mode === 'create' ? $t('admin.editor.newTitle') : $t('admin.editor.editTitle')}
			</h1>
		</div>
		<div class="af-actions">
			<button type="button" class="af-icon-btn" onclick={saveDraftToFile} title={$t('admin.editor.saveDraftFile')}>
				<FileDown size={18} />
			</button>
			<label class="af-icon-btn" style="cursor: pointer;" title={$t('admin.editor.loadDraftFile')}>
				<Paperclip size={18} />
				<input type="file" accept=".json" multiple onchange={loadDraftFromFile} style="display: none;" />
			</label>
			<button type="submit" form={formId} disabled={submitting} class="af-submit-btn" data-testid="{tp}-submit-button">
				<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
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

			<!-- Content Type Selector -->
			<div class="af-type-selector" data-testid="{tp}-type-selector">
				<span class="form-label">{$t('admin.editor.contentType')}</span>
				<div class="mode-toggle-group">
					<button type="button" class="mode-btn" class:active={selectedType === 'article'} onclick={() => handleTypeChange('article')} data-testid="{tp}-type-article">
						<FileText size={16} />
						{$t('admin.content.typeArticleSingular')}
					</button>
					<button type="button" class="mode-btn" class:active={selectedType === 'page'} onclick={() => handleTypeChange('page')} data-testid="{tp}-type-page">
						<Globe size={16} />
						{$t('admin.content.typePageSingular')}
					</button>
					<button type="button" class="mode-btn" class:active={selectedType === 'page_project'} onclick={() => handleTypeChange('page_project')} data-testid="{tp}-type-project">
						<Folder size={16} />
						{$t('admin.content.typeProjectSingular')}
					</button>
				</div>
			</div>

			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2.5rem;">
				<div class="form-group">
					<span class="form-label">{$t('admin.editor.category')}</span>
					<div class="af-cat-group">
						<div class="mode-toggle-group af-cat-toggles">
							<!-- 1. No category -->
							<button
								type="button"
								class="mode-btn"
								class:active={categorySelection === '__none__'}
								onclick={() => { categorySelection = '__none__'; catDropdownOpen = false; }}
								data-testid="{tp}-category-none-btn"
							>
								{$t('admin.editor.categoryNone')}
							</button>

							<!-- 2. Choose from list -->
							<div class="af-cat-choose-wrap">
								<button
									type="button"
									class="mode-btn af-cat-choose-btn"
									class:active={categorySelection !== '__none__' && categorySelection !== '__custom__'}
									onclick={() => { catDropdownOpen = !catDropdownOpen; }}
									data-testid="{tp}-category-select"
								>
									{#if categorySelection !== '__none__' && categorySelection !== '__custom__' && getSelectedCategoryLabel()}
										{getSelectedCategoryLabel()}
									{:else}
										{$t('admin.editor.categoryChoose')}
									{/if}
									<svg class="af-cat-chevron" class:open={catDropdownOpen} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
								</button>
								{#if catDropdownOpen}
									<div class="af-cat-dropdown" role="listbox" data-testid="{tp}-category-dropdown">
										{#each Object.entries(ARTICLE_CATEGORIES) as [key, labels]}
											<button
												type="button"
												class="af-cat-option"
												class:selected={categorySelection === key}
												onclick={() => selectCategory(key)}
												role="option"
												aria-selected={categorySelection === key}
												data-testid="{tp}-category-option-{key}"
											>
												<span class="af-cat-option-uk">{labels.uk}</span>
												<span class="af-cat-option-en">{labels.en}</span>
											</button>
										{/each}
									</div>
								{/if}
							</div>

							<!-- 3. Custom with two lang inputs -->
							<button
								type="button"
								class="mode-btn af-cat-custom-btn"
								class:active={categorySelection === '__custom__'}
								onclick={() => { categorySelection = '__custom__'; catDropdownOpen = false; }}
								data-testid="{tp}-category-custom-btn"
							>
								{$t('admin.editor.categoryCustom')}
							</button>
						</div>

						{#if categorySelection === '__custom__'}
							<div class="af-cat-custom-fields">
								<div class="af-cat-custom-field">
									<span class="af-cat-custom-lang">UA</span>
									<input
										type="text"
										bind:value={customCategoryUk}
										placeholder={$t('admin.editor.categoryCustomPlaceholderUk')}
										maxlength="24"
										class="form-input"
										data-testid="{tp}-category-custom-uk"
									/>
								</div>
								<div class="af-cat-custom-field">
									<span class="af-cat-custom-lang">EN</span>
									<input
										type="text"
										bind:value={customCategoryEn}
										placeholder={$t('admin.editor.categoryCustomPlaceholderEn')}
										maxlength="24"
										class="form-input"
										data-testid="{tp}-category-custom-en"
									/>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="form-group" style="grid-column: span 2;">
					<label class="form-label" for="customDate" style="margin-bottom: 0.75rem;">{$t('admin.editor.displayDate')}</label>
					<div style="display: flex; flex-direction: column; gap: 1rem;">
						<div class="mode-toggle-group">
							<button type="button" class="mode-btn" class:active={dateMode === 'hidden'} onclick={() => setDatePreset('hidden')}>
								{$t('admin.editor.dateHidden')}
							</button>
							<button type="button" class="mode-btn" onclick={() => setDatePreset('today')}>
								{$t('admin.editor.dateToday')}
							</button>
							<button type="button" class="mode-btn" class:active={dateMode === 'createdAt'} onclick={() => setDatePreset('createdAt')}>
								{$t('admin.editor.dateCreatedAt')}
							</button>
							<button type="button" class="mode-btn" class:active={dateMode === 'updatedAt'} onclick={() => setDatePreset('updatedAt')}>
								{$t('admin.editor.dateUpdatedAt')}
							</button>
						</div>
						
						<input
							type="date"
							id="customDate"
							value={getDisplayDateValue()}
							min={CUSTOM_DATE_MIN}
							max={CUSTOM_DATE_MAX}
							oninput={(e) => {
								dateMode = 'custom';
								customDateStr = e.currentTarget.value;
							}}
							class="form-input"
							style="max-width: 200px; opacity: {dateMode === 'hidden' ? 0.5 : 1}"
							data-testid="{tp}-custom-date-input"
						/>
					</div>
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
						maxlength={MAX_SLUG_LEN}
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
				<div class="cover-section-hd">
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
										maxlength={MAX_COVER_URL_LEN}
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
									<div class="cover-preview" style="width: 90px; aspect-ratio: 9/16; border-radius: 12px; overflow: hidden; background: #eee; flex-shrink: 0; box-shadow: var(--shadow-sm);">
										<img src={translations.uk.coverUrl} alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onload={(e) => (e.currentTarget as HTMLElement).style.display = ''} onerror={(e) => (e.currentTarget as HTMLElement).style.display = 'none'} />
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
										maxlength={MAX_COVER_URL_LEN}
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
										<div class="cover-preview" style="width: 70px; aspect-ratio: 9/16; border-radius: 8px; overflow: hidden; background: #eee; flex-shrink: 0;">
											<img src={translations[lang].coverUrl} alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onload={(e) => (e.currentTarget as HTMLElement).style.display = ''} onerror={(e) => (e.currentTarget as HTMLElement).style.display = 'none'} />
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
				<input type="text" id="article-title" bind:value={translations[activeLang].title} required maxlength={MAX_TITLE_LEN} class="form-input" placeholder={$t('admin.editor.titlePlaceholder')} data-testid="{tp}-title-input" />
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
			{#key activeLang}
			<RichTextEditor
				bind:value={translations[activeLang].content}
				onchange={(v: string) => translations[activeLang].content = v}
				initialMode={translations[activeLang].contentFormat === 'html' ? 'html' : 'visual'}
				onmodechange={(mode: string) => {
					translations[activeLang].contentFormat = (mode === 'html' ? 'html' : 'markdown') as ContentFormat;
				}}
				placeholder={$t('admin.editor.contentPlaceholder')}
				data-testid="{tp}-rich-text-editor"
			/>
			{/key}
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
					{@html renderContent(translations[activeLang].content || $t('admin.editor.previewEmpty'), translations[activeLang].contentFormat)}
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
					<input type="file" accept=".json" multiple onchange={loadDraftFromFile} style="display: none;" />
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

	/* Article form header */
	.af-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 3rem;
		gap: 1rem;
	}
	.af-title-group {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 0;
	}
	.af-back-btn {
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
	.af-back-btn:hover {
		border-color: var(--color-sea-blue);
		color: var(--color-sea-blue);
	}
	.af-title {
		font-family: var(--font-heading);
		color: var(--color-deep-ocean);
		font-size: 1.8rem;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.af-actions {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-shrink: 0;
	}
	.af-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		border: 2px solid var(--color-border);
		background: none;
		color: var(--color-muted-text);
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
	}
	.af-icon-btn:hover {
		border-color: var(--color-sea-blue);
		color: var(--color-sea-blue);
		background: rgba(33, 150, 186, 0.07);
	}
	.af-submit-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 1.4rem;
		border-radius: 14px;
		background: var(--color-sea-blue);
		color: #fff;
		border: none;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.15s;
		white-space: nowrap;
	}
	.af-submit-btn:hover:not(:disabled) {
		opacity: 0.88;
		transform: translateY(-1px);
	}
	.af-submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	@media (max-width: 620px) {
		.af-header { flex-wrap: wrap; }
		.af-title-group { flex: 1 0 100%; order: 1; min-width: 0; }
		.af-title { font-size: 1.35rem; }
		.af-actions { order: 2; }
		.af-submit-btn { font-size: 0.82rem; padding: 0.5rem 1rem; }
	}
	.cover-section-hd {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.mode-toggle-group {
		display: flex;
		background: var(--color-ice-blue);
		padding: 0.25rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 95, 174, 0.08);
		align-self: flex-start;
	}

	:global(.dark-theme) .mode-toggle-group {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.mode-btn {
		padding: 0.4rem 1.25rem;
		border: none;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-muted-text);
		transition: all 0.2s;
	}

	.mode-btn:hover:not(.active) {
		background: rgba(33, 150, 186, 0.08);
		color: var(--color-sea-blue);
	}

	.mode-btn.active {
		background: white;
		color: var(--color-sea-blue);
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	:global(.dark-theme) .mode-btn.active {
		background: var(--color-sea-blue);
		color: white;
	}

	/* Content Type Selector */
	.af-type-selector {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid rgba(0,0,0,0.05);
	}
	.af-type-selector .mode-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* Category Selector */
	.af-cat-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.af-cat-toggles {
		flex-wrap: wrap;
	}
	.af-cat-choose-wrap {
		position: relative;
	}
	.af-cat-choose-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.af-cat-chevron {
		transition: transform 0.2s;
		flex-shrink: 0;
	}
	.af-cat-chevron.open {
		transform: rotate(180deg);
	}
	.af-cat-dropdown {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		min-width: 260px;
		max-height: 320px;
		overflow-y: auto;
		background: var(--theme-dynamic-card-bg, #fff);
		border-radius: 16px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
		border: 1px solid rgba(0, 0, 0, 0.08);
		z-index: 100;
		padding: 0.35rem;
		display: flex;
		flex-direction: column;
	}
	:global(.dark-theme) .af-cat-dropdown {
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
		border-color: rgba(255, 255, 255, 0.1);
	}
	.af-cat-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.55rem 1rem;
		border: none;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-dark-text);
		transition: background 0.15s;
		text-align: left;
		width: 100%;
	}
	.af-cat-option:hover {
		background: rgba(33, 150, 186, 0.08);
	}
	.af-cat-option.selected {
		background: rgba(33, 150, 186, 0.12);
		color: var(--color-sea-blue);
	}
	.af-cat-option-uk {
		font-weight: 700;
	}
	.af-cat-option-en {
		font-size: 0.78rem;
		opacity: 0.5;
		font-weight: 500;
	}
	.af-cat-custom-fields {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.af-cat-custom-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 180px;
	}
	.af-cat-custom-lang {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--color-muted-text);
		opacity: 0.6;
		min-width: 22px;
		text-align: center;
		flex-shrink: 0;
	}
	.af-cat-custom-field .form-input {
		flex: 1;
	}
</style>
