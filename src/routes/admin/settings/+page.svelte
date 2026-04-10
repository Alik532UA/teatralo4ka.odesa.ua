<script lang="ts">
import { authService } from '$lib/states/auth.svelte';
import { toast } from '$lib/states/toast.svelte';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import {
  getHomeSettings, updateHomeSettings, DEFAULT_BLOCKS, type BlockConfig,
  getHeaderSettings, updateHeaderSettings, DEFAULT_HEADER_SETTINGS,
  getNewsPageSettings, updateNewsPageSettings,
  DEFAULT_NEWS_WIDGET_HOME, DEFAULT_NEWS_WIDGET_PAGE,
  type CtaConfig, type DebugPanelConfig, type TickerConfig, type MenuConfig, type MenuLinkType,
  type NewsWidgetConfig, type NewsViewMode,
  KNOWN_PAGE_ROUTES,
} from '$lib/services/settings';
import { collection, getDocs, query, orderBy as fsOrderBy } from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import { t } from 'svelte-i18n';
import { untrack } from 'svelte';
import ukData from '$lib/i18n/locales/uk.json';
import enData from '$lib/i18n/locales/en.json';
import MenuEditor from '$lib/components/ui/MenuEditor.svelte';
import LinkPicker from '$lib/components/ui/LinkPicker.svelte';
import { ArrowUp, ArrowDown } from 'lucide-svelte';
import { browser } from "$app/environment";

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'home' | 'news' | 'cta' | 'headerBar' | 'navMenu' | 'ticker' | 'debug';
let activeTab = $state<TabId>('home');

type SubTabId = 'desktop' | 'mobile';
type NewsSectionTabId = 'homeWidget' | 'pageWidget';

let activeSubTab = $state<SubTabId>('desktop');
let newsSectionTab = $state<NewsSectionTabId>('homeWidget');
let newsHomeSubTab = $state<SubTabId>('desktop');
let newsPageSubTab = $state<SubTabId>('desktop');

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'home',      labelKey: 'admin.settings.tabHome' },
  { id: 'news',      labelKey: 'admin.settings.tabNews' },
  { id: 'cta',       labelKey: 'admin.settings.tabCta' },
  { id: 'headerBar', labelKey: 'admin.settings.tabHeaderBar' },
  { id: 'navMenu',   labelKey: 'admin.settings.tabNavMenu' },
  { id: 'ticker',    labelKey: 'admin.settings.tabTicker' },
  { id: 'debug',     labelKey: 'admin.settings.tabDebug' },
];

// Reset sub-tab when main tab changes
$effect(() => {
  activeTab;
  untrack(() => { activeSubTab = 'desktop'; });
});

// ── Home blocks (desktop + mobile) ───────────────────────────────────────────
let blocks = $state<BlockConfig[]>(DEFAULT_BLOCKS.map(b => ({ ...b })));
let mobileBlocks = $state<BlockConfig[]>(DEFAULT_BLOCKS.map(b => ({ ...b })));
let originalBlocks = $state(JSON.stringify(DEFAULT_BLOCKS));
let originalMobileBlocks = $state(JSON.stringify(DEFAULT_BLOCKS));
const hasBlocksChanges = $derived(JSON.stringify(blocks) !== originalBlocks);
const hasMobileBlocksChanges = $derived(JSON.stringify(mobileBlocks) !== originalMobileBlocks);
let loading = $state(true);
let saving = $state(false);
let settingsLoaded = $state(false);

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

function updateTimeValue(isStart: boolean, type: 'h' | 'm', val: string) {
  const current = isStart ? ticker.startTime : ticker.endTime;
  const parts = current.split(':');
  if (parts.length < 2) {
    parts[0] = '00';
    parts[1] = '00';
  }
  if (type === 'h') parts[0] = val;
  else parts[1] = val;
  
  if (isStart) ticker.startTime = parts.join(':');
  else ticker.endTime = parts.join(':');
}

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
let ticker = $state<TickerConfig>({ ...DEFAULT_HEADER_SETTINGS.ticker });
let originalCta = $state(JSON.stringify(DEFAULT_HEADER_SETTINGS.cta));
let originalHeaderBar = $state(JSON.stringify(DEFAULT_HEADER_SETTINGS.headerBar));
let originalNavDropdown = $state(JSON.stringify(DEFAULT_HEADER_SETTINGS.navDropdown));
let originalMobileOverlay = $state(JSON.stringify(DEFAULT_HEADER_SETTINGS.mobileOverlay));
let originalDebugPanel = $state(JSON.stringify(DEFAULT_HEADER_SETTINGS.debugPanel));
let originalTicker = $state(JSON.stringify(DEFAULT_HEADER_SETTINGS.ticker));

const hasCtaChanges = $derived(JSON.stringify(cta) !== originalCta);
const hasHeaderBarChanges = $derived(JSON.stringify(headerBar) !== originalHeaderBar);
const hasNavDropdownChanges = $derived(JSON.stringify(navDropdown) !== originalNavDropdown);
const hasMobileOverlayChanges = $derived(JSON.stringify(mobileOverlay) !== originalMobileOverlay);
const hasDebugPanelChanges = $derived(JSON.stringify(debugPanel) !== originalDebugPanel);
const hasTickerChanges = $derived(JSON.stringify(ticker) !== originalTicker);
let headerSaving = $state(false);

// ── News widget settings (desktop + mobile) ──────────────────────────────────
let homeNewsWidget = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_HOME });
let mobileHomeNewsWidget = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_HOME });
let newsPageWidget = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_PAGE });
let mobileNewsPageWidget = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_PAGE });
let originalHomeNewsWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_HOME));
let originalMobileHomeNewsWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_HOME));
let originalNewsPageWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_PAGE));
let originalMobileNewsPageWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_PAGE));
const hasHomeNewsChanges = $derived(JSON.stringify(homeNewsWidget) !== originalHomeNewsWidget);
const hasMobileHomeNewsChanges = $derived(JSON.stringify(mobileHomeNewsWidget) !== originalMobileHomeNewsWidget);
const hasNewsPageChanges = $derived(JSON.stringify(newsPageWidget) !== originalNewsPageWidget);
const hasMobileNewsPageChanges = $derived(JSON.stringify(mobileNewsPageWidget) !== originalMobileNewsPageWidget);
let newsPageSaving = $state(false);

let lastTickerStr = "";
$effect(() => {
  if (browser) {
    const currentTicker = $state.snapshot(ticker);
    const str = JSON.stringify(currentTicker);
    if (str === lastTickerStr) return;
    lastTickerStr = str;

    untrack(() => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ticker-preview', { detail: currentTicker }));
      }, 0);
    });
  }
});

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
    } else {
      const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';
      const canManageSettings = authService.profile?.isSuperAdmin === true || 
                                authService.profile?.projects?.[PROJECT_ID]?.permissions?.canManageSettings === true;
      
      if (!canManageSettings) {
        toast.error('У вас немає прав для зміни налаштувань');
        goto(`${base}/admin`);
        return;
      }

      if (!settingsLoaded) {
        settingsLoaded = true;
        (async () => {
        try {
          await authService.user?.getIdToken(true);
          const [homeResult, headerResult, newsResult] = await Promise.all([
            getHomeSettings(),
            getHeaderSettings(),
            getNewsPageSettings(),
          ]);

          // ── Home settings ──
          if (homeResult?.blocks?.length) blocks = homeResult.blocks;
          if (homeResult?.mobileBlocks?.length) mobileBlocks = homeResult.mobileBlocks;
          if (homeResult?.newsWidget) homeNewsWidget = homeResult.newsWidget;
          if (homeResult?.mobileNewsWidget) mobileHomeNewsWidget = homeResult.mobileNewsWidget;
          originalBlocks = JSON.stringify(blocks);
          originalMobileBlocks = JSON.stringify(mobileBlocks);
          originalHomeNewsWidget = JSON.stringify(homeNewsWidget);
          originalMobileHomeNewsWidget = JSON.stringify(mobileHomeNewsWidget);

          // ── News page settings ──
          if (newsResult?.newsWidget) newsPageWidget = newsResult.newsWidget;
          if (newsResult?.mobileNewsWidget) mobileNewsPageWidget = newsResult.mobileNewsWidget;
          originalNewsPageWidget = JSON.stringify(newsPageWidget);
          originalMobileNewsPageWidget = JSON.stringify(mobileNewsPageWidget);

          // ── Header settings ──
          if (headerResult) {
            if (headerResult.cta) cta = headerResult.cta;
            if (headerResult.headerBar) headerBar = headerResult.headerBar;
            if (headerResult.navDropdown) navDropdown = headerResult.navDropdown;
            if (headerResult.mobileOverlay) mobileOverlay = headerResult.mobileOverlay;
            if (headerResult.debugPanel) debugPanel = headerResult.debugPanel;
            if (headerResult.ticker) ticker = headerResult.ticker;
            originalCta = JSON.stringify(cta);
            originalHeaderBar = JSON.stringify(headerBar);
            originalNavDropdown = JSON.stringify(navDropdown);
            originalMobileOverlay = JSON.stringify(mobileOverlay);
            originalDebugPanel = JSON.stringify(debugPanel);
            originalTicker = JSON.stringify(ticker);
          } else {
            // No header config in Firebase yet — defaults are resolved from code automatically.
            // Just update the original snapshots so change tracking is correct.
            originalCta = JSON.stringify(cta);
            originalHeaderBar = JSON.stringify(headerBar);
            originalNavDropdown = JSON.stringify(navDropdown);
            originalMobileOverlay = JSON.stringify(mobileOverlay);
            originalDebugPanel = JSON.stringify(debugPanel);
            originalTicker = JSON.stringify(ticker);
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
}
});

// ── Block order helpers ────────────────────────────────────────────────────────
function moveUp(index: number, isMobile = false) {
  const source = isMobile ? mobileBlocks : blocks;
  if (index === 0) return;
  const arr = source.map(b => ({ ...b }));
  [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
  const result = arr.map((b, i) => ({ ...b, order: i }));
  if (isMobile) mobileBlocks = result;
  else blocks = result;
}

function moveDown(index: number, isMobile = false) {
  const source = isMobile ? mobileBlocks : blocks;
  if (index === source.length - 1) return;
  const arr = source.map(b => ({ ...b }));
  [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
  const result = arr.map((b, i) => ({ ...b, order: i }));
  if (isMobile) mobileBlocks = result;
  else blocks = result;
}

function toggleVisible(index: number, isMobile = false) {
  if (isMobile) {
    mobileBlocks = mobileBlocks.map((b, i) => i === index ? { ...b, visible: !b.visible } : b);
  } else {
    blocks = blocks.map((b, i) => i === index ? { ...b, visible: !b.visible } : b);
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  saving = true;
  try {
    await updateHomeSettings({
      blocks,
      mobileBlocks,
      newsWidget: homeNewsWidget,
      mobileNewsWidget: mobileHomeNewsWidget,
    });
    originalBlocks = JSON.stringify(blocks);
    originalMobileBlocks = JSON.stringify(mobileBlocks);
    originalHomeNewsWidget = JSON.stringify(homeNewsWidget);
    originalMobileHomeNewsWidget = JSON.stringify(mobileHomeNewsWidget);
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
    await updateHeaderSettings({ cta, headerBar, navDropdown, mobileOverlay, debugPanel, ticker });
    originalCta = JSON.stringify(cta);
    originalHeaderBar = JSON.stringify(headerBar);
    originalNavDropdown = JSON.stringify(navDropdown);
    originalMobileOverlay = JSON.stringify(mobileOverlay);
    originalDebugPanel = JSON.stringify(debugPanel);
    originalTicker = JSON.stringify(ticker);
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || $t('admin.editor.errorSave'));
  } finally {
    headerSaving = false;
  }
}

async function handleNewsPageSubmit() {
  newsPageSaving = true;
  try {
    await updateNewsPageSettings({
      newsWidget: newsPageWidget,
      mobileNewsWidget: mobileNewsPageWidget,
    });
    originalNewsPageWidget = JSON.stringify(newsPageWidget);
    originalMobileNewsPageWidget = JSON.stringify(mobileNewsPageWidget);
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || $t('admin.editor.errorSave'));
  } finally {
    newsPageSaving = false;
  }
}
</script>

<!-- ── Snippets ─────────────────────────────────────────────────────────────── -->

{#snippet subtabBar(current: SubTabId, onChange: (v: SubTabId) => void)}
<nav class="subtab-bar" data-testid="admin-settings-subtabs">
  <button type="button" class="subtab-btn" class:active={current === 'desktop'} onclick={() => onChange('desktop')} data-testid="admin-settings-subtab-desktop">
    {$t('admin.settings.subtabDesktop')}
  </button>
  <button type="button" class="subtab-btn" class:active={current === 'mobile'} onclick={() => onChange('mobile')} data-testid="admin-settings-subtab-mobile">
    {$t('admin.settings.subtabMobile')}
  </button>
</nav>
{/snippet}

{#snippet sectionTabBar(current: NewsSectionTabId, onChange: (v: NewsSectionTabId) => void)}
<nav class="subtab-bar" style="margin-bottom: 2rem;">
  <button type="button" class="subtab-btn" class:active={current === 'homeWidget'} onclick={() => onChange('homeWidget')}>
    {$t('admin.settings.newsHomepageSubSection')}
  </button>
  <button type="button" class="subtab-btn" class:active={current === 'pageWidget'} onclick={() => onChange('pageWidget')}>
    {$t('admin.settings.newsPageSubSection')}
  </button>
</nav>
{/snippet}

{#snippet blocksCard(blockList: BlockConfig[], onMoveUp: (i: number) => void, onMoveDown: (i: number) => void, onToggle: (i: number) => void, onReset: () => void, hasChanges: boolean, isSaving: boolean, onSave: () => void)}
<div class="settings-card {hasChanges ? 'has-changes' : ''}" data-testid="admin-settings-card">
<h2 class="settings-card__title" data-testid="admin-settings-blocks-title">{$t('admin.settings.blocksTitle')}</h2>
<p class="settings-card__desc" data-testid="admin-settings-blocks-desc">{$t('admin.settings.blocksDesc')}</p>

<ul class="blocks-list" data-testid="admin-settings-blocks-list">
{#each blockList as block, i}
<li class="block-item" data-testid="admin-settings-block-{block.id}-row">
<span class="block-item__order" data-testid="admin-settings-block-{block.id}-order">{i + 1}</span>
<span class="block-item__name" data-testid="admin-settings-block-{block.id}-name">
{$t(`admin.settings.blocks.${block.id}`)}
</span>
<div class="block-item__controls">
<button type="button" class="btn-icon" disabled={i === 0} onclick={() => onMoveUp(i)} aria-label="Move up" data-testid="admin-settings-block-{block.id}-up"><ArrowUp size={15} /></button>
<button type="button" class="btn-icon" disabled={i === blockList.length - 1} onclick={() => onMoveDown(i)} aria-label="Move down" data-testid="admin-settings-block-{block.id}-down"><ArrowDown size={15} /></button>
<label class="switch-label" data-testid="admin-settings-block-{block.id}-visible-label">
<input type="checkbox" class="switch-input" checked={block.visible} onchange={() => onToggle(i)} data-testid="admin-settings-block-{block.id}-visible" />
<span class="switch-slider"></span>
</label>
</div>
</li>
{/each}
</ul>

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={onReset} disabled={isSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges') || 'Є незбережені зміни'}</span>
  {/if}
  <button type="button" onclick={onSave} disabled={isSaving || !hasChanges} class="btn-save-small {hasChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-submit-btn">
    {#if isSaving}...{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>
{/snippet}

{#snippet newsWidgetCard(titleKey: string, descKey: string, cfg: NewsWidgetConfig, onChange: (v: NewsWidgetConfig) => void, onReset: () => void, hasChanges: boolean, isSaving: boolean, onSave: () => void)}
<div class="settings-card {hasChanges ? 'has-changes' : ''}" data-testid="admin-settings-news-widget-card">
<h2 class="settings-card__title">{$t(titleKey)}</h2>
<p class="settings-card__desc">{$t(descKey)}</p>

<ul class="blocks-list" style="margin-bottom: 1.5rem;">
<!-- Default view -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsDefaultView')}</span>
<div class="mode-toggle-group">
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'carousel'} onclick={() => onChange({ ...cfg, defaultView: 'carousel' })}>
    {$t('admin.settings.newsViewCarousel')}
  </button>
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'grid'} onclick={() => onChange({ ...cfg, defaultView: 'grid' })}>
    {$t('admin.settings.newsViewGrid')}
  </button>
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'list'} onclick={() => onChange({ ...cfg, defaultView: 'list' })}>
    {$t('admin.settings.newsViewList')}
  </button>
</div>
</li>

<!-- Show view switcher -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsShowViewSwitcher')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cfg.showViewSwitcher} onchange={() => onChange({ ...cfg, showViewSwitcher: !cfg.showViewSwitcher })} />
<span class="switch-slider"></span>
</label>
</li>

<!-- Autoplay (carousel only) -->
{#if cfg.defaultView === 'carousel'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsAutoplay')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cfg.autoplay} onchange={() => onChange({ ...cfg, autoplay: !cfg.autoplay })} />
<span class="switch-slider"></span>
</label>
</li>

<!-- Pinned article (carousel only) -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsPinnedArticle')}</span>
<div style="margin-left: auto; min-width: 200px;">
  {#if articlesList.length === 0 && !articlesLoading}
    <button type="button" class="mode-btn" style="font-size: 0.82rem;" onclick={loadArticles}>
      {$t('admin.menuEditor.loadingArticles')}
    </button>
  {:else}
    <select class="form-select news-widget-select" value={cfg.pinnedArticleId} onchange={(e: any) => onChange({ ...cfg, pinnedArticleId: e.target.value })}>
      <option value="">{$t('admin.settings.newsPinnedNone')}</option>
      {#each articlesList as art}
        <option value={art.slug}>{art.titleUk}</option>
      {/each}
    </select>
  {/if}
</div>
</li>
{/if}

<!-- Max items (grid view) -->
{#if cfg.defaultView !== 'carousel'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsMaxItemsGrid')}</span>
<div style="margin-left: auto; display: flex; align-items: center; gap: 0.75rem;">
  <label class="switch-label">
    <input type="checkbox" class="switch-input" checked={cfg.maxItemsGrid > 0} onchange={(e: any) => onChange({ ...cfg, maxItemsGrid: e.target.checked ? 6 : 0 })} />
    <span class="switch-slider"></span>
  </label>
  {#if cfg.maxItemsGrid > 0}
  <div style="display: flex; align-items: center; gap: 0.35rem;">
    <button type="button" class="number-btn" style="background: var(--color-surface); border: 2px solid rgba(0, 95, 174, 0.1); color: var(--color-text-primary);" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.max(1, cfg.maxItemsGrid - 1) })} disabled={cfg.maxItemsGrid <= 1} title="Decrease">−</button>
    <input
      type="number"
      class="form-select"
      style="width: 80px; text-align: center; padding: 0.35rem; height: 32px; min-height: 32px; border-radius: 8px; appearance: textfield; -moz-appearance: textfield;"
      min="1"
      max="100"
      value={cfg.maxItemsGrid}
      onchange={(e: any) => onChange({ ...cfg, maxItemsGrid: Math.max(1, parseInt(e.target.value) || 1) })}
    />
    <button type="button" class="number-btn" style="background: var(--color-surface); border: 2px solid rgba(0, 95, 174, 0.1); color: var(--color-text-primary);" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.min(100, cfg.maxItemsGrid + 1) })} disabled={cfg.maxItemsGrid >= 100} title="Increase">+</button>
  </div>
  {:else}
  <span style="font-size: 0.82rem; color: var(--color-muted-text);">
    {$t('admin.settings.newsMaxItemsUnlimited')}
  </span>
  {/if}
</div>
</li>

<!-- Max items (list view) -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsMaxItemsList')}</span>
<div style="margin-left: auto; display: flex; align-items: center; gap: 0.75rem;">
  <label class="switch-label">
    <input type="checkbox" class="switch-input" checked={cfg.maxItemsList > 0} onchange={(e: any) => onChange({ ...cfg, maxItemsList: e.target.checked ? 6 : 0 })} />
    <span class="switch-slider"></span>
  </label>
  {#if cfg.maxItemsList > 0}
  <div style="display: flex; align-items: center; gap: 0.35rem;">
    <button type="button" class="number-btn" style="background: var(--color-surface); border: 2px solid rgba(0, 95, 174, 0.1); color: var(--color-text-primary);" onclick={() => onChange({ ...cfg, maxItemsList: Math.max(1, cfg.maxItemsList - 1) })} disabled={cfg.maxItemsList <= 1} title="Decrease">−</button>
    <input
      type="number"
      class="form-select"
      style="width: 80px; text-align: center; padding: 0.35rem; height: 32px; min-height: 32px; border-radius: 8px; appearance: textfield; -moz-appearance: textfield;"
      min="1"
      max="100"
      value={cfg.maxItemsList}
      onchange={(e: any) => onChange({ ...cfg, maxItemsList: Math.max(1, parseInt(e.target.value) || 1) })}
    />
    <button type="button" class="number-btn" style="background: var(--color-surface); border: 2px solid rgba(0, 95, 174, 0.1); color: var(--color-text-primary);" onclick={() => onChange({ ...cfg, maxItemsList: Math.min(100, cfg.maxItemsList + 1) })} disabled={cfg.maxItemsList >= 100} title="Increase">+</button>
  </div>
  {:else}
  <span style="font-size: 0.82rem; color: var(--color-muted-text);">
    {$t('admin.settings.newsMaxItemsUnlimited')}
  </span>
  {/if}
</div>
</li>
{/if}
</ul>

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={onReset} disabled={isSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges') || 'Є незбережені зміни'}</span>
  {/if}
  <button type="button" onclick={onSave} disabled={isSaving || !hasChanges} class="btn-save-small {hasChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-news-submit-btn">
    {#if isSaving}...{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>
{/snippet}

<!-- ── Page template ────────────────────────────────────────────────────────── -->

<section class="admin-settings container" style="padding: 140px 24px 80px;" data-testid="admin-settings-section">
<div class="sh-header">
  <div class="sh-title-group">
    <a href="{base}/admin" class="sh-back-btn" data-testid="admin-settings-back-btn" title={$t('admin.editor.backToList')}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
    </a>
    <h1 class="sh-title">{$t('admin.dashboard.settingsTitle')}</h1>
  </div>
</div>

{#if loading}
<p data-testid="admin-settings-loading-label">{$t('admin.dashboard.loading')}</p>
{:else}

<!-- ══ Tab bar ══════════════════════════════════════════════════════════════ -->
<nav class="tab-bar" data-testid="admin-settings-tabs">
  {#each TABS as tab}
    <button
      type="button"
      class="tab-btn" class:active={activeTab === tab.id}
      onclick={() => activeTab = tab.id}
      data-testid="admin-settings-tab-{tab.id}"
    >{$t(tab.labelKey)}</button>
  {/each}
</nav>

<!-- ══ Tab: Home (block ordering) ══════════════════════════════════════════ -->
{#if activeTab === 'home'}

{@render subtabBar(activeSubTab, (v) => activeSubTab = v)}

{#if activeSubTab === 'desktop'}
  {@render blocksCard(
    blocks,
    (i) => moveUp(i, false),
    (i) => moveDown(i, false),
    (i) => toggleVisible(i, false),
    () => { blocks = DEFAULT_BLOCKS.map(b => ({ ...b })); },
    hasBlocksChanges,
    saving,
    handleSubmit
  )}
{:else}
  {@render blocksCard(
    mobileBlocks,
    (i) => moveUp(i, true),
    (i) => moveDown(i, true),
    (i) => toggleVisible(i, true),
    () => { mobileBlocks = DEFAULT_BLOCKS.map(b => ({ ...b })); },
    hasMobileBlocksChanges,
    saving,
    handleSubmit
  )}
{/if}

<!-- ══ Tab: News (homepage + news page widgets) ═══════════════════════════ -->
{:else if activeTab === 'news'}

{@render sectionTabBar(newsSectionTab, (v) => newsSectionTab = v)}

{#if newsSectionTab === 'homeWidget'}
  {@render subtabBar(newsHomeSubTab, (v) => newsHomeSubTab = v)}

  {#if newsHomeSubTab === 'desktop'}
    {@render newsWidgetCard(
      'admin.settings.newsHomepageTitle',
      'admin.settings.newsHomepageDesc',
      homeNewsWidget,
      (v) => { homeNewsWidget = v; },
      () => { homeNewsWidget = { ...DEFAULT_NEWS_WIDGET_HOME }; },
      hasHomeNewsChanges,
      saving,
      handleSubmit
    )}
  {:else}
    {@render newsWidgetCard(
      'admin.settings.newsHomepageTitle',
      'admin.settings.newsHomepageDesc',
      mobileHomeNewsWidget,
      (v) => { mobileHomeNewsWidget = v; },
      () => { mobileHomeNewsWidget = { ...DEFAULT_NEWS_WIDGET_HOME }; },
      hasMobileHomeNewsChanges,
      saving,
      handleSubmit
    )}
  {/if}
{:else}
  {@render subtabBar(newsPageSubTab, (v) => newsPageSubTab = v)}

  {#if newsPageSubTab === 'desktop'}
    {@render newsWidgetCard(
      'admin.settings.newsPageTitle',
      'admin.settings.newsPageDesc',
      newsPageWidget,
      (v) => { newsPageWidget = v; },
      () => { newsPageWidget = { ...DEFAULT_NEWS_WIDGET_PAGE }; },
      hasNewsPageChanges,
      newsPageSaving,
      handleNewsPageSubmit
    )}
  {:else}
    {@render newsWidgetCard(
      'admin.settings.newsPageTitle',
      'admin.settings.newsPageDesc',
      mobileNewsPageWidget,
      (v) => { mobileNewsPageWidget = v; },
      () => { mobileNewsPageWidget = { ...DEFAULT_NEWS_WIDGET_PAGE }; },
      hasMobileNewsPageChanges,
      newsPageSaving,
      handleNewsPageSubmit
    )}
  {/if}
{/if}

<!-- ══ Tab: CTA ════════════════════════════════════════════════════════════ -->
{:else if activeTab === 'cta'}

<div class="settings-card {hasCtaChanges ? 'has-changes' : ''}" data-testid="admin-settings-cta-card">
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

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={() => { cta = { ...DEFAULT_HEADER_SETTINGS.cta }; }} disabled={headerSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasCtaChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges') || 'Є незбережені зміни'}</span>
  {/if}
  <button type="button" onclick={handleHeaderSubmit} disabled={headerSaving || !hasCtaChanges} class="btn-save-small {hasCtaChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-cta-submit-btn">
    {#if headerSaving}...{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>

<!-- ══ Tab: Header Bar ═════════════════════════════════════════════════════ -->
{:else if activeTab === 'headerBar'}

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
  onreset={() => { headerBar = structuredClone(DEFAULT_HEADER_SETTINGS.headerBar); }}
  saving={headerSaving}
  hasChanges={hasHeaderBarChanges}
/>

<!-- ══ Tab: Navigation/Menu (desktop + mobile) ═════════════════════════════ -->
{:else if activeTab === 'navMenu'}

{@render subtabBar(activeSubTab, (v) => activeSubTab = v)}

{#if activeSubTab === 'desktop'}
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
    onreset={() => { navDropdown = structuredClone(DEFAULT_HEADER_SETTINGS.navDropdown); }}
    saving={headerSaving}
    hasChanges={hasNavDropdownChanges}
  />
{:else}
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
    onreset={() => { mobileOverlay = structuredClone(DEFAULT_HEADER_SETTINGS.mobileOverlay); }}
    saving={headerSaving}
    hasChanges={hasMobileOverlayChanges}
  />
{/if}

<!-- ══ Tab: Ticker ═════════════════════════════════════════════════════════ -->
{:else if activeTab === 'ticker'}

<div class="settings-card {hasTickerChanges ? 'has-changes' : ''}" data-testid="admin-settings-ticker-card">
<h2 class="settings-card__title">{$t('admin.settings.tickerTitle')}</h2>
<p class="settings-card__desc">{$t('admin.settings.tickerDesc')}</p>

<ul class="blocks-list" style="margin-bottom: 1.5rem;">
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.tickerVisible')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={ticker.visible} onchange={() => ticker = { ...ticker, visible: !ticker.visible }} />
<span class="switch-slider"></span>
</label>
</li>

<li class="block-item" class:opacity-muted={!ticker.visible}>
<span class="block-item__name">{$t('admin.settings.tickerShow')}</span>
<div class="mode-toggle-group">
  <button 
    type="button" 
    class="mode-btn" 
    class:active={ticker.mode === 'time'} 
    onclick={() => ticker.mode = 'time'}
    disabled={!ticker.visible}
  >
    {$t('admin.settings.tickerModeTime')}
  </button>
  <button 
    type="button" 
    class="mode-btn" 
    class:active={ticker.mode === 'always'} 
    onclick={() => ticker.mode = 'always'}
    disabled={!ticker.visible}
  >
    {$t('admin.settings.tickerModeAlways')}
  </button>
</div>
</li>

{#if ticker.mode === 'time'}
<li class="block-item" class:opacity-muted={!ticker.visible}>
<span class="block-item__name">{$t('admin.settings.tickerStartTime')}</span>
<div class="time-picker-group">
  <select class="form-select time-select" value={ticker.startTime.split(':')[0] || '00'} onchange={(e: any) => updateTimeValue(true, 'h', e.target.value)} disabled={!ticker.visible}>
    {#each hours as h}<option value={h}>{h}</option>{/each}
  </select>
  <span class="time-separator">:</span>
  <select class="form-select time-select" value={ticker.startTime.split(':')[1] || '00'} onchange={(e: any) => updateTimeValue(true, 'm', e.target.value)} disabled={!ticker.visible}>
    {#each minutes as m}<option value={m}>{m}</option>{/each}
  </select>
</div>
</li>
<li class="block-item" class:opacity-muted={!ticker.visible}>
<span class="block-item__name">{$t('admin.settings.tickerEndTime')}</span>
<div class="time-picker-group">
  <select class="form-select time-select" value={ticker.endTime.split(':')[0] || '00'} onchange={(e: any) => updateTimeValue(false, 'h', e.target.value)} disabled={!ticker.visible}>
    {#each hours as h}<option value={h}>{h}</option>{/each}
  </select>
  <span class="time-separator">:</span>
  <select class="form-select time-select" value={ticker.endTime.split(':')[1] || '00'} onchange={(e: any) => updateTimeValue(false, 'm', e.target.value)} disabled={!ticker.visible}>
    {#each minutes as m}<option value={m}>{m}</option>{/each}
  </select>
</div>
</li>
{/if}

<li class="block-item">
<span class="block-item__name">{$t('admin.settings.tickerPreview')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={ticker.preview} onchange={() => ticker = { ...ticker, preview: !ticker.preview }} />
<span class="switch-slider"></span>
</label>
</li>

<li class="block-item" class:opacity-muted={!ticker.visible}>
<span class="block-item__name">{$t('admin.settings.tickerEnableSound')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={ticker.enableSound} disabled={!ticker.visible} onchange={() => ticker = { ...ticker, enableSound: !ticker.enableSound }} />
<span class="switch-slider"></span>
</label>
</li>

<li class="block-item" class:opacity-muted={!ticker.visible}>
<span class="block-item__name">{$t('admin.settings.tickerEnableGrayscale')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={ticker.enableGrayscale} disabled={!ticker.visible} onchange={() => ticker = { ...ticker, enableGrayscale: !ticker.enableGrayscale }} />
<span class="switch-slider"></span>
</label>
</li>

{#if ticker.enableGrayscale}
<li class="block-item" style="flex-direction: column; align-items: stretch; gap: 0.75rem;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span class="block-item__name">{$t('admin.settings.tickerGrayscaleStrength')}</span>
    <span style="font-weight: 700; color: var(--color-sea-blue);">{ticker.grayscaleStrength}%</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    step="5"
    class="form-range"
    bind:value={ticker.grayscaleStrength}
    style="background: linear-gradient(to right, var(--color-sea-blue) {ticker.grayscaleStrength}%, var(--color-ice-blue) {ticker.grayscaleStrength}%);"
  />
</li>
{/if}</ul>

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={() => { ticker = { ...DEFAULT_HEADER_SETTINGS.ticker }; }} disabled={headerSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasTickerChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges') || 'Є незбережені зміни'}</span>
  {/if}
  <button type="button" onclick={handleHeaderSubmit} disabled={headerSaving || !hasTickerChanges} class="btn-save-small {hasTickerChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-ticker-submit-btn">
    {#if headerSaving}...{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>

<!-- ══ Tab: Debug ══════════════════════════════════════════════════════════ -->
{:else if activeTab === 'debug'}

<div class="settings-card {hasDebugPanelChanges ? 'has-changes' : ''}" data-testid="admin-settings-debug-card">
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

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={() => { debugPanel = { ...DEFAULT_HEADER_SETTINGS.debugPanel }; }} disabled={headerSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasDebugPanelChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges') || 'Є незбережені зміни'}</span>
  {/if}
  <button type="button" onclick={handleHeaderSubmit} disabled={headerSaving || !hasDebugPanelChanges} class="btn-save-small {hasDebugPanelChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-debug-submit-btn">
    {#if headerSaving}...{:else}<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>

{/if}
<!-- end tabs -->

{/if}
<!-- end loading -->
</section>

<style>
/* ─── Tab bar ──────────────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  margin-bottom: 2rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.tab-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 12px;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-muted-text);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: color-mix(in srgb, var(--color-sea-blue), transparent 92%);
  color: var(--color-sea-blue);
}

.tab-btn.active {
  background: var(--color-sea-blue);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 95, 174, 0.2);
}

/* ─── Sub-tab bar ──────────────────────────────────────── */
.subtab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.subtab-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 10px;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-muted-text);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.subtab-btn:hover {
  border-color: var(--color-sea-blue);
  color: var(--color-sea-blue);
}

.subtab-btn.active {
  background: color-mix(in srgb, var(--color-sea-blue), transparent 90%);
  border-color: var(--color-sea-blue);
  color: var(--color-sea-blue);
}

/* ─── Settings card ────────────────────────────────────── */
.settings-card {
background: var(--theme-dynamic-card-bg);
padding: 3rem;
border-radius: 40px;
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
margin-bottom: 2.5rem;
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

.block-item:has(input.switch-input:not(:checked)) {
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
font-weight: 600;
font-size: 1rem;
color: var(--color-dark-text);
}

.time-picker-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-ice-blue);
  padding: 0.35rem 0.5rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 95, 174, 0.08);
}

:global(.dark-theme) .time-picker-group {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.time-select {
  width: 62px !important;
  padding: 0.4rem 0.5rem !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  text-align: center !important;
  border: none !important;
  background: transparent !important;
  color: var(--color-deep-ocean) !important;
  cursor: pointer;
  border-radius: 8px !important;
  transition: background 0.2s !important;
  appearance: none;
  -webkit-appearance: none;
}

:global(.dark-theme) .time-select {
  color: var(--color-dark-text) !important;
}

.time-select:hover:not(:disabled) {
  background: rgba(33, 150, 186, 0.08) !important;
}

.time-select:focus {
  box-shadow: none !important;
  background: rgba(33, 150, 186, 0.12) !important;
}

.time-separator {
  font-weight: 800;
  color: var(--color-sea-blue);
  opacity: 0.6;
  font-size: 1.1rem;
  user-select: none;
}

.mode-toggle-group {
  display: flex;
  background: var(--color-ice-blue);
  padding: 0.25rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 95, 174, 0.08);
  margin-left: auto;
}

:global(.dark-theme) .mode-toggle-group {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.mode-btn {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-muted-text);
  cursor: pointer;
  transition: all 0.2s;
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

.mode-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.news-widget-select {
  max-width: 280px !important;
  width: auto !important;
  min-width: 150px;
}

.number-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-sea-blue);
  cursor: pointer;
  transition: all 0.15s;
}

.number-btn:hover:not(:disabled) {
  background: rgba(0, 95, 174, 0.1);
}

.number-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.block-item__controls {
display: flex;
align-items: center;
gap: 0.5rem;
margin-left: auto;
}

.form-range {
  width: 100%;
  height: 6px;
  background: var(--color-ice-blue);
  border-radius: 3px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.form-range:disabled {
  opacity: 1 !important;
  cursor: not-allowed !important;
  background: var(--color-ice-blue) !important;
}

.form-range::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: var(--color-sea-blue);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: transform 0.15s;
}

.form-range::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.form-range:disabled::-webkit-slider-thumb {
  cursor: not-allowed !important;
  opacity: 1 !important;
}

:global(.dark-theme) .form-range {
  background: rgba(255, 255, 255, 0.1);
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

:global(.settings-card.has-changes) {
  border: 2px solid #f97316 !important;
  box-shadow: 0 10px 40px rgba(249, 115, 22, 0.15);
}

:global(.unsaved-badge) {
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

:global(.btn-save-small) {
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

:global(.btn-save-small.is-active) {
  background: #10b981 !important;
  color: white;
  opacity: 1;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

:global(.btn-save-small.is-active):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
}

:global(.me-reset-btn) {
  padding: 0.5rem 1rem;
  background: none;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-muted-text);
  transition: border-color 0.15s, color 0.15s;
}

:global(.me-reset-btn):hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

:global(.me-reset-btn):disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Settings page header */
.sh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}
.sh-title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.sh-back-btn {
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
.sh-back-btn:hover {
  border-color: var(--color-sea-blue);
  color: var(--color-sea-blue);
}
.sh-title {
  font-family: var(--font-heading);
  color: var(--color-deep-ocean);
  font-size: 1.8rem;
  margin: 0;
}

.settings-section-heading {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-deep-ocean);
  margin: 0 0 0.75rem 0;
  padding-top: 1rem;
}

</style>