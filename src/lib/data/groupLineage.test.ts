// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { LINEAGE, lineageOf, predecessorsOf, successorsOf } from './groupLineage';
import { GROUPS } from './groups';

/**
 * Інваріанти родоводу груп.
 *
 * ## Чому саме ці перевірки
 *
 * Родовід — це граф, і ламається він тихо: сторінка від битого ребра не падає,
 * вона просто НЕ ПОКАЗУЄ зв'язок. Тобто дефект виглядає точно так, як стан «ще
 * не внесли», і відрізнити їх оком неможливо — саме той клас, проти якого в
 * цьому проєкті й ставлять гейти.
 *
 * Чотири різні способи зламатися, і кожен має свою перевірку:
 *
 *   1. `slug` не веде в реєстр — `ланка()` мовчки відкидає ребро, і в родоводі
 *      просто на одну групу менше;
 *   2. група вказує на себе — сторінка каже «до цього була сама собою»;
 *   3. те саме ребро двічі — та сама група двома картками поруч;
 *   4. цикл — A стала B, B стала A. Тут це ще не зациклює розмітку (показуються
 *      лише СУСІДИ, на один крок), але «стала тим, з чого постала» — не історія,
 *      а суперечність; і щойно хтось намалює ланцюг, цикл стане нескінченним.
 *
 * ## Хронологію НЕ перевіряємо, і це рішення
 *
 * Спокуса є: наступниця, що випустилася раніше за попередницю, — майже
 * напевно перевернуте ребро. Але «перформатували» означає саме перетасовку
 * посеред курсу, і роки груп при цьому законно накладаються або й ідуть назад
 * (людей могли зібрати з молодшого набору). Гейт на числі тут червонів би від
 * правди, а такий вимикають першим. Замість нього напрямок пояснює `note`.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на чотирьох дефектах, по одному на перевірку: `to: 'tu-155'`,
 * `{ from: 'freestyle', to: 'freestyle' }`, подвоєне ребро й пара
 * `freestyle → tu-154` + `tu-154 → freestyle`. Кожна впала й назвала саме те
 * ребро.
 */
describe('родовід груп', () => {
	const відомі = new Set(GROUPS.map((g) => g.slug));

	it('перевірка жива — реєстр не порожній', () => {
		expect(
			LINEAGE.length,
			"жодного зв'язку — перевірки нижче нічого не стверджують"
		).toBeGreaterThan(0);
	});

	it('обидва кінці кожного ребра є в реєстрі груп', () => {
		const bad: string[] = [];
		for (const edge of LINEAGE) {
			if (!відомі.has(edge.from)) bad.push(`${edge.from} → ${edge.to}: немає групи «${edge.from}»`);
			if (!відомі.has(edge.to)) bad.push(`${edge.from} → ${edge.to}: немає групи «${edge.to}»`);
		}
		expect(bad, 'ребро веде в нікуди — зв\'язок мовчки не показується:\n  ' + bad.join('\n  ')).toEqual([]);
	});

	it('група не стає сама собою і не записана двічі', () => {
		const bad: string[] = [];
		const seen = new Set<string>();
		for (const edge of LINEAGE) {
			if (edge.from === edge.to) bad.push(`${edge.from}: ребро саме в себе`);
			const key = `${edge.from} → ${edge.to}`;
			if (seen.has(key)) bad.push(`${key}: ребро повторюється`);
			seen.add(key);
		}
		expect(bad, 'ребро суперечить саме собі:\n  ' + bad.join('\n  ')).toEqual([]);
	});

	/*
	 * Обхід у глибину від кожної групи. Родовід малий (одиниці ребер), тож
	 * простий обхід тут дешевший і читабельніший за топологічне сортування.
	 */
	it('родовід не має циклів — група не може бути власним предком', () => {
		const наступні = new Map<string, string[]>();
		for (const edge of LINEAGE) наступні.set(edge.from, [...(наступні.get(edge.from) ?? []), edge.to]);

		const bad: string[] = [];
		for (const початок of наступні.keys()) {
			const стек = [[початок]];
			while (стек.length > 0) {
				const шлях = стек.pop()!;
				for (const далі of наступні.get(шлях[шлях.length - 1]) ?? []) {
					if (далі === початок) {
						bad.push([...шлях, далі].join(' → '));
						continue;
					}
					if (!шлях.includes(далі)) стек.push([...шлях, далі]);
				}
			}
		}
		expect(bad, 'цикл у родоводі:\n  ' + bad.join('\n  ')).toEqual([]);
	});

	/*
	 * Симетрії реєстр не вимагає — ребро одне, — але ОБИДВІ сторінки мусять
	 * побачити той самий зв'язок із двох боків. Це перевіряється не на даних, а
	 * на функціях: саме вони й є той бік, який читає сторінка.
	 */
	it('той самий зв\'язок видно з обох сторінок', () => {
		for (const edge of LINEAGE) {
			expect(
				successorsOf(edge.from).map((l) => l.group.slug),
				`${edge.from} не бачить, що стала ${edge.to}`
			).toContain(edge.to);
			expect(
				predecessorsOf(edge.to).map((l) => l.group.slug),
				`${edge.to} не бачить, що постала з ${edge.from}`
			).toContain(edge.from);
		}
	});

	it('підпис виводиться з кількості, а не записаний', () => {
		for (const group of GROUPS) {
			const { predecessors, successors, beforeKey, afterKey } = lineageOf(group.slug);
			expect(beforeKey).toBe(
				predecessors.length > 1 ? 'galaxy.lineageMergedFrom' : 'galaxy.lineageWas'
			);
			expect(afterKey).toBe(successors.length > 1 ? 'galaxy.lineageSplitInto' : 'galaxy.lineageBecame');
		}
	});

	it('FreeStyle і ТУ-154 — одна лінія', () => {
		expect(successorsOf('freestyle').map((l) => l.group.slug)).toEqual(['tu-154']);
		expect(predecessorsOf('tu-154').map((l) => l.group.slug)).toEqual(['freestyle']);
		expect(predecessorsOf('freestyle')).toEqual([]);
		expect(successorsOf('tu-154')).toEqual([]);
	});
});
