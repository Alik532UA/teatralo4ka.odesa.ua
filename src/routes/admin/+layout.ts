import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { authService } from "$lib/states/auth.svelte";

export const prerender = false;
export const ssr = false;

export async function load({ url }) {
  if (!browser) return {};

  const isLoginPage = url.pathname.endsWith("/admin/login");

  // Чекаємо ініціалізації авторизації
  if (authService.loading) {
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (!authService.loading) {
          clearInterval(check);
          resolve(true);
        }
      }, 10);
    });
  }

  if (!authService.isAuthenticated) {
    if (!isLoginPage) {
      goto(`${base}/admin/login`);
    }
    return { user: null, profile: null };
  }

  return {
    user: authService.user,
    profile: authService.profile
  };
}
