import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  where
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { ArticleCategory } from "../config/categories";

export type DateMode = 'createdAt' | 'updatedAt' | 'custom' | 'hidden';

export interface ArticleTranslation {
  title: string;
  content: string;
  isPublished: boolean;
}

export interface Article {
  id?: string;
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

const schoolId = import.meta.env.VITE_SCHOOL_ID;

export async function getArticleById(id: string) {
  const docRef = doc(db, "schools", schoolId, "articles", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

export async function getArticles(lang: string = "uk", publishedOnly: boolean = true, category?: string) {
  const articlesRef = collection(db, "schools", schoolId, "articles");
  
  // Базовий запит (сортування за createdAt, бо це єдине поле, яке гарантовано є в усіх нових записах для індексу)
  let q = query(articlesRef, orderBy("createdAt", "desc"));
  
  if (category) {
    q = query(articlesRef, where("category", "==", category), orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);
  const allArticles = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Article[];

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
