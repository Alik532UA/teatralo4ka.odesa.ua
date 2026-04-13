/**
 * Global prefix for all storage keys (localStorage, sessionStorage, etc.)
 * This is CRITICAL for isolation when multiple projects are hosted on the same domain (e.g., GitHub Pages).
 * Each project MUST have a unique prefix.
 */
export const STORAGE_PREFIX = 'teatralo4ka_';

/**
 * Utility to get a prefixed storage key.
 * Always use this instead of hardcoded strings for localStorage/sessionStorage.
 */
export function getStorageKey(key: string): string {
    return STORAGE_PREFIX + key;
}
