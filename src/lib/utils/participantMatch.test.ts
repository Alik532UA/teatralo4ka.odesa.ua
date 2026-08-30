import { describe, it, expect } from 'vitest';
import { createNameMatcher, parseName } from './participantMatch';

/**
 * Приклади не вигадані: усі — з переліку вистав Федора Ткача та реєстру
 * випускників, і кожен колись не збігався.
 */
const РЕЄСТР = [
	{ slug: 'alla-kolesnyk', name: 'Алла Колесник (Вішневська)' },
	{ slug: 'kristina-slivka', name: 'Крістіна Слівка (Співак)' },
	{ slug: 'yelyzaveta-maliuzhenko', name: 'Єлизавета Малюженко' },
	{ slug: 'alina-ivanova', name: 'Аліна Іванова' },
	{ slug: 'myroslava-tkach', name: 'Мирослава Ткач' },
	{ slug: 'hanna-tkach', name: 'Ганна Ткач' },
	{ slug: 'fedir-tkach-master', name: 'Ткач Федір Федорович' }
];

const знайти = createNameMatcher(РЕЄСТР);

describe('parseName', () => {
	it('дістає ім’я та обидва прізвища з дужок', () => {
		expect(parseName('Алла Колесник (Вішневська)')).toEqual({
			full: 'алла колесник (вішневська)',
			given: 'алла',
			surnames: ['колесник', 'вішневська']
		});
	});

	it('не розбирає те, що не з двох слів — лише дослівний збіг', () => {
		expect(parseName('Ткач Федір Федорович').given).toBeNull();
	});

	it('зводить апостроф і зайві пробіли', () => {
		expect(parseName('  Мар’яна   Кос  ').full).toBe("мар'яна кос");
	});
});

describe('createNameMatcher', () => {
	it('дослівний збіг', () => {
		expect(знайти('Ганна Ткач')?.slug).toBe('hanna-tkach');
	});

	it('учасник без дужок — реєстр із дужками', () => {
		expect(знайти('Алла Колесник')?.slug).toBe('alla-kolesnyk');
	});

	it('прізвище учасника збігається з тим, що в дужках', () => {
		expect(знайти('Крістіна Співак')?.slug).toBe('kristina-slivka');
	});

	it('учасник із дужками — реєстр без них', () => {
		expect(знайти('Єлизавета Малюженко (Широкова)')?.slug).toBe('yelyzaveta-maliuzhenko');
	});

	it('обидва боки з дужками, збігається лише одне прізвище', () => {
		expect(знайти('Аліна Катречко (Іванова)')?.slug).toBe('alina-ivanova');
	});

	it('однофамільці з різними іменами не зводяться', () => {
		expect(знайти('Ростислав Ткач')).toBeNull();
	});

	it('кого немає — того немає', () => {
		expect(знайти('Віктор Фурдуй')).toBeNull();
	});

	it('неоднозначність не лінкується взагалі', () => {
		const двоє = createNameMatcher([
			{ slug: 'a', name: 'Олена Іванова' },
			{ slug: 'b', name: 'Олена Петрова (Іванова)' }
		]);
		expect(двоє('Олена Іванова')?.slug).toBe('a'); // дослівний збіг сильніший
		expect(двоє('Олена Петрова')?.slug).toBe('b');
		const обидві = createNameMatcher([
			{ slug: 'a', name: 'Олена Сидорова (Іванова)' },
			{ slug: 'b', name: 'Олена Петрова (Іванова)' }
		]);
		expect(обидві('Олена Іванова')).toBeNull();
	});
});
