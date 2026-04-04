import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface Article {
  id?: string;
  category: "news" | "announcements";
  title: string;
  content: string; // Markdown
  createdAt: any;
  updatedAt: any;
  author: string;
  isPublished: boolean;
  lang: "uk" | "en";
}

const COLLECTION_NAME = "articles";

export async function getArticleById(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

export async function getArticles(category?: string, lang: string = "uk") {
  const articlesRef = collection(db, COLLECTION_NAME);
  let q = query(articlesRef, where("lang", "==", lang), orderBy("createdAt", "desc"));
  
  if (category) {
    q = query(articlesRef, where("category", "==", category), where("lang", "==", lang), orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Article[];
}

export async function addArticle(article: Omit<Article, "id" | "createdAt" | "updatedAt">) {
  const articlesRef = collection(db, COLLECTION_NAME);
  return await addDoc(articlesRef, {
    ...article,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}

export async function updateArticle(id: string, article: Partial<Article>) {
  const articleRef = doc(db, COLLECTION_NAME, id);
  return await updateDoc(articleRef, {
    ...article,
    updatedAt: Timestamp.now()
  });
}

export async function deleteArticle(id: string) {
  const articleRef = doc(db, COLLECTION_NAME, id);
  return await deleteDoc(articleRef);
}
