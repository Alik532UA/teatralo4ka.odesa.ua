<script lang="ts">
	import { dev } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { ui } from '$lib/controllers/ui.svelte';
	import { nextLanguage } from '$lib/i18n/switchLanguage';
	import { acceptsShortcut } from '$lib/services/keyboard';
	import { createKeySequence } from '$lib/services/keySequence';
	import { debugMode } from '$lib/services/debugMode.svelte';
	import { hardReset, RESET_PRESSES_DEV, RESET_PRESSES_PROD } from '$lib/services/resetService';
	import ServiceBadge from './ServiceBadge.svelte';

	/**
	 * Службовий шар: гарячі клавіші сайту (`T` тема, `L` мова), службові серії `V` і
	 * `R` та саме табло версії (HOTKEYS-v8 § 1.1, § 4).
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

	onDestroy(() => {
		versionSequence.reset();
		resetSequence.reset();
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
