import { describe, expect, it } from 'vitest';
import { allControls, type AllControlsInput } from './contentWidgetControls';

/**
 * Головне тут — не окремі випадки, а інваріант на ВСІ комбінації входу:
 * дві кнопки «усі» ніколи не існують разом.
 *
 * Саме це й було зламано: дві незалежні умови в розмітці `ContentWidget`
 * давали на мобільному дві кнопки з однаковим підписом «Усі проєкти», що
 * робили однакову дію. Перевірка на один-два «типові» набори входу цього класу
 * не ловить — ловить перебір.
 */

const BOOLEANS = [false, true];
const HREFS = ['', '/projects'];

/** Усі 16 комбінацій входу. */
const EVERY_INPUT: AllControlsInput[] = BOOLEANS.flatMap((showAllLink) =>
	HREFS.flatMap((allLinkHref) =>
		BOOLEANS.flatMap((hasMore) =>
			BOOLEANS.map((showingAll) => ({ showAllLink, allLinkHref, hasMore, showingAll }))
		)
	)
);

describe('контроли «усі» у віджеті вмісту', () => {
	it('перевірка жива: перебрано всі 16 комбінацій', () => {
		expect(EVERY_INPUT).toHaveLength(16);
	});

	it.each(EVERY_INPUT)(
		'ніколи не дає двох кнопок одночасно: %j',
		(input) => {
			const { link, expander } = allControls(input);
			expect(
				link && expander,
				'дві кнопки «усі» в одному віджеті — це та сама дія двічі, і саме так і виглядав дефект'
			).toBe(false);
		}
	);

	it('є адреса — показуємо посилання, а не дописувач', () => {
		expect(
			allControls({ showAllLink: true, allLinkHref: '/projects', hasMore: true, showingAll: false })
		).toEqual({ link: true, expander: false });
	});

	it('адреси немає — усічений список дописується на місці', () => {
		expect(
			allControls({ showAllLink: false, allLinkHref: '', hasMore: true, showingAll: false })
		).toEqual({ link: false, expander: true });
	});

	it('прапорець без адреси не дає посилання в нікуди', () => {
		// Типове значення пропа — порожній рядок, тож перевірка саме на довжину.
		expect(
			allControls({ showAllLink: true, allLinkHref: '', hasMore: true, showingAll: false })
		).toEqual({ link: false, expander: true });
	});

	it('решту вже дописано — дописувач зникає', () => {
		expect(
			allControls({ showAllLink: false, allLinkHref: '', hasMore: true, showingAll: true })
		).toEqual({ link: false, expander: false });
	});

	it('список показано повністю — жодного контрола', () => {
		expect(
			allControls({ showAllLink: false, allLinkHref: '', hasMore: false, showingAll: false })
		).toEqual({ link: false, expander: false });
	});

	it('посилання не залежить від усічення: у панелі воно є завжди', () => {
		// Інакше на десктопі, де список уміщається цілком, зникла б і кнопка
		// переходу — а сторінка «усіх» існує незалежно від межі вигляду.
		expect(
			allControls({ showAllLink: true, allLinkHref: '/projects', hasMore: false, showingAll: false })
				.link
		).toBe(true);
	});
});
