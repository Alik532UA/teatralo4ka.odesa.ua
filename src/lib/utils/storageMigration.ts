import { getStorageKey } from '../config/storage';

const LEGACY_KEYS = [
    // UI/Theme
    'theme', 'backgroundType', 'enableDynamicBackground', 'enableBlurEffect', 'lang', 'debug',
    // Firebase SWR cache
    'homeSettings', 'headerSettings', 'newsPageSettings', 'projectsPageSettings', 'aboutPageSettings',
    // Version
    'app_cache_version',
    // Content views
    'news-view', 'projects-view',
];

/**
 * Migrates legacy localStorage keys to the new prefixed format.
 * Should be called early in the application lifecycle.
 */
export function migrateStorageKeys() {
    if (typeof localStorage === 'undefined') return;

    for (const key of LEGACY_KEYS) {
        const oldValue = localStorage.getItem(key);
        const newKey = getStorageKey(key);
        
        // If legacy key exists and new key doesn't, migrate it
        if (oldValue !== null && localStorage.getItem(newKey) === null) {
            try {
                localStorage.setItem(newKey, oldValue);
                localStorage.removeItem(key);
                console.log(`[StorageMigration] Migrated ${key} -> ${newKey}`);
            } catch (e) {
                console.error(`[StorageMigration] Failed to migrate ${key}:`, e);
            }
        }
    }
}
