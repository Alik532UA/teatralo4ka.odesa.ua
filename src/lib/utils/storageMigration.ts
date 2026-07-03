import { getStorageKey } from '../config/storage';

/** Marker set once the one-time legacy→prefixed migration has run (avoids re-scanning). */
const MIGRATION_KEY = getStorageKey('__migrated');

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
 * One-time migration of legacy (unprefixed) localStorage keys to the prefixed
 * format. Must run before controllers/services read storage — wired via the
 * client `init` hook (see src/hooks.client.ts).
 */
export function migrateStorageKeys() {
	if (typeof localStorage === 'undefined') return;
	if (localStorage.getItem(MIGRATION_KEY)) return; // already migrated on this device

	for (const key of LEGACY_KEYS) {
		const oldValue = localStorage.getItem(key);
		const newKey = getStorageKey(key);

		// Only migrate when the legacy key exists and the new key isn't set yet.
		if (oldValue !== null && localStorage.getItem(newKey) === null) {
			try {
				localStorage.setItem(newKey, oldValue);
				localStorage.removeItem(key);
			} catch (e) {
				console.error(`[StorageMigration] Failed to migrate ${key}:`, e);
			}
		}
	}

	try {
		localStorage.setItem(MIGRATION_KEY, 'true');
	} catch {
		// ignore (private mode / quota errors)
	}
}
