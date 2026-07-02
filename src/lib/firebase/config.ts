import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
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

// ── App Check (reCAPTCHA v3) ────────────────────────────────────────────────
// Основний захист від скриптів/ботів, що б'ють по Firestore API напряму
// (напр. зі скопійованого коду). Працює НЕВИДИМО — живих користувачів не турбує.
// Site key — публічний, але тримаємо в env для конфігурації per-deploy.
// Локальна розробка: виставте VITE_APPCHECK_DEBUG_TOKEN (debug-токен з консолі),
// бо reCAPTCHA v3 прив'язана до зареєстрованих доменів і не працює на localhost.
// Ініціалізуємо ДО перших звернень до Firestore, лише в браузері.
const appCheckSiteKey = import.meta.env.VITE_APPCHECK_RECAPTCHA_SITE_KEY as string | undefined;
if (typeof window !== 'undefined' && appCheckSiteKey) {
  const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined;
  if (import.meta.env.DEV && debugToken) {
    // 'true' → SDK сам згенерує токен і надрукує його в консоль (скопіюй у
    // Firebase → App Check → Manage debug tokens). Інакше — конкретний токен.
    // @ts-expect-error — глобальний прапорець, який читає App Check SDK у dev-режимі
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken === 'true' ? true : debugToken;
  }
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    perf('firebase/config: App Check initialized');
  } catch (e) {
    // Не блокуємо застосунок, якщо App Check не піднявся (напр. повторна ініціалізація при HMR).
    console.warn('App Check init skipped:', e);
  }
} else if (typeof window !== 'undefined') {
  console.info('App Check вимкнено: не задано VITE_APPCHECK_RECAPTCHA_SITE_KEY.');
}

export const auth = getAuth(app);
perf('firebase/config: getAuth done');
// memoryLocalCache замість persistentLocalCache:
// persistentLocalCache (IndexedDB) блокує перший getDoc/getDocs на 10-22с
// на Android Chrome через повільну ініціалізацію IndexedDB (баг Chromium).
// Offline persistence не потрібна — SWR через localStorage покриває повторні візити.
// Детальніше: firebase-admin/performance-optimization.md
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});
perf('firebase/config: initializeFirestore done (memoryLocalCache)');
export const storage = getStorage(app);
perf('firebase/config: getStorage done');
