# Copilot Instructions — teatralo4ka.odesa.ua

## Project Overview

Website for Odesa Children's Theatre Studio ("Театралочка").  
Hybrid architecture: **static pages** (SSG via Markdown) + **dynamic admin panel** (Firebase CMS, client-side only).  
Deployed to **GitHub Pages** at base path `/teatralo4ka.odesa.ua`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit with `@sveltejs/adapter-static` (SSG, **no SSR**) |
| Language | Svelte 5 (runes mode enforced), TypeScript strict |
| State | Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props` |
| Backend | Firebase Firestore (client SDK), Firebase Auth, Firebase Storage |
| i18n | `svelte-i18n` with uk/en locales |
| Validation | Zod schemas at data boundaries |
| Sanitization | `isomorphic-dompurify` (build-time), `dompurify` (client-side) |
| Rich text | TipTap 3 editor (admin), Marked (Markdown rendering) |
| CSS | Custom properties, light/dark themes, no CSS framework |
| Tests | Vitest + jsdom |

## Critical Constraints

- **No SSR.** `adapter-static` generates static HTML at build time. There are no server-side hooks, no `+page.server.ts` load functions at runtime, no form actions, no CSP nonces, no `$app/server` imports. The `+page.server.ts` files exist only for **build-time prerendering** of Markdown pages.
- **Base path** is `/teatralo4ka.odesa.ua`. Always use `import { base } from '$app/paths'` for links and assets.
- **Svelte 5 runes only.** No `export let`, no `$:` reactive statements, no stores for component state. The `|local` event modifier is deprecated — do not use it.
- **All `{@html}` must be sanitized** with DOMPurify. Build-time content goes through `isomorphic-dompurify` in loader.ts; client-side content uses `dompurify` directly.

## Project Structure

```
src/
├── app.html                    # HTML shell
├── app.d.ts                    # Global type declarations
├── lib/
│   ├── components/
│   │   ├── admin/              # Admin-only components (ArticleForm)
│   │   ├── backgrounds/        # Animated background variants (Particles, Waves, etc.)
│   │   ├── icons/              # SVG icon components
│   │   ├── ui/                 # Reusable UI (Toast, ConfirmModal, RichTextEditor, MenuEditor, LinkPicker, etc.)
│   │   ├── ErrorBoundary.svelte  # <svelte:boundary> wrapper for Firebase-dependent sections
│   │   ├── ContentCard.svelte    # Universal card (carousel/grid/list) — used for news & projects
│   │   ├── ContentWidget.svelte  # Universal carousel/grid/list widget with view switcher
│   │   ├── GalleryCarousel.svelte # Image gallery carousel with keyboard/swipe/wheel nav
│   │   ├── DetailPage.svelte     # Shared article/page detail view (used by [slug], news/[id], projects/[slug])
│   │   ├── StaticPage.svelte     # Renders prerendered Markdown pages (about, history, etc.)
│   │   ├── Projects.svelte       # Homepage/page projects section (wraps ContentWidget)
│   │   ├── Header.svelte         # Site header with nav, theme toggle, lang switch
│   │   ├── Footer.svelte
│   │   ├── Hero.svelte           # Landing hero section
│   │   ├── News.svelte           # Homepage news section (wraps ContentWidget)
│   │   ├── DynamicBackground.svelte  # Animated background switcher
│   │   └── ...
│   ├── config/
│   │   ├── categories.ts        # Article category definitions
│   │   └── static-projects.ts   # Static project definitions (slug, titles, coverUrl, href/externalUrl)
│   ├── controllers/
│   │   └── Carousel.svelte.ts    # Carousel state controller (runes)
│   ├── firebase/
│   │   └── config.ts            # Firebase app init, Firestore with persistent cache
│   ├── i18n/
│   │   ├── index.ts             # svelte-i18n initialization
│   │   ├── loader.ts            # Build-time Markdown loader (gray-matter + marked + DOMPurify)
│   │   ├── schema.ts            # Zod schema for Markdown page frontmatter
│   │   ├── types.ts             # i18n type definitions
│   │   ├── locales/
│   │   │   ├── uk.json          # Ukrainian UI translations
│   │   │   └── en.json          # English UI translations
│   │   └── pages/
│   │       ├── uk/*.md          # Ukrainian static page content (about, history, etc.)
│   │       └── en/*.md          # English static page content
│   ├── schemas/
│   │   ├── index.ts             # ArticleSchema, ArticleTranslationSchema (Zod)
│   │   └── news.ts              # News-specific schemas
│   ├── scripts/
│   │   ├── generate-sitemap.ts  # Sitemap generator (runs post-build)
│   │   ├── generate-changelog.ts
│   │   └── validate-content.ts  # Markdown frontmatter validator (runs pre-build)
│   ├── services/
│   │   ├── articles.ts          # Public article read API (getArticles, getPageBySlug, getAllProjects, etc.)
│   │   ├── admin-articles.ts    # Admin write API (addArticle, updateArticle, deleteArticle, fetchAllContent, generateSlug)
│   │   ├── settings.ts          # Project settings (home, header, news, projects, about, gallery widgets)
│   │   ├── seo.svelte.ts        # SEO meta tag management
│   │   └── errorLogger.ts       # Error logging service
│   ├── states/
│   │   ├── auth.svelte.ts       # Auth state (Firebase Auth, event-based, not polling)
│   │   ├── toast.svelte.ts      # Toast notification state
│   │   └── ui.svelte.ts         # UI state (theme, mobile menu, etc.)
│   ├── styles/
│   │   ├── global.css           # Global styles + CSS custom properties
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   └── utils/
│       ├── carouselInteraction.ts # Shared drag/swipe/wheel logic for all carousels
│       ├── markedConfig.ts       # Shared marked renderer config (external links, monobank fix, XSS escape)
│       ├── renderContent.ts      # Client-side markdown/HTML rendering with DOMPurify
│       └── lazyLoad.ts           # Intersection Observer lazy loading
├── routes/
│   ├── +layout.svelte           # Root layout (Header, Footer, Toast, DynamicBackground)
│   ├── +layout.ts               # i18n init
│   ├── +page.svelte             # Homepage (Hero, News, Departments)
│   ├── +error.svelte            # Error page with i18n
│   ├── about/                   # Static page (prerendered from Markdown)
│   ├── history/                 # Static page
│   ├── admission/               # Static page
│   ├── contacts/                # Static page
│   ├── departments/             # Department subpages (aesthetic, art, music, theatre, graduates)
│   ├── news/                    # News listing + [id] detail (Firebase, client-side)
│   ├── projects/                # Project pages (/{slug}, Firebase, client-side)
│   ├── residents/               # Residents stub
│   ├── [slug]/                  # Dynamic pages from CMS (catch-all, client-side)
│   └── admin/                   # Admin panel (protected, client-side only)
│       ├── +layout.svelte       # Admin layout with auth guard
│       ├── +page.svelte         # Admin dashboard
│       ├── +error.svelte        # Admin error page
│       ├── articles/            # Article CRUD (new, [id]/edit)
│       ├── content/             # Unified content CRUD (new, [id]/edit) — all types
│       ├── pages/               # CMS page CRUD
│       ├── login/               # Firebase Auth login
│       ├── settings/            # Project settings (menu editor, SEO)
│       └── users/               # User management (roles, permissions)
└── static/                      # Static assets (fonts, images, favicons)
```

## Firebase Data Model

Multi-tenant design. All data lives under a project scope.

```
Firestore collections:
├── projects/{projectId}/
│   ├── articles/{articleId}     # News articles, CMS pages & project pages
│   │   ├── type?: string        # 'article' | 'page' | 'page_project'
│   │   ├── slug?: string        # URL slug (regex: /^[a-z0-9_]+$/)
│   │   ├── sortOrder?: number   # Manual sort (0-9999)
│   │   ├── category: string     # 'news' | 'events' | ... | custom 'ukText||enText'
│   │   ├── translations: { uk: {...}, en: {...} }
│   │   │   ├── title, content, isPublished, coverUrl, contentFormat
│   │   │   ├── excerpt?: string  # Short description for cards
│   │   │   └── externalUrl?: string # Redirect URL (e.g. external sites)
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│   └── settings/{settingId}     # 'home', 'header', 'news', 'projects', 'about'
│       ├── home: blocks, newsWidget, projectsWidget, galleryWidget (+mobile variants)
│       ├── header: sections, mobileOverlay, cta, debugPanel, ticker
│       ├── news: newsWidget, mobileNewsWidget
│       ├── projects: projectsWidget, mobileProjectsWidget
│       └── about: galleryWidget, mobileGalleryWidget
└── users/{uid}                  # User profiles, roles, projectIds
```

## Patterns & Conventions

### Static Pages (build-time)
Static pages use the `StaticPage.svelte` component. Content lives in `src/lib/i18n/pages/{lang}/*.md` files with Zod-validated frontmatter. The `+page.server.ts` files use `loader.ts` to parse Markdown at build time. The rendered HTML is sanitized twice: once at build-time (isomorphic-dompurify via `markedConfig.ts`) and once at render-time (dompurify via `renderContent.ts`). Both use the shared `DOMPURIFY_HTML_CONFIG` and `configureMarkedRenderer()` from `markedConfig.ts`.

### Dynamic Pages (client-side)
Firebase-dependent pages load data in `onMount` or `$effect`. Articles are validated through `docToArticle()` which uses Zod schemas with graceful fallback. The `[slug]` catch-all route handles CMS pages. Use `{#key param}` on route components to force remount on param change. Detail pages use the shared `DetailPage.svelte` component with `fetchFn` prop.

### Content Cards & Widgets
- `ContentCard.svelte` — universal card component with `variant` ('carousel' | 'grid' | 'list'), `linkPrefix`, `readMoreLabel`, `testIdPrefix` props
- `ContentWidget.svelte` — universal carousel/grid/list widget with view switcher, autoplay, infinite loop, pinned items
- `GalleryCarousel.svelte` — image-focused carousel with aspect ratio, captions, keyboard navigation
- Carousel interaction logic (drag, swipe, wheel) is shared via `carouselInteraction.ts`

### Widget Configuration (SWR pattern)
All widget configs follow the SWR pattern: instant render from `localStorage` cache, then revalidate from Firestore. Each config has desktop + mobile variants. The `isMobile` detection uses `$state` with `MediaQueryListEvent` listener for reactive switching.

### Error Handling
- `<svelte:boundary>` via `ErrorBoundary.svelte` wraps Firebase-dependent homepage sections
- Root `+error.svelte` and `admin/+error.svelte` handle route-level errors
- Firebase read operations: `catch (e: unknown)` with `e instanceof Error` check
- Zod validation at Firebase read boundaries with fallback, not crash

### i18n
- UI strings: `$t('key.path')` from `svelte-i18n`, keys in `locales/{uk,en}.json`
- In non-reactive contexts (event handlers): `get(t)('key.path')` from `svelte/store`
- Admin strings must also use i18n — no hardcoded Ukrainian text

### State Management
- Component state: `$state`, `$derived`
- Global state: `.svelte.ts` files in `states/` using runes (not Svelte stores)
- Auth: event-based via `onAuthStateChanged`, no polling
- All `$effect` with subscriptions must return cleanup functions

### CSS
- CSS custom properties defined in `global.css` and theme files
- Component-scoped `<style>` blocks (no `:global` unless necessary)
- Color tokens: `--color-sea-blue`, `--color-dark-text`, `--color-ice-blue`, `--color-deep-ocean`, etc.
- Spacing tokens: `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`
- **Primary responsive breakpoint: `1024px`** — standardized across all components
- Avoid inline styles — extract to CSS classes (especially in admin pages)

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (SSG) — also runs validate-content, generate-sitemap, generate-changelog |
| `npm run check` | TypeScript + Svelte diagnostics (must pass with 0 errors, 0 warnings) |
| `npm test -- --run` | Run all tests (42 tests, Vitest) |
| `npm run preview` | Preview production build locally |

## Quality Gates

Before any PR or commit, ensure:
1. `npm run build` — succeeds
2. `npm run check` — 0 errors, 0 warnings
3. `npm test -- --run` — all tests pass
4. No `console.log` in production code (only `console.error` for real errors)
5. No `any` types at public API boundaries (use Zod schemas or explicit types)
6. No `catch (e: any)` — always use `catch (e: unknown)` with `e instanceof Error`
7. Event handlers must use specific types: `(e: Event & { currentTarget: HTMLInputElement })`, not `(e: any)`
