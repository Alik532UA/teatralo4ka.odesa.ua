import { describe, it, expect } from 'vitest';
import { masterGender, masterLabelKey } from './masterLabel';
import { MASTERS } from '$lib/data/masters';
import { GRADUATES } from '$lib/data/graduates';

describe('підпис майстра курсу', () => {
	it('стать визначається по батькові', () => {
		expect(masterGender({ fullName: 'Ісачкіна Тетяна Валеріївна' })).toBe('f');
		expect(masterGender({ fullName: 'Ткач Федір Федорович' })).toBe('m');
		expect(masterGender({ fullName: 'Рибакова Надія Іллівна' })).toBe('f');
	});

	it('без по батькові — за посадою, яку школа вже пише в роді', () => {
		expect(masterGender({ fullName: 'Тетяна Мініна', roleTitle: 'викладачка вокалу' })).toBe('f');
		expect(masterGender({ fullName: 'Оксана Козовякіна', roleTitle: 'концертмейстерка' })).toBe('f');
		expect(masterGender({ fullName: 'Павло Кошка', roleTitle: 'викладач акторської майстерності' })).toBe('m');
	});

	it('ключ підпису залежить від числа, а рід — лише в однині', () => {
		const ж = { fullName: 'Ісачкіна Тетяна Валеріївна' };
		const ч = { fullName: 'Ткач Федір Федорович' };
		expect(masterLabelKey([ж])).toBe('galaxy.masterOneF');
		expect(masterLabelKey([ч])).toBe('galaxy.masterOne');
		expect(masterLabelKey([ж, ч])).toBe('galaxy.masters');
		expect(masterLabelKey([])).toBe('galaxy.masters');
	});

	it('стать визначена в КОЖНОГО, хто буває єдиним майстром', () => {
		/*
		 * Правило не має права мовчки скотитися в чоловічий рід. Перевіряються не
		 * всі 145 майстрів, а ті, у кого підпис буває в ОДНИНІ: у множині рід не
		 * потрібен, і вимагати ознаки від «Кореня» чи «Стельмаха», яких ніхто не
		 * має єдиним майстром, означало б завести виняток, що нічого не боронить.
		 *
		 * Заміряно: таких 243 випускники, і стать відома в усіх.
		 */
		const самотні = new Set<string>();
		let випускників = 0;
		for (const g of GRADUATES) {
			const ms = g.masters ?? [];
			if (ms.length !== 1) continue;
			випускників += 1;
			const id = typeof ms[0] === 'string' ? ms[0] : ms[0].id;
			if (id) самотні.add(id);
		}
		// 243 випускники, але майстрів серед них лише дев'ятеро — саме тому
		// перевіряється і те, і те: одне число без другого нічого не боронить.
		expect(випускників, 'жодного випускника з одним майстром — перевірка порожня').toBeGreaterThan(100);
		expect(самотні.size, 'жодного такого майстра — перевірка порожня').toBeGreaterThan(0);

		const без: string[] = [];
		for (const id of самотні) {
			const master = MASTERS.find((m) => m.id === id);
			if (!master) continue;
			const words = (master.fullName ?? '').trim().split(/\s+/);
			const hasPatronymic = /(івна|ївна|овна|евна|ович|йович|евич)$/.test(words.at(-1) ?? '');
			const hasSurname = /(ова|єва|ева|іна|ина|ська|цька|зька)$/.test(words[0] ?? '');
			const hasRole = /(викладачка|майстриня|концертмейстерка|керівниця|акомпаніаторка|викладач|майстер|концертмейстер|керівник)/i.test(
				master.roleTitle ?? ''
			);
			if (!hasPatronymic && !hasSurname && !hasRole) {
				без.push(`${master.displayName} — ні по батькові, ні прізвища в жіночій формі, ні посади`);
			}
		}
		expect(без, 'у єдиного майстра немає ознаки роду: підпис стане чоловічим навмання').toEqual([]);
	});
});
