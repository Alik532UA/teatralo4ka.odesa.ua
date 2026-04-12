import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

// ── Known navigable pages (single source of truth for nav config UI) ─────────
// Add an entry here + locale keys in uk.json/en.json when a new page is added.

export interface KnownPageRoute {
  value: string;
  labelKey: string;
}

export const KNOWN_PAGE_ROUTES: KnownPageRoute[] = [
  { value: '/',                        labelKey: 'admin.settings.pages.home' },
  { value: '/about',                   labelKey: 'admin.settings.pages.about' },
  { value: '/admission',               labelKey: 'admin.settings.pages.admission' },
  { value: '/news',                    labelKey: 'admin.settings.pages.news' },
  { value: '/history',                 labelKey: 'admin.settings.pages.history' },
  { value: '/contacts',                labelKey: 'admin.settings.pages.contacts' },
  { value: '/departments/theatre',     labelKey: 'admin.settings.pages.departmentsTheatre' },
  { value: '/departments/aesthetic',   labelKey: 'admin.settings.pages.departmentsAesthetic' },
  { value: '/departments/music',       labelKey: 'admin.settings.pages.departmentsMusic' },
  { value: '/departments/art',         labelKey: 'admin.settings.pages.departmentsArt' },
  { value: '/residents/adults',        labelKey: 'admin.settings.pages.residentsAdults' },
  { value: '/residents/kids',          labelKey: 'admin.settings.pages.residentsKids' },
  { value: '/residents/graduates',     labelKey: 'admin.settings.pages.residentsGraduates' },
  { value: '/projects',                labelKey: 'admin.settings.pages.projects' },
];

// ── Home page block ordering ──────────────────────────────────────────────────

export type BlockId = 'hero' | 'news' | 'departments' | 'projects' | 'gallery';

export interface BlockConfig {
  id: BlockId;
  visible: boolean;
  order: number;
}

// ── News widget config ────────────────────────────────────────────────────────

export type NewsViewMode = 'carousel' | 'grid' | 'list';

export interface NewsWidgetConfig {
  defaultView: NewsViewMode;
  showViewSwitcher: boolean;
  autoplay: boolean;
  /** Autoplay interval in seconds (carousel only). */
  autoplayInterval: number;
  /** Article ID to pin at the start of carousel. '' = none. */
  pinnedArticleId: string;
  /** Max items for grid view. 0 = unlimited. */
  maxItemsGrid: number;
  /** Max items for list view. 0 = unlimited. */
  maxItemsList: number;
}

export const DEFAULT_NEWS_WIDGET_HOME: NewsWidgetConfig = {
  defaultView: 'carousel',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedArticleId: '',
  maxItemsGrid: 4,
  maxItemsList: 3,
};

export const DEFAULT_NEWS_WIDGET_HOME_MOBILE: NewsWidgetConfig = {
  defaultView: 'carousel',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedArticleId: '',
  maxItemsGrid: 3,
  maxItemsList: 3,
};

export const DEFAULT_NEWS_WIDGET_PAGE: NewsWidgetConfig = {
  defaultView: 'grid',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedArticleId: '',
  maxItemsGrid: 0,
  maxItemsList: 0,
};

export const DEFAULT_NEWS_WIDGET_PAGE_MOBILE: NewsWidgetConfig = {
  defaultView: 'list',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedArticleId: '',
  maxItemsGrid: 0,
  maxItemsList: 0,
};

// ── Projects widget config ────────────────────────────────────────────────────

export type ProjectsViewMode = 'carousel' | 'grid' | 'list';

export interface ProjectsWidgetConfig {
  defaultView: ProjectsViewMode;
  showViewSwitcher: boolean;
  autoplay: boolean;
  /** Autoplay interval in seconds (carousel only). */
  autoplayInterval: number;
  /** Project ID to pin at the start of carousel. '' = none. */
  pinnedProjectId: string;
  /** Max items for grid view. 0 = unlimited. */
  maxItemsGrid: number;
  /** Max items for list view. 0 = unlimited. */
  maxItemsList: number;
}

export const DEFAULT_PROJECTS_WIDGET_HOME: ProjectsWidgetConfig = {
  defaultView: 'grid',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedProjectId: '',
  maxItemsGrid: 4,
  maxItemsList: 3,
};

export const DEFAULT_PROJECTS_WIDGET_HOME_MOBILE: ProjectsWidgetConfig = {
  defaultView: 'carousel',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedProjectId: '',
  maxItemsGrid: 3,
  maxItemsList: 3,
};

export const DEFAULT_PROJECTS_WIDGET_PAGE: ProjectsWidgetConfig = {
  defaultView: 'grid',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedProjectId: '',
  maxItemsGrid: 0,
  maxItemsList: 0,
};

export const DEFAULT_PROJECTS_WIDGET_PAGE_MOBILE: ProjectsWidgetConfig = {
  defaultView: 'list',
  showViewSwitcher: true,
  autoplay: true,
  autoplayInterval: 7,
  pinnedProjectId: '',
  maxItemsGrid: 0,
  maxItemsList: 0,
};

// ── Gallery widget config ─────────────────────────────────────────────────────

export type GalleryViewMode = 'carousel' | 'grid';

/** Aspect ratio presets for gallery carousel. */
export type GalleryAspectRatio = '4:3' | '16:9' | '3:4' | '9:16';

export interface GalleryWidgetConfig {
  defaultView: GalleryViewMode;
  showViewSwitcher: boolean;
  /** Show caption text on photos (carousel overlay + grid hover). */
  showCaptions: boolean;
  autoplay: boolean;
  /** Autoplay interval in seconds (carousel only). */
  autoplayInterval: number;
  /** Image index to pin at the start of carousel. -1 = none. */
  pinnedIndex: number;
  /** Max items for grid view. 0 = unlimited. */
  maxItemsGrid: number;
  /** Carousel aspect ratio. */
  aspectRatio: GalleryAspectRatio;
}

export const DEFAULT_GALLERY_WIDGET_HOME: GalleryWidgetConfig = {
  defaultView: 'grid',
  showViewSwitcher: false,
  showCaptions: false,
  autoplay: true,
  autoplayInterval: 5,
  pinnedIndex: -1,
  maxItemsGrid: 0,
  aspectRatio: '4:3',
};

export const DEFAULT_GALLERY_WIDGET_HOME_MOBILE: GalleryWidgetConfig = {
  defaultView: 'carousel',
  showViewSwitcher: false,
  showCaptions: false,
  autoplay: true,
  autoplayInterval: 5,
  pinnedIndex: -1,
  maxItemsGrid: 0,
  aspectRatio: '4:3',
};

export const DEFAULT_GALLERY_WIDGET_ABOUT: GalleryWidgetConfig = {
  defaultView: 'grid',
  showViewSwitcher: false,
  showCaptions: false,
  autoplay: true,
  autoplayInterval: 5,
  pinnedIndex: -1,
  maxItemsGrid: 0,
  aspectRatio: '4:3',
};

export const DEFAULT_GALLERY_WIDGET_ABOUT_MOBILE: GalleryWidgetConfig = {
  defaultView: 'carousel',
  showViewSwitcher: false,
  showCaptions: false,
  autoplay: true,
  autoplayInterval: 5,
  pinnedIndex: -1,
  maxItemsGrid: 0,
  aspectRatio: '4:3',
};

export interface HomeSettings {
  blocks: BlockConfig[];
  /** Mobile-specific block order. Falls back to `blocks` when absent. */
  mobileBlocks?: BlockConfig[];
  newsWidget?: NewsWidgetConfig;
  /** Mobile-specific news widget config. Falls back to `newsWidget` when absent. */
  mobileNewsWidget?: NewsWidgetConfig;
  projectsWidget?: ProjectsWidgetConfig;
  /** Mobile-specific projects widget config. Falls back to `projectsWidget` when absent. */
  mobileProjectsWidget?: ProjectsWidgetConfig;
  galleryWidget?: GalleryWidgetConfig;
  mobileGalleryWidget?: GalleryWidgetConfig;
  updatedAt?: any;
}

export interface NewsPageSettings {
  newsWidget: NewsWidgetConfig;
  /** Mobile-specific news widget config. Falls back to `newsWidget` when absent. */
  mobileNewsWidget?: NewsWidgetConfig;
  updatedAt?: any;
}

export interface ProjectsPageSettings {
  projectsWidget: ProjectsWidgetConfig;
  /** Mobile-specific projects widget config. Falls back to `projectsWidget` when absent. */
  mobileProjectsWidget?: ProjectsWidgetConfig;
  updatedAt?: any;
}

export interface AboutPageSettings {
  galleryWidget: GalleryWidgetConfig;
  mobileGalleryWidget?: GalleryWidgetConfig;
  updatedAt?: any;
}

export const DEFAULT_BLOCKS: BlockConfig[] = [
  { id: 'hero',        visible: true, order: 0 },
  { id: 'news',        visible: true, order: 1 },
  { id: 'departments', visible: true, order: 2 },
  { id: 'projects',    visible: true, order: 3 },
  { id: 'gallery',     visible: true, order: 4 },
];

// ── Generic content widget config (used by ContentWidget.svelte) ─────────────

export type ContentViewMode = 'carousel' | 'grid' | 'list';

export interface ContentWidgetConfig {
  defaultView: ContentViewMode;
  showViewSwitcher: boolean;
  autoplay: boolean;
  autoplayInterval: number;
  pinnedItemId: string;
  maxItemsGrid: number;
  maxItemsList: number;
}

export function newsToContentConfig(c: NewsWidgetConfig): ContentWidgetConfig {
  const { pinnedArticleId: pinnedItemId, ...rest } = c;
  return { ...rest, pinnedItemId };
}

export function projectsToContentConfig(c: ProjectsWidgetConfig): ContentWidgetConfig {
  const { pinnedProjectId: pinnedItemId, ...rest } = c;
  return { ...rest, pinnedItemId };
}

const SITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

async function getProjectId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdTokenResult();

  if (token.claims?.role === "superadmin") {
    return SITE_PROJECT_ID;
  }

  const projectId = token.claims?.projectId as string | undefined;
  if (!projectId) {
    return SITE_PROJECT_ID; 
  }
  
  return projectId;
}

function perf(label: string) {
  if (typeof window !== 'undefined' && (window as any).__perf) (window as any).__perf(label);
}

/** Public read — no auth required (Firestore rules allow settingId == 'home'). */
export async function getHomeSettings(): Promise<HomeSettings | null> {
  perf('getHomeSettings: start');
  try {
  const docRef = doc(db, "projects", SITE_PROJECT_ID, "settings", "home");
  perf('getHomeSettings: doc ref created, calling getDoc...');
  const docSnap = await getDoc(docRef);
  perf('getHomeSettings: getDoc returned (exists=' + docSnap.exists() + ')');
  if (docSnap.exists()) {
    const raw = docSnap.data() as Record<string, any>;
    // Merge missing DEFAULT_BLOCKS entries into loaded blocks
    // (old Firebase data may lack blocks added after initial save, e.g. 'projects')
    let loadedBlocks: BlockConfig[] = raw.blocks ?? DEFAULT_BLOCKS;
    const loadedIds = new Set(loadedBlocks.map(b => b.id));
    for (const def of DEFAULT_BLOCKS) {
      if (!loadedIds.has(def.id)) {
        const insertAt = Math.min(def.order, loadedBlocks.length);
        loadedBlocks = [
          ...loadedBlocks.slice(0, insertAt),
          { ...def },
          ...loadedBlocks.slice(insertAt),
        ];
      }
    }
    // Re-number order fields to match array positions
    loadedBlocks = loadedBlocks.map((b, i) => ({ ...b, order: i }));
    const data: HomeSettings = {
      blocks: loadedBlocks,
      mobileBlocks: raw.mobileBlocks,
      newsWidget: raw.newsWidget,
      mobileNewsWidget: raw.mobileNewsWidget,
      projectsWidget: raw.projectsWidget,
      mobileProjectsWidget: raw.mobileProjectsWidget,
      galleryWidget: raw.galleryWidget,
      mobileGalleryWidget: raw.mobileGalleryWidget,
      updatedAt: raw.updatedAt,
    };
    // Cache in localStorage for instant render on next visit (SWR pattern)
    try {
      const { updatedAt, ...cacheable } = data;
      localStorage.setItem('homeSettings', JSON.stringify(cacheable));
    } catch { /* quota exceeded or SSR — ignore */ }
    return data;
  }
  return null;
  } catch (e) {
    console.error('Failed to load home settings:', e);
    return null;
  }
}

/** Read cached home settings from localStorage (sync, instant). */
export function getCachedHomeSettings(): Omit<HomeSettings, 'updatedAt'> | null {
  try {
    const cached = localStorage.getItem('homeSettings');
    if (cached) return JSON.parse(cached);
  } catch { /* SSR or corrupted — ignore */ }
  return null;
}

/** Auth-required write. */
export async function updateHomeSettings(settings: Omit<HomeSettings, "updatedAt">) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "home");
  return await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
}

// ── Header settings ───────────────────────────────────────────────────────────

export type MenuLinkType = 'page' | 'article' | 'url';

/** A single nav link (leaf node). */
export interface MenuItem {
  id: string;
  labelUk: string;
  labelEn: string;
  linkType: MenuLinkType;
  /** Resolved path/slug/URL stored as-is. Header.svelte prepends `base` for page/article. */
  href: string;
  visible: boolean;
  order: number;
  custom?: boolean;
  /** 'cta' renders as a highlighted button */
  itemType?: 'cta';
}

/**
 * A section can be:
 *  - a pure heading (labelUk set, href absent) → just a group title, no link
 *  - a heading + link (labelUk + href) → clickable heading that also expands sub-items
 *  - a flat container (no labelUk, no href) → invisible wrapper around a group of items
 */
export interface MenuSection {
  id: string;
  labelUk?: string;
  labelEn?: string;
  /** Optional: section header is a link */
  href?: string;
  linkType?: MenuLinkType;
  visible: boolean;
  order: number;
  custom?: boolean;
  items: MenuItem[];
}

/** One of the three rendered menus in the header. */
export interface MenuConfig {
  /** flat root-level items (used by headerBar) */
  items: MenuItem[];
  /** grouped sections (used by navDropdown and mobileOverlay; headerBar can also have them) */
  sections: MenuSection[];
}

// ── Override types (stored in Firebase — only admin customizations) ────────────

/**
 * Firebase stores only the "delta" from defaults.
 * - `custom: true` items are stored fully (all fields required).
 * - Default items store only `id` + changed fields. Missing fields = use default.
 * - `null` explicitly means "use the code default" (for clearing a custom override).
 */
export interface MenuItemOverride {
  id: string;
  labelUk?: string | null;
  labelEn?: string | null;
  linkType?: MenuLinkType;
  href?: string;
  visible?: boolean;
  order?: number;
  custom?: boolean;
  itemType?: 'cta' | null;
}

export interface MenuSectionOverride {
  id: string;
  labelUk?: string | null;
  labelEn?: string | null;
  href?: string | null;
  linkType?: MenuLinkType;
  visible?: boolean;
  order?: number;
  custom?: boolean;
  items?: MenuItemOverride[];
}

export interface MenuConfigOverride {
  items?: MenuItemOverride[];
  sections?: MenuSectionOverride[];
}

// ── Merge logic: defaults + Firebase overrides ────────────────────────────────

/** Resolve a single MenuItem from default + override. Null values in override = use default. */
function resolveItem(def: MenuItem, override?: MenuItemOverride): MenuItem {
  if (!override) return { ...def };
  return {
    ...def,
    labelUk:  override.labelUk  ?? def.labelUk,
    labelEn:  override.labelEn  ?? def.labelEn,
    linkType: override.linkType ?? def.linkType,
    href:     override.href     ?? def.href,
    visible:  override.visible  ?? def.visible,
    order:    override.order    ?? def.order,
    itemType: override.itemType === null ? undefined : (override.itemType ?? def.itemType),
    custom:   override.custom   ?? def.custom,
  };
}

/** Merge an item array: match by id, preserve custom items from overrides. */
function resolveItems(defaults: MenuItem[], overrides?: MenuItemOverride[]): MenuItem[] {
  if (!overrides) return defaults.map(d => ({ ...d }));

  const result: MenuItem[] = [];

  // First, resolve all default items (matched by id)
  for (const def of defaults) {
    const override = overrides.find(o => o.id === def.id);
    result.push(resolveItem(def, override));
  }

  // Then, add custom items from overrides (not in defaults)
  for (const override of overrides) {
    if (!defaults.some(d => d.id === override.id)) {
      // Custom item — all fields must be present
      result.push({
        id:       override.id,
        labelUk:  override.labelUk ?? '',
        labelEn:  override.labelEn ?? '',
        linkType: override.linkType ?? 'page',
        href:     override.href ?? '',
        visible:  override.visible ?? true,
        order:    override.order ?? result.length,
        custom:   true,
        itemType: override.itemType === null ? undefined : override.itemType,
      });
    }
  }

  return result;
}

/** Merge a section from default + override. */
function resolveSection(def: MenuSection, override?: MenuSectionOverride): MenuSection {
  if (!override) return { ...def, items: def.items.map(i => ({ ...i })) };
  return {
    ...def,
    labelUk:  override.labelUk  === null ? undefined : (override.labelUk  ?? def.labelUk),
    labelEn:  override.labelEn  === null ? undefined : (override.labelEn  ?? def.labelEn),
    href:     override.href     === null ? undefined : (override.href     ?? def.href),
    linkType: override.linkType ?? def.linkType,
    visible:  override.visible  ?? def.visible,
    order:    override.order    ?? def.order,
    custom:   override.custom   ?? def.custom,
    items:    resolveItems(def.items, override.items),
  };
}

/** Merge a full MenuConfig: defaults + Firebase overrides. */
export function resolveMenuConfig(defaults: MenuConfig, overrides?: MenuConfigOverride): MenuConfig {
  if (!overrides) return structuredClone(defaults);

  const items = resolveItems(defaults.items, overrides.items);

  const sections: MenuSection[] = [];
  for (const def of defaults.sections) {
    const override = overrides.sections?.find(o => o.id === def.id);
    sections.push(resolveSection(def, override));
  }
  // Custom sections from overrides
  if (overrides.sections) {
    for (const override of overrides.sections) {
      if (!defaults.sections.some(d => d.id === override.id)) {
        sections.push({
          id:       override.id,
          labelUk:  override.labelUk === null ? undefined : override.labelUk,
          labelEn:  override.labelEn === null ? undefined : override.labelEn,
          href:     override.href === null ? undefined : override.href,
          linkType: override.linkType,
          visible:  override.visible ?? true,
          order:    override.order ?? sections.length,
          custom:   true,
          items:    resolveItems([], override.items),
        });
      }
    }
  }

  return { items, sections };
}

/** Extract only the differences from defaults (for saving to Firebase). */
function diffItem(resolved: MenuItem, def: MenuItem): MenuItemOverride | null {
  if (resolved.custom) {
    // Custom items are always stored fully
    return { ...resolved };
  }
  const diff: MenuItemOverride = { id: resolved.id };
  let hasDiff = false;
  if (resolved.labelUk  !== def.labelUk)  { diff.labelUk  = resolved.labelUk;  hasDiff = true; }
  if (resolved.labelEn  !== def.labelEn)  { diff.labelEn  = resolved.labelEn;  hasDiff = true; }
  if (resolved.linkType !== def.linkType) { diff.linkType = resolved.linkType; hasDiff = true; }
  if (resolved.href     !== def.href)     { diff.href     = resolved.href;     hasDiff = true; }
  if (resolved.visible  !== def.visible)  { diff.visible  = resolved.visible;  hasDiff = true; }
  if (resolved.order    !== def.order)    { diff.order    = resolved.order;    hasDiff = true; }
  if (resolved.itemType !== def.itemType) { diff.itemType = resolved.itemType ?? null; hasDiff = true; }
  return hasDiff ? diff : null;
}

/** Extract differences for an items array. Returns undefined if no changes. */
function diffItems(resolved: MenuItem[], defaults: MenuItem[]): MenuItemOverride[] | undefined {
  const diffs: MenuItemOverride[] = [];
  for (const item of resolved) {
    const def = defaults.find(d => d.id === item.id);
    if (!def) {
      // Custom item — store fully
      diffs.push({ ...item, custom: true });
    } else {
      const d = diffItem(item, def);
      if (d) diffs.push(d);
    }
  }
  // Check for removed default items
  for (const def of defaults) {
    if (!resolved.some(r => r.id === def.id)) {
      diffs.push({ id: def.id, visible: false });
    }
  }
  return diffs.length > 0 ? diffs : undefined;
}

function diffSection(resolved: MenuSection, def: MenuSection): MenuSectionOverride | null {
  if (resolved.custom) {
    return {
      ...resolved,
      items: resolved.items.map(i => ({ ...i, custom: true })),
    };
  }
  const diff: MenuSectionOverride = { id: resolved.id };
  let hasDiff = false;
  if (resolved.labelUk  !== def.labelUk)  { diff.labelUk  = resolved.labelUk  ?? null; hasDiff = true; }
  if (resolved.labelEn  !== def.labelEn)  { diff.labelEn  = resolved.labelEn  ?? null; hasDiff = true; }
  if (resolved.href     !== def.href)     { diff.href     = resolved.href     ?? null; hasDiff = true; }
  if (resolved.linkType !== def.linkType) { diff.linkType = resolved.linkType; hasDiff = true; }
  if (resolved.visible  !== def.visible)  { diff.visible  = resolved.visible;  hasDiff = true; }
  if (resolved.order    !== def.order)    { diff.order    = resolved.order;    hasDiff = true; }
  const itemsDiff = diffItems(resolved.items, def.items);
  if (itemsDiff) { diff.items = itemsDiff; hasDiff = true; }
  return hasDiff ? diff : null;
}

/** Extract only overrides from a resolved MenuConfig (for saving to Firebase). */
export function diffMenuConfig(resolved: MenuConfig, defaults: MenuConfig): MenuConfigOverride | undefined {
  const itemsDiff = diffItems(resolved.items, defaults.items);
  const sectionDiffs: MenuSectionOverride[] = [];

  for (const section of resolved.sections) {
    const def = defaults.sections.find(d => d.id === section.id);
    if (!def) {
      sectionDiffs.push({
        ...section,
        custom: true,
        items: section.items.map(i => ({ ...i, custom: true })),
      });
    } else {
      const d = diffSection(section, def);
      if (d) sectionDiffs.push(d);
    }
  }
  // Removed default sections
  for (const def of defaults.sections) {
    if (!resolved.sections.some(r => r.id === def.id)) {
      sectionDiffs.push({ id: def.id, visible: false });
    }
  }

  const sectionsDiff = sectionDiffs.length > 0 ? sectionDiffs : undefined;
  if (!itemsDiff && !sectionsDiff) return undefined;
  const result: MenuConfigOverride = {};
  if (itemsDiff)    result.items = itemsDiff;
  if (sectionsDiff) result.sections = sectionsDiff;
  return result;
}

export type CtaLinkType = MenuLinkType;

export interface CtaConfig {
  visible: boolean;
  labelUk: string;
  labelEn: string;
  linkType: CtaLinkType;
  href: string;
}

export interface DebugPanelConfig {
  visible: boolean;
  showBackground: boolean;
  showBlur: boolean;
}

export interface TickerConfig {
  visible: boolean;
  mode: 'always' | 'time';
  startTime: string;
  endTime: string;
  preview: boolean;
  enableSound: boolean;
  enableGrayscale: boolean;
  grayscaleStrength: number;
}

export interface HeaderSettings {
  cta: CtaConfig;
  ticker: TickerConfig;
  /** data-testid="header-bar-container" */
  headerBar: MenuConfig;
  /** data-testid="nav-dropdown-menu" */
  navDropdown: MenuConfig;
  /** data-testid="mobile-overlay-container" */
  mobileOverlay: MenuConfig;
  debugPanel: DebugPanelConfig;
  updatedAt?: any;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_HEADER_SETTINGS: Omit<HeaderSettings, 'updatedAt'> = {
  cta: {
    visible: true,
    labelUk: 'Для вступу',
    labelEn: 'Admission',
    linkType: 'page',
    href: '/admission',
  },

  ticker: {
    visible: true,
    mode: 'time',
    startTime: '09:00',
    endTime: '09:03',
    preview: false,
    enableSound: false,
    enableGrayscale: true,
    grayscaleStrength: 60,
  },

  headerBar: {
    items: [
      { id: 'home',     labelUk: 'Головна',   labelEn: 'Home',         linkType: 'page', href: '/',         visible: true, order: 0 },
      { id: 'about',    labelUk: 'Про школу', labelEn: 'About School', linkType: 'page', href: '/about',    visible: true, order: 1 },
      { id: 'history',  labelUk: 'Історія',   labelEn: 'History',      linkType: 'page', href: '/history',  visible: true, order: 2 },
      { id: 'contacts', labelUk: 'Контакти',  labelEn: 'Contacts',     linkType: 'page', href: '/contacts', visible: true, order: 3 },
    ],
    sections: [],
  },

  navDropdown: {
    items: [],
    sections: [
      {
        id: 'quick',
        visible: false,
        order: 0,
        items: [
          { id: 'admission', labelUk: 'Для вступу', labelEn: 'Admission', linkType: 'page', href: '/admission', visible: true, order: 0 },
          { id: 'home',      labelUk: 'Головна',    labelEn: 'Home',      linkType: 'page', href: '/',          visible: true, order: 1 },
          { id: 'contacts',  labelUk: 'Контакти',   labelEn: 'Contacts',  linkType: 'page', href: '/contacts',  visible: true, order: 2 },
          { id: 'history',   labelUk: 'Історія',    labelEn: 'History',   linkType: 'page', href: '/history',   visible: true, order: 3 },
          { id: 'news',      labelUk: 'Новини',     labelEn: 'News',      linkType: 'page', href: '/news',      visible: true, order: 4 },
        ],
      },
      {
        id: 'departments',
        labelUk: 'Відділення',
        labelEn: 'Departments',
        visible: true,
        order: 1,
        items: [
          { id: 'theatre',   labelUk: 'Театральне',           labelEn: 'Theatre',             linkType: 'page', href: '/departments/theatre',   visible: true, order: 0 },
          { id: 'music',     labelUk: 'Музичне',             labelEn: 'Music',               linkType: 'page', href: '/departments/music',     visible: true, order: 1 },
          { id: 'art',       labelUk: 'Художнє',             labelEn: 'Art',                 linkType: 'page', href: '/departments/art',       visible: true, order: 2 },
          { id: 'aesthetic', labelUk: 'Естетичне виховання',  labelEn: 'Aesthetic Education', linkType: 'page', href: '/departments/aesthetic', visible: true, order: 3 },
        ],
      },
      {
        id: 'residents',
        labelUk: 'Мешканці',
        labelEn: 'Residents',
        visible: true,
        order: 2,
        items: [
          { id: 'adults',    labelUk: 'Дорослі',    labelEn: 'Adults',    linkType: 'page', href: '/residents/adults',    visible: true, order: 0 },
          { id: 'kids',      labelUk: 'Діти',       labelEn: 'Kids',      linkType: 'page', href: '/residents/kids',      visible: true, order: 1 },
          { id: 'graduates', labelUk: 'Випускники', labelEn: 'Graduates', linkType: 'page', href: '/residents/graduates', visible: true, order: 2 },
        ],
      },
      {
        id: 'other',
        visible: true,
        order: 3,
        items: [
          { id: 'projects', labelUk: 'Проєкти', labelEn: 'Projects', linkType: 'page', href: '/projects', visible: true, order: 0 },
        ],
      },
    ],
  },

  mobileOverlay: {
    items: [],
    sections: [
      {
        id: 'quick',
        visible: false,
        order: 0,
        items: [
          { id: 'admission', labelUk: 'Для вступу', labelEn: 'Admission', linkType: 'page', href: '/admission', visible: true, order: 0 },
          { id: 'home',      labelUk: 'Головна',    labelEn: 'Home',      linkType: 'page', href: '/',          visible: true, order: 1 },
          { id: 'contacts',  labelUk: 'Контакти',   labelEn: 'Contacts',  linkType: 'page', href: '/contacts',  visible: true, order: 2 },
          { id: 'history',   labelUk: 'Історія',    labelEn: 'History',   linkType: 'page', href: '/history',   visible: true, order: 3 },
          { id: 'news',      labelUk: 'Новини',     labelEn: 'News',      linkType: 'page', href: '/news',      visible: true, order: 4 },
        ],
      },
      {
        id: 'departments',
        labelUk: 'Відділення',
        labelEn: 'Departments',
        visible: true,
        order: 1,
        items: [
          { id: 'theatre',   labelUk: 'Театральне',           labelEn: 'Theatre',             linkType: 'page', href: '/departments/theatre',   visible: true, order: 0 },
          { id: 'music',     labelUk: 'Музичне',             labelEn: 'Music',               linkType: 'page', href: '/departments/music',     visible: true, order: 1 },
          { id: 'art',       labelUk: 'Художнє',             labelEn: 'Art',                 linkType: 'page', href: '/departments/art',       visible: true, order: 2 },
          { id: 'aesthetic', labelUk: 'Естетичне виховання',  labelEn: 'Aesthetic Education', linkType: 'page', href: '/departments/aesthetic', visible: true, order: 3 },
        ],
      },
      {
        id: 'residents',
        labelUk: 'Мешканці',
        labelEn: 'Residents',
        visible: true,
        order: 2,
        items: [
          { id: 'adults',    labelUk: 'Дорослі',    labelEn: 'Adults',    linkType: 'page', href: '/residents/adults',    visible: true, order: 0 },
          { id: 'kids',      labelUk: 'Діти',       labelEn: 'Kids',      linkType: 'page', href: '/residents/kids',      visible: true, order: 1 },
          { id: 'graduates', labelUk: 'Випускники', labelEn: 'Graduates', linkType: 'page', href: '/residents/graduates', visible: true, order: 2 },
        ],
      },
      {
        id: 'other',
        visible: true,
        order: 3,
        items: [
          { id: 'projects', labelUk: 'Проєкти', labelEn: 'Projects', linkType: 'page', href: '/projects', visible: true, order: 0 },
        ],
      },
    ],
  },

  debugPanel: {
    visible: true,
    showBackground: true,
    showBlur: true,
  },
};

/**
 * Firebase stores overrides (deltas from defaults).
 * This interface represents the raw shape of the Firebase document.
 */
interface HeaderSettingsRaw {
  cta?: Partial<CtaConfig> & { linkValue?: string };
  ticker?: Partial<TickerConfig>;
  headerBar?: MenuConfigOverride;
  navDropdown?: MenuConfigOverride;
  mobileOverlay?: MenuConfigOverride;
  debugPanel?: Partial<DebugPanelConfig>;
  updatedAt?: any;
}

/** Resolve full HeaderSettings from Firebase overrides + code defaults. */
function resolveHeaderSettings(raw: HeaderSettingsRaw): HeaderSettings {
  // Migrate old cta.linkValue → cta.href
  const rawCta = raw.cta ?? {};
  const cta: CtaConfig = {
    ...DEFAULT_HEADER_SETTINGS.cta,
    ...rawCta,
    href: rawCta.href ?? rawCta.linkValue ?? DEFAULT_HEADER_SETTINGS.cta.href,
  };

  return {
    cta,
    ticker:        { ...DEFAULT_HEADER_SETTINGS.ticker,    ...(raw.ticker ?? {}) },
    headerBar:     resolveMenuConfig(DEFAULT_HEADER_SETTINGS.headerBar,     raw.headerBar),
    navDropdown:   resolveMenuConfig(DEFAULT_HEADER_SETTINGS.navDropdown,   raw.navDropdown),
    mobileOverlay: resolveMenuConfig(DEFAULT_HEADER_SETTINGS.mobileOverlay, raw.mobileOverlay),
    debugPanel:    { ...DEFAULT_HEADER_SETTINGS.debugPanel, ...(raw.debugPanel ?? {}) },
  };
}

/** Public read — no auth required (Firestore rules allow settingId == 'header'). */
export async function getHeaderSettings(): Promise<HeaderSettings | null> {
  try {
  const docRef = doc(db, "projects", SITE_PROJECT_ID, "settings", "header");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const raw = docSnap.data() as HeaderSettingsRaw;
  const result = resolveHeaderSettings(raw);

  // Cache the resolved result for instant render on next visit
  try {
    localStorage.setItem('headerSettings', JSON.stringify(result));
  } catch { /* quota exceeded or SSR — ignore */ }

  return result;
  } catch (e) {
    console.error('Failed to load header settings:', e);
    return null;
  }
}

/** Read cached header settings from localStorage (sync, instant). */
export function getCachedHeaderSettings(): Omit<HeaderSettings, 'updatedAt'> | null {
  try {
    const cached = localStorage.getItem('headerSettings');
    if (cached) return JSON.parse(cached);
  } catch { /* SSR or corrupted — ignore */ }
  return null;
}

/**
 * Auth-required write.
 * Accepts resolved (full) MenuConfig objects, diffs them against defaults,
 * and stores only the overrides in Firebase.
 */
export async function updateHeaderSettings(settings: Omit<HeaderSettings, 'updatedAt'>) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "header");

  // Diff CTA: only store fields that differ from default
  const ctaDiff: Record<string, any> = {};
  const defCta = DEFAULT_HEADER_SETTINGS.cta;
  for (const key of Object.keys(settings.cta) as (keyof CtaConfig)[]) {
    if (settings.cta[key] !== defCta[key]) {
      ctaDiff[key] = settings.cta[key];
    }
  }

  // Diff ticker
  const tickerDiff: Record<string, any> = {};
  const defTicker = DEFAULT_HEADER_SETTINGS.ticker;
  for (const key of Object.keys(settings.ticker) as (keyof TickerConfig)[]) {
    if (settings.ticker[key] !== defTicker[key]) {
      tickerDiff[key] = settings.ticker[key];
    }
  }

  // Diff debug panel
  const debugDiff: Record<string, any> = {};
  const defDebug = DEFAULT_HEADER_SETTINGS.debugPanel;
  for (const key of Object.keys(settings.debugPanel) as (keyof DebugPanelConfig)[]) {
    if (settings.debugPanel[key] !== defDebug[key]) {
      debugDiff[key] = settings.debugPanel[key];
    }
  }

  const payload: Record<string, any> = { updatedAt: serverTimestamp() };

  // Only include sections that have actual overrides
  if (Object.keys(ctaDiff).length > 0)     payload.cta = ctaDiff;
  if (Object.keys(tickerDiff).length > 0)   payload.ticker = tickerDiff;
  if (Object.keys(debugDiff).length > 0)    payload.debugPanel = debugDiff;

  const headerBarDiff = diffMenuConfig(settings.headerBar, DEFAULT_HEADER_SETTINGS.headerBar);
  const navDropdownDiff = diffMenuConfig(settings.navDropdown, DEFAULT_HEADER_SETTINGS.navDropdown);
  const mobileOverlayDiff = diffMenuConfig(settings.mobileOverlay, DEFAULT_HEADER_SETTINGS.mobileOverlay);

  if (headerBarDiff)     payload.headerBar = headerBarDiff;
  if (navDropdownDiff)   payload.navDropdown = navDropdownDiff;
  if (mobileOverlayDiff) payload.mobileOverlay = mobileOverlayDiff;

  return await setDoc(docRef, payload);
}

// ── News page settings ────────────────────────────────────────────────────────

/** Public read — no auth required (Firestore rules allow settingId == 'news'). */
export async function getNewsPageSettings(): Promise<NewsPageSettings | null> {
  try {
  const docRef = doc(db, "projects", SITE_PROJECT_ID, "settings", "news");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const raw = docSnap.data() as Record<string, any>;
  const data: NewsPageSettings = {
    newsWidget: raw.newsWidget ?? DEFAULT_NEWS_WIDGET_PAGE,
    mobileNewsWidget: raw.mobileNewsWidget,
    updatedAt: raw.updatedAt,
  };
  // SWR cache
  try {
    const { updatedAt, ...cacheable } = data;
    localStorage.setItem('newsPageSettings', JSON.stringify(cacheable));
  } catch { /* quota exceeded — ignore */ }
  return data;
  } catch (e) {
    console.error('Failed to load news page settings:', e);
    return null;
  }
}

/** Read cached news page settings from localStorage (sync, instant). */
export function getCachedNewsPageSettings(): Omit<NewsPageSettings, 'updatedAt'> | null {
  try {
    const cached = localStorage.getItem('newsPageSettings');
    if (cached) return JSON.parse(cached);
  } catch { /* corrupted — ignore */ }
  return null;
}

/** Auth-required write. */
export async function updateNewsPageSettings(settings: Omit<NewsPageSettings, 'updatedAt'>) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "news");
  return await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
}

// ── Projects page settings ────────────────────────────────────────────────────

/** Public read — no auth required. */
export async function getProjectsPageSettings(): Promise<ProjectsPageSettings | null> {
  try {
  const docRef = doc(db, "projects", SITE_PROJECT_ID, "settings", "projects");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const raw = docSnap.data() as Record<string, any>;
  const data: ProjectsPageSettings = {
    projectsWidget: raw.projectsWidget ?? DEFAULT_PROJECTS_WIDGET_PAGE,
    mobileProjectsWidget: raw.mobileProjectsWidget,
    updatedAt: raw.updatedAt,
  };
  // SWR cache
  try {
    const { updatedAt, ...cacheable } = data;
    localStorage.setItem('projectsPageSettings', JSON.stringify(cacheable));
  } catch { /* quota exceeded — ignore */ }
  return data;
  } catch (e) {
    console.error('Failed to load projects page settings:', e);
    return null;
  }
}

/** Read cached projects page settings from localStorage (sync, instant). */
export function getCachedProjectsPageSettings(): Omit<ProjectsPageSettings, 'updatedAt'> | null {
  try {
    const cached = localStorage.getItem('projectsPageSettings');
    if (cached) return JSON.parse(cached);
  } catch { /* corrupted — ignore */ }
  return null;
}

/** Auth-required write. */
export async function updateProjectsPageSettings(settings: Omit<ProjectsPageSettings, 'updatedAt'>) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "projects");
  return await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
}

// ── About page settings ───────────────────────────────────────────────────────

/** Public read — no auth required (Firestore rules allow settingId == 'about'). */
export async function getAboutPageSettings(): Promise<AboutPageSettings | null> {
  try {
  const docRef = doc(db, "projects", SITE_PROJECT_ID, "settings", "about");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const raw = docSnap.data() as Record<string, any>;
  const data: AboutPageSettings = {
    galleryWidget: raw.galleryWidget ?? DEFAULT_GALLERY_WIDGET_ABOUT,
    mobileGalleryWidget: raw.mobileGalleryWidget,
    updatedAt: raw.updatedAt,
  };
  try {
    const { updatedAt, ...cacheable } = data;
    localStorage.setItem('aboutPageSettings', JSON.stringify(cacheable));
  } catch { /* quota exceeded — ignore */ }
  return data;
  } catch (e) {
    console.error('Failed to load about page settings:', e);
    return null;
  }
}

/** Read cached about page settings from localStorage (sync, instant). */
export function getCachedAboutPageSettings(): Omit<AboutPageSettings, 'updatedAt'> | null {
  try {
    const cached = localStorage.getItem('aboutPageSettings');
    if (cached) return JSON.parse(cached);
  } catch { /* corrupted — ignore */ }
  return null;
}

/** Auth-required write. */
export async function updateAboutPageSettings(settings: Omit<AboutPageSettings, 'updatedAt'>) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "about");
  return await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
}
