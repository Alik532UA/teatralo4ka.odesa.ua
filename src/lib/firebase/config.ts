import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { errorLogger } from "../services/errorLogger";

/*
 * КОНФІГ СТОЇТЬ ТУТ, А НЕ ПРИЇЖДЖАЄ ЗІ ЗМІННИХ CI.
 *
 * Значення публічні за побудовою: вони в бандлі, який качає кожен відвідувач.
 * Межу безпеки тримають `firebase/firestore.rules`, App Check нижче й перелік
 * дозволених доменів (SECURITY-v9 § 4.1, § 4.2.1 `SEC-CONFIG-IN-SOURCE`).
 *
 * Змінні дають рівно одне: зібрати той самий код під іншу базу. Такого
 * сценарію тут немає — проєкт Firebase один (`promo-web-hub`), і всі три
 * воркфлоу (`deploy`, `deep-checks`, `lighthouse`) збирають під нього ж.
 *
 * Натомість вони коштували трьох речей: значення жило в трьох місцях
 * (локальний `.env`, Variables, Secrets); `git clone && npm run dev` не
 * працював без `.env`; і жодне зі значень не було ні в рев'ю, ні в історії.
 *
 * Межа: щойно з'явиться ДРУГА база — значення повертаються у змінні, бо вшите
 * в бандл перецілити неможливо.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDfnmoi1nBuvlLbGntyuSHB_0oeYV0A28g",
  authDomain: "promo-web-hub.firebaseapp.com",
  projectId: "promo-web-hub",
  storageBucket: "promo-web-hub.firebasestorage.app",
  messagingSenderId: "977853986252",
  appId: "1:977853986252:web:f73f74b67e19d0d74f9969"
} as const;

function perf(label: string) {
  if (typeof window !== 'undefined' && window.__perf) window.__perf(label);
}

perf('firebase/config: module start');
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
perf('firebase/config: initializeApp done');

// ── App Check (reCAPTCHA v3) ────────────────────────────────────────────────
// Основний захист від скриптів/ботів, що б'ють по Firestore API напряму
// (напр. зі скопійованого коду). Працює НЕВИДИМО — живих користувачів не турбує.
// Site key — публічний за побудовою: reCAPTCHA віддає його в розмітку кожної
// сторінки, і він прив'язаний до переліку доменів, тобто з чужого домену не
// працює взагалі. «Конфігурація per-deploy», заради якої він лежав у env,
// ніколи не знадобилася: розгортання одне (SECURITY-v9 § 4.2.1).
//
// А ось `VITE_APPCHECK_DEBUG_TOKEN` нижче — СПРАВЖНІЙ секрет, попри той самий
// префікс `VITE_`: він обходить перевірку цілком. Тому його немає ні в
// змінних, ні в секретах репозиторію — лише в локальному `.env`, і лише в
// `DEV`. Ознака секретності не в префіксі, а у відповіді на питання «що зможе
// той, хто це прочитає».
//
// Локальна розробка: виставте VITE_APPCHECK_DEBUG_TOKEN (debug-токен з консолі),
// бо reCAPTCHA v3 прив'язана до зареєстрованих доменів і не працює на localhost.
// Ініціалізуємо ДО перших звернень до Firestore, лише в браузері.
const appCheckSiteKey = "6LfzIKosAAAAABkRJFx_vi1_iT5W8H45vDAMRd_m";
if (typeof window !== 'undefined') {
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
    errorLogger.logWarning('App Check не піднявся — працюємо без нього', { component: 'firebase' }, e);
  }
}

export const auth = getAuth(app);
perf('firebase/config: getAuth done');
// memoryLocalCache замість persistentLocalCache:
// persistentLocalCache (IndexedDB) блокує перший getDoc/getDocs на 10-22с
// на Android Chrome через повільну ініціалізацію IndexedDB (баг Chromium).
// Offline persistence не потрібна — SWR через localStorage покриває повторні візити.
// Детальніше: firebase-admin/performance-optimization.md
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;
perf('firebase/config: initializeFirestore done (memoryLocalCache)');
export const storage = getStorage(app);
perf('firebase/config: getStorage done');
