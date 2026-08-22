import { browser, dev } from '$app/environment';
import { storage } from './storage';

const STORAGE_KEY = 'adults_section_revealed';

class AdultsVisibilityState {
	override = $state<boolean | null>(null);

	constructor() {
		if (browser) {
			const stored = storage.get(STORAGE_KEY);
			this.override = stored === '1' ? true : stored === '0' ? false : null;
		}
	}

	/** Чи видимий розділ майстрів на сторінці /residents/adults */
	get isVisible(): boolean {
		return this.override ?? dev;
	}

	/** Розкрити розділ */
	reveal(): void {
		this.override = true;
		if (browser) {
			storage.set(STORAGE_KEY, '1');
		}
	}

	/** Перемкнути видимість розділу */
	toggle(): boolean {
		const next = !this.isVisible;
		this.override = next;
		if (browser) {
			storage.set(STORAGE_KEY, next ? '1' : '0');
		}
		return next;
	}
}

export const adultsVisibility = new AdultsVisibilityState();
