import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Кожен файл перевірки потрапляє в маску свого раннера — ОКРЕМИМ ПРОЦЕСОМ.
 *
 * ## Чому не тестом, як усе інше в цьому проєкті
 *
 * Це та рідкісна перевірка, яку не можна писати під раннером, який вона
 * перевіряє (`AI-AGENT-PITFALLS-v9`, `PIT-TEST-DISCOVERY-PROCESS`). Логіка
 * жила в `src/test-runners.test.ts`, тобто під тією самою маскою `include`,
 * правдивість якої доводила. Наслідок видно з одного руху: досить звузити
 * `include` у `vitest.config.ts` — і зникає не лише десяток перевірок, а й
 * та єдина, яка мала про це сказати. Прогін лишається зеленим, «N passed»
 * просто менше, і ніщо в звіті не натякає, що частину коду більше не
 * перевіряють.
 *
 * Той файл мав власне пом'якшення — тест «маска сама себе покриває». Воно
 * нічого не рятує з тієї самої причини: щоб упасти, тест мусить виконатися,
 * а він саме й не виконується.
 *
 * Тому перевірка стоїть у `pretest`: npm запускає її ПЕРЕД `vitest`, окремим
 * процесом, який про маску нічого не знає, доки сам її не прочитає. Її ж
 * кличе `scripts/gates.mjs`, щоб те саме ловилося перед комітом.
 *
 * ## Зворотній бік: хто стереже саму цю обгортку
 *
 * Скрипт, якого ніхто не кличе, — той самий клас дефекту, лише навпаки. Тому
 * `src/test-runners.test.ts` тепер перевіряє ПРОВОДКУ: у `package.json` є
 * `pretest`, він кличе саме цей файл, і файл лежить на диску. Два власники
 * різних боків однієї гарантії, і жоден не може мовчки знищити другого.
 *
 * ## Зворотний експеримент (`PIT-REVERSE-EXPERIMENT`)
 *
 * `include` у `vitest.config.ts` тимчасово звужено до `src/lib/**` — скрипт
 * назвав 52 файли з кореня `src/`, які випали з прогону. Той самий дослід із
 * перевіркою всередині vitest давав зелене «менше тестів» і жодного слова.
 */

const ROOT = process.cwd().replace(/\\/g, '/');

/** Каталоги, у яких взагалі можуть лежати файли перевірок. */
const ДЕ_ШУКАТИ = ['src', 'tests', 'e2e', 'vitest', 'scripts'];

const VITEST_CONFIG = 'vitest.config.ts';

function walk(dir, out = []) {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(spec|test)\.(ts|js)$/.test(entry)) out.push(full.replace(/\\/g, '/'));
	}
	return out;
}

/** Літерал регексу з довільного тексту. */
const quote = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Glob у регекс — одним проходом.
 *
 * Розкривати `{a,b}` окремим `replace` до екранування не можна: наступний
 * прохід екранує вже й дужки з `|` розкритої групи, і шаблон перестає
 * збігатися з чим завгодно.
 */
function globToRegExp(glob) {
	let out = '';
	let i = 0;
	while (i < glob.length) {
		const rest = glob.slice(i);
		if (rest.startsWith('**/')) {
			out += '(?:[^/]+/)*';
			i += 3;
		} else if (rest.startsWith('**')) {
			out += '.*';
			i += 2;
		} else if (rest.startsWith('*')) {
			out += '[^/]*';
			i += 1;
		} else if (rest.startsWith('{')) {
			const close = rest.indexOf('}');
			if (close === -1) {
				out += quote('{');
				i += 1;
			} else {
				out += `(?:${rest
					.slice(1, close)
					.split(',')
					.map(quote)
					.join('|')})`;
				i += close + 1;
			}
		} else {
			out += quote(glob[i]);
			i += 1;
		}
	}
	return new RegExp(`^${out}$`);
}

function playwrightTestDir() {
	const config = readdirSync(ROOT).find((f) => /^playwright\.config\./.test(f));
	if (!config) return null;
	const source = readFileSync(join(ROOT, config), 'utf8');
	const match = source.match(/testDir\s*:\s*['"`]\.?\/?([^'"`]+)['"`]/);
	return match ? match[1].replace(/\/$/, '') : null;
}

function main() {
	const біди = [];

	const файли = ДЕ_ШУКАТИ.flatMap((dir) => walk(join(ROOT, dir))).map((f) =>
		f.slice(ROOT.length + 1)
	);

	if (!existsSync(VITEST_CONFIG)) {
		console.error(`❌ немає ${VITEST_CONFIG} — маску нема де прочитати`);
		process.exit(1);
	}
	const конфіг = readFileSync(VITEST_CONFIG, 'utf8');
	const список = /\binclude\s*:\s*\[([^\]]*)\]/.exec(конфіг)?.[1] ?? '';
	const маски = [...список.matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);

	// --- живість: без цього порожній результат читався б як «усе гаразд» ---
	if (маски.length === 0) біди.push(`у ${VITEST_CONFIG} не знайдено include — розбір зламався`);
	if (файли.length < 50) біди.push(`знайдено лише ${файли.length} файлів перевірок — сканер шукає не там`);

	const playwrightDir = playwrightTestDir();
	if (!playwrightDir) біди.push('у playwright.config не знайдено testDir');

	const шаблони = маски.map(globToRegExp);
	const поза = файли
		// Файли Playwright має свій testDir; за нього відповідає `test-runners.test.ts`.
		.filter((file) => !(playwrightDir && file.startsWith(`${playwrightDir}/`)))
		.filter((file) => !шаблони.some((p) => p.test(file)));

	for (const file of поза) {
		біди.push(`${file}: не потрапляє в жодну маску include — «N passed» його не рахує`);
	}

	if (біди.length) {
		console.error(`❌ файли перевірок поза прогоном (${біди.length}):`);
		for (const b of біди) console.error(`   ${b}`);
		process.exit(1);
	}

	const уVitest = файли.length - файли.filter((f) => f.startsWith(`${playwrightDir}/`)).length;
	console.log(
		`🔎 маска include: ${уVitest} файлів у прогоні vitest, ` +
			`${файли.length - уVitest} у ${playwrightDir}/`
	);
}

main();
