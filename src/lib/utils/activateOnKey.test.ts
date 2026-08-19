import { describe, expect, it, vi } from 'vitest';
import { activateOnKey } from './activateOnKey';

/**
 * WCAG 2.1.1: `role="button"` мусить активуватися Enter і Space, і нічим іншим.
 *
 * Найдорожчий із перевірених тут пунктів — `preventDefault` для пробілу. Без
 * нього браузер разом з активацією прокручує сторінку на екран уперед, і це
 * виглядає не як помилка, а як «клік працює, тільки сторінку кидає».
 */
function keyEvent(key: string) {
	return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent & {
		preventDefault: ReturnType<typeof vi.fn>;
	};
}

describe('activateOnKey', () => {
	it('Enter активує', () => {
		const activate = vi.fn();
		const event = keyEvent('Enter');

		activateOnKey(activate)(event);

		expect(activate).toHaveBeenCalledTimes(1);
		expect(event.preventDefault).toHaveBeenCalledTimes(1);
	});

	it('Space активує і гасить типову дію браузера', () => {
		const activate = vi.fn();
		const event = keyEvent(' ');

		activateOnKey(activate)(event);

		expect(activate).toHaveBeenCalledTimes(1);
		expect(
			event.preventDefault,
			'без preventDefault пробіл ще й прокрутить сторінку'
		).toHaveBeenCalledTimes(1);
	});

	it.each(['Tab', 'Escape', 'a', 'ArrowDown', 'Shift'])('%s не активує й не гаситься', (key) => {
		const activate = vi.fn();
		const event = keyEvent(key);

		activateOnKey(activate)(event);

		expect(activate).not.toHaveBeenCalled();
		expect(
			event.preventDefault,
			'перехоплення сторонніх клавіш ламає навігацію по сторінці'
		).not.toHaveBeenCalled();
	});

	it('кожен виклик віддає власний обробник — стану між ними немає', () => {
		const first = vi.fn();
		const second = vi.fn();

		activateOnKey(first)(keyEvent('Enter'));

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).not.toHaveBeenCalled();
	});
});
