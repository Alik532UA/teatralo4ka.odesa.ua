import { goto } from '$app/navigation';
import { ui } from '$lib/controllers/ui.svelte';
import { LOCALES, isLocale, localeFromPath, withLocale } from './routing';

/**
 * Перемикання мови — одне на весь застосунок.
 *
 * **Чому окремий модуль, а не метод шапки.** Споживачів два: кнопка мови в
 * `HeaderSection` і гаряча клавіша `L` у `ui/ServiceLayer`. Поки функція жила в
 * шапці, другий споживач мусив або скопіювати таймінги блюру, або перемикати мову
 * без нього — перше розійшлося б із першою ж правкою, друге дало б два різні
 * відчуття від однієї дії.
 *
 * **І чому не в контролері `ui`, який володіє `isLangChanging`.** Спроба була, і
 * вона зламала `toast.svelte.test.ts`: контролери імпортують одне одного, а в
 * середовищі юніт-тестів аліаса `$app/navigation` немає — «Failed to resolve
 * import». Динамічний `import()` не врятував: Vite резолвить і його на етапі
 * трансформації. Тут же залежність лишається на межі, до якої тести не доходять:
 * цей модуль імпортують лише компоненти.
 *
 * **Перемикання саме НАВІГАЦІЄЮ, а не `locale.set` (I18N-v8 § 3.1).** Доти в шапці
 * стояло присвоєння: адреса не змінювалася, і англійська версія не мала власного
 * посилання взагалі — надіслана адреса відкривалася тією мовою, яка збережена в
 * отримувача. Тепер мову задає шлях, тож `locale.set` був би ще й шкідливим: він
 * перемалював би сторінку однією мовою, а `load` після переходу — іншою, і між ними
 * встиг би кадр із неправильним текстом.
 */
export async function changeLanguage(lang: string): Promise<void> {
	if (typeof window === 'undefined') return;

	const here = window.location.pathname;
	if (!isLocale(lang) || lang === localeFromPath(here)) return;

	// Завіса на 300 мс приховує перемальовування сторінки іншою мовою. Обидві
	// половини читають той самий прапорець: вимкнений блюр означає миттєвий перехід,
	// а не «завіса, яка не зникає».
	if (ui.enableBlurEffect) {
		ui.isLangChanging = true;
		await new Promise((r) => setTimeout(r, 300));
	}

	// `invalidateAll`, бо `load` кореневого layout читає саме `url`: без нього
	// SvelteKit вважав би дані незмінними й не перевиконав його.
	await goto(withLocale(here, lang), { invalidateAll: true });

	if (ui.enableBlurEffect) {
		setTimeout(() => {
			ui.isLangChanging = false;
		}, 300);
	}
}

/** Наступна мова по колу. Їх дві, тож це просто «інша» — саме те, що робить `L`. */
export async function nextLanguage(): Promise<void> {
	if (typeof window === 'undefined') return;
	const current = localeFromPath(window.location.pathname);
	await changeLanguage(LOCALES[(LOCALES.indexOf(current) + 1) % LOCALES.length]);
}
