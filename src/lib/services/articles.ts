import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  where,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { ArticleSchema } from "../schemas";
import type { ArticleCategory } from "../config/categories";

export type DateMode = 'createdAt' | 'updatedAt' | 'custom' | 'hidden';

export type ContentFormat = 'markdown' | 'html';

export interface ArticleTranslation {
  title: string;
  content: string;
  isPublished: boolean;
  coverUrl?: string;
  contentFormat?: ContentFormat;
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
  // First try direct document ID lookup (backward-compatible date-based IDs)
  const docRef = doc(db, "projects", projectId, "articles", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docToArticle(docSnap);
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

export async function getArticles(lang: string = "uk", publishedOnly: boolean = true, category?: string) {
  const articlesRef = collection(db, "projects", projectId, "articles");
  
  // Фільтр isPublished на рівні запиту обов'язковий для неавторизованих користувачів:
  // Firestore перевіряє rule per-document під час list-запиту, і якщо хоча б один
  // документ не проходить rule (resource.data.isPublished == true для анонімів) —
  // весь запит падає з permission-denied.
  let q = publishedOnly
    ? query(articlesRef, where("isPublished", "==", true), orderBy("createdAt", "desc"))
    : query(articlesRef, orderBy("createdAt", "desc"));
  
  if (category) {
    q = publishedOnly
      ? query(articlesRef, where("isPublished", "==", true), where("category", "==", category), orderBy("createdAt", "desc"))
      : query(articlesRef, where("category", "==", category), orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);
  const allArticles = snapshot.docs.map(d => docToArticle(d));

  // Фільтруємо на рівні клієнта для мультимовності (Firestore не підтримує динамічні ключі в query для перевірки isPublished всередині об'єкта)
  return allArticles.filter(article => {
    const translation = article.translations?.[lang as 'uk' | 'en'];
    if (!translation) return false;
    if (publishedOnly && !translation.isPublished) return false;
    return true;
  });
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
  return snapshot.docs
    .map(d => docToArticle(d))
    .filter(article => {
      const translation = article.translations?.[lang as 'uk' | 'en'];
      return translation && translation.isPublished;
    });
}
