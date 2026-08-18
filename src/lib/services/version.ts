import { asset, base } from "$app/paths";
import { STORAGE_PREFIX } from "../config/storage";
import { storage } from "./storage";
import { errorLogger } from "./errorLogger";

// asset(), а не base: це статичний файл, а не маршрут.
const VERSION_URL = asset('/app-version.json');
const CACHE_VERSION_KEY = "app_cache_version";

/**
 * Мінімальний інтервал між перевірками (VERSIONING-v8 § 4.1).
 *
 * Хвилина, а не секунди: перевірка існує, щоб зловити деплой, а деплої не
 * трапляються частіше. Верхньої межі немає навмисно — застосунок і так живе в
 * межах одного завантаження сторінки, а перезавантаження скидає лічильник.
 */
const MIN_CHECK_INTERVAL_MS = 60_000;

/**
 * Момент останньої СПРОБИ, а не останнього успіху.
 *
 * Різниця важлива: інакше недоступний файл версії знімає дросель, і сторінка в
 * поганій мережі починає повторювати запит на кожну подію — рівно там, де
 * запитів має бути найменше.
 */
let lastCheckAt = 0;

/**
 * Checks for app updates and forces a cache-clearing reload if a new version is available.
 * No user intervention required.
 */
export async function checkForUpdates() {
    if (typeof window === "undefined") return;

    // VERSIONING-v8 § 4.2. Запит, який не може вдатися, не варто відправляти:
    // офлайн він однаково впаде, і єдиним наслідком буде запис у журналі.
    // `=== false` навмисно: у середовищах без Network Information API
    // `navigator.onLine` буває `undefined`, і тоді перевірку треба РОБИТИ, а не
    // пропускати — інакше механізм оновлення тихо вимикається там, де все
    // насправді працює.
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    // VERSIONING-v8 § 4.1. Дросель живе В СЕРВІСІ, а не в місці виклику. Зараз
    // виклик один — з `+layout.svelte` при старті, — але саме тому це варто було
    // зробити зараз: друга точка виклику (`visibilitychange` і `focus` при
    // поверненні до вкладки піднімаються ОБИДВІ) про чужий дросель не знала б, і
    // одне переключення вікна дало б два запити поспіль.
    const now = Date.now();
    if (now - lastCheckAt < MIN_CHECK_INTERVAL_MS) return;
    lastCheckAt = now;

    let response: Response;
    try {
        // Fetch the version from server with cache busting
        response = await fetch(`${VERSION_URL}?t=${now}`, {
            cache: "no-store",
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        // warn, а НЕ error (VERSIONING-v8 § 4.3, HIGH; те саме в ERROR-HANDLING-v8
        // і DEBUGGING-v8). Сюди приходить рівно один клас подій — не вдалося
        // дістати app-version.json: офлайн, вимкнений Wi-Fi, метро, заблокований
        // запит. Це очікувана ситуація, а не збій застосунку: перевірка оновлення
        // просто не відбулася, і наступного разу відбудеться.
        //
        // Рівень тут не косметика. Поки він був error, кожен користувач у метро
        // додавав запис у той самий потік, де мали б бути справжні поломки — і
        // цей потік перестає читати саме через такий шум.
        errorLogger.logWarning(
            'перевірку оновлення пропущено — мережа недоступна',
            { component: 'version' },
            error
        );
        return;
    }

    if (!response.ok) return;

    // ПОЗА try (VERSIONING-v8 § 4.3): у `try` загортається лише мережевий
    // виклик. Зламаний `app-version.json` — не «мережа недоступна», а справжня
    // поломка збірки, і вона мусить лишитися поломкою. Доки розбір лежав у тому
    // самому try, зіпсований файл версії виглядав як користувач у метро: рівень
    // warn, текст про мережу, і механізм оновлення мовчки не працює на всіх.
    const data = await response.json();
    const serverVersion = data.version;
    const localVersion = storage.get(CACHE_VERSION_KEY) || "0.0.0";

    // If versions differ, force update
    if (localVersion !== "0.0.0" && localVersion !== serverVersion) {
        errorLogger.logInfo(
            `нова версія ${serverVersion} (локальна ${localVersion}) — оновлюємо`,
            { component: 'version' }
        );
        await applyUpdate(serverVersion);
    } else if (localVersion === "0.0.0") {
        // Initial visit: just store the version
        storage.set(CACHE_VERSION_KEY, serverVersion);
    }
}

/**
 * Clears caches and reloads the application.
 */
async function applyUpdate(nextVersion: string) {
    try {
        // 1. Unregister ONLY this app's service workers (scoped under our base path).
        //    On a shared origin, getRegistrations() also returns sibling apps'
        //    service workers — filtering by scope keeps us from unregistering theirs.
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const ourScope = location.origin + base + '/';
            await Promise.all(
                registrations
                    .filter(reg => reg.scope.startsWith(ourScope))
                    .map(reg => reg.unregister())
            );
        }

        // 2. Delete ONLY this app's caches (prefixed). caches.keys() is origin-wide
        //    and shared across apps, so never delete unprefixed / siblings' caches.
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter(key => key.startsWith(STORAGE_PREFIX)).map(key => caches.delete(key))
            );
        }

        // 3. Update the local version marker
        storage.set(CACHE_VERSION_KEY, nextVersion);

        // 4. Perform a hard reload with a unique parameter to bypass HTTP caches
        const url = new URL(window.location.href);
        url.searchParams.set('upd', Date.now().toString());
        window.location.replace(url.toString());
    } catch (e) {
        // А ось це — справді несподіване: відмовили serviceWorker.getRegistrations
        // або caches.delete. Тому через errorLogger, а не через голий console:
        // логер маскує чутливе й лишає запис у кеші, на який можна послатися в
        // баг-репорті. Голий console.error не потрапляє нікуди, крім вкладки,
        // яку зараз же перезавантажать рядком нижче.
        errorLogger.logError(e instanceof Error ? e : new Error(String(e)), {
            component: 'version-update'
        });
        // Fallback to simple reload
        window.location.reload();
    }
}
