// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { hiddenCodeNews, replacementFor, NO_NEWS_OVERRIDES } from './newsOverrides';

/**
 * Дві дії адмінки над новиною з КОДУ — і одна пастка між ними.
 *
 * Пастка в тому, що `hidden` і `replacedBy` тримаються окремо (адмінці треба
 * пам'ятати, ЧИМ замінили), а перелік новин мусить прибирати і те, і те. Якщо
 * `hiddenCodeNews` колись почне віддавати самі лише `hidden`, замінена новина
 * стане в перелік поруч зі своєю новою версією — тобто двічі, і мовчки.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено: у `hiddenCodeNews` прибрано `Object.keys(overrides.replacedBy)` —
 * упала перевірка «замінена новина теж прихована»; `replacementFor` навчено
 * повертати `null` замість `undefined` — упала перевірка про «нічим не
 * замінена».
 */

describe('перевизначення новин', () => {
	const приклад = { hidden: ['стара-новина'], replacedBy: { 'ювілей-2026': 'aBcD1234' } };

	it('приховані — це і `hidden`, і замінені', () => {
		const набір = hiddenCodeNews(приклад);
		expect(набір.has('стара-новина'), '«hidden» не потрапило в набір').toBe(true);
		expect(набір.has('ювілей-2026'), 'замінена новина стане в перелік двічі').toBe(true);
		expect(набір.size).toBe(2);
	});

	it('нічого не приховано — набір порожній, а не «все»', () => {
		expect(hiddenCodeNews(NO_NEWS_OVERRIDES).size).toBe(0);
		// `null` — стан «база ще не відповіла»: до відповіді показуємо все.
		expect(hiddenCodeNews(null).size).toBe(0);
	});

	it('заміна знаходиться за ключем новини, і лише своя', () => {
		expect(replacementFor(приклад, 'ювілей-2026')).toBe('aBcD1234');
		expect(replacementFor(приклад, 'стара-новина'), 'приховане — не замінене').toBeUndefined();
		expect(replacementFor(приклад, 'такої-немає')).toBeUndefined();
		expect(replacementFor(null, 'ювілей-2026')).toBeUndefined();
	});
});
