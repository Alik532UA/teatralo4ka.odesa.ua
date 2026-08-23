/**
 * Завершення заставки — ОДНЕ на весь сайт.
 *
 * ## Що тут було не так
 *
 * Заставка живе в `src/app.html`, тобто в розмітці КОЖНОЇ сторінки. А завершували
 * її двома різними способами:
 *
 *   - головна (`routes/+page.svelte`) вела повну послідовність виходу: текст
 *     зникає, логотипи роз'їжджаються, куліси розходяться, і лише потім елемент
 *     прибирається з документа;
 *   - будь-яка інша сторінка (`routes/+layout.svelte`) робила
 *     `document.getElementById('app-splash')?.remove()` — тобто ВИРИВАЛА елемент
 *     посеред анімації входу.
 *
 * Симптом саме такий, як його описав автор: заходиш прямо на `/contacts/`,
 * заставка починається — і в якийсь момент різко зникає. Це не глюк рендера, а
 * два різних кінці однієї анімації, і другий не був кінцем узагалі.
 *
 * ## Чому модуль, а не копія коду в лейауті
 *
 * Послідовність виходу — це чотири узгоджені величини: три події
 * (`splash-exit`, `splash-logo-start`, `splash-removed`), затримка логотипа й
 * затримка прибирання, яка ЗАЛЕЖИТЬ ВІД ВАРІАНТА заставки (куліси
 * розходяться довше, ніж з'їжджає суцільний фон). Копія цього набору в другому
 * місці розійшлася б із першою при першій же правці таймінгу — і розійшлася б
 * тихо, бо на головній усе лишалося б правильним.
 *
 * Події слухає `LogoIcon.svelte`: без `splash-logo-start` логотип у шапці
 * з'являється без анімації, а не разом із заставкою.
 */

/** Заставка прибирається один раз за завантаження документа. */
let dismissed = false;

/**
 * Скільки чекати після початку виходу, перш ніж прибрати елемент.
 *
 * Числа взяті з `app.html` і мусять із ними збігатися: у варіанті `curtains`
 * панелі йдуть `1s` із затримкою `0.35s`, тобто останній кадр — на 1.35 с. У
 * `classic` фон з'їжджає `0.4s` із затримкою `0.5s`, тобто на 0.9 с. Прибрати
 * елемент раніше — це і є те «різке зникнення».
 */
const REMOVE_DELAY_MS = { curtains: 1500, classic: 900 } as const;

/** Затримка події для логотипа в шапці: він підхоплює анімацію на середині виходу. */
const LOGO_START_DELAY_MS = 600;

/**
 * Провести заставку через повний вихід і лише потім прибрати.
 *
 * Безпечно кликати кілька разів і з будь-якої сторінки: другий виклик не робить
 * нічого. Повертає `void` — на завершення підписуються подією `splash-removed`.
 */
export function dismissSplash(): void {
	if (dismissed || typeof document === 'undefined') return;
	dismissed = true;

	// Таймери заставки (повідомлення про повільний інтернет, ротатор фактів)
	// живуть довше за саму заставку, якщо їх не спинити: реалізація — у
	// `static/splash.js`, оголошення — в `app.d.ts`, інваріант —
	// `src/first-frame-sync.test.ts`.
	window.__splashCleanup?.();

	const el = document.getElementById('app-splash');
	if (!el) return;

	el.classList.add('splash-exit');
	window.dispatchEvent(new CustomEvent('splash-exit'));
	setTimeout(() => window.dispatchEvent(new CustomEvent('splash-logo-start')), LOGO_START_DELAY_MS);

	const variant = document.documentElement.getAttribute('data-splash');
	const delay = variant === 'curtains' ? REMOVE_DELAY_MS.curtains : REMOVE_DELAY_MS.classic;
	setTimeout(() => {
		el.remove();
		window.dispatchEvent(new CustomEvent('splash-removed'));
	}, delay);
}

/** Чи вже почався вихід. Потрібно головній, щоб не гнати послідовність удруге. */
export function isSplashDismissed(): boolean {
	return dismissed;
}
