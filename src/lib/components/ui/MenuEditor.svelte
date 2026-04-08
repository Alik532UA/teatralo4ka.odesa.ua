<script lang="ts">
	import LinkPicker from '$lib/components/ui/LinkPicker.svelte';
	import type { MenuConfig, MenuItem, MenuSection, MenuLinkType } from '$lib/services/settings';
	import { ArrowUp, ArrowDown, Eye, EyeOff, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-svelte';
	import { t } from 'svelte-i18n';

	interface Props {
		menu: MenuConfig;
		title: string;
		description?: string;
		articlesList: { slug: string; titleUk: string; titleEn: string }[];
		articlesLoading: boolean;
		knownPages: { value: string; labelUk: string; labelEn: string }[];
		onLoadArticles: () => void;
		onchange: (menu: MenuConfig) => void;
		onsave?: () => void;
		saving?: boolean;
	}

	let {
		menu,
		title,
		description,
		articlesList,
		articlesLoading,
		knownPages,
		onLoadArticles,
		onchange,
		onsave,
		saving = false,
	}: Props = $props();

	// ── Add-item state ───────────────────────────────────────────────────────

	type AddTarget = { type: 'root-item' } | { type: 'section-item'; sectionId: string } | { type: 'section' };

	let addTarget = $state<AddTarget | null>(null);
	let addForm = $state({
		sectionType: 'folder' as 'folder' | MenuLinkType,
		linkType: 'page' as MenuLinkType,
		href: '/',
		labelUk: '',
		labelEn: '',
	});

	// ── Edit state ───────────────────────────────────────────────────────────

	type EditTarget =
		| { type: 'item'; itemId: string; sectionId?: string }
		| { type: 'section'; sectionId: string };

	let editTarget = $state<EditTarget | null>(null);
	let editForm = $state({
		labelUk: '',
		labelEn: '',
		linkType: 'page' as MenuLinkType,
		href: '',
	});

	// ── Expanded sections ────────────────────────────────────────────────────
	let expandedIds = $state<Set<string>>(new Set());

	function toggleExpand(id: string) {
		const s = new Set(expandedIds);
		if (s.has(id)) s.delete(id); else s.add(id);
		expandedIds = s;
	}

	// ── Helpers to emit ──────────────────────────────────────────────────────

	function emit(patch: Partial<MenuConfig>) {
		onchange({ ...menu, ...patch });
	}

	function reorder<T extends { order: number }>(arr: T[]): T[] {
		return arr.map((x, i) => ({ ...x, order: i }));
	}

	// ── Root items ───────────────────────────────────────────────────────────

	function moveItemUp(i: number) {
		if (i === 0) return;
		const arr = [...menu.items];
		[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
		emit({ items: reorder(arr) });
	}

	function moveItemDown(i: number) {
		if (i === menu.items.length - 1) return;
		const arr = [...menu.items];
		[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
		emit({ items: reorder(arr) });
	}

	function toggleItemVisible(i: number) {
		emit({ items: menu.items.map((it, idx) => idx === i ? { ...it, visible: !it.visible } : it) });
	}

	function deleteItem(i: number) {
		emit({ items: reorder(menu.items.filter((_, idx) => idx !== i)) });
	}

	function startEditItem(item: MenuItem, sectionId?: string) {
		editTarget = { type: 'item', itemId: item.id, sectionId };
		editForm = { labelUk: item.labelUk, labelEn: item.labelEn, linkType: item.linkType, href: item.href };
		if (item.linkType === 'article') onLoadArticles();
	}

	function saveEditItem() {
		if (!editTarget || editTarget.type !== 'item') return;
		const { itemId, sectionId } = editTarget;
		if (sectionId) {
			emit({
				sections: menu.sections.map(s => s.id !== sectionId ? s : {
					...s,
					items: s.items.map(it => it.id !== itemId ? it : { ...it, ...editForm }),
				}),
			});
		} else {
			emit({ items: menu.items.map(it => it.id !== itemId ? it : { ...it, ...editForm }) });
		}
		editTarget = null;
	}

	// ── Sections ─────────────────────────────────────────────────────────────

	function moveSectionUp(i: number) {
		if (i === 0) return;
		const arr = [...menu.sections];
		[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
		emit({ sections: reorder(arr) });
	}

	function moveSectionDown(i: number) {
		if (i === menu.sections.length - 1) return;
		const arr = [...menu.sections];
		[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
		emit({ sections: reorder(arr) });
	}

	function toggleSectionVisible(i: number) {
		emit({ sections: menu.sections.map((s, idx) => idx === i ? { ...s, visible: !s.visible } : s) });
	}

	function deleteSection(i: number) {
		emit({ sections: reorder(menu.sections.filter((_, idx) => idx !== i)) });
	}

	function startEditSection(section: MenuSection) {
		editTarget = { type: 'section', sectionId: section.id };
		editForm = {
			labelUk: section.labelUk ?? '',
			labelEn: section.labelEn ?? '',
			linkType: section.linkType ?? 'page',
			href: section.href ?? '',
		};
		if (section.linkType === 'article') onLoadArticles();
	}

	function saveEditSection() {
		if (!editTarget || editTarget.type !== 'section') return;
		const { sectionId } = editTarget;
		emit({
			sections: menu.sections.map(s => s.id !== sectionId ? s : {
				...s,
				labelUk: editForm.labelUk || undefined,
				labelEn: editForm.labelEn || undefined,
				linkType: editForm.href ? editForm.linkType : undefined,
				href: editForm.href || undefined,
			}),
		});
		editTarget = null;
	}

	// ── Section items ────────────────────────────────────────────────────────

	function moveSectionItemUp(si: number, ii: number) {
		if (ii === 0) return;
		const sections = menu.sections.map(s => ({ ...s, items: [...s.items] }));
		[sections[si].items[ii - 1], sections[si].items[ii]] = [sections[si].items[ii], sections[si].items[ii - 1]];
		sections[si].items = reorder(sections[si].items);
		emit({ sections });
	}

	function moveSectionItemDown(si: number, ii: number) {
		if (ii === menu.sections[si].items.length - 1) return;
		const sections = menu.sections.map(s => ({ ...s, items: [...s.items] }));
		[sections[si].items[ii], sections[si].items[ii + 1]] = [sections[si].items[ii + 1], sections[si].items[ii]];
		sections[si].items = reorder(sections[si].items);
		emit({ sections });
	}

	function toggleSectionItemVisible(si: number, ii: number) {
		emit({
			sections: menu.sections.map((s, sIdx) => sIdx !== si ? s : {
				...s,
				items: s.items.map((it, iIdx) => iIdx !== ii ? it : { ...it, visible: !it.visible }),
			}),
		});
	}

	function deleteSectionItem(si: number, ii: number) {
		emit({
			sections: menu.sections.map((s, sIdx) => sIdx !== si ? s : {
				...s,
				items: reorder(s.items.filter((_, iIdx) => iIdx !== ii)),
			}),
		});
	}

	// ── Add ──────────────────────────────────────────────────────────────────

	function openAdd(target: AddTarget) {
		addTarget = target;
		addForm = { sectionType: 'folder', linkType: 'page', href: '/', labelUk: '', labelEn: '' };
	}

	function setSectionType(t: 'folder' | MenuLinkType) {
		if (t === 'folder') {
			addForm = { ...addForm, sectionType: 'folder', href: '', labelUk: '', labelEn: '' };
		} else if (t === 'page') {
			const first = knownPages[0];
			addForm = { ...addForm, sectionType: 'page', linkType: 'page', href: first?.value ?? '/', labelUk: first?.labelUk ?? '', labelEn: first?.labelEn ?? '' };
		} else if (t === 'article') {
			onLoadArticles();
			addForm = { ...addForm, sectionType: 'article', linkType: 'article', href: '', labelUk: '', labelEn: '' };
		} else {
			addForm = { ...addForm, sectionType: 'url', linkType: 'url', href: '', labelUk: '', labelEn: '' };
		}
	}

	function confirmAdd() {
		if (!addTarget) return;
		const id = `custom_${Date.now()}`;
		const label = addForm.labelUk || addForm.href;
		const newItem: MenuItem = {
			id,
			labelUk: addForm.labelUk || label,
			labelEn: addForm.labelEn || label,
			linkType: addForm.linkType,
			href: addForm.href,
			visible: true,
			order: 0,
			custom: true,
		};

		if (addTarget.type === 'root-item') {
			emit({ items: reorder([...menu.items, newItem]) });
		} else if (addTarget.type === 'section-item') {
			const { sectionId } = addTarget;
			emit({
				sections: menu.sections.map(s => s.id !== sectionId ? s : {
					...s,
					items: reorder([...s.items, newItem]),
				}),
			});
			expandedIds = new Set([...expandedIds, sectionId]);
		} else if (addTarget.type === 'section') {
			const newSection: MenuSection = {
				id,
				labelUk: addForm.labelUk || undefined,
				labelEn: addForm.labelEn || undefined,
				linkType: addForm.sectionType !== 'folder' ? addForm.sectionType as MenuLinkType : undefined,
				href: addForm.sectionType !== 'folder' && addForm.href ? addForm.href : undefined,
				visible: true,
				order: 0,
				custom: true,
				items: [],
			};
			emit({ sections: reorder([...menu.sections, newSection]) });
		}

		addTarget = null;
	}

	// ── Display helpers ──────────────────────────────────────────────────────

	function itemDisplayLabel(it: MenuItem | MenuSection) {
		return it.labelUk || ('href' in it && it.href ? it.href : $t('admin.menuEditor.noName'));
	}
</script>

<div class="me-card">
	<h2 class="me-title">{title}</h2>
	{#if description}<p class="me-desc">{description}</p>{/if}

	<!-- ═══ Root items ════════════════════════════════════════════════════════ -->
	{#if menu.items.length > 0}
		<div class="me-section-label">{$t('admin.menuEditor.itemsLabel')}</div>
		<ul class="me-list">
			{#each menu.items as item, i}
				<li class="me-row" class:me-row--hidden={!item.visible}>
					<span class="me-order">{i + 1}</span>
					<span class="me-name">
						{itemDisplayLabel(item)}
						{#if item.itemType === 'cta'}<span class="me-badge">CTA</span>{/if}
					</span>
					<div class="me-actions">
					<button type="button" class="me-btn" disabled={i === 0} onclick={() => moveItemUp(i)} title={$t('admin.menuEditor.btnUp')}><ArrowUp size={15} /></button>
					<button type="button" class="me-btn" disabled={i === menu.items.length - 1} onclick={() => moveItemDown(i)} title={$t('admin.menuEditor.btnDown')}><ArrowDown size={15} /></button>
					<button type="button" class="me-btn" onclick={() => toggleItemVisible(i)} title={item.visible ? $t('admin.menuEditor.btnHide') : $t('admin.menuEditor.btnShow')}>
						{#if item.visible}<Eye size={15} />{:else}<EyeOff size={15} />{/if}
					</button>
					<button type="button" class="me-btn" onclick={() => startEditItem(item)} title={$t('admin.menuEditor.btnEdit')}><Pencil size={15} /></button>
					{#if item.custom}
						<button type="button" class="me-btn me-btn--del" onclick={() => deleteItem(i)} title={$t('admin.menuEditor.btnDelete')}><Trash2 size={15} /></button>
						{/if}
					</div>
				</li>

				{#if editTarget?.type === 'item' && editTarget.itemId === item.id && !editTarget.sectionId}
					<li class="me-edit-row">
				<div class="me-edit-label">{$t('admin.menuEditor.labelUk')} <input class="me-input" type="text" bind:value={editForm.labelUk} /></div>
						<div class="me-edit-label">{$t('admin.menuEditor.labelEn')} <input class="me-input" type="text" bind:value={editForm.labelEn} /></div>
						<div class="me-edit-label">{$t('admin.menuEditor.linkLabel')}</div>
						<LinkPicker
							linkType={editForm.linkType}
							href={editForm.href}
							{articlesList}
							{articlesLoading}
							{knownPages}
							{onLoadArticles}
							onchange={(p) => { editForm = { ...editForm, ...p }; }}
						/>
						<div class="me-edit-actions">
							<button type="button" class="me-save-btn" onclick={saveEditItem}>{$t('admin.menuEditor.save')}</button>
							<button type="button" class="me-cancel-btn" onclick={() => editTarget = null}>{$t('admin.menuEditor.cancel')}</button>
						</div>
					</li>
				{/if}
			{/each}
		</ul>
	{/if}

	<!-- ═══ Sections ══════════════════════════════════════════════════════════ -->
	{#each menu.sections as section, si}
		<div class="me-section">
			<div class="me-row" class:me-row--hidden={!section.visible}>
				<span class="me-order">{si + 1}</span>
				<span class="me-name">
				{section.labelUk || $t('admin.menuEditor.noTitle')}
				<small class="me-hint">· {section.items.length} {$t('admin.menuEditor.itemsCountSuffix')}</small>
					{#if section.href}<small class="me-hint me-href">→ {section.href}</small>{/if}
				</span>
				<div class="me-actions">
					<button type="button" class="me-btn" disabled={si === 0} onclick={() => moveSectionUp(si)} title={$t('admin.menuEditor.btnUp')}><ArrowUp size={15} /></button>
					<button type="button" class="me-btn" disabled={si === menu.sections.length - 1} onclick={() => moveSectionDown(si)} title={$t('admin.menuEditor.btnDown')}><ArrowDown size={15} /></button>
					<button type="button" class="me-btn" onclick={() => toggleSectionVisible(si)} title={section.visible ? $t('admin.menuEditor.btnHide') : $t('admin.menuEditor.btnShow')}>
						{#if section.visible}<Eye size={15} />{:else}<EyeOff size={15} />{/if}
					</button>
					<button type="button" class="me-btn" onclick={() => startEditSection(section)} title={$t('admin.menuEditor.btnEdit')}><Pencil size={15} /></button>
					<button type="button" class="me-btn" onclick={() => toggleExpand(section.id)} title={$t('admin.menuEditor.btnExpand')}>
						{#if expandedIds.has(section.id)}<ChevronUp size={15} />{:else}<ChevronDown size={15} />{/if}
					</button>
					{#if section.custom}
						<button type="button" class="me-btn me-btn--del" onclick={() => deleteSection(si)} title={$t('admin.menuEditor.btnDelete')}><Trash2 size={15} /></button>
					{/if}
				</div>
			</div>

			{#if editTarget?.type === 'section' && editTarget.sectionId === section.id}
				<div class="me-edit-row">
				<div class="me-edit-label">{$t('admin.menuEditor.sectionNameLabel')} <input class="me-input" type="text" bind:value={editForm.labelUk} placeholder={$t('admin.menuEditor.noTitlePlaceholder')} /></div>
				<div class="me-edit-label">{$t('admin.menuEditor.labelEn')} <input class="me-input" type="text" bind:value={editForm.labelEn} /></div>
				<div class="me-edit-label">{$t('admin.menuEditor.sectionLinkLabel')}</div>
					<LinkPicker
						linkType={editForm.linkType}
						href={editForm.href}
						{articlesList}
						{articlesLoading}
						{knownPages}
						{onLoadArticles}
						onchange={(p) => { editForm = { ...editForm, ...p }; }}
					/>
					<div class="me-edit-actions">
					<button type="button" class="me-save-btn" onclick={saveEditSection}>{$t('admin.menuEditor.save')}</button>
					<button type="button" class="me-cancel-btn" onclick={() => editTarget = null}>{$t('admin.menuEditor.cancel')}</button>
					</div>
				</div>
			{/if}

			{#if expandedIds.has(section.id)}
				<div class="me-section-items">
					{#each section.items as item, ii}
						<div class="me-row me-row--sub" class:me-row--hidden={!item.visible}>
							<span class="me-order">{ii + 1}</span>
							<span class="me-name">
								{itemDisplayLabel(item)}
								{#if item.itemType === 'cta'}<span class="me-badge">CTA</span>{/if}
							</span>
							<div class="me-actions">
							<button type="button" class="me-btn" disabled={ii === 0} onclick={() => moveSectionItemUp(si, ii)} title={$t('admin.menuEditor.btnUp')}><ArrowUp size={15} /></button>
							<button type="button" class="me-btn" disabled={ii === section.items.length - 1} onclick={() => moveSectionItemDown(si, ii)} title={$t('admin.menuEditor.btnDown')}><ArrowDown size={15} /></button>
							<button type="button" class="me-btn" onclick={() => toggleSectionItemVisible(si, ii)} title={item.visible ? $t('admin.menuEditor.btnHide') : $t('admin.menuEditor.btnShow')}>
								{#if item.visible}<Eye size={15} />{:else}<EyeOff size={15} />{/if}
							</button>
							<button type="button" class="me-btn" onclick={() => startEditItem(item, section.id)} title={$t('admin.menuEditor.btnEdit')}><Pencil size={15} /></button>
							{#if item.custom}
								<button type="button" class="me-btn me-btn--del" onclick={() => deleteSectionItem(si, ii)} title={$t('admin.menuEditor.btnDelete')}><Trash2 size={15} /></button>
								{/if}
							</div>
						</div>

						{#if editTarget?.type === 'item' && editTarget.itemId === item.id && editTarget.sectionId === section.id}
							<div class="me-edit-row">
							<div class="me-edit-label">{$t('admin.menuEditor.labelUk')} <input class="me-input" type="text" bind:value={editForm.labelUk} /></div>
							<div class="me-edit-label">{$t('admin.menuEditor.labelEn')} <input class="me-input" type="text" bind:value={editForm.labelEn} /></div>
							<div class="me-edit-label">{$t('admin.menuEditor.linkLabel')}</div>
								<LinkPicker
									linkType={editForm.linkType}
									href={editForm.href}
									{articlesList}
									{articlesLoading}
									{knownPages}
									{onLoadArticles}
									onchange={(p) => { editForm = { ...editForm, ...p }; }}
								/>
								<div class="me-edit-actions">
								<button type="button" class="me-save-btn" onclick={saveEditItem}>{$t('admin.menuEditor.save')}</button>
								<button type="button" class="me-cancel-btn" onclick={() => editTarget = null}>{$t('admin.menuEditor.cancel')}</button>
								</div>
							</div>
						{/if}
					{/each}

					<!-- Add item to section -->
					{#if addTarget?.type === 'section-item' && addTarget.sectionId === section.id}
						<div class="me-edit-row">
							<LinkPicker
								linkType={addForm.linkType}
								href={addForm.href}
								labelUk={addForm.labelUk}
								labelEn={addForm.labelEn}
								showLabels
								{articlesList}
								{articlesLoading}
								{knownPages}
								{onLoadArticles}
								onchange={(p) => { addForm = { ...addForm, ...p }; }}
							/>
							<div class="me-edit-actions">
						<button type="button" class="me-save-btn" onclick={confirmAdd}>{$t('admin.menuEditor.add')}</button>
						<button type="button" class="me-cancel-btn" onclick={() => addTarget = null}>{$t('admin.menuEditor.cancel')}</button>
							</div>
						</div>
					{:else}
						<button type="button" class="me-add-sub-btn" onclick={() => openAdd({ type: 'section-item', sectionId: section.id })}>
						{$t('admin.menuEditor.addItem')}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/each}

	<!-- ═══ Add root item / add section ══════════════════════════════════════ -->
	{#if addTarget?.type === 'root-item'}
		<div class="me-add-form">
			<strong class="me-add-title">{$t('admin.menuEditor.newItemTitle')}</strong>
			<LinkPicker
				linkType={addForm.linkType}
				href={addForm.href}
				labelUk={addForm.labelUk}
				labelEn={addForm.labelEn}
				showLabels
				{articlesList}
				{articlesLoading}
				{knownPages}
				{onLoadArticles}
				onchange={(p) => { addForm = { ...addForm, ...p }; }}
			/>
			<div class="me-edit-actions">
				<button type="button" class="me-save-btn" onclick={confirmAdd}>{$t('admin.menuEditor.add')}</button>
				<button type="button" class="me-cancel-btn" onclick={() => addTarget = null}>{$t('admin.menuEditor.cancel')}</button>
			</div>
		</div>
	{:else if addTarget?.type === 'section'}
		<div class="me-add-form">
			<strong class="me-add-title">{$t('admin.menuEditor.newSectionTitle')}</strong>
			<div class="me-type-tabs">
				{#each (['folder', 'page', 'article', 'url'] as const) as typeOpt}
					<button type="button" class="me-tab" class:me-tab--active={addForm.sectionType === typeOpt} onclick={() => setSectionType(typeOpt)}>
					{typeOpt === 'folder' ? $t('admin.menuEditor.typeFolder') : typeOpt === 'page' ? $t('admin.menuEditor.typePage') : typeOpt === 'article' ? $t('admin.menuEditor.typeArticle') : $t('admin.menuEditor.typeUrl')}
					</button>
				{/each}
			</div>
			{#if addForm.sectionType === 'page'}
				<select class="me-select" value={addForm.href} onchange={(e) => {
					const v = (e.target as HTMLSelectElement).value;
					const page = knownPages.find(p => p.value === v);
					addForm = { ...addForm, href: v, labelUk: page?.labelUk ?? v, labelEn: page?.labelEn ?? v };
				}}>
					{#each knownPages as p}
						<option value={p.value}>{p.labelUk}</option>
					{/each}
				</select>
			{:else if addForm.sectionType === 'article'}
				{#if articlesLoading}
					<p class="me-hint">{$t('admin.menuEditor.loadingArticles')}</p>
				{:else}
					<select class="me-select" value={addForm.href} onchange={(e) => {
						const v = (e.target as HTMLSelectElement).value;
						const art = articlesList.find(a => a.slug === v);
							addForm = { ...addForm, href: v, labelUk: art?.titleUk ?? v, labelEn: art?.titleEn ?? art?.titleUk ?? v };
					}}>
						<option value="">{$t('admin.menuEditor.selectArticle')}</option>
						{#each articlesList as a}
							<option value={a.slug}>{a.titleUk} ({a.slug})</option>
						{/each}
					</select>
				{/if}
			{:else if addForm.sectionType === 'url'}
				<input type="url" class="me-select" placeholder="https://…" value={addForm.href} oninput={(e) => addForm = { ...addForm, href: (e.target as HTMLInputElement).value }} />
			{/if}
			<div class="me-edit-label">{$t('admin.menuEditor.labelUk')} <input class="me-input" type="text" bind:value={addForm.labelUk} placeholder={$t('admin.menuEditor.noTitlePlaceholder')} /></div>
			<div class="me-edit-label">{$t('admin.menuEditor.labelEn')} <input class="me-input" type="text" bind:value={addForm.labelEn} /></div>
			<div class="me-edit-actions">
				<button type="button" class="me-save-btn" onclick={confirmAdd}>{$t('admin.menuEditor.addSectionConfirm')}</button>
				<button type="button" class="me-cancel-btn" onclick={() => addTarget = null}>{$t('admin.menuEditor.cancel')}</button>
			</div>
		</div>
	{:else}
		<div class="me-add-buttons">
			<button type="button" class="me-add-btn" onclick={() => openAdd({ type: 'root-item' })}>{$t('admin.menuEditor.addItem')}</button>
			<button type="button" class="me-add-btn" onclick={() => openAdd({ type: 'section' })}>{$t('admin.menuEditor.addSection')}</button>
		</div>
	{/if}
	{#if onsave}
		<button type="button" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; border: none; padding: 1rem;" onclick={onsave} disabled={saving}>
			{saving ? $t('admin.menuEditor.saving') : $t('admin.menuEditor.save')}
		</button>
	{/if}
</div>

<style>
	.me-card {
		background: var(--theme-dynamic-card-bg);
		padding: 2.5rem;
		border-radius: 40px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
		margin-top: 2rem;
	}

	.me-title {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--color-deep-ocean);
		margin-bottom: 0.5rem;
	}

	.me-desc {
		color: var(--color-muted-text);
		margin-bottom: 1.5rem;
	}

	.me-section-label {
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-text);
		margin: 1rem 0 0.4rem;
	}

	.me-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.me-section {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.me-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 14px;
		border: 2px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface), transparent 40%);
		transition: border-color 0.2s, opacity 0.2s;
	}

	.me-row--hidden {
		opacity: 0.45;
	}

	.me-row--sub {
		border-radius: 10px;
		font-size: 0.9rem;
		padding: 0.6rem 0.85rem;
	}

	.me-section-items {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.4rem 0 0.4rem 2rem;
	}

	.me-order {
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1.1rem;
		color: var(--color-muted-text);
		width: 1.4rem;
		text-align: center;
		flex-shrink: 0;
	}

	.me-name {
		flex: 1;
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--color-dark-text);
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.me-hint {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--color-muted-text);
	}

	.me-href {
		font-family: monospace;
	}

	.me-badge {
		font-size: 0.7rem;
		font-weight: 700;
		background: var(--color-sea-blue);
		color: #fff;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
	}

	.me-actions {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		flex-shrink: 0;
	}

	.me-btn {
		background: none;
		border: none;
		padding: 0.2rem 0.35rem;
		cursor: pointer;
		font-size: 1rem;
		border-radius: 6px;
		transition: background 0.15s;
		line-height: 1;
	}

	.me-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-sea-blue), transparent 85%);
	}

	.me-btn:disabled {
		opacity: 0.2;
		cursor: default;
	}

	.me-btn--del:hover:not(:disabled) {
		background: color-mix(in srgb, #e53e3e, transparent 85%);
	}

	.me-edit-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 12px;
		border: 2px dashed var(--color-sea-blue);
		background: color-mix(in srgb, var(--color-surface), transparent 60%);
		margin-top: 0.3rem;
	}

	.me-edit-label {
		font-size: 0.85rem;
		color: var(--color-muted-text);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.me-input {
		flex: 1;
		min-width: 140px;
		padding: 0.4rem 0.7rem;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		font-size: 0.9rem;
		background: var(--color-surface);
		color: var(--color-dark-text);
	}

	.me-input:focus {
		outline: none;
		border-color: var(--color-sea-blue);
	}

	.me-edit-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.me-save-btn {
		padding: 0.5rem 1.2rem;
		background: var(--color-sea-blue);
		color: #fff;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.me-cancel-btn {
		padding: 0.5rem 1.2rem;
		background: none;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-dark-text);
	}

	.me-add-buttons {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	.me-add-btn {
		padding: 0.55rem 1.25rem;
		background: none;
		border: 2px solid var(--color-border);
		border-radius: 10px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-dark-text);
		transition: border-color 0.15s, background 0.15s;
	}

	.me-add-btn:hover {
		border-color: var(--color-sea-blue);
		background: color-mix(in srgb, var(--color-sea-blue), transparent 92%);
	}

	.me-add-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		margin-top: 1rem;
		border-radius: 14px;
		border: 2px dashed var(--color-sea-blue);
		background: color-mix(in srgb, var(--color-surface), transparent 60%);
	}

	.me-add-title {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-deep-ocean);
	}

	.me-add-sub-btn {
		align-self: flex-start;
		padding: 0.35rem 0.9rem;
		background: none;
		border: 2px dashed var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.8rem;
		color: var(--color-dark-text);
		margin-top: 0.2rem;
		transition: border-color 0.15s;
	}

	.me-add-sub-btn:hover {
		border-color: var(--color-sea-blue);
	}

	.me-type-tabs {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.me-tab {
		padding: 0.35rem 1rem;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		background: none;
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-dark-text);
		transition: border-color 0.15s, background 0.15s, color 0.15s;
	}

	.me-tab:hover {
		border-color: var(--color-sea-blue);
		color: var(--color-sea-blue);
	}

	.me-tab--active {
		background: var(--color-sea-blue);
		border-color: var(--color-sea-blue);
		color: #fff;
	}

	.me-select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--color-border);
		border-radius: 10px;
		font-size: 0.9rem;
		background: var(--color-surface);
		color: var(--color-dark-text);
	}

	.me-select:focus {
		outline: none;
		border-color: var(--color-sea-blue);
	}
</style>
