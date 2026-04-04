import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase/config";

class AuthService {
  user = $state<User | null>(null);
  loading = $state(true);

  constructor() {
    onAuthStateChanged(auth, (u) => {
      this.user = u;
      this.loading = false;
    });
  }

  get isAuthenticated() {
    return !!this.user;
  }
}

export const authService = new AuthService();
