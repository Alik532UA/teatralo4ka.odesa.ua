/**
 * Хто ця людина в переліку учасників вистави.
 *
 * Учасники в профілях майстрів — вільний текст, набраний руками в різні роки й
 * із різних джерел, а реєстр випускників веде своє написання. Через це та сама
 * людина трапляється в двох виглядах, і саме звідси беруться неприлінковані
 * імена — не з відсутності в реєстрі.
 *
 * Окремим модулем, а не всередині картки: правило зіставлення імен — це чиста
 * логіка з реальними прикладами, і перевіряти її треба тестом, а не оком на
 * сторінці.
 */

export interface NamedEntry {
	slug: string;
	name: string;
}

export interface ParsedName {
	/** Ім'я цілком, зведене до порівнюваного вигляду. */
	full: string;
	/** Ім'я, якщо рядок складається рівно з «Ім'я Прізвище». */
	given: string | null;
	/** Усі прізвища: основне й ті, що в дужках. */
	surnames: string[];
}

/**
 * Зводить рядок до вигляду, у якому порівняння не залежить від дрібниць.
 *
 * Однаково для ОБОХ боків. Доти чистився лише учасник, а ключ реєстру ні, тож
 * навіть дослівно однакові рядки з дужками не збігалися.
 */
export function normalizeName(value: string): string {
	return value
		.toLowerCase()
		.replace(/[’ʼ']/g, "'")
		.replace(/\+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Розбирає «Алла Колесник (Вішневська)» на ім'я та ВСІ його прізвища.
 *
 * У дужках реєстр тримає дівоче прізвище, і саме через них не сходилися ті,
 * кого записали по-різному з двох боків: «Алла Колесник» проти «Алла Колесник
 * (Вішневська)», «Крістіна Співак» проти «Крістіна Слівка (Співак)».
 *
 * Розбирається лише «Ім'я Прізвище»: усе, що не з двох слів (ПІБ майстрів,
 * подвійні прізвища), зіставляється дослівно. Здогадуватися, де в трьох словах
 * прізвище, означало б вигадувати за дані.
 */
export function parseName(raw: string): ParsedName {
	const full = normalizeName(raw);
	const inBrackets = [...full.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim()).filter(Boolean);
	const parts = full
		.replace(/\([^)]*\)/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.split(' ');

	if (parts.length !== 2) return { full, given: null, surnames: [] };
	return { full, given: parts[0], surnames: [parts[1], ...inBrackets] };
}

/**
 * Готує пошук по списку імен.
 *
 * Розкладка робиться ОДИН раз, а не на кожен виклик: у Федора Ткача вісімдесят
 * вистав, і кожна перебирала б пів тисячі випускників заново.
 *
 * НЕОДНОЗНАЧНЕ зіставлення повертає `null`. Якщо під тим самим іменем і
 * прізвищем у реєстрі двоє, посилання вело б до однієї з них навмання, а чуже
 * посилання під чиїмось іменем гірше за відсутнє.
 */
export function createNameMatcher<T extends NamedEntry>(entries: readonly T[]): (raw: string) => T | null {
	const byFull = new Map<string, T>();
	const byGivenAndSurname = new Map<string, T[]>();

	for (const entry of entries) {
		const parsed = parseName(entry.name);
		if (!byFull.has(parsed.full)) byFull.set(parsed.full, entry);
		if (!parsed.given) continue;

		for (const surname of parsed.surnames) {
			const key = `${parsed.given}|${surname}`;
			const list = byGivenAndSurname.get(key) ?? [];
			if (!list.some((x) => x.slug === entry.slug)) list.push(entry);
			byGivenAndSurname.set(key, list);
		}
	}

	return (raw: string): T | null => {
		const parsed = parseName(raw);
		const exact = byFull.get(parsed.full);
		if (exact) return exact;
		if (!parsed.given) return null;

		const found = new Map<string, T>();
		for (const surname of parsed.surnames) {
			for (const entry of byGivenAndSurname.get(`${parsed.given}|${surname}`) ?? []) {
				found.set(entry.slug, entry);
			}
		}
		return found.size === 1 ? [...found.values()][0] : null;
	};
}
