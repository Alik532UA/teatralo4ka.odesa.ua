import { describe, it, expect } from 'vitest';
import { groupPlayRows } from './playRowGroups';
import type { GraduatePlay } from './graduates';

/**
 * Згортання рядків анкети по вечорах — на прикладі анкети Аліка Запольнова:
 * «Тінь» одним рядком, три уривки «Уривків з класики» 2013 і рядок без ключа.
 */
describe('рядки вистав, згорнуті по вечорах', () => {
	const ten: GraduatePlay = { year: 2013, text: '«Тінь»', playId: 'ten-2013' };
	const antihona: GraduatePlay = {
		year: 2013,
		text: '«Уривки з класики: Антігона; Софокл», Людина, що читала Жана Ануя',
		playId: 'uryvky-z-klasyky-2013',
		items: ['antihona'],
		role: 'Людина, що читала Жана Ануя'
	};
	const neznaiomka: GraduatePlay = {
		year: 2013,
		text: '«Уривки з класики: Незнайомка; О. Блок», Пан у блакитному',
		playId: 'uryvky-z-klasyky-2013',
		items: ['neznaiomka'],
		role: 'Пан у блакитному'
	};
	const sonety: GraduatePlay = {
		year: 2013,
		text: '«Уривки з класики: Сонети; В. Шекспір»',
		playId: 'uryvky-z-klasyky-2013',
		items: ['sonety']
	};
	const bezKliucha: GraduatePlay = { year: 2005, text: '«Гном Вася», Волк' };

	function evening(group: ReturnType<typeof groupPlayRows>[number]) {
		if (group.kind !== 'evening') throw new Error(`очікувався вечір, а це ${group.kind}`);
		return group;
	}

	it('кілька рядків одного вечора стають одним вечором на місці першого', () => {
		const groups = groupPlayRows([ten, antihona, neznaiomka, sonety]);
		expect(groups.map((g) => g.kind)).toEqual(['single', 'evening']);
		const вечір = evening(groups[1]);
		expect(вечір.playId).toBe('uryvky-z-klasyky-2013');
		expect(вечір.year).toBe(2013);
		expect(вечір.rows).toEqual([antihona, neznaiomka, sonety]);
	});

	it('рядки одного вечора збираються разом, навіть коли в анкеті стоять не поспіль', () => {
		const groups = groupPlayRows([antihona, ten, sonety]);
		expect(groups.map((g) => g.kind)).toEqual(['evening', 'single']);
		expect(evening(groups[0]).rows).toEqual([antihona, sonety]);
	});

	it('один рядок на виставу і рядок без ключа лишаються одиночними', () => {
		expect(groupPlayRows([bezKliucha, ten])).toEqual([
			{ kind: 'single', row: bezKliucha },
			{ kind: 'single', row: ten }
		]);
	});

	it('два рядки без ключа не злипаються між собою', () => {
		const inshyi: GraduatePlay = { year: 2006, text: '«Пори року», солдат' };
		expect(groupPlayRows([bezKliucha, inshyi]).map((g) => g.kind)).toEqual(['single', 'single']);
	});

	it('порожня анкета — порожній перелік', () => {
		expect(groupPlayRows([])).toEqual([]);
	});
});
