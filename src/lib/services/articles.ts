import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  where,
  limit,
  type QueryConstraint,
  type Timestamp,
  type FieldValue,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { ArticleSchema } from "../schemas";
import type { ArticleCategory } from "../config/categories";
import { getCategoryLabel } from "../config/categories";
import { getContentExcerpt } from "../utils/renderContent";
import { isSafeUrl } from "../utils/safeUrl";
import { cardImageUrl } from "../utils/videoEmbed";
import { PUBLIC_ARTICLES_LIMIT, PUBLIC_PAGES_LIMIT, PUBLIC_PROJECTS_LIMIT } from "../firebase/queryLimits";
import type { ContentCardItem } from "../components/ContentCard.svelte";

export type DateMode = 'createdAt' | 'updatedAt' | 'custom' | 'hidden';

export type ContentFormat = 'markdown' | 'html';

export interface ArticleTranslation {
  title: string;
  content: string;
  excerpt?: string;
  isPublished: boolean;
  coverUrl?: string;
  /**
   * Посилання на відео — YouTube, Vimeo, Instagram, Facebook.
   *
   * Окреме поле, а не «або зображення, або відео»: у новини бувають обидва, і
   * при заповненні обох картка показує відео з кнопкою відтворення.
   */
  videoUrl?: string;
  contentFormat?: ContentFormat;
  externalUrl?: string;
}

export type ContentType = 'article' | 'page' | 'page_project';

export interface Article {
  id?: string;
  slug?: string;
  type?: ContentType;
  category: ArticleCategory | string;
  author: string;
  createdAt: Timestamp | FieldValue | null;
  updatedAt: Timestamp | FieldValue | null;
  dateMode: DateMode;
  customDate?: Timestamp | FieldValue | null;
  sortOrder?: number;
  translations: {
    uk: ArticleTranslation;
    en: ArticleTranslation;
  };
}

const projectId = import.meta.env.VITE_PROJECT_ID;

/**
 * Стаття, прочитана з Firestore: id у неї є завжди, бо це id документа.
 *
 * В `Article` поле необов'язкове — той самий тип описує і ще не збережену
 * форму. Через це посилання в адмінці типізувалися як `string | undefined`,
 * і `${base}/admin/content/${id}` мовчки давало адресу «.../undefined».
 * resolve() такого не приймає, тож різницю довелося назвати.
 */
export type StoredArticle = Article & { id: string };

/** Parse Firestore doc into a validated Article (falls back to raw cast on schema mismatch) */
function docToArticle(docSnap: { id: string; data: () => Record<string, unknown> | undefined }): StoredArticle {
  const raw = { id: docSnap.id, ...(docSnap.data() || {}) };
  const result = ArticleSchema.safeParse(raw);
  return (result.success ? { ...result.data, id: docSnap.id } : raw) as StoredArticle;
}

export async function getArticleById(id: string) {
  // First try direct document ID lookup (backward-compatible date-based IDs).
  // Wrapped in try/catch because Firestore evaluates read rules even for
  // non-existent documents; resource.data.isPublished throws when resource is
  // null, so anonymous reads on missing doc IDs return permission-denied.
  try {
    const docRef = doc(db, "projects", projectId, "articles", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docToArticle(docSnap);
    }
  } catch {
    // Permission denied — either the doc exists but user can't read it,
    // or the doc doesn't exist and the rule denied the anonymous read.
    // Fall through to slug query below.
  }

  // Fallback: treat `id` as a slug and query by slug field.
  // Must include isPublished==true so Firestore security rules allow anonymous access.
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(
    articlesRef,
    where("slug", "==", id),
    where("isPublished", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return docToArticle(snap.docs[0]);
  }

  return null;
}

export async function getArticles(lang: string = "uk", publishedOnly: boolean = true, category?: string, maxItems?: number) {
  const _perf = (l: string) => { if (typeof window !== 'undefined' && window.__perf) window.__perf(l); };
  _perf('getArticles: start');
  const articlesRef = collection(db, "projects", projectId, "articles");
  
  // Фільтр isPublished на рівні запиту обов'язковий для неавторизованих користувачів:
  // Firestore перевіряє rule per-document під час list-запиту, і якщо хоча б один
  // документ не проходить rule (resource.data.isPublished == true для анонімів) —
  // весь запит падає з permission-denied.
  const constraints: QueryConstraint[] = [];
  if (publishedOnly) constraints.push(where("isPublished", "==", true));
  if (category) constraints.push(where("category", "==", category));
  constraints.push(orderBy("createdAt", "desc"));
  // Межа стоїть ЗАВЖДИ (CLOUD-DATABASE-v8 § 7.1). Беремо з запасом на
  // клієнтський фільтр за мовою — нижче відсіюються статті без перекладу, тож
  // рівно `maxItems` документів дали б коротший список, ніж просив виклик.
  // Без `maxItems` (списки «усі новини») межа не зникає, а стає спільною:
  // раніше саме ця гілка читала колекцію статей ЦІЛКОМ, анонімно, на кожній
  // сторінці з віджетом вмісту.
  constraints.push(limit(maxItems ? Math.min(maxItems * 2, PUBLIC_ARTICLES_LIMIT) : PUBLIC_ARTICLES_LIMIT));

  const q = query(articlesRef, ...constraints);

  _perf('getArticles: query built, calling getDocs...');
  const snapshot = await getDocs(q);
  _perf('getArticles: getDocs returned (' + snapshot.docs.length + ' docs)');
  const allArticles = snapshot.docs.map(d => docToArticle(d));

  // Фільтруємо на рівні клієнта для мультимовності (Firestore не підтримує динамічні ключі в query для перевірки isPublished всередині об'єкта)
  const filtered = allArticles.filter(article => {
    const translation = article.translations?.[lang as 'uk' | 'en'];
    if (!translation) return false;
    if (publishedOnly && !translation.isPublished) return false;
    return true;
  });

  return maxItems ? filtered.slice(0, maxItems) : filtered;
}

export function getDisplayDate(article: Article): Timestamp | null {
  switch (article.dateMode) {
    case 'createdAt': return (article.createdAt as Timestamp) ?? null;
    case 'updatedAt': return (article.updatedAt as Timestamp) ?? null;
    case 'custom': return (article.customDate as Timestamp) ?? null;
    case 'hidden': return null;
    default: return (article.createdAt as Timestamp) ?? null;
  }
}

const CARD_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F7FFF7', '#FF9F1C'];

/** Map a Firestore Article to a ContentCardItem for use in ContentWidget. */
export function mapArticleToWidgetItem(article: Article, lang: 'uk' | 'en', index: number): ContentCardItem {
  const tr: ArticleTranslation = article.translations?.[lang] ?? { title: '', content: '', isPublished: false };
  const timestamp = getDisplayDate(article);
  const dateStr = timestamp?.toDate
    ? timestamp.toDate().toLocaleDateString(
        lang === 'uk' ? 'uk-UA' : 'en-US',
        { day: 'numeric', month: 'short', year: 'numeric' }
      )
    : '';
  const customExcerpt = (tr.excerpt || '').trim();
  // Адреса приходить із Firestore і йде прямо в `href` картки на головній та
  // в списках. Непридатна схема (`javascript:`, `data:`) тут відкидається, і
  // картка стає звичайним посиланням на статтю — SECURITY-v8 § 5.1.
  const externalUrl = isSafeUrl(tr.externalUrl?.trim()) ? tr.externalUrl.trim() : '';
  return {
    id: article.id ?? '',
    slug: article.slug,
    title: tr.title || '',
    date: dateStr,
    category: getCategoryLabel(article.category, lang),
    excerpt: customExcerpt || getContentExcerpt(tr.content || '', tr.contentFormat, 150),
    color: CARD_COLORS[index % CARD_COLORS.length],
    // Є і зображення, і відео → на картці зображення. Є лише відео → кадр із
    // нього, якщо платформа його віддає (YouTube). Правило живе в одному місці.
    coverUrl: cardImageUrl(tr.coverUrl, tr.videoUrl),
    videoUrl: (tr.videoUrl || '').trim() || undefined,
    ...(externalUrl ? { href: externalUrl, isExternal: true } : {}),
  };
}

export async function getPageBySlug(slug: string): Promise<Article | null> {
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(
    articlesRef,
    where("type", "==", "page"),
    where("slug", "==", slug),
    where("isPublished", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return docToArticle(snap.docs[0]);
  }
  return null;
}

export async function getAllPages(lang: string = "uk"): Promise<Article[]> {
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(
    articlesRef,
    where("type", "==", "page"),
    where("isPublished", "==", true),
    orderBy("createdAt", "desc"),
    limit(PUBLIC_PAGES_LIMIT)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => docToArticle(d))
    .filter(article => {
      const translation = article.translations?.[lang as 'uk' | 'en'];
      return translation && translation.isPublished;
    });
}

export async function getProjectPageBySlug(slug: string): Promise<Article | null> {
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(
    articlesRef,
    where("type", "==", "page_project"),
    where("slug", "==", slug),
    where("isPublished", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return docToArticle(snap.docs[0]);
  }
  return null;
}

export async function getAllProjects(lang: string = "uk"): Promise<Article[]> {
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(
    articlesRef,
    where("type", "==", "page_project"),
    where("isPublished", "==", true),
    orderBy("createdAt", "desc"),
    limit(PUBLIC_PROJECTS_LIMIT)
  );
  const snapshot = await getDocs(q);
  const filtered = snapshot.docs
    .map(d => docToArticle(d))
    .filter(article => {
      const translation = article.translations?.[lang as 'uk' | 'en'];
      return translation && translation.isPublished;
    });

  function getTimestampMillis(ts: Timestamp | FieldValue | null | undefined): number {
    if (ts && 'toMillis' in ts && typeof ts.toMillis === 'function') {
      return ts.toMillis();
    }
    if (ts && 'toDate' in ts && typeof ts.toDate === 'function') {
      return ts.toDate().getTime();
    }
    return 0;
  }

  // Sort by sortOrder (ascending, nulls last), then by createdAt desc as fallback
  return filtered.sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    const timeA = getTimestampMillis(a.createdAt);
    const timeB = getTimestampMillis(b.createdAt);
    return timeB - timeA;
  });
}
