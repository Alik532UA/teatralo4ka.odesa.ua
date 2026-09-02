import { describe, it, expect } from 'vitest';
import { byBilling, roleInItem, rolesLine } from './castRoles';

/**
 * Підпис під ім'ям у вечорі з уривків.
 *
 * Приклади — з «Уривків з класики» 2013: саме там одна людина має три різні
 * ролі, одна з яких містить кому, і саме там семеро стоять «Хором» в одному
 * номері.
 */
describe('ролі по номерах програми', () => {
	const alik = [
		{ item: 'neznaiomka', role: 'Пан у блакитному' },
		{ item: 'antihona', role: 'Людина, що читала Жана Ануя' },
		{ item: 'sonety', role: 'Людина із залу' }
	];
	const order = ['antihona', 'neznaiomka', 'sonety'];

	it('роль у номері — саме та, що названа в ньому', () => {
		expect(roleInItem(alik, 'neznaiomka')).toBe('Пан у блакитному');
		expect(roleInItem(alik, 'pryvydy')).toBeUndefined();
		expect(roleInItem(undefined, 'antihona')).toBeUndefined();
	});

	it('рядок усіх ролей іде в порядку програми, а не рядків анкети', () => {
		const prymachov = [
			{ item: 'ukradene-shchastia', role: 'Микола' },
			{ item: 'antihona', role: 'Креонт' }
		];
		expect(rolesLine(prymachov, ['antihona', 'ukradene-shchastia'])).toBe('Креонт, Микола');
	});

	it('кома всередині ролі міняє роздільник на крапку з комою', () => {
		expect(rolesLine(alik, order)).toBe(
			'Людина, що читала Жана Ануя; Пан у блакитному; Людина із залу'
		);
	});

	it('однакова роль у кількох номерах називається раз', () => {
		const chorus = [
			{ item: 'antihona', role: 'Хор' },
			{ item: 'sonety', role: 'Хор' }
		];
		expect(rolesLine(chorus, order)).toBe('Хор');
	});

	it('без розкладки по номерах — null, щоб картка взяла роль або рік', () => {
		expect(rolesLine(undefined, order)).toBeNull();
		expect(rolesLine([], order)).toBeNull();
	});

	it('склад номера іде в порядку афіші, а не за абеткою', () => {
		const abetka = [
			{ name: 'Алік Запольнов', roles: [{ item: 'neznaiomka', role: 'Пан у блакитному' }] },
			{ name: 'Даніїл Примачов', roles: [{ item: 'neznaiomka', role: 'Поет' }] },
			{ name: 'Ксенія Жвачкина', roles: [{ item: 'neznaiomka', role: 'Незнайомка' }] }
		];
		const afisha = ['Незнайомка', 'Пан у блакитному', 'Поет'];
		expect(byBilling(abetka, 'neznaiomka', afisha).map((m) => m.name)).toEqual([
			'Ксенія Жвачкина',
			'Алік Запольнов',
			'Даніїл Примачов'
		]);
	});

	it('роль поза переліком або без ролі — після названих, у своєму порядку', () => {
		const abetka = [
			{ name: 'Анастасія', roles: [{ item: 'antihona', role: 'Хор' }] },
			{ name: 'Анна', roles: [{ item: 'antihona', role: 'Антігона' }] },
			{ name: 'Яна', roles: [{ item: 'antihona', role: 'Хор' }] },
			{ name: 'Хтось', roles: undefined }
		];
		expect(byBilling(abetka, 'antihona', ['Антігона']).map((m) => m.name)).toEqual([
			'Анна',
			'Анастасія',
			'Яна',
			'Хтось'
		]);
	});

	it('без переліку ролей порядок не змінюється', () => {
		const yakBulo = [
			{ name: 'б', roles: [{ item: 'x', role: 'Б' }] },
			{ name: 'а', roles: [{ item: 'x', role: 'А' }] }
		];
		expect(byBilling(yakBulo, 'x', undefined).map((m) => m.name)).toEqual(['б', 'а']);
		expect(byBilling(yakBulo, 'x', []).map((m) => m.name)).toEqual(['б', 'а']);
	});
});
