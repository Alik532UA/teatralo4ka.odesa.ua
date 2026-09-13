import { browser } from '$app/environment';

/**
 * Прокрутка від самого наведення, без натискання.
 *
 * Спільна для власної смуги та обох мінімап: усі три працюють за однією моделлю
 * — смужка висотою `trackHeight`, рамка висотою `markerHeight`, і коефіцієнт
 * `pxPerScroll`, що переводить пікселі прокрутки в пікселі смужки. Тримати три
 * копії цієї арифметики означало б виправляти згасання тричі.
 */

/** Скільки чекати, перш ніж почати рух. */
const DELAY_MS = 1000;
/** Найменша швидкість: із нею рух гарантовано доходить до мети. */
const MIN_SPEED = 90;
/** Пікова швидкість, пікселів прокрутки за секунду. */
const MAX_SPEED = 2600;
/** За скільки секунд розгін доходить до піку. */
const RAMP_S = 1.6;
/** За скільки пікселів до мети починається гальмування. */
const DECEL_PX = 700;
/** Ближче за це вважаємо, що доїхали. */
const ARRIVED_PX = 2;

/** Плавний старт і плавний фініш: 0 → 0, 1 → 1, похідна на краях нульова. */
function smoothstep(x: number): number {
	const t = Math.min(Math.max(x, 0), 1);
	return t * t * (3 - 2 * t);
}

export interface HoldGeometry {
	/** Верх рамки зараз, у пікселях від верху смужки. */
	markerTop: number;
	markerHeight: number;
	/** Пікселів смужки на піксель прокрутки. */
	pxPerScroll: number;
}

export class HoldScroll {
	/** Чи йде автопрокрутка — для підсвітки в розмітці. */
	holding = $state(false);

	#geometry: () => HoldGeometry;
	#enabled: () => boolean;
	#timer: ReturnType<typeof setTimeout> | null = null;
	#frame = 0;
	#started = 0;
	/** Куди тягнемо, у пікселях від верху смужки. */
	#targetY = 0;
	/** Зона, у якій був курсор під час останнього наведення: -1, 0 або 1. */
	#zone = 0;

	/**
	 * `enabled` — функція, а не значення: чекбокс перемикають при відкритому
	 * меню, не перестворюючи компонент, і запам'ятоване тут значення означало б,
	 * що щойно ввімкнена опція мовчить до перезавантаження сторінки.
	 */
	constructor(geometry: () => HoldGeometry, enabled: () => boolean) {
		this.#geometry = geometry;
		this.#enabled = enabled;
	}

	/**
	 * Дві причини не рухатися, обидві читаються на КОЖЕН `aim()`.
	 *
	 * Перша — опція вимкнена, і це типовий стан (HOLD-SCROLL § 1.1). Саме тому
	 * механіка й поверталася: 11.09.2026 її вирізали цілком на прохання автора
	 * — «є автодоводчик по наведенню й утриманню курсору, треба вимкнути», — і
	 * тодішній аргумент проти прапорця був правильний: вимкнений механізм без
	 * жодного способу його ввімкнути — мертвий код, який читається як зроблена
	 * робота (`PS-REACHABILITY`). Знімає цей закид рівно чекбокс у меню смуги.
	 *
	 * Друга — `prefers-reduced-motion`. Автоматичний рух сторінки — рівно те,
	 * від чого захищає ця настройка; механіка вимикається ЦІЛКОМ, а не
	 * сповільнюється: людині, якій від руху паморочиться, повільний рух не
	 * кращий за швидкий. У версії до видалення цієї перевірки не було зовсім:
	 * малювальники читали настройку лише для власної пружини появи, тож
	 * сторінка їхала однаково.
	 */
	#blocked(): boolean {
		if (!this.#enabled()) return true;
		return browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/** У якій зоні відносно рамки лежить точка: вище, на ній, чи нижче. */
	zoneOf(localY: number): -1 | 0 | 1 {
		const { markerTop, markerHeight } = this.#geometry();
		if (localY < markerTop) return -1;
		if (localY > markerTop + markerHeight) return 1;
		return 0;
	}

	/**
	 * Навести на точку.
	 *
	 * Відлік перезапускається лише коли курсор ЗМІНИВ зону. Інакше найдрібніше
	 * тремтіння миші скидало б секунду очікування раз за разом, і рух не
	 * починався б ніколи.
	 */
	aim(localY: number) {
		if (this.#blocked()) {
			this.stop();
			return;
		}

		const zone = this.zoneOf(localY);
		this.#targetY = localY;

		if (zone === 0) {
			this.stop();
			return;
		}
		if (zone === this.#zone && (this.#timer || this.#frame)) return;

		this.stop();
		this.#zone = zone;
		this.#timer = setTimeout(() => {
			this.#timer = null;
			this.#started = 0;
			this.holding = true;
			this.#frame = requestAnimationFrame(this.#step);
		}, DELAY_MS);
	}

	stop() {
		if (this.#timer) clearTimeout(this.#timer);
		if (this.#frame) cancelAnimationFrame(this.#frame);
		this.#timer = null;
		this.#frame = 0;
		this.#started = 0;
		this.#zone = 0;
		this.holding = false;
	}

	#step = (now: number) => {
		if (!browser) return;
		this.#frame = requestAnimationFrame(this.#step);

		if (!this.#started) {
			this.#started = now;
			return;
		}

		const { markerHeight, pxPerScroll } = this.#geometry();
		if (pxPerScroll <= 0) {
			this.stop();
			return;
		}

		/**
		 * Курсор має опинитися в ЦЕНТРІ повзунка, а не на його верху.
		 *
		 * `markerTop` дорівнює `scrollY * pxPerScroll`, тож без поправки на
		 * половину висоти повзунок приїжджав верхом до курсора — і виглядало це
		 * як зсув, бо натискання центрує його правильно.
		 */
		const wantedMarkerTop = this.#targetY - markerHeight / 2;
		const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
		const targetScroll = Math.min(Math.max(wantedMarkerTop / pxPerScroll, 0), maxScroll);
		const remaining = targetScroll - window.scrollY;
		if (Math.abs(remaining) <= ARRIVED_PX) {
			this.stop();
			return;
		}

		// Розгін від часу, гальмування від залишку. Обидва через smoothstep, тож
		// і початок, і кінець виходять плавними, а середина — швидкою. Раніше
		// гальмування не було зовсім: рух обривався на місці.
		const rampUp = smoothstep((now - this.#started) / 1000 / RAMP_S);
		const slowDown = smoothstep(Math.abs(remaining) / DECEL_PX);
		const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * rampUp * slowDown;

		const step = Math.sign(remaining) * (speed / 60);
		// Не перестрибуємо мету: інакше рух смикався б навколо неї.
		const next = Math.abs(step) > Math.abs(remaining) ? targetScroll : window.scrollY + step;

		window.scrollTo({ top: Math.max(0, next), behavior: 'instant' });
	};
}
