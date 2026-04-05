import { 
  doc, 
  getDoc, 
  setDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";

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

const SETTINGS_DOC_ID = "global_settings";
const COLLECTION_NAME = "settings";

export async function getSettings(): Promise<SiteSettings | null> {
  const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as SiteSettings;
  }
  return null;
}

export async function updateSettings(settings: Omit<SiteSettings, "updatedAt">) {
  const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
  return await setDoc(docRef, {
    ...settings,
    updatedAt: Timestamp.now()
  });
}
