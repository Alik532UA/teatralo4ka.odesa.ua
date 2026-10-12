import { describe, it, expect, beforeEach } from 'vitest';
import { errorLogger, logService, redact } from './errorLogger';

describe('teatralo4ka errorLogger and logService', () => {
	beforeEach(() => {
		errorLogger.clearCache();
	});

	it('tracks errors and increments errorCount', () => {
		expect(errorLogger.errorCount).toBe(0);
		logService.info('app', 'informational note');
		expect(errorLogger.errorCount).toBe(0);

		logService.warn('network', 'temporary timeout');
		expect(errorLogger.errorCount).toBe(0);

		logService.error('app', 'real breakdown');
		expect(errorLogger.errorCount).toBe(1);
	});

	it('scrubs PII such as email and auth tokens', () => {
		const raw = 'Failed for john.doe@example.com with token eyJhbGciOi.secret.token';
		const clean = redact(raw);
		expect(clean).not.toContain('john.doe@example.com');
		expect(clean).toContain('j***@example.com');
		expect(clean).not.toContain('eyJhbGciOi.secret.token');
		expect(clean).toContain('[jwt]');
	});

	it('keeps cache bounded and mirrors correctly', () => {
		for (let i = 0; i < 20; i++) {
			logService.info('app', `event #${i}`);
		}
		expect(errorLogger.getCache().length).toBe(20);
	});
});
