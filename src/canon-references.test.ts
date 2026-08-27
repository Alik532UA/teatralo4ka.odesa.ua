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

/** Версія пакета, на якій стоїть проєкт. Міняється разом із переїздом. */
const CANON_VERSION = 8;

/** Документи пакета v8 — 37 файлів, як їх перелічує `canon.json`. */
const CANON_DOCS = new Set([
	'ACCESSIBILITY',
	'AI-AGENT-PITFALLS',
	'AI-PROVIDERS',
	'ANALYTICS',
	'AUTH-FORM',
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
	'FORM-INPUTS',
	'HOLD-SCROLL',
	'HOTKEYS',
	'I18N',
	'INPUT-TOOLS',
	'MINIMAP',
	'NOTIFICATIONS',
	'OBSERVABILITY',
	'PERFORMANCE',
	'PROJECT-STRUCTURE',
	'SCROLLBAR',
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

/** Де шукаємо посилання: код, тести, скрипти й документи в корені. */
const SCAN_DIRS = ['src', 'e2e', 'scripts'];
const SCAN_FILES = ['AGENTS.md', 'README.md'];

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

	it('жодне посилання не веде на попередню версію пакета', () => {
		const stale = found
			.filter((r) => r.version !== CANON_VERSION)
			.map((r) => `${r.file}:${r.line} — ${r.doc}-v${r.version}`)
			.sort();

		expect(
			stale,
			`проєкт стоїть на v${CANON_VERSION}, а ці посилання ведуть у пакет, якого вже ` +
				'немає. Застаріле посилання гірше за відсутнє: воно виглядає робочим ' +
				`і мовчки веде в нікуди:\n  ${stale.join('\n  ')}`
		).toEqual([]);
	});

	it('жодне посилання не називає документа, якого в пакеті немає', () => {
		const unknown = found
			.filter((r) => r.version === CANON_VERSION && !CANON_DOCS.has(r.doc))
			.map((r) => `${r.file}:${r.line} — ${r.doc}-v${r.version}`)
			.sort();

		expect(
			unknown,
			`у пакеті v${CANON_VERSION} таких файлів немає — або назву переплутано, або ` +
				`перелік CANON_DOCS відстав від пакета:\n  ${unknown.join('\n  ')}`
		).toEqual([]);
	});
});
