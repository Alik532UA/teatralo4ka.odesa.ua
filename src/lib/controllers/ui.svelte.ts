import { storage } from '../services/storage';
import { SCROLLBAR_MODE_IDS, type ScrollbarMode } from '../config/scrollbarModes';
import { defaultsToApply, type AdminDefaults } from '../utils/uiDefaults';
import type { Theme } from '../config/themes';

/** Реекспорт для наявних імпортерів: тип живе в конфігу (див. `config/scrollbarModes`). */
export type { ScrollbarMode };

/**
 * Клас експортується поруч із синглтоном НЕ для другого екземпляра в застосунку,
 * а тому, що частина стану гідрується в конструкторі зі сховища. Перевірити таку
 * гідрацію на вже створеному синглтоні неможливо: його конструктор відпрацював
 * на імпорті модуля, до того як тест устиг щось покласти у сховище.
 */
export class UIState {
	isMenuOpen = $state(false);
	isPhonesModalOpen = $state(false);
	theme = $state<Theme>('light');
	backgroundType = $state<0 | 1 | 2 | 3 | 4>(4);
	isThemeChanging = $state(false);
	isLangChanging = $state(false);

	get isMobile() {
		if (typeof window === 'undefined') return false;
		return window.innerWidth <= 768;
	}

	// Debug toggles
	enableDynamicBackground = $state(true);
	enableBlurEffect = $state(true);
	/**
	 * Чим показувати положення на сторінці.
	 *
	 * `standard` — нативна смуга браузера, лише перефарбована під тему.
	 * `custom` — типове: накладка, що не зсуває вміст і лежить під заставкою.
	 * `custom` — власна смуга накладкою: не займає ширину, лежить під
	 *   заставкою і товщає при наближенні миші. Нативна цього не вміє.
	 * `minimap` — схематична мінімапа: блоки сторінки смужками.
	 * `minimap-full` — мінімапа зі справжнім зменшеним виглядом сторінки.
	 */
	scrollbarMode = $state<ScrollbarMode>('custom');

	/**
	 * Чи діють одиночні літерні скорочення сайту (`T` тема, `L` мова).
	 *
	 * **Це виконання WCAG SC 2.1.4 «Character Key Shortcuts», рівень A**
	 * (HOTKEYS-v8 § 3, `HK-WCAG-CHARACTER-KEY`, CRITICAL). Критерій вимагає
	 * щонайменше одне з трьох: вимкнути скорочення, перепризначити його або
	 * лишити чинним тільки у фокусі відповідного елемента. Тут обрано перше.
	 *
	 * **Чому саме перше.** Другий шлях (перепризначення) — це окремий екран і
	 * розвʼязання конфліктів на дві клавіші; він виправданий там, де скорочень
	 * десятки. Третій (лише у фокусі) для `T` і `L` неможливий за задумом: тема й
	 * мова змінюються з будь-якого місця сторінки, у цьому вся їхня користь.
	 * Лишається перемикач — і в проєкті вже є куди його покласти.
	 *
	 * **Кому це потрібно насправді.** Людям, які диктують текст голосом, і тим,
	 * хто користується клавіатурою з надмірними натисканнями: диктування
	 * розсипається на одиночні літери, і кожна `т` перемикала б тему. Саме тому
	 * критерій рівня A, а не AA.
	 *
	 * **Типове значення `true`** — скорочення лишаються для всіх, хто нічого не
	 * вибирав; критерій вимагає СПОСОБУ вимкнути, а не вимкненого стану.
	 *
	 * **Службові серії (`V`, `R`, `G`, `H`) під це не підпадають і навмисно
	 * лишаються чинними.** SC 2.1.4 говорить про скорочення, яке спрацьовує від
	 * ОДНОГО символу; серія вимагає від пʼяти до пʼятдесяти пʼяти натискань
	 * поспіль у вікні часу й скидається будь-якою іншою клавішею — надиктований
	 * текст такого не дає. Друга причина практична: `R` — аварійне скидання, і
	 * втратити його разом із вимкненими скороченнями означало б лишити людину без
	 * виходу саме тоді, коли сайт зламався.
	 */
	hotkeysEnabled = $state(true);

	constructor() {
		if (typeof window !== 'undefined') {
			// Read theme from localStorage or OS settings
			const savedTheme = storage.get('theme') as 'light' | 'dark' | 'yellow' | null;
			if (savedTheme) {
				this.setTheme(savedTheme, { withBlur: false });
			} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				this.setTheme('dark', { withBlur: false });
			} else {
				this.setTheme('light', { withBlur: false });
			}
			
			// Read background type from localStorage
			const savedBg = storage.get('backgroundType') as '0' | '1' | '2' | '3' | '4' | null;
			if (savedBg) {
				this.backgroundType = parseInt(savedBg) as 0 | 1 | 2 | 3 | 4;
			}

			// Read debug settings from localStorage
			const enableDynBg = storage.get('enableDynamicBackground');
			if (enableDynBg !== null) {
				this.enableDynamicBackground = enableDynBg === 'true';
			}
			const enableBlur = storage.get('enableBlurEffect');
			if (enableBlur !== null) {
				this.enableBlurEffect = enableBlur === 'true';
			}
			// Вибір людини читається тут, а не в `ServiceLayer`: обробник монтується
			// пізніше за перший кадр, і між ними встигла б спрацювати клавіша.
			//
			// Порівнюються ОБИДВА значення, а не лише `'true'`. Запис під тим самим
			// ключем від іншої версії (чи зміна формату) при `=== 'true'` читався б як
			// «вимкнено» — тобто клавіші тихо зникли б у людей, які нічого не вибирали.
			// Не 'true' і не 'false' означає «не сказано», і діє типове значення.
			const hotkeys = storage.get('hotkeysEnabled');
			if (hotkeys === 'true' || hotkeys === 'false') {
				this.hotkeysEnabled = hotkeys === 'true';
			}
			const mode = storage.get('scrollbarMode');
			if (mode !== null && SCROLLBAR_MODE_IDS.includes(mode as ScrollbarMode)) {
				this.scrollbarMode = mode as ScrollbarMode;
			} else {
				// Вибору немає — беремо типове значення від адміністратора, збережене
				// з попереднього візиту. Див. `applyDefaults`: воно ж читається в
				// скрипті першого кадру, тому смуга не мигає при завантаженні.
				const fallback = storage.get('scrollbarModeDefault');
				if (fallback !== null && SCROLLBAR_MODE_IDS.includes(fallback as ScrollbarMode)) {
					this.scrollbarMode = fallback as ScrollbarMode;
				}
			}
			
			// Listen to OS theme changes
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
				if (!storage.get('theme')) {
					this.setTheme(e.matches ? 'dark' : 'light');
				}
			});
		}
	}

	toggleMenu = () => {
		this.isMenuOpen = !this.isMenuOpen;
		// Блокуємо скрол при відкритому меню
		if (typeof document !== 'undefined') {
			document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
		}
	};

	closeMenu = () => {
		this.isMenuOpen = false;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	};

	setTheme = async (t: Theme, options: { withBlur?: boolean } = {}) => {
		if (this.theme === t) return;

		const withBlur = options.withBlur ?? true;

		if (withBlur && this.enableBlurEffect) {
			this.isThemeChanging = true;
			// Чекаємо повної тривалості блюру (0.3s) ДО зміни теми
			await new Promise((r) => setTimeout(r, 300));
		}

		this.theme = t;
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', t);
			
			// Update color-scheme meta
			const csMeta = document.querySelector('meta[name="color-scheme"]');
			if (csMeta) {
				if (t === 'dark' || t === 'dark-cyan' || t === 'dark-blue') csMeta.setAttribute('content', 'dark');
				else if (t === 'yellow' || t === 'light-yellow') csMeta.setAttribute('content', 'light');
				else csMeta.setAttribute('content', 'light dark');
			}

			// Update classes
			document.documentElement.classList.remove('dark-theme', 'light-theme', 'yellow-theme', 'light-yellow-theme', 'dark-cyan-theme', 'dark-blue-theme');
			document.documentElement.classList.add(`${t}-theme`);
		}
		storage.set('theme', t);

		if (withBlur && this.enableBlurEffect) {
			// Даємо час на розчинення блюру
			setTimeout(() => {
				this.isThemeChanging = false;
			}, 300);
		}
	};

	setBackgroundType = (type: 0 | 1 | 2 | 3 | 4) => {
		this.backgroundType = type;
		if (type !== 0) {
			storage.set('backgroundType', type.toString());
		}
	};

	/**
	 * Явні значення замість `toggle()` — і це виправлення дефекту, а не смак.
	 *
	 * У панелі налаштувань обидва перемикачі показані парою кнопок «Вимк /
	 * Увімк», тобто радіо. Поки обидві кнопки гортали прапорець, натискання на
	 * ВЖЕ АКТИВНУ вимикало його: кнопка з підписом «Увімк» вимикала. Заміряно в
	 * браузері 2026-08-26 — три натискання по «Увімк» дали `false`, `true`,
	 * `false`.
	 *
	 * Гортання й не потрібне було: у фоні виклик стояв усередині `if`, який
	 * звіряв поточний стан із бажаним, тобто відтворював сеттер довшим шляхом.
	 */
	setDynamicBackground = (enabled: boolean) => {
		this.enableDynamicBackground = enabled;
		storage.set('enableDynamicBackground', enabled ? 'true' : 'false');
	};

	setBlurEffect = (enabled: boolean) => {
		this.enableBlurEffect = enabled;
		storage.set('enableBlurEffect', enabled ? 'true' : 'false');
	};

	/**
	 * Явне значення, а не `toggle()`.
	 *
	 * У панелі налаштувань це пара кнопок «Увімк / Вимк», тобто перемикач у формі
	 * радіо. Гортання (`this.x = !this.x`) у такій формі означає, що натискання
	 * на ВЖЕ активну кнопку вимикає її — контрол робить протилежне своєму підпису.
	 */
	setHotkeysEnabled = (enabled: boolean) => {
		this.hotkeysEnabled = enabled;
		storage.set('hotkeysEnabled', enabled ? 'true' : 'false');
	};

	setScrollbarMode = (mode: ScrollbarMode) => {
		this.scrollbarMode = mode;
		storage.set('scrollbarMode', mode);
	};

	/**
	 * Типові значення від адміністратора — для відвідувача, який САМ нічого не
	 * вибирав.
	 *
	 * Свій вибір ніколи не перебивається: інакше налаштування, зроблене
	 * відвідувачем, зникало б після кожної правки в адмінці, і виглядало б це як
	 * поламане збереження.
	 *
	 * Викликається один раз, коли приходять налаштування з Firestore. Тобто
	 * ПІСЛЯ першого кадру — і для фону та blur це невидимо, бо фон монтується
	 * пізніше, а blur діє лише під час зміни теми чи мови. Смуга помітна одразу,
	 * тому її типове значення ще й кешується у сховище: скрипт першого кадру
	 * читає його синхронно й наступний візит починається без стрибка.
	 */
	applyDefaults = (d: AdminDefaults) => {
		if (typeof window === 'undefined') return;

		// Саме рішення — у чистій функції: усередині рунного класу його неможливо
		// перевірити тестом, а правило «свій вибір головніший» варте перевірки.
		const apply = defaultsToApply(
			{
				backgroundType: storage.get('backgroundType'),
				enableDynamicBackground: storage.get('enableDynamicBackground'),
				enableBlurEffect: storage.get('enableBlurEffect'),
				scrollbarMode: storage.get('scrollbarMode')
			},
			d
		);

		if (apply.backgroundType !== undefined) this.backgroundType = apply.backgroundType;
		if (apply.enableDynamicBackground !== undefined) {
			this.enableDynamicBackground = apply.enableDynamicBackground;
		}
		if (apply.enableBlurEffect !== undefined) this.enableBlurEffect = apply.enableBlurEffect;
		if (apply.scrollbarMode !== undefined) this.scrollbarMode = apply.scrollbarMode;

		// Кеш пишеться завжди, навіть коли у відвідувача є власний вибір: якщо він
		// колись його скине, першим кадром має бути актуальне типове значення, а не
		// те, що діяло на момент його першого візиту.
		storage.set('scrollbarModeDefault', d.defaultScrollbar);
	};
}

export const ui = new UIState();
