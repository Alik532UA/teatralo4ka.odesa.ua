import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  memoryLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

function perf(label: string) {
  if (typeof window !== 'undefined' && (window as any).__perf) (window as any).__perf(label);
}

perf('firebase/config: module start');
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
perf('firebase/config: initializeApp done');

export const auth = getAuth(app);
perf('firebase/config: getAuth done');
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});
perf('firebase/config: initializeFirestore done (memoryLocalCache)');
export const storage = getStorage(app);
perf('firebase/config: getStorage done');
