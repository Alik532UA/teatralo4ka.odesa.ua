import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from './storage';

/**
 * VERSIONING-v8 § 4.1–4.3 — дросель, офлайн і рівень логування.
 *
 * До 2026-08-19 у PROJECT-CONTEXT це стояло рядком боргу з формулюванням
 * «виклик один, тож подвійних запитів немає, але й захисту від них теж». Саме
 * такий борг найдорожчий: він не проявляється зараз і проявиться в тому коміті,
 * який додасть другу точку виклику — а автор того коміту про правило не знатиме.
 *
 * Кожен тест піднімає модуль ЗАНОВО (`vi.resetModules()` + динамічний імпорт):
 * дросель — стан рівня модуля, і без цього другий тест бачив би лічильник
 * першого. Це не церемонія: перший чорновик цієї перевірки був зелений на
 * порожньому місці саме через спільний стан.
 */

const CACHE_KEY = 'app_cache_version';

/** Свіжий модуль із чистим дроселем. */
async function freshModule() {
	vi.resetModules();
	return await import('./version');
}

function mockVersionResponse(version: string) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => ({ version })
	} as unknown as Response);
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

describe('перевірка оновлення', () => {
	beforeEach(() => {
		storage.remove(CACHE_KEY);
		vi.stubGlobal('navigator', { onLine: true });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('перший візит лише запам’ятовує версію (перевірка жива)', async () => {
		const fetchMock = mockVersionResponse('1.2.3');
		const { checkForUpdates } = await freshModule();

		await checkForUpdates();

		expect(fetchMock, 'запиту не було — далі перевіряти нічого').toHaveBeenCalledTimes(1);
		expect(storage.get(CACHE_KEY)).toBe('1.2.3');
	});

	it('два виклики поспіль дають ОДИН запит (§ 4.1)', async () => {
		const fetchMock = mockVersionResponse('1.2.3');
		const { checkForUpdates } = await freshModule();

		await checkForUpdates();
		await checkForUpdates();
		await checkForUpdates();

		expect(
			fetchMock,
			'дросель не діє: повернення до вкладки піднімає і visibilitychange, і focus — ' +
				'два запити поспіль на одне переключення вікна'
		).toHaveBeenCalledTimes(1);
	});

	it('після хвилини перевірка знову можлива (§ 4.1)', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-08-19T00:00:00Z'));
		const fetchMock = mockVersionResponse('1.2.3');
		const { checkForUpdates } = await freshModule();

		await checkForUpdates();
		vi.setSystemTime(new Date('2026-08-19T00:00:59Z'));
		await checkForUpdates();
		expect(fetchMock, 'секунда до межі — ще рано').toHaveBeenCalledTimes(1);

		vi.setSystemTime(new Date('2026-08-19T00:01:01Z'));
		await checkForUpdates();
		expect(
			fetchMock,
			'дросель не відпускає — тоді перевірка оновлення робиться рівно один раз ' +
				'за життя сторінки, і деплой не долітає до відкритої вкладки'
		).toHaveBeenCalledTimes(2);
	});

	it('офлайн запиту немає взагалі (§ 4.2)', async () => {
		vi.stubGlobal('navigator', { onLine: false });
		const fetchMock = mockVersionResponse('1.2.3');
		const { checkForUpdates } = await freshModule();

		await checkForUpdates();

		expect(fetchMock, 'запит, який не може вдатися, не варто відправляти').not.toHaveBeenCalled();
	});

	it('невідомий onLine не вимикає перевірку', async () => {
		// `navigator.onLine` буває `undefined` — і тоді перевірку треба РОБИТИ.
		// Умова `!navigator.onLine` замість `=== false` тихо вимкнула б механізм
		// оновлення в таких середовищах, і це не побачив би ніхто: сторінка
		// працює, просто нова версія до неї більше не доходить.
		vi.stubGlobal('navigator', {});
		const fetchMock = mockVersionResponse('1.2.3');
		const { checkForUpdates } = await freshModule();

		await checkForUpdates();

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('невдала мережа не знімає дросель', async () => {
		// Момент останньої СПРОБИ, а не успіху: інакше сторінка в поганій мережі
		// повторює запит на кожну подію — там, де запитів має бути найменше.
		const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
		vi.stubGlobal('fetch', fetchMock);
		const { checkForUpdates } = await freshModule();

		await checkForUpdates();
		await checkForUpdates();

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('мережева відмова не кидає й не пише в error-канал (§ 4.3)', async () => {
		const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		const { checkForUpdates } = await freshModule();

		await expect(checkForUpdates()).resolves.toBeUndefined();

		expect(spyError, 'офлайн у потоці справжніх помилок топить справжні помилки').not.toHaveBeenCalled();
		expect(spyWarn).toHaveBeenCalled();
		spyError.mockRestore();
		spyWarn.mockRestore();
	});

	it('зламаний файл версії лишається справжньою помилкою (§ 4.3)', async () => {
		// Доки розбір JSON лежав у тому самому try, зіпсований `app-version.json`
		// виглядав як користувач у метро: рівень warn, текст про мережу — і
		// механізм оновлення мовчки не працює вже на ВСІХ відвідувачах.
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => {
					throw new SyntaxError('Unexpected token < in JSON');
				}
			} as unknown as Response)
		);
		const { checkForUpdates } = await freshModule();

		await expect(checkForUpdates()).rejects.toThrow(SyntaxError);
	});

	it('відповідь не-ok не записує версію', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, json: async () => ({ version: '9.9.9' }) } as unknown as Response)
		);
		const { checkForUpdates } = await freshModule();

		await checkForUpdates();

		expect(storage.get(CACHE_KEY)).toBeNull();
	});
});
