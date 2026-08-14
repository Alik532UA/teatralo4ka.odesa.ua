import { describe, it, expect, beforeEach } from 'vitest';
import { focusableWithin, nextTrapTarget } from './focusTrap';

/**
 * Тести на чисті частини пастки фокуса. Сам атачмент тут не монтується: для
 * цього потрібне середовище компонентних тестів, якого в проєкті ще немає
 * (PROJECT-CONTEXT: «Середовище компонентних тестів — ще не обрано»). Тому
 * перевіряється те, у чому справді буває помилка — правило переходу на краях
 * і відсіювання нефокусованого, — а не виклик `.focus()`.
 */

function mount(html: string): HTMLElement {
	document.body.innerHTML = `<div id="modal">${html}</div>`;
	return document.getElementById('modal') as HTMLElement;
}

describe('focusableWithin', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('бере кнопки, посилання й поля в порядку документа', () => {
		const c = mount('<a href="/a">a</a><button>b</button><input />');
		expect(focusableWithin(c).map((e) => e.tagName)).toEqual(['A', 'BUTTON', 'INPUT']);
	});

	it('не бере вимкнену кнопку', () => {
		const c = mount('<button>ok</button><button disabled>no</button>');
		expect(focusableWithin(c)).toHaveLength(1);
	});

	it('не бере елемент, свідомо вийнятий із табуляції', () => {
		// Кнопки поля вводу за INPUT-TOOLS-v8 § 3.3 мають саме tabindex="-1";
		// якби пастка їх рахувала, Tab у формі ходив би по них.
		const c = mount('<button>ok</button><button tabindex="-1">tool</button>');
		expect(focusableWithin(c)).toHaveLength(1);
	});
});

describe('nextTrapTarget', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('з останнього елемента Tab веде на перший', () => {
		const c = mount('<button id="f">f</button><button id="l">l</button>');
		const items = focusableWithin(c);
		expect(nextTrapTarget(items, items[1], false)?.id).toBe('f');
	});

	it('з першого Shift+Tab веде на останній', () => {
		const c = mount('<button id="f">f</button><button id="l">l</button>');
		const items = focusableWithin(c);
		expect(nextTrapTarget(items, items[0], true)?.id).toBe('l');
	});

	it('усередині списку не втручається — інакше зламався б звичайний перехід', () => {
		const c = mount('<button>a</button><button id="m">m</button><button>z</button>');
		const items = focusableWithin(c);
		expect(nextTrapTarget(items, items[1], false)).toBeNull();
		expect(nextTrapTarget(items, items[1], true)).toBeNull();
	});

	it('фокус поза модалкою повертається всередину', () => {
		const c = mount('<button id="f">f</button><button id="l">l</button>');
		const items = focusableWithin(c);
		const outside = document.createElement('button');
		document.body.appendChild(outside);
		expect(nextTrapTarget(items, outside, false)?.id).toBe('f');
		expect(nextTrapTarget(items, outside, true)?.id).toBe('l');
	});

	it('порожня модалка не викликає падіння', () => {
		expect(nextTrapTarget([], null, false)).toBeNull();
	});

	it('єдиний фокусований елемент лишається на місці в обидва боки', () => {
		const c = mount('<button id="only">x</button>');
		const items = focusableWithin(c);
		expect(nextTrapTarget(items, items[0], false)?.id).toBe('only');
		expect(nextTrapTarget(items, items[0], true)?.id).toBe('only');
	});
});
