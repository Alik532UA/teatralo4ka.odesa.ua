import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from './storage';

vi.mock('$app/environment', () => ({
	browser: true,
	dev: false,
	building: false,
	version: 'test'
}));

const STORAGE_KEY = 'adults_section_revealed';

async function freshModule() {
	vi.resetModules();
	return await import('./adultsVisibility.svelte');
}

describe('adultsVisibility', () => {
	beforeEach(() => {
		storage.remove(STORAGE_KEY);
	});

	afterEach(() => {
		storage.remove(STORAGE_KEY);
		vi.unstubAllGlobals();
	});

	it('reveal() робить розділ видимим і зберігає стан', async () => {
		const { adultsVisibility } = await freshModule();
		adultsVisibility.reveal();

		expect(adultsVisibility.isVisible).toBe(true);
		expect(storage.get(STORAGE_KEY)).toBe('1');
	});

	it('toggle() перемикає стан', async () => {
		const { adultsVisibility } = await freshModule();
		const first = adultsVisibility.toggle();
		expect(first).toBe(adultsVisibility.override);
		expect(adultsVisibility.isVisible).toBe(first);
	});
});
