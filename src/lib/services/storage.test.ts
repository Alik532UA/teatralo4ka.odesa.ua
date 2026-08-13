import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from './storage';
import { STORAGE_PREFIX } from '../config/storage';

/** Minimal in-memory Storage — avoids jsdom's opaque-origin localStorage quirks. */
function makeMemoryStorage(overrides: Partial<Storage> = {}): Storage {
	const m = new Map<string, string>();
	return {
		get length() {
			return m.size;
		},
		key: (i: number) => Array.from(m.keys())[i] ?? null,
		getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
		setItem: (k: string, v: string) => {
			m.set(k, String(v));
		},
		removeItem: (k: string) => {
			m.delete(k);
		},
		clear: () => {
			m.clear();
		},
		...overrides
	} as Storage;
}

/**
 * Прапорець «сховище відмовило» живе в модулі й не скидається між тестами.
 * Тому кожен тест на відмову бере СВІЙ екземпляр модуля — інакше перший же
 * з них вимкнув би сховище для решти, і ті проходили б з неправильної причини.
 */
async function freshStorage(localStorageStub: unknown) {
	vi.resetModules();
	vi.stubGlobal('localStorage', localStorageStub);
	return (await import('./storage')).storage;
}

describe('storage facade', () => {
	beforeEach(() => vi.stubGlobal('localStorage', makeMemoryStorage()));
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('prefixes every key with the project prefix', () => {
		storage.set('theme', 'dark');
		expect(localStorage.getItem(STORAGE_PREFIX + 'theme')).toBe('dark');
		expect(localStorage.getItem('theme')).toBeNull(); // unprefixed key untouched
		expect(storage.get('theme')).toBe('dark');
	});

	it('remove() deletes the prefixed key', () => {
		storage.set('x', '1');
		storage.remove('x');
		expect(storage.get('x')).toBeNull();
	});

	it('get() returns null for a missing key', () => {
		expect(storage.get('missing')).toBeNull();
	});

	it('clear() removes only prefixed keys, leaving other apps untouched', () => {
		storage.set('a', '1');
		storage.set('b', '2');
		localStorage.setItem('otherapp_theme', 'keep');
		localStorage.setItem('plainkey', 'keep');
		storage.clear();
		expect(storage.get('a')).toBeNull();
		expect(storage.get('b')).toBeNull();
		expect(localStorage.getItem('otherapp_theme')).toBe('keep');
		expect(localStorage.getItem('plainkey')).toBe('keep');
	});

	it('getJSON/setJSON round-trip objects and arrays', () => {
		storage.setJSON('cfg', { a: 1, b: [2, 3], c: 'x' });
		expect(storage.getJSON('cfg')).toEqual({ a: 1, b: [2, 3], c: 'x' });
	});

	it('getJSON() returns null for invalid JSON', () => {
		storage.set('bad', '{not valid json');
		expect(storage.getJSON('bad')).toBeNull();
	});

	it('getJSON() returns null for a missing key', () => {
		expect(storage.getJSON('missing')).toBeNull();
	});

	it('is SSR-safe when localStorage is unavailable', () => {
		vi.stubGlobal('localStorage', undefined);
		expect(() => storage.set('x', '1')).not.toThrow();
		expect(storage.get('x')).toBeNull();
		expect(storage.getJSON('x')).toBeNull();
		expect(() => storage.remove('x')).not.toThrow();
		expect(() => storage.clear()).not.toThrow();
	});

	it('успішний запис повертає true', () => {
		expect(storage.set('k', 'v')).toBe(true);
		expect(storage.setJSON('k2', { a: 1 })).toBe(true);
	});

	/**
	 * Сховище, яке є, але кидає. Симптом у продакшні: перемикання теми, мови
	 * чи режиму смуги падає з необробленою помилкою — усі ці місця викликають
	 * `storage.set` без власного try/catch.
	 */
	describe('сховище є, але кидає', () => {
		it('переповнена квота не валить застосунок і повертає false', async () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const s = await freshStorage(
				makeMemoryStorage({
					setItem: () => {
						throw new DOMException('quota', 'QuotaExceededError');
					}
				})
			);

			expect(() => s.set('k', 'v')).not.toThrow();
			expect(s.set('k', 'v'), 'невдале збереження має повертати false').toBe(false);
			expect(s.setJSON('k', { a: 1 })).toBe(false);
		});

		it('getItem, що кидає, дорівнює відсутньому значенню', async () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const s = await freshStorage(
				makeMemoryStorage({
					getItem: () => {
						throw new DOMException('denied', 'SecurityError');
					}
				})
			);

			expect(s.get('k')).toBeNull();
			expect(s.getJSON('k')).toBeNull();
		});

		it('доступ до самого localStorage, що кидає, не валить жоден метод', async () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			vi.resetModules();
			// Сторінка в чужому iframe із заблокованим стороннім сховищем: кидає
			// не setItem, а ЧИТАННЯ властивості — тобто ще до будь-якого виклику.
			Object.defineProperty(globalThis, 'localStorage', {
				configurable: true,
				get() {
					throw new DOMException('blocked', 'SecurityError');
				}
			});
			const s = (await import('./storage')).storage;

			expect(() => s.set('k', 'v')).not.toThrow();
			expect(() => s.remove('k')).not.toThrow();
			expect(() => s.clear()).not.toThrow();
			expect(s.get('k')).toBeNull();
			expect(s.set('k', 'v')).toBe(false);

			delete (globalThis as { localStorage?: unknown }).localStorage;
		});

		it('після першої відмови попередження друкується один раз, а не на кожен виклик', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const s = await freshStorage(
				makeMemoryStorage({
					setItem: () => {
						throw new DOMException('quota', 'QuotaExceededError');
					}
				})
			);

			s.set('a', '1');
			s.set('b', '2');
			s.set('c', '3');

			expect(warn).toHaveBeenCalledTimes(1);
		});

		it('значення, яке не серіалізується, не вимикає сховище', async () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const s = await freshStorage(makeMemoryStorage());

			const cyclic: Record<string, unknown> = {};
			cyclic.self = cyclic;

			expect(s.setJSON('bad', cyclic)).toBe(false);
			// Сховище справне — зіпсовані були дані, а не воно.
			expect(s.set('good', 'v')).toBe(true);
		});
	});
});
