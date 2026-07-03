import { migrateStorageKeys } from '$lib/utils/storageMigration';

/**
 * Client init hook — runs once when the app starts in the browser, before the
 * route modules evaluate. That is early enough to migrate legacy (unprefixed)
 * localStorage keys before controllers/services read them (the `ui` singleton,
 * for example, reads localStorage in its constructor at import time).
 *
 * Placed here rather than in +layout.svelte because +layout imports those
 * controllers at the top, so their storage reads happen before any +layout code.
 */
export function init() {
	migrateStorageKeys();
}
