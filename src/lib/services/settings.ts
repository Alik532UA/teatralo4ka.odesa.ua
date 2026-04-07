import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

export interface SiteSettings {
  siteTitle: string;
  phone: string;
  email: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  telegramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  updatedAt: any;
}

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

export async function getSettings(): Promise<SiteSettings | null> {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "site");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as SiteSettings;
  }
  return null;
}

export async function updateSettings(settings: Omit<SiteSettings, "updatedAt">) {
  const projectId = await getProjectId();
  const docRef = doc(db, "projects", projectId, "settings", "site");
  return await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
}
