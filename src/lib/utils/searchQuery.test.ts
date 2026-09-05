// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { foldLetters, matchesQuery, normalizeQuery } from './searchQuery';

/**
 * Правила пошуку — тестом, а не оком на сторінці.
 *
 * Кожне з них виведене з реальних даних, і ламається кожне ТИХО: пошук нічого
 * не повідомляє, він просто не показує запис, який у реєстрі є. Відрізнити це
 * від «такого немає» читач не може.
 */
describe('нормалізація запиту', () => {
	it('усі три апострофи зводяться до одного', () => {
		expect(normalizeQuery("Бур'ян")).toBe(normalizeQuery('Бурʼян'));
		expect(normalizeQuery('Бур’ян')).toBe(normalizeQuery('Бур`ян'));
	});

	it('регістр і зайві пробіли не впливають', () => {
		expect(normalizeQuery('  ЧАЙНИКИ   2016 ')).toBe('чайники 2016');
	});
});

describe('збіг із запитом', () => {
	it('порожній запит підходить усім', () => {
		expect(matchesQuery(['Чайники'], '')).toBe(true);
		expect(matchesQuery(['Чайники'], '   ')).toBe(true);
	});

	it('слова звіряються окремо й у будь-якому порядку', () => {
		const поля = ['Чайники 2016', 'Teapots 2016', 2016];
		expect(matchesQuery(поля, 'чайники 2016')).toBe(true);
		expect(matchesQuery(поля, '2016 чайники')).toBe(true);
		expect(matchesQuery(поля, 'teapots чайники')).toBe(true);
	});

	it('слово, якого немає ні в одному полі, не дає збігу', () => {
		expect(matchesQuery(['Чайники 2016'], 'чайники 2013')).toBe(false);
	});

	it('порожні поля не склеюють сусідні слова', () => {
		/*
		 * Без відсіву `undefined` рядок збирався б як «Чайники undefined 2016», і
		 * запит «undefined» знаходив би все. А без відсіву порожніх рядків
		 * подвійний пробіл зливав би сусідні слова в одне.
		 */
		expect(matchesQuery(['Чайники', undefined, '', null, 2016], 'undefined')).toBe(false);
		expect(matchesQuery(['Чайники', '', 2016], 'чайники 2016')).toBe(true);
	});

	it('число як поле шукається так само, як рядок', () => {
		expect(matchesQuery(['Чайники', 2016], '2016')).toBe(true);
	});
});

describe('згортання схожих літер', () => {
	it('зводить різні написання тієї самої літери до одного вигляду', () => {
		expect(foldLetters('тункевіч')).toBe(foldLetters('тункевич'));
		expect(foldLetters('маріна')).toBe(foldLetters('марина'));
		expect(foldLetters("дар'я")).toBe(foldLetters('дар’я'));
	});

	it('НЕ змінює довжини рядка', () => {
		/*
		 * Зворотний експеримент до дефекту, який напрошується: класичний «кістяк»
		 * слова викидає м'які знаки й апострофи. Виглядав би він правильно, а
		 * фрагмент навколо збігу в `siteSearch` мовчки з'їжджав би на кілька
		 * символів — тобто різався б посеред слова.
		 */
		for (const s of ['Дар’я Гуревич', 'Ґудзик', 'Їжак', 'ABC 123', 'Тьмяний']) {
			expect(foldLetters(s).length, s).toBe(s.length);
		}
	});

	it('фільтри переліків знаходять прізвище іншим написанням', () => {
		// Те саме правило, що й у пошуку по сайту: різниця в одній літері — це
		// різні руки, а не різні люди.
		expect(matchesQuery(['Аліса Тункевич'], 'тункевіч')).toBe(true);
		expect(matchesQuery(['Марина Суханова'], 'маріна')).toBe(true);
		expect(matchesQuery(['Дар’я Гуревич'], "дар'я")).toBe(true);
	});
});
