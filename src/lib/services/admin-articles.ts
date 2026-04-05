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

const SITE_SCHOOL_ID = import.meta.env.VITE_SCHOOL_ID;

async function getSchoolId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdTokenResult();

  if (token.claims?.role === "superadmin") {
    return SITE_SCHOOL_ID;
  }

  const schoolId = token.claims?.schoolId as string | undefined;
  if (!schoolId) {
    console.warn("No schoolId in token claims, assuming single-tenant mode for backward compatibility or emulator");
    return SITE_SCHOOL_ID; // Fallback for transition
  }
  
  if (schoolId !== SITE_SCHOOL_ID) {
    throw new Error("Token schoolId does not match site schoolId");
  }
  
  return schoolId;
}

export async function fetchAllArticles() {
  const schoolId = await getSchoolId();
  const articlesRef = collection(db, "schools", schoolId, "articles");
  const q = query(articlesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Article[];
}

export async function getAdminArticleById(id: string) {
  const schoolId = await getSchoolId();
  const docRef = doc(db, "schools", schoolId, "articles", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

export async function addArticle(data: Omit<Article, "id" | "createdAt" | "updatedAt">) {
  const schoolId = await getSchoolId();
  
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  
  const docRef = doc(db, "schools", schoolId, "articles", dateId);

  await setDoc(docRef, {
    ...data,
    author: auth.currentUser?.displayName || auth.currentUser?.email || "Адміністрація",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef;
}

export async function updateArticle(articleId: string, data: Partial<Article>) {
  const schoolId = await getSchoolId();
  const ref = doc(db, "schools", schoolId, "articles", articleId);
  return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteArticle(articleId: string) {
  const schoolId = await getSchoolId();
  const ref = doc(db, "schools", schoolId, "articles", articleId);
  return deleteDoc(ref);
}
