<script lang="ts">
import { authService } from '$lib/states/auth.svelte';
import { toast } from '$lib/states/toast.svelte';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import {
  getHomeSettings, updateHomeSettings, DEFAULT_BLOCKS, type BlockConfig,
  getHeaderSettings, updateHeaderSettings, DEFAULT_HEADER_SETTINGS,
  type CtaConfig, type DebugPanelConfig, type MenuConfig, type MenuLinkType,
  KNOWN_PAGE_ROUTES,
} from '$lib/services/settings';
import { collection, getDocs, query, orderBy as fsOrderBy } from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import { t } from 'svelte-i18n';
import ukData from '$lib/i18n/locales/uk.json';
import enData from '$lib/i18n/locales/en.json';
import MenuEditor from '$lib/components/ui/MenuEditor.svelte';
import LinkPicker from '$lib/components/ui/LinkPicker.svelte';
import { ArrowUp, ArrowDown } from 'lucide-svelte';

// ── Home blocks ──────────────────────────────────────────────────────────────
let blocks = $state<BlockConfig[]>(DEFAULT_BLOCKS.map(b => ({ ...b })));
let loading = $state(true);
let saving = $state(false);
let settingsLoaded = $state(false);

// ── Header settings ──────────────────────────────────────────────────────────
const VITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

function getLocaleString(data: any, key: string): string {
  return key.split('.').reduce((o: any, k: string) => o?.[k], data) ?? key;
}

const KNOWN_PAGES = $derived(KNOWN_PAGE_ROUTES.map(p => ({
  value: p.value,
  labelUk: getLocaleString(ukData, p.labelKey),
  labelEn: getLocaleString(enData, p.labelKey),
})));

let cta = $state<CtaConfig>({ ...DEFAULT_HEADER_SETTINGS.cta });
let headerBar = $state<MenuConfig>(structuredClone(DEFAULT_HEADER_SETTINGS.headerBar));
let navDropdown = $state<MenuConfig>(structuredClone(DEFAULT_HEADER_SETTINGS.navDropdown));
let mobileOverlay = $state<MenuConfig>(structuredClone(DEFAULT_HEADER_SETTINGS.mobileOverlay));
let debugPanel = $state<DebugPanelConfig>({ ...DEFAULT_HEADER_SETTINGS.debugPanel });
let headerSaving = $state(false);

let articlesList = $state<{ slug: string; titleUk: string; titleEn: string }[]>([]);
let articlesLoading = $state(false);

async function loadArticles() {
  if (articlesLoading || articlesList.length > 0) return;
  articlesLoading = true;
  try {
    const ref = collection(db, 'projects', VITE_PROJECT_ID, 'articles');
    const snap = await getDocs(query(ref, fsOrderBy('createdAt', 'desc')));
    articlesList = snap.docs.map(d => ({
      slug: (d.data().slug as string) || d.id,
      titleUk: (d.data().translations?.uk?.title as string) || d.id,
      titleEn: (d.data().translations?.en?.title as string) || (d.data().translations?.uk?.title as string) || d.id,
    }));
  } catch (e) {
    console.error('Failed to load articles:', e);
  } finally {
    articlesLoading = false;
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────
$effect(() => {
  if (!authService.loading) {
    if (!authService.isAuthenticated) {
      goto(`${base}/admin/login`);
    } else if (!settingsLoaded) {
      settingsLoaded = true;
      (async () => {
        try {
          await authService.user?.getIdToken(true);
          const [homeResult, headerResult] = await Promise.all([
            getHomeSettings(),
            getHeaderSettings(),
          ]);
          if (homeResult?.blocks?.length) blocks = homeResult.blocks;
          if (headerResult) {
            if (headerResult.cta) cta = headerResult.cta;
            if (headerResult.headerBar) headerBar = headerResult.headerBar;
            if (headerResult.navDropdown) navDropdown = headerResult.navDropdown;
            if (headerResult.mobileOverlay) mobileOverlay = headerResult.mobileOverlay;
            if (headerResult.debugPanel) debugPanel = headerResult.debugPanel;
          } else {
            // No header config in Firebase yet — seed defaults so admin gets full control
            try {
              await updateHeaderSettings({ cta, headerBar, navDropdown, mobileOverlay, debugPanel });
            } catch (seedErr) {
              console.warn('Could not seed default header settings:', seedErr);
            }
          }
        } catch (e: any) {
          console.error('Failed to load settings:', e);
          toast.error(e.message || $t('news.errorLoading'));
        } finally {
          loading = false;
        }
      })();
    }
  }
});

// ── Block order helpers ────────────────────────────────────────────────────────
function moveUp(index: number) {
  if (index === 0) return;
  const arr = blocks.map(b => ({ ...b }));
  [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
  blocks = arr.map((b, i) => ({ ...b, order: i }));
}

function moveDown(index: number) {
  if (index === blocks.length - 1) return;
  const arr = blocks.map(b => ({ ...b }));
  [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
  blocks = arr.map((b, i) => ({ ...b, order: i }));
}

function toggleVisible(index: number) {
  blocks = blocks.map((b, i) => i === index ? { ...b, visible: !b.visible } : b);
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  saving = true;
  try {
    await updateHomeSettings({ blocks });
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || $t('admin.editor.errorSave'));
  } finally {
    saving = false;
  }
}

async function handleHeaderSubmit() {
  headerSaving = true;
  try {
    await updateHeaderSettings({ cta, headerBar, navDropdown, mobileOverlay, debugPanel });
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || $t('admin.editor.errorSave'));
  } finally {
    headerSaving = false;
  }
}
</script>

<section class="admin-settings container" style="padding: 160px 24px;" data-testid="admin-settings-section">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
<h1 style="font-family: var(--font-heading); color: var(--color-deep-ocean);">{$t('admin.dashboard.settingsTitle')}</h1>
<a href="{base}/admin" class="btn btn-outline" data-testid="admin-settings-back-btn">{$t('admin.editor.backToList')}</a>
</div>

{#if loading}
<p data-testid="admin-settings-loading-label">{$t('admin.dashboard.loading')}</p>
{:else}

<!-- ══ Home blocks ══════════════════════════════════════════════════════════ -->
<div class="settings-card" data-testid="admin-settings-card">
<h2 class="settings-card__title" data-testid="admin-settings-blocks-title">{$t('admin.settings.blocksTitle')}</h2>
<p class="settings-card__desc" data-testid="admin-settings-blocks-desc">{$t('admin.settings.blocksDesc')}</p>

<ul class="blocks-list" data-testid="admin-settings-blocks-list">
{#each blocks as block, i}
<li class="block-item" data-testid="admin-settings-block-{block.id}-row">
<span class="block-item__order" data-testid="admin-settings-block-{block.id}-order">{i + 1}</span>
<span class="block-item__name" data-testid="admin-settings-block-{block.id}-name">
{$t(`admin.settings.blocks.${block.id}`)}
</span>
<div class="block-item__controls">
<button type="button" class="btn-icon" disabled={i === 0} onclick={() => moveUp(i)} aria-label="Move up" data-testid="admin-settings-block-{block.id}-up"><ArrowUp size={15} /></button>
<button type="button" class="btn-icon" disabled={i === blocks.length - 1} onclick={() => moveDown(i)} aria-label="Move down" data-testid="admin-settings-block-{block.id}-down"><ArrowDown size={15} /></button>
<label class="switch-label" data-testid="admin-settings-block-{block.id}-visible-label">
<input type="checkbox" class="switch-input" checked={block.visible} onchange={() => toggleVisible(i)} data-testid="admin-settings-block-{block.id}-visible" />
<span class="switch-slider"></span>
</label>
</div>
</li>
{/each}
</ul>

<button type="button" onclick={handleSubmit} disabled={saving} class="btn btn-primary" style="width: 100%; margin-top: 2rem; border: none; padding: 1.2rem;" data-testid="admin-settings-submit-btn">
{saving ? $t('admin.editor.saving') : $t('admin.editor.saveBtn')}
</button>
</div>

<!-- ══ CTA Button ══════════════════════════════════════════════════════════ -->
<div class="settings-card" style="margin-top: 2rem;" data-testid="admin-settings-cta-card">
<h2 class="settings-card__title">{$t('admin.settings.ctaTitle')}</h2>
<p class="settings-card__desc">{$t('admin.settings.ctaDesc')}</p>

<div class="block-item" style="margin-bottom: 1.5rem;">
<span class="block-item__name">{$t('admin.settings.ctaVisible')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cta.visible} onchange={() => cta = { ...cta, visible: !cta.visible }} />
<span class="switch-slider"></span>
</label>
</div>

<p class="section-sublabel">{$t('admin.settings.ctaLink')}</p>
<LinkPicker
  linkType={cta.linkType}
  href={cta.href}
  labelUk={cta.labelUk}
  labelEn={cta.labelEn}
  showLabels
  {articlesList}
  {articlesLoading}
  knownPages={KNOWN_PAGES}
  onLoadArticles={loadArticles}
  onchange={(p) => { cta = { ...cta, ...p }; }}
/>
<button type="button" onclick={handleHeaderSubmit} disabled={headerSaving} class="btn btn-primary" style="width: 100%; margin-top: 2rem; border: none; padding: 1.2rem;" data-testid="admin-settings-cta-submit-btn">
{headerSaving ? $t('admin.editor.saving') : $t('admin.editor.saveBtn')}
</button>
</div>

<!-- ══ Header Bar ══════════════════════════════════════════════════════════ -->
<MenuEditor
  menu={headerBar}
  title={$t('admin.settings.headerBarTitle')}
  description={$t('admin.settings.headerBarDesc')}
  {articlesList}
  {articlesLoading}
  knownPages={KNOWN_PAGES}
  onLoadArticles={loadArticles}
  onchange={(m) => { headerBar = m; }}
  onsave={handleHeaderSubmit}
  saving={headerSaving}
/>

<!-- ══ Nav Dropdown ════════════════════════════════════════════════════════ -->
<MenuEditor
  menu={navDropdown}
  title={$t('admin.settings.navDropdownTitle')}
  description={$t('admin.settings.navDropdownDesc')}
  {articlesList}
  {articlesLoading}
  knownPages={KNOWN_PAGES}
  onLoadArticles={loadArticles}
  onchange={(m) => { navDropdown = m; }}
  onsave={handleHeaderSubmit}
  saving={headerSaving}
/>

<!-- ══ Mobile Overlay ══════════════════════════════════════════════════════ -->
<MenuEditor
  menu={mobileOverlay}
  title={$t('admin.settings.mobileOverlayTitle')}
  description={$t('admin.settings.mobileOverlayDesc')}
  {articlesList}
  {articlesLoading}
  knownPages={KNOWN_PAGES}
  onLoadArticles={loadArticles}
  onchange={(m) => { mobileOverlay = m; }}
  onsave={handleHeaderSubmit}
  saving={headerSaving}
/>

<!-- ══ Debug Panel ══════════════════════════════════════════════════════════ -->
<div class="settings-card" style="margin-top: 2rem;" data-testid="admin-settings-debug-card">
<h2 class="settings-card__title">{$t('admin.settings.debugTitle')}</h2>
<p class="settings-card__desc">{$t('admin.settings.debugDesc')}</p>

<ul class="blocks-list" style="margin-bottom: 1.5rem;">
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.debugVisible')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={debugPanel.visible} onchange={() => debugPanel = { ...debugPanel, visible: !debugPanel.visible }} />
<span class="switch-slider"></span>
</label>
</li>
<li class="block-item" class:opacity-muted={!debugPanel.visible}>
<span class="block-item__name">{$t('admin.settings.debugShowBackground')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={debugPanel.showBackground} disabled={!debugPanel.visible} onchange={() => debugPanel = { ...debugPanel, showBackground: !debugPanel.showBackground }} />
<span class="switch-slider"></span>
</label>
</li>
<li class="block-item" class:opacity-muted={!debugPanel.visible}>
<span class="block-item__name">{$t('admin.settings.debugShowBlur')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={debugPanel.showBlur} disabled={!debugPanel.visible} onchange={() => debugPanel = { ...debugPanel, showBlur: !debugPanel.showBlur }} />
<span class="switch-slider"></span>
</label>
</li>
</ul>
<button type="button" onclick={handleHeaderSubmit} disabled={headerSaving} class="btn btn-primary" style="width: 100%; margin-top: 0; border: none; padding: 1.2rem;" data-testid="admin-settings-debug-submit-btn">
{headerSaving ? $t('admin.editor.saving') : $t('admin.editor.saveBtn')}
</button>
</div>

{/if}
</section>

<style>
.settings-card {
background: var(--theme-dynamic-card-bg);
padding: 3rem;
border-radius: 40px;
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
}

.settings-card__title {
font-family: var(--font-heading);
font-size: 1.5rem;
font-weight: 800;
color: var(--color-deep-ocean);
margin-bottom: 0.5rem;
}

.settings-card__desc {
color: var(--color-muted-text);
margin-bottom: 2rem;
}

.section-sublabel {
font-size: 0.82rem;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.05em;
color: var(--color-muted-text);
margin-bottom: 0.5rem;
}

.blocks-list {
list-style: none;
padding: 0;
margin: 0;
display: flex;
flex-direction: column;
gap: 0.75rem;
}

.block-item {
display: flex;
align-items: center;
gap: 1rem;
padding: 1rem 1.25rem;
border-radius: 16px;
border: 2px solid var(--color-border);
background: color-mix(in srgb, var(--color-surface), transparent 40%);
transition: border-color 0.2s;
}

.block-item:has(input:not(:checked)) {
opacity: 0.55;
}

.block-item__order {
font-family: var(--font-heading);
font-weight: 800;
font-size: 1.2rem;
color: var(--color-muted-text);
width: 1.5rem;
text-align: center;
}

.block-item__name {
flex: 1;
font-weight: 600;
font-size: 1rem;
color: var(--color-dark-text);
}

.block-item__controls {
display: flex;
align-items: center;
gap: 0.5rem;
}

.btn-icon {
background: none;
border: none;
padding: 0.25rem 0.5rem;
cursor: pointer;
font-size: 1.1rem;
border-radius: 8px;
transition: background 0.15s;
}

.btn-icon:hover:not(:disabled) {
background: color-mix(in srgb, var(--color-sea-blue), transparent 85%);
}

.btn-icon:disabled {
opacity: 0.25;
cursor: default;
}

.opacity-muted {
opacity: 0.4;
pointer-events: none;
}
</style>