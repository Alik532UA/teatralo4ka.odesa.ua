import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorLogger, redact } from './errorLogger';

describe('ErrorLogger', () => {
	beforeEach(() => {
		errorLogger.clearCache();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('без crypto.randomUUID логер не кидає — id усе одно є', () => {
		// Поза secure context `crypto` існує, а методу в ньому немає. Логер
		// викликається вже посеред обробки помилки, тож виняток тут перетворив
		// би одну помилку на дві — і другу ловити нема кому.
		vi.stubGlobal('crypto', {});
		const id = errorLogger.logError(new Error('boom'));
		expect(id).toMatch(/^err-\d+/);
		expect(errorLogger.getCache()).toHaveLength(1);
		vi.unstubAllGlobals();
	});

	it('returns an id when logging an error', () => {
		const id = errorLogger.logError(new Error('test'));
		expect(id).toBeTruthy();
		expect(typeof id).toBe('string');
	});

	it('stores error in cache', () => {
		errorLogger.logError(new Error('cached'));
		const cache = errorLogger.getCache();
		expect(cache).toHaveLength(1);
		expect(cache[0].message).toBe('cached');
	});

	it('determines severity for network errors', () => {
		errorLogger.logError(new Error('Network request failed'));
		const event = errorLogger.getCache()[0];
		expect(event.severity).toBe('medium');
	});

	it('determines severity for server errors', () => {
		errorLogger.logError(new Error('500 Internal Server Error'));
		const event = errorLogger.getCache()[0];
		expect(event.severity).toBe('high');
	});

	it('determines severity for memory errors', () => {
		errorLogger.logError(new Error('OutOfMemory exception'));
		const event = errorLogger.getCache()[0];
		expect(event.severity).toBe('critical');
	});

	it('defaults to low severity', () => {
		errorLogger.logError(new Error('some minor issue'));
		expect(errorLogger.getCache()[0].severity).toBe('low');
	});

	it('limits cache to MAX_CACHE entries', () => {
		for (let i = 0; i < 55; i++) {
			errorLogger.logError(new Error(`error ${i}`));
		}
		// MAX_CACHE is 50
		expect(errorLogger.getCache().length).toBeLessThanOrEqual(50);
	});

	it('clearCache empties the cache', () => {
		errorLogger.logError(new Error('x'));
		errorLogger.clearCache();
		expect(errorLogger.getCache()).toHaveLength(0);
	});

	it('accepts optional context', () => {
		errorLogger.logError(new Error('ctx'), { component: 'TestComp', page: '/test' });
		const event = errorLogger.getCache()[0];
		expect(event.context.component).toBe('TestComp');
		expect(event.context.page).toBe('/test');
	});

	/**
	 * SECURITY-v8 § 10: маскує ЛОГЕР, а не місця виклику — достатньо
	 * одного забутого місця, щоб правило перестало діяти.
	 */
	describe('маскування чутливого', () => {
		it('адреса пошти зводиться до першої літери й домену', () => {
			// Текст помилки Firebase Auth часто містить адресу.
			errorLogger.logError(new Error('The user with email director@teatralo4ka.odesa.ua was not found'));
			const logged = errorLogger.getCache()[0].message;
			expect(logged).toContain('d***@teatralo4ka.odesa.ua');
			expect(logged).not.toContain('director@');
		});

		it('токен у рядку запиту зникає разом із значенням', () => {
			errorLogger.logError(
				new Error('GET https://api.example.com/v1?access_token=abc123SECRET&lang=uk 401')
			);
			const logged = errorLogger.getCache()[0].message;
			expect(logged).not.toContain('abc123SECRET');
			expect(logged).toContain('[redacted]');
			expect(logged, 'нечутливі параметри мають лишитися').toContain('lang=uk');
		});

		it('JWT і Bearer не потрапляють у лог', () => {
			// Складається з частин навмисно: цілим рядком він спрацьовує на
			// інваріанті «у джерелах немає вписаних секретів» (src/security.test.ts),
			// і той не має розрізняти справжній токен від тестового — інакше
			// перестав би ловити справжній.
			const jwt = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiIxMjM0NSJ9', 'QWxpY2VTaWduYXR1cmU'].join('.');
			errorLogger.logError(new Error(`Auth failed for ${jwt}`));
			expect(errorLogger.getCache()[0].message).toBe('Auth failed for [jwt]');

			errorLogger.clearCache();
			errorLogger.logError(new Error('Authorization: Bearer ya29.a0AfH6SMBexample_token'));
			expect(errorLogger.getCache()[0].message).toBe('Authorization: Bearer [redacted]');
		});

		it('стек і адреса сторінки маскуються так само', () => {
			const err = new Error('boom');
			err.stack = ['Error: boom', '    at fetch (https://x.test/a?token=SUPERSECRET)'].join('\n');
			errorLogger.logError(err, { page: '/reset?token=SUPERSECRET' });

			const event = errorLogger.getCache()[0];
			expect(event.stack).not.toContain('SUPERSECRET');
			expect(event.context.page).not.toContain('SUPERSECRET');
		});

		it('рівень рахується від замаскованого тексту', () => {
			// '500' усередині токена не має піднімати рівень до high.
			errorLogger.logError(new Error('request failed ?token=aaa500aaa'));
			expect(errorLogger.getCache()[0].severity).toBe('low');
		});

		it('звичайний текст не чіпається', () => {
			const plain = "Cannot read properties of undefined (reading 'blocks')";
			expect(redact(plain)).toBe(plain);
		});
	});
	describe('рівні (DEBUGGING-v8, ERROR-HANDLING-v8)', () => {
		it('logError лишається рівнем error', () => {
			errorLogger.logError(new Error('boom'));
			expect(errorLogger.getCache()[0].level).toBe('error');
		});

		it('logWarning не друкує в console.error', () => {
			// Сенс рівня саме в цьому: очікуваний збій не мусить потрапляти в той
			// потік, де шукають справжні поломки. Поки в логера був один метод,
			// виконати це правило було нічим — і двадцять місць писали в консоль
			// напряму, поза буфером і поза маскуванням.
			const err = vi.spyOn(console, 'error').mockImplementation(() => {});
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			errorLogger.logWarning('офлайн', { component: 'version' });

			expect(err, 'очікуваний збій пішов у console.error').not.toHaveBeenCalled();
			expect(warn).toHaveBeenCalled();
			expect(errorLogger.getCache()[0].level).toBe('warn');
		});

		it('logInfo не друкує в консоль зовсім, але лишається в буфері', () => {
			const err = vi.spyOn(console, 'error').mockImplementation(() => {});
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			errorLogger.logInfo('мову перемкнено');

			expect(err).not.toHaveBeenCalled();
			expect(warn).not.toHaveBeenCalled();
			expect(errorLogger.getCache()).toHaveLength(1);
			expect(errorLogger.getCache()[0].level).toBe('info');
		});

		it('logWarning маскує PII у причині', () => {
			// Головна причина міграції: `console.error(e)` в auth віддавав адресу
			// облікового запису в консоль у відкритому вигляді.
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			errorLogger.logWarning('профіль недоступний', {}, new Error('no access for taras@example.com'));

			const message = errorLogger.getCache()[0].message;
			expect(message).not.toContain('taras@example.com');
			expect(message).toContain('t***@example.com');
		});

		it('getErrors віддає лише помилки', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			vi.spyOn(console, 'warn').mockImplementation(() => {});

			errorLogger.logInfo('подія');
			errorLogger.logWarning('офлайн');
			errorLogger.logError(new Error('справжня поломка'));

			expect(errorLogger.getCache()).toHaveLength(3);
			expect(errorLogger.getErrors()).toHaveLength(1);
			expect(errorLogger.getErrors()[0].message).toBe('справжня поломка');
		});
	});
});
