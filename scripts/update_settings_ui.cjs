const fs = require('fs');

let pagePath = 'src/routes/admin/settings/+page.svelte';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  `let blocks = $state<BlockConfig[]>(DEFAULT_BLOCKS.map(b => ({ ...b })));`,
  `let blocks = $state<BlockConfig[]>(DEFAULT_BLOCKS.map(b => ({ ...b })));\nlet originalBlocks = $state(JSON.stringify(blocks));\nconst hasBlocksChanges = $derived(JSON.stringify(blocks) !== originalBlocks);`
);

page = page.replace(
  `let debugPanel = $state<DebugPanelConfig>({ ...DEFAULT_HEADER_SETTINGS.debugPanel });`,
  `let debugPanel = $state<DebugPanelConfig>({ ...DEFAULT_HEADER_SETTINGS.debugPanel });\nlet originalCta = $state(JSON.stringify(cta));\nlet originalHeaderBar = $state(JSON.stringify(headerBar));\nlet originalNavDropdown = $state(JSON.stringify(navDropdown));\nlet originalMobileOverlay = $state(JSON.stringify(mobileOverlay));\nlet originalDebugPanel = $state(JSON.stringify(debugPanel));\n\nconst hasCtaChanges = $derived(JSON.stringify(cta) !== originalCta);\nconst hasHeaderBarChanges = $derived(JSON.stringify(headerBar) !== originalHeaderBar);\nconst hasNavDropdownChanges = $derived(JSON.stringify(navDropdown) !== originalNavDropdown);\nconst hasMobileOverlayChanges = $derived(JSON.stringify(mobileOverlay) !== originalMobileOverlay);\nconst hasDebugPanelChanges = $derived(JSON.stringify(debugPanel) !== originalDebugPanel);`
);

page = page.replace(
  `          if (homeResult?.blocks?.length) blocks = homeResult.blocks;`,
  `          if (homeResult?.blocks?.length) blocks = homeResult.blocks;\n          originalBlocks = JSON.stringify(blocks);`
);

page = page.replace(
  `            if (headerResult.debugPanel) debugPanel = headerResult.debugPanel;`,
  `            if (headerResult.debugPanel) debugPanel = headerResult.debugPanel;\n            originalCta = JSON.stringify(cta);\n            originalHeaderBar = JSON.stringify(headerBar);\n            originalNavDropdown = JSON.stringify(navDropdown);\n            originalMobileOverlay = JSON.stringify(mobileOverlay);\n            originalDebugPanel = JSON.stringify(debugPanel);`
);

page = page.replace(
  `    await updateHomeSettings({ blocks });`,
  `    await updateHomeSettings({ blocks });\n    originalBlocks = JSON.stringify(blocks);`
);

page = page.replace(
  `    await updateHeaderSettings({ cta, headerBar, navDropdown, mobileOverlay, debugPanel });`,
  `    await updateHeaderSettings({ cta, headerBar, navDropdown, mobileOverlay, debugPanel });\n    originalCta = JSON.stringify(cta);\n    originalHeaderBar = JSON.stringify(headerBar);\n    originalNavDropdown = JSON.stringify(navDropdown);\n    originalMobileOverlay = JSON.stringify(mobileOverlay);\n    originalDebugPanel = JSON.stringify(debugPanel);`
);

const btnSaveHtml = (hasChanges, onClick, savingVar, loadingText, saveText, testId) => `
<div class="save-footer" style="display: flex; align-items: center; justify-content: flex-end; margin-top: 2rem;">
  {#if ${hasChanges}}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={${onClick}} disabled={${savingVar} || !${hasChanges}} class="btn-save-small {${hasChanges} ? 'is-active' : ''}" style="border: none;" data-testid="${testId}">
    {#if ${savingVar}}...{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> ${saveText}{/if}
  </button>
</div>`;

page = page.replace(
  `<button type="button" onclick={handleSubmit} disabled={saving} class="btn btn-primary" style="width: 100%; margin-top: 2rem; border: none; padding: 1.2rem;" data-testid="admin-settings-submit-btn">\n{saving ? $t('admin.editor.saving') : $t('admin.editor.saveBtn')}\n</button>`,
  btnSaveHtml('hasBlocksChanges', 'handleSubmit', 'saving', "$t('admin.editor.saving')", "$t('admin.editor.saveBtn')", "admin-settings-submit-btn")
);

page = page.replace(
  `<button type="button" onclick={handleHeaderSubmit} disabled={headerSaving} class="btn btn-primary" style="width: 100%; margin-top: 2rem; border: none; padding: 1.2rem;" data-testid="admin-settings-cta-submit-btn">\n{headerSaving ? $t('admin.editor.saving') : $t('admin.editor.saveBtn')}\n</button>`,
  btnSaveHtml('hasCtaChanges', 'handleHeaderSubmit', 'headerSaving', "$t('admin.editor.saving')", "$t('admin.editor.saveBtn')", "admin-settings-cta-submit-btn")
);

page = page.replace(
  `<button type="button" onclick={handleHeaderSubmit} disabled={headerSaving} class="btn btn-primary" style="width: 100%; margin-top: 0; border: none; padding: 1.2rem;" data-testid="admin-settings-debug-submit-btn">\n{headerSaving ? $t('admin.editor.saving') : $t('admin.editor.saveBtn')}\n</button>`,
  btnSaveHtml('hasDebugPanelChanges', 'handleHeaderSubmit', 'headerSaving', "$t('admin.editor.saving')", "$t('admin.editor.saveBtn')", "admin-settings-debug-submit-btn")
);

page = page.replace(
  `<div class="settings-card" data-testid="admin-settings-card">`,
  `<div class="settings-card {hasBlocksChanges ? 'has-changes' : ''}" data-testid="admin-settings-card">`
);
page = page.replace(
  `<div class="settings-card" style="margin-top: 2rem;" data-testid="admin-settings-cta-card">`,
  `<div class="settings-card {hasCtaChanges ? 'has-changes' : ''}" style="margin-top: 2rem;" data-testid="admin-settings-cta-card">`
);
page = page.replace(
  `<div class="settings-card" style="margin-top: 2rem;" data-testid="admin-settings-debug-card">`,
  `<div class="settings-card {hasDebugPanelChanges ? 'has-changes' : ''}" style="margin-top: 2rem;" data-testid="admin-settings-debug-card">`
);

page = page.replace(
  `  onsave={handleHeaderSubmit}\n  saving={headerSaving}\n/>`,
  `  onsave={handleHeaderSubmit}\n  saving={headerSaving}\n  hasChanges={hasHeaderBarChanges}\n/>`
);
page = page.replace(
  `  onsave={handleHeaderSubmit}\n  saving={headerSaving}\n/>`,
  `  onsave={handleHeaderSubmit}\n  saving={headerSaving}\n  hasChanges={hasNavDropdownChanges}\n/>`
);
page = page.replace(
  `  onsave={handleHeaderSubmit}\n  saving={headerSaving}\n/>`,
  `  onsave={handleHeaderSubmit}\n  saving={headerSaving}\n  hasChanges={hasMobileOverlayChanges}\n/>`
);

const styles = `
.settings-card.has-changes {
  border: 2px solid #f97316 !important;
  box-shadow: 0 10px 40px rgba(249, 115, 22, 0.15);
}

.unsaved-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #f97316;
  background: rgba(249, 115, 22, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  margin-right: 1rem;
  display: inline-flex;
  align-items: center;
}

.btn-save-small {
  background: #e2e8f0;
  color: #94a3b8;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: not-allowed;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  opacity: 0.7;
}

.btn-save-small.is-active {
  background: #10b981 !important;
  color: white;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.btn-save-small.is-active:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
}
`;
page = page.replace(`</style>`, styles + `\n</style>`);

fs.writeFileSync(pagePath, page);
console.log('pagePath updated');

let editorPath = 'src/lib/components/ui/MenuEditor.svelte';
let editor = fs.readFileSync(editorPath, 'utf8');

editor = editor.replace(
  `		onsave?: () => void;\n		saving?: boolean;\n	}`,
  `		onsave?: () => void;\n		saving?: boolean;\n		hasChanges?: boolean;\n	}`
);

editor = editor.replace(
  `		onsave,\n		saving = false,\n	}: Props = $props();`,
  `		onsave,\n		saving = false,\n		hasChanges = false,\n	}: Props = $props();`
);

editor = editor.replace(
  `<div class="me-card">`,
  `<div class="me-card {hasChanges ? 'has-changes' : ''}">`
);

editor = editor.replace(
  `	{#if onsave}\n		<button type="button" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; border: none; padding: 1rem;" onclick={onsave} disabled={saving}>\n			{saving ? $t('admin.menuEditor.saving') : $t('admin.menuEditor.save')}\n		</button>\n	{/if}`,
  `	{#if onsave}
    <div class="save-footer" style="display: flex; align-items: center; justify-content: flex-end; margin-top: 2rem;">
      {#if hasChanges}
        <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
      {/if}
      <button type="button" class="btn-save-small {hasChanges ? 'is-active' : ''}" onclick={onsave} disabled={saving || !hasChanges}>
        {#if saving}...{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> {$t('admin.menuEditor.save')}{/if}
      </button>
    </div>
	{/if}`
);

const editorStyles = `
	.me-card.has-changes {
		border: 2px solid #f97316 !important;
		box-shadow: 0 10px 40px rgba(249, 115, 22, 0.15);
	}

	.unsaved-badge {
		font-size: 0.7rem;
		font-weight: 700;
		color: #f97316;
		background: rgba(249, 115, 22, 0.1);
		padding: 0.3rem 0.6rem;
		border-radius: 12px;
		margin-right: 1rem;
		display: inline-flex;
		align-items: center;
	}

	.btn-save-small {
		background: #e2e8f0;
		color: #94a3b8;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: not-allowed;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
		opacity: 0.7;
	}

	.btn-save-small.is-active {
		background: #10b981 !important;
		color: white;
		opacity: 1;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.btn-save-small.is-active:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
	}
`;
editor = editor.replace(`</style>`, editorStyles + `\n</style>`);

fs.writeFileSync(editorPath, editor);
console.log('editorPath updated');
