import { describe, expect, it, beforeEach, vi } from 'vitest';
import { handleError } from './hooks.client';
import { errorLogger } from '$lib/services/errorLogger';

/**
 * `handleError` — остання сітка перед відвідувачем, і помилитися в ній можна
 * тихо: повернути `error.message` виглядає корисним («хай видно, що сталося»),
 * а насправді це витік нутрощів на публічну сторінку і англійський текст
 * рантайму посеред української (ERROR-HANDLING-v8, CRITICAL).
 *
 * Друга річ, яку тут перевіряють, — що гачок узагалі щось логує. До нього
 * `errorLogger` не був імпортований нізвідки: сервіс із дев'ятьма зеленими
 * тестами, недосяжний із застосунку (AI-AGENT-PITFALLS-v8 § 3).
 */

type HookInput = Parameters<NonNullable<typeof handleError>>[0];

/** Мінімальний `NavigationEvent` — гачку потрібен лише `url`. */
const evt = (pathname: string) =>
	({ url: new URL(`https://teatralo4ka.odesa.ua${pathname}`) }) as HookInput['event'];

/**
 * `HandleClientError` оголошений як `MaybePromise<void | App.Error>`, тож
 * без цієї обгортки кожне звернення до `.errorId` — помилка типів.
 */
async function run(input: HookInput): Promise<App.Error | undefined> {
	return (await handleError(input)) as App.Error | undefined;
}

describe('handleError (клієнт)', () => {
	beforeEach(() => {
		errorLogger.clearCache();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('не віддає технічне повідомлення помилки користувачу', async () => {
		const secret = "Cannot read properties of undefined (reading 'blocks')";

		const result = await run({
			error: new Error(secret),
			event: evt('/news'),
			status: 500,
			message: 'Internal Error'
		});

		expect(result?.message).toBeTruthy();
		expect(result?.message, 'текст рантайму не має потрапляти на сторінку').not.toContain(
			'Cannot read properties'
		);
		expect(JSON.stringify(result), 'жодне поле відповіді не містить тексту помилки').not.toContain(
			secret
		);
	});

	it('записує помилку в логер і віддає той самий errorId', async () => {
		const result = await run({
			error: new Error('boom'),
			event: evt('/projects'),
			status: 500,
			message: 'Internal Error'
		});

		const cache = errorLogger.getCache();
		expect(cache).toHaveLength(1);
		expect(cache[0].message).toBe('boom');
		expect(cache[0].context.page).toBe('/projects');
		expect(result?.errorId, 'без id запис у кеші неможливо знайти').toBe(cache[0].id);
	});

	it('не приймає рядок замість Error і не падає на ньому', async () => {
		await expect(
			run({
				error: 'просто рядок',
				event: evt('/'),
				status: 500,
				message: 'Internal Error'
			})
		).resolves.toBeDefined();

		expect(errorLogger.getCache()[0].message).toBe('просто рядок');
	});

	it('404 не засмічує кеш помилок', async () => {
		await run({
			error: new Error('Not found'),
			event: evt('/nope'),
			status: 404,
			message: 'Not Found'
		});

		expect(errorLogger.getCache()).toHaveLength(0);
	});
});
