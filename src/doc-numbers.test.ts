// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import MASTERS from './lib/data/masters.index.json';
import { masterSection, type MasterIndexEntry } from './lib/data/masters';

/**
 * Число, записане в документації, звіряється з тим, що воно описує
 * (AI-AGENT-PITFALLS-v8 § 5.5, `PIT-NUMBER-UNDER-GATE`, `GATE-DOC-NUMBERS`).
 *
 * ## Чому це не педантизм
 *
 * `AGENTS.md` — перший файл, який читає наступний агент, і читає його як факт
 * про репозиторій. Заміряно 2026-09-02, і масштаб розходження тут головний
 * аргумент:
 *
 * | записано в `AGENTS.md` | насправді |
 * | --- | --- |
 * | `category: pedagogues (25)` | категорії `pedagogues` НЕМАЄ в `MASTER_CATEGORIES` узагалі |
 * | `status: active 87 / former 28 / honorary 3` | `75 / 64 / 6` |
 * | «поля немає у 75 записів» | 55 |
 * | розділ `history` 20, `needsClarification` 64 | 56 і 25 |
 * | `npm test` — «77 файлів, 780 перевірок» | 96 файлів |
 *
 * Перший рядок гірший за решту: він не застарів, він описує таксономію, якої
 * більше не існує. Агент, що напише код під `category === 'pedagogues'`,
 * отримає мовчазний `false` — жодна перевірка проєкту такого не помітить, бо
 * рядок узятий із документації, а не з типу.
 *
 * ## Чому саме таблиця, а не числа в прозі
 *
 * Канон дає два виходи: число або генерується, або стоїть під гейтом. Проза
 * непарсабельна без крихких регулярок, тож числа зібрані в ОДНУ таблицю з
 * маркером, а з прози прибрані. Таблиця вручну не правиться — падіння називає
 * і ключ, і обидва числа.
 *
 * Зворотний експеримент (§ 1.1): змінити будь-яке число в таблиці `AGENTS.md`
 * на одиницю — перевірка мусить назвати вісь, ключ і різницю. Зроблено.
 */

const AGENTS = 'AGENTS.md';

/** Маркер таблиці. Його зникнення означає, що перевірка більше не бачить нічого. */
const МАРКЕР = 'ЧИСЛА ПІД ГЕЙТОМ';

const source = readFileSync(AGENTS, 'utf8');

/**
 * Значення однієї комірки таблиці у вигляді мапи «ключ → скільки».
 *
 * Ключ у зворотних лапках, число одразу за ним. Окремо ловиться «без поля N» —
 * відсутність поля теж значення, і саме воно найчастіше й розходиться.
 */
function pairsOf(cell: string): Record<string, number> {
	const out: Record<string, number> = {};
	for (const m of cell.matchAll(/`([A-Za-z]+)`\s+(\d+)/g)) out[m[1]] = Number(m[2]);
	const none = /без поля\s+(\d+)/.exec(cell);
	if (none) out['(без поля)'] = Number(none[1]);
	return out;
}

/** Рядок таблиці, знайдений за текстом першої комірки. */
function row(marker: string): string {
	const line = source
		.split('\n')
		.find((l) => l.startsWith('|') && l.split('|')[1]?.includes(marker));
	if (!line) throw new Error(`у ${AGENTS} немає рядка таблиці з «${marker}» — таблицю переписали`);
	return line.split('|')[2] ?? '';
}

/** Скільки записів у кожному значенні поля. */
function tally(pick: (m: MasterIndexEntry) => string | undefined): Record<string, number> {
	const out: Record<string, number> = {};
	for (const m of MASTERS as MasterIndexEntry[]) {
		const key = pick(m) ?? '(без поля)';
		out[key] = (out[key] ?? 0) + 1;
	}
	return out;
}

/** Різниця двох мап у вигляді рядків «ключ: записано X, насправді Y». */
function diff(written: Record<string, number>, real: Record<string, number>): string[] {
	const keys = [...new Set([...Object.keys(written), ...Object.keys(real)])].sort();
	return keys
		.filter((k) => written[k] !== real[k])
		.map((k) => `${k}: записано ${written[k] ?? '—'}, насправді ${real[k] ?? '—'}`);
}

describe(`числа в ${AGENTS}`, () => {
	it('перевірка жива: маркер і таблиця на місці', () => {
		expect(source.includes(МАРКЕР), `у ${AGENTS} зник маркер «${МАРКЕР}»`).toBe(true);
		expect(Object.keys(pairsOf(row('`status`'))).length).toBeGreaterThan(1);
	});

	it('усього записів у реєстрі майстрів', () => {
		const written = Number(/\|\s*усього\s*\|\s*(\d+)\s*\|/.exec(source)?.[1]);
		expect(written, 'рядок «усього» в таблиці не знайдено').not.toBeNaN();
		expect(written).toBe(MASTERS.length);
	});

	it('`category` — роль', () => {
		const bad = diff(pairsOf(row('`category`')), tally((m) => m.category));
		expect(bad, `таблиця розійшлася з masters.index.json:\n${bad.join('\n')}`).toEqual([]);
	});

	it('`status` — життєвий цикл', () => {
		const bad = diff(pairsOf(row('`status`')), tally((m) => m.status));
		expect(bad, `таблиця розійшлася з masters.index.json:\n${bad.join('\n')}`).toEqual([]);
	});

	it('розділ на сторінці — похідна `masterSection`', () => {
		const bad = diff(pairsOf(row('розділ')), tally((m) => masterSection(m)));
		expect(bad, `таблиця розійшлася з masters.index.json:\n${bad.join('\n')}`).toEqual([]);
	});

	/**
	 * Прогалини — це те, заради чого таблицю читають найчастіше: «що тут ще не
	 * заповнено». Саме тому їх число й старіє найшвидше, і саме тому воно тут.
	 */
	it('прогалини — скільки записів без поля', () => {
		const порожнє = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
		const real: Record<string, number> = {};
		for (const field of ['subjects', 'roleTitle', 'photo', 'departments'] as const) {
			real[field] = (MASTERS as MasterIndexEntry[]).filter((m) => порожнє(m[field])).length;
		}
		const bad = diff(pairsOf(row('прогалини')), real);
		expect(bad, `таблиця розійшлася з masters.index.json:\n${bad.join('\n')}`).toEqual([]);
	});

	it('скільки записів не показуємо на сайті', () => {
		const written = Number(/\|\s*не показуємо[^|]*\|\s*(\d+)\s*\|/.exec(source)?.[1]);
		expect(written, 'рядок «не показуємо» в таблиці не знайдено').not.toBeNaN();
		expect(written).toBe((MASTERS as MasterIndexEntry[]).filter((m) => m.visible === false).length);
	});

	/**
	 * Копії тих самих чисел в іншому документі.
	 *
	 * Гейт вище тримає ОДНУ таблицю. Якщо ті самі значення записати ще й у
	 * `PROJECT-CONTEXT.md` — а саме так і було до 2026-09-02, — друга копія
	 * поїде окремо, і гейт про це не дізнається: він дивиться не туди. Саме це
	 * там і сталося: `pedagogues (25)` в описі теперішнього часу, `active (84)`
	 * замість 75, склад розділів із двома найбільшими навпаки.
	 *
	 * Тому перевірка не звіряє другу копію, а забороняє її: у
	 * `PROJECT-CONTEXT.md` поруч із ключами осей не має стояти числа. Посилання
	 * на таблицю — можна й треба.
	 */
	it('PROJECT-CONTEXT.md не тримає власної копії цих чисел', () => {
		const другий = readFileSync('PROJECT-CONTEXT.md', 'utf8');
		const ключі = [
			...new Set([
				...Object.keys(tally((m) => m.category)),
				...Object.keys(tally((m) => m.status)),
				...Object.keys(tally((m) => masterSection(m))),
				// Значення, якого більше немає в `MASTER_CATEGORIES`: у теперішньому
				// часі воно не має права стояти взагалі, з числом чи без.
				'pedagogues'
			])
		].filter((k) => /^[a-z]+$/i.test(k));

		const копії: string[] = [];
		for (const key of ключі) {
			// `\d{1,3}(?![\d-])` — щоб не зачепити дату: «`administration` 2026-08-24»
			// це не число записів, а коли роль відділили.
			const re = new RegExp('`' + key + '`\\s*\\(?\\s*\\d{1,3}(?![\\d-])', 'g');
			for (const m of другий.matchAll(re)) {
				копії.push(`рядок ${другий.slice(0, m.index).split('\n').length}: ${m[0]}`);
			}
		}

		expect(
			копії,
			'число поруч із ключем осі в PROJECT-CONTEXT.md — це друга копія, яка ' +
				'поїде окремо від таблиці під гейтом. Замінити посиланням на неї:\n  ' +
				копії.join('\n  ')
		).toEqual([]);
	});

	/**
	 * Кількість файлів перевірок, названа в блоці команд.
	 *
	 * Число перевірок (`N passed`) свідомо НЕ записується: дізнатися його можна
	 * лише прогоном, тобто така цифра застаріває від будь-якого нового `it` і
	 * гейтом не тримається в принципі. Канон дає для цього випадку окремий
	 * вихід — не писати число, а послатися на гейт (`GATE-DOC-NUMBERS`).
	 */
	it('скільки файлів перевірок ганяє `npm test`', () => {
		const written = Number(/npm test\b[^\n]*?\((\d+) файл/.exec(source)?.[1]);
		expect(written, 'у блоці команд немає числа файлів для `npm test`').not.toBeNaN();

		const walk = (dir: string, out: string[] = []): string[] => {
			if (!existsSync(dir)) return out;
			for (const entry of readdirSync(dir)) {
				const full = join(dir, entry);
				if (statSync(full).isDirectory()) walk(full, out);
				else if (/\.(spec|test)\.ts$/.test(entry)) out.push(full);
			}
			return out;
		};
		// Ті самі два місця, що в масці `include` у `vitest.config.ts`.
		const real = walk('src').length + walk(join('vitest', 'support')).length;

		expect(written, `у ${AGENTS} записано ${written} файлів, а їх ${real}`).toBe(real);
	});
});
