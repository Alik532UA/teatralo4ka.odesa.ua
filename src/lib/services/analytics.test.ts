import { describe, expect, it, vi, beforeEach } from 'vitest';

let mockDev = true;

vi.mock('$app/environment', () => ({
	browser: true,
	get dev() {
		return mockDev;
	}
}));

describe('teatralo4ka analytics service (dev & test guard & measurement ID)', () => {
	let mockDataLayer: unknown[] = [];

	beforeEach(() => {
		vi.resetModules();
		mockDev = true;
		mockDataLayer = [];

		vi.stubGlobal('window', {
			location: { hostname: 'localhost', origin: 'http://localhost:5195', pathname: '/' },
			get dataLayer() {
				return mockDataLayer;
			},
			set dataLayer(val) {
				mockDataLayer = val;
			}
		});

		vi.stubGlobal('navigator', {
			webdriver: false
		});

		vi.stubGlobal('document', {
			createElement: vi.fn(() => ({})),
			head: {
				appendChild: vi.fn()
			}
		});
	});

	it('мовчить у dev-режимі (ANALYTICS-v9 § 2.1, § 5)', async () => {
		mockDev = true;
		const { track, trackPageView, initAnalytics } = await import('./analytics');
		initAnalytics();
		track('performance_view', { performance_id: '123' });
		trackPageView();

		expect(mockDataLayer).toHaveLength(0);
	});

	it('мовчить на localhost навіть якщо dev: false (захист від превʼю та локальних тестів)', async () => {
		mockDev = false;
		vi.stubGlobal('window', {
			location: { hostname: 'localhost', origin: 'http://localhost:5195', pathname: '/' },
			dataLayer: mockDataLayer
		});

		const { track, trackPageView, initAnalytics } = await import('./analytics');
		initAnalytics();
		track('performance_view', { performance_id: '123' });
		trackPageView();

		expect(mockDataLayer).toHaveLength(0);
	});

	it('мовчить у Playwright/WebDriver (navigator.webdriver = true) навіть на реальному домені', async () => {
		mockDev = false;
		vi.stubGlobal('window', {
			location: { hostname: 'teatralo4ka.odesa.ua', origin: 'https://teatralo4ka.odesa.ua', pathname: '/' },
			dataLayer: mockDataLayer
		});
		vi.stubGlobal('navigator', {
			webdriver: true
		});

		const { track, trackPageView, initAnalytics } = await import('./analytics');
		initAnalytics();
		track('performance_view', { performance_id: '123' });
		trackPageView();

		expect(mockDataLayer).toHaveLength(0);
	});

	it('працює у продакшені (не dev, не localhost, не webdriver)', async () => {
		mockDev = false;
		vi.stubGlobal('window', {
			location: { hostname: 'teatralo4ka.odesa.ua', origin: 'https://teatralo4ka.odesa.ua', pathname: '/' },
			get dataLayer() {
				return mockDataLayer;
			},
			set dataLayer(val) {
				mockDataLayer = val;
			}
		});
		vi.stubGlobal('navigator', {
			webdriver: false
		});

		const { trackPageView, initAnalytics } = await import('./analytics');
		initAnalytics();
		trackPageView();

		expect(mockDataLayer.length).toBeGreaterThan(0);
	});
});
