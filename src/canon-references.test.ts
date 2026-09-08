// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Посилання на канон не відстають від версії пакета.
 *
 * Код і документація цього проєкту посилаються на файли пакета 352 рази —
 * `SECURITY-v8 § 6.3`, `AI-AGENT-PITFALLS-v8 § 1.1` і так далі. Це не
 * оздоблення: саме за цими посиланнями наступний читач іде дивитися, ЧОМУ рядок
 * написаний так, а не інакше.
 *
 * Посилання на версію, якої вже немає, гірше за відсутнє. Відсутнє чесно каже
 * «шукай сам»; застаріле веде у файл, якого в пакеті немає, і виглядає при
 * цьому точно так само, як робоче.
 *
 * ## Знайдено цією перевіркою (2026-08-28)
 *
 * Із 352 посилань **два** лишилися від сьомої версії, обидва в
 * `PasswordInput.svelte`: у шапці компонента й у коментарі до `autocomplete`.
 * Обидва документи у восьмій існують і кажуть те саме — тобто переїзд пакета
 * зробили руками й два рядки пропустили. Рівно той клас, який у цьому проєкті
 * вже коштував інших правил: правило без гейта не доживає до наступного
 * переїзду.
 *
 * Третя знахідка інша за природою: у `global.css` назву документа було
 * перенесено на новий рядок посеред слова, і половинка читалася як посилання на
 * документ, якого в пакеті немає. Перенесення тут не косметика — посилання
 * існує рівно для того, щоб його знайшли пошуком, а розрізане не знаходиться
 * ніколи. Тому воно не пропускається, а виправляється.
 *
 * ## Чому перелік файлів вписаний сюди, а не читається з пакета
 *
 * `sveltekit-canon` лежить поза репозиторієм, і в CI його немає — перевірка, що
 * читає його з диска, була б зеленою там завжди, тобто мертвою. Перелік
 * оновлюється тим самим комітом, яким проєкт переїжджає на наступну версію, і
 * саме тоді ця перевірка й має заговорити.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): повернути `FORM-INPUTS-v7`
 * у `PasswordInput.svelte` — перевірка мусить назвати файл, рядок і саме це
 * посилання. Зроблено, падає.
 */

/**
 * ПАКЕТІВ ТЕПЕР ДВА, і кожен зі своєю версією.
 *
 * У v9 сім документів — `SCROLLBAR`, `MINIMAP`, `HOLD-SCROLL`, `NOTIFICATIONS`,
 * `FORM-INPUTS`, `AUTH-FORM`, `INPUT-TOOLS` — переїхали з інженерного пакета в
 * `product_criteria/v1` (CHANGELOG-v9, «Два пакети замість одного»). Критерій
 * переносу: на жоден із них не посилалося жодне правило й жоден гейт — це не
 * стандарт, а рішення автора про вигляд саме цих сайтів.
 *
 * Наслідок для посилань: «SCROLLBAR-v9» тепер веде в нікуди, бо в інженерному
 * пакеті такого файлу немає. Тому перевірка знає обидва пакети й вимагає від
 * кожної назви ВЛАСНОЇ версії — інакше застаріле посилання знову виглядало б
 * робочим.
 *
 * Самі файли продуктового пакета версії в назві не мають (`SCROLLBAR.md`);
 * версія тут — версія ПАКЕТА, і саме її називають посилання в коді.
 */

/** Версія інженерного пакета, на якій стоїть проєкт. Міняється з переїздом. */
const CANON_VERSION = 9;

/** Документи інженерного пакета v9 — 30 файлів, як їх перелічує `canon.json`. */
const CANON_DOCS = new Set([
	'ACCESSIBILITY',
	'AI-AGENT-PITFALLS',
	'AI-PROVIDERS',
	'ANALYTICS',
	'BETA-CHECKLIST',
	'CI-CD-AND-TOOLS',
	'CLOUD-DATABASE',
	'CODE-QUALITY',
	'CUSTOM-DOMAIN',
	'DEBUGGING',
	'DEPENDENCIES',
	'DEPLOY-ENVIRONMENTS',
	'DOCUMENTATION',
	'ERROR-HANDLING',
	'FLUID-SIZING',
	'HOTKEYS',
	'I18N',
	'OBSERVABILITY',
	'PERFORMANCE',
	'PROJECT-STRUCTURE',
	'SECURITY',
	'SEO',
	'STORAGE-NAMESPACE',
	'SVELTE-CORE',
	'SVELTE-UI',
	'SVELTEKIT-DATA',
	'TESTID-AND-NAMING',
	'UI-ELEMENTS',
	'UI-UX',
	'VERSIONING'
]);

/** Версія продуктового пакета. */
const PRODUCT_VERSION = 1;

/** Документи `product_criteria/v1` — сім, як їх перелічує його `canon.json`. */
const PRODUCT_DOCS = new Set([
	'AUTH-FORM',
	'FORM-INPUTS',
	'HOLD-SCROLL',
	'INPUT-TOOLS',
	'MINIMAP',
	'NOTIFICATIONS',
	'SCROLLBAR'
]);

/** Обидва пакети разом: назва документа сама каже, якої версії від неї чекати. */
const PACKAGES: { version: number; docs: Set<string> }[] = [
	{ version: CANON_VERSION, docs: CANON_DOCS },
	{ version: PRODUCT_VERSION, docs: PRODUCT_DOCS }
];

/**
 * Де шукаємо посилання: код, тести, скрипти, документи Й КОНФІГИ в корені.
 *
 * Конфіги додано 2026-09-09, і додано не з міркувань повноти. Сліпу зону
 * знайшло саме те, від чого перевірка стереже: повідомлення правила лінтера
 * казало `STORAGE-NAMESPACE-v8`, я списав його з екрана в докблок коду — і там
 * гейт одразу спіймав застарілу версію, а в самому конфігу вона так і лежала.
 * Тобто перевірка ловила ЛУНУ помилки й не бачила її джерела.
 *
 * За першим же прогоном із цим переліком знайшлося 24 таких посилання у трьох
 * конфігах.
 */
const SCAN_DIRS = ['src', 'e2e', 'scripts'];
const SCAN_FILES = [
	'AGENTS.md',
	'README.md',
	'eslint.config.js',
	'svelte.config.js',
	'vite.config.ts',
	'playwright.config.ts',
	'vitest.config.ts'
];

/**
 * Єдиний файл, який себе не читає.
 *
 * Він мусить називати старі версії й неіснуючі назви — інакше нічим пояснити,
 * що саме шукає. Вирізати коментарі, як у `css-variables.test.ts`, тут не
 * можна: у цьому проєкті посилання на канон ЖИВУТЬ саме в коментарях, і
 * сканер, який їх не бачить, не бачив би нічого. Тому виняток — один файл,
 * названий поіменно, а не клас.
 */
const SELF = 'src/canon-references.test.ts';

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (/\.(ts|svelte|css|html|md)$/.test(entry.name)) out.push(full);
	}
	return out;
}

type Reference = { file: string; line: number; doc: string; version: number };

/** Посилання виду `ДОКУМЕНТ-vN` у тексті, з номером рядка. */
function references(file: string): Reference[] {
	const out: Reference[] = [];
	readFileSync(file, 'utf8')
		.split('\n')
		.forEach((line, i) => {
			for (const m of line.matchAll(/\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)-v(\d+)\b/g)) {
				out.push({
					file: file.replace(/\\/g, '/'),
					line: i + 1,
					doc: m[1],
					version: Number(m[2])
				});
			}
		});
	return out;
}

describe('посилання на канон', () => {
	const files = [...SCAN_DIRS.flatMap((d) => walk(d)), ...SCAN_FILES]
		.map((f) => f.replace(/\\/g, '/'))
		.filter((f) => f !== SELF);
	const found = files.flatMap(references);

	it('перевірка жива: посилання знайдено', () => {
		expect(files.length, 'сканер не знайшов джерел').toBeGreaterThan(100);
		// 352 на момент коміту. Межа нижча за факт, щоб не падати на кожному
		// новому коментарі, але не нульова: нуль означав би зламану регулярку.
		expect(found.length, 'жодного посилання на канон — регулярка зламалася').toBeGreaterThan(200);
	});

	it('розбір живий: складена назва й версія беруться цілком', () => {
		const one = references('package.json').length;
		expect(one, 'у package.json посилань немає — сканер не вигадує їх').toBe(0);

		const sample = [...'SECURITY-v8 § 6.3'.matchAll(/\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)-v(\d+)\b/g)];
		expect(sample[0][1]).toBe('SECURITY');
		expect(sample[0][2]).toBe('8');

		const long = [
			...'TESTID-AND-NAMING-v8 § 1.4'.matchAll(/\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)-v(\d+)\b/g)
		];
		expect(long[0][1], 'складена назва береться цілком').toBe('TESTID-AND-NAMING');
	});

	it('кожне посилання називає версію СВОГО пакета', () => {
		const stale = found
			.filter((r) => {
				const пакет = PACKAGES.find((p) => p.docs.has(r.doc));
				// Незнайому назву судить наступна перевірка, а не ця.
				return пакет ? r.version !== пакет.version : false;
			})
			.map((r) => {
				const пакет = PACKAGES.find((p) => p.docs.has(r.doc))!;
				return (
					`${r.file}:${r.line} — ${r.doc}-v${r.version}, ` +
					`а документ живе в пакеті v${пакет.version}`
				);
			})
			.sort();

		expect(
			stale,
			'посилання веде в пакет, якого вже немає. Застаріле посилання гірше за ' +
				'відсутнє: воно виглядає робочим і мовчки веде в нікуди:\n  ' +
				stale.join('\n  ')
		).toEqual([]);
	});

	it('жодне посилання не називає документа, якого немає в жодному пакеті', () => {
		const відомі = new Set([...CANON_DOCS, ...PRODUCT_DOCS]);
		const unknown = found
			.filter((r) => !відомі.has(r.doc))
			.map((r) => `${r.file}:${r.line} — ${r.doc}-v${r.version}`)
			.sort();

		expect(
			unknown,
			'таких файлів немає ні в інженерному пакеті, ні в продуктовому — або назву ' +
				'переплутано, або переліки відстали від пакетів:\n  ' +
				unknown.join('\n  ')
		).toEqual([]);
	});
});
