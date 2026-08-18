// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Поле перекладу, додане в код, але не додане в правила Firestore.
 *
 * Це найтихіший дефект у всьому ланцюжку збереження. `isValidTranslationBlock`
 * використовує `keys().hasOnly([...])` — тобто allowlist: НЕВІДОМИЙ ключ
 * відхиляє запис ЦІЛКОМ, із permission-denied. Тому нове поле без правила
 * означає, що форма перестає зберігати взагалі, і виглядає це як дефект форми.
 *
 * Ані типи, ані `svelte-check`, ані E2E цього не бачать: правила живуть у
 * `firebase/firestore.rules`, і CI їх навіть не деплоїть — це ручний крок
 * (`firebase deploy --only firestore:rules`). Отже розходження між кодом і
 * правилами може прожити до першої спроби зберегти статтю в продакшні.
 *
 * Перевірка навмисно порівнює НЕ весь документ, а лише блок перекладу: саме
 * там поля додають найчастіше.
 */

/** Усі джерела проєкту — потрібні другому describe, який звіряє правила з кодом. */
const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/[\\/]/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(ts|svelte)$/.test(entry)) out.push(full);
	}
	return out;
};

const RULES = readFileSync('firebase/firestore.rules', 'utf8');
const SCHEMA = readFileSync('src/lib/schemas/index.ts', 'utf8');

/** Список із `block.keys().hasOnly([...])` у `isValidTranslationBlock`. */
function allowedTranslationKeys(): string[] {
	const fn = RULES.split('function isValidTranslationBlock')[1] ?? '';
	const list = /hasOnly\(\[([^\]]+)\]\)/.exec(fn)?.[1];
	if (!list) return [];
	return [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Поля з `ArticleTranslationSchema` у `schemas/index.ts`. */
function schemaTranslationKeys(): string[] {
	const block = SCHEMA.split('export const ArticleTranslationSchema = z.object({')[1] ?? '';
	const body = block.split('\n});')[0];
	// Рядки виду `name: …` на початку рядка; коментарі відкидаємо разом із ними.
	return [...body.matchAll(/^\t([A-Za-z_][\w]*)\s*:/gm)].map((m) => m[1]);
}

describe('правила Firestore не розходяться зі схемою', () => {
	const allowed = allowedTranslationKeys();
	const schema = schemaTranslationKeys();

	it('обидва списки прочитані — перевірка жива', () => {
		expect(allowed.length, 'hasOnly у isValidTranslationBlock не знайдено').toBeGreaterThan(3);
		expect(schema.length, 'поля ArticleTranslationSchema не знайдено').toBeGreaterThan(3);
	});

	it('кожне поле перекладу зі схеми дозволене правилами', () => {
		const missing = schema.filter((k) => !allowed.includes(k));
		expect(
			missing,
			`ці поля є в ArticleTranslationSchema, але не в hasOnly() у firebase/firestore.rules —\n` +
				`Firestore відхилить ЗАПИС ЦІЛКОМ із permission-denied:\n  ${missing.join(', ')}\n` +
				`Після виправлення правила треба задеплоїти окремо: firebase deploy --only firestore:rules`
		).toEqual([]);
	});

	it('у правилах немає полів, яких схема вже не знає', () => {
		// Зворотний бік: поле прибрали з коду, а в правилах воно лишилося.
		// Не помилка безпеки, але слід за собою прибирати.
		const stale = allowed.filter((k) => !schema.includes(k));
		expect(stale, `у правилах лишилися невідомі схемі поля: ${stale.join(', ')}`).toEqual([]);
	});

	/**
	 * Другий whitelist у тих самих правилах, і забути його так само дорого:
	 * документ налаштувань без id у цьому списку не читається відвідувачами
	 * (сайт рендериться без входу) і не зберігається адміністратором.
	 */
	it('кожен документ налаштувань, який читає код, дозволений правилами', () => {
		const service = readFileSync('src/lib/services/settings.ts', 'utf8');
		const used = new Set(
			[...service.matchAll(/"settings",\s*"([\w-]+)"/g)].map((m) => m[1])
		);
		expect(used.size, 'звернень до settings/<id> у сервісі не знайдено').toBeGreaterThan(3);

		const listed = /function isValidSettingId[\s\S]*?sid in \[([^\]]+)\]/.exec(RULES)?.[1] ?? '';
		const allowed = new Set([...listed.matchAll(/'([^']+)'/g)].map((m) => m[1]));

		const missing = [...used].filter((id) => !allowed.has(id));
		expect(
			missing,
			`ці документи налаштувань читає код, але правила їх не дозволяють:
  ${missing.join(', ')}
` +
				`Після виправлення правила треба задеплоїти окремо: firebase deploy --only firestore:rules`
		).toEqual([]);
	});

	it('кожне медіа-поле має обмеження довжини в правилах', () => {
		// Без `size()` можна записати рядок на мегабайти в кожен документ.
		for (const field of ['coverUrl', 'videoUrl', 'externalUrl']) {
			expect(RULES, `${field} без обмеження розміру`).toContain(`block.${field}.size() <=`);
		}
	});
});

/**
 * CLOUD-DATABASE-v8 § 4.2 (`CDB-DEFAULT-DENY`, CRITICAL) і § 5 (`CDB-GATE-FROM-CODE`,
 * HIGH): типове правило — заборона, а перелік випадків виводиться зі шляхів, у
 * які пише КОД, а не лише з файлу правил.
 *
 * Обидва напрямки ламаються тихо й по-різному, і жоден інший гейт проєкту цього
 * не бачить — правила виконуються на боці бази, у `src/` і у `build/` їх стану
 * немає, а CI їх навіть не деплоїть (це ручний крок).
 *
 * • Код пішов у нову колекцію, правила про неї не знають → catch-all віддає
 *   `permission-denied`, і виглядає це як зламана форма, а не як забуті правила.
 * • Catch-all прибрали або він перестав бути останнім → нова колекція
 *   успадковує дозвіл згори, і читає її будь-хто з публічним конфігом. Саме цей
 *   бік і є CRITICAL: ізоляція між сайтами шкіл тримається ВИКЛЮЧНО на цьому
 *   файлі, бо проєкт Firebase один на всі сайти.
 */
describe('правила Firestore не розходяться з кодом', () => {
	// `projects/*/articles/*` — форма шляху, де конкретні id зведені до зірочки.
	const shape = (segments: string[]) =>
		segments.map((s) => (/^["'].*["']$/.test(s.trim()) ? s.trim().slice(1, -1) : '*')).join('/');

	// Шляхи з коду: `doc(db, …)` — документ, `collection(db, …)` — плюс сегмент-зірочка.
	function codePaths(): Map<string, string[]> {
		const found = new Map<string, string[]>();
		for (const file of walk('src')) {
			if (/\.(test|spec)\.ts$/.test(file)) continue;
			const text = readFileSync(file, 'utf8');
			for (const m of text.matchAll(/\b(doc|collection)\(\s*db\s*,([^)]*)\)/g)) {
				const segments = m[2]
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean);
				if (segments.length === 0) continue;
				const path = shape(segments) + (m[1] === 'collection' ? '/*' : '');
				found.set(path, [...(found.get(path) ?? []), file]);
			}
		}
		return found;
	}

	/** Форми шляхів із `match /…` у правилах. Catch-all не рахуємо. */
	function rulePaths(): string[] {
		return [...RULES.matchAll(/match\s+\/([^{\s]*(?:\{[^}]+\}[^{\s]*)*)\s*\{/g)]
			.map((m) => m[1])
			.filter((p) => !p.startsWith('databases') && !p.includes('=**'))
			.map((p) =>
				p
					.split('/')
					.filter(Boolean)
					.map((s) => (s.startsWith('{') ? '*' : s))
					.join('/')
			);
	}

	const fromCode = codePaths();
	const fromRules = rulePaths();

	/**
	 * Порівняння посегментне, а не рядкове.
	 *
	 * Код звертається до settings/home — конкретного документа, — а
	 * правило описує `projects/{projectId}/settings/{settingId}`. Рядкова рівність
	 * тут дала б шість «непокритих» шляхів на жодному справжньому дефекті: рівно
	 * той клас хибних спрацювань, через який інваріанти вимикають.
	 */
	const covered = (codePath: string) =>
		fromRules.some((rulePath) => {
			const rule = rulePath.split('/');
			const code = codePath.split('/');
			if (rule.length !== code.length) return false;
			return rule.every((seg, i) => seg === '*' || seg === code[i]);
		});

	it('обидва боки прочитані — перевірка жива', () => {
		// Порожній будь-який із двох списків робить решту перевірок зеленими ні
		// про що: досить змінити написання виклику або формат `match`
		// (AI-AGENT-PITFALLS-v8 § 1). Числа не точні, а «більше за очевидний мінімум».
		expect(fromCode.size, 'жодного шляху до Firestore у джерелах не знайдено').toBeGreaterThan(2);
		expect(fromRules.length, 'жодного match у правилах не розібрано').toBeGreaterThan(2);
	});

	it('кожен шлях із коду має власне правило', () => {
		const uncovered = [...fromCode.entries()]
			.filter(([path]) => !covered(path))
			.map(([path, files]) => `${path} — ${[...new Set(files)].join(', ')}`);

		expect(
			uncovered,
			'код звертається до шляху, для якого в firebase/firestore.rules немає match.\n' +
				'Catch-all наприкінці файлу віддасть permission-denied, і виглядатиме це\n' +
				'як зламана форма, а не як забуті правила:\n  ' +
				uncovered.join('\n  ')
		).toEqual([]);
	});

	/**
	 * ЗВОРОТНОГО НАПРЯМКУ ТУТ НЕМА, І ЦЕ РІШЕННЯ, А НЕ НЕДОГЛЯД.
	 *
	 * Симетричну перевірку «правило без звернення з коду» написали першою — вона
	 * знайшла шлях документа школи (правила дозволяють створення й
	 * редагування, код цього репозиторію туди не пише). Це не мертве правило:
	 * проєкт Firebase ОДИН на всі сайти шкіл, тож у цьому файлі законно живуть
	 * шляхи, якими користуються сусідні сайти й консоль.
	 *
	 * Тобто така перевірка вимагала б видаляти правила, потрібні іншим — і її
	 * вимкнули б першою ж. Ту саму роль тут виконує catch-all: шлях, про який
	 * забули, не отримує дозволу за замовчуванням.
	 */

	it('типове правило — заборона, і вона остання (CRITICAL)', () => {
		const catchAll = /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/;
		expect(RULES, 'немає catch-all «заборонити все» — нова колекція успадкує дозвіл згори').toMatch(
			catchAll
		);

		// Порядок значущий: правило нижче catch-all не звужує його, а лишається
		// недосяжним — і автор такого правила про це не дізнається.
		const catchAllAt = RULES.search(/match\s+\/\{document=\*\*\}/);
		const lastMatchAt = RULES.lastIndexOf('match /');
		expect(
			catchAllAt,
			'catch-all не останній match у файлі — правила під ним недосяжні'
		).toBe(lastMatchAt);
	});

	it('немає жодного allow ... if true', () => {
		const open = [...RULES.matchAll(/allow[^:\n]*:\s*if\s+true\s*;/g)].map((m) => m[0]);
		expect(open, `відкритий доступ у правилах: ${open.join(' | ')}`).toEqual([]);
	});
});
