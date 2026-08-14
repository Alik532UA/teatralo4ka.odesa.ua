import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, deleteDoc, type DocumentReference } from "firebase/firestore";
import { normalizeProfile, projectIdsFor } from "../services/userProfile";

export interface ProjectAccess {
  role: 'admin' | 'moderator' | 'assistant';
  permissions: {
    // Articles (News, etc.)
    canCreateArticles: boolean;
    canEditArticles: boolean;
    canDeleteArticles: boolean;
    // Pages (Static content)
    canCreatePages: boolean;
    canEditPages: boolean;
    canDeletePages: boolean;
    
    canManageUsers: boolean;
    canManageSettings: boolean;
  };
}

export interface UserProfile {
  isSuperAdmin?: boolean;
  role?: 'superadmin' | 'admin' | 'moderator' | 'assistant'; // для сумісності/глобальних ролей
  projects: Record<string, ProjectAccess>;
  email?: string;
}

class AuthService {
  user = $state<User | null>(null);
  profile = $state<UserProfile | null>(null);
  loading = $state(true);

  private _initResolvers: Array<() => void> = [];

  /** Returns a promise that resolves once the initial auth check completes. */
  waitForInit(): Promise<void> {
    if (!this.loading) return Promise.resolve();
    return new Promise((resolve) => {
      this._initResolvers.push(resolve);
    });
  }

  private _resolveInit() {
    for (const resolve of this._initResolvers) resolve();
    this._initResolvers = [];
  }

  constructor() {
    onAuthStateChanged(auth, async (u) => {
      this.loading = true;
      this.user = u;
      if (u) {
        // Приведення до поточної схеми живе в `services/userProfile.ts` чистою
        // функцією і перевіряється тестами. Тут лишився лише ввід-вивід: до
        // 2026-08-14 обидві частини стояли разом, і найризикованіший код
        // проєкту — вхід плюс міграція з `deleteDoc` — не мав жодного тесту й
        // не міг мати, бо конструктор запускається самим імпортом.
        let profile: UserProfile | null = null;
        let emailDocRef: DocumentReference | null = null;

        // 1. Пробуємо за UID
        try {
          const docSnap = await getDoc(doc(db, "users", u.uid));
          if (docSnap.exists()) profile = normalizeProfile(docSnap.data());
        } catch {
          console.warn("Не вдалося завантажити профіль за UID");
        }

        // 2. Пробуємо за Email
        if (!profile && u.email) {
          try {
            emailDocRef = doc(db, "users", u.email.toLowerCase());
            const emailDocSnap = await getDoc(emailDocRef);
            if (emailDocSnap.exists()) profile = normalizeProfile(emailDocSnap.data());
          } catch (e) {
            console.error("Помилка доступу за Email:", e);
          }
        }

        // 3. МІГРАЦІЯ Email -> UID. Лише якщо профіль знайдено саме за email,
        //    тобто `emailDocRef` заповнений і крок 1 нічого не дав.
        if (profile && emailDocRef) {
          try {
            // `projectIds` обчислюється перед записом: правила Firestore
            // звіряються саме з ним, і профіль, створений до появи мапи
            // `projects`, без цього поля отримує відмову ПРАВИЛА — а не
            // помилку коду, тобто повідомлення ні про що.
            await setDoc(doc(db, "users", u.uid), {
              ...profile,
              projectIds: projectIdsFor(profile)
            });
            await deleteDoc(emailDocRef);
          } catch (e) {
            console.error("Помилка міграції:", e);
          }
        }

        this.profile = profile;
      } else {
        this.profile = null;
      }
      this.loading = false;
      this._resolveInit();
    });
  }

  /**
   * Скидання у початковий стан (SVELTE-CORE-v8 § 1.4).
   *
   * `loading` НЕ повертається в `true`, хоч початкове значення саме таке, і це
   * свідоме відхилення. `loading: true` означає «ще не знаємо, хто це» — стан,
   * з якого виводить лише перший виклик `onAuthStateChanged`. Він уже стався і
   * вдруге від скидання не станеться, тож повернення прапорця залишило б
   * `waitForInit()` невиконаною назавжди, а адмінку — у вічному завантаженні.
   *
   * Тобто скидання веде у стан «ініціалізація пройшла, користувача немає» —
   * рівно те, що потрібно і для виходу з облікового запису, і для тесту.
   */
  reset() {
    this.user = null;
    this.profile = null;
    this.loading = false;
  }

  get isAuthenticated() {
    return !!this.user;
  }

  get isAuthorized() {
    return !!this.profile;
  }
}

export const authService = new AuthService();
