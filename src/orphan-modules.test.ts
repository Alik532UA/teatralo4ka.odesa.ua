import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

/**
 * Інваріант: кожен модуль у `src/lib` кимось імпортується.
 *
 * PROJECT-STRUCTURE-v8 називає непідключений модуль порушенням рівня HIGH, і
 * причина не в охайності. Осиротілий файл читається як робоча частина проєкту:
 * його правлять, на нього посилаються в обговореннях, його бачить агент і бере
 * за приклад — а він не виконується ніколи. Рівно так у цьому проєкті прожив
 * `errorLogger`: написаний, покритий дев'ятьма тестами й не імпортований
 * нізвідки (AI-AGENT-PITFALLS-v8 § 3, «існування ≠ досяжність»).
 *
 * ## Дві пастки самої перевірки — обидві спрацювали тут
 *
 * 1. **Barrel-імпорт.** `schemas/index.ts` виглядає осиротілим, бо його беруть
 *    як `from '../schemas'` — назви файлу в специфікаторі немає взагалі. Тому
 *    для `index.ts` зіставляється ім'я КАТАЛОГУ.
 * 2. **Побічний імпорт без `from`.** `import '$lib/i18n';` у `+layout.ts` не
 *    має слова `from`, і регулярка, написана лише під `from '…'`, оголошувала
 *    осиротілими `i18n/index.ts` і слідом усі чотири контролери. Перший прогін
 *    цієї перевірки дав 27 «сиріт» замість 20 — і саме хибні спрацювання, а не
 *    справжні знахідки, роблять інваріант таким, який вимикають.
 *
 * Третє: `.svelte.ts` імпортують БЕЗ `.ts` (`from './toast.svelte'`), тож
 * зіставляти треба обидві форми імені.
 *
 * Четверте, знайдене вже після впровадження: споживач може бути ПОЗА `src/`.
 * `config/redirects.ts` читають `scripts/generate-sitemap.ts` і `e2e/pages.ts`,
 * і поки перевірка збирала імпорти лише зі `src/`, вона оголосила його
 * осиротілим. Це не дрібниця обходу: реєстр, спільний для збірки й тестів, —
 * саме та річ, яку варто мати, і перевірка карала б за неї.
 */

const LIB_ROOT = 'src/lib';

/**
 * Де шукати СПОЖИВАЧІВ. Ширше, ніж `src/`: скрипти збірки та E2E — теж код
 * проєкту, і модуль, потрібний лише їм, не осиротілий.
 */
const CONSUMER_ROOTS = ['src', 'scripts', 'e2e', 'vitest'];

/**
 * Дозволені винятки. Список має лишатися коротким: щойно в ньому з'явиться
 * десяток записів, він перестане читатися й перевірка перетвориться на
 * декорацію. Двадцять модулів, з яких вона починалася, тому не внесені сюди,
 * а видалені.
 */
const ALLOWED_ORPHANS = new Set([
	// Заглушка зі скаффолда SvelteKit: сам файл — це коментар «кладіть сюди те,
	// що імпортуєте через $lib». Видалення нічого не дає, бо `svelte-kit sync`
	// створює його знову.
	'src/lib/index.ts'
]);

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, out);
		else out.push(p.split('\\').join('/'));
	}
	return out;
}

/** Усі специфікатори імпорту, які взагалі зустрічаються в `src/`. */
function collectImportSpecifiers(sources: string[]): Set<string> {
	const specs = new Set<string>();
	for (const file of sources) {
		const text = readFileSync(file, 'utf8');
		for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) specs.add(m[1]);
		for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.add(m[1]);
		for (const m of text.matchAll(/import\.meta\.glob\(\s*['"]([^'"]+)['"]/g)) specs.add(m[1]);
		// Побічний імпорт: `import '$lib/i18n';` — без `from`.
		for (const m of text.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) specs.add(m[1]);
	}
	return specs;
}

function findOrphans(): string[] {
	// Споживачі — з усіх коренів; кандидати в сироти — лише з `src/lib`.
	//
	// Тестові файли споживачами НЕ рахуються, і це головне рішення тут. Саме
	// такий випадок ця перевірка й має ловити: `errorLogger` був написаний,
	// покритий дев'ятьма тестами й не імпортований нізвідки — тобто логування
	// помилок виглядало працюючим і не існувало. Якби власний тест зараховувався
	// за досяжність, інваріант пропустив би рівно ту помилку, заради якої стоїть.
	const consumers = CONSUMER_ROOTS.flatMap((root) => walk(root)).filter(
		(f) => /\.(svelte|ts)$/.test(f) && !/\.(test|spec)\.ts$/.test(f)
	);
	const specifierNames = new Set([...collectImportSpecifiers(consumers)].map((s) => basename(s)));

	const sources = walk('src').filter(
		(f) => /\.(svelte|ts)$/.test(f) && !/\.(test|spec)\.ts$/.test(f)
	);

	const orphans: string[] = [];
	for (const file of sources) {
		if (!file.startsWith(`${LIB_ROOT}/`)) continue;
		if (ALLOWED_ORPHANS.has(file)) continue;

		const base = basename(file);
		// `toast.svelte.ts` імпортують як `./toast.svelte`; `foo.ts` — як `./foo`.
		const withoutTs = base.replace(/\.ts$/, '');
		const bare = base.replace(/\.svelte\.ts$/, '').replace(/\.(svelte|ts)$/, '');

		let reachable =
			specifierNames.has(base) || specifierNames.has(withoutTs) || specifierNames.has(bare);

		if (!reachable && base === 'index.ts') {
			// Barrel: `from '../schemas'` — у специфікаторі ім'я каталогу.
			const dir = basename(file.slice(0, file.length - '/index.ts'.length));
			reachable = specifierNames.has(dir);
		}

		if (!reachable) orphans.push(file);
	}
	return orphans;
}

describe('осиротілі модулі', () => {
	it('кожен модуль у src/lib кимось імпортується', () => {
		const orphans = findOrphans();
		expect(
			orphans,
			`модулі, які не імпортує ніхто (PROJECT-STRUCTURE-v8: підключити або видалити):\n${orphans.join('\n')}`
		).toEqual([]);
	});

	it('перевірка справді дивиться на файли, а не на порожній список', () => {
		// Зворотний бік інваріанта: якби `walk` нічого не знаходив, попередній
		// тест був би зелений завжди. Перевірка на порожньому наборі — це та сама
		// тест-заглушка, лише замаскована.
		const scanned = walk('src').filter((f) => f.startsWith(`${LIB_ROOT}/`));
		expect(scanned.length).toBeGreaterThan(50);
	});
});
