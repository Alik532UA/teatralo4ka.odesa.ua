import { describe, expect, it } from 'vitest';
import { visibilityFromUrl } from './urlParams';

describe('visibilityFromUrl', () => {
	it('«1» повертає true, «0» повертає false', () => {
		expect(visibilityFromUrl('1')).toBe(true);
		expect(visibilityFromUrl('0')).toBe(false);
	});

	it.each([null, '', 'yes', 'true', '2', 'early', 'adults'])('%o нічого не просить (null)', (value) => {
		expect(visibilityFromUrl(value)).toBeNull();
	});
});
