import { storage } from '../services/storage';

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
}

export const ui = new UIState();
