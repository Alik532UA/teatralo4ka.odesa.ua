import type { Attachment } from 'svelte/attachments';

/**
 * Гортання галереї колесом і пальцем (UI-UX-v9).
 *
 * Окремо від лайтбокса, бо це інша відповідальність: тут немає нічого про
 * вигляд — лише «який рух означає наступну світлину». Обидва жести мають ту
 * саму пастку з порогом, і тримати їх поруч дешевше, ніж повторювати її двічі.
 *
 * Атачментом, а не набором обробників у розмітці: `wheel` доводиться вішати з
 * `passive: false`, інакше `preventDefault()` мовчки не діє — а таких
 * налаштувань з атрибута не передати.
 *
 * ## Використання
 *
 * ```svelte
 * <div {@attach galleryGestures({ count: () => images.length, next, prev })}>…</div>
 * ```
 *
 * `count` — функція навмисно: інакше кількість читалася б під час створення
 * атачмента й робила б його залежним від неї, тобто кожне поповнення галереї
 * перевішувало б слухачі заново.
 */

export interface GalleryGestureOptions {
	/** Скільки світлин у галереї. Менше двох — гортати нема чого. */
	count: () => number;
	next: () => void;
	prev: () => void;
	/**
	 * Селектор ділянок, де колесо належить самій ділянці, а не галереї —
	 * стрічка прев'ю має прокручуватися, а не перегортати світлини.
	 */
	ignore?: string;
}

/**
 * Колесо: не «одна подія — одна світлина».
 *
 * Тачпад за один рух пальця видає їх десятками, і галерея пролітала б до
 * кінця від найменшого жесту. Тому зсув накопичується, крок робиться на кожні
 * `WHEEL_STEP` пікселів, а пауза довша за `WHEEL_GAP` починає відлік заново:
 * інакше два окремі повільні рухи склалися б в один крок.
 */
const WHEEL_STEP = 60;
const WHEEL_GAP = 220;

/** Поріг свайпу, px. Менше — і галерея гортається від тремтіння пальця. */
const SWIPE_MIN = 40;

export function galleryGestures(options: GalleryGestureOptions): Attachment {
	return (node) => {
		const element = node as HTMLElement;

		let wheelAcc = 0;
		let wheelAt = 0;
		let touchFrom = 0;
		let touchTo = 0;

		function onWheel(e: WheelEvent) {
			if (options.count() <= 1) return;
			if (options.ignore && (e.target as Element | null)?.closest(options.ignore)) return;
			e.preventDefault();

			const now = performance.now();
			if (now - wheelAt > WHEEL_GAP) wheelAcc = 0;
			wheelAt = now;
			wheelAcc += e.deltaY;

			if (wheelAcc >= WHEEL_STEP) {
				options.next();
				wheelAcc = 0;
			} else if (wheelAcc <= -WHEEL_STEP) {
				options.prev();
				wheelAcc = 0;
			}
		}

		function onTouchStart(e: TouchEvent) {
			touchFrom = e.touches[0].clientX;
			touchTo = touchFrom;
		}

		function onTouchMove(e: TouchEvent) {
			touchTo = e.touches[0].clientX;
		}

		function onTouchEnd() {
			const shift = touchFrom - touchTo;
			if (Math.abs(shift) < SWIPE_MIN) return;
			if (shift > 0) options.next();
			else options.prev();
		}

		// `passive: false` лише для колеса: воно єдине знімає типову поведінку.
		element.addEventListener('wheel', onWheel, { passive: false });
		element.addEventListener('touchstart', onTouchStart, { passive: true });
		element.addEventListener('touchmove', onTouchMove, { passive: true });
		element.addEventListener('touchend', onTouchEnd, { passive: true });

		return () => {
			element.removeEventListener('wheel', onWheel);
			element.removeEventListener('touchstart', onTouchStart);
			element.removeEventListener('touchmove', onTouchMove);
			element.removeEventListener('touchend', onTouchEnd);
		};
	};
}
