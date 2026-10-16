import { describe, expect, it, vi, afterEach } from 'vitest';
import { ensureFontsReady, E_UKRAINE_FONT_TARGETS } from './fonts';

describe('ensureFontsReady', () => {
	const originalDocument = globalThis.document;

	afterEach(() => {
		globalThis.document = originalDocument;
		vi.restoreAllMocks();
	});

	it('безпечно завершується в SSR середовищі без document', async () => {
		// @ts-expect-error - емуляція відсутності document
		delete globalThis.document;
		await expect(ensureFontsReady()).resolves.toBeUndefined();
	});

	it('завантажує всі цільові начерки e-Ukraine та чекає document.fonts.ready', async () => {
		const loadMock = vi.fn().mockResolvedValue([]);
		const mockFontFaceSet = {} as FontFaceSet;
		const readyPromise = Promise.resolve(mockFontFaceSet);

		globalThis.document = {
			fonts: {
				load: loadMock,
				ready: readyPromise
			}
		} as unknown as Document;

		await ensureFontsReady();

		expect(loadMock).toHaveBeenCalledTimes(E_UKRAINE_FONT_TARGETS.length);
		for (const target of E_UKRAINE_FONT_TARGETS) {
			expect(loadMock).toHaveBeenCalledWith(target);
		}
	});

	it('не кидає виняток, якщо document.fonts.load впав з помилкою', async () => {
		const loadMock = vi.fn().mockRejectedValue(new Error('Font decode error'));

		globalThis.document = {
			fonts: {
				load: loadMock,
				ready: Promise.resolve({} as FontFaceSet)
			}
		} as unknown as Document;

		await expect(ensureFontsReady()).resolves.toBeUndefined();
	});
});
