import { storage } from '../services/storage';
import { SCROLLBAR_MODE_IDS, type ScrollbarMode } from '../config/scrollbarModes';
import { defaultsToApply, type AdminDefaults } from '../utils/uiDefaults';

/** Реекспорт для наявних імпортерів: тип живе в конфігу (див. `config/scrollbarModes`). */
export type { ScrollbarMode };

class UIState {
	isMenuOpen = $state(false);
	isPhonesModalOpen = $state(false);
	theme = $state<'light' | 'light-yellow' | 'dark' | 'yellow'>('light');
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

	setTheme = async (t: 'light' | 'light-yellow' | 'dark' | 'yellow', options: { withBlur?: boolean } = {}) => {
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
				if (t === 'dark') csMeta.setAttribute('content', 'dark');
				else if (t === 'yellow' || t === 'light-yellow') csMeta.setAttribute('content', 'light');
				else csMeta.setAttribute('content', 'light dark');
			}

			// Update classes
			document.documentElement.classList.remove('dark-theme', 'light-theme', 'yellow-theme', 'light-yellow-theme');
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

	toggleDynamicBackground = () => {
		this.enableDynamicBackground = !this.enableDynamicBackground;
		storage.set('enableDynamicBackground', this.enableDynamicBackground.toString());
	};

	toggleBlurEffect = () => {
		this.enableBlurEffect = !this.enableBlurEffect;
		storage.set('enableBlurEffect', this.enableBlurEffect.toString());
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
