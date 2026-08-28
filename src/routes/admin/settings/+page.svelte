<script lang="ts">
import { authService } from '$lib/controllers/auth.svelte';
import { toast } from '$lib/controllers/toast.svelte';
import { goto, replaceState } from '$app/navigation';
import { page } from '$app/state';
import { resolve } from '$app/paths';
import { logError } from '$lib/services/firebaseErrors';
import {
  getHomeSettings, updateHomeSettings, DEFAULT_BLOCKS, type BlockConfig,
  getHeaderSettings, updateHeaderSettings, DEFAULT_HEADER_SETTINGS,
  getNewsPageSettings, updateNewsPageSettings,
  getProjectsPageSettings, updateProjectsPageSettings,
  getAboutPageSettings, updateAboutPageSettings,
  DEFAULT_NEWS_WIDGET_HOME, DEFAULT_NEWS_WIDGET_HOME_MOBILE,
  DEFAULT_NEWS_WIDGET_PAGE, DEFAULT_NEWS_WIDGET_PAGE_MOBILE,
  DEFAULT_PROJECTS_WIDGET_HOME, DEFAULT_PROJECTS_WIDGET_HOME_MOBILE,
  DEFAULT_PROJECTS_WIDGET_PAGE, DEFAULT_PROJECTS_WIDGET_PAGE_MOBILE,
  DEFAULT_GALLERY_WIDGET_HOME, DEFAULT_GALLERY_WIDGET_HOME_MOBILE,
  DEFAULT_GALLERY_WIDGET_ABOUT, DEFAULT_GALLERY_WIDGET_ABOUT_MOBILE,
  type CtaConfig, type DebugPanelConfig, type TickerConfig, type MenuConfig,
  type NewsWidgetConfig,
  type ProjectsWidgetConfig,
  type GalleryWidgetConfig, type GalleryAspectRatio,
  KNOWN_PAGE_ROUTES,
  getHotNewsSettings, updateHotNewsSettings,
} from '$lib/services/settings';
import {
  DEFAULT_HOT_NEWS,
  type HotNewsConfig, type HotNewsCorner, type HotNewsDisplayMode, type HotNewsFrequency, type HotNewsItem, type HotNewsScope
} from '$lib/utils/hotNews';
import Select from '$lib/components/ui/Select.svelte';
import { SCROLLBAR_MODES, type ScrollbarMode } from '$lib/config/scrollbarModes';
import { BACKGROUND_OPTIONS } from '$lib/config/backgroundOptions';
import { collection, getDocs, query, orderBy as fsOrderBy, limit } from 'firebase/firestore';
  import { ADMIN_LIST_LIMIT } from '$lib/firebase/queryLimits';
import { db } from '$lib/firebase/config';
import { t } from 'svelte-i18n';
import { untrack } from 'svelte';
import ukData from '$lib/i18n/locales/uk.json';
import enData from '$lib/i18n/locales/en.json';
import MenuEditor from '$lib/components/ui/MenuEditor.svelte';
import LinkPicker from '$lib/components/ui/LinkPicker.svelte';
import { ArrowDown, ArrowLeft, ArrowUp, Save } from 'lucide-svelte';
import { browser } from "$app/environment";
import { getStaticProjectEntries } from '$lib/config/static-projects';
import { session, storage } from '$lib/services/storage';

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = 'home' | 'news' | 'hotNews' | 'projects' | 'gallery' | 'cta' | 'headerBar' | 'navMenu' | 'ticker' | 'debug';

type SubTabId = 'desktop' | 'mobile';
type NewsSectionTabId = 'homeWidget' | 'pageWidget';
type ProjectsSectionTabId = 'homeWidget' | 'pageWidget';
type GallerySectionTabId = 'homeWidget' | 'aboutWidget';

let activeSubTab = $state<SubTabId>('desktop');
let newsSectionTab = $state<NewsSectionTabId>('homeWidget');
let newsHomeSubTab = $state<SubTabId>('desktop');
let newsPageSubTab = $state<SubTabId>('desktop');
let projectsSectionTab = $state<ProjectsSectionTabId>('homeWidget');
let projectsHomeSubTab = $state<SubTabId>('desktop');
let projectsPageSubTab = $state<SubTabId>('desktop');
let gallerySectionTab = $state<GallerySectionTabId>('homeWidget');
let galleryHomeSubTab = $state<SubTabId>('desktop');
let galleryAboutSubTab = $state<SubTabId>('desktop');

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'home',      labelKey: 'admin.settings.tabHome' },
  { id: 'news',      labelKey: 'admin.settings.tabNews' },
  { id: 'hotNews',   labelKey: 'admin.settings.tabHotNews' },
  { id: 'projects',  labelKey: 'admin.settings.tabProjects' },
  { id: 'gallery',   labelKey: 'admin.settings.tabGallery' },
  { id: 'cta',       labelKey: 'admin.settings.tabCta' },
  { id: 'headerBar', labelKey: 'admin.settings.tabHeaderBar' },
  { id: 'navMenu',   labelKey: 'admin.settings.tabNavMenu' },
  { id: 'ticker',    labelKey: 'admin.settings.tabTicker' },
  { id: 'debug',     labelKey: 'admin.settings.tabDebug' },
];

/**
 * Вкладка живе в адресі — параметром `?tab=`, а не сегментом шляху.
 *
 * Сегмент вимагав би окремого маршруту на кожну з дев'яти вкладок, і кожного —
 * у `prerender.entries`, тоді як уся ця сторінка рендериться лише в браузері
 * (`ssr = false` в `admin/+layout.ts`). Параметр не вимагає нічого.
 *
 * `replaceState`, а не `pushState`: цінність тут у тому, щоб перезавантаження і
 * надісланий колезі лінк відкривали ту саму вкладку. Якби кожен клік додавав
 * запис в історію, вихід зі сторінки після обходу дев'яти вкладок вимагав би
 * дев'яти натисків «Назад». До того ж на цій сторінці двадцять окремих
 * прапорців незбережених змін, і перемикання вкладок кнопкою браузера тихо
 * губило б правки.
 */
const TAB_IDS: string[] = TABS.map((tab) => tab.id);

/** Вкладка з адреси. Невідома або відсутня — перша: значення прийшло звідки. */
function tabFromUrl(): TabId {
  const raw = page.url.searchParams.get('tab');
  return raw !== null && TAB_IDS.includes(raw) ? (raw as TabId) : 'home';
}

let activeTab = $state<TabId>(tabFromUrl());

function selectTab(id: TabId) {
  activeTab = id;
  /**
   * Шлях беремо з типізованого `resolve()` — неправильний маршрут тоді не
   * збереться, і це конвенція проєкту.
   *
   * `svelte/no-navigation-without-resolve` тут вимкнено свідомо: воно приймає
   * ЛИШЕ прямий виклик `resolve()` як аргумент, а шлях із параметром запиту
   * виразити так неможливо. Читав джерело правила — форми «рядок із resolve()
   * усередині» воно не розпізнає в принципі. Те, від чого правило захищає (шлях
   * без урахування `base`), тут виконано.
   *
   * Кінцевий слеш дописаний вручну: `resolve()` його не додає, а в проєкті
   * стоїть `trailingSlash: 'always'`, і без нього адреса розійшлася б із рештою
   * сайту.
   */
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  replaceState(`${resolve('/admin/settings')}/?tab=${id}`, {});
}

// Reset sub-tab when main tab changes
$effect(() => {
  // Явне читання стану створює залежність $effect — це не мертвий вираз.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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

function getLocaleString(data: unknown, key: string): string {
  const res = key
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' && k in o ? (o as Record<string, unknown>)[k] : undefined),
      data
    );
  return typeof res === 'string' ? res : key;
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
let mobileHomeNewsWidget = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_HOME_MOBILE });
let newsPageWidget = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_PAGE });
let mobileNewsPageWidget = $state<NewsWidgetConfig>({ ...DEFAULT_NEWS_WIDGET_PAGE_MOBILE });
let originalHomeNewsWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_HOME));
let originalMobileHomeNewsWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_HOME_MOBILE));
let originalNewsPageWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_PAGE));
let originalMobileNewsPageWidget = $state(JSON.stringify(DEFAULT_NEWS_WIDGET_PAGE_MOBILE));
const hasHomeNewsChanges = $derived(JSON.stringify(homeNewsWidget) !== originalHomeNewsWidget);
const hasMobileHomeNewsChanges = $derived(JSON.stringify(mobileHomeNewsWidget) !== originalMobileHomeNewsWidget);
const hasNewsPageChanges = $derived(JSON.stringify(newsPageWidget) !== originalNewsPageWidget);
const hasMobileNewsPageChanges = $derived(JSON.stringify(mobileNewsPageWidget) !== originalMobileNewsPageWidget);
let newsPageSaving = $state(false);

// ── Projects widget settings (desktop + mobile) ──────────────────────────────
let homeProjectsWidget = $state<ProjectsWidgetConfig>({ ...DEFAULT_PROJECTS_WIDGET_HOME });
let mobileHomeProjectsWidget = $state<ProjectsWidgetConfig>({ ...DEFAULT_PROJECTS_WIDGET_HOME_MOBILE });
let projectsPageWidget = $state<ProjectsWidgetConfig>({ ...DEFAULT_PROJECTS_WIDGET_PAGE });
let mobileProjectsPageWidget = $state<ProjectsWidgetConfig>({ ...DEFAULT_PROJECTS_WIDGET_PAGE_MOBILE });
let originalHomeProjectsWidget = $state(JSON.stringify(DEFAULT_PROJECTS_WIDGET_HOME));
let originalMobileHomeProjectsWidget = $state(JSON.stringify(DEFAULT_PROJECTS_WIDGET_HOME_MOBILE));
let originalProjectsPageWidget = $state(JSON.stringify(DEFAULT_PROJECTS_WIDGET_PAGE));
let originalMobileProjectsPageWidget = $state(JSON.stringify(DEFAULT_PROJECTS_WIDGET_PAGE_MOBILE));
const hasHomeProjectsChanges = $derived(JSON.stringify(homeProjectsWidget) !== originalHomeProjectsWidget);
const hasMobileHomeProjectsChanges = $derived(JSON.stringify(mobileHomeProjectsWidget) !== originalMobileHomeProjectsWidget);
const hasProjectsPageChanges = $derived(JSON.stringify(projectsPageWidget) !== originalProjectsPageWidget);
const hasMobileProjectsPageChanges = $derived(JSON.stringify(mobileProjectsPageWidget) !== originalMobileProjectsPageWidget);
let projectsPageSaving = $state(false);

// ── Gallery widget settings (desktop + mobile) ───────────────────────────────
let homeGalleryWidget = $state<GalleryWidgetConfig>({ ...DEFAULT_GALLERY_WIDGET_HOME });
let mobileHomeGalleryWidget = $state<GalleryWidgetConfig>({ ...DEFAULT_GALLERY_WIDGET_HOME_MOBILE });
let aboutGalleryWidget = $state<GalleryWidgetConfig>({ ...DEFAULT_GALLERY_WIDGET_ABOUT });
let mobileAboutGalleryWidget = $state<GalleryWidgetConfig>({ ...DEFAULT_GALLERY_WIDGET_ABOUT_MOBILE });
let originalHomeGalleryWidget = $state(JSON.stringify(DEFAULT_GALLERY_WIDGET_HOME));
let originalMobileHomeGalleryWidget = $state(JSON.stringify(DEFAULT_GALLERY_WIDGET_HOME_MOBILE));
let originalAboutGalleryWidget = $state(JSON.stringify(DEFAULT_GALLERY_WIDGET_ABOUT));
let originalMobileAboutGalleryWidget = $state(JSON.stringify(DEFAULT_GALLERY_WIDGET_ABOUT_MOBILE));
const hasHomeGalleryChanges = $derived(JSON.stringify(homeGalleryWidget) !== originalHomeGalleryWidget);
const hasMobileHomeGalleryChanges = $derived(JSON.stringify(mobileHomeGalleryWidget) !== originalMobileHomeGalleryWidget);
const hasAboutGalleryChanges = $derived(JSON.stringify(aboutGalleryWidget) !== originalAboutGalleryWidget);
const hasMobileAboutGalleryChanges = $derived(JSON.stringify(mobileAboutGalleryWidget) !== originalMobileAboutGalleryWidget);
let aboutPageSaving = $state(false);

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

let articlesList = $state<{ slug: string; path: string; titleUk: string; titleEn: string; updatedAt?: number }[]>([]);
let articlesLoading = $state(false);

function articleRoutePath(type: string | undefined, slug: string): string {
  if (type === 'page_project') return `/projects/${slug}`;
  if (type === 'page') return `/${slug}`;
  return `/news/${slug}`;
}

async function loadArticles() {
  if (articlesLoading || articlesList.length > 0) return;
  articlesLoading = true;
  try {
    const ref = collection(db, 'projects', VITE_PROJECT_ID, 'articles');
    // Межа обов'язкова (CLOUD-DATABASE-v8 § 7.1): цей перелік потрібен лише
    // щоб зібрати адреси для гарячих новин, а платиться за кожен документ.
    const snap = await getDocs(query(ref, fsOrderBy('createdAt', 'desc'), limit(ADMIN_LIST_LIMIT)));
    const firebaseArticles = snap.docs.map(d => {
      const slug = (d.data().slug as string) || d.id;
      const type = (d.data().type as string) || 'article';
      return {
        slug,
        path: articleRoutePath(type, slug),
        // Мітка правки — для гарячих новин: відредаговану новину треба показати
        // ще раз тим, хто вже бачив стару (див. `seenKey` в utils/hotNews).
        updatedAt: (d.data().updatedAt?.toMillis?.() as number) || undefined,
        titleUk: (d.data().translations?.uk?.title as string) || d.id,
        titleEn: (d.data().translations?.en?.title as string) || (d.data().translations?.uk?.title as string) || d.id,
      };
    });
    // Append static projects that aren't already in Firebase
    const firebaseSlugs = new Set(firebaseArticles.map(a => a.slug));
    const staticEntries = getStaticProjectEntries()
      .filter(e => !firebaseSlugs.has(e.slug));
    articlesList = [...firebaseArticles, ...staticEntries];
  } catch (e) {
    console.error('Failed to load articles:', e);
  } finally {
    articlesLoading = false;
  }
}

// ── Гарячі новини ────────────────────────────────────────────────────────────
let hotNews = $state<HotNewsConfig>({ ...DEFAULT_HOT_NEWS, items: [] });
let originalHotNews = $state(JSON.stringify({ ...DEFAULT_HOT_NEWS, items: [] }));
const hasHotNewsChanges = $derived(JSON.stringify(hotNews) !== originalHotNews);
let hotNewsSaving = $state(false);

/** Гарячою може бути лише новина: сторінки й проєкти не мають стрічки, у якій їх шукати. */
const newsArticles = $derived(articlesList.filter((a) => a.path.startsWith('/news/')));
/** Уже додані ховаємо зі списку вибору — двічі одна новина не має сенсу. */
const hotNewsCandidates = $derived(
  newsArticles.filter((a) => !hotNews.items.some((i) => i.id === a.slug))
);

function hotNewsTitle(id: string): string {
  return newsArticles.find((a) => a.slug === id)?.titleUk ?? id;
}

function addHotNewsItem(slug: string) {
  if (!slug || hotNews.items.some((i) => i.id === slug)) return;
  hotNews = {
    ...hotNews,
    items: [
      ...hotNews.items,
      {
        id: slug,
        enabled: true,
        // Типово найтихіший режим із можливих: показ один раз і не на власній
        // сторінці новини. Гучніші режими адміністратор вмикає свідомо.
        frequency: 'once',
        scope: 'exceptOwn',
        order: hotNews.items.length,
        // Мітка правки, щоб виправлену новину побачили й ті, хто бачив стару.
        ...(newsArticles.find((a) => a.slug === slug)?.updatedAt
          ? { version: newsArticles.find((a) => a.slug === slug)?.updatedAt }
          : {})
      }
    ]
  };
}

function patchHotNewsItem(id: string, patch: Partial<HotNewsItem>) {
  hotNews = {
    ...hotNews,
    items: hotNews.items.map((i) => (i.id === id ? { ...i, ...patch } : i))
  };
}

function removeHotNewsItem(id: string) {
  hotNews = {
    ...hotNews,
    items: hotNews.items.filter((i) => i.id !== id).map((i, idx) => ({ ...i, order: idx }))
  };
}

function moveHotNewsItem(index: number, delta: number) {
  const arr = hotNews.items.slice();
  const target = index + delta;
  if (target < 0 || target >= arr.length) return;
  [arr[index], arr[target]] = [arr[target], arr[index]];
  hotNews = { ...hotNews, items: arr.map((i, idx) => ({ ...i, order: idx })) };
}

/**
 * Скидання позначок «уже бачив» у ЦЬОМУ браузері.
 *
 * Без цього перевірити налаштування неможливо: після першого ж показу новина з
 * частотою «один раз» більше не з'явиться, і адміністратор бачитиме порожній
 * екран замість власних змін — і вирішить, що зламано.
 */
function forgetSeenHotNews() {
  storage.remove('hotNewsSeen');
  session.remove('hotNewsSeen');
  toast.success($t('admin.settings.hotNewsForgotten'));
}

const HOT_NEWS_CORNERS: HotNewsCorner[] = ['bottomRight', 'bottomLeft', 'topRight', 'topLeft'];
const HOT_NEWS_MODES: HotNewsDisplayMode[] = ['queue', 'stack2', 'all'];
const HOT_NEWS_FREQUENCIES: HotNewsFrequency[] = ['once', 'session', 'always'];
const HOT_NEWS_SCOPES: HotNewsScope[] = ['exceptOwn', 'all', 'home'];

/** Список статей потрібен саме тут — без нього вкладку нічим наповнити. */
$effect(() => {
  if (activeTab === 'hotNews') untrack(() => loadArticles());
});

// ── Load ──────────────────────────────────────────────────────────────────────
$effect(() => {
  if (!authService.loading) {
    if (!authService.isAuthenticated) {
      goto(resolve('/admin/login'));
    } else {
      const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'teatralo4ka';
      const canManageSettings = authService.profile?.isSuperAdmin === true || 
                                authService.profile?.projects?.[PROJECT_ID]?.permissions?.canManageSettings === true;
      
      if (!canManageSettings) {
        toast.error($t('admin.dashboard.noPermission'));
        goto(resolve('/admin'));
        return;
      }

      if (!settingsLoaded) {
        settingsLoaded = true;
        (async () => {
        try {
          await authService.user?.getIdToken(true);
          const [homeResult, headerResult, newsResult, projectsResult, aboutResult, hotNewsResult] = await Promise.all([
            getHomeSettings(),
            getHeaderSettings(),
            getNewsPageSettings(),
            getProjectsPageSettings(),
            getAboutPageSettings(),
            getHotNewsSettings(),
          ]);

          // ── Home settings ──
          if (homeResult?.blocks?.length) blocks = homeResult.blocks;
          if (homeResult?.mobileBlocks?.length) mobileBlocks = homeResult.mobileBlocks;
          if (homeResult?.newsWidget) homeNewsWidget = homeResult.newsWidget;
          if (homeResult?.mobileNewsWidget) mobileHomeNewsWidget = homeResult.mobileNewsWidget;
          if (homeResult?.projectsWidget) homeProjectsWidget = homeResult.projectsWidget;
          if (homeResult?.mobileProjectsWidget) mobileHomeProjectsWidget = homeResult.mobileProjectsWidget;
          if (homeResult?.galleryWidget) homeGalleryWidget = homeResult.galleryWidget;
          if (homeResult?.mobileGalleryWidget) mobileHomeGalleryWidget = homeResult.mobileGalleryWidget;
          originalBlocks = JSON.stringify(blocks);
          originalMobileBlocks = JSON.stringify(mobileBlocks);
          originalHomeNewsWidget = JSON.stringify(homeNewsWidget);
          originalMobileHomeNewsWidget = JSON.stringify(mobileHomeNewsWidget);
          originalHomeProjectsWidget = JSON.stringify(homeProjectsWidget);
          originalMobileHomeProjectsWidget = JSON.stringify(mobileHomeProjectsWidget);
          originalHomeGalleryWidget = JSON.stringify(homeGalleryWidget);
          originalMobileHomeGalleryWidget = JSON.stringify(mobileHomeGalleryWidget);

          // ── News page settings ──
          if (newsResult?.newsWidget) newsPageWidget = newsResult.newsWidget;
          if (newsResult?.mobileNewsWidget) mobileNewsPageWidget = newsResult.mobileNewsWidget;
          originalNewsPageWidget = JSON.stringify(newsPageWidget);
          originalMobileNewsPageWidget = JSON.stringify(mobileNewsPageWidget);

          // ── Гарячі новини ──
          if (hotNewsResult) hotNews = hotNewsResult;
          originalHotNews = JSON.stringify(hotNews);

          // ── Projects page settings ──
          if (projectsResult?.projectsWidget) projectsPageWidget = projectsResult.projectsWidget;
          if (projectsResult?.mobileProjectsWidget) mobileProjectsPageWidget = projectsResult.mobileProjectsWidget;
          originalProjectsPageWidget = JSON.stringify(projectsPageWidget);
          originalMobileProjectsPageWidget = JSON.stringify(mobileProjectsPageWidget);

          // ── About page settings ──
          if (aboutResult?.galleryWidget) aboutGalleryWidget = aboutResult.galleryWidget;
          if (aboutResult?.mobileGalleryWidget) mobileAboutGalleryWidget = aboutResult.mobileGalleryWidget;
          originalAboutGalleryWidget = JSON.stringify(aboutGalleryWidget);
          originalMobileAboutGalleryWidget = JSON.stringify(mobileAboutGalleryWidget);

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
        } catch (e: unknown) {
          console.error('Failed to load settings:', e);
          toast.error(e instanceof Error ? e.message : $t('news.errorLoading'));
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
      projectsWidget: homeProjectsWidget,
      mobileProjectsWidget: mobileHomeProjectsWidget,
      galleryWidget: homeGalleryWidget,
      mobileGalleryWidget: mobileHomeGalleryWidget,
    });
    originalBlocks = JSON.stringify(blocks);
    originalMobileBlocks = JSON.stringify(mobileBlocks);
    originalHomeNewsWidget = JSON.stringify(homeNewsWidget);
    originalMobileHomeNewsWidget = JSON.stringify(mobileHomeNewsWidget);
    originalHomeProjectsWidget = JSON.stringify(homeProjectsWidget);
    originalMobileHomeProjectsWidget = JSON.stringify(mobileHomeProjectsWidget);
    originalHomeGalleryWidget = JSON.stringify(homeGalleryWidget);
    originalMobileHomeGalleryWidget = JSON.stringify(mobileHomeGalleryWidget);
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: unknown) {
    logError(e);
    toast.error(e instanceof Error ? e.message : $t('admin.editor.errorSave'));
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
  } catch (e: unknown) {
    logError(e);
    toast.error(e instanceof Error ? e.message : $t('admin.editor.errorSave'));
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
  } catch (e: unknown) {
    logError(e);
    toast.error(e instanceof Error ? e.message : $t('admin.editor.errorSave'));
  } finally {
    newsPageSaving = false;
  }
}

async function handleHotNewsSubmit() {
  hotNewsSaving = true;
  try {
    await updateHotNewsSettings(hotNews);
    originalHotNews = JSON.stringify(hotNews);
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: unknown) {
    logError(e);
    toast.error(e instanceof Error ? e.message : $t('admin.editor.errorSave'));
  } finally {
    hotNewsSaving = false;
  }
}

async function handleProjectsPageSubmit() {
  projectsPageSaving = true;
  try {
    await updateProjectsPageSettings({
      projectsWidget: projectsPageWidget,
      mobileProjectsWidget: mobileProjectsPageWidget,
    });
    originalProjectsPageWidget = JSON.stringify(projectsPageWidget);
    originalMobileProjectsPageWidget = JSON.stringify(mobileProjectsPageWidget);
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: unknown) {
    logError(e);
    toast.error(e instanceof Error ? e.message : $t('admin.editor.errorSave'));
  } finally {
    projectsPageSaving = false;
  }
}

async function handleAboutPageSubmit() {
  aboutPageSaving = true;
  try {
    await updateAboutPageSettings({
      galleryWidget: aboutGalleryWidget,
      mobileGalleryWidget: mobileAboutGalleryWidget,
    });
    originalAboutGalleryWidget = JSON.stringify(aboutGalleryWidget);
    originalMobileAboutGalleryWidget = JSON.stringify(mobileAboutGalleryWidget);
    toast.success($t('admin.dashboard.saveSuccess'));
  } catch (e: unknown) {
    logError(e);
    toast.error(e instanceof Error ? e.message : $t('admin.editor.errorSave'));
  } finally {
    aboutPageSaving = false;
  }
}
</script>

<!-- ── Snippets ─────────────────────────────────────────────────────────────── -->

{#snippet subtabBar(current: SubTabId, onChange: (v: SubTabId) => void)}
<nav class="subtab-bar" data-testid="admin-settings-sub-tabs">
  <button type="button" class="subtab-btn" class:active={current === 'desktop'} onclick={() => onChange('desktop')} data-testid="admin-settings-tab-desktop">
    {$t('admin.settings.subtabDesktop')}
  </button>
  <button type="button" class="subtab-btn" class:active={current === 'mobile'} onclick={() => onChange('mobile')} data-testid="admin-settings-tab-mobile">
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

{#snippet projectsSectionTabBar(current: ProjectsSectionTabId, onChange: (v: ProjectsSectionTabId) => void)}
<nav class="subtab-bar" style="margin-bottom: 2rem;">
  <button type="button" class="subtab-btn" class:active={current === 'homeWidget'} onclick={() => onChange('homeWidget')}>
    {$t('admin.settings.projectsHomepageSubSection')}
  </button>
  <button type="button" class="subtab-btn" class:active={current === 'pageWidget'} onclick={() => onChange('pageWidget')}>
    {$t('admin.settings.projectsPageSubSection')}
  </button>
</nav>
{/snippet}

{#snippet blocksCard(blockList: BlockConfig[], onMoveUp: (i: number) => void, onMoveDown: (i: number) => void, onToggle: (i: number) => void, onReset: () => void, hasChanges: boolean, isSaving: boolean, onSave: () => void)}
<div class="settings-card {hasChanges ? 'has-changes' : ''}" data-testid="admin-settings-card">
<h2 class="settings-card__title" data-testid="admin-settings-blocks-title">{$t('admin.settings.blocksTitle')}</h2>
<p class="settings-card__desc" data-testid="admin-settings-blocks-desc-text">{$t('admin.settings.blocksDesc')}</p>

<ul class="blocks-list" data-testid="admin-settings-blocks-list">
{#each blockList as block, i (block.id)}
<li class="block-item" data-testid="admin-settings-block-{block.id}-row">
<span class="block-item__order" data-testid="admin-settings-block-{block.id}-order-value">{i + 1}</span>
<span class="block-item__name" data-testid="admin-settings-block-{block.id}-name-text">
{$t(`admin.settings.blocks.${block.id}`)}
</span>
<div class="block-item__controls">
<button type="button" class="btn-icon" disabled={i === 0} onclick={() => onMoveUp(i)} aria-label={$t('common.moveUp')} data-testid="admin-settings-block-{block.id}-up-btn"><ArrowUp size={15} /></button>
<button type="button" class="btn-icon" disabled={i === blockList.length - 1} onclick={() => onMoveDown(i)} aria-label={$t('common.moveDown')} data-testid="admin-settings-block-{block.id}-down-btn"><ArrowDown size={15} /></button>
<label class="switch-label" data-testid="admin-settings-block-{block.id}-visible-label">
<input type="checkbox" class="switch-input" checked={block.visible} onchange={() => onToggle(i)} data-testid="admin-settings-block-{block.id}-visible-toggle" />
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
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={onSave} disabled={isSaving || !hasChanges} class="btn-save-small {hasChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-submit-btn">
    {#if isSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
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

<!-- Autoplay interval (carousel only) -->
{#if cfg.autoplay}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsAutoplayInterval')}</span>
<div class="number-input-group">
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, autoplayInterval: Math.max(1, (cfg.autoplayInterval || 7) - 1) })} disabled={(cfg.autoplayInterval || 7) <= 1} title={$t('common.decrease')}>−</button>
  <input
    type="number"
    class="form-select number-input"
    min="1"
    max="60"
    value={cfg.autoplayInterval || 7}
    onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, autoplayInterval: Math.max(1, Math.min(60, parseInt(e.currentTarget.value) || 7)) })}
  />
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, autoplayInterval: Math.min(60, (cfg.autoplayInterval || 7) + 1) })} disabled={(cfg.autoplayInterval || 7) >= 60} title={$t('common.increase')}>+</button>
  <span class="input-hint">{$t('admin.settings.autoplayIntervalUnit')}</span>
</div>
</li>
{/if}

<!-- Pinned article (carousel only) -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsPinnedArticle')}</span>
<div class="pinned-select-wrapper">
  {#if articlesList.length === 0 && !articlesLoading}
    <button type="button" class="mode-btn" style="font-size: 0.82rem;" onclick={loadArticles}>
      {$t('admin.menuEditor.loadingArticles')}
    </button>
  {:else}
    <Select
      style="max-width: 280px; min-width: 150px;"
      value={cfg.pinnedArticleId}
      options={[
        { value: '', label: $t('admin.settings.newsPinnedNone') },
        ...articlesList.map((a) => ({ value: a.slug, label: a.titleUk }))
      ]}
      onchange={(v) => onChange({ ...cfg, pinnedArticleId: v })}
      testId="admin-settings-news-pinned-select"
    />
  {/if}
</div>
</li>
{/if}

<!-- Max items (grid view) -->
{#if cfg.defaultView !== 'carousel'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsMaxItemsGrid')}</span>
<div class="limit-toggle-group">
  <label class="switch-label">
    <input type="checkbox" class="switch-input" checked={cfg.maxItemsGrid > 0} onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsGrid: e.currentTarget.checked ? 6 : 0 })} />
    <span class="switch-slider"></span>
  </label>
  {#if cfg.maxItemsGrid > 0}
  <div class="number-input-group">
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.max(1, cfg.maxItemsGrid - 1) })} disabled={cfg.maxItemsGrid <= 1} title={$t('common.decrease')}>−</button>
    <input
      type="number"
      class="form-select number-input"
      min="1"
      max="100"
      value={cfg.maxItemsGrid}
      onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsGrid: Math.max(1, parseInt(e.currentTarget.value) || 1) })}
    />
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.min(100, cfg.maxItemsGrid + 1) })} disabled={cfg.maxItemsGrid >= 100} title={$t('common.increase')}>+</button>
  </div>
  {:else}
  <span class="input-hint">
    {$t('admin.settings.newsMaxItemsUnlimited')}
  </span>
  {/if}
</div>
</li>

<!-- Max items (list view) -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.newsMaxItemsList')}</span>
<div class="limit-toggle-group">
  <label class="switch-label">
    <input type="checkbox" class="switch-input" checked={cfg.maxItemsList > 0} onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsList: e.currentTarget.checked ? 6 : 0 })} />
    <span class="switch-slider"></span>
  </label>
  {#if cfg.maxItemsList > 0}
  <div class="number-input-group">
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsList: Math.max(1, cfg.maxItemsList - 1) })} disabled={cfg.maxItemsList <= 1} title={$t('common.decrease')}>−</button>
    <input
      type="number"
      class="form-select number-input"
      min="1"
      max="100"
      value={cfg.maxItemsList}
      onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsList: Math.max(1, parseInt(e.currentTarget.value) || 1) })}
    />
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsList: Math.min(100, cfg.maxItemsList + 1) })} disabled={cfg.maxItemsList >= 100} title={$t('common.increase')}>+</button>
  </div>
  {:else}
  <span class="input-hint">
    {$t('admin.settings.newsMaxItemsUnlimited')}
  </span>
  {/if}
</div>
</li>
{/if}
</ul>

<div class="save-footer">
  <button type="button" class="me-reset-btn" onclick={onReset} disabled={isSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div class="save-footer__actions">
  {#if hasChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={onSave} disabled={isSaving || !hasChanges} class="btn-save-small {hasChanges ? 'is-active' : ''}" data-testid="admin-settings-news-submit-btn">
    {#if isSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>
{/snippet}

{#snippet projectsWidgetCard(titleKey: string, descKey: string, cfg: ProjectsWidgetConfig, onChange: (v: ProjectsWidgetConfig) => void, onReset: () => void, hasChanges: boolean, isSaving: boolean, onSave: () => void)}
<div class="settings-card {hasChanges ? 'has-changes' : ''}" data-testid="admin-settings-projects-widget-card">
<h2 class="settings-card__title">{$t(titleKey)}</h2>
<p class="settings-card__desc">{$t(descKey)}</p>

<ul class="blocks-list" style="margin-bottom: 1.5rem;">
<!-- Default view -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.projectsDefaultView')}</span>
<div class="mode-toggle-group">
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'carousel'} onclick={() => onChange({ ...cfg, defaultView: 'carousel' })}>
    {$t('admin.settings.projectsViewCarousel')}
  </button>
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'grid'} onclick={() => onChange({ ...cfg, defaultView: 'grid' })}>
    {$t('admin.settings.projectsViewGrid')}
  </button>
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'list'} onclick={() => onChange({ ...cfg, defaultView: 'list' })}>
    {$t('admin.settings.projectsViewList')}
  </button>
</div>
</li>

<!-- Show view switcher -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.projectsShowViewSwitcher')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cfg.showViewSwitcher} onchange={() => onChange({ ...cfg, showViewSwitcher: !cfg.showViewSwitcher })} />
<span class="switch-slider"></span>
</label>
</li>

<!-- Autoplay (carousel only) -->
{#if cfg.defaultView === 'carousel'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.projectsAutoplay')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cfg.autoplay} onchange={() => onChange({ ...cfg, autoplay: !cfg.autoplay })} />
<span class="switch-slider"></span>
</label>
</li>

<!-- Autoplay interval (carousel only) -->
{#if cfg.autoplay}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.projectsAutoplayInterval')}</span>
<div class="number-input-group">
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, autoplayInterval: Math.max(1, (cfg.autoplayInterval || 7) - 1) })} disabled={(cfg.autoplayInterval || 7) <= 1} title={$t('common.decrease')}>−</button>
  <input
    type="number"
    class="form-select number-input"
    min="1"
    max="60"
    value={cfg.autoplayInterval || 7}
    onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, autoplayInterval: Math.max(1, Math.min(60, parseInt(e.currentTarget.value) || 7)) })}
  />
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, autoplayInterval: Math.min(60, (cfg.autoplayInterval || 7) + 1) })} disabled={(cfg.autoplayInterval || 7) >= 60} title={$t('common.increase')}>+</button>
  <span class="input-hint">{$t('admin.settings.autoplayIntervalUnit')}</span>
</div>
</li>
{/if}

<!-- Pinned project (carousel only) -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.projectsPinnedProject')}</span>
<div class="pinned-select-wrapper">
  {#if articlesList.length === 0 && !articlesLoading}
    <button type="button" class="mode-btn" style="font-size: 0.82rem;" onclick={loadArticles}>
      {$t('admin.menuEditor.loadingArticles')}
    </button>
  {:else}
    <Select
      style="max-width: 280px; min-width: 150px;"
      value={cfg.pinnedProjectId}
      options={[
        { value: '', label: $t('admin.settings.projectsPinnedNone') },
        ...articlesList.map((a) => ({ value: a.slug, label: a.titleUk }))
      ]}
      onchange={(v) => onChange({ ...cfg, pinnedProjectId: v })}
      testId="admin-settings-projects-pinned-select"
    />
  {/if}
</div>
</li>
{/if}

<!-- Max items (grid view) -->
{#if cfg.defaultView !== 'carousel'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.projectsMaxItemsGrid')}</span>
<div class="limit-toggle-group">
  <label class="switch-label">
    <input type="checkbox" class="switch-input" checked={cfg.maxItemsGrid > 0} onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsGrid: e.currentTarget.checked ? 6 : 0 })} />
    <span class="switch-slider"></span>
  </label>
  {#if cfg.maxItemsGrid > 0}
  <div class="number-input-group">
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.max(1, cfg.maxItemsGrid - 1) })} disabled={cfg.maxItemsGrid <= 1} title={$t('common.decrease')}>−</button>
    <input
      type="number"
      class="form-select number-input"
      min="1"
      max="100"
      value={cfg.maxItemsGrid}
      onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsGrid: Math.max(1, parseInt(e.currentTarget.value) || 1) })}
    />
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.min(100, cfg.maxItemsGrid + 1) })} disabled={cfg.maxItemsGrid >= 100} title={$t('common.increase')}>+</button>
  </div>
  {:else}
  <span class="input-hint">
    {$t('admin.settings.projectsMaxItemsUnlimited')}
  </span>
  {/if}
</div>
</li>

<!-- Max items (list view) -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.projectsMaxItemsList')}</span>
<div class="limit-toggle-group">
  <label class="switch-label">
    <input type="checkbox" class="switch-input" checked={cfg.maxItemsList > 0} onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsList: e.currentTarget.checked ? 6 : 0 })} />
    <span class="switch-slider"></span>
  </label>
  {#if cfg.maxItemsList > 0}
  <div class="number-input-group">
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsList: Math.max(1, cfg.maxItemsList - 1) })} disabled={cfg.maxItemsList <= 1} title={$t('common.decrease')}>−</button>
    <input
      type="number"
      class="form-select number-input"
      min="1"
      max="100"
      value={cfg.maxItemsList}
      onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsList: Math.max(1, parseInt(e.currentTarget.value) || 1) })}
    />
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsList: Math.min(100, cfg.maxItemsList + 1) })} disabled={cfg.maxItemsList >= 100} title={$t('common.increase')}>+</button>
  </div>
  {:else}
  <span class="input-hint">
    {$t('admin.settings.projectsMaxItemsUnlimited')}
  </span>
  {/if}
</div>
</li>
{/if}
</ul>

<div class="save-footer">
  <button type="button" class="me-reset-btn" onclick={onReset} disabled={isSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div class="save-footer__actions">
  {#if hasChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={onSave} disabled={isSaving || !hasChanges} class="btn-save-small {hasChanges ? 'is-active' : ''}" data-testid="admin-settings-projects-submit-btn">
    {#if isSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>
{/snippet}

<!-- ── Gallery snippets ──────────────────────────────────────────────────── -->

{#snippet gallerySectionTabBar(current: GallerySectionTabId, onChange: (v: GallerySectionTabId) => void)}
<nav class="subtab-bar" style="margin-bottom: 2rem;">
  <button type="button" class="subtab-btn" class:active={current === 'homeWidget'} onclick={() => onChange('homeWidget')}>
    {$t('admin.settings.galleryHomepageSubSection')}
  </button>
  <button type="button" class="subtab-btn" class:active={current === 'aboutWidget'} onclick={() => onChange('aboutWidget')}>
    {$t('admin.settings.galleryAboutSubSection')}
  </button>
</nav>
{/snippet}

{#snippet galleryWidgetCard(titleKey: string, descKey: string, cfg: GalleryWidgetConfig, onChange: (v: GalleryWidgetConfig) => void, onReset: () => void, hasChanges: boolean, isSaving: boolean, onSave: () => void)}
<div class="settings-card {hasChanges ? 'has-changes' : ''}" data-testid="admin-settings-gallery-widget-card">
<h2 class="settings-card__title">{$t(titleKey)}</h2>
<p class="settings-card__desc">{$t(descKey)}</p>

<ul class="blocks-list" style="margin-bottom: 1.5rem;">
<!-- Default view -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryDefaultView')}</span>
<div class="mode-toggle-group">
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'carousel'} onclick={() => onChange({ ...cfg, defaultView: 'carousel' })}>
    {$t('admin.settings.galleryViewCarousel')}
  </button>
  <button type="button" class="mode-btn" class:active={cfg.defaultView === 'grid'} onclick={() => onChange({ ...cfg, defaultView: 'grid' })}>
    {$t('admin.settings.galleryViewGrid')}
  </button>
</div>
</li>

<!-- Show view switcher -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryShowViewSwitcher')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cfg.showViewSwitcher} onchange={() => onChange({ ...cfg, showViewSwitcher: !cfg.showViewSwitcher })} />
<span class="switch-slider"></span>
</label>
</li>

<!-- Show captions -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryShowCaptions')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cfg.showCaptions} onchange={() => onChange({ ...cfg, showCaptions: !cfg.showCaptions })} />
<span class="switch-slider"></span>
</label>
</li>

<!-- Aspect ratio (carousel only) -->
{#if cfg.defaultView === 'carousel'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryAspectRatio')}</span>
<Select
  style="margin-left: auto; min-width: 180px;"
  value={cfg.aspectRatio || '4:3'}
  options={[
    { value: '4:3', label: $t('admin.settings.galleryAspectRatio4x3') },
    { value: '16:9', label: $t('admin.settings.galleryAspectRatio16x9') },
    { value: '3:4', label: $t('admin.settings.galleryAspectRatio3x4') },
    { value: '9:16', label: $t('admin.settings.galleryAspectRatio9x16') }
  ]}
  onchange={(v) => onChange({ ...cfg, aspectRatio: v as GalleryAspectRatio })}
  testId="admin-settings-gallery-aspect-select"
/>
</li>
{/if}

<!-- Autoplay (carousel only) -->
{#if cfg.defaultView === 'carousel'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryAutoplay')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={cfg.autoplay} onchange={() => onChange({ ...cfg, autoplay: !cfg.autoplay })} />
<span class="switch-slider"></span>
</label>
</li>

<!-- Autoplay interval -->
{#if cfg.autoplay}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryAutoplayInterval')}</span>
<div class="number-input-group">
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, autoplayInterval: Math.max(1, (cfg.autoplayInterval || 5) - 1) })} disabled={(cfg.autoplayInterval || 5) <= 1} title={$t('common.decrease')}>−</button>
  <input
    type="number"
    class="form-select number-input"
    min="1"
    max="60"
    value={cfg.autoplayInterval || 5}
    onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, autoplayInterval: Math.max(1, Math.min(60, parseInt(e.currentTarget.value) || 5)) })}
  />
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, autoplayInterval: Math.min(60, (cfg.autoplayInterval || 5) + 1) })} disabled={(cfg.autoplayInterval || 5) >= 60} title={$t('common.increase')}>+</button>
  <span class="input-hint">{$t('admin.settings.autoplayIntervalUnit')}</span>
</div>
</li>
{/if}

<!-- Pinned photo index (carousel only) -->
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryPinnedPhoto')}</span>
<div class="number-input-group">
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, pinnedIndex: Math.max(-1, (cfg.pinnedIndex ?? -1) - 1) })} disabled={(cfg.pinnedIndex ?? -1) <= -1} title={$t('common.decrease')}>−</button>
  <input
    type="number"
    class="form-select number-input"
    min="-1"
    max="99"
    value={cfg.pinnedIndex ?? -1}
    onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, pinnedIndex: Math.max(-1, Math.min(99, parseInt(e.currentTarget.value) || -1)) })}
  />
  <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, pinnedIndex: Math.min(99, (cfg.pinnedIndex ?? -1) + 1) })} disabled={(cfg.pinnedIndex ?? -1) >= 99} title={$t('common.increase')}>+</button>
  <span class="input-hint">
    {(cfg.pinnedIndex ?? -1) < 0 ? $t('admin.settings.galleryPinnedNone') : ''}
  </span>
</div>
</li>
{/if}

<!-- Max items (grid view) -->
{#if cfg.defaultView === 'grid'}
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.galleryMaxItemsGrid')}</span>
<div class="limit-toggle-group">
  <label class="switch-label">
    <input type="checkbox" class="switch-input" checked={cfg.maxItemsGrid > 0} onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsGrid: e.currentTarget.checked ? 6 : 0 })} />
    <span class="switch-slider"></span>
  </label>
  {#if cfg.maxItemsGrid > 0}
  <div class="number-input-group">
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.max(1, cfg.maxItemsGrid - 1) })} disabled={cfg.maxItemsGrid <= 1} title={$t('common.decrease')}>−</button>
    <input
      type="number"
      class="form-select number-input"
      min="1"
      max="100"
      value={cfg.maxItemsGrid}
      onchange={(e: Event & { currentTarget: HTMLInputElement }) => onChange({ ...cfg, maxItemsGrid: Math.max(1, parseInt(e.currentTarget.value) || 1) })}
    />
    <button type="button" class="number-btn" onclick={() => onChange({ ...cfg, maxItemsGrid: Math.min(100, cfg.maxItemsGrid + 1) })} disabled={cfg.maxItemsGrid >= 100} title={$t('common.increase')}>+</button>
  </div>
  {:else}
  <span class="input-hint">
    {$t('admin.settings.galleryMaxItemsUnlimited')}
  </span>
  {/if}
</div>
</li>
{/if}
</ul>

<div class="save-footer">
  <button type="button" class="me-reset-btn" onclick={onReset} disabled={isSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div class="save-footer__actions">
  {#if hasChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={onSave} disabled={isSaving || !hasChanges} class="btn-save-small {hasChanges ? 'is-active' : ''}" data-testid="admin-settings-gallery-submit-btn">
    {#if isSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>
{/snippet}

<!-- ── Page template ────────────────────────────────────────────────────────── -->

<section class="admin-settings container" style="padding: 140px 24px 80px;" data-testid="admin-settings-section">
<div class="sh-header">
  <div class="sh-title-group">
    <a href={resolve('/admin')} class="sh-back-btn" data-testid="admin-settings-back-btn" title={$t('admin.editor.backToList')}>
      <ArrowLeft size={20} aria-hidden="true" />
    </a>
    <h1 class="sh-title">{$t('admin.dashboard.settingsTitle')}</h1>
  </div>
</div>

{#if loading}
<p data-testid="admin-settings-loading-status">{$t('admin.dashboard.loading')}</p>
{:else}

<!-- ══ Tab bar ══════════════════════════════════════════════════════════════ -->
<nav class="tab-bar" data-testid="admin-settings-tabs">
  {#each TABS as tab (tab.id)}
    <button
      type="button"
      class="tab-btn" class:active={activeTab === tab.id}
      onclick={() => selectTab(tab.id)}
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
      () => { mobileHomeNewsWidget = { ...DEFAULT_NEWS_WIDGET_HOME_MOBILE }; },
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

<!-- ══ Tab: Projects (homepage + projects page widgets) ═══════════════════ -->
<!-- ══ Tab: Гарячі новини ══ -->
{:else if activeTab === 'hotNews'}

<div class="settings-card {hasHotNewsChanges ? 'has-changes' : ''}" data-testid="admin-settings-hotnews-card">
<h2 class="settings-card__title">{$t('admin.settings.hotNewsTitle')}</h2>
<p class="settings-card__desc">{$t('admin.settings.hotNewsDesc')}</p>

<ul class="blocks-list" style="margin-bottom: 1.5rem;">
<li class="block-item">
<span class="block-item__name">{$t('admin.settings.hotNewsEnabled')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={hotNews.enabled} onchange={() => hotNews = { ...hotNews, enabled: !hotNews.enabled }} data-testid="admin-settings-hotnews-enabled-checkbox" />
<span class="switch-slider"></span>
</label>
</li>

<li class="block-item" class:opacity-muted={!hotNews.enabled}>
<span class="block-item__name">{$t('admin.settings.hotNewsPosition')}</span>
<div style="margin-left: auto;">
  <Select
    style="max-width: 280px; min-width: 150px;"
    value={hotNews.position}
    options={HOT_NEWS_CORNERS.map((c) => ({ value: c, label: $t(`admin.settings.hotNewsPos_${c}`) }))}
    onchange={(v) => hotNews = { ...hotNews, position: v as HotNewsCorner }}
    ariaLabel={$t('admin.settings.hotNewsPosition')}
    testId="admin-settings-hotnews-position-select"
  />
</div>
</li>

<li class="block-item" class:opacity-muted={!hotNews.enabled}>
<span class="block-item__name">{$t('admin.settings.hotNewsDisplayMode')}</span>
<div class="mode-toggle-group">
  {#each HOT_NEWS_MODES as mode (mode)}
    <button type="button" class="mode-btn" class:active={hotNews.displayMode === mode} disabled={!hotNews.enabled} onclick={() => hotNews = { ...hotNews, displayMode: mode }}>
      {$t(`admin.settings.hotNewsMode_${mode}`)}
    </button>
  {/each}
</div>
</li>

<li class="block-item" class:opacity-muted={!hotNews.enabled}>
<span class="block-item__name">{$t('admin.settings.hotNewsDuration')}</span>
<div class="number-input-group">
  <button type="button" class="number-btn" onclick={() => hotNews = { ...hotNews, durationMs: Math.max(5000, hotNews.durationMs - 5000) }} disabled={!hotNews.enabled || hotNews.durationMs <= 5000} title={$t('common.decrease')}>&minus;</button>
  <input
    type="number"
    class="form-select number-input"
    min="5"
    max="300"
    step="5"
    disabled={!hotNews.enabled}
    value={Math.round(hotNews.durationMs / 1000)}
    onchange={(e: Event & { currentTarget: HTMLInputElement }) => hotNews = { ...hotNews, durationMs: Math.min(300, Math.max(5, parseInt(e.currentTarget.value) || 30)) * 1000 }}
  />
  <button type="button" class="number-btn" onclick={() => hotNews = { ...hotNews, durationMs: Math.min(300000, hotNews.durationMs + 5000) }} disabled={!hotNews.enabled || hotNews.durationMs >= 300000} title={$t('common.increase')}>+</button>
  <span class="input-hint">{$t('admin.settings.hotNewsSeconds')}</span>
</div>
</li>

<li class="block-item" class:opacity-muted={!hotNews.enabled}>
<span class="block-item__name">{$t('admin.settings.hotNewsDelay')}</span>
<div class="number-input-group">
  <button type="button" class="number-btn" onclick={() => hotNews = { ...hotNews, delayMs: Math.max(0, hotNews.delayMs - 500) }} disabled={!hotNews.enabled || hotNews.delayMs <= 0} title={$t('common.decrease')}>&minus;</button>
  <input
    type="number"
    class="form-select number-input"
    min="0"
    max="10"
    step="0.5"
    disabled={!hotNews.enabled}
    value={hotNews.delayMs / 1000}
    onchange={(e: Event & { currentTarget: HTMLInputElement }) => hotNews = { ...hotNews, delayMs: Math.min(10, Math.max(0, parseFloat(e.currentTarget.value) || 0)) * 1000 }}
  />
  <button type="button" class="number-btn" onclick={() => hotNews = { ...hotNews, delayMs: Math.min(10000, hotNews.delayMs + 500) }} disabled={!hotNews.enabled || hotNews.delayMs >= 10000} title={$t('common.increase')}>+</button>
  <span class="input-hint">{$t('admin.settings.hotNewsSeconds')}</span>
</div>
</li>
</ul>

<h3 class="settings-card__title" style="font-size: 1rem;">{$t('admin.settings.hotNewsList')}</h3>
<p class="settings-card__desc">{$t('admin.settings.hotNewsListDesc')}</p>

{#if hotNews.items.length === 0}
  <p class="input-hint" style="margin-bottom: 1rem;" data-testid="admin-settings-hotnews-empty-text">{$t('admin.settings.hotNewsEmpty')}</p>
{:else}
<ul class="blocks-list" style="margin-bottom: 1.5rem;">
{#each hotNews.items as hotItem, index (hotItem.id)}
<li class="block-item" class:opacity-muted={!hotNews.enabled}>
  <div class="hotnews-row">
    <div class="hotnews-row__head">
      <label class="switch-label">
        <input type="checkbox" class="switch-input" checked={hotItem.enabled} onchange={() => patchHotNewsItem(hotItem.id, { enabled: !hotItem.enabled })} />
        <span class="switch-slider"></span>
      </label>
      <span class="block-item__name" data-testid="admin-settings-hotnews-item-title-{index}">{hotNewsTitle(hotItem.id)}</span>
      <div class="hotnews-row__actions">
        <button type="button" class="number-btn" onclick={() => moveHotNewsItem(index, -1)} disabled={index === 0} title={$t('admin.settings.hotNewsMoveUp')} aria-label={$t('admin.settings.hotNewsMoveUp')}><ArrowUp size={14} /></button>
        <button type="button" class="number-btn" onclick={() => moveHotNewsItem(index, 1)} disabled={index === hotNews.items.length - 1} title={$t('admin.settings.hotNewsMoveDown')} aria-label={$t('admin.settings.hotNewsMoveDown')}><ArrowDown size={14} /></button>
        <button type="button" class="number-btn" onclick={() => removeHotNewsItem(hotItem.id)} title={$t('admin.settings.hotNewsRemove')} aria-label={$t('admin.settings.hotNewsRemove')} data-testid="admin-settings-hotnews-remove-btn-{index}">&times;</button>
      </div>
    </div>

    <div class="hotnews-row__field">
      <span class="input-hint">{$t('admin.settings.hotNewsFrequency')}</span>
      <div class="mode-toggle-group">
        {#each HOT_NEWS_FREQUENCIES as freq (freq)}
          <button type="button" class="mode-btn" class:active={hotItem.frequency === freq} disabled={!hotNews.enabled} onclick={() => patchHotNewsItem(hotItem.id, { frequency: freq })}>
            {$t(`admin.settings.hotNewsFreq_${freq}`)}
          </button>
        {/each}
      </div>
    </div>

    <div class="hotnews-row__field">
      <span class="input-hint">{$t('admin.settings.hotNewsScope')}</span>
      <Select
        style="max-width: 280px; min-width: 150px;"
        value={hotItem.scope}
        options={HOT_NEWS_SCOPES.map((sc) => ({ value: sc, label: $t(`admin.settings.hotNewsScope_${sc}`) }))}
        onchange={(v) => patchHotNewsItem(hotItem.id, { scope: v as HotNewsScope })}
        ariaLabel={$t('admin.settings.hotNewsScope')}
        testId="admin-settings-hotnews-scope-select-{index}"
      />
    </div>
  </div>
</li>
{/each}
</ul>
{/if}

<div class="block-item">
<span class="block-item__name">{$t('admin.settings.hotNewsAdd')}</span>
<div class="pinned-select-wrapper">
  {#if articlesLoading}
    <span class="input-hint">{$t('admin.menuEditor.loadingArticles')}</span>
  {:else if hotNewsCandidates.length === 0}
    <span class="input-hint">{$t('admin.settings.hotNewsNoCandidates')}</span>
  {:else}
    <Select
      style="max-width: 280px; min-width: 150px;"
      value=""
      options={[
        { value: '', label: $t('admin.settings.hotNewsAddPlaceholder') },
        ...hotNewsCandidates.map((a) => ({ value: a.slug, label: a.titleUk }))
      ]}
      onchange={(v) => addHotNewsItem(v)}
      ariaLabel={$t('admin.settings.hotNewsAdd')}
      testId="admin-settings-hotnews-add-select"
    />
  {/if}
</div>
</div>

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={forgetSeenHotNews} data-testid="admin-settings-hotnews-forget-btn">
    {$t('admin.settings.hotNewsForget')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasHotNewsChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={handleHotNewsSubmit} disabled={hotNewsSaving || !hasHotNewsChanges} class="btn-save-small {hasHotNewsChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-hotnews-submit-btn">
    {#if hotNewsSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
  </button>
  </div>
</div>
</div>

{:else if activeTab === 'projects'}

{@render projectsSectionTabBar(projectsSectionTab, (v) => projectsSectionTab = v)}

{#if projectsSectionTab === 'homeWidget'}
  {@render subtabBar(projectsHomeSubTab, (v) => projectsHomeSubTab = v)}

  {#if projectsHomeSubTab === 'desktop'}
    {@render projectsWidgetCard(
      'admin.settings.projectsHomepageTitle',
      'admin.settings.projectsHomepageDesc',
      homeProjectsWidget,
      (v) => { homeProjectsWidget = v; },
      () => { homeProjectsWidget = { ...DEFAULT_PROJECTS_WIDGET_HOME }; },
      hasHomeProjectsChanges,
      saving,
      handleSubmit
    )}
  {:else}
    {@render projectsWidgetCard(
      'admin.settings.projectsHomepageTitle',
      'admin.settings.projectsHomepageDesc',
      mobileHomeProjectsWidget,
      (v) => { mobileHomeProjectsWidget = v; },
      () => { mobileHomeProjectsWidget = { ...DEFAULT_PROJECTS_WIDGET_HOME_MOBILE }; },
      hasMobileHomeProjectsChanges,
      saving,
      handleSubmit
    )}
  {/if}
{:else}
  {@render subtabBar(projectsPageSubTab, (v) => projectsPageSubTab = v)}

  {#if projectsPageSubTab === 'desktop'}
    {@render projectsWidgetCard(
      'admin.settings.projectsPageTitle',
      'admin.settings.projectsPageDesc',
      projectsPageWidget,
      (v) => { projectsPageWidget = v; },
      () => { projectsPageWidget = { ...DEFAULT_PROJECTS_WIDGET_PAGE }; },
      hasProjectsPageChanges,
      projectsPageSaving,
      handleProjectsPageSubmit
    )}
  {:else}
    {@render projectsWidgetCard(
      'admin.settings.projectsPageTitle',
      'admin.settings.projectsPageDesc',
      mobileProjectsPageWidget,
      (v) => { mobileProjectsPageWidget = v; },
      () => { mobileProjectsPageWidget = { ...DEFAULT_PROJECTS_WIDGET_PAGE_MOBILE }; },
      hasMobileProjectsPageChanges,
      projectsPageSaving,
      handleProjectsPageSubmit
    )}
  {/if}
{/if}

<!-- ══ Tab: Gallery ════════════════════════════════════════════════════════ -->
{:else if activeTab === 'gallery'}

{@render gallerySectionTabBar(gallerySectionTab, (v) => gallerySectionTab = v)}

{#if gallerySectionTab === 'homeWidget'}
  {@render subtabBar(galleryHomeSubTab, (v) => galleryHomeSubTab = v)}

  {#if galleryHomeSubTab === 'desktop'}
    {@render galleryWidgetCard(
      'admin.settings.galleryHomepageTitle',
      'admin.settings.galleryHomepageDesc',
      homeGalleryWidget,
      (v) => { homeGalleryWidget = v; },
      () => { homeGalleryWidget = { ...DEFAULT_GALLERY_WIDGET_HOME }; },
      hasHomeGalleryChanges,
      saving,
      handleSubmit
    )}
  {:else}
    {@render galleryWidgetCard(
      'admin.settings.galleryHomepageTitle',
      'admin.settings.galleryHomepageDesc',
      mobileHomeGalleryWidget,
      (v) => { mobileHomeGalleryWidget = v; },
      () => { mobileHomeGalleryWidget = { ...DEFAULT_GALLERY_WIDGET_HOME_MOBILE }; },
      hasMobileHomeGalleryChanges,
      saving,
      handleSubmit
    )}
  {/if}
{:else}
  {@render subtabBar(galleryAboutSubTab, (v) => galleryAboutSubTab = v)}

  {#if galleryAboutSubTab === 'desktop'}
    {@render galleryWidgetCard(
      'admin.settings.galleryAboutTitle',
      'admin.settings.galleryAboutDesc',
      aboutGalleryWidget,
      (v) => { aboutGalleryWidget = v; },
      () => { aboutGalleryWidget = { ...DEFAULT_GALLERY_WIDGET_ABOUT }; },
      hasAboutGalleryChanges,
      aboutPageSaving,
      handleAboutPageSubmit
    )}
  {:else}
    {@render galleryWidgetCard(
      'admin.settings.galleryAboutTitle',
      'admin.settings.galleryAboutDesc',
      mobileAboutGalleryWidget,
      (v) => { mobileAboutGalleryWidget = v; },
      () => { mobileAboutGalleryWidget = { ...DEFAULT_GALLERY_WIDGET_ABOUT_MOBILE }; },
      hasMobileAboutGalleryChanges,
      aboutPageSaving,
      handleAboutPageSubmit
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

<div class="save-footer">
  <button type="button" class="me-reset-btn" onclick={() => { cta = { ...DEFAULT_HEADER_SETTINGS.cta }; }} disabled={headerSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div class="save-footer__actions">
  {#if hasCtaChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={handleHeaderSubmit} disabled={headerSaving || !hasCtaChanges} class="btn-save-small {hasCtaChanges ? 'is-active' : ''}" data-testid="admin-settings-cta-submit-btn">
    {#if headerSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
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
    ctaHref={cta.visible ? cta.href : undefined}
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
    ctaHref={cta.visible ? cta.href : undefined}
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
  <Select
    compact
    style="width: 62px;"
    value={ticker.startTime.split(':')[0] || '00'}
    options={hours.map((v) => ({ value: v, label: v }))}
    onchange={(v) => updateTimeValue(true, 'h', v)}
    disabled={!ticker.visible}
    ariaLabel={$t('admin.settings.tickerStartTime')}
    testId="admin-settings-ticker-start-h-select"
  />
  <span class="time-separator">:</span>
  <Select
    compact
    style="width: 62px;"
    value={ticker.startTime.split(':')[1] || '00'}
    options={minutes.map((v) => ({ value: v, label: v }))}
    onchange={(v) => updateTimeValue(true, 'm', v)}
    disabled={!ticker.visible}
    ariaLabel={$t('admin.settings.tickerStartTime')}
    testId="admin-settings-ticker-start-m-select"
  />
</div>
</li>
<li class="block-item" class:opacity-muted={!ticker.visible}>
<span class="block-item__name">{$t('admin.settings.tickerEndTime')}</span>
<div class="time-picker-group">
  <Select
    compact
    style="width: 62px;"
    value={ticker.endTime.split(':')[0] || '00'}
    options={hours.map((v) => ({ value: v, label: v }))}
    onchange={(v) => updateTimeValue(false, 'h', v)}
    disabled={!ticker.visible}
    ariaLabel={$t('admin.settings.tickerEndTime')}
    testId="admin-settings-ticker-end-h-select"
  />
  <span class="time-separator">:</span>
  <Select
    compact
    style="width: 62px;"
    value={ticker.endTime.split(':')[1] || '00'}
    options={minutes.map((v) => ({ value: v, label: v }))}
    onchange={(v) => updateTimeValue(false, 'm', v)}
    disabled={!ticker.visible}
    ariaLabel={$t('admin.settings.tickerEndTime')}
    testId="admin-settings-ticker-end-m-select"
  />
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
    <span style="font-weight: 700; color: var(--accent-primary);">{ticker.grayscaleStrength}%</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    step="5"
    class="form-range"
    bind:value={ticker.grayscaleStrength}
    style="background: linear-gradient(to right, var(--accent-primary) {ticker.grayscaleStrength}%, var(--color-ice-blue) {ticker.grayscaleStrength}%);"
  />
</li>
{/if}</ul>

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={() => { ticker = { ...DEFAULT_HEADER_SETTINGS.ticker }; }} disabled={headerSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasTickerChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={handleHeaderSubmit} disabled={headerSaving || !hasTickerChanges} class="btn-save-small {hasTickerChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-ticker-submit-btn">
    {#if headerSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
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
<!-- Підпункти НЕ гаснуть разом із перемикачем видимості: приховати вибір і
     задати значення — різні речі. Навпаки, саме коли вибір приховано, типове
     значення стає єдиним, що діє. -->
<li class="block-item block-item--sub">
<span class="block-item__name">{$t('admin.settings.debugDefaultValue')}</span>
<div style="margin-left: auto;">
  <Select
    value={String(debugPanel.defaultBackground)}
    options={BACKGROUND_OPTIONS.map((o) => ({ value: String(o.id), label: $t(o.key) }))}
    onchange={(v) => debugPanel = { ...debugPanel, defaultBackground: Number(v) as 0 | 1 | 2 | 3 | 4 }}
    ariaLabel={$t('admin.settings.debugDefaultValue')}
    testId="admin-settings-debug-default-background-select"
  />
</div>
</li>
<li class="block-item" class:opacity-muted={!debugPanel.visible}>
<span class="block-item__name">{$t('admin.settings.debugShowBlur')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={debugPanel.showBlur} disabled={!debugPanel.visible} onchange={() => debugPanel = { ...debugPanel, showBlur: !debugPanel.showBlur }} />
<span class="switch-slider"></span>
</label>
</li>
<li class="block-item block-item--sub">
<span class="block-item__name">{$t('admin.settings.debugDefaultValue')}</span>
<div class="mode-toggle-group">
  <button type="button" class="mode-btn" class:active={!debugPanel.defaultBlur} onclick={() => debugPanel = { ...debugPanel, defaultBlur: false }} aria-pressed={!debugPanel.defaultBlur} data-testid="admin-settings-debug-default-blur-off-btn">
    {$t('settings.off')}
  </button>
  <button type="button" class="mode-btn" class:active={debugPanel.defaultBlur} onclick={() => debugPanel = { ...debugPanel, defaultBlur: true }} aria-pressed={debugPanel.defaultBlur} data-testid="admin-settings-debug-default-blur-on-btn">
    {$t('settings.on')}
  </button>
</div>
</li>
<li class="block-item" class:opacity-muted={!debugPanel.visible}>
<span class="block-item__name">{$t('admin.settings.debugShowScrollbar')}</span>
<label class="switch-label" style="margin-left: auto;">
<input type="checkbox" class="switch-input" checked={debugPanel.showScrollbar} disabled={!debugPanel.visible} onchange={() => debugPanel = { ...debugPanel, showScrollbar: !debugPanel.showScrollbar }} data-testid="admin-settings-debug-scrollbar-toggle" />
<span class="switch-slider"></span>
</label>
</li>
<li class="block-item block-item--sub">
<span class="block-item__name">{$t('admin.settings.debugDefaultValue')}</span>
<div style="margin-left: auto;">
  <Select
    value={debugPanel.defaultScrollbar}
    options={SCROLLBAR_MODES.map((m) => ({ value: m.id, label: $t(m.key) }))}
    onchange={(v) => debugPanel = { ...debugPanel, defaultScrollbar: v as ScrollbarMode }}
    ariaLabel={$t('admin.settings.debugDefaultValue')}
    testId="admin-settings-debug-default-scrollbar-select"
  />
</div>
</li>
</ul>

<div class="save-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 2rem;">
  <button type="button" class="me-reset-btn" onclick={() => { debugPanel = { ...DEFAULT_HEADER_SETTINGS.debugPanel }; }} disabled={headerSaving}>
    {$t('admin.menuEditor.resetDefaults')}
  </button>
  <div style="display: flex; align-items: center;">
  {#if hasDebugPanelChanges}
    <span class="unsaved-badge">{$t('admin.users.unsavedChanges')}</span>
  {/if}
  <button type="button" onclick={handleHeaderSubmit} disabled={headerSaving || !hasDebugPanelChanges} class="btn-save-small {hasDebugPanelChanges ? 'is-active' : ''}" style="border: none;" data-testid="admin-settings-debug-submit-btn">
    {#if headerSaving}...{:else}<Save size={18} style="margin-right: 0.5rem;" aria-hidden="true" /> {$t('admin.editor.saveBtn')}{/if}
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
  background: color-mix(in srgb, var(--accent-primary), transparent 92%);
  color: var(--accent-primary);
}

.tab-btn.active {
  background: var(--accent-primary);
  color: var(--text-on-accent);
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
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.subtab-btn.active {
  background: color-mix(in srgb, var(--accent-primary), transparent 90%);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* ─── Рядок гарячої новини ─── */
/* Три поля в одному рядку списку не вміщаються на телефоні, тому рядок
   розгортається в колонку, а не стискає керування до нечитабельного. */
.hotnews-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.hotnews-row__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hotnews-row__actions {
  display: flex;
  gap: 0.35rem;
  margin-left: auto;
}

/* Відступ рівняється на перемикач угорі: поля читаються як підлеглі саме йому. */
.hotnews-row__field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-left: 3.5rem;
}

@media (max-width: 640px) {
  .hotnews-row__field {
    padding-left: 0;
  }
}

/* ─── Settings card ────────────────────────────────────── */
.settings-card {
background: var(--bg-card);
padding: 3rem;
border-radius: 40px;
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
margin-bottom: 2.5rem;
}

.settings-card__title {
font-family: var(--font-heading);
font-size: 1.5rem;
font-weight: 800;
color: var(--text-title);
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

.block-item--sub {
  margin-left: 2.5rem;
  padding: 0.75rem 1.25rem;
  /* Пунктир відділяє «значення» від «видимості»: вони пов'язані, але
     незалежні, і однакова рамка читалася б як залежність. */
  border-style: dashed;
  background: none;
}

.block-item--sub .block-item__name {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.85;
}

.block-item--sub .form-select {
  width: auto;
  min-width: 190px;
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

.time-separator {
  font-weight: 800;
  color: var(--accent-primary);
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
  background: var(--bg-card);
  color: var(--accent-text);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

:global(.dark-theme) .mode-btn.active {
  background: var(--accent-primary);
  color: var(--text-on-accent);
}

.mode-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.number-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 2px solid rgba(0, 95, 174, 0.1);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
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

.number-input-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
}

.number-input {
  width: 80px;
  text-align: center;
  padding: 0.35rem;
  height: 32px;
  min-height: 32px;
  border-radius: 8px;
  appearance: textfield;
  -moz-appearance: textfield;
}

.input-hint {
  font-size: 0.82rem;
  color: var(--color-muted-text);
  margin-left: 0.25rem;
}

.limit-toggle-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pinned-select-wrapper {
  margin-left: auto;
  min-width: 200px;
}

.save-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
}

.save-footer__actions {
  display: flex;
  align-items: center;
}

.block-item__controls {
display: flex;
align-items: center;
gap: 0.5rem;
margin-left: auto;
}

/*
 * Кільце фокуса тут НЕ знімається (ACCESSIBILITY-v8 § 3).
 *
 * Повзунок працює саме стрілками, тобто з клавіатури — а `outline: none`
 * перекривало глобальне `:focus-visible` вагою скоупу, і `Tab` до нього не
 * показував нічого. `appearance: none` знімає лише нативний ВИГЛЯД доріжки,
 * кільця воно не стосується.
 */
.form-range {
  width: 100%;
  height: 6px;
  background: var(--color-ice-blue);
  border-radius: 3px;
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
  background: var(--accent-primary);
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
background: color-mix(in srgb, var(--accent-primary), transparent 85%);
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
  background: #047857 !important;
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
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.sh-title {
  font-family: var(--font-heading);
  color: var(--text-title);
  font-size: 1.8rem;
  margin: 0;
}

@media (max-width: 640px) {
  .settings-card {
    padding: 1.5rem;
    border-radius: 24px;
  }
  .block-item {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .block-item__name {
    width: 100%;
  }
  .mode-toggle-group {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  .time-picker-group {
    width: 100%;
    justify-content: center;
  }
  .number-input-group, .limit-toggle-group, .pinned-select-wrapper {
    width: 100%;
    justify-content: space-between;
  }
  .sh-header {
    flex-wrap: wrap;
  }
  .sh-title {
    font-size: 1.4rem;
  }
  .save-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  .save-footer__actions {
    width: 100%;
    justify-content: space-between;
  }
  .btn-save-small {
    width: 100%;
    justify-content: center;
  }
}
</style>