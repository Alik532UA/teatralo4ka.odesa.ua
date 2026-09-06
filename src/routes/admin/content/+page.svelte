<script lang="ts">
	import { authService } from '$lib/controllers/auth.svelte';
	import { toast } from '$lib/controllers/toast.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { deleteArticle, fetchAllContent, addArticle, updateArticle } from '$lib/services/admin-articles';
	import { logError } from '$lib/services/firebaseErrors';
	import { getDisplayDate, type Article, type ContentType, type StoredArticle } from '$lib/services/articles';
	import { ARTICLE_CATEGORIES, getCategoryLabel } from '$lib/config/categories';
	import { t, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { Timestamp } from 'firebase/firestore';
	import { ArrowLeft, Calendar, Eye, EyeOff, FileText, Folder, Globe, Paperclip, Plus, Search, SquarePen, Tag, Trash2 } from 'lucide-svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import ContentRowCard from '$lib/components/admin/ContentRowCard.svelte';
	import NewsExportBar from '$lib/components/admin/NewsExportBar.svelte';
	import { contentRows, filterRows, rowTypeCounts, rowYears } from '$lib/utils/adminContentRows';
	import { getNewsOverrides, saveNewsOverrides } from '$lib/services/newsOverrides';
	import { withHidden, type NewsOverrides } from '$lib/utils/newsOverrides';
	import { copyCodeNewsToDatabase } from '$lib/services/codeNewsCopy';
	import { buildNewsExport, newsExportFileName } from '$lib/utils/newsExport';
	import Select from '$lib/components/ui/Select.svelte';
	import { getContentExcerpt } from '$lib/utils/renderContent';
	import InputTools from '$lib/components/ui/InputTools.svelte';

	let searchEl = $state<HTMLInputElement | null>(null);

	let allItems = $state<StoredArticle[]>([]);
	/*
	 * Рішення про новини з КОДУ: приховані й замінені. Читаються тим самим
	 * публічним документом, що й на сайті, — адмінка не має власного джерела
	 * правди, інакше показувала б не те, що бачить читач.
	 */
	let overrides = $state<NewsOverrides | null>(null);
	let працює = $state<string | null>(null);
	/* Відібране для одного файла. Набір, а не поле в рядку: «виділити всі»
	   мусить лишитися однією дією, а фільтри тим часом змінюють самі рядки. */
	const вибрані = new SvelteSet<string>();
	let loading = $state(true);
	let search = $state('');
	let importing = $state(false);
	let togglingId = $state<string | null>(null);

	// Filters
	let filterType = $state<'all' | 'article' | 'page' | 'page_project'>('all');
	let filterStatus = $state<'all' | 'published' | 'draft'>('all');
	let filterCategory = $state('all');
	let filterYear = $state('all');

	const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';
	const isSuperAdmin = $derived(authService.profile?.isSuperAdmin === true);
	const permissions = $derived(authService.profile?.projects?.[PROJECT_ID]?.permissions);
	const canCreateArticle = $derived(isSuperAdmin || permissions?.canCreateArticles === true);
	const canCreatePage = $derived(isSuperAdmin || permissions?.canCreatePages === true);
	const canCreate = $derived(canCreateArticle || canCreatePage);
	const canDeleteArticle = $derived(isSuperAdmin || permissions?.canDeleteArticles === true);
	const canDeletePage = $derived(isSuperAdmin || permissions?.canDeletePages === true);

	function getItemType(item: Article): ContentType {
		return item.type || 'article';
	}

	function canDeleteItem(item: Article): boolean {
		const type = getItemType(item);
		if (type === 'article') return canDeleteArticle;
		return canDeletePage; // page and page_project share page permissions
	}

	function canEditItem(item: Article): boolean {
		const type = getItemType(item);
		if (type === 'article') return isSuperAdmin || permissions?.canEditArticles === true;
		return isSuperAdmin || permissions?.canEditPages === true;
	}

	const currentLang = $derived(((($locale as string) || 'uk') as 'uk' | 'en'));

	/*
	 * ПЕРЕЛІК ЗВОДИТЬ ДВА ДЖЕРЕЛА — базу й репозиторій.
	 *
	 * Доти адмінка бачила саму лише базу, тобто новини, які вже переїхали в код,
	 * зникали з-перед очей того, хто ними керує: ні приховати, ні замінити. Автор
	 * попросив прямо — «список і з firebase і з коду».
	 *
	 * Зведення, фільтри й лічильники живуть у `utils/adminContentRows`: там вони
	 * перевіряються без браузера, і там же записано, чому фільтр один на обидва
	 * джерела, а не по копії на кожне.
	 */
	const усіРядки = $derived(contentRows(allItems, currentLang, overrides));
	const typeCounts = $derived(rowTypeCounts(усіРядки));
	const availableYears = $derived(rowYears(усіРядки));
	const filtered = $derived(
		filterRows(усіРядки, {
			пошук: search,
			тип: filterType,
			стан: filterStatus,
			категорія: filterCategory,
			рік: filterYear
		})
	);

	/** Відібрати можна лише статтю з бази: у файл ідуть саме вони. */
	const відбірні = $derived(filtered.filter((р) => р.вид === 'db' && р.тип === 'article'));
	const усіВідібрані = $derived(
		відбірні.length > 0 && відбірні.every((р) => р.вид === 'db' && вибрані.has(р.стаття.id))
	);

	async function loadAll() {
		loading = true;
		/* Обидва джерела паралельно, і жодне не валить друге: без перевизначень
		   перелік просто показує всі новини з коду — так, як було доти. */
		const [вміст, рішення] = await Promise.allSettled([fetchAllContent(), getNewsOverrides()]);
		if (вміст.status === 'fulfilled') allItems = вміст.value;
		if (рішення.status === 'fulfilled') overrides = рішення.value;
		loading = false;
	}

	$effect(() => {
		if (!authService.loading && !authService.isAuthenticated) {
			goto(resolve('/admin/login'));
		} else {
			loadAll();
		}
	});

	async function handleDelete(item: Article) {
		if (!item.id) return;
		const type = getItemType(item);
		const confirmMsg = type === 'article' 
			? get(t)('admin.articles.deleteConfirm') 
			: get(t)('admin.pages.deleteConfirm');
		if (!(await toast.confirm(confirmMsg))) return;
		try {
			await deleteArticle(item.id);
			allItems = allItems.filter(a => a.id !== item.id);
			toast.success(type === 'article' 
				? get(t)('admin.articles.deleteSuccess') 
				: get(t)('admin.pages.deleted'));
		} catch (e: unknown) {
			logError(e);
			toast.error(e instanceof Error ? e.message : get(t)('admin.editor.errorUpdate'));
		}
	}

	async function togglePublish(article: Article, lang: 'uk' | 'en') {
		if (!article.id || togglingId) return;
		
		if (!canEditItem(article)) {
			toast.error(get(t)('admin.content.noPermissionToggle'));
			return;
		}

		togglingId = `${article.id}-${lang}`;
		try {
			const currentStatus = article.translations?.[lang]?.isPublished ?? false;
			const newTranslations = {
				uk: { ...article.translations.uk },
				en: { ...article.translations.en },
				[lang]: {
					...article.translations[lang],
					isPublished: !currentStatus
				}
			};

			await updateArticle(article.id, {
				translations: newTranslations
			});

			const idx = allItems.findIndex(a => a.id === article.id);
			if (idx !== -1) {
				allItems[idx].translations = newTranslations;
			}
			
			toast.success(get(t)('admin.content.statusUpdated', { values: { lang: lang.toUpperCase() } }));
		} catch (e: unknown) {
			logError(e);
			toast.error(e instanceof Error ? e.message : get(t)('admin.content.statusUpdateError'));
		} finally {
			togglingId = null;
		}
	}

	function formatDate(article: Article) {
		const timestamp = getDisplayDate(article);
		if (!timestamp) return get(t)('admin.editor.dateHidden');
		return timestamp.toDate().toLocaleDateString(get(locale) === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function getExcerpt(article: Article) {
		const currentLang = (get(locale) as 'uk' | 'en') || 'uk';
		const translation = article.translations?.[currentLang];
		/**
		 * Той самий помічник, що й для карток новин на сайті.
		 *
		 * Тут стояла власна копія «прибрати розмітку»: з тексту викидалися
		 * символи `#*`_[]()`. Дужки зникали, а те, що було між ними, лишалося,
		 * тож markdown-посилання показувало підпис, склеєний з адресою:
		 * «Одеса.Театр.PROhttp://Одеса.Театр.PRO». Внутрішня будова посилань у
		 * списку контенту не потрібна — потрібен текст, який побачить читач.
		 *
		 * Той самий дефект уже виправляли в описах карток; він повернувся тут
		 * саме тому, що правило було продубльоване, а не спільне.
		 */
		return getContentExcerpt(translation?.content || '', translation?.contentFormat, 120);
	}

	function getCoverUrl(article: Article): string {
		return article.translations?.uk?.coverUrl || article.translations?.en?.coverUrl || '';
	}

	function getTypeBadge(item: Article): { label: string; class: string } {
		const type = getItemType(item);
		switch (type) {
			case 'page': return { label: get(t)('admin.content.badgePage'), class: 'cl-type-page' };
			case 'page_project': return { label: get(t)('admin.content.badgeProject'), class: 'cl-type-project' };
			default: return { label: get(t)('admin.content.badgeArticle'), class: 'cl-type-article' };
		}
	}

	const canManageSettings = $derived(isSuperAdmin || permissions?.canManageSettings === true);

	/**
	 * Приховати новину з коду з переліків сайту — або повернути її туди.
	 *
	 * Стан підміняється ЛИШЕ після відповіді бази: інакше перелік перемалювався б
	 * на невдалому записі, і автор бачив би приховане, якого насправді немає.
	 */
	async function перемкнутиПриховання(codeNewsId: string, приховати: boolean) {
		if (працює) return;
		працює = codeNewsId;
		const нові = withHidden(overrides, codeNewsId, приховати);
		try {
			await saveNewsOverrides(нові);
			overrides = нові;
			toast.success(get(t)(приховати ? 'admin.content.codeHideDone' : 'admin.content.codeShowDone'));
		} catch (e: unknown) {
			logError(e);
			toast.error(e instanceof Error ? e.message : get(t)('admin.content.codeHideError'));
		} finally {
			працює = null;
		}
	}

	/** Копія новини з коду в базі — і одразу редактор для неї. */
	async function зробитиКопію(codeNewsId: string) {
		if (працює) return;
		if (!(await toast.confirm(get(t)('admin.content.codeCopyConfirm')))) return;
		працює = codeNewsId;
		try {
			const { articleId, overrides: нові } = await copyCodeNewsToDatabase(codeNewsId, overrides);
			overrides = нові;
			toast.success(get(t)('admin.content.codeCopyDone'));
			await goto(resolve('/admin/content/[id]', { id: articleId }));
		} catch (e: unknown) {
			logError(e);
			toast.error(e instanceof Error ? e.message : get(t)('admin.content.codeCopyError'));
		} finally {
			працює = null;
		}
	}

	function перемкнутиВибір(id: string, вибрано: boolean) {
		if (вибрано) вибрані.add(id);
		else вибрані.delete(id);
	}

	/** «Виділити всі» діє на ВИДИМЕ: фільтри для того тут і стоять. */
	function перемкнутиВсі() {
		if (усіВідібрані) {
			for (const рядок of відбірні) if (рядок.вид === 'db') вибрані.delete(рядок.стаття.id);
		} else {
			for (const рядок of відбірні) if (рядок.вид === 'db') вибрані.add(рядок.стаття.id);
		}
	}

	/**
	 * Відібране — одним файлом на диск. Базу це не чіпає.
	 *
	 * Саме одним: «варто все підготувати щоб на prod я міг зберегти новини і
	 * відправити в цей чат одним файлом, а не кожний окремо зберігати».
	 */
	function зберегтиВибрані() {
		const статті = allItems.filter((a) => вибрані.has(a.id));
		if (статті.length === 0) {
			toast.error(get(t)('admin.content.exportEmpty'));
			return;
		}
		const зараз = new Date();
		const файл = buildNewsExport(статті, зараз);
		const blob = new Blob([JSON.stringify(файл, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = newsExportFileName(зараз, файл.count);
		a.click();
		URL.revokeObjectURL(url);
		toast.success(get(t)('admin.content.exportDone', { values: { count: файл.count } }));
	}

	async function handleBulkLoad(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (!files || files.length === 0) return;
		
		importing = true;
		let loaded = 0;
		let failed = 0;

		for (const file of files) {
			try {
				const result = await new Promise<string | null>((resolve) => {
					const reader = new FileReader();
					reader.onload = (event) => resolve(event.target?.result as string);
					reader.onerror = () => resolve(null);
					reader.readAsText(file);
				});

				if (!result) { failed++; continue; }

				const data = JSON.parse(result);
				const customDate = data.dateMode === 'custom' && data.customDateStr 
					? Timestamp.fromDate(new Date(data.customDateStr)) 
					: null;

				await addArticle({
					category: data.category || 'news',
					slug: data.slug || '',
					dateMode: data.dateMode || 'createdAt',
					customDate,
					translations: data.translations,
					author: '',
					type: data.type || 'article'
				});
				loaded++;
			} catch (err) {
				console.error('Failed to import from file:', (err as Error).message);
				failed++;
			}
		}

		if (loaded > 0) {
			toast.success(get(t)('admin.content.importSuccess', { values: { count: loaded } }));
			await loadAll();
		}
		if (failed > 0) {
			toast.error(get(t)('admin.content.importError', { values: { count: failed } }));
		}
		
		importing = false;
		(e.target as HTMLInputElement).value = '';
	}
</script>

<section class="cl-page container" data-testid="admin-content-section-container">
	<!-- Header -->
	<div class="cl-header" data-testid="admin-content-header">
		<div class="cl-title-group">
			<a href={resolve('/admin')} class="cl-back-btn" data-testid="admin-content-back-btn" title={$t('admin.articles.backToPanel')}>
				<ArrowLeft size={20} aria-hidden="true" />
			</a>
			<h1 class="cl-title" data-testid="admin-content-title">{$t('admin.content.title')}</h1>
			{#if !loading}
				<span class="cl-count">{allItems.length}</span>
			{/if}
		</div>
		<div class="cl-header-actions" data-testid="admin-content-header-toolbar">
			{#if canCreate}
				<label class="cl-icon-btn cl-import-btn" title={$t('admin.editor.loadDraftFile')} data-testid="admin-content-import-btn">
					{#if importing}
						<div class="cl-mini-spinner"></div>
					{:else}
						<Paperclip size={18} />
					{/if}
					<input type="file" accept=".json" multiple onchange={handleBulkLoad} style="display: none;" disabled={importing} />
				</label>
				<a href={resolve('/admin/content/new')} class="btn btn-primary cl-create-btn" data-testid="admin-content-create-btn">
					<Plus size={18} aria-hidden="true" />
					{$t('admin.content.createBtn')}
				</a>
			{/if}
		</div>
	</div>

	<!-- Type Tabs -->
	<div class="cl-type-tabs">
		<button class="cl-type-tab" class:active={filterType === 'all'} onclick={() => filterType = 'all'}>
			{$t('admin.content.allTypes')}
			<span class="cl-tab-count">{typeCounts.all}</span>
		</button>
		<button class="cl-type-tab" class:active={filterType === 'article'} onclick={() => filterType = 'article'}>
			<FileText size={15} />
			{$t('admin.content.typeArticle')}
			<span class="cl-tab-count">{typeCounts.article}</span>
		</button>
		<button class="cl-type-tab" class:active={filterType === 'page'} onclick={() => filterType = 'page'}>
			<Globe size={15} />
			{$t('admin.content.typePage')}
			<span class="cl-tab-count">{typeCounts.page}</span>
		</button>
		<button class="cl-type-tab" class:active={filterType === 'page_project'} onclick={() => filterType = 'page_project'}>
			<Folder size={15} />
			{$t('admin.content.typeProject')}
			<span class="cl-tab-count">{typeCounts.page_project}</span>
		</button>
	</div>

	<!-- Filters Bar -->
	<div class="cl-filters-bar">
		<div class="cl-search-box has-input-tools">
			<Search size={18} class="cl-search-icon" />
			<input type="text" bind:this={searchEl} bind:value={search} placeholder={$t('admin.content.search')} data-testid="admin-content-search-input" />
			<InputTools
				bind:value={search}
				input={searchEl}
				overlay
				scope="admin-content-search"
				fieldLabel={$t('admin.content.search')}
			/>
		</div>

		<div class="cl-filter-groups">
			<div class="mode-toggle-group">
				<button class="mode-btn" class:active={filterStatus === 'all'} onclick={() => filterStatus = 'all'}>{$t('admin.content.filterAll')}</button>
				<button class="mode-btn" class:active={filterStatus === 'published'} onclick={() => filterStatus = 'published'}>{$t('admin.content.filterPublished')}</button>
				<button class="mode-btn" class:active={filterStatus === 'draft'} onclick={() => filterStatus = 'draft'}>{$t('admin.content.filterDraft')}</button>
			</div>

			{#if filterType === 'all' || filterType === 'article'}
				<Select
					bind:value={filterCategory}
					options={[
						{ value: 'all', label: $t('admin.content.allCategories') },
						...Object.entries(ARTICLE_CATEGORIES).map(([key, labels]) => ({
							value: key,
							label: labels.uk,
							hint: labels.en
						}))
					]}
					ariaLabel={$t('admin.content.allCategories')}
					testId="admin-content-filter-category-select"
				>
					{#snippet leading()}<Tag size={14} />{/snippet}
				</Select>
			{/if}

			<Select
				bind:value={filterYear}
				options={[
					{ value: 'all', label: $t('admin.content.allYears') },
					...availableYears.map((year) => ({ value: String(year), label: String(year) })),
					{ value: 'none', label: $t('admin.content.noDate') }
				]}
				ariaLabel={$t('admin.content.allYears')}
				testId="admin-content-filter-year-select"
			>
				{#snippet leading()}<Calendar size={14} />{/snippet}
			</Select>
		</div>
	</div>

	<!--
		ВІДБІР ДЛЯ ОДНОГО ФАЙЛА.
		Прапорці стоять на статтях із бази, бо в код переносять саме їх. «Виділити
		всі» діє на видиме — фільтри для того тут і стоять: «я хочу виділити всі і
		зняти чекбокси з тимчасових новин».
	-->
	{#if !loading && відбірні.length > 0}
		<NewsExportBar
			selectedCount={вибрані.size}
			allSelected={усіВідібрані}
			onToggleAll={перемкнутиВсі}
			onExport={зберегтиВибрані}
		/>
	{/if}

	<!--
		МЕЖА, ПРО ЯКУ ТРЕБА СКАЗАТИ СЛОВАМИ.
		Сторінка новини з коду зібрана заздалегідь, тож приховання й заміна діють у
		переліках негайно, а сам текст на її адресі зміниться після наступної
		збірки. Мовчати про це — означало б лишити автора гадати, чому «не
		змінилося».
	-->
	{#if !loading && filtered.some((рядок) => рядок.вид === 'code')}
		<p class="cl-code-note" data-testid="admin-content-code-hint">
			<!-- Без піктограми: кожна з `lucide-svelte` — окремий компонент у
			     бандлі, а тут вона не додає нічого, чого не каже сам текст. -->
			{$t('admin.content.codeNote')}
		</p>
	{/if}

	<!-- List -->
	<div class="cl-list" data-testid="admin-content-table-container">
		{#if loading}
			{#each [1,2,3,4] as n (n)}
				<div class="cl-skeleton"></div>
			{/each}
		{:else if filtered.length === 0}
			<div class="cl-empty" data-testid="admin-content-empty-message">
				<FileText size={48} opacity=".3" aria-hidden="true" />
				<p>{search ? $t('admin.content.noResults') : $t('admin.content.noItems')}</p>
			</div>
		{:else}
			{#each filtered as рядок (рядок.ключ)}
				{#if рядок.вид === 'db'}
					{@const item = рядок.стаття}
					{@const badge = getTypeBadge(item)}
					<ContentRowCard
						coverUrl={getCoverUrl(item)}
						badgeLabel={badge.label}
						badgeClass={badge.class}
						category={item.category ? getCategoryLabel(item.category, currentLang) : ''}
						date={formatDate(item)}
						title={рядок.назва}
						excerpt={getExcerpt(item)}
						rowKey={item.id}
						selectable={рядок.тип === 'article'}
						selected={вибрані.has(item.id)}
						selectLabel={$t('admin.content.selectRow', { values: { title: рядок.назва } })}
						onSelect={(вибрано) => перемкнутиВибір(item.id, вибрано)}
					>
						{#snippet status()}
							<div class="cl-langs" data-testid={`admin-content-row-${item.id}-status`}>
								<button
									class="cl-lang-badge {item.translations?.uk?.isPublished ? 'published' : 'draft'}"
									class:is-toggling={togglingId === `${item.id}-uk`}
									onclick={() => togglePublish(item, 'uk')}
									title={item.translations?.uk?.isPublished ? $t('admin.content.unpublish', { values: { lang: 'UA' } }) : $t('admin.content.publish', { values: { lang: 'UA' } })}
									disabled={!!togglingId}
								>
									UA
								</button>
								<button
									class="cl-lang-badge {item.translations?.en?.isPublished ? 'published' : 'draft'}"
									class:is-toggling={togglingId === `${item.id}-en`}
									onclick={() => togglePublish(item, 'en')}
									title={item.translations?.en?.isPublished ? $t('admin.content.unpublish', { values: { lang: 'EN' } }) : $t('admin.content.publish', { values: { lang: 'EN' } })}
									disabled={!!togglingId}
								>
									EN
								</button>
							</div>
						{/snippet}
						{#snippet actions()}
							<div class="cl-actions" data-testid={`admin-content-row-${item.id}-actions`}>
								<a href={resolve('/admin/content/[id]', { id: item.id })} class="cl-action-btn cl-edit-btn" data-testid={`admin-content-edit-${item.id}-btn`} title={$t('admin.articles.edit')}>
									<SquarePen size={17} aria-hidden="true" />
									<span>{$t('admin.articles.edit')}</span>
								</a>
								{#if canDeleteItem(item)}
									<button onclick={() => handleDelete(item)} class="cl-action-btn cl-delete-btn" data-testid={`admin-content-delete-${item.id}-btn`} title={$t('admin.articles.delete')}>
										<Trash2 size={17} aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/snippet}
					</ContentRowCard>
				{:else}
					<!--
						Новина, що живе В КОДІ. Правити її текст звідси не можна — файл лежить
						у репозиторії, — але приховати або замінити копією можна, і саме заради
						цих двох дій вона тут і показана.
					-->
					<ContentRowCard
						coverUrl={рядок.картка.coverUrl}
						badgeLabel={$t('admin.content.badgeCode')}
						badgeClass="cl-type-code"
						category={рядок.картка.category}
						date={рядок.картка.date}
						title={рядок.назва}
						excerpt={рядок.опис}
						rowKey={рядок.id}
					>
						{#snippet status()}
							<div class="cl-langs" data-testid={`admin-content-row-${рядок.id}-status`}>
								{#if рядок.заміна}
									<a href={resolve('/admin/content/[id]', { id: рядок.заміна })} class="cl-code-state" data-testid={`admin-content-row-${рядок.id}-replaced-link`}>
										{$t('admin.content.codeReplaced')}
									</a>
								{:else if рядок.приховано}
									<span class="cl-code-state" data-testid={`admin-content-row-${рядок.id}-hidden-badge`}>
										{$t('admin.content.codeHidden')}
									</span>
								{/if}
							</div>
						{/snippet}
						{#snippet actions()}
							<div class="cl-actions" data-testid={`admin-content-row-${рядок.id}-actions`}>
								<a href={resolve('/news/[id]', { id: рядок.id })} class="cl-action-btn cl-edit-btn" data-testid={`admin-content-open-${рядок.id}-link`} title={$t('admin.content.codeOpen')}>
									<!-- `Globe` — та сама піктограма, що вже стоїть на вкладці
									     «Сторінки»: «це є на сайті». Свою для цього одного
									     посилання довелося б тягнути в бандл окремо. -->
									<Globe size={17} aria-hidden="true" />
									<span>{$t('admin.content.codeOpen')}</span>
								</a>
								{#if canManageSettings && !рядок.заміна}
									<button
										class="cl-action-btn"
										onclick={() => перемкнутиПриховання(рядок.id, !рядок.приховано)}
										disabled={працює === рядок.id}
										data-testid={`admin-content-hide-${рядок.id}-btn`}
										title={рядок.приховано ? $t('admin.content.codeShow') : $t('admin.content.codeHide')}
									>
										{#if рядок.приховано}<Eye size={17} aria-hidden="true" />{:else}<EyeOff size={17} aria-hidden="true" />{/if}
									</button>
								{/if}
								{#if canCreateArticle && canManageSettings && !рядок.заміна}
									<button
										class="cl-action-btn"
										onclick={() => зробитиКопію(рядок.id)}
										disabled={працює === рядок.id}
										data-testid={`admin-content-copy-${рядок.id}-btn`}
										title={$t('admin.content.codeCopy')}
									>
										<SquarePen size={17} aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/snippet}
					</ContentRowCard>
				{/if}
			{/each}
		{/if}
	</div>
</section>

<style>
.cl-page {
	padding: 140px 24px 80px;
}

/* Header */
.cl-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 2rem;
	gap: 1rem;
}
.cl-title-group {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.cl-back-btn {
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
.cl-back-btn:hover {
	border-color: var(--accent-primary);
	color: var(--accent-primary);
}
.cl-title {
	font-family: var(--font-heading);
	color: var(--text-title);
	font-size: 1.8rem;
	margin: 0;
}
.cl-count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	height: 28px;
	padding: 0 8px;
	background: var(--accent-primary);
	color: var(--text-on-accent);
	border-radius: 20px;
	font-size: 0.8rem;
	font-weight: 700;
}
.cl-create-btn {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	white-space: nowrap;
}

/* Header Actions */
.cl-header-actions {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}
.cl-icon-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 14px;
	border: 2px solid var(--color-border);
	background: none;
	color: var(--color-muted-text);
	cursor: pointer;
	transition: all 0.15s;
}
.cl-icon-btn:hover:not(:disabled) {
	border-color: var(--accent-primary);
	color: var(--accent-primary);
	background: rgba(33, 150, 186, 0.05);
}
.cl-import-btn {
	background: var(--bg-card);
}

.cl-mini-spinner {
	width: 18px;
	height: 18px;
	border: 2px solid rgba(33, 150, 186, 0.2);
	border-top-color: var(--accent-primary);
	border-radius: 50%;
	animation: cl-spin 0.8s linear infinite;
}
@keyframes cl-spin {
	to { transform: rotate(360deg); }
}

/* Type Tabs */
.cl-type-tabs {
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.25rem;
	flex-wrap: wrap;
}
.cl-type-tab {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.6rem 1.25rem;
	border-radius: 14px;
	border: 2px solid var(--color-border);
	background: var(--bg-card);
	color: var(--color-muted-text);
	font-size: 0.88rem;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.2s;
}
.cl-type-tab:hover:not(.active) {
	border-color: var(--accent-primary);
	color: var(--accent-primary);
}
.cl-type-tab.active {
	border-color: var(--accent-primary);
	background: var(--accent-primary);
	color: var(--text-on-accent);
}
.cl-tab-count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 22px;
	height: 22px;
	padding: 0 6px;
	border-radius: 12px;
	font-size: 0.72rem;
	font-weight: 800;
	background: rgba(0, 0, 0, 0.08);
}
.cl-type-tab.active .cl-tab-count {
	background: rgba(255, 255, 255, 0.25);
}

/* Filters Bar */
.cl-filters-bar {
	display: flex;
	flex-wrap: wrap;
	gap: 1.25rem;
	margin-bottom: 2rem;
	align-items: center;
	background: var(--bg-card);
	padding: 1.25rem;
	border-radius: 24px;
	border: 1px solid rgba(0,0,0,0.05);
	box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.cl-search-box {
	flex: 1;
	min-width: 280px;
	position: relative;
	display: flex;
	align-items: center;
}
:global(.cl-search-icon) {
	position: absolute;
	left: 1rem;
	color: var(--accent-primary);
	opacity: 0.5;
}
.cl-search-box input {
	width: 100%;
	/* Правий відступ — під кнопки вводу; змінна оголошена в `.has-input-tools`. */
	padding: 0.75rem var(--input-tools-space, 1rem) 0.75rem 3rem;
	border-radius: 14px;
	border: 2px solid var(--color-border);
	background: var(--color-surface);
	font-size: 0.95rem;
	transition: all 0.2s;
	color: var(--color-dark-text);
}
.cl-search-box input:focus {
	outline: none;
	border-color: var(--accent-primary);
	box-shadow: 0 0 0 4px rgba(33, 150, 186, 0.1);
}

.cl-filter-groups {
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
	align-items: center;
}

:global(.select-icon) {
	position: absolute;
	left: 0.85rem;
	color: var(--accent-primary);
	opacity: 0.6;
	pointer-events: none;
}

/* List */
.cl-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

/* Lang badges */
.cl-langs {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	flex-shrink: 0;
}
.cl-lang-badge {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.72rem;
	font-weight: 800;
	padding: 4px 12px;
	border-radius: 20px;
	letter-spacing: 0.05em;
	border: none;
	cursor: pointer;
	font-family: inherit;
}
.cl-lang-badge.published {
	background: rgba(16, 185, 129, 0.12);
	color: #059669;
}
.cl-lang-badge.draft {
	background: rgba(245, 166, 35, 0.15);
	color: #d97706;
}
:global(.dark-theme) .cl-lang-badge.published {
	background: rgba(52, 211, 153, 0.18);
	color: #6ee7b7;
}
:global(.dark-theme) .cl-lang-badge.draft {
	background: rgba(245, 166, 35, 0.2);
	color: #fbbf24;
}
.cl-lang-badge:hover:not(:disabled) {
	filter: brightness(0.9);
	transform: translateY(-1px);
}
.cl-lang-badge.is-toggling {
	opacity: 0.5;
	pointer-events: none;
}
.cl-lang-badge.published::before { content: '●'; font-size: 0.6em; }
.cl-lang-badge.draft::before    { content: '○'; font-size: 0.6em; }

/* Actions */
.cl-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-shrink: 0;
}
.cl-action-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.55rem 1rem;
	border-radius: 14px;
	font-size: 0.85rem;
	font-weight: 700;
	cursor: pointer;
	text-decoration: none;
	border: 2px solid transparent;
	transition: all 0.2s;
}
.cl-edit-btn {
	background: var(--color-ice-blue);
	color: var(--accent-text);
}
.cl-edit-btn:hover {
	background: var(--accent-primary);
	color: var(--text-on-accent);
	box-shadow: 0 4px 12px rgba(33, 150, 186, 0.2);
}
.cl-delete-btn {
	background: none;
	color: var(--color-muted-text);
	border-color: var(--color-border);
	padding: 0.55rem;
}
.cl-delete-btn:hover {
	background: rgba(239, 68, 68, 0.08);
	border-color: #ef4444;
	color: #ef4444;
}

/* Mode toggle */
.mode-toggle-group {
	display: flex;
	background: var(--color-ice-blue);
	padding: 0.25rem;
	border-radius: 12px;
	border: 1px solid rgba(0, 95, 174, 0.08);
}
:global(.dark-theme) .mode-toggle-group {
	background: rgba(255, 255, 255, 0.03);
	border-color: rgba(255, 255, 255, 0.1);
}
.mode-btn {
	padding: 0.4rem 1rem;
	border-radius: 10px;
	border: none;
	background: transparent;
	font-size: 0.82rem;
	font-weight: 700;
	color: var(--color-muted-text);
	cursor: pointer;
	transition: all 0.2s;
}
.mode-btn.active {
	background: var(--bg-card);
	color: var(--accent-text);
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
:global(.dark-theme) .mode-btn.active {
	background: var(--accent-primary);
	color: var(--text-on-accent);
}

.cl-code-note {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	margin: 0 0 1rem;
	font-size: 0.82rem;
	line-height: 1.5;
	opacity: 0.7;
}

/* Стан новини з коду */
.cl-code-state {
	font-size: 0.72rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #b45309;
	text-align: center;
	max-width: 8rem;
	line-height: 1.3;
}
:global(.dark-theme) .cl-code-state {
	color: #fcd34d;
}

/* Skeleton */
.cl-skeleton {
	height: 110px;
	border-radius: 24px;
	background: linear-gradient(90deg, var(--color-border) 25%, rgba(200,221,230,0.4) 50%, var(--color-border) 75%);
	background-size: 200% 100%;
	animation: cl-shimmer 1.4s ease-in-out infinite;
}
@keyframes cl-shimmer {
	0%   { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

/* Empty state */
.cl-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 4rem 2rem;
	color: var(--color-muted-text);
	text-align: center;
}
.cl-empty p { margin: 0; font-size: 1rem; font-weight: 600; opacity: 0.7; }

/* Responsive */
@media (max-width: 1024px) {
	.cl-filters-bar { flex-direction: column; align-items: stretch; }
	.cl-search-box { width: 100%; }
}
@media (max-width: 640px) {
	/* Header Fix */
	.cl-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
	.cl-title-group { width: 100%; gap: 0.5rem; }
	.cl-title { font-size: 1.4rem; }
	.cl-count { margin-left: auto; }
	.cl-header-actions { width: 100%; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-start; }
	.cl-create-btn { flex: 1; justify-content: center; }

	/* Оболонка рядка та її телефонний вигляд — у `admin/ContentRowCard`; тут
	   лишилися ділянки, які заповнює РОЗМІТКА ЦІЄЇ СТОРІНКИ. */
	.cl-langs { 
		grid-area: status; 
		flex-direction: row; 
		gap: 0.35rem; 
		align-items: center; 
		flex-wrap: wrap; 
	}
	.cl-actions { 
		grid-area: actions; 
		width: 100%; 
		justify-content: flex-end; 
		padding-top: 0.5rem; 
		border-top: 1px solid var(--color-border); 
	}
	.cl-edit-btn span { display: none; }
	.cl-edit-btn { padding: 0.55rem; flex: 1; justify-content: center; }
	.cl-delete-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }

	/* Filter Tabs Fix */
	.cl-type-tabs { gap: 0.35rem; }
	.cl-type-tab { padding: 0.5rem 0.75rem; font-size: 0.78rem; flex: 1; justify-content: center; }
}
</style>
