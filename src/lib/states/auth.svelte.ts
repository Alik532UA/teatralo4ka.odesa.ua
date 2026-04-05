import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export interface UserProfile {
  role: 'superadmin' | 'admin' | 'moderator';
  schoolId: string;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

class AuthService {
  user = $state<User | null>(null);
  profile = $state<UserProfile | null>(null);
  loading = $state(true);

  constructor() {
    onAuthStateChanged(auth, async (u) => {
      this.user = u;
      if (u) {
        try {
          // Завантажуємо профіль з Firestore
          const docRef = doc(db, "users", u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            this.profile = docSnap.data() as UserProfile;
          } else {
            this.profile = null;
          }
        } catch (e) {
          console.error("Помилка завантаження профілю:", e);
          this.profile = null;
        }
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
    // Користувач авторизований, якщо у нього є профіль у цій системі
    return !!this.profile;
  }
}

export const authService = new AuthService();
