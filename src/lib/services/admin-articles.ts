import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  deleteField,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import type { Article } from "./articles";
import { get } from 'svelte/store';
import { t } from 'svelte-i18n';

const SITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

/**
 * Generates a URL-safe slug from an English title.
 * Spaces → underscore, removes all non [a-z0-9_] characters, lowercases.
 */
export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const RESERVED_SLUGS = ['admin', 'about', 'admission', 'contacts', 'departments', 'history', 'news', 'projects', 'residents', 'sitemap', 'test', 'api', 'auth', 'login'];
  if (RESERVED_SLUGS.includes(slug)) {
    return `${slug}_page`;
  }

  return slug;
}

/** Returns true if the slug is not used by any other article in the project. */
async function checkSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  const projectId = await getProjectId();
  const articlesRef = collection(db, 'projects', projectId, 'articles');
  const q = query(articlesRef, where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return true;
  if (excludeId && snap.docs[0].id === excludeId) return true;
  return false;
}

async function getProjectId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdTokenResult();

  // If superadmin, they can work with any project defined in env
  if (token.claims?.role === "superadmin") {
    return SITE_PROJECT_ID;
  }

  // If regular admin, they must have a projectId claim
  const tokenProjectId = token.claims?.projectId as string | undefined;
  
  if (tokenProjectId) {
    return tokenProjectId;
  }

  // Fallback if no projectId in token (backward compatibility)
  console.warn("No projectId in token claims, using SITE_PROJECT_ID");
  return SITE_PROJECT_ID;
}

export async function fetchAllArticles() {
  const projectId = await getProjectId();
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(articlesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Article[];
  return all.filter(a => a.type !== 'page' && a.type !== 'page_project');
}

export async function fetchAllPages() {
  const projectId = await getProjectId();
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(articlesRef, where("type", "==", "page"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Article[];
}

export async function fetchAllContent() {
  const projectId = await getProjectId();
  const articlesRef = collection(db, "projects", projectId, "articles");
  const q = query(articlesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Article[];
}

export async function getAdminArticleById(id: string) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "articles", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

export async function addArticle(data: Omit<Article, "id" | "createdAt" | "updatedAt">) {
  const projectId = await getProjectId();

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8);
  const dateId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}-${rand}`;

  const docRef = doc(db, "projects", projectId, "articles", dateId);

  // Validate and resolve slug
  const rawSlug = (data.slug ?? '').trim();
  let finalSlug: string | undefined;
  if (rawSlug) {
    const isUnique = await checkSlugUnique(rawSlug);
    if (!isUnique) {
      throw new Error(get(t)('admin.editor.slugUsed', { values: { slug: rawSlug } }));
    }
    finalSlug = rawSlug;
  }

  // Для сумісності з правилами Firestore isValidArticle:
  // Правила очікують title, content, lang, isPublished на верхньому рівні.
  // isPublished = true якщо будь-який переклад опубліковано (для Firestore read rule).
  const ukData = data.translations?.uk || { title: 'No Title', content: '', isPublished: false };
  const enData = data.translations?.en;
  const isPublished = (ukData.isPublished || false) || (enData?.isPublished || false);

  const payloadToSave: any = {
    // ТІЛЬКИ ті ключі, які дозволені в firestore.rules:
    title: ukData.title || 'Untitled',
    content: ukData.content || '',
    category: data.category,
    lang: 'uk',
    author: auth.currentUser?.displayName || auth.currentUser?.email || get(t)('admin.editor.defaultAuthor'),
    isPublished,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    coverUrl: ukData.coverUrl || '',
    // Додаткові поля, які були в data (translations, dateMode, customDate)
    translations: data.translations,
    dateMode: data.dateMode,
    customDate: data.customDate,
    ...(data.type ? { type: data.type } : {}),
    ...(data.sortOrder != null ? { sortOrder: data.sortOrder } : {})
  };

  if (finalSlug) {
    payloadToSave.slug = finalSlug;
  }

  try {
    await setDoc(docRef, payloadToSave);
  } catch (error: any) {
    console.error("Firestore setDoc Error in addArticle:", error);
    if (error.code === 'permission-denied') {
      throw new Error(get(t)('admin.editor.publishDenied'));
    }
    throw error;
  }

  return docRef;
}

export async function updateArticle(articleId: string, data: Partial<Article>) {
  const projectId = await getProjectId();
  const ref = doc(db, "projects", projectId, "articles", articleId);

  // Extract slug and sortOrder before spreading to handle them separately
  const { slug: rawSlug, sortOrder, ...dataWithoutSlugAndSort } = data;
  const updatePayload: any = { ...dataWithoutSlugAndSort, updatedAt: serverTimestamp() };

  // Handle slug update
  if (rawSlug !== undefined) {
    if (rawSlug === '') {
      // Explicitly removed by user — delete field from Firestore
      updatePayload.slug = deleteField();
    } else {
      const isUnique = await checkSlugUnique(rawSlug, articleId);
      if (!isUnique) {
        throw new Error(get(t)('admin.editor.slugUsed', { values: { slug: rawSlug } }));
      }
      updatePayload.slug = rawSlug;
    }
  }

  // Handle sortOrder update: null/undefined → remove field, number → set
  if (sortOrder != null) {
    updatePayload.sortOrder = sortOrder;
  } else if ('sortOrder' in data) {
    updatePayload.sortOrder = deleteField();
  }

  // Якщо оновлюються переклади, треба оновити і кореневі поля для валідації.
  // isPublished = true якщо будь-який переклад опубліковано (для Firestore read rule).
  if (data.translations?.uk) {
    const isPublishedUk = data.translations.uk.isPublished || false;
    const isPublishedEn = data.translations.en?.isPublished || false;
    updatePayload.title = data.translations.uk.title || 'Untitled';
    updatePayload.content = data.translations.uk.content || '';
    updatePayload.lang = 'uk';
    updatePayload.isPublished = isPublishedUk || isPublishedEn;
    updatePayload.coverUrl = data.translations.uk.coverUrl || '';
  }

  try {
    return await updateDoc(ref, updatePayload);
  } catch (error: any) {
    console.error("Firestore updateDoc Error in updateArticle:", error);
    if (error.code === 'permission-denied') {
      throw new Error(get(t)('admin.editor.updateDenied'));
    }
    throw error;
  }
}

export async function deleteArticle(articleId: string) {
  const projectId = await getProjectId();
  const ref = doc(db, "projects", projectId, "articles", articleId);
  return deleteDoc(ref);
}
