import { register, init, locale as i18nLocale } from 'svelte-i18n';
import { browser } from '$app/environment';
import { storage } from '$lib/services/storage';

register('uk', () => import('./locales/uk.json'));
register('en', () => import('./locales/en.json'));

/**
 * Початкова мова — ЗАВЖДИ типова, і це не спрощення.
 *
 * Раніше тут стояла детекція зі сховища й з `navigator`. Відколи мову задає
 * адреса (I18N-v8 § 3.1, хук `reroute`), таких джерел стало два, і вони
 * суперечили одне одному саме там, де це найдорожче: прередерений HTML
 * зібраний під мову з АДРЕСИ, а клієнтський модуль на гідрації брав мову зі
 * СХОВИЩА. У відвідувача з `lang=en` у сховищі, який відкрив українську
 * сторінку, різниця давала розходження гідрації.
 *
 * Тепер модуль стартує детерміновано з `uk` — тією самою мовою, з якою
 * зібраний кожен файл на голому шляху, — а `+layout.ts` перемикає на мову
 * адреси, дочекавшись словника. Одне джерело істини, і воно в URL.
 *
 * Що втрачено і чим це варто повернути: відвідувач, який раніше зберіг `en`,
 * тепер на голій адресі бачить українську. Правильна заміна — не повертати
 * детекцію в ініціалізацію, а ЗАПРОПОНУВАТИ перехід на `/en/` (мова браузера
 * плюс збережений вибір як підказка). Це окрема задача; тут її немає, тому й
 * `getLocaleFromNavigator` більше не імпортується — незужитий імпорт «на
 * майбутнє» це мертвий код, а не план.
 *
 * Підписка нижче далі пише вибір у сховище: саме ці дані така підказка й
 * читатиме.
 */
init({
	fallbackLocale: 'uk',
	initialLocale: 'uk'
});

let currentLocale: string = 'uk';

if (browser) {
	i18nLocale.subscribe((newLocale) => {
		if (newLocale && newLocale !== currentLocale) {
			currentLocale = newLocale;
			storage.set('lang', newLocale);
			document.documentElement.lang = newLocale;
		}
	});
}

// Export locale as a named export for convenience
export { i18nLocale as locale };
