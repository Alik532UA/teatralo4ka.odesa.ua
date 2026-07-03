import { STORAGE_PREFIX, getStorageKey } from '../config/storage';

/**
 * Storage facade (STORAGE-NAMESPACE-v7).
 *
 * The single entry point for localStorage. It:
 *  - prefixes every key with the project prefix (isolation on a shared origin),
 *  - is SSR-safe (no-ops / returns null when localStorage is unavailable),
 *  - `clear()`s ONLY this app's prefixed keys — never other apps' data.
 *
 * Prefer this over direct `localStorage.*` calls everywhere except the app.html
 * inline script (which must run pre-hydration and uses the full prefixed key).
 *
 * sessionStorage wrapper is intentionally omitted — this project doesn't use it.
 */
function ls(): Storage | null {
	return typeof localStorage !== 'undefined' ? localStorage : null;
}

export const storage = {
	get(key: string): string | null {
		return ls()?.getItem(getStorageKey(key)) ?? null;
	},
	set(key: string, value: string): void {
		ls()?.setItem(getStorageKey(key), value);
	},
	remove(key: string): void {
		ls()?.removeItem(getStorageKey(key));
	},
	/** Removes only keys owned by this app (prefixed). Safe on a shared origin. */
	clear(): void {
		const store = ls();
		if (!store) return;
		const toRemove: string[] = [];
		for (let i = 0; i < store.length; i++) {
			const k = store.key(i);
			if (k?.startsWith(STORAGE_PREFIX)) toRemove.push(k);
		}
		toRemove.forEach((k) => store.removeItem(k));
	},
	getJSON<T>(key: string): T | null {
		const raw = storage.get(key);
		if (raw === null) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	},
	setJSON(key: string, value: unknown): void {
		storage.set(key, JSON.stringify(value));
	}
};
