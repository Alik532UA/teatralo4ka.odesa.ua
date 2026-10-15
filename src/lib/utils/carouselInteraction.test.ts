import { describe, it, expect } from 'vitest';
import { tickCarouselProgress } from './carouselInteraction';

describe('tickCarouselProgress', () => {
	it('advances forward when not engaged', () => {
		const res = tickCarouselProgress(0.5, 100, 5000, false);
		expect(res.progress).toBeCloseTo(0.52, 4);
		expect(res.advanced).toBe(false);
	});

	it('signals advanced and wraps to 0 when progress reaches 1', () => {
		const res = tickCarouselProgress(0.99, 100, 5000, false);
		expect(res.progress).toBe(0);
		expect(res.advanced).toBe(true);
	});

	it('rewinds backwards when engaged', () => {
		const res = tickCarouselProgress(0.5, 100, 5000, true);
		expect(res.progress).toBeLessThan(0.5);
		expect(res.progress).toBeGreaterThan(0.48);
		expect(res.advanced).toBe(false);
	});

	it('never rewinds below 3%', () => {
		const res1 = tickCarouselProgress(0.03, 100, 5000, true);
		expect(res1.progress).toBe(0.03);

		const res2 = tickCarouselProgress(0.01, 100, 5000, true);
		expect(res2.progress).toBe(0.03);
	});
});
