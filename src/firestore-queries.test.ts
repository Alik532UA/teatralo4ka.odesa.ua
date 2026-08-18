// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * CLOUD-DATABASE-v8 § 7.1 (`CDB-QUERY-LIMIT`, HIGH): кожен запит колекції
 * Firestore має `limit()`.
 *
 * ЧОМУ ЦЕ ІНВАРІАНТ, А НЕ КОД-РЕВ'Ю. Запит без межі не виглядає дефектом і не
 * поводиться як дефект: він правильний, він швидкий, він віддає саме те, що
 * просили. Ціна росте лінійно з наповненням бази — тобто дефект приходить не
 * від зміни коду, а від часу. Заміряно 2026-08-19: у проєкті було вісім таких
 * запитів, серед них `getArticles` без `maxItems`, який читає колекцію статей
 * ЦІЛКОМ і виконується АНОНІМНО на кожній сторінці з віджетом вмісту.
 *
 * Перевірка навмисно текстова, а не типова. Тип `Query` нічого не знає про
 * `limit`, а виклики розсипані по сервісах і по `.svelte`-файлах адмінки — тож
 * ловити це можна лише над джерелами. Зворотний експеримент: прибрати
 * `limit(PUBLIC_ARTICLES_LIMIT)` з `getArticles` → перевірка червона (перевірено
 * 2026-08-19).
 */

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/\\/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(ts|svelte)$/.test(entry)) out.push(full);
	}
	return out;
};

/**
 * Витягує аргументи кожного виклику `query(` з балансуванням дужок.
 *
 * Регулярка тут не працює в принципі: виклик займає до семи рядків, містить
 * вкладені `where(...)`, `orderBy(...)` і рядки з дужками всередині. Наївний
 * `/query\(([^)]*)\)/` обрізався б на першій же внутрішній дужці — і тоді
 * `limit()`, який стоїть останнім, не побачив би ЖОДЕН запит, тобто перевірка
 * була б червона завжди й її вимкнули б наступного дня.
 */
function queryCallArgs(source: string): string[] {
	const out: string[] = [];
	const re = /\bquery\s*\(/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(source))) {
		let depth = 1;
		let i = m.index + m[0].length;
		const start = i;
		while (i < source.length && depth > 0) {
			const ch = source[i];
			if (ch === '(') depth++;
			else if (ch === ')') depth--;
			i++;
		}
		out.push(source.slice(start, i - 1));
	}
	return out;
}

describe('запити до Firestore мають межу', () => {
	const sources = walk('src')
		.filter((f) => !/\.(test|spec)\.ts$/.test(f))
		.map((file) => ({ file, text: readFileSync(file, 'utf8') }))
		// Лише файли, які справді ходять у Firestore. `query(` як слово
		// зустрічається і в іншому значенні (медіа-запити, DOM-селектори).
		.filter(({ text }) => /from ["']firebase\/firestore["']/.test(text));

	const calls = sources.flatMap(({ file, text }) =>
		queryCallArgs(text).map((args) => ({ file, args, text }))
	);

	it('знаходить запити — перевірка жива', () => {
		// Без цього рядка перевірка зеленіє на порожньому списку: досить
		// перейменувати `query` в імпорті або зламати розбір, і вона більше
		// нічого не перевіряє, лишаючись зеленою (AI-AGENT-PITFALLS-v8 § 1).
		expect(sources.length, 'жодного файла з імпортом firebase/firestore').toBeGreaterThan(3);
		expect(calls.length, 'жодного виклику query() не розібрано').toBeGreaterThan(8);
	});

	/**
	 * `query(ref, ...constraints)` — межа лежить не в тексті виклику, а в масиві,
	 * який збирали вище. Текстова перевірка бачить лише `...constraints`, тож без
	 * цього кроку `getArticles` рахувався б запитом без межі назавжди — тобто
	 * перевірку довелося б вимкнути на першому ж прогоні. Дивимося, чи в тому
	 * самому файлі цей масив узагалі отримує `limit(`.
	 */
	function spreadCarriesLimit(args: string, text: string): boolean {
		const spread = /\.\.\.(\w+)/.exec(args);
		if (!spread) return false;
		const name = spread[1];
		return (
			new RegExp(`${name}\\.push\\(limit\\(`).test(text) ||
			new RegExp(`${name}\\s*=\\s*\\[[^\\]]*limit\\(`).test(text)
		);
	}

	it('кожен запит колекції має limit()', () => {
		const unbounded = calls
			.filter(({ args, text }) => !/\blimit\s*\(/.test(args) && !spreadCarriesLimit(args, text))
			.map(({ file, args }) => `${file}: query(${args.replace(/\s+/g, ' ').slice(0, 90)}…`);

		expect(
			unbounded,
			'запит колекції без limit() — Firestore тарифікує КОЖЕН прочитаний документ,\n' +
				'тож ціна цих запитів росте разом із наповненням бази, а не зі змінами коду.\n' +
				'Стелі живуть у src/lib/firebase/queryLimits.ts (CLOUD-DATABASE-v8 § 7.1):\n  ' +
				unbounded.join('\n  ')
		).toEqual([]);
	});

	it('стеля-число не пишеться на місці виклику', () => {
		// Число просто в `limit(50)` не помилка сама по собі, але саме так
		// стелі розходяться: два списки того самого вмісту починають показувати
		// різну кількість, і причину шукають у правилах доступу.
		//
		// `limit(1)` — виняток, і не з поблажливості: одиниця тут не стеля, а
		// сама суть запиту «знайди документ за slug». Назвати її константою
		// означало б дати ім’я тому, що ніколи не змінюється, і приховати від
		// читача, що запит віддає рівно один документ.
		const inline = calls
			.filter(({ args }) => /\blimit\s*\(\s*\d+\s*\)/.test(args))
			.filter(({ args }) => !/\blimit\s*\(\s*1\s*\)/.test(args))
			.map(({ file }) => file);

		expect(
			[...new Set(inline)],
			'limit() з числом на місці виклику — стеля мусить мати ім’я в queryLimits.ts'
		).toEqual([]);
	});

	it('перелік стель не має мертвих записів', () => {
		const limits = readFileSync('src/lib/firebase/queryLimits.ts', 'utf8');
		const declared = [...limits.matchAll(/^export const (\w+)\s*=/gm)].map((m) => m[1]);
		expect(declared.length, 'жодної стелі не оголошено').toBeGreaterThan(3);

		const allSources = sources.map(({ text }) => text).join('\n');
		const unused = declared.filter((name) => !allSources.includes(name));
		expect(
			unused,
			`стеля оголошена і не використана — або запит її втратив, або запис мертвий:\n  ${unused.join(', ')}`
		).toEqual([]);
	});
});
