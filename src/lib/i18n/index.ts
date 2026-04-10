import { register, init, getLocaleFromNavigator, locale as i18nLocale } from 'svelte-i18n';
import { browser } from '$app/environment';
import { ui } from '$lib/states/ui.svelte';

register('uk', () => import('./locales/uk.json'));
register('en', () => import('./locales/en.json'));

const SUPPORTED_LOCALES = ['uk', 'en'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

function detectLocale(): SupportedLocale {
	const saved = window.localStorage.getItem('lang');
	if (saved && SUPPORTED_LOCALES.includes(saved as SupportedLocale)) return saved as SupportedLocale;
	// getLocaleFromNavigator() may return 'en-US', 'uk-UA', etc. — normalize to supported locale
	const nav = getLocaleFromNavigator()?.split('-')[0]?.toLowerCase();
	if (nav && SUPPORTED_LOCALES.includes(nav as SupportedLocale)) return nav as SupportedLocale;
	return 'uk';
}

let initialLocale: SupportedLocale = 'uk';
if (browser) {
	initialLocale = detectLocale();
}

init({
	fallbackLocale: 'uk',
	initialLocale,
});

let currentLocale: string = initialLocale;

if (browser) {
	i18nLocale.subscribe((newLocale) => {
		if (newLocale && newLocale !== currentLocale) {
			currentLocale = newLocale;
			window.localStorage.setItem('lang', newLocale);
			document.documentElement.lang = newLocale;
		}
	});
}

// Export locale as a named export for convenience
export { i18nLocale as locale };
