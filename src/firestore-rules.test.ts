// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

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
