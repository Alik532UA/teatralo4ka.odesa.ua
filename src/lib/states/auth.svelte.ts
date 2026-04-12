import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

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
        let foundProfile: any = null;
        let foundByEmail = false;
        let emailDocRef: any = null;

        // 1. Пробуємо за UID
        try {
          const docRef = doc(db, "users", u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundProfile = docSnap.data();
          }
        } catch (e) {
          console.warn("Не вдалося завантажити профіль за UID");
        }

        // 2. Пробуємо за Email
        if (!foundProfile && u.email) {
          try {
            emailDocRef = doc(db, "users", u.email.toLowerCase());
            const emailDocSnap = await getDoc(emailDocRef);
            if (emailDocSnap.exists()) {
              foundProfile = emailDocSnap.data();
              foundByEmail = true;
            }
          } catch (e) {
            console.error("Помилка доступу за Email:", e);
          }
        }

        // 3. Адаптація старої схеми (якщо знайдено schoolId)
        if (foundProfile && foundProfile.schoolId && !foundProfile.projects) {
          foundProfile.projects = {};
          if (foundProfile.schoolId !== 'all') {
            foundProfile.projects[foundProfile.schoolId] = {
              role: foundProfile.role,
              permissions: foundProfile.permissions || { canCreate: true, canEdit: false, canDelete: false }
            };
          }
          if (foundProfile.role === 'superadmin') {
            foundProfile.isSuperAdmin = true;
          }
          // Очищаємо старі поля
          delete foundProfile.schoolId;
          delete foundProfile.permissions;
        }

        // 4. МІГРАЦІЯ Email -> UID
        if (foundByEmail && foundProfile) {
          try {
            // Ensure projectIds exists before migration to avoid rule failures if it was created before the architectural change
            if (!foundProfile.projectIds && foundProfile.projects) {
                foundProfile.projectIds = Object.keys(foundProfile.projects);
            }
            
            await setDoc(doc(db, "users", u.uid), foundProfile);
            await deleteDoc(emailDocRef);
          } catch (e) {
            console.error("Помилка міграції:", e);
          }
        }

        // Гарантуємо наявність об'єкта projects
        if (foundProfile && !foundProfile.projects) {
          foundProfile.projects = {};
        }

        this.profile = foundProfile as UserProfile;
      } else {
        this.profile = null;
      }
      this.loading = false;
      this._resolveInit();
    });
  }

  get isAuthenticated() {
    return !!this.user;
  }

  get isAuthorized() {
    return !!this.profile;
  }
}

export const authService = new AuthService();
