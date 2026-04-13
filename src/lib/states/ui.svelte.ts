import { getStorageKey } from '../config/storage';

class UIState {
	isMenuOpen = $state(false);
	isPhonesModalOpen = $state(false);
	theme = $state<'light' | 'dark'>('light');
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
			const savedTheme = localStorage.getItem(getStorageKey('theme')) as 'light' | 'dark' | null;
			if (savedTheme) {
				this.setTheme(savedTheme, { withBlur: false });
			} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				this.setTheme('dark', { withBlur: false });
			} else {
				this.setTheme('light', { withBlur: false });
			}
			
			// Read background type from localStorage
			const savedBg = localStorage.getItem(getStorageKey('backgroundType')) as '0' | '1' | '2' | '3' | '4' | null;
			if (savedBg) {
				this.backgroundType = parseInt(savedBg) as 0 | 1 | 2 | 3 | 4;
			}

			// Read debug settings from localStorage
			const enableDynBg = localStorage.getItem(getStorageKey('enableDynamicBackground'));
			if (enableDynBg !== null) {
				this.enableDynamicBackground = enableDynBg === 'true';
			}
			const enableBlur = localStorage.getItem(getStorageKey('enableBlurEffect'));
			if (enableBlur !== null) {
				this.enableBlurEffect = enableBlur === 'true';
			}
			
			// Listen to OS theme changes
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
				if (!localStorage.getItem(getStorageKey('theme'))) {
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

	setTheme = async (t: 'light' | 'dark', options: { withBlur?: boolean } = {}) => {
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
			// Tell browser we handle color schemes — prevents auto-dark-mode
			const csMeta = document.querySelector('meta[name="color-scheme"]');
			if (csMeta) csMeta.setAttribute('content', t === 'dark' ? 'dark' : 'light dark');
			if (t === 'dark') {
				document.documentElement.classList.add('dark-theme');
			} else {
				document.documentElement.classList.remove('dark-theme');
			}
		}
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(getStorageKey('theme'), t);
		}

		if (withBlur && this.enableBlurEffect) {
			// Даємо час на розчинення блюру
			setTimeout(() => {
				this.isThemeChanging = false;
			}, 300);
		}
	};

	setBackgroundType = (type: 0 | 1 | 2 | 3 | 4) => {
		this.backgroundType = type;
		if (typeof localStorage !== 'undefined' && type !== 0) {
			localStorage.setItem(getStorageKey('backgroundType'), type.toString());
		}
	};

	toggleDynamicBackground = () => {
		this.enableDynamicBackground = !this.enableDynamicBackground;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(getStorageKey('enableDynamicBackground'), this.enableDynamicBackground.toString());
		}
	};

	toggleBlurEffect = () => {
		this.enableBlurEffect = !this.enableBlurEffect;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(getStorageKey('enableBlurEffect'), this.enableBlurEffect.toString());
		}
	};
}

export const ui = new UIState();
