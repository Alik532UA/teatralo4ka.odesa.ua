import { browser } from '$app/environment';
import { storage } from './storage';

/**
 * ІМЕНОВАНІ НАБОРИ КОЛЬОРІВ — «А чи Б» без виходу з панелі.
 *
 * ## Навіщо, коли вже є вставка блоку
 *
 * Вставка повертає вчорашній варіант — але через файл: скопіювати, зберегти,
 * знайти, вставити. Порівняти два варіанти між собою вона не допомагає зовсім,
 * а саме це дизайнер і робить найчастіше: «світліше тло чи темніше», «акцент
 * теплий чи холодний». Доти таке порівняння означало тримати другий варіант у
 * голові.
 *
 * Тому набори — не заміна вставці, а сусідній крок: вставка про обмін із
 * файлами, набори про перебір усередині сеансу.
 *
 * ## Чому окремий модуль, а не поле в `themeLab`
 *
 * У сервісі лабораторії живе стан ОДНОГО набору — того, що зараз на екрані. Це
 * інша відповідальність: сховище кількох, з іменами й видаленням. Тримати їх
 * разом означало б, що файл відповідає і за «який колір зараз», і за «які
 * набори є», — і стеля розміру тут лише наслідок, а не причина.
 *
 * ## Чому власний ключ сховища
 *
 * Набори мусять пережити «Скинути все»: скидання стосується поточної правки, а
 * не бібліотеки. В одному записі зі станом панелі вони б зникали разом із ним
 * при кожному зіпсованому JSON.
 */

const КЛЮЧ = 'theme_lab_presets';

/** Збережений набір: ім'я, кольори й коли записано. */
export interface LabPreset {
	name: string;
	colors: Record<string, string>;
	savedAt: number;
}

/**
 * Скільки наборів тримаємо.
 *
 * Вісім, а не «скільки завгодно»: перелік стоїть усередині вузької панелі, і
 * двадцять рядків у ній перетворять вибір на пошук. Коли місце скінчилося,
 * старіший тихо не зникає — панель скаже, що треба звільнити місце: мовчазна
 * втрата чужої роботи гірша за відмову.
 */
export const MAX_PRESETS = 8;

function прочитати(): LabPreset[] {
	if (!browser) return [];
	const raw = storage.get(КЛЮЧ);
	if (!raw) return [];
	try {
		const дані = JSON.parse(raw);
		if (!Array.isArray(дані)) return [];
		return дані
			.filter(
				(p): p is LabPreset =>
					p && typeof p.name === 'string' && p.name.trim().length > 0 && p.colors && typeof p.colors === 'object'
			)
			.slice(0, MAX_PRESETS);
	} catch {
		/* Зіпсований запис — бібліотека просто порожня, а не падіння панелі. */
		return [];
	}
}

class LabPresets {
	items = $state<LabPreset[]>([]);

	private гідровано = false;

	hydrate() {
		if (!browser || this.гідровано) return;
		this.гідровано = true;
		this.items = прочитати();
	}

	private зберегти() {
		if (browser) storage.set(КЛЮЧ, JSON.stringify(this.items));
	}

	get full(): boolean {
		return this.items.length >= MAX_PRESETS;
	}

	/**
	 * Записати під іменем. Те саме ім'я ПЕРЕЗАПИСУЄ, а не дає двійника.
	 *
	 * Двійники з однаковою назвою — найшвидший спосіб зробити перелік
	 * непридатним: обидва рядки виглядають однаково, а вантажать різне.
	 */
	save(name: string, colors: Record<string, string>): boolean {
		const ім_я = name.trim();
		if (!ім_я) return false;
		const був = this.items.findIndex((p) => p.name === ім_я);
		const запис: LabPreset = { name: ім_я, colors: { ...colors }, savedAt: Date.now() };
		if (був >= 0) this.items = this.items.map((p, i) => (i === був ? запис : p));
		else {
			if (this.full) return false;
			this.items = [...this.items, запис];
		}
		this.зберегти();
		return true;
	}

	remove(name: string) {
		this.items = this.items.filter((p) => p.name !== name);
		this.зберегти();
	}

	get(name: string): LabPreset | undefined {
		return this.items.find((p) => p.name === name);
	}
}

export const labPresets = new LabPresets();
