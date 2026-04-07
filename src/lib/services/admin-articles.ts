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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import type { Article } from "./articles";
import type { ArticleCategory } from "../config/categories";

const SITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

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
  const dateId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const docRef = doc(db, "projects", projectId, "articles", dateId);

  // Для сумісності з правилами Firestore isValidArticle:
  // Правила очікують title, content, lang, isPublished на верхньому рівні
  const ukData = data.translations?.uk || { title: 'No Title', content: '', isPublished: false };

  const payloadToSave = {
    // ТІЛЬКИ ті ключі, які дозволені в firestore.rules:
    title: ukData.title || 'Untitled',
    content: ukData.content || '',
    category: data.category,
    lang: 'uk',
    author: auth.currentUser?.displayName || auth.currentUser?.email || "Адміністрація",
    isPublished: ukData.isPublished || false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    coverUrl: ukData.coverUrl || '',
    // Додаткові поля, які були в data (translations, dateMode, customDate)
    translations: data.translations,
    dateMode: data.dateMode,
    customDate: data.customDate
  };

  // DEBUG LOGS
  console.log("=== FIRESTORE WRITE DEBUG ===");
  console.log("Target Project ID:", projectId);
  console.log("Current User UID:", auth.currentUser?.uid);
  console.log("Payload keys:", Object.keys(payloadToSave));
  console.log("Payload values (except content):", { ...payloadToSave, content: `[Length: ${payloadToSave.content.length}]` });
  console.log("title length:", payloadToSave.title.length);
  console.log("content length:", payloadToSave.content.length);
  console.log("category length:", payloadToSave.category.length);
  console.log("============================");

  try {
    await setDoc(docRef, payloadToSave);
  } catch (error: any) {
    console.error("Firestore setDoc Error in addArticle:", error);
    if (error.code === 'permission-denied') {
      throw new Error(`Недостатньо прав для публікації. Перевірте чи всі обов'язкові поля заповнені. Деталі: Title len: ${payloadToSave.title.length}, Content len: ${payloadToSave.content.length}`);
    }
    throw error;
  }

  return docRef;
}

export async function updateArticle(articleId: string, data: Partial<Article>) {
  const projectId = await getProjectId();
  const ref = doc(db, "projects", projectId, "articles", articleId);

  const updatePayload: any = { ...data, updatedAt: serverTimestamp() };

  // Якщо оновлюються переклади, треба оновити і кореневі поля для валідації
  if (data.translations?.uk) {
    updatePayload.title = data.translations.uk.title || 'Untitled';
    updatePayload.content = data.translations.uk.content || '';
    updatePayload.lang = 'uk';
    updatePayload.isPublished = data.translations.uk.isPublished || false;
    updatePayload.coverUrl = data.translations.uk.coverUrl || '';
  }

  // DEBUG LOGS
  console.log("=== FIRESTORE UPDATE DEBUG ===");
  console.log("Target Project ID:", projectId);
  console.log("Current User UID:", auth.currentUser?.uid);
  console.log("Update Payload keys:", Object.keys(updatePayload));
  console.log("==============================");

  try {
    return await updateDoc(ref, updatePayload);
  } catch (error: any) {
    console.error("Firestore updateDoc Error in updateArticle:", error);
    if (error.code === 'permission-denied') {
      throw new Error("Недостатньо прав для оновлення. Перевірте чи не перевищує контент 50 000 символів або чи не минуло менше 20 секунд з останнього редагування.");
    }
    throw error;
  }
}

export async function deleteArticle(articleId: string) {
  const projectId = await getProjectId();
  const ref = doc(db, "projects", projectId, "articles", articleId);
  return deleteDoc(ref);
}
