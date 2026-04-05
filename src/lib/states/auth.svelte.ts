import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export interface UserProfile {
  role: 'superadmin' | 'admin' | 'moderator' | 'assistant';
  schoolId: string;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  email?: string;
}

class AuthService {
  user = $state<User | null>(null);
  profile = $state<UserProfile | null>(null);
  loading = $state(true);

  constructor() {
    onAuthStateChanged(auth, async (u) => {
      this.user = u;
      if (u) {
        let foundProfile: UserProfile | null = null;

        // 1. Пробуємо за UID
        try {
          const docRef = doc(db, "users", u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundProfile = docSnap.data() as UserProfile;
          }
        } catch (e) {
          console.warn("Не вдалося завантажити профіль за UID (можливо, документа ще немає)");
        }

        // 2. Пробуємо за Email (якщо за UID не знайшли)
        if (!foundProfile && u.email) {
          try {
            const emailDocRef = doc(db, "users", u.email.toLowerCase());
            const emailDocSnap = await getDoc(emailDocRef);
            if (emailDocSnap.exists()) {
              foundProfile = emailDocSnap.data() as UserProfile;
              console.log("Профіль підхоплено за Email:", u.email);
            }
          } catch (e) {
            console.error("Помилка доступу за Email (перевірте Firestore Rules):", e);
          }
        }

        this.profile = foundProfile;
      } else {
        this.profile = null;
      }
      this.loading = false;
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
