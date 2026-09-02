// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Посилання на CSS-змінну, якої не існує, — це найтихіший клас дефектів у
 * проєкті (UI-UX-v8 § 1.6). Він не дає ні помилки збірки, ні попередження
 * svelte-check, ні падіння тесту; сторінка рендериться, просто інакше:
 *
 * - `var(--x, #fff)` підставить `#fff` — правильно виглядає у світлій темі
 *   й біло світиться в темній. Саме тому фолбек тут не страховка, а спосіб
 *   заховати помилку від того, хто її зробив;
 * - `var(--x)` без фолбека робить властивість НЕВАЛІДНОЮ на етапі обчислення.
 *   Не «сірий бордер замість блакитного», а `border: 1px solid` без кольору,
 *   тобто рамки немає взагалі.
 *
 * Перевірку додано після того, як скан джерел знайшов 13 неоголошених змінних
 * на 120 посилань — серед них `--color-border` у 57 місцях (редактори адмінки
 * малювалися без рамок) і `--theme-dynamic-card-bg` у 36 (білі картки в
 * темній темі). Оком не було видно жодної: у світлій темі, у якій працюють,
 * усе виглядало як задумано.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати
 * `--color-border` із блоку псевдонімів у `global.css` — перевірка має стати
 * червоною з переліком 57 місць. Зроблено, падає.
 */

/** Файли, з яких збираються ГЛОБАЛЬНІ оголошення: теми і базові стилі. */
const GLOBAL_STYLE_DIRS = ['src/lib/styles', 'src/lib/styles/themes'];

/**
 * Змінні, які оголошує один компонент, а вживає інший — через звичайне
 * успадкування CSS. Це валідний патерн, але саме він міг би приховати
 * справжній промах, тому кожен випадок названий поіменно, а не дозволений
 * класом. Стале посилання тут теж ловиться: якщо оголошення зникне, тест
 * впаде на перевірці самого списку.
 */
const CROSS_COMPONENT: Record<string, { declaredIn: string; why: string }> = {
	'--focus-card-width': {
		declaredIn: 'src/lib/components/ContentWidget.svelte',
		why: 'ширину картки задає віджет-обгортка, читає її ContentCard всередині'
	},
	'--fest-surface': {
		declaredIn: 'src/lib/components/GraduateProfileView.svelte',
		why: 'палітру плашки фестивалів задає та сторінка, де вона стоїть: у картці випускника — стала палітра галактики, на сторінці викладача нічого не ставиться й лишається тема сайту'
	},
	'--fest-border': {
		declaredIn: 'src/lib/components/GraduateProfileView.svelte',
		why: 'палітру плашки фестивалів задає та сторінка, де вона стоїть: у картці випускника — стала палітра галактики, на сторінці викладача нічого не ставиться й лишається тема сайту'
	},
	'--fest-text': {
		declaredIn: 'src/lib/components/GraduateProfileView.svelte',
		why: 'палітру плашки фестивалів задає та сторінка, де вона стоїть: у картці випускника — стала палітра галактики, на сторінці викладача нічого не ставиться й лишається тема сайту'
	},
	'--fest-title': {
		declaredIn: 'src/lib/components/GraduateProfileView.svelte',
		why: 'палітру плашки фестивалів задає та сторінка, де вона стоїть: у картці випускника — стала палітра галактики, на сторінці викладача нічого не ставиться й лишається тема сайту'
	},
	'--fest-muted': {
		declaredIn: 'src/lib/components/GraduateProfileView.svelte',
		why: 'палітру плашки фестивалів задає та сторінка, де вона стоїть: у картці випускника — стала палітра галактики, на сторінці викладача нічого не ставиться й лишається тема сайту'
	},
	'--fest-accent': {
		declaredIn: 'src/lib/components/GraduateProfileView.svelte',
		why: 'палітру плашки фестивалів задає та сторінка, де вона стоїть: у картці випускника — стала палітра галактики, на сторінці викладача нічого не ставиться й лишається тема сайту'
	}
};

function walk(dir: string, keep: (name: string) => boolean, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, keep, out);
		else if (keep(entry.name)) out.push(full);
	}
	return out;
}

/** Оголошення виду `--name:` — і в CSS-файлі, і в `<style>` компонента, і в inline-`style`. */
function declarations(source: string): Set<string> {
	return new Set([...source.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
}

/**
 * Змінні, які ставить скрипт: `style.setProperty('--x', …)`.
 * Для них оголошення в CSS немає й бути не може — значення з'являється
 * у рантаймі, а до того працює фолбек у `var()`.
 */
function runtimeDeclarations(source: string): Set<string> {
	return new Set(
		[...source.matchAll(/setProperty\(\s*[`'"](--[\w-]+)/g)].map((m) => m[1])
	);
}

describe('CSS-змінні', () => {
	const sources = walk('src', (n) => n.endsWith('.svelte') || n.endsWith('.ts'));
	const globalCss = GLOBAL_STYLE_DIRS.flatMap((dir) =>
		readdirSync(dir)
			.filter((f) => f.endsWith('.css'))
			.map((f) => readFileSync(join(dir, f), 'utf8'))
	);

	const declaredGlobally = new Set<string>();
	for (const css of globalCss) for (const name of declarations(css)) declaredGlobally.add(name);

	const declaredAtRuntime = new Set<string>();
	for (const file of sources) {
		for (const name of runtimeDeclarations(readFileSync(file, 'utf8'))) {
			declaredAtRuntime.add(name);
		}
	}

	const references = sources.flatMap((file) =>
		[...readFileSync(file, 'utf8').matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => ({
			file,
			name: m[1]
		}))
	);

	it('знаходить джерела, оголошення й посилання — перевірка жива', () => {
		expect(sources.length).toBeGreaterThan(50);
		expect(globalCss.length).toBe(7);
		expect(declaredGlobally.size).toBeGreaterThan(50);
		expect(references.length).toBeGreaterThan(100);
	});

	it('кожна змінна зі списку крос-компонентних справді десь оголошена', () => {
		const stale: string[] = [];
		for (const [name, { declaredIn }] of Object.entries(CROSS_COMPONENT)) {
			if (!declarations(readFileSync(declaredIn, 'utf8')).has(name)) {
				stale.push(`${name}: у ${declaredIn} оголошення немає — виняток застарів`);
			}
		}
		expect(stale, stale.join('\n')).toEqual([]);
	});

	it('немає посилань на неоголошені CSS-змінні', () => {
		const own = new Map(
			sources.map((f) => [f, declarations(readFileSync(f, 'utf8'))] as const)
		);

		const problems = new Map<string, Set<string>>();
		for (const { file, name } of references) {
			if (declaredGlobally.has(name)) continue;
			if (declaredAtRuntime.has(name)) continue;
			if (own.get(file)!.has(name)) continue;
			if (name in CROSS_COMPONENT) continue;

			if (!problems.has(name)) problems.set(name, new Set());
			problems.get(name)!.add(file);
		}

		const report = [...problems.entries()]
			.map(([name, files]) => `${name} — ${[...files].join(', ')}`)
			.join('\n');

		expect(
			[...problems.keys()],
			`неоголошені змінні (підставиться фолбек або властивість стане невалідною):\n${report}`
		).toEqual([]);
	});
});

/**
 * `light-dark()` з НЕколірним аргументом (UI-UX-v8 § 1.5.1.3,
 * `UIUX-LIGHT-DARK-COLOR-ONLY`).
 *
 * Наслідок той самий, що в перевірки вище — властивість зникає цілком, — але
 * причина інша, і саме тому та перевірка цього не бачила: змінна ОГОЛОШЕНА,
 * просто її значення недійсне там, де її вживають.
 *
 * `light-dark()` — функція КОЛЬОРУ: `light-dark(<color>, <color>)`. Довжина,
 * `url()` чи ціла тінь зі зсувами кольором не є, тож значення недійсне на
 * момент обчислення, і властивість бере початкове. Заміряно в Chrome 148:
 *
 *     box-shadow: light-dark(0 4px 20px #0002, 0 10px 40px #0006)  → none
 *     background-image: light-dark(url(a.webp), url(b.webp))       → none
 *     box-shadow: 0 4px 20px light-dark(#0002, #0006)              → працює
 *
 * ЦІНА ТУТ УЖЕ ЗАПЛАЧЕНА. Коміт `9ef183e` (23.08) перевів пару light/dark на
 * `light-dark()`, і один токен кольором не був: `--shadow-main`, у якого вісім
 * споживачів. Заміряно на teatralo4ka.odesa.ua 26.08 — `box-shadow: none` на
 * обох правилах, присутніх на головній (`.hero__image-inner`,
 * `.hero__contact-btn`), тобто картки майстрів, перемикач вигляду, підвал і
 * герой лишилися без тіні в темі за замовчуванням і в темній.
 *
 * ОСОБЛИВО ПЛУТАЛО ТЕ, ЩО В ЖОВТИХ ТЕМАХ ТІНЬ БУЛА. `themes/yellow.css` і
 * `themes/light-yellow.css` перекривають `--shadow-main` літералом, тобто
 * дефект залежав від обраної теми — і виглядав як «щось із темами», а не як
 * недійсне значення.
 *
 * Мовчання повне: оголошення користувацької змінної приймає будь-які лексеми,
 * тож ні збірка, ні `svelte-check`, ні консоль браузера не кажуть нічого.
 *
 * ЦЕЙ ПРОЄКТ НА VITE 7, І ЦЕ ВАЖЛИВО. Vite 8 віддає CSS Lightning CSS, який
 * знижує `light-dark()` у пару підстановок `--lightningcss-light` /
 * `--lightningcss-dark` — для будь-якого типу значення. Vite 7 (esbuild) не
 * знижує нічого, і заміряно у власному `build/` від 26.08: там лежить рівно
 * `light-dark(0 4px 20px rgba(0, 36, 47, .08), …)`, тобто поїхало відвідувачеві
 * саме так. Сусідній `VetCrewGames` на `vite@^8` із тим самим джерелом цілий —
 * тобто там працездатність тримає версія збірника, а не рішення. Імена
 * `--lightningcss-*` навмисно написані БЕЗ префікса `var(`: перевірка вище
 * сканує й `.ts` і не вирізає коментарів, тож повний запис зробив би цю
 * документацію червоною.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): вписати в
 * `themes/light.css` `--shadow-main: light-dark(4px, 8px)` — перевірка мусить
 * назвати саме цей виклик і саме той файл. Зроблено, падає.
 */

/** Функції, що дають КОЛІР. `url()` тут немає, і це весь зміст переліку. */
const COLOR_FUNCTIONS = new Set([
	'rgb',
	'rgba',
	'hsl',
	'hsla',
	'hwb',
	'lab',
	'lch',
	'oklab',
	'oklch',
	'color',
	'color-mix',
	'light-dark',
	// `var()` пропускається наскрізь: що в ній — знає перевірка вище, ця про форму.
	'var'
]);

/**
 * Текст без коментарів.
 *
 * Обовʼязково: файли тем описують механіку `light-dark()` словами, а тепер ще й
 * причину, чому тінь тримає функцію в колірній позиції. Без цього кроку гейт
 * ловив би власну документацію.
 */
function stripComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** Аргументи кожного `light-dark(...)` — з урахуванням вкладених дужок. */
function lightDarkCalls(text: string): { args: string[]; raw: string }[] {
	const calls: { args: string[]; raw: string }[] = [];
	const needle = 'light-dark(';

	for (let start = text.indexOf(needle); start !== -1; start = text.indexOf(needle, start + 1)) {
		let depth = 0;
		let end = -1;
		for (let i = start + needle.length - 1; i < text.length; i++) {
			if (text[i] === '(') depth++;
			else if (text[i] === ')' && --depth === 0) {
				end = i;
				break;
			}
		}
		// Незбалансовані дужки — не наша перевірка, про них скаже збірка.
		if (end === -1) continue;

		const args: string[] = [];
		let level = 0;
		let current = '';
		for (const ch of text.slice(start + needle.length, end)) {
			if (ch === '(') level++;
			else if (ch === ')') level--;
			if (ch === ',' && level === 0) {
				args.push(current.trim());
				current = '';
				continue;
			}
			current += ch;
		}
		args.push(current.trim());
		calls.push({ args, raw: text.slice(start, end + 1) });
	}
	return calls;
}

function isColor(arg: string): boolean {
	if (arg === '') return false;
	if (/^#[0-9a-fA-F]{3,8}$/.test(arg)) return true;
	// Іменований колір, `transparent`, `currentColor` — самі літери, без одиниць.
	if (/^[a-zA-Z]+$/.test(arg)) return true;

	const open = arg.indexOf('(');
	if (open === -1) return false;
	const name = arg.slice(0, open).trim();
	if (!/^[a-zA-Z-]+$/.test(name) || !COLOR_FUNCTIONS.has(name.toLowerCase())) return false;

	/*
	 * Дужка функції мусить закриватися САМИМ КІНЦЕМ аргумента.
	 *
	 * Без цієї умови `0 4px 20px rgba(0, 36, 47, 0.08)` не пройшло б, а от
	 * `rgba(0, 36, 47, 0.08) 0 4px 20px` — пройшло: жадібний розбір узяв би перше
	 * імʼя функції й вирішив, що це колір. Тобто перевірка мовчала б рівно на
	 * тому дефекті, проти якого стоїть, залежно від порядку слів у значенні.
	 */
	let depth = 0;
	for (let i = open; i < arg.length; i++) {
		if (arg[i] === '(') depth++;
		else if (arg[i] === ')' && --depth === 0) return i === arg.length - 1;
	}
	return false;
}

describe('light-dark() приймає лише колір (UI-UX-v8 § 1.5.1.3)', () => {
	const styleFiles = walk(
		'src',
		(n) => n.endsWith('.css') || n.endsWith('.svelte') || n.endsWith('.html')
	);
	const calls = styleFiles.flatMap((file) =>
		lightDarkCalls(stripComments(readFileSync(file, 'utf8'))).map((call) => ({
			file: file.replace(/\\/g, '/'),
			...call
		}))
	);

	it('перевірка жива: виклики light-dark() знайдено', () => {
		// 15 на момент коміту. Межа нижча за факт, щоб не падати на кожному
		// новому токені, але й не нульова: нуль означав би, що сканер шукає не там.
		expect(
			calls.length,
			'жодного light-dark() у стилях — або сканер шукає не там, або палітру ' +
				'переписали, і тоді цей гейт треба не лагодити, а прибирати'
		).toBeGreaterThan(10);
	});

	it('розбір аргументів живий: колір відрізняється від довжини й url()', () => {
		// Без цього перевірка нижче була б зелена й на завжди-true `isColor`.
		expect(isColor('#005fae')).toBe(true);
		expect(isColor('rgba(0, 36, 47, 0.08)')).toBe(true);
		expect(isColor('color-mix(in srgb, #000000, transparent 10%)')).toBe(true);
		expect(isColor('transparent')).toBe(true);
		expect(isColor('8px'), 'довжина — не колір').toBe(false);
		expect(isColor('url("/images/a.webp")'), 'url() — не колір').toBe(false);
		expect(isColor('0 4px 20px rgba(0, 36, 47, 0.08)'), 'ціла тінь — не колір').toBe(false);
		expect(isColor('rgba(0, 36, 47, 0.08) 0 4px 20px'), 'колір плюс зсуви — не колір').toBe(false);
	});

	it('обидва аргументи кожного виклику — кольори', () => {
		const broken = calls
			.filter((call) => call.args.length !== 2 || !call.args.every(isColor))
			.map((call) => `${call.file}: ${call.raw}`)
			.sort();

		expect(
			broken,
			'неколірний аргумент робить значення недійсним, і властивість зникає ' +
				`ЦІЛКОМ — мовчки, без жодного попередження:\n  ${broken.join('\n  ')}`
		).toEqual([]);
	});
});
