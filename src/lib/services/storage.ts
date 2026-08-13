import { STORAGE_PREFIX, getStorageKey } from '../config/storage';

/**
 * Storage facade (STORAGE-NAMESPACE-v8).
 *
 * The single entry point for localStorage. It:
 *  - prefixes every key with the project prefix (isolation on a shared origin),
 *  - is SSR-safe (no-ops / returns null when localStorage is unavailable),
 *  - `clear()`s ONLY this app's prefixed keys — never other apps' data,
 *  - **never throws**, whatever the browser does.
 *
 * Prefer this over direct `localStorage.*` calls everywhere except the app.html
 * inline script (which must run pre-hydration and uses the full prefixed key).
 *
 * `session` — той самий фасад над `sessionStorage`, з тими самими гарантіями.
 * Довго його тут не було свідомо («проєкт ним не користується»); знадобився для
 * гарячих новин із частотою «раз на сесію», де потрібне саме життя вкладки:
 * модульний `Set` скидався б на кожному перезавантаженні, а `localStorage`
 * пам'ятав би назавжди.
 *
 * ## Чому «не кидає» — окреме правило, а не дрібниця
 *
 * Раніше фасад лише перевіряв, що `localStorage` існує. Цього досить для SSR і
 * недосить для браузера: сховище може бути на місці й при цьому кидати.
 *
 * - `setItem` кидає `QuotaExceededError` при переповненні — а сюди пишеться
 *   SWR-кеш налаштувань (`homeSettings`, `headerSettings`, три сторінкові);
 * - у приватному режимі частини браузерів запис кидає завжди;
 * - у сторінці в чужому iframe із заблокованим стороннім сховищем кидає вже
 *   сам ДОСТУП до `localStorage` — `SecurityError` летить із `typeof`-перевірки
 *   в старому `ls()`, тобто до будь-якого try/catch у місці виклику.
 *
 * Частина місць виклику це обходила власним try/catch (`services/settings.ts`),
 * частина — ні: перемикання теми, мови, тла, режиму смуги і `ui.applyDefaults`
 * викликали `set` голим. Достатньо одного забутого місця, щоб збій сховища став
 * збоєм застосунку, тому обробка живе тут, а не в місцях виклику.
 */

/**
 * Вимикається назавжди після першої відмови сховища. Без цього кожен наступний
 * виклик знову йшов би в те саме виключення: у приватному режимі воно не
 * тимчасове, а сотні спроб за сесію коштують і часу, і засміченої консолі.
 */
let available = true;

function fail(operation: string, key: string, error: unknown): void {
	if (available) {
		// Одне попередження на сесію, не на виклик.
		console.warn(`[storage] сховище недоступне (${operation} «${key}») — працюємо без нього`, error);
	}
	available = false;
}

function ls(): Storage | null {
	if (!available) return null;
	try {
		return typeof localStorage !== 'undefined' ? localStorage : null;
	} catch (e) {
		// Сам доступ до властивості кидає: iframe без прав на стороннє сховище.
		fail('access', '—', e);
		return null;
	}
}

export const storage = {
	get(key: string): string | null {
		const store = ls();
		if (!store) return null;
		try {
			return store.getItem(getStorageKey(key)) ?? null;
		} catch (e) {
			fail('get', key, e);
			return null;
		}
	},
	/** `false` означає, що значення НЕ збережено — квота, приватний режим або SSR. */
	set(key: string, value: string): boolean {
		const store = ls();
		if (!store) return false;
		try {
			store.setItem(getStorageKey(key), value);
			return true;
		} catch (e) {
			// Втратити збереження прийнятно; втратити застосунок — ні.
			fail('set', key, e);
			return false;
		}
	},
	remove(key: string): void {
		const store = ls();
		if (!store) return;
		try {
			store.removeItem(getStorageKey(key));
		} catch (e) {
			fail('remove', key, e);
		}
	},
	/** Removes only keys owned by this app (prefixed). Safe on a shared origin. */
	clear(): void {
		const store = ls();
		if (!store) return;
		try {
			const toRemove: string[] = [];
			for (let i = 0; i < store.length; i++) {
				const k = store.key(i);
				if (k?.startsWith(STORAGE_PREFIX)) toRemove.push(k);
			}
			toRemove.forEach((k) => store.removeItem(k));
		} catch (e) {
			fail('clear', '*', e);
		}
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
	setJSON(key: string, value: unknown): boolean {
		let raw: string;
		try {
			raw = JSON.stringify(value);
		} catch (e) {
			// Циклічна структура: кидає JSON.stringify, а не сховище. Тому
			// `available` тут НЕ вимикається — сховище справне, зіпсовані дані.
			console.warn(`[storage] значення «${key}» не серіалізується`, e);
			return false;
		}
		return storage.set(key, raw);
	}
};

/**
 * Те саме для `sessionStorage`: живе, поки живе вкладка.
 *
 * Окремий об'єкт, а не прапорець у методах: викликач мусить бачити в місці
 * виклику, наскільки довго значення проживе. `storage.set` і `session.set`
 * читаються по-різному, `storage.set(k, v, { session: true })` — ні.
 */
function ss(): Storage | null {
	if (!available) return null;
	try {
		return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
	} catch (e) {
		fail('access', '—', e);
		return null;
	}
}

export const session = {
	get(key: string): string | null {
		const store = ss();
		if (!store) return null;
		try {
			return store.getItem(getStorageKey(key)) ?? null;
		} catch (e) {
			fail('session.get', key, e);
			return null;
		}
	},
	set(key: string, value: string): boolean {
		const store = ss();
		if (!store) return false;
		try {
			store.setItem(getStorageKey(key), value);
			return true;
		} catch (e) {
			fail('session.set', key, e);
			return false;
		}
	},
	remove(key: string): void {
		const store = ss();
		if (!store) return;
		try {
			store.removeItem(getStorageKey(key));
		} catch (e) {
			fail('session.remove', key, e);
		}
	},
	getJSON<T>(key: string): T | null {
		const raw = session.get(key);
		if (raw === null) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	},
	setJSON(key: string, value: unknown): boolean {
		try {
			return session.set(key, JSON.stringify(value));
		} catch (e) {
			console.warn(`[storage] значення «${key}» не серіалізується`, e);
			return false;
		}
	}
};
