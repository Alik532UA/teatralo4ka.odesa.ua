<script lang="ts">
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { ui } from '$lib/controllers/ui.svelte';
	import { nextLanguage } from '$lib/i18n/switchLanguage';
	import { acceptsShortcut } from '$lib/services/keyboard';
	import { createKeySequence } from '$lib/services/keySequence';
	import { debugMode } from '$lib/services/debugMode.svelte';
	import { hardReset, RESET_PRESSES_DEV, RESET_PRESSES_PROD } from '$lib/services/resetService';
	import { adultsVisibility } from '$lib/services/adultsVisibility.svelte';
	import { isLocale, localizedPath, DEFAULT_LOCALE, type Locale } from '$lib/i18n/routing';
	import ServiceBadge from './ServiceBadge.svelte';

	/**
	 * Поточна мова для службових переходів.
	 *
	 * Раніше кожен обробник склеював адресу сам (`isEn ? '/en/…' : '/…'`), і саме
	 * ці два місця не проходили `svelte/no-navigation-without-resolve`: правило
	 * приймає лише `resolve()` або значення типу `ResolvedPathname`. Префікс тепер
	 * ставить `localizedPath`, тобто той самий код, що й решта посилань сайту.
	 */
	function currentLocale(): Locale {
		const value = get(locale);
		return typeof value === 'string' && isLocale(value) ? value : DEFAULT_LOCALE;
	}

	/**
	 * Службовий шар: гарячі клавіші сайту (`T` тема, `L` мова), службові серії `V`,
	 * `R`, `G` (Галактика випускників) та `H` (Дорослі викладачі) і табло версії (HOTKEYS-v8 § 1.1, § 4).
	 *
	 * **Троє в одному компоненті, бо в них спільна вимога до РОЗМІЩЕННЯ.** Слухач
	 * клавіатури й табло мусять жити поза межею перехоплення помилок: вона при падінні
	 * замінює дітей своєю сторінкою, тобто забрала б і те, чим збирають звіт про це
	 * падіння. Три окремих кріплення в layout виражали б ту саму вимогу тричі.
	 *
	 * **`T` іде по колу чотирьох тем** — `light`, `light-yellow`, `dark`, `yellow`; це
	 * дія клієнтська й миттєва, тож перебір дешевий.
	 *
	 * **`L` перемикає мову, а не відкриває список.** Мов дві, тож «наступна» — це РІВНО
	 * одна навігація, а не блукання. Саму навігацію (разом із блюром переходу) робить
	 * `i18n/switchLanguage` — той самий код, що й кнопка мови в шапці.
	 */
	const THEMES = ['light', 'light-yellow', 'dark', 'yellow'] as const;

	function cycleTheme() {
		const next = THEMES[(THEMES.indexOf(ui.theme) + 1) % THEMES.length];
		void ui.setTheme(next);
	}

	/**
	 * Серія `V` ПЕРЕМИКАЄ табло, і поріг залежить від напрямку: показати в проді
	 * коштує 55 натискань, сховати — 5 (`debugMode.svelte.ts`). Тому функція, а не
	 * число: перестворювати послідовність на кожну зміну стану означало б губити
	 * половину набраної серії.
	 */
	const versionSequence = createKeySequence({
		code: 'KeyV',
		threshold: () => debugMode.pressesToToggle,
		onComplete: () => debugMode.toggle()
	});

	/**
	 * Серія `R` — аварійне скидання. У проді `hardReset(true)` питає підтвердження:
	 * разом із порогом у 55 це два незалежні барʼєри перед знищенням налаштувань.
	 */
	const resetSequence = createKeySequence({
		code: 'KeyR',
		threshold: dev ? RESET_PRESSES_DEV : RESET_PRESSES_PROD,
		onComplete: () => void hardReset(!dev)
	});

	/**
	 * Серія `G` (7 натискань) — службовий перехід до «Галактики випускників»
	 * для бета-тестувальників, доки публічні посилання спрямовані на старий сайт.
	 */
	const galaxySequence = createKeySequence({
		code: 'KeyG',
		threshold: 7,
		onComplete: () => {
			void goto(localizedPath('/projects/galaxy-graduates/', currentLocale()));
		}
	});

	/**
	 * Серія `H` (7 натискань) — службовий перехід до «Дорослих викладачів»
	 * або перемикання (показати/сховати) прихованого розділу, якщо вже на цій сторінці.
	 */
	const adultsSequence = createKeySequence({
		code: 'KeyH',
		threshold: 7,
		onComplete: () => {
			const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';
			const isAlreadyOnAdults = pathname === '/residents/adults' || pathname === '/en/residents/adults';

			if (isAlreadyOnAdults) {
				adultsVisibility.toggle();
			} else {
				adultsVisibility.reveal();
				void goto(localizedPath('/residents/adults/', currentLocale()));
			}
		}
	});

	onDestroy(() => {
		versionSequence.reset();
		resetSequence.reset();
		galaxySequence.reset();
		adultsSequence.reset();
	});

	function handleKeydown(event: KeyboardEvent) {
		/*
		 * Службові жести — першими, і вони отримують КОЖНУ подію, включно з тією, що
		 * завершила сусідню серію: інакше `V` не скидала б набране в `R`, і серія
		 * перестала б бути серією. Власні захисти (автоповтор, поля вводу, вікно,
		 * модифікатори) у них свої.
		 *
		 * Захоплення клавіатури накладкою на них НЕ діє, і це навмисно: `V` і `R`
		 * зарезервовані в усіх проєктах під службові жести, тож жодна накладка їх не
		 * займає. Табло має відкриватися й тоді, коли на екрані стоїть модалка — саме
		 * тоді воно найпотрібніше.
		 */
		versionSequence.handle(event);
		resetSequence.handle(event);
		galaxySequence.handle(event);
		adultsSequence.handle(event);

		/*
		 * WCAG SC 2.1.4, рівень A (HOTKEYS-v8 § 3, `HK-WCAG-CHARACTER-KEY`).
		 *
		 * Нижче — рівно ті скорочення, які спрацьовують від ОДНОГО символу, тобто
		 * ті, що підпадають під критерій. Перемикач живе в панелі налаштувань, а
		 * чому обрано саме шлях «вимкнути» (а не перепризначення чи «лише у
		 * фокусі») — у `controllers/ui.svelte.ts` біля самого прапорця.
		 *
		 * Перевірка стоїть ПІСЛЯ службових серій навмисно: серія вимагає від пʼяти
		 * натискань поспіль і під SC 2.1.4 не підпадає, а `R` — це аварійне
		 * скидання, яке не можна втратити разом із вимкненими скороченнями.
		 */
		if (!ui.hotkeysEnabled) return;

		// Поля вводу, модифікатори й накладки, що забрали клавіатуру, — усе в
		// `acceptsShortcut`. `Esc` тут не обробляється: кожна накладка закриває себе
		// сама, і другий обробник поверх них закривав би заодно чуже.
		if (!acceptsShortcut(event)) return;

		if (event.code === 'KeyT') cycleTheme();
		else if (event.code === 'KeyL') void nextLanguage();
		else return;

		// `preventDefault` лише після того, як дія відбулася (HOTKEYS-v8 § 2.4).
		event.preventDefault();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<ServiceBadge />
