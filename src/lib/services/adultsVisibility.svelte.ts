import { browser, dev } from '$app/environment';
import { storage } from './storage';

const STORAGE_KEY = 'adults_section_revealed';

/**
 * Другий вхід у розділ — параметр адреси, поруч із серією `H`.
 *
 * Службовий жест не буває ЄДИНИМ входом (DEBUGGING-v8 § 3.1, `DBG-KEY-SEQUENCE`):
 * на дотику клавіатури немає, тобто з телефона розділ був недосяжний узагалі.
 * Табло версії цю пару має від початку (`?debug=1` поруч із серією `V`), а тут
 * лишалася сама серія.
 *
 * Ім'я коротке й того ж вигляду, що й `debug`: адресу диктують уголос і
 * набирають руками на чужому телефоні.
 */
export const ADULTS_URL_PARAM = 'adults';

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

	/**
	 * Задати видимість явним значенням.
	 *
	 * Потрібне для входу за адресою (`?adults=1` / `?adults=0`): параметр каже,
	 * ЧОГО просять, а не «навпаки до теперішнього». Гортання там дало б різний
	 * результат від одного й того самого посилання — залежно від того, що людина
	 * вмикала на цьому пристрої раніше.
	 */
	setVisible(value: boolean): void {
		this.override = value;
		if (browser) {
			storage.set(STORAGE_KEY, value ? '1' : '0');
		}
	}

	/** Розкрити розділ */
	reveal(): void {
		this.setVisible(true);
	}

	/** Перемкнути видимість розділу. Гортання тут доречне: жест один на обидві дії. */
	toggle(): boolean {
		const next = !this.isVisible;
		this.setVisible(next);
		return next;
	}
}

export const adultsVisibility = new AdultsVisibilityState();

/**
 * Що просить адреса: показати, сховати чи нічого.
 *
 * Чиста функція, бо саме тут і живе рішення, а всередині рунного класу його
 * нічим перевірити. `1` і `0` — ті самі значення, які лежать у сховищі, тож
 * третьої мови для того самого стану не з'являється.
 *
 * **Два значення, а не одне.** У `?debug=1` пари немає, і це виправдано: сховати
 * табло коштує п'ять натискань, тобто дешево. Тут дешевого шляху назад немає за
 * умовою — уся правка про пристрої без клавіатури, — тож «сховати» мусить бути
 * так само досяжним, як «показати».
 *
 * Будь-що інше — `null`: адреса не про це. Мовчазне «показати» на `?adults=yes`
 * зробило б параметр таким, що спрацьовує від описки.
 */
export function visibilityFromUrl(value: string | null): boolean | null {
	if (value === '1') return true;
	if (value === '0') return false;
	return null;
}
