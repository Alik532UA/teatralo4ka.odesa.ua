import { base } from "$app/paths";

const VERSION_URL = `${base}/app-version.json`;
const CACHE_VERSION_KEY = "app_cache_version";

/**
 * Checks for app updates and forces a cache-clearing reload if a new version is available.
 * No user intervention required.
 */
export async function checkForUpdates() {
    if (typeof window === "undefined") return;

    try {
        // Fetch the version from server with cache busting
        const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
            cache: "no-store",
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version;
        const localVersion = localStorage.getItem(CACHE_VERSION_KEY) || "0.0.0";

        // If versions differ, force update
        if (localVersion !== "0.0.0" && localVersion !== serverVersion) {
            console.warn(`[Version] New version available: ${serverVersion} (local: ${localVersion}). Forcing update...`);
            await applyUpdate(serverVersion);
        } else if (localVersion === "0.0.0") {
            // Initial visit: just store the version
            localStorage.setItem(CACHE_VERSION_KEY, serverVersion);
        }
    } catch (error) {
        console.error("[Version] Error during update check:", error);
    }
}

/**
 * Clears caches and reloads the application.
 */
async function applyUpdate(nextVersion: string) {
    try {
        // 1. Clear Service Worker registrations
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
        }

        // 2. Clear Cache Storage API
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
        }

        // 3. Update the local version marker
        localStorage.setItem(CACHE_VERSION_KEY, nextVersion);

        // 4. Perform a hard reload with a unique parameter to bypass HTTP caches
        const url = new URL(window.location.href);
        url.searchParams.set('upd', Date.now().toString());
        window.location.replace(url.toString());
    } catch (e) {
        console.error("[Version] Failed to perform clean update:", e);
        // Fallback to simple reload
        window.location.reload();
    }
}
