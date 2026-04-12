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
} from "firebase/firestore";
import { db } from "../firebase/config";
import { ArticleSchema } from "../schemas";
import type { ArticleCategory } from "../config/categories";
import { getCategoryLabel } from "../config/categories";
import { getContentExcerpt } from "../utils/renderContent";
import type { ContentCardItem } from "../components/ContentCard.svelte";

export type DateMode = 'createdAt' | 'updatedAt' | 'custom' | 'hidden';

export type ContentFormat = 'markdown' | 'html';

export interface ArticleTranslation {
  title: string;
  content: string;
  excerpt?: string;
  isPublished: boolean;
  coverUrl?: string;
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
  createdAt: any;
  updatedAt: any;
  dateMode: DateMode;
  customDate?: any;
  sortOrder?: number;
  translations: {
    uk: ArticleTranslation;
    en: ArticleTranslation;
  };
}

const projectId = import.meta.env.VITE_PROJECT_ID;

/** Parse Firestore doc into a validated Article (falls back to raw cast on schema mismatch) */
function docToArticle(docSnap: { id: string; data: () => any }): Article {
  const raw = { id: docSnap.id, ...docSnap.data() };
  const result = ArticleSchema.safeParse(raw);
  return (result.success ? result.data : raw) as Article;
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
  const _perf = (l: string) => { if (typeof window !== 'undefined' && (window as any).__perf) (window as any).__perf(l); };
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
  // Fetch extra to account for client-side i18n filtering, but still limit the query
  if (maxItems) constraints.push(limit(maxItems * 2));

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

export function getDisplayDate(article: Article): any {
  switch (article.dateMode) {
    case 'createdAt': return article.createdAt;
    case 'updatedAt': return article.updatedAt;
    case 'custom': return article.customDate;
    case 'hidden': return null;
    default: return article.createdAt;
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
  const externalUrl = (tr.externalUrl || '').trim();
  return {
    id: article.id ?? '',
    slug: article.slug,
    title: tr.title || '',
    date: dateStr,
    category: getCategoryLabel(article.category, lang),
    excerpt: customExcerpt || getContentExcerpt(tr.content || '', tr.contentFormat, 150),
    color: CARD_COLORS[index % CARD_COLORS.length],
    coverUrl: tr.coverUrl || '',
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
    orderBy("createdAt", "desc")
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
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  const filtered = snapshot.docs
    .map(d => docToArticle(d))
    .filter(article => {
      const translation = article.translations?.[lang as 'uk' | 'en'];
      return translation && translation.isPublished;
    });

  // Sort by sortOrder (ascending, nulls last), then by createdAt desc as fallback
  return filtered.sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return timeB - timeA;
  });
}
