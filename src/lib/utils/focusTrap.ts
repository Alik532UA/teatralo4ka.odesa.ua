import type { Attachment } from 'svelte/attachments';

/**
 * Focus trap для модальних вікон (ACCESSIBILITY-v8, HIGH).
 *
 * `aria-modal="true"` — це обіцянка дикторові, що решта сторінки зараз
 * недосяжна. Саму досяжність атрибут не змінює: без пастки Tab виходить із
 * модалки в шапку, у навігацію, у підвал — тобто в те, що візуально закрите
 * напівпрозорим тлом. Для того, хто ходить клавіатурою, фокус просто зникає:
 * підсвітка стоїть на елементі, якого не видно.
 *
 * У проєкті сім місць із `aria-modal="true"` і жодної пастки — тому це
 * атачмент, а не сім однакових обробників. Скопійована логіка розходиться при
 * першій же правці, і половина модалок лишається без повернення фокуса.
 *
 * ## Чому axe цього не ловив
 *
 * axe перевіряє наявність ролей і атрибутів, а не поведінку Tab. Модалка з
 * `role="dialog" aria-modal="true"` проходить аудит повністю зеленою й без
 * жодної пастки — рівно той випадок, коли зелена перевірка означає лише те,
 * що перевіряли не це.
 *
 * ## Використання
 *
 * ```svelte
 * <div role="dialog" aria-modal="true" {@attach focusTrap()}>…</div>
 * ```
 *
 * Елемент-контейнер має бути тим, усередині якого замикається фокус.
 */

/**
 * Селектор нативно фокусованих елементів.
 *
 * `:not([disabled])` і `[tabindex]:not([tabindex="-1"])` обов'язкові: вимкнена
 * кнопка й елемент, свідомо вийнятий із порядку табуляції (кнопки поля вводу за
 * INPUT-TOOLS-v8 § 3.3), у циклі брати участь не повинні.
 */
const FOCUSABLE = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Видимі фокусовані нащадки контейнера, у порядку документа.
 *
 * Приховану гілку модалки (форма, поки відкрита вкладка підтвердження) треба
 * відсіяти, інакше Tab «застрягає» на невидимому елементі.
 *
 * **Чому не `offsetParent === null`**, хоч це звичний спосіб. По-перше, він
 * null у КОЖНОГО елемента з `position: fixed` — а тло модалки тут саме fixed,
 * тож перевірка викидала б половину справжніх кнопок. По-друге, він спирається
 * на розкладку, якої в jsdom немає взагалі: перший прогін цих тестів дав сім
 * падінь із порожнім списком. Обидві причини ведуть до одного — питати треба
 * стилі, а не геометрію.
 */
export function focusableWithin(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
		// Окремим фільтром, а не в селекторі. `button:not([disabled])` бере
		// кнопку з `tabindex="-1"` попри те, що поруч у списку стоїть
		// `[tabindex]:not([tabindex="-1"])`: перелік селекторів ДОДАЄ елементи,
		// а не звужує попередні. Практичний наслідок був би видимий одразу — Tab
		// у формі адмінки почав би ходити по кнопках «вставити / скопіювати /
		// стерти», які INPUT-TOOLS-v8 § 3.3 звідти навмисно прибрав.
		if (el.getAttribute('tabindex') === '-1') return false;
		if (el.closest('[hidden]')) return false;
		const style = getComputedStyle(el);
		return style.display !== 'none' && style.visibility !== 'hidden';
	});
}

/**
 * Обчислює, куди має піти фокус на Tab. Винесено з обробника заради тесту:
 * подію в jsdom відтворити можна, а от реальний рендер модалки — ні.
 *
 * Повертає `null`, коли втручатися не треба (фокус усередині й не на краю).
 */
export function nextTrapTarget(
	items: HTMLElement[],
	active: Element | null,
	shift: boolean
): HTMLElement | null {
	if (items.length === 0) return null;
	const first = items[0];
	const last = items[items.length - 1];

	// Фокус утік за межі модалки (клік по тлу, програмний blur) — забираємо назад.
	if (!active || !items.includes(active as HTMLElement)) return shift ? last : first;

	if (shift && active === first) return last;
	if (!shift && active === last) return first;
	return null;
}

/**
 * @param options.initial Елемент, який отримує фокус при відкритті. Типово —
 *   перший фокусований. Задавати варто там, де перший елемент деструктивний
 *   (наприклад, «Видалити» у діалозі підтвердження).
 */
export function focusTrap(options: { initial?: () => HTMLElement | null } = {}): Attachment {
	return (node) => {
		const container = node as HTMLElement;
		// Куди повернути фокус після закриття. Читається ДО першого focus():
		// після нього `activeElement` — це вже елемент усередині модалки.
		const returnTo = document.activeElement as HTMLElement | null;

		const initial = options.initial?.() ?? focusableWithin(container)[0] ?? container;
		// Контейнер без фокусованих дітей мусить прийняти фокус сам, інакше він
		// лишається на сторінці під модалкою.
		if (initial === container && !container.hasAttribute('tabindex')) {
			container.setAttribute('tabindex', '-1');
		}
		initial.focus();

		function onKeydown(event: KeyboardEvent) {
			if (event.key !== 'Tab') return;
			const target = nextTrapTarget(
				focusableWithin(container),
				document.activeElement,
				event.shiftKey
			);
			if (!target) return;
			event.preventDefault();
			target.focus();
		}

		// Слухаємо на самому контейнері, а не на `window`: кілька модалок
		// одночасно (діалог підтвердження поверх форми) інакше боролися б за
		// ту саму подію, і виграла б та, що підписалася першою.
		container.addEventListener('keydown', onKeydown);

		return () => {
			container.removeEventListener('keydown', onKeydown);
			// `isConnected` — від випадку, коли модалку закрили разом із цілою
			// гілкою сторінки: повертати фокус на елемент, якого вже немає в
			// документі, означає віддати його `<body>`, тобто втратити місце.
			if (returnTo?.isConnected) returnTo.focus();
		};
	};
}
