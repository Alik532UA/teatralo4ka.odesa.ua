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

export type BlockId = 'hero' | 'news' | 'departments' | 'gallery';

export interface BlockConfig {
  id: BlockId;
  visible: boolean;
  order: number;
}

export interface HomeSettings {
  blocks: BlockConfig[];
  updatedAt?: any;
}

export const DEFAULT_BLOCKS: BlockConfig[] = [
  { id: 'hero',        visible: true, order: 0 },
  { id: 'news',        visible: true, order: 1 },
  { id: 'departments', visible: true, order: 2 },
  { id: 'gallery',     visible: true, order: 3 },
];

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

/** Public read — no auth required (Firestore rules allow settingId == 'home'). */
export async function getHomeSettings(): Promise<HomeSettings | null> {
  const docRef = doc(db, "projects", SITE_PROJECT_ID, "settings", "home");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as HomeSettings;
  }
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

export interface HeaderSettings {
  cta: CtaConfig;
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
    labelUk: 'ДЛЯ ВСТУПУ',
    labelEn: 'ADMISSION',
    linkType: 'page',
    href: '/admission',
  },

  headerBar: {
    items: [
      { id: 'home',     labelUk: 'Головна',   labelEn: 'Home',         linkType: 'page', href: '/',         visible: true, order: 0 },
      { id: 'about',    labelUk: 'Про Школу', labelEn: 'About School', linkType: 'page', href: '/about',    visible: true, order: 1 },
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
        visible: true,
        order: 0,
        items: [
          { id: 'admission', labelUk: 'ДЛЯ ВСТУПУ', labelEn: 'ADMISSION', linkType: 'page', href: '/admission', visible: true, order: 0, itemType: 'cta' },
          { id: 'home',      labelUk: 'Головна',    labelEn: 'Home',      linkType: 'page', href: '/',          visible: true, order: 1 },
          { id: 'contacts',  labelUk: 'Контакти',   labelEn: 'Contacts',  linkType: 'page', href: '/contacts',  visible: true, order: 2 },
          { id: 'history',   labelUk: 'Історія',    labelEn: 'History',   linkType: 'page', href: '/history',   visible: true, order: 3 },
        ],
      },
      {
        id: 'departments',
        labelUk: 'Відділення',
        labelEn: 'Departments',
        visible: true,
        order: 1,
        items: [
          { id: 'theatre',   labelUk: 'Театральне відділення',        labelEn: 'Theatre Department', linkType: 'page', href: '/departments/theatre',   visible: true, order: 0 },
          { id: 'aesthetic', labelUk: 'Відд. естетичного виховання',  labelEn: 'Aesthetic Education', linkType: 'page', href: '/departments/aesthetic', visible: true, order: 1 },
          { id: 'music',     labelUk: 'Музичне відділення',           labelEn: 'Music Department',    linkType: 'page', href: '/departments/music',     visible: true, order: 2 },
          { id: 'art',       labelUk: 'Художнє відділення',           labelEn: 'Art Department',      linkType: 'page', href: '/departments/art',       visible: true, order: 3 },
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
        visible: true,
        order: 0,
        items: [
          { id: 'admission', labelUk: 'ДЛЯ ВСТУПУ', labelEn: 'ADMISSION', linkType: 'page', href: '/admission', visible: true, order: 0, itemType: 'cta' },
          { id: 'home',      labelUk: 'Головна',    labelEn: 'Home',      linkType: 'page', href: '/',          visible: true, order: 1 },
          { id: 'contacts',  labelUk: 'Контакти',   labelEn: 'Contacts',  linkType: 'page', href: '/contacts',  visible: true, order: 2 },
          { id: 'history',   labelUk: 'Історія',    labelEn: 'History',   linkType: 'page', href: '/history',   visible: true, order: 3 },
        ],
      },
      {
        id: 'departments',
        labelUk: 'Відділення',
        labelEn: 'Departments',
        visible: true,
        order: 1,
        items: [
          { id: 'theatre',   labelUk: 'Театральне відділення',        labelEn: 'Theatre Department', linkType: 'page', href: '/departments/theatre',   visible: true, order: 0 },
          { id: 'aesthetic', labelUk: 'Відд. естетичного виховання',  labelEn: 'Aesthetic Education', linkType: 'page', href: '/departments/aesthetic', visible: true, order: 1 },
          { id: 'music',     labelUk: 'Музичне відділення',           labelEn: 'Music Department',    linkType: 'page', href: '/departments/music',     visible: true, order: 2 },
          { id: 'art',       labelUk: 'Художнє відділення',           labelEn: 'Art Department',      linkType: 'page', href: '/departments/art',       visible: true, order: 3 },
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

/** Public read — no auth required (Firestore rules allow settingId == 'header'). */
export async function getHeaderSettings(): Promise<HeaderSettings | null> {
  const docRef = doc(db, "projects", SITE_PROJECT_ID, "settings", "header");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const raw = docSnap.data() as Record<string, any>;

  // Migrate old cta.linkValue → cta.href
  const rawCta = raw.cta ?? {};
  const cta: CtaConfig = {
    ...DEFAULT_HEADER_SETTINGS.cta,
    ...rawCta,
    href: rawCta.href ?? rawCta.linkValue ?? DEFAULT_HEADER_SETTINGS.cta.href,
  };

  const result = {
    cta,
    headerBar:     raw.headerBar     ?? DEFAULT_HEADER_SETTINGS.headerBar,
    navDropdown:   raw.navDropdown   ?? DEFAULT_HEADER_SETTINGS.navDropdown,
    mobileOverlay: raw.mobileOverlay ?? DEFAULT_HEADER_SETTINGS.mobileOverlay,
    debugPanel:    raw.debugPanel    ?? DEFAULT_HEADER_SETTINGS.debugPanel,
    updatedAt:     raw.updatedAt,
  } as HeaderSettings;

  // Cache in localStorage for instant render on next visit
  try {
    const { updatedAt, ...cacheable } = result;
    localStorage.setItem('headerSettings', JSON.stringify(cacheable));
  } catch { /* quota exceeded or SSR — ignore */ }

  return result;
}

/** Read cached header settings from localStorage (sync, instant). */
export function getCachedHeaderSettings(): Omit<HeaderSettings, 'updatedAt'> | null {
  try {
    const cached = localStorage.getItem('headerSettings');
    if (cached) return JSON.parse(cached);
  } catch { /* SSR or corrupted — ignore */ }
  return null;
}

/** Auth-required write. */
export async function updateHeaderSettings(settings: Omit<HeaderSettings, 'updatedAt'>) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "header");
  return await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
}
