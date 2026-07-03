import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from './storage';
import { STORAGE_PREFIX } from '../config/storage';

/** Minimal in-memory Storage — avoids jsdom's opaque-origin localStorage quirks. */
function makeMemoryStorage(): Storage {
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
		}
	} as Storage;
}

describe('storage facade', () => {
	beforeEach(() => vi.stubGlobal('localStorage', makeMemoryStorage()));
	afterEach(() => vi.unstubAllGlobals());

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
});
