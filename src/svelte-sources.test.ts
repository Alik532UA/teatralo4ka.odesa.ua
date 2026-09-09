// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Три інваріанти по джерелах, яких компілятор не бачить у принципі
 * (SVELTE-CORE-v9: `SC-SNAPSHOT-BOUNDARY`, `SC-SUBSCRIPTION-WIRED`,
 * `SC-LISTENER-CLEANUP`).
 *
 * Спільне в них те, чому вони живуть тут, а не в `svelte-check`: усі три —
 * про ЗВ'ЯЗОК між двома місцями, а не про правильність одного. Проксі й
 * серіалізація, підписка й той, хто її вмикає, слухач і його зняття. Кожне
 * місце окремо бездоганне; помилка — у тому, що другого немає.
 *
 * Джерела читаються БЕЗ коментарів. Це не дрібниця: назва методу, згадана в
 * докблоці сусіда, порахувалася б за виклик, і гейт зеленів би від опису
 * замість коду.
 *
 * ## 1. Проксі стану не перетинає межу серіалізації (`SC-SNAPSHOT-BOUNDARY`)
 *
 * `$state` повертає Proxy. `structuredClone` і `postMessage` виконують
 * structured clone algorithm, і на проксі він кидає `DataCloneError` — тобто
 * падає не там, де оголошено стан, а там, де його передали, і в рантаймі
 * користувача. `$state.snapshot` знімає проксі й дає звичайний об'єкт.
 *
 * Перевіряється саме передача ІМЕНОВАНОГО стану цього ж файлу: `structuredClone`
 * над константою — законна й поширена річ (у панелі налаштувань саме так
 * роблять чернетку з типових значень), і забороняти її було б хибним
 * спрацюванням щодня.
 *
 * `JSON.stringify` у переліку НЕМАЄ навмисно. Канон називає і його, але на
 * проксі він працює: перебір власних властивостей іде крізь пастки, виняток не
 * кидається. У цьому проєкті 60+ місць, де `JSON.stringify(стан)` — це чесне
 * порівняння «змінилося чи ні», і гейт на них перетворив би правило на шум.
 * Зафіксовано як свідоме звуження, а не як недогляд.
 *
 * ## 2. Підписка, яку хтось таки вмикає (`SC-SUBSCRIPTION-WIRED`)
 *
 * Написана й непідключена підписка виглядає точно як відсутня функція: логіка
 * є, покрита тестами, і не виконується ніколи. У цьому проєкті так уже прожив
 * `errorLogger` — саме тому поруч стоїть `orphan-modules.test.ts`. Але той
 * інваріант дивиться на МОДУЛІ, а тут інша одиниця: модуль імпортований, а
 * конкретна `initX` з нього — ні.
 *
 * Зв'язок рахується ТРАНЗИТИВНО в межах модуля, і без цього перевірка була б
 * неправдива: `initAnalytics` ззовні не кличе ніхто, і це правильно — його
 * кличе `trackPageView` того самого файлу, а вже `trackPageView` стоїть у
 * `+layout.svelte`. Перша редакція без транзитивності назвала б це порушенням.
 *
 * ## 3. Слухач має парне зняття (`SC-LISTENER-CLEANUP`)
 *
 * Евристика по файлу, і саме тому вона тут, а не в лінтері: витік на
 * SPA-навігації видно лише як «модуль вішає, ніхто не знімає». Виняток один і
 * названий поіменно.
 *
 * ## Зворотний експеримент (`PIT-REVERSE-EXPERIMENT`)
 *
 * Тимчасово: `structuredClone(colors)` над `$state` у `themeLab.svelte.ts`;
 * зняття `trackPageView` з `+layout.svelte`; `removeEventListener` прибрано з
 * `focusTrap.ts`. Усі три перевірки впали й назвали файл і рядок; після
 * відкоту — зелені.
 */

const КОРІНЬ = 'src';
const СЕРВІСИ = 'src/lib/services/';

const шлях = (p: string) => p.split('\\').join('/');

function обійти(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) обійти(p, out);
		else out.push(шлях(p));
	}
	return out;
}

/** Блокові, HTML- і рядкові коментарі геть. `://` не коментар. */
function безКоментарів(текст: string): string {
	return текст
		.replace(/\/\*[\s\S]*?\*\//g, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/(^|[^:/'"`])\/\/[^\n]*/g, '$1');
}

const джерела = обійти(КОРІНЬ)
	.filter((f) => /\.(svelte|ts)$/.test(f))
	.filter((f) => !/\.(test|spec)\.ts$/.test(f) && !/\.d\.ts$/.test(f))
	.map((f) => ({ файл: f, текст: безКоментарів(readFileSync(f, 'utf8')) }));

const рядок = (текст: string, індекс: number) => текст.slice(0, індекс).split('\n').length;

describe('джерела Svelte (SVELTE-CORE-v9)', () => {
	it('перевірка жива: джерела прочитано й коментарі знято', () => {
		expect(джерела.length, 'жодного джерела — обхід src/ зламався').toBeGreaterThan(100);
		const зРунами = джерела.filter(({ текст }) => текст.includes('$state'));
		expect(зРунами.length, 'у джерелах не знайдено жодного `$state` — розбір зламався').toBeGreaterThan(
			10
		);
		expect(
			безКоментарів('a /* structuredClone(x) */ b // structuredClone(y)\nc'),
			'коментарі не знімаються — цитата в докблоці рахуватиметься за код'
		).not.toMatch(/structuredClone/);
		expect(
			безКоментарів('const u = "https://example.com/a";'),
			'знімач коментарів з’їдає адреси'
		).toContain('example.com/a');
	});

	/** `SC-SNAPSHOT-BOUNDARY` (HIGH). */
	it('проксі $state не перетинає межу серіалізації без $state.snapshot', () => {
		const МЕЖІ = ['structuredClone', 'postMessage'];
		const винні: string[] = [];

		for (const { файл, текст } of джерела) {
			// Імена, оголошені руною стану саме в цьому файлі.
			const стан = new Set<string>();
			for (const m of текст.matchAll(/(?:let|const|var)\s+([A-Za-zА-Яа-яЇїІіЄєҐґ_$][\w$]*)\s*=\s*\$state\b/g))
				стан.add(m[1]);
			// Поля класу: `colors = $state<…>({})`.
			for (const m of текст.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*=\s*\$state\b/gm))
				стан.add(m[1]);
			if (стан.size === 0) continue;

			for (const межа of МЕЖІ) {
				const re = new RegExp(`\\b${межа}\\s*\\(\\s*(this\\.)?([A-Za-zА-Яа-яЇїІіЄєҐґ_$][\\w$]*)`, 'g');
				for (const m of текст.matchAll(re)) {
					if (!стан.has(m[2])) continue;
					// `$state.snapshot(x)` усередині виклику — саме те, що вимагається.
					const хвіст = текст.slice(m.index ?? 0, (m.index ?? 0) + 200);
					if (хвіст.includes('$state.snapshot')) continue;
					винні.push(`${файл}:${рядок(текст, m.index ?? 0)} ${межа}(${m[1] ?? ''}${m[2]})`);
				}
			}
		}

		expect(
			винні,
			'проксі стану в structured clone кидає DataCloneError у браузері ' +
				`відвідувача — обгорнути в \`$state.snapshot()\`:\n${винні.join('\n')}`
		).toEqual([]);
	});

	/** `SC-SUBSCRIPTION-WIRED` (HIGH). */
	it('кожну підписку сервісного шару хтось кличе поза ним', () => {
		const ПІДПИСКА = /^(subscribe|init|watch|listen|start)[A-Z0-9_]?/;

		const ззовні = джерела
			.filter(({ файл }) => !файл.startsWith(СЕРВІСИ))
			.map(({ текст }) => текст)
			.join('\n');
		const кличеЗзовні = (імя: string) =>
			new RegExp(`\\b${імя}\\s*\\(`).test(ззовні) || new RegExp(`\\b${імя}\\b`).test(ззовні);

		const винні: string[] = [];
		for (const { файл, текст } of джерела) {
			if (!файл.startsWith(СЕРВІСИ)) continue;

			const експорти: string[] = [];
			for (const m of текст.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g))
				експорти.push(m[1]);
			for (const m of текст.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/g))
				експорти.push(m[1]);

			const підписки = експорти.filter((n) => ПІДПИСКА.test(n));
			if (підписки.length === 0) continue;

			// Транзитивність у межах модуля: експорт, який кличуть ззовні, тягне за
			// собою сусідів, яких кличе він сам.
			const підключені = new Set(експорти.filter(кличеЗзовні));
			let росте = true;
			while (росте) {
				росте = false;
				for (const імя of експорти) {
					if (підключені.has(імя)) continue;
					if ([...підключені].some((г) => новийВиклик(текст, г, імя))) {
						підключені.add(імя);
						росте = true;
					}
				}
			}

			for (const імя of підписки) {
				if (!підключені.has(імя)) винні.push(`${файл}: \`${імя}\` не кличе ніхто`);
			}
		}

		expect(
			винні,
			'написана й непідключена підписка виглядає як відсутня функція — ' +
				`підключити або видалити:\n${винні.join('\n')}`
		).toEqual([]);
	});

	/** `SC-LISTENER-CLEANUP` (MEDIUM). */
	it('модуль зі слухачем має парне зняття', () => {
		/**
		 * Винятки — поіменно, з причиною. Список має лишатися однорядковим: щойно
		 * в ньому з'явиться п'ятий запис, правило перестане щось означати.
		 */
		const ВИНЯТКИ = new Map([
			[
				'src/lib/controllers/ui.svelte.ts',
				'слухач `prefers-color-scheme` на єдиному контролері-одинаку: він ' +
					'створюється разом із документом і живе рівно стільки ж, тож знімати ' +
					'його нема кому й нема коли'
			]
		]);

		const пари: [RegExp, RegExp, string][] = [
			[/\baddEventListener\s*\(/g, /\bremoveEventListener\s*\(/, 'addEventListener'],
			[/\.observe\s*\(/g, /\.(disconnect|unobserve)\s*\(/, 'observe()'],
			[/\bsetInterval\s*\(/g, /\bclearInterval\s*\(/, 'setInterval']
		];

		const винні: string[] = [];
		for (const { файл, текст } of джерела) {
			if (ВИНЯТКИ.has(файл)) continue;
			for (const [вішає, знімає, назва] of пари) {
				const скільки = (текст.match(вішає) ?? []).length;
				if (скільки > 0 && !знімає.test(текст)) {
					винні.push(`${файл}: ${назва} ×${скільки}, парного зняття немає`);
				}
			}
		}

		expect(
			винні,
			'слухач без зняття тече на SPA-навігації — додати парне зняття або ' +
				`внести у ВИНЯТКИ з причиною:\n${винні.join('\n')}`
		).toEqual([]);
	});
});

/**
 * Чи кличе тіло експорту `господар` сусідній експорт `гість`.
 *
 * Груба, але достатня межа тіла: від оголошення господаря до наступного
 * `export` або кінця файлу. Точний розбір потребував би AST, а помилка тут
 * може бути лише в бік суворості — надто широке тіло зарахує зайвий виклик,
 * і це побачить перша ж перевірка живості сусідніх інваріантів.
 */
function новийВиклик(текст: string, господар: string, гість: string): boolean {
	const початок = new RegExp(`export\\s+(?:async\\s+)?(?:function\\s+|const\\s+)${господар}\\b`).exec(
		текст
	);
	if (!початок) return false;
	const від = початок.index;
	const далі = текст.slice(від + 1).search(/\bexport\s+(?:async\s+)?(?:function|const)\s/);
	const тіло = текст.slice(від, далі === -1 ? текст.length : від + 1 + далі);
	return new RegExp(`\\b${гість}\\s*\\(`).test(тіло);
}
